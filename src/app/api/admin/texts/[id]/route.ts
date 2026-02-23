import { getCurrentUser, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * PUT    /api/admin/texts/[id] - 更新古文篇目
 * DELETE /api/admin/texts/[id] - 删除古文篇目
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser("admin");
        requireRole(user, "admin");
        const { id } = await params;

        const body = await req.json();
        const text = await prisma.classicText.update({
            where: { id },
            data: {
                title: body.title,
                author: body.author,
                dynasty: body.dynasty,
                content: body.content,
                translation: body.translation,
                notes: body.notes,
                difficulty: body.difficulty != null ? Number(body.difficulty) : undefined,
                gradeLevel: body.gradeLevel,
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

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser("admin");
        requireRole(user, "admin");
        const { id } = await params;

        await prisma.classicText.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
