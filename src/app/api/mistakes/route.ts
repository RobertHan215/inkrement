import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/mistakes
 * 获取错题列表，支持按模块筛选
 */
export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser("student");
        const { searchParams } = new URL(req.url);
        const module = searchParams.get("module");
        const status = searchParams.get("status") || "active";

        const where: Record<string, unknown> = {
            studentId: user.id,
            status,
        };
        if (module) where.module = module;

        const mistakes = await prisma.wrongQuestion.findMany({
            where,
            orderBy: { updatedAt: "desc" },
            take: 50,
        });

        // 统计各模块错题数
        const stats = await prisma.wrongQuestion.groupBy({
            by: ["module"],
            where: { studentId: user.id, status: "active" },
            _count: { id: true },
        });

        return NextResponse.json({
            mistakes: mistakes.map((m) => ({
                ...m,
                questionContent: safeJsonParse(m.questionContent),
            })),
            stats: stats.map((s) => ({ module: s.module, count: s._count.id })),
            total: stats.reduce((sum, s) => sum + s._count.id, 0),
        });
    } catch {
        return NextResponse.json({ error: "Failed to load mistakes" }, { status: 500 });
    }
}

function safeJsonParse(str: string): unknown {
    try {
        return JSON.parse(str);
    } catch {
        return str;
    }
}
