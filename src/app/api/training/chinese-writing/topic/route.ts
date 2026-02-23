import { getCurrentUser } from "@/lib/auth";
import { getProviderForModule } from "@/lib/ai";
import { getChineseWritingTopicPrompt } from "@/lib/ai/prompts/chinese-writing";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const TopicSchema = z.object({
    title: z.string(),
    type: z.string(),
    description: z.string(),
    requirements: z.string(),
    word_count: z.object({
        min: z.number(),
        max: z.number(),
    }),
});

export type WritingTopic = z.infer<typeof TopicSchema>;

/**
 * POST /api/training/chinese-writing/topic
 * AI 生成今日写作题目（带每日缓存）
 */
export async function POST(req: NextRequest) {
    try {
        const role =
            (req.nextUrl.searchParams.get("role") as "student") ?? "student";
        const user = await getCurrentUser(role);
        const grade = user.grade || "预初";

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const MODULE = "chinese_writing";

        // 1. 查找或创建今日计划
        let plan = await prisma.trainingPlan.findUnique({
            where: {
                studentId_date_module: {
                    studentId: user.id, date: today, module: MODULE,
                },
            },
        });

        if (!plan) {
            plan = await prisma.trainingPlan.create({
                data: { studentId: user.id, date: today, module: MODULE, status: "pending" },
            });
        }

        // 2. 有缓存 → 直接返回
        if (plan.aiContent) {
            try {
                const cached = JSON.parse(plan.aiContent);
                return NextResponse.json({ topic: cached, cached: true });
            } catch {
                // 缓存损坏，重新生成
            }
        }

        // 3. 调用 AI 生成
        const provider = await getProviderForModule(MODULE);
        const messages = getChineseWritingTopicPrompt(grade);
        const topic = await provider.structuredChat(messages, TopicSchema);

        // 4. 存入 DB 缓存
        await prisma.trainingPlan.update({
            where: { id: plan.id },
            data: { aiContent: JSON.stringify(topic) },
        });

        return NextResponse.json({ topic });
    } catch (error) {
        console.error("[chinese-writing/topic] AI error:", error);
        if (process.env.NODE_ENV === "development") {
            return NextResponse.json({
                topic: {
                    title: "我最难忘的一件事",
                    type: "记叙文",
                    description:
                        "请回忆一件令你印象深刻的事情，可以是开心的、感动的、或者让你学到东西的经历。用具体的细节描写当时的场景和你的感受。",
                    requirements:
                        "1. 事件要有完整的起因、经过、结果\n2. 要有具体的细节描写（环境、人物、对话等）\n3. 结尾要表达你的感悟或收获",
                    word_count: { min: 300, max: 500 },
                },
                fallback: true,
            });
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : "AI service error" },
            { status: 500 }
        );
    }
}
