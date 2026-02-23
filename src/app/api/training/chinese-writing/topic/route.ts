import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getProviderForModule } from "@/lib/ai";
import { getChineseWritingTopicPrompt } from "@/lib/ai/prompts/chinese-writing";
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
 * AI 生成今日写作题目
 */
export async function POST(req: NextRequest) {
    try {
        const role =
            (req.nextUrl.searchParams.get("role") as "student") ?? "student";
        const user = await getCurrentUser(role);
        const grade = user.grade || "预初";

        const provider = await getProviderForModule("chinese_writing");
        const messages = getChineseWritingTopicPrompt(grade);
        const topic = await provider.structuredChat(messages, TopicSchema);

        return NextResponse.json({ topic });
    } catch (error) {
        // 如果 AI 调用失败，返回一个默认题目（开发模式降级）
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
