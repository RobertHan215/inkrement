"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Question {
    id: number;
    type: string;
    question: string;
    options?: string[];
    answer: string;
    analysis: string;
    evidence: string;
}

interface Vocabulary {
    word: string;
    phonetic: string;
    meaning: string;
    example: string;
}

interface Passage {
    title: string;
    topic: string;
    passage: string;
    word_count: number;
    questions: Question[];
    vocabulary: Vocabulary[];
}

export default function EnglishReadingPage() {
    const router = useRouter();
    const [planId, setPlanId] = useState<string | null>(null);
    const [passage, setPassage] = useState<Passage | null>(null);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showVocab, setShowVocab] = useState(false);

    useEffect(() => {
        fetch("/api/training/today")
            .then((r) => r.json())
            .then((data) => {
                if (data.plan) {
                    setPlanId(data.plan.id);
                    if (data.plan.status === "completed" && data.plan.submissions?.[0]) {
                        router.push(`/training/english-reading/result?submissionId=${data.plan.submissions[0].id}`);
                        return;
                    }
                }
                return fetch("/api/training/english-reading/passage", { method: "POST" });
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
            const res = await fetch("/api/training/english-reading/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planId,
                    answers: passage.questions.map((q) => ({
                        questionId: q.id,
                        questionType: q.type,
                        questionText: q.question,
                        correctAnswer: q.answer,
                        studentAnswer: answers[q.id] || "",
                    })),
                }),
            });
            const data = await res.json();
            if (data.submission) {
                router.push(`/training/english-reading/result?submissionId=${data.submission.id}`);
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
                <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!passage) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <p className="text-gray-500">今日不是英文阅读训练日</p>
                <Link href="/" className="mt-4 text-cyan-600 underline">返回首页</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50">
            <header className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-4 py-6 safe-top">
                <Link href="/" className="text-sm opacity-80 hover:opacity-100">← 返回</Link>
                <h1 className="text-xl font-bold mt-2">📖 English Reading</h1>
                <p className="text-sm opacity-80 mt-1">{passage.title} · {passage.word_count} words</p>
            </header>

            <div className="p-4 space-y-4">
                {/* 文章 */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-emerald-800">{passage.title}</h2>
                        <button
                            onClick={() => setShowVocab(!showVocab)}
                            className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-700"
                        >
                            {showVocab ? "隐藏生词" : "📚 生词表"}
                        </button>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line" style={{ fontFamily: "'Georgia', serif" }}>
                        {passage.passage}
                    </p>

                    {showVocab && (
                        <div className="mt-4 pt-3 border-t border-emerald-100 space-y-2">
                            {passage.vocabulary.map((v, i) => (
                                <div key={i} className="bg-emerald-50 rounded-xl p-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-emerald-800">{v.word}</span>
                                        <span className="text-xs text-gray-400">{v.phonetic}</span>
                                        <span className="text-sm text-gray-600">· {v.meaning}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 italic">{v.example}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 题目 */}
                {passage.questions.map((q) => (
                    <div key={q.id} className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">
                                {q.id}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-600">
                                {q.type === "multiple_choice" ? "选择题" : "填空题"}
                            </span>
                        </div>
                        <p className="text-gray-800 mb-3 text-sm">{q.question}</p>

                        {q.type === "multiple_choice" && q.options ? (
                            <div className="space-y-2">
                                {q.options.map((opt) => {
                                    const optLetter = opt.charAt(0);
                                    const isSelected = answers[q.id] === optLetter;
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: optLetter }))}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${isSelected
                                                    ? "bg-emerald-500 text-white shadow-md"
                                                    : "bg-gray-50 text-gray-700 hover:bg-emerald-50"
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <input
                                type="text"
                                value={answers[q.id] || ""}
                                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                placeholder="Type your answer..."
                                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            />
                        )}
                    </div>
                ))}

                {/* 提交 */}
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                    {submitting ? "正在批改..." : "Submit Answers"}
                </button>
            </div>
        </div>
    );
}
