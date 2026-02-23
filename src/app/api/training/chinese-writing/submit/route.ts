import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getProviderForModule } from "@/lib/ai";
import { getChineseWritingGradingPrompt } from "@/lib/ai/prompts/chinese-writing";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const SubmitSchema = z.object({
    planId: z.string(),
    content: z.string().min(1, "作文内容不能为空"),
    topicTitle: z.string(),
});

const GradingResultSchema = z.object({
    total_score: z.number(),
    grade: z.string(),
    summary: z.string(),
    dimensions: z.array(
        z.object({
            name: z.string(),
            score: z.number(),
            comment: z.string(),
        })
    ),
    suggestions: z.array(z.string()),
    rewrite_example: z.string(),
});

export type GradingResult = z.infer<typeof GradingResultSchema>;

/**
 * POST /api/training/chinese-writing/submit
 * 提交作文 + AI 批改
 */
export async function POST(req: NextRequest) {
    try {
        const role =
            (req.nextUrl.searchParams.get("role") as "student") ?? "student";
        const user = await getCurrentUser(role);

        const body = await req.json();
        const { planId, content, topicTitle } = SubmitSchema.parse(body);

        // 确认 plan 属于当前用户
        const plan = await prisma.trainingPlan.findUnique({
            where: { id: planId },
        });

        if (!plan || plan.studentId !== user.id) {
            return NextResponse.json({ error: "Invalid plan" }, { status: 403 });
        }

        // 计算版本号
        const latestSubmission = await prisma.submission.findFirst({
            where: { planId },
            orderBy: { version: "desc" },
        });
        const version = (latestSubmission?.version ?? 0) + 1;

        // AI 批改
        let feedback: GradingResult;
        try {
            const provider = await getProviderForModule("chinese_writing");
            const messages = getChineseWritingGradingPrompt(
                topicTitle,
                content,
                user.grade || "预初"
            );
            feedback = await provider.structuredChat(messages, GradingResultSchema);
        } catch {
            // 开发模式降级：返回模拟批改结果
            if (process.env.NODE_ENV === "development") {
                feedback = {
                    total_score: 82,
                    grade: "B",
                    summary: "作文整体不错，内容真实感人，结构也比较完整。继续加油！",
                    dimensions: [
                        { name: "内容与立意", score: 85, comment: "选材贴近生活，情感真实，立意明确。可以尝试更深层次的思考。" },
                        { name: "结构与逻辑", score: 80, comment: "段落划分合理，开头结尾呼应。中间过渡可以更自然一些。" },
                        { name: "语言表达", score: 82, comment: "语言通顺流畅，有一些好的词句运用。可以多使用一些修辞手法。" },
                        { name: "字词运用", score: 80, comment: "用词基本准确，注意个别字词的规范书写。" },
                    ],
                    suggestions: [
                        "开头可以尝试用场景描写或对话来引入，更有代入感",
                        "多运用比喻、拟人等修辞手法让文章更生动",
                        "结尾的感悟可以再深入一些，不要泛泛而谈",
                    ],
                    rewrite_example:
                        '例如原文"那天天气很好"可以改为"阳光透过树叶的缝隙，在地上洒下斑驳的光影，微风轻轻拂过脸颊，带来一阵淡淡的花香。"',
                };
            } else {
                throw new Error("AI grading failed");
            }
        }

        // 保存提交记录
        const submission = await prisma.submission.create({
            data: {
                planId,
                studentId: user.id,
                content,
                score: feedback.total_score,
                grade: feedback.grade,
                feedback: JSON.stringify(feedback),
                version,
            },
        });

        // 更新计划状态
        await prisma.trainingPlan.update({
            where: { id: planId },
            data: { status: "completed" },
        });

        return NextResponse.json({
            submission: {
                id: submission.id,
                version: submission.version,
                score: submission.score,
                grade: submission.grade,
            },
            feedback,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid input", details: error.issues },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
