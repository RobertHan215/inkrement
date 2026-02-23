import { getCurrentUser } from "@/lib/auth";
import { getProviderForModule } from "@/lib/ai";
import { getEnglishReadingPrompt } from "@/lib/ai/prompts/english-reading";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const PassageSchema = z.object({
    title: z.string(),
    topic: z.string(),
    passage: z.string(),
    word_count: z.number(),
    questions: z.array(
        z.object({
            id: z.number(),
            type: z.string(),
            question: z.string(),
            options: z.array(z.string()).optional(),
            answer: z.string(),
            analysis: z.string(),
            evidence: z.string(),
        })
    ),
    vocabulary: z.array(
        z.object({
            word: z.string(),
            phonetic: z.string(),
            meaning: z.string(),
            example: z.string(),
        })
    ),
});

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser("student");
        const grade = user.grade || "预初";

        const provider = await getProviderForModule("english_reading");
        const messages = getEnglishReadingPrompt(grade);
        const passage = await provider.structuredChat(messages, PassageSchema);

        return NextResponse.json({ passage });
    } catch {
        if (process.env.NODE_ENV === "development") {
            return NextResponse.json({
                passage: {
                    title: "A Special School Garden",
                    topic: "campus",
                    passage:
                        "Last spring, our school decided to create a garden behind the library. At first, many students didn't think it was a good idea. \"We don't know anything about gardening,\" said my classmate Li Ming. But our science teacher, Ms. Wang, encouraged us to try.\n\nWe started by clearing the land and planting some vegetables and flowers. Every week, different classes took turns watering the plants and pulling weeds. Slowly, we saw tiny green shoots coming out of the soil.\n\nBy summer, our garden was full of tomatoes, cucumbers, and beautiful sunflowers. We were all amazed! The best part was that we used the vegetables in our school cafeteria. Everyone agreed that the food tasted better because we grew it ourselves.\n\nNow, the garden has become the most popular place in our school. Students love to sit there during breaks, reading books or chatting with friends. Ms. Wang says we learned more from the garden than from any textbook.",
                    word_count: 165,
                    questions: [
                        { id: 1, type: "multiple_choice", question: "Where was the school garden created?", options: ["A. In front of the school", "B. Behind the library", "C. Next to the playground", "D. On the rooftop"], answer: "B", analysis: "根据第一段 \"create a garden behind the library\" 可以找到答案。", evidence: "our school decided to create a garden behind the library" },
                        { id: 2, type: "multiple_choice", question: "How did Li Ming feel about the garden plan at first?", options: ["A. Excited", "B. Happy", "C. Doubtful", "D. Angry"], answer: "C", analysis: "Li Ming 说 \"We don't know anything about gardening\"，表明他对此持怀疑态度。", evidence: "We don't know anything about gardening" },
                        { id: 3, type: "multiple_choice", question: "What did the students grow in the garden?", options: ["A. Only flowers", "B. Only vegetables", "C. Vegetables and flowers", "D. Fruits and flowers"], answer: "C", analysis: "文中提到 \"planting some vegetables and flowers\"。", evidence: "planting some vegetables and flowers" },
                        { id: 4, type: "fill_blank", question: "The vegetables from the garden were used in the school _____.", answer: "cafeteria", analysis: "根据原文 \"we used the vegetables in our school cafeteria\"。", evidence: "we used the vegetables in our school cafeteria" },
                        { id: 5, type: "multiple_choice", question: "According to Ms. Wang, what is the main benefit of the garden?", options: ["A. It saves money", "B. It makes food taste better", "C. It teaches more than textbooks", "D. It makes the school beautiful"], answer: "C", analysis: "最后一句 Ms. Wang 说 \"we learned more from the garden than from any textbook\"。", evidence: "we learned more from the garden than from any textbook" },
                    ],
                    vocabulary: [
                        { word: "encourage", phonetic: "/ɪnˈkɜːrɪdʒ/", meaning: "鼓励", example: "The teacher encouraged us to try new things." },
                        { word: "amazed", phonetic: "/əˈmeɪzd/", meaning: "惊讶的", example: "We were amazed by the beautiful sunset." },
                        { word: "popular", phonetic: "/ˈpɒpjʊlər/", meaning: "受欢迎的", example: "This game is very popular among students." },
                    ],
                },
                fallback: true,
            });
        }
        return NextResponse.json({ error: "AI service error" }, { status: 500 });
    }
}
