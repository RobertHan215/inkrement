"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const MODULE_LABELS: Record<string, { name: string; color: string }> = {
    chinese_writing: { name: "写", color: "bg-cyan-500" },
    classical_reading: { name: "文", color: "bg-amber-500" },
    english_writing: { name: "英", color: "bg-blue-500" },
    english_reading: { name: "读", color: "bg-emerald-500" },
};

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

interface DayData {
    date: string;
    modules: { module: string; status: string; score: number | null }[];
    hasCompleted: boolean;
}

interface CalendarData {
    year: number;
    month: number;
    days: DayData[];
    completedCount: number;
}

export default function CalendarPage() {
    const [data, setData] = useState<CalendarData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    });

    useEffect(() => {
        setLoading(true);
        fetch(`/api/training/calendar?month=${currentMonth}`)
            .then((r) => r.json())
            .then(setData)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [currentMonth]);

    function changeMonth(delta: number) {
        const [y, m] = currentMonth.split("-").map(Number);
        const d = new Date(y, m - 1 + delta, 1);
        setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    // 计算月份第一天是星期几（用于日历对齐）
    const firstDayOfWeek = data
        ? new Date(data.year, data.month - 1, 1).getDay()
        : 0;

    const today = new Date().toISOString().slice(0, 10);

    return (
        <div className="min-h-screen bg-bg">
            {/* Header */}
            <header className="sticky top-0 bg-bg/80 backdrop-blur-sm border-b border-border z-40">
                <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-12">
                    <Link
                        href="/"
                        className="text-text-muted hover:text-text transition-colors text-sm flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                        返回
                    </Link>
                    <h1 className="text-sm font-semibold">打卡日历</h1>
                    <div className="w-10" />
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
                {/* 月份切换 */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => changeMonth(-1)}
                        className="p-2 rounded-xl hover:bg-surface-hover transition-colors"
                    >
                        <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <h2 className="text-lg font-bold text-text">
                        {data ? `${data.year} 年 ${data.month} 月` : currentMonth}
                    </h2>
                    <button
                        onClick={() => changeMonth(1)}
                        className="p-2 rounded-xl hover:bg-surface-hover transition-colors"
                    >
                        <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                </div>

                {/* 完成统计 */}
                {data && (
                    <div className="text-center text-sm text-text-secondary">
                        本月已完成 <span className="font-semibold text-primary">{data.completedCount}</span> 次训练
                    </div>
                )}

                {/* 日历网格 */}
                <div className="card p-4">
                    {/* 星期标题 */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {WEEKDAYS.map((w) => (
                            <div key={w} className="text-center text-xs text-text-muted font-medium py-1">
                                {w}
                            </div>
                        ))}
                    </div>

                    {loading ? (
                        <div className="h-48 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : data ? (
                        <div className="grid grid-cols-7 gap-1">
                            {/* 空白填充 */}
                            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square" />
                            ))}

                            {/* 日期格子 */}
                            {data.days.map((day) => {
                                const dayNum = Number(day.date.slice(-2));
                                const isToday = day.date === today;
                                const hasCompleted = day.hasCompleted;
                                const isFuture = day.date > today;

                                return (
                                    <div
                                        key={day.date}
                                        className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs transition-all relative ${isToday
                                                ? "ring-2 ring-primary ring-offset-1"
                                                : ""
                                            } ${hasCompleted
                                                ? "bg-primary/10 text-primary font-semibold"
                                                : isFuture
                                                    ? "text-text-muted/40"
                                                    : "text-text-secondary"
                                            }`}
                                    >
                                        <span>{dayNum}</span>
                                        {hasCompleted && (
                                            <span className="text-[8px] mt-0.5">✓</span>
                                        )}
                                        {/* 模块小圆点 */}
                                        {day.modules.length > 0 && (
                                            <div className="flex gap-0.5 mt-0.5">
                                                {day.modules.map((m, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-1 h-1 rounded-full ${m.status === "completed"
                                                                ? MODULE_LABELS[m.module]?.color || "bg-gray-400"
                                                                : "bg-gray-300"
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}
                </div>

                {/* 图例 */}
                <div className="flex flex-wrap gap-3 justify-center">
                    {Object.entries(MODULE_LABELS).map(([key, { name, color }]) => (
                        <div key={key} className="flex items-center gap-1.5 text-xs text-text-muted">
                            <div className={`w-2 h-2 rounded-full ${color}`} />
                            {name}
                        </div>
                    ))}
                </div>

                {/* 快捷链接 */}
                <div className="grid grid-cols-2 gap-3">
                    <Link
                        href="/history"
                        className="card p-4 text-center hover:shadow-md transition-shadow"
                    >
                        <p className="text-2xl mb-1">📋</p>
                        <p className="text-sm font-medium text-text">历史记录</p>
                        <p className="text-xs text-text-muted mt-0.5">查看详情</p>
                    </Link>
                    <Link
                        href="/mistakes"
                        className="card p-4 text-center hover:shadow-md transition-shadow"
                    >
                        <p className="text-2xl mb-1">📝</p>
                        <p className="text-sm font-medium text-text">错题本</p>
                        <p className="text-xs text-text-muted mt-0.5">复习巩固</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
