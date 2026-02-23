"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface WritingTopic {
    title: string;
    type: string;
    description: string;
    requirements: string;
    word_count: { min: number; max: number };
}

const DRAFT_KEY = "inkrement_chinese_writing_draft";
const DRAFT_SAVE_INTERVAL = 60000; // 60秒

export default function ChineseWritingPage() {
    const router = useRouter();
    const [planId, setPlanId] = useState<string | null>(null);
    const [topic, setTopic] = useState<WritingTopic | null>(null);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [draftSaved, setDraftSaved] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 字数统计
    const wordCount = content.replace(/\s/g, "").length;

    // 加载今日任务和题目
    useEffect(() => {
        async function init() {
            try {
                // 获取今日任务
                const todayRes = await fetch("/api/training/today");
                const todayData = await todayRes.json();

                if (todayData.error) throw new Error(todayData.error);
                setPlanId(todayData.plan.id);

                // 如果已完成，跳转结果页
                if (todayData.plan.status === "completed" && todayData.plan.latestSubmission) {
                    router.push(
                        `/training/chinese-writing/result?submissionId=${todayData.plan.latestSubmission.id}`
                    );
                    return;
                }

                // 恢复草稿
                const draft = localStorage.getItem(DRAFT_KEY);
                if (draft) {
                    const parsed = JSON.parse(draft);
                    if (parsed.planId === todayData.plan.id && parsed.content) {
                        setContent(parsed.content);
                    }
                }

                // 获取题目
                const topicRes = await fetch("/api/training/chinese-writing/topic", {
                    method: "POST",
                });
                const topicData = await topicRes.json();
                setTopic(topicData.topic);
            } catch (err) {
                setError(err instanceof Error ? err.message : "加载失败");
            } finally {
                setLoading(false);
            }
        }

        init();
    }, [router]);

    // 草稿自动保存
    const saveDraft = useCallback(() => {
        if (planId && content.length > 0) {
            localStorage.setItem(
                DRAFT_KEY,
                JSON.stringify({ planId, content, savedAt: Date.now() })
            );
            setDraftSaved(true);
            setTimeout(() => setDraftSaved(false), 2000);
        }
    }, [planId, content]);

    useEffect(() => {
        const timer = setInterval(saveDraft, DRAFT_SAVE_INTERVAL);
        return () => clearInterval(timer);
    }, [saveDraft]);

    // 提交
    async function handleSubmit() {
        if (!planId || !topic || wordCount < 10) return;

        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/training/chinese-writing/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planId,
                    content,
                    topicTitle: topic.title,
                }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // 清除草稿
            localStorage.removeItem(DRAFT_KEY);

            // 跳转结果页
            router.push(
                `/training/chinese-writing/result?submissionId=${data.submission.id}&score=${data.feedback.total_score}`
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "提交失败，请重试");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center animate-fade-in">
                    <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-text-muted text-sm mt-4">加载题目中...</p>
                </div>
            </div>
        );
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
                    <h1 className="text-sm font-semibold">中文写作</h1>
                    <button
                        onClick={saveDraft}
                        className="text-xs text-text-muted hover:text-primary transition-colors"
                    >
                        {draftSaved ? "✓ 已保存" : "保存草稿"}
                    </button>
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
                {/* 题目卡片 */}
                {topic && (
                    <div className="card p-4 animate-fade-in">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs bg-primary/10 text-primary-dark px-2 py-0.5 rounded-full font-medium">
                                {topic.type}
                            </span>
                            <span className="text-xs text-text-muted">
                                {topic.word_count.min}-{topic.word_count.max}字
                            </span>
                        </div>
                        <h2 className="text-lg font-bold text-text">{topic.title}</h2>
                        <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                            {topic.description}
                        </p>
                        <div className="mt-3 text-xs text-text-muted bg-bg rounded-lg p-3 whitespace-pre-line">
                            {topic.requirements}
                        </div>
                    </div>
                )}

                {/* 写作区域 */}
                <div className="card p-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-text">开始写作</label>
                        <span
                            className={`text-xs font-mono transition-colors ${topic && wordCount >= topic.word_count.min
                                    ? "text-secondary"
                                    : wordCount > 0
                                        ? "text-accent"
                                        : "text-text-muted"
                                }`}
                        >
                            {wordCount} 字
                        </span>
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="在这里写下你的文章..."
                        className="w-full min-h-[320px] bg-bg rounded-xl p-4 text-sm leading-relaxed text-text placeholder-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    />
                </div>

                {/* 错误提示 */}
                {error && (
                    <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 animate-fade-in">
                        {error}
                    </div>
                )}

                {/* 提交按钮 */}
                <button
                    onClick={handleSubmit}
                    disabled={submitting || wordCount < 10}
                    className={`w-full py-3.5 rounded-2xl text-white font-semibold text-sm transition-all ${submitting || wordCount < 10
                            ? "bg-gray-300 cursor-not-allowed"
                            : "gradient-primary hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
                        }`}
                >
                    {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            AI 批改中...
                        </span>
                    ) : (
                        `提交作文${topic ? ` (${topic.word_count.min}字起)` : ""}`
                    )}
                </button>
            </div>
        </div>
    );
}
