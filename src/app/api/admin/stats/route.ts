import { getCurrentUser, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/stats
 * 管理后台概览统计
 */
export async function GET(req: NextRequest) {
    try {
        const role =
            (req.nextUrl.searchParams.get("role") as "admin") ?? "admin";
        const user = await getCurrentUser(role);
        requireRole(user, "admin");

        const [totalStudents, totalPlans, totalCompleted, totalTexts] = await Promise.all([
            prisma.user.count({ where: { role: "student" } }),
            prisma.trainingPlan.count(),
            prisma.trainingPlan.count({ where: { status: "completed" } }),
            prisma.classicText.count(),
        ]);

        return NextResponse.json({ totalStudents, totalPlans, totalCompleted, totalTexts });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
