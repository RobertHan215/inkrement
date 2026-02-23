import "dotenv/config";
import { writeFileSync } from "fs";

const KEY = process.env.QWEN_API_KEY!;
const MODEL = process.env.QWEN_MODEL || "qwen-max";
const BASE = process.env.QWEN_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";

const log: Record<string, unknown> = {
    key_preview: KEY ? KEY.slice(0, 8) + "..." + KEY.slice(-4) : "NOT_SET",
    key_length: KEY?.length ?? 0,
    model: MODEL,
    base_url: BASE,
};

async function main() {
    try {
        const res = await fetch(`${BASE}/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: "user", content: "1+1=?" }],
                temperature: 0.1,
                max_tokens: 50,
            }),
        });
        const text = await res.text();
        log.http_status = res.status;
        log.response_headers = Object.fromEntries(res.headers.entries());
        try { log.response_body = JSON.parse(text); } catch { log.response_raw = text; }
        log.success = res.ok;
        if (res.ok) {
            const data = JSON.parse(text);
            log.answer = data.choices?.[0]?.message?.content;
            log.usage = data.usage;
        }
    } catch (err) {
        log.error = String(err);
    }
    writeFileSync("scripts/debug-result.json", JSON.stringify(log, null, 2), "utf-8");
}

main();
