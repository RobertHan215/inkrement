import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getProviderForModule } from "@/lib/ai";
import { getClassicalGradingPrompt } from "@/lib/ai/prompts/classical-reading";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const SubmitSchema = z.object({
    planId: z.string(),
    answers: z.array(
        z.object({
            questionId: z.number(),
            questionType: z.string(),
            questionText: z.string(),
            referenceAnswer: z.string(),
            studentAnswer: z.string(),
        })
    ),
});

const GradingItemSchema = z.object({
    score: z.number(),
    is_correct: z.boolean(),
    comment: z.string(),
    correct_answer: z.string(),
    key_points: z.array(z.string()),
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

        // 逐题批改
        const results: Array<z.infer<typeof GradingItemSchema> & { questionId: number }> = [];
        let totalScore = 0;

        for (const ans of answers) {
            let grading: z.infer<typeof GradingItemSchema>;
            try {
                const provider = await getProviderForModule("classical_reading");
                const messages = getClassicalGradingPrompt(
                    ans.questionText, ans.studentAnswer, ans.referenceAnswer, ans.questionType
                );
                grading = await provider.structuredChat(messages, GradingItemSchema);
            } catch {
                if (process.env.NODE_ENV === "development") {
                    const isClose = ans.studentAnswer.length > 5;
                    grading = {
                        score: isClose ? 75 : 40,
                        is_correct: isClose,
                        comment: isClose
                            ? "答案基本正确，抓住了关键要点。建议表述可以更加准确完整。"
                            : "答案不够完整，建议重新阅读原文，注意关键字词的含义。",
                        correct_answer: ans.referenceAnswer,
                        key_points: ["理解原文关键字词", "注意句式结构"],
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
                    ? "古文理解能力不错！继续保持！"
                    : avgScore >= 60
                        ? "答题基本正确，部分地方需要再仔细理解原文。"
                        : "建议多读几遍原文，注意重点字词的含义。",
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
                    where: { studentId: user.id, module: "classical_reading", questionContent: `${planId}_q${r.questionId}` },
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
                            module: "classical_reading",
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
