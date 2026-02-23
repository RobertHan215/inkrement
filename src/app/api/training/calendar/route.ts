import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/training/calendar?month=2026-02
 * 获取指定月份的打卡日历数据
 */
export async function GET(req: NextRequest) {
    try {
        const role =
            (req.nextUrl.searchParams.get("role") as "student" | "parent") ?? "student";
        const user = await getCurrentUser(role);

        // 解析月份参数
        const monthParam = req.nextUrl.searchParams.get("month");
        const now = new Date();
        let year = now.getFullYear();
        let month = now.getMonth(); // 0-indexed

        if (monthParam) {
            const [y, m] = monthParam.split("-").map(Number);
            if (y && m) {
                year = y;
                month = m - 1;
            }
        }

        // 月份起止
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

        // 查询该月所有训练计划
        const plans = await prisma.trainingPlan.findMany({
            where: {
                studentId: user.id,
                date: { gte: monthStart, lte: monthEnd },
            },
            include: {
                submissions: {
                    orderBy: { version: "desc" },
                    take: 1,
                    select: { score: true, grade: true },
                },
            },
            orderBy: { date: "asc" },
        });

        // 按日期分组
        const dayMap: Record<string, { module: string; status: string; score: number | null }[]> = {};

        for (const plan of plans) {
            const dateKey = plan.date.toISOString().slice(0, 10);
            if (!dayMap[dateKey]) dayMap[dateKey] = [];
            dayMap[dateKey].push({
                module: plan.module,
                status: plan.status,
                score: plan.submissions[0]?.score ?? null,
            });
        }

        // 构建日历数据
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const modules = dayMap[dateKey] || [];
            const hasCompleted = modules.some((m) => m.status === "completed");
            days.push({ date: dateKey, modules, hasCompleted });
        }

        return NextResponse.json({
            year,
            month: month + 1,
            days,
            completedCount: days.filter((d) => d.hasCompleted).length,
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
