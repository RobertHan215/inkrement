import { z } from "zod";

// ===== 通用类型 =====

export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface ChatOptions {
    temperature?: number;
    maxTokens?: number;
    responseFormat?: "text" | "json";
}

// ===== AI Provider 接口 =====

export interface AIProvider {
    /** 文本对话 */
    chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>;

    /** 结构化输出（返回 JSON 并用 Zod 校验） */
    structuredChat<T>(
        messages: ChatMessage[],
        schema: z.ZodType<T>,
        options?: ChatOptions
    ): Promise<T>;

    /** 视觉识别（拍照 OCR） */
    vision(imageUrl: string, prompt: string): Promise<string>;
}

// ===== Provider 工厂 =====

export type ProviderType = "qwen" | "deepseek" | "glm";

export interface ProviderConfig {
    provider: ProviderType;
    modelName: string;
    apiKey: string;
    baseUrl?: string;
    temperature?: number;
}

export function createProvider(config: ProviderConfig): AIProvider {
    switch (config.provider) {
        case "qwen":
            return new QwenProvider(config);
        case "deepseek":
            return new DeepSeekProvider(config);
        default:
            throw new Error(`Unsupported provider: ${config.provider}`);
    }
}

// ===== Qwen Provider（使用 OpenAI 兼容接口） =====

import OpenAI from "openai";

class QwenProvider implements AIProvider {
    private client: OpenAI;
    private model: string;
    private defaultTemp: number;

    constructor(config: ProviderConfig) {
        this.client = new OpenAI({
            apiKey: config.apiKey,
            baseURL:
                config.baseUrl ||
                "https://dashscope.aliyuncs.com/compatible-mode/v1",
        });
        this.model = config.modelName;
        this.defaultTemp = config.temperature ?? 0.7;
    }

    async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
            temperature: options?.temperature ?? this.defaultTemp,
            max_tokens: options?.maxTokens ?? 4096,
            ...(options?.responseFormat === "json" && {
                response_format: { type: "json_object" },
            }),
        });

        return response.choices[0]?.message?.content || "";
    }

    async structuredChat<T>(
        messages: ChatMessage[],
        schema: z.ZodType<T>,
        options?: ChatOptions
    ): Promise<T> {
        const result = await this.chat(messages, {
            ...options,
            responseFormat: "json",
        });

        try {
            const parsed = JSON.parse(result);
            return schema.parse(parsed);
        } catch (error) {
            throw new Error(
                `AI response parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    }

    async vision(imageUrl: string, prompt: string): Promise<string> {
        const response = await this.client.chat.completions.create({
            model: "qwen-vl-max",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "image_url", image_url: { url: imageUrl } },
                        { type: "text", text: prompt },
                    ],
                },
            ],
            temperature: 0.3,
            max_tokens: 4096,
        });

        return response.choices[0]?.message?.content || "";
    }
}

// ===== DeepSeek Provider =====

class DeepSeekProvider implements AIProvider {
    private client: OpenAI;
    private model: string;
    private defaultTemp: number;

    constructor(config: ProviderConfig) {
        this.client = new OpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseUrl || "https://api.deepseek.com/v1",
        });
        this.model = config.modelName;
        this.defaultTemp = config.temperature ?? 0.7;
    }

    async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
            temperature: options?.temperature ?? this.defaultTemp,
            max_tokens: options?.maxTokens ?? 4096,
            ...(options?.responseFormat === "json" && {
                response_format: { type: "json_object" },
            }),
        });

        return response.choices[0]?.message?.content || "";
    }

    async structuredChat<T>(
        messages: ChatMessage[],
        schema: z.ZodType<T>,
        options?: ChatOptions
    ): Promise<T> {
        const result = await this.chat(messages, {
            ...options,
            responseFormat: "json",
        });

        try {
            const parsed = JSON.parse(result);
            return schema.parse(parsed);
        } catch (error) {
            throw new Error(
                `AI response parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    }

    async vision(): Promise<string> {
        throw new Error("DeepSeek does not support vision API");
    }
}

// ===== 获取模块对应的 AI Provider =====

import { prisma } from "../db";

export async function getProviderForModule(
    module: string
): Promise<AIProvider> {
    // 从环境变量读取 API Key（作为最终 fallback）
    const envApiKey = process.env.QWEN_API_KEY;
    const envModel = process.env.QWEN_MODEL || "qwen-max";
    const envBaseUrl = process.env.QWEN_BASE_URL;

    // 先从数据库读取配置
    const config = await prisma.aiConfig.findUnique({
        where: { module },
    });

    if (config) {
        // 如果数据库的 apiKey 是占位符或空值，使用环境变量的 key
        const apiKey = (config.apiKey && config.apiKey !== "placeholder-key")
            ? config.apiKey
            : envApiKey;

        if (!apiKey) {
            throw new Error(`API key not configured for module: ${module}`);
        }

        return createProvider({
            provider: config.provider as ProviderType,
            modelName: config.modelName,
            apiKey,
            baseUrl: config.baseUrl ?? undefined,
            temperature: config.temperature,
        });
    }

    // 回退到环境变量默认配置
    if (!envApiKey) {
        throw new Error("QWEN_API_KEY not configured");
    }

    return createProvider({
        provider: "qwen",
        modelName: envModel,
        apiKey: envApiKey,
        baseUrl: envBaseUrl,
    });
}
