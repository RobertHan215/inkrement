"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Annotation {
    word: string;
    meaning: string;
}

interface Question {
    id: number;
    type: string;
    question: string;
    answer: string;
    analysis: string;
}

interface Passage {
    title: string;
    author: string;
    dynasty: string;
    original_text: string;
    annotations: Annotation[];
    questions: Question[];
}

export default function ClassicalReadingPage() {
    const router = useRouter();
    const [planId, setPlanId] = useState<string | null>(null);
    const [passage, setPassage] = useState<Passage | null>(null);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showAnnotations, setShowAnnotations] = useState(false);

    useEffect(() => {
        fetch("/api/training/today")
            .then((r) => r.json())
            .then((data) => {
                if (data.plan) {
                    setPlanId(data.plan.id);
                    if (data.plan.status === "completed" && data.plan.submissions?.[0]) {
                        router.push(`/training/classical-reading/result?submissionId=${data.plan.submissions[0].id}`);
                        return;
                    }
                }
                return fetch("/api/training/classical-reading/passage", { method: "POST" });
            })
            .then((r) => r?.json())
            .then((data) => {
                if (data?.passage) setPassage(data.passage);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [router]);

    async function handleSubmit() {
        if (!planId || !passage) return;
        const unanswered = passage.questions.filter((q) => !answers[q.id]?.trim());
        if (unanswered.length > 0) {
            alert(`还有 ${unanswered.length} 道题没有作答！`);
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/training/classical-reading/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planId,
                    answers: passage.questions.map((q) => ({
                        questionId: q.id,
                        questionType: q.type,
                        questionText: q.question,
                        referenceAnswer: q.answer,
                        studentAnswer: answers[q.id] || "",
                    })),
                }),
            });
            const data = await res.json();
            if (data.submission) {
                router.push(`/training/classical-reading/result?submissionId=${data.submission.id}`);
            }
        } catch {
            alert("提交失败，请重试");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!passage) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <p className="text-gray-500">今日不是古文阅读训练日</p>
                <Link href="/" className="mt-4 text-cyan-600 underline">返回首页</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-amber-600 to-orange-500 text-white px-4 py-6 safe-top">
                <Link href="/" className="text-sm opacity-80 hover:opacity-100">← 返回</Link>
                <h1 className="text-xl font-bold mt-2">📜 古文阅读</h1>
                <p className="text-sm opacity-80 mt-1">{passage.title} · {passage.dynasty} · {passage.author}</p>
            </header>

            <div className="p-4 space-y-4">
                {/* 原文 */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-amber-800">原文</h2>
                        <button
                            onClick={() => setShowAnnotations(!showAnnotations)}
                            className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700"
                        >
                            {showAnnotations ? "隐藏注释" : "查看注释"}
                        </button>
                    </div>
                    <p className="text-gray-800 leading-relaxed text-base whitespace-pre-line font-serif">
                        {passage.original_text}
                    </p>

                    {showAnnotations && (
                        <div className="mt-4 pt-3 border-t border-amber-100">
                            <h3 className="text-sm font-medium text-amber-700 mb-2">📝 重点字词</h3>
                            <div className="space-y-1">
                                {passage.annotations.map((a, i) => (
                                    <div key={i} className="text-sm">
                                        <span className="font-medium text-amber-800">【{a.word}】</span>
                                        <span className="text-gray-600">{a.meaning}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 题目 */}
                {passage.questions.map((q) => (
                    <div key={q.id} className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center font-bold">
                                {q.id}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
                                {q.type === "word_explain" ? "字词解释" : q.type === "sentence_translate" ? "句子翻译" : "内容理解"}
                            </span>
                        </div>
                        <p className="text-gray-800 mb-3">{q.question}</p>
                        <textarea
                            value={answers[q.id] || ""}
                            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                            placeholder="在此作答..."
                            rows={3}
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                        />
                    </div>
                ))}

                {/* 提交 */}
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                    {submitting ? "正在批改..." : "提交答案"}
                </button>
            </div>
        </div>
    );
}
