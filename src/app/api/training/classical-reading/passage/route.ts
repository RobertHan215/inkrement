import { getCurrentUser } from "@/lib/auth";
import { getProviderForModule } from "@/lib/ai";
import { getClassicalReadingPrompt } from "@/lib/ai/prompts/classical-reading";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const PassageSchema = z.object({
    title: z.string(),
    author: z.string(),
    dynasty: z.string(),
    original_text: z.string(),
    annotations: z.array(z.object({ word: z.string(), meaning: z.string() })),
    questions: z.array(
        z.object({
            id: z.number(),
            type: z.string(),
            question: z.string(),
            answer: z.string(),
            analysis: z.string(),
        })
    ),
});

export type ClassicalPassage = z.infer<typeof PassageSchema>;

/**
 * POST /api/training/classical-reading/passage
 * AI 生成古文阅读篇目 + 题目（带每日缓存）
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser("student");
        const grade = user.grade || "预初";

        // 1. 查找今日计划，检查是否有缓存
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const plan = await prisma.trainingPlan.findUnique({
            where: {
                studentId_date_module: {
                    studentId: user.id,
                    date: today,
                    module: "classical_reading",
                },
            },
        });

        // 2. 有缓存 → 直接返回
        if (plan?.aiContent) {
            try {
                const cached = JSON.parse(plan.aiContent);
                return NextResponse.json({ passage: cached, cached: true });
            } catch {
                // 缓存解析失败，继续走 AI 生成
            }
        }

        // 3. 调用 AI 生成
        const provider = await getProviderForModule("classical_reading");
        const messages = getClassicalReadingPrompt(grade);
        const passage = await provider.structuredChat(messages, PassageSchema);

        // 4. 存入 DB 缓存
        if (plan) {
            await prisma.trainingPlan.update({
                where: { id: plan.id },
                data: { aiContent: JSON.stringify(passage) },
            });
        }

        return NextResponse.json({ passage });
    } catch (error) {
        console.error("[classical-reading/passage] AI error:", error);
        if (process.env.NODE_ENV === "development") {
            return NextResponse.json({
                passage: {
                    title: "陋室铭",
                    author: "刘禹锡",
                    dynasty: "唐",
                    original_text:
                        "山不在高，有仙则名。水不在深，有龙则灵。斯是陋室，惟吾德馨。苔痕上阶绿，草色入帘青。谈笑有鸿儒，往来无白丁。可以调素琴，阅金经。无丝竹之乱耳，无案牍之劳形。南阳诸葛庐，西蜀子云亭。孔子云：何陋之有？",
                    annotations: [
                        { word: "名", meaning: "出名，著名（名词用作动词）" },
                        { word: "灵", meaning: "灵验，神奇" },
                        { word: "德馨", meaning: "品德高尚" },
                        { word: "鸿儒", meaning: "博学的人" },
                        { word: "白丁", meaning: "没有学问的人" },
                        { word: "案牍", meaning: "官府的文书" },
                    ],
                    questions: [
                        {
                            id: 1,
                            type: "word_explain",
                            question: '解释"斯是陋室，惟吾德馨"中"馨"的含义。',
                            answer: "馨：散布很远的香气，这里指品德高尚。",
                            analysis:
                                '"馨"的本义是香气，在这里是比喻义，用来形容品德的高尚，就像香气一样让人感到美好。',
                        },
                        {
                            id: 2,
                            type: "sentence_translate",
                            question: '翻译"苔痕上阶绿，草色入帘青。"',
                            answer:
                                "苔藓的痕迹蔓延到台阶上，使台阶变绿了；草的颜色映入门帘，使门帘也显得青翠。",
                            analysis:
                                '注意"上"和"入"是动词，表示苔痕向上蔓延、草色映入的动态之美。',
                        },
                        {
                            id: 3,
                            type: "comprehension",
                            question: "作者用哪些方面来描写陋室的不陋？请结合原文简要分析。",
                            answer:
                                '作者从三个方面描写陋室的不陋：一是自然环境优美（"苔痕上阶绿，草色入帘青"）；二是交往之人高雅（"谈笑有鸿儒，往来无白丁"）；三是生活情趣高雅（"可以调素琴，阅金经"）。',
                            analysis:
                                "这道题考查对文章内容的理解和概括能力。需要注意从环境、人物、活动三个方面进行归纳。",
                        },
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
