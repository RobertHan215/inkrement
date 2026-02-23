"use client";

import { useState, useEffect } from "react";

const MODULE_NAMES: Record<string, string> = {
    chinese_writing: "中文写作",
    classical_reading: "古文阅读",
    english_writing: "英语写作",
    english_reading: "英语阅读",
    ocr: "OCR 识别",
};

interface AiConfig {
    id: string;
    module: string;
    provider: string;
    modelName: string;
    apiKey: string;
    baseUrl: string | null;
    temperature: number;
}

export default function AiConfigPage() {
    const [configs, setConfigs] = useState<AiConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingModule, setEditingModule] = useState<string | null>(null);
    const [form, setForm] = useState({ provider: "", modelName: "", apiKey: "", baseUrl: "", temperature: "0.7" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/api/admin/ai-config?role=admin")
            .then((r) => r.json())
            .then((d) => setConfigs(d.configs || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    function openEdit(c: AiConfig) {
        setEditingModule(c.module);
        setForm({
            provider: c.provider,
            modelName: c.modelName,
            apiKey: "", // 不回显完整 key
            baseUrl: c.baseUrl || "",
            temperature: String(c.temperature),
        });
    }

    async function handleSave() {
        if (!editingModule) return;
        setSaving(true);
        const body: Record<string, unknown> = {
            module: editingModule,
            provider: form.provider,
            modelName: form.modelName,
            temperature: form.temperature,
        };
        if (form.apiKey) body.apiKey = form.apiKey;
        if (form.baseUrl !== undefined) body.baseUrl = form.baseUrl || null;

        await fetch("/api/admin/ai-config?role=admin", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        })
            .then((r) => r.json())
            .then((d) => {
                if (d.config) {
                    setConfigs((prev) =>
                        prev.map((c) => (c.module === editingModule ? d.config : c))
                    );
                }
            })
            .catch(() => { });
        setEditingModule(null);
        setSaving(false);
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">🤖 AI 模型配置</h1>

            {loading ? (
                <div className="h-40 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-3">
                    {configs.map((c) => (
                        <div
                            key={c.module}
                            className="bg-white rounded-xl border border-slate-200 p-5"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-slate-900">
                                    {MODULE_NAMES[c.module] || c.module}
                                </h3>
                                <button
                                    onClick={() => openEdit(c)}
                                    className="text-sm text-cyan-600 hover:underline"
                                >
                                    编辑
                                </button>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                <div>
                                    <p className="text-slate-500 text-xs">提供商</p>
                                    <p className="text-slate-800 font-medium">{c.provider}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs">模型</p>
                                    <p className="text-slate-800 font-medium">{c.modelName}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs">API Key</p>
                                    <p className="text-slate-800 font-mono text-xs">{c.apiKey}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs">温度</p>
                                    <p className="text-slate-800 font-medium">{c.temperature}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 编辑弹窗 */}
            {editingModule && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
                        <h2 className="text-lg font-bold text-slate-900">
                            编辑 {MODULE_NAMES[editingModule] || editingModule}
                        </h2>
                        <div className="space-y-3">
                            <Field label="提供商" value={form.provider} onChange={(v) => setForm({ ...form, provider: v })} placeholder="qwen / deepseek / glm" />
                            <Field label="模型名称" value={form.modelName} onChange={(v) => setForm({ ...form, modelName: v })} placeholder="qwen-max" />
                            <Field label="API Key（留空不修改）" value={form.apiKey} onChange={(v) => setForm({ ...form, apiKey: v })} placeholder="sk-..." />
                            <Field label="Base URL（可选）" value={form.baseUrl} onChange={(v) => setForm({ ...form, baseUrl: v })} placeholder="https://..." />
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">温度 ({form.temperature})</label>
                                <input
                                    type="range" min="0" max="1" step="0.1"
                                    value={form.temperature}
                                    onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                                    className="w-full"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end pt-2">
                            <button onClick={() => setEditingModule(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">取消</button>
                            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50">
                                {saving ? "保存中..." : "保存"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div>
            <label className="text-xs text-slate-500 mb-1 block">{label}</label>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
        </div>
    );
}
