import { getCurrentUser, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/users - 获取用户列表
 */
export async function GET() {
    try {
        const user = await getCurrentUser("admin");
        requireRole(user, "admin");

        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                phone: true,
                role: true,
                grade: true,
                name: true,
                createdAt: true,
                _count: {
                    select: {
                        trainingPlans: true,
                        submissions: true,
                    },
                },
            },
        });

        return NextResponse.json({ users });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
