import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getProviderForModule } from "@/lib/ai";
import { getEnglishReadingGradingPrompt } from "@/lib/ai/prompts/english-reading";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const SubmitSchema = z.object({
    planId: z.string(),
    answers: z.array(
        z.object({
            questionId: z.number(),
            questionType: z.string(),
            questionText: z.string(),
            correctAnswer: z.string(),
            studentAnswer: z.string(),
        })
    ),
});

const GradingItemSchema = z.object({
    score: z.number(),
    is_correct: z.boolean(),
    comment: z.string(),
    correct_answer: z.string(),
    explanation: z.string(),
});

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser("student");
        const body = await req.json();
        const { planId, answers } = SubmitSchema.parse(body);

        const plan = await prisma.trainingPlan.findUnique({ where: { id: planId } });
        if (!plan || plan.studentId !== user.id) {
            return NextResponse.json({ error: "Invalid plan" }, { status: 403 });
        }

        const latestSubmission = await prisma.submission.findFirst({
            where: { planId },
            orderBy: { version: "desc" },
        });
        const version = (latestSubmission?.version ?? 0) + 1;

        const results: Array<z.infer<typeof GradingItemSchema> & { questionId: number }> = [];
        let totalScore = 0;

        for (const ans of answers) {
            let grading: z.infer<typeof GradingItemSchema>;
            try {
                const provider = await getProviderForModule("english_reading");
                const messages = getEnglishReadingGradingPrompt(
                    ans.questionText, ans.studentAnswer, ans.correctAnswer, ans.questionType
                );
                grading = await provider.structuredChat(messages, GradingItemSchema);
            } catch {
                if (process.env.NODE_ENV === "development") {
                    const isCorrect =
                        ans.studentAnswer.trim().toLowerCase() === ans.correctAnswer.trim().toLowerCase();
                    grading = {
                        score: isCorrect ? 100 : 0,
                        is_correct: isCorrect,
                        comment: isCorrect ? "回答正确！很棒！" : "答案不正确，请仔细阅读原文相关段落。",
                        correct_answer: ans.correctAnswer,
                        explanation: isCorrect ? "你准确找到了原文对应的信息。" : "建议重新阅读原文，注意关键词和细节。",
                    };
                } else {
                    throw new Error("AI grading failed");
                }
            }
            results.push({ ...grading, questionId: ans.questionId });
            totalScore += grading.score;
        }

        const avgScore = Math.round(totalScore / answers.length);
        const grade = avgScore >= 90 ? "A" : avgScore >= 75 ? "B" : avgScore >= 60 ? "C" : "D";

        const feedback = {
            total_score: avgScore,
            grade,
            results,
            summary:
                avgScore >= 80
                    ? "Great job on reading comprehension! Keep it up! 阅读理解做得很好，继续加油！"
                    : avgScore >= 60
                        ? "Not bad! Review the passage carefully for clues. 不错，注意从原文中寻找线索。"
                        : "Keep practicing! Re-read the passage slowly. 继续努力，尝试慢慢精读文章。",
        };

        const submission = await prisma.submission.create({
            data: {
                planId,
                studentId: user.id,
                content: JSON.stringify(answers.map((a) => ({ q: a.questionId, a: a.studentAnswer }))),
                score: avgScore,
                grade,
                feedback: JSON.stringify(feedback),
                version,
            },
        });

        // 记录错题
        for (const r of results) {
            if (!r.is_correct) {
                const ansData = answers.find((a) => a.questionId === r.questionId);
                const existing = await prisma.wrongQuestion.findFirst({
                    where: { studentId: user.id, module: "english_reading", questionContent: `${planId}_q${r.questionId}` },
                });
                if (existing) {
                    await prisma.wrongQuestion.update({
                        where: { id: existing.id },
                        data: { errorCount: { increment: 1 }, consecutiveCorrect: 0, status: "active" },
                    });
                } else {
                    await prisma.wrongQuestion.create({
                        data: {
                            studentId: user.id,
                            module: "english_reading",
                            questionContent: JSON.stringify(ansData),
                            correctAnswer: r.correct_answer,
                            studentAnswer: ansData?.studentAnswer || "",
                            status: "active",
                        },
                    });
                }
            }
        }

        await prisma.trainingPlan.update({ where: { id: planId }, data: { status: "completed" } });

        return NextResponse.json({
            submission: { id: submission.id, version, score: avgScore, grade },
            feedback,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}
