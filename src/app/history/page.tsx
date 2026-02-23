"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const MODULE_INFO: Record<string, { name: string; emoji: string; color: string; href: string }> = {
    chinese_writing: { name: "中文写作", emoji: "✍️", color: "text-cyan-600 bg-cyan-50", href: "/training/chinese-writing" },
    classical_reading: { name: "古文阅读", emoji: "📜", color: "text-amber-600 bg-amber-50", href: "/training/classical-reading" },
    english_writing: { name: "英语写作", emoji: "📝", color: "text-blue-600 bg-blue-50", href: "/training/english-writing" },
    english_reading: { name: "英语阅读", emoji: "📖", color: "text-emerald-600 bg-emerald-50", href: "/training/english-reading" },
};

const FILTERS = [
    { key: "all", label: "全部" },
    { key: "chinese_writing", label: "中文写作" },
    { key: "classical_reading", label: "古文阅读" },
    { key: "english_writing", label: "英语写作" },
    { key: "english_reading", label: "英语阅读" },
];

interface HistoryRecord {
    planId: string;
    date: string;
    module: string;
    status: string;
    score: number | null;
    grade: string | null;
    submissionId: string | null;
    submittedAt: string | null;
}

interface HistoryData {
    records: HistoryRecord[];
    total: number;
    page: number;
    totalPages: number;
}

export default function HistoryPage() {
    const [data, setData] = useState<HistoryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(1);

    const fetchData = useCallback(() => {
        setLoading(true);
        fetch(`/api/training/history?page=${page}&module=${filter}&pageSize=10`)
            .then((r) => r.json())
            .then(setData)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [page, filter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    function handleFilterChange(key: string) {
        setFilter(key);
        setPage(1);
    }

    function getScoreColor(score: number | null) {
        if (score == null) return "text-text-muted";
        if (score >= 90) return "text-emerald-600";
        if (score >= 75) return "text-blue-600";
        if (score >= 60) return "text-amber-600";
        return "text-red-500";
    }

    function getResultHref(record: HistoryRecord) {
        if (!record.submissionId) return null;
        const mod = MODULE_INFO[record.module];
        if (!mod) return null;
        return `${mod.href}/result?submissionId=${record.submissionId}`;
    }

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
                    <h1 className="text-sm font-semibold">历史记录</h1>
                    <Link
                        href="/calendar"
                        className="text-text-muted hover:text-primary transition-colors text-sm"
                    >
                        📅
                    </Link>
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
                {/* 模块筛选 */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => handleFilterChange(f.key)}
                            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${filter === f.key
                                    ? "bg-primary text-white font-medium shadow-sm"
                                    : "bg-surface text-text-secondary hover:bg-surface-hover"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* 统计 */}
                {data && (
                    <p className="text-xs text-text-muted">
                        共 {data.total} 条记录
                    </p>
                )}

                {/* 记录列表 */}
                {loading ? (
                    <div className="h-48 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : data && data.records.length > 0 ? (
                    <div className="space-y-2">
                        {data.records.map((record) => {
                            const mod = MODULE_INFO[record.module];
                            const resultHref = getResultHref(record);

                            const Card = (
                                <div className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                                    {/* 模块图标 */}
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${mod?.color || "bg-gray-100"}`}>
                                        {mod?.emoji || "📄"}
                                    </div>

                                    {/* 详情 */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-text">
                                            {mod?.name || record.module}
                                        </p>
                                        <p className="text-xs text-text-muted mt-0.5">
                                            {record.date}
                                        </p>
                                    </div>

                                    {/* 分数 */}
                                    <div className="text-right">
                                        {record.score != null ? (
                                            <>
                                                <p className={`text-lg font-bold ${getScoreColor(record.score)}`}>
                                                    {record.score}
                                                </p>
                                                {record.grade && (
                                                    <p className="text-[10px] text-text-muted">{record.grade}</p>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-xs text-text-muted">—</p>
                                        )}
                                    </div>

                                    {/* 箭头 */}
                                    {resultHref && (
                                        <svg className="w-4 h-4 text-text-muted/40" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                        </svg>
                                    )}
                                </div>
                            );

                            return resultHref ? (
                                <Link key={record.planId} href={resultHref}>
                                    {Card}
                                </Link>
                            ) : (
                                <div key={record.planId}>{Card}</div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-48 flex flex-col items-center justify-center text-text-muted">
                        <p className="text-3xl mb-2">📭</p>
                        <p className="text-sm">暂无记录</p>
                    </div>
                )}

                {/* 分页 */}
                {data && data.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page <= 1}
                            className="text-sm px-3 py-1.5 rounded-lg bg-surface text-text-secondary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            上一页
                        </button>
                        <span className="text-xs text-text-muted">
                            {page}/{data.totalPages}
                        </span>
                        <button
                            onClick={() => setPage(Math.min(data.totalPages, page + 1))}
                            disabled={page >= data.totalPages}
                            className="text-sm px-3 py-1.5 rounded-lg bg-surface text-text-secondary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            下一页
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
