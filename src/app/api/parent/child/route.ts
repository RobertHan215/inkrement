import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/parent/child
 * 家长获取关联孩子的信息 + 学习概览
 */
export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser("parent");

        // 查找关联的孩子
        const links = await prisma.parentChild.findMany({
            where: { parentId: user.id },
            include: {
                student: {
                    select: { id: true, name: true, grade: true, phone: true },
                },
            },
        });

        if (links.length === 0) {
            return NextResponse.json({ child: null, stats: null });
        }

        // 目前只支持一个孩子
        const child = links[0].student;

        // 获取孩子的学习统计
        const completedPlans = await prisma.trainingPlan.findMany({
            where: { studentId: child.id, status: "completed" },
            orderBy: { date: "desc" },
            include: {
                submissions: {
                    orderBy: { version: "desc" },
                    take: 1,
                    select: { score: true, grade: true },
                },
            },
        });

        // 连续打卡
        let streak = 0;
        if (completedPlans.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const uniqueDates = [
                ...new Set(
                    completedPlans.map((p) => {
                        const d = new Date(p.date);
                        d.setHours(0, 0, 0, 0);
                        return d.getTime();
                    })
                ),
            ].sort((a, b) => b - a);

            const todayTime = today.getTime();
            const yesterdayTime = todayTime - 86400000;
            const startIdx = uniqueDates[0] === todayTime ? 0
                : uniqueDates[0] === yesterdayTime ? 0 : -1;

            if (startIdx >= 0) {
                streak = 1;
                for (let i = startIdx; i < uniqueDates.length - 1; i++) {
                    if (uniqueDates[i] - uniqueDates[i + 1] === 86400000) streak++;
                    else break;
                }
            }
        }

        // 本周完成
        const weekStart = new Date();
        weekStart.setHours(0, 0, 0, 0);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weeklyCount = completedPlans.filter(
            (p) => new Date(p.date) >= weekStart
        ).length;

        // 各模块成绩
        const modules = ["chinese_writing", "classical_reading", "english_writing", "english_reading"];
        const byModule: Record<string, { avg: number; max: number; count: number; recent5: number[] }> = {};
        for (const mod of modules) {
            const scores = completedPlans
                .filter((p) => p.module === mod && p.submissions[0]?.score != null)
                .map((p) => p.submissions[0].score!);
            byModule[mod] = scores.length > 0
                ? {
                    avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
                    max: Math.max(...scores),
                    count: scores.length,
                    recent5: scores.slice(0, 5),
                }
                : { avg: 0, max: 0, count: 0, recent5: [] };
        }

        const wrongCount = await prisma.wrongQuestion.count({
            where: { studentId: child.id, status: "active" },
        });

        // 最近 5 条训练记录
        const recentRecords = completedPlans.slice(0, 5).map((r) => ({
            date: r.date.toISOString().slice(0, 10),
            module: r.module,
            score: r.submissions[0]?.score ?? null,
            grade: r.submissions[0]?.grade ?? null,
        }));

        return NextResponse.json({
            child: {
                id: child.id,
                name: child.name,
                grade: child.grade,
            },
            stats: {
                streak,
                weeklyCount,
                totalCompleted: completedPlans.length,
                wrongCount,
                byModule,
            },
            recentRecords,
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
