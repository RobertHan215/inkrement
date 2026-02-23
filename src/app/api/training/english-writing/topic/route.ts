import { getCurrentUser } from "@/lib/auth";
import { getProviderForModule } from "@/lib/ai";
import { getEnglishWritingTopicPrompt } from "@/lib/ai/prompts/english-writing";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const TopicSchema = z.object({
    title: z.string(),
    title_cn: z.string(),
    type: z.string(),
    description: z.string(),
    description_cn: z.string(),
    requirements: z.string(),
    word_count: z.object({ min: z.number(), max: z.number() }),
    useful_expressions: z.array(z.string()),
});

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser("student");
        const grade = user.grade || "预初";

        const provider = await getProviderForModule("english_writing");
        const messages = getEnglishWritingTopicPrompt(grade);
        const topic = await provider.structuredChat(messages, TopicSchema);

        return NextResponse.json({ topic });
    } catch {
        if (process.env.NODE_ENV === "development") {
            return NextResponse.json({
                topic: {
                    title: "My Best Friend",
                    title_cn: "我最好的朋友",
                    type: "narrative",
                    description:
                        "Write about your best friend. Describe what they look like, what you like to do together, and why they are important to you.",
                    description_cn:
                        "写一篇关于你最好的朋友的文章。描述他们的外貌，你们喜欢一起做什么，以及为什么他们对你很重要。",
                    requirements:
                        "1. Include at least 3 descriptive adjectives\n2. Use at least 2 different tenses\n3. End with a conclusion about friendship",
                    word_count: { min: 80, max: 120 },
                    useful_expressions: [
                        "be fond of",
                        "get along well with",
                        "have ... in common",
                    ],
                },
                fallback: true,
            });
        }

        return NextResponse.json(
            { error: "AI service error" },
            { status: 500 }
        );
    }
}
