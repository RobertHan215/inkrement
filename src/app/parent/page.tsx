"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const MODULE_INFO: Record<string, { name: string; emoji: string; color: string }> = {
    chinese_writing: { name: "中文写作", emoji: "✍️", color: "text-cyan-600 bg-cyan-50" },
    classical_reading: { name: "古文阅读", emoji: "📜", color: "text-amber-600 bg-amber-50" },
    english_writing: { name: "英语写作", emoji: "📝", color: "text-blue-600 bg-blue-50" },
    english_reading: { name: "英语阅读", emoji: "📖", color: "text-emerald-600 bg-emerald-50" },
};

interface ChildData {
    child: { id: string; name: string; grade: string } | null;
    stats: {
        streak: number;
        weeklyCount: number;
        totalCompleted: number;
        wrongCount: number;
        byModule: Record<string, { avg: number; max: number; count: number; recent5: number[] }>;
    } | null;
    recentRecords: { date: string; module: string; score: number | null; grade: string | null }[];
}

function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted w-16 shrink-0">{label}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-xs font-semibold text-text w-8 text-right">{value}</span>
        </div>
    );
}

export default function ParentPage() {
    const [data, setData] = useState<ChildData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/parent/child?role=parent")
            .then((r) => r.json())
            .then(setData)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!data?.child) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-6 text-center">
                <p className="text-4xl mb-4">👨‍👩‍👧</p>
                <h2 className="text-lg font-semibold text-text mb-2">尚未关联孩子</h2>
                <p className="text-sm text-text-muted mb-6">
                    请输入孩子提供的邀请码进行关联
                </p>
                <p className="text-xs text-text-muted">
                    （此功能将在 Phase 5 上线后启用）
                </p>
            </div>
        );
    }

    const { child, stats, recentRecords } = data;

    return (
        <div className="min-h-screen bg-bg">
            {/* Header */}
            <header className="bg-gradient-to-br from-violet-500 to-purple-600 text-white px-6 pt-12 pb-8 rounded-b-3xl">
                <div className="max-w-lg mx-auto">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-purple-200 text-xs">家长端</p>
                        <Link href="/" className="text-white/60 text-xs hover:text-white transition-colors">
                            切换学生 →
                        </Link>
                    </div>
                    <h1 className="text-xl font-bold">{child.name} 的学习报告</h1>
                    <p className="text-purple-200 text-sm mt-0.5">{child.grade || "未设置年级"}</p>

                    {/* 核心数据 */}
                    {stats && (
                        <div className="grid grid-cols-3 gap-3 mt-5">
                            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
                                <p className="text-2xl font-bold">{stats.streak}</p>
                                <p className="text-purple-200 text-[11px] mt-0.5">连续打卡</p>
                            </div>
                            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
                                <p className="text-2xl font-bold">{stats.weeklyCount}</p>
                                <p className="text-purple-200 text-[11px] mt-0.5">本周完成</p>
                            </div>
                            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
                                <p className="text-2xl font-bold">{stats.totalCompleted}</p>
                                <p className="text-purple-200 text-[11px] mt-0.5">总完成</p>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-5 space-y-5 -mt-3">
                {/* 各模块成绩 */}
                {stats && (
                    <div className="card p-5">
                        <h2 className="text-sm font-semibold text-text mb-4">📊 各模块成绩</h2>
                        <div className="space-y-3">
                            {Object.entries(MODULE_INFO).map(([key, mod]) => {
                                const modStats = stats.byModule[key];
                                return (
                                    <div key={key}>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${mod.color}`}>
                                                {mod.emoji} {mod.name}
                                            </span>
                                            {modStats && modStats.count > 0 && (
                                                <span className="text-[10px] text-text-muted">
                                                    共 {modStats.count} 次
                                                </span>
                                            )}
                                        </div>
                                        {modStats && modStats.count > 0 ? (
                                            <div className="space-y-1.5 pl-1">
                                                <ScoreBar label="平均分" value={modStats.avg} />
                                                <ScoreBar label="最高分" value={modStats.max} />
                                            </div>
                                        ) : (
                                            <p className="text-xs text-text-muted pl-1">暂无数据</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 最近训练 */}
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-text">📋 最近训练</h2>
                        <Link
                            href="/history?role=parent"
                            className="text-xs text-primary hover:underline"
                        >
                            查看全部 →
                        </Link>
                    </div>
                    {recentRecords && recentRecords.length > 0 ? (
                        <div className="space-y-2">
                            {recentRecords.map((record, i) => {
                                const mod = MODULE_INFO[record.module];
                                return (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${mod?.color || "bg-gray-100"}`}>
                                            {mod?.emoji || "📄"}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-text">{mod?.name}</p>
                                            <p className="text-[10px] text-text-muted">{record.date}</p>
                                        </div>
                                        {record.score != null && (
                                            <p className={`text-sm font-bold ${record.score >= 90
                                                    ? "text-emerald-600"
                                                    : record.score >= 75
                                                        ? "text-blue-600"
                                                        : record.score >= 60
                                                            ? "text-amber-600"
                                                            : "text-red-500"
                                                }`}>
                                                {record.score}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-text-muted text-center py-4">暂无训练记录</p>
                    )}
                </div>

                {/* 快捷入口 */}
                <div className="grid grid-cols-2 gap-3">
                    <Link
                        href="/calendar?role=parent"
                        className="card p-4 text-center hover:shadow-md transition-shadow"
                    >
                        <p className="text-2xl mb-1">📅</p>
                        <p className="text-sm font-medium text-text">打卡日历</p>
                    </Link>
                    <Link
                        href="/mistakes?role=parent"
                        className="card p-4 text-center hover:shadow-md transition-shadow"
                    >
                        <p className="text-2xl mb-1">📝</p>
                        <p className="text-sm font-medium text-text">错题本</p>
                        {stats && stats.wrongCount > 0 && (
                            <p className="text-xs text-red-500 mt-0.5">{stats.wrongCount} 题待复习</p>
                        )}
                    </Link>
                </div>
            </div>
        </div>
    );
}
