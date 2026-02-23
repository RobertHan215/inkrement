"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

interface Dimension {
    name: string;
    score: number;
    comment: string;
}

interface Feedback {
    total_score: number;
    grade: string;
    summary: string;
    dimensions: Dimension[];
    suggestions: string[];
    rewrite_example: string;
}

interface Version {
    id: string;
    version: number;
    score: number | null;
    grade: string | null;
    createdAt: string;
}

function gradeColor(grade: string) {
    switch (grade) {
        case "A": return "text-emerald-500";
        case "B": return "text-cyan-500";
        case "C": return "text-amber-500";
        case "D": return "text-red-500";
        default: return "text-text-muted";
    }
}

function scoreBarColor(score: number) {
    if (score >= 90) return "bg-emerald-500";
    if (score >= 75) return "bg-cyan-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
}

function ResultContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const submissionId = searchParams.get("submissionId");

    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [versions, setVersions] = useState<Version[]>([]);
    const [planId, setPlanId] = useState<string | null>(null);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [showAnimation, setShowAnimation] = useState(false);

    useEffect(() => {
        if (!submissionId) return;

        async function load() {
            try {
                const res = await fetch(
                    `/api/training/chinese-writing/submission?id=${submissionId}`
                );
                const data = await res.json();

                if (data.error) throw new Error(data.error);

                setFeedback(data.feedback);
                setVersions(data.versions);
                setPlanId(data.plan.id);
                setContent(data.submission.content);

                // 触发分数动画
                setTimeout(() => setShowAnimation(true), 300);
            } catch {
                // 处理错误
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [submissionId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center animate-fade-in">
                    <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-text-muted text-sm mt-4">加载批改结果...</p>
                </div>
            </div>
        );
    }

    if (!feedback) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-text-muted">未找到批改结果</p>
                    <Link href="/" className="text-primary text-sm mt-2 block">返回首页</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg">
            {/* Header */}
            <header className="sticky top-0 bg-bg/80 backdrop-blur-sm border-b border-border z-40">
                <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-12">
                    <Link href="/" className="text-text-muted hover:text-text transition-colors text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                        首页
                    </Link>
                    <h1 className="text-sm font-semibold">批改结果</h1>
                    <div className="w-10" />
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
                {/* 总分卡片 */}
                <div className="card p-6 text-center animate-fade-in">
                    <div
                        className={`text-5xl font-bold transition-all duration-1000 ${showAnimation ? gradeColor(feedback.grade) : "text-text-muted"
                            }`}
                        style={{
                            transform: showAnimation ? "scale(1)" : "scale(0.5)",
                            opacity: showAnimation ? 1 : 0,
                        }}
                    >
                        {feedback.total_score}
                    </div>
                    <div
                        className={`text-2xl font-bold mt-1 transition-all duration-700 delay-300 ${showAnimation ? gradeColor(feedback.grade) : "text-transparent"
                            }`}
                    >
                        {feedback.grade}
                    </div>
                    <p className="text-sm text-text-secondary mt-3">{feedback.summary}</p>
                </div>

                {/* 分项评分 */}
                <div className="card p-4 animate-fade-in" style={{ animationDelay: "200ms" }}>
                    <h3 className="text-sm font-semibold text-text mb-3">分项评分</h3>
                    <div className="space-y-3">
                        {feedback.dimensions.map((dim) => (
                            <div key={dim.name}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-text-secondary">{dim.name}</span>
                                    <span className="text-xs font-semibold text-text">{dim.score}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${scoreBarColor(dim.score)}`}
                                        style={{
                                            width: showAnimation ? `${dim.score}%` : "0%",
                                            transitionDelay: "500ms",
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-text-muted mt-1">{dim.comment}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 修改建议 */}
                <div className="card p-4 animate-fade-in" style={{ animationDelay: "400ms" }}>
                    <h3 className="text-sm font-semibold text-text mb-3">📝 修改建议</h3>
                    <ul className="space-y-2">
                        {feedback.suggestions.map((s, i) => (
                            <li key={i} className="flex gap-2 text-sm text-text-secondary">
                                <span className="text-primary font-semibold shrink-0">{i + 1}.</span>
                                <span>{s}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 示范改写 */}
                <div className="card p-4 animate-fade-in" style={{ animationDelay: "600ms" }}>
                    <h3 className="text-sm font-semibold text-text mb-2">✨ 示范改写</h3>
                    <p className="text-sm text-text-secondary leading-relaxed bg-bg rounded-lg p-3">
                        {feedback.rewrite_example}
                    </p>
                </div>

                {/* 版本历史 */}
                {versions.length > 1 && (
                    <div className="card p-4 animate-fade-in" style={{ animationDelay: "800ms" }}>
                        <h3 className="text-sm font-semibold text-text mb-3">📋 提交历史</h3>
                        <div className="space-y-2">
                            {versions.map((v) => (
                                <button
                                    key={v.id}
                                    onClick={() =>
                                        router.push(`/training/chinese-writing/result?submissionId=${v.id}`)
                                    }
                                    className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${v.id === submissionId
                                            ? "bg-primary/10 text-primary"
                                            : "hover:bg-bg text-text-secondary"
                                        }`}
                                >
                                    <span>第 {v.version} 版</span>
                                    <span className="font-semibold">{v.score ?? "-"} 分</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-3 pt-2 pb-4">
                    <button
                        onClick={() => {
                            // 重新提交：回到写作页面
                            router.push("/training/chinese-writing");
                        }}
                        className="flex-1 py-3 rounded-2xl border-2 border-primary text-primary font-semibold text-sm hover:bg-primary/5 transition-colors"
                    >
                        修改重写
                    </button>
                    <Link
                        href="/"
                        className="flex-1 py-3 rounded-2xl gradient-primary text-white font-semibold text-sm text-center hover:shadow-lg hover:shadow-primary/20 transition-all"
                    >
                        返回首页
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function ResultPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <ResultContent />
        </Suspense>
    );
}
