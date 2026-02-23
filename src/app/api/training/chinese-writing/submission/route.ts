import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/training/chinese-writing/submission?id=xxx
 * 获取提交详情和批改结果
 */
export async function GET(req: NextRequest) {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
        return NextResponse.json({ error: "Missing submission id" }, { status: 400 });
    }

    try {
        const submission = await prisma.submission.findUnique({
            where: { id },
            include: {
                plan: true,
            },
        });

        if (!submission) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        // 获取该 plan 的所有版本
        const allVersions = await prisma.submission.findMany({
            where: { planId: submission.planId },
            orderBy: { version: "desc" },
            select: {
                id: true,
                version: true,
                score: true,
                grade: true,
                createdAt: true,
            },
        });

        return NextResponse.json({
            submission: {
                id: submission.id,
                content: submission.content,
                score: submission.score,
                grade: submission.grade,
                version: submission.version,
                createdAt: submission.createdAt.toISOString(),
            },
            feedback: submission.feedback ? JSON.parse(submission.feedback) : null,
            plan: {
                id: submission.plan.id,
                module: submission.plan.module,
                date: submission.plan.date.toISOString(),
            },
            versions: allVersions,
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
