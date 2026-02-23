import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getProviderForModule } from "@/lib/ai";
import { getEnglishWritingGradingPrompt } from "@/lib/ai/prompts/english-writing";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const SubmitSchema = z.object({
    planId: z.string(),
    content: z.string().min(1),
    topicTitle: z.string(),
});

const GradingSchema = z.object({
    total_score: z.number(),
    grade: z.string(),
    summary: z.string(),
    dimensions: z.array(
        z.object({ name: z.string(), score: z.number(), comment: z.string() })
    ),
    grammar_errors: z.array(
        z.object({ original: z.string(), corrected: z.string(), rule: z.string() })
    ),
    suggestions: z.array(z.string()),
    rewrite_example: z.string(),
});

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser("student");
        const body = await req.json();
        const { planId, content, topicTitle } = SubmitSchema.parse(body);

        const plan = await prisma.trainingPlan.findUnique({ where: { id: planId } });
        if (!plan || plan.studentId !== user.id) {
            return NextResponse.json({ error: "Invalid plan" }, { status: 403 });
        }

        const latestSubmission = await prisma.submission.findFirst({
            where: { planId },
            orderBy: { version: "desc" },
        });
        const version = (latestSubmission?.version ?? 0) + 1;

        let feedback: z.infer<typeof GradingSchema>;
        try {
            const provider = await getProviderForModule("english_writing");
            const messages = getEnglishWritingGradingPrompt(topicTitle, content, user.grade || "预初");
            feedback = await provider.structuredChat(messages, GradingSchema);
        } catch {
            if (process.env.NODE_ENV === "development") {
                feedback = {
                    total_score: 78,
                    grade: "B",
                    summary: "文章整体不错！内容切题，表达较为清晰。注意一些语法细节可以让你的作文更出色。",
                    dimensions: [
                        { name: "内容与切题", score: 82, comment: "内容紧扣主题，描述较为具体。可以多加一些个人感受。" },
                        { name: "语法与准确性", score: 72, comment: "存在一些语法错误，特别是时态和主谓一致方面需要注意。" },
                        { name: "词汇与表达", score: 78, comment: "词汇使用基本正确，建议尝试使用更多高级词汇和短语。" },
                        { name: "结构与连贯", score: 80, comment: "段落结构清晰，建议多使用连接词让文章更顺畅。" },
                    ],
                    grammar_errors: [
                        { original: "He go to school", corrected: "He goes to school", rule: "第三人称单数现在时需要加-s" },
                        { original: "I am play", corrected: "I am playing", rule: "现在进行时用 be + doing" },
                    ],
                    suggestions: [
                        "多使用连接词如 however, moreover, in addition 等",
                        "注意第三人称单数动词加 -s",
                        "结尾段可以总结全文观点，给读者留下深刻印象",
                    ],
                    rewrite_example:
                        "My best friend Tom is a kind and humorous boy. We have been friends since primary school. We enjoy playing basketball together after class. What I appreciate most about him is his positive attitude towards life.",
                };
            } else {
                throw new Error("AI grading failed");
            }
        }

        const submission = await prisma.submission.create({
            data: { planId, studentId: user.id, content, score: feedback.total_score, grade: feedback.grade, feedback: JSON.stringify(feedback), version },
        });

        await prisma.trainingPlan.update({ where: { id: planId }, data: { status: "completed" } });

        return NextResponse.json({ submission: { id: submission.id, version, score: submission.score, grade: submission.grade }, feedback });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}
