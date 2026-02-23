"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface MistakeStat {
    module: string;
    count: number;
}

interface Mistake {
    id: string;
    module: string;
    questionContent: unknown;
    correctAnswer: string | null;
    studentAnswer: string | null;
    errorCount: number;
    consecutiveCorrect: number;
    status: string;
    updatedAt: string;
}

const MODULE_NAMES: Record<string, string> = {
    chinese_writing: "中文写作",
    classical_reading: "古文阅读",
    english_writing: "英文写作",
    english_reading: "英文阅读",
};

const MODULE_COLORS: Record<string, string> = {
    chinese_writing: "bg-cyan-100 text-cyan-700",
    classical_reading: "bg-amber-100 text-amber-700",
    english_writing: "bg-blue-100 text-blue-700",
    english_reading: "bg-emerald-100 text-emerald-700",
};

export default function MistakesPage() {
    const [mistakes, setMistakes] = useState<Mistake[]>([]);
    const [stats, setStats] = useState<MistakeStat[]>([]);
    const [total, setTotal] = useState(0);
    const [activeModule, setActiveModule] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams();
        if (activeModule) params.set("module", activeModule);
        fetch(`/api/mistakes?${params}`)
            .then((r) => r.json())
            .then((data) => {
                setMistakes(data.mistakes || []);
                setStats(data.stats || []);
                setTotal(data.total || 0);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [activeModule]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-rose-50 to-pink-50">
            <header className="bg-gradient-to-r from-rose-600 to-pink-500 text-white px-4 py-6 safe-top">
                <Link href="/" className="text-sm opacity-80 hover:opacity-100">← 返回</Link>
                <h1 className="text-xl font-bold mt-2">📕 错题本</h1>
                <p className="text-sm opacity-80 mt-1">{total} 道待复习</p>
            </header>

            {/* 模块筛选 */}
            <div className="p-4 flex gap-2 overflow-x-auto">
                <button
                    onClick={() => setActiveModule(null)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${!activeModule ? "bg-rose-500 text-white shadow-md" : "bg-white text-gray-600"
                        }`}
                >
                    全部 ({total})
                </button>
                {stats.map((s) => (
                    <button
                        key={s.module}
                        onClick={() => setActiveModule(s.module)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeModule === s.module ? "bg-rose-500 text-white shadow-md" : "bg-white text-gray-600"
                            }`}
                    >
                        {MODULE_NAMES[s.module] || s.module} ({s.count})
                    </button>
                ))}
            </div>

            {/* 错题列表 */}
            <div className="p-4 space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full" />
                    </div>
                ) : mistakes.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-4xl mb-2">🎉</p>
                        <p className="text-gray-500">没有错题！继续保持！</p>
                    </div>
                ) : (
                    mistakes.map((m) => (
                        <div key={m.id} className="bg-white rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${MODULE_COLORS[m.module] || "bg-gray-100 text-gray-600"}`}>
                                    {MODULE_NAMES[m.module] || m.module}
                                </span>
                                <span className="text-xs text-gray-400 ml-auto">
                                    错 {m.errorCount} 次
                                </span>
                                {m.consecutiveCorrect > 0 && (
                                    <span className="text-xs text-green-500">连对 {m.consecutiveCorrect}</span>
                                )}
                            </div>

                            {/* 题目内容 */}
                            <div className="text-sm text-gray-700 mb-2">
                                {typeof m.questionContent === "object" && m.questionContent !== null ? (
                                    <p>{(m.questionContent as Record<string, string>).questionText || JSON.stringify(m.questionContent)}</p>
                                ) : (
                                    <p>{String(m.questionContent)}</p>
                                )}
                            </div>

                            <div className="flex gap-3 text-xs">
                                {m.studentAnswer && (
                                    <div className="flex-1 bg-red-50 rounded-lg p-2">
                                        <span className="text-red-500 font-medium">我的答案：</span>
                                        <span className="text-gray-600">{m.studentAnswer}</span>
                                    </div>
                                )}
                                {m.correctAnswer && (
                                    <div className="flex-1 bg-green-50 rounded-lg p-2">
                                        <span className="text-green-500 font-medium">正确答案：</span>
                                        <span className="text-gray-600">{m.correctAnswer}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
