import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // 验证数据库连接
        const userCount = await prisma.user.count();
        const aiConfigCount = await prisma.aiConfig.count();

        return NextResponse.json({
            status: "ok",
            timestamp: new Date().toISOString(),
            database: {
                connected: true,
                users: userCount,
                aiConfigs: aiConfigCount,
            },
            env: {
                nodeEnv: process.env.NODE_ENV,
                hasQwenKey: !!process.env.QWEN_API_KEY,
                hasDeepSeekKey: !!process.env.DEEPSEEK_API_KEY,
            },
        });
    } catch (error) {
        return NextResponse.json(
            {
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
