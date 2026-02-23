import { getCurrentUser, getStudentId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/training/history?page=1&module=all&pageSize=10
 * 分页获取历史训练记录
 */
export async function GET(req: NextRequest) {
    try {
        const role =
            (req.nextUrl.searchParams.get("role") as "student" | "parent") ?? "student";
        const user = await getCurrentUser(role);

        const page = Math.max(1, Number(req.nextUrl.searchParams.get("page")) || 1);
        const pageSize = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("pageSize")) || 10));
        const moduleFilter = req.nextUrl.searchParams.get("module") || "all";
        const studentId = await getStudentId(user);

        const where: Record<string, unknown> = {
            studentId,
            status: "completed",
        };
        if (moduleFilter !== "all") {
            where.module = moduleFilter;
        }

        const [records, total] = await Promise.all([
            prisma.trainingPlan.findMany({
                where,
                orderBy: { date: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    submissions: {
                        orderBy: { version: "desc" },
                        take: 1,
                        select: { id: true, score: true, grade: true, createdAt: true },
                    },
                },
            }),
            prisma.trainingPlan.count({ where }),
        ]);

        return NextResponse.json({
            records: records.map((r) => ({
                planId: r.id,
                date: r.date.toISOString().slice(0, 10),
                module: r.module,
                status: r.status,
                score: r.submissions[0]?.score ?? null,
                grade: r.submissions[0]?.grade ?? null,
                submissionId: r.submissions[0]?.id ?? null,
                submittedAt: r.submissions[0]?.createdAt ?? null,
            })),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
