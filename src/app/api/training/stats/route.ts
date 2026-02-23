import { getCurrentUser, getStudentId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/training/stats
 * 获取学习统计：连续打卡天数 + 本周完成数 + 各模块成绩
 */
export async function GET(req: NextRequest) {
    try {
        const role =
            (req.nextUrl.searchParams.get("role") as "student" | "parent") ?? "student";
        const user = await getCurrentUser(role);

        const studentId = await getStudentId(user);

        // 1. 获取所有已完成的训练计划
        const completedPlans = await prisma.trainingPlan.findMany({
            where: { studentId, status: "completed" },
            orderBy: { date: "desc" },
            include: {
                submissions: {
                    orderBy: { version: "desc" },
                    take: 1,
                    select: { score: true, grade: true },
                },
            },
        });

        // 2. 计算连续打卡天数
        let streak = 0;
        if (completedPlans.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 按日期去重（一天可能有多个模块）
            const uniqueDates = [
                ...new Set(
                    completedPlans.map((p) => {
                        const d = new Date(p.date);
                        d.setHours(0, 0, 0, 0);
                        return d.getTime();
                    })
                ),
            ].sort((a, b) => b - a); // 降序

            // 从今天或昨天开始计算
            const todayTime = today.getTime();
            const yesterdayTime = todayTime - 86400000;
            const startIdx = uniqueDates[0] === todayTime ? 0
                : uniqueDates[0] === yesterdayTime ? 0
                    : -1;

            if (startIdx >= 0) {
                streak = 1;
                for (let i = startIdx; i < uniqueDates.length - 1; i++) {
                    const diff = uniqueDates[i] - uniqueDates[i + 1];
                    if (diff === 86400000) {
                        streak++;
                    } else {
                        break;
                    }
                }
            }
        }

        // 3. 本周完成数
        const weekStart = new Date();
        weekStart.setHours(0, 0, 0, 0);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // 周日为起点
        const weeklyCount = completedPlans.filter(
            (p) => new Date(p.date) >= weekStart
        ).length;

        // 4. 各模块成绩统计
        const modules = ["chinese_writing", "classical_reading", "english_writing", "english_reading"];
        const byModule: Record<string, { avg: number; max: number; count: number; recent5: number[] }> = {};

        for (const mod of modules) {
            const modPlans = completedPlans
                .filter((p) => p.module === mod && p.submissions[0]?.score != null)
                .map((p) => p.submissions[0].score!);

            if (modPlans.length > 0) {
                byModule[mod] = {
                    avg: Math.round(modPlans.reduce((a, b) => a + b, 0) / modPlans.length),
                    max: Math.max(...modPlans),
                    count: modPlans.length,
                    recent5: modPlans.slice(0, 5),
                };
            } else {
                byModule[mod] = { avg: 0, max: 0, count: 0, recent5: [] };
            }
        }

        // 5. 错题待复习数
        const wrongCount = await prisma.wrongQuestion.count({
            where: { studentId, status: "active" },
        });

        return NextResponse.json({
            streak,
            weeklyCount,
            totalCompleted: completedPlans.length,
            wrongCount,
            byModule,
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
