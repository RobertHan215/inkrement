import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// 每日模块轮换：按星期几分配
const MODULE_SCHEDULE: Record<number, string> = {
    0: "chinese_writing",    // 周日
    1: "chinese_writing",    // 周一
    2: "classical_reading",  // 周二
    3: "english_writing",    // 周三
    4: "english_reading",    // 周四
    5: "chinese_writing",    // 周五
    6: "classical_reading",  // 周六
};

/**
 * GET /api/training/today
 * 获取今日训练任务（每日一练），如不存在则自动创建
 */
export async function GET(req: NextRequest) {
    try {
        const role =
            (req.nextUrl.searchParams.get("role") as "student" | "parent" | "admin") ??
            "student";
        const user = await getCurrentUser(role);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dayOfWeek = today.getDay();
        const module = MODULE_SCHEDULE[dayOfWeek] || "chinese_writing";

        // 查找或创建今日任务
        let plan = await prisma.trainingPlan.findUnique({
            where: {
                studentId_date_module: {
                    studentId: user.id,
                    date: today,
                    module,
                },
            },
            include: {
                submissions: {
                    orderBy: { version: "desc" },
                    take: 1,
                },
            },
        });

        if (!plan) {
            plan = await prisma.trainingPlan.create({
                data: {
                    studentId: user.id,
                    date: today,
                    module,
                    status: "pending",
                },
                include: {
                    submissions: {
                        orderBy: { version: "desc" },
                        take: 1,
                    },
                },
            });
        }

        return NextResponse.json({
            plan: {
                id: plan.id,
                module: plan.module,
                status: plan.status,
                date: plan.date.toISOString(),
                latestSubmission: plan.submissions[0] ?? null,
            },
            user: {
                id: user.id,
                name: user.name,
                grade: user.grade,
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
