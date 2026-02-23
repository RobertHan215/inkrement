import { getCurrentUser, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET  /api/admin/texts  - 获取古文篇目列表
 * POST /api/admin/texts  - 新增古文篇目
 */
export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser("admin");
        requireRole(user, "admin");

        const search = req.nextUrl.searchParams.get("search") || "";
        const grade = req.nextUrl.searchParams.get("grade") || "";

        const where: Record<string, unknown> = {};
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { author: { contains: search } },
            ];
        }
        if (grade) where.gradeLevel = grade;

        const texts = await prisma.classicText.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        return NextResponse.json({ texts, total: texts.length });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser("admin");
        requireRole(user, "admin");

        const body = await req.json();
        const { title, author, dynasty, content, translation, notes, difficulty, gradeLevel } = body;

        if (!title || !author || !content) {
            return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
        }

        const text = await prisma.classicText.create({
            data: {
                title,
                author,
                dynasty: dynasty || "",
                content,
                translation: translation || "",
                notes: notes || "{}",
                difficulty: Number(difficulty) || 3,
                gradeLevel: gradeLevel || "预初",
            },
        });

        return NextResponse.json({ text });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
