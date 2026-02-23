import { getCurrentUser, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET  /api/admin/ai-config  - 获取所有 AI 模型配置
 * PUT  /api/admin/ai-config  - 更新 AI 模型配置
 */
export async function GET() {
    try {
        const user = await getCurrentUser("admin");
        requireRole(user, "admin");

        const configs = await prisma.aiConfig.findMany({
            orderBy: { module: "asc" },
        });

        // 隐藏 API Key 中间部分
        const safe = configs.map((c) => ({
            ...c,
            apiKey: c.apiKey.length > 8
                ? c.apiKey.slice(0, 4) + "****" + c.apiKey.slice(-4)
                : "****",
        }));

        return NextResponse.json({ configs: safe });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await getCurrentUser("admin");
        requireRole(user, "admin");

        const body = await req.json();
        const { module, provider, modelName, apiKey, baseUrl, temperature } = body;

        if (!module) {
            return NextResponse.json({ error: "模块名必填" }, { status: 400 });
        }

        const data: Record<string, unknown> = {};
        if (provider != null) data.provider = provider;
        if (modelName != null) data.modelName = modelName;
        if (apiKey != null) data.apiKey = apiKey;
        if (baseUrl !== undefined) data.baseUrl = baseUrl;
        if (temperature != null) data.temperature = Number(temperature);

        const config = await prisma.aiConfig.update({
            where: { module },
            data,
        });

        return NextResponse.json({
            config: {
                ...config,
                apiKey: config.apiKey.length > 8
                    ? config.apiKey.slice(0, 4) + "****" + config.apiKey.slice(-4)
                    : "****",
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
