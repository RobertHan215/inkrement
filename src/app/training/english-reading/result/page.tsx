"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface GradingResult {
    questionId: number;
    score: number;
    is_correct: boolean;
    comment: string;
    correct_answer: string;
    explanation: string;
}

interface Feedback {
    total_score: number;
    grade: string;
    summary: string;
    results: GradingResult[];
}

function ResultContent() {
    const searchParams = useSearchParams();
    const submissionId = searchParams.get("submissionId");
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!submissionId) return;
        fetch(`/api/training/chinese-writing/submission?id=${submissionId}`)
            .then((r) => r.json())
            .then((data) => { if (data.feedback) setFeedback(data.feedback); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [submissionId]);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" /></div>;
    if (!feedback) return <div className="min-h-screen flex flex-col items-center justify-center p-6"><p className="text-gray-500">未找到批改结果</p><Link href="/" className="mt-4 text-cyan-600 underline">返回首页</Link></div>;

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50">
            <header className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-4 py-6 safe-top">
                <Link href="/" className="text-sm opacity-80 hover:opacity-100">← 返回首页</Link>
                <h1 className="text-xl font-bold mt-2">📖 Reading Result</h1>
            </header>

            <div className="p-4 -mt-2">
                <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                    <div className="text-5xl font-bold text-emerald-600">{feedback.total_score}</div>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="text-sm text-gray-500">Grade {feedback.grade}</span>
                        <span className="text-sm">{feedback.results.filter((r) => r.is_correct).length}/{feedback.results.length} 正确</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">{feedback.summary}</p>
                </div>
            </div>

            <div className="p-4 space-y-3">
                {feedback.results.map((r) => (
                    <div key={r.questionId} className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 ${r.is_correct ? "border-green-400" : "border-red-400"}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xl ${r.is_correct ? "text-green-500" : "text-red-500"}`}>{r.is_correct ? "✅" : "❌"}</span>
                            <span className="font-bold text-gray-800">Question {r.questionId}</span>
                        </div>
                        <p className="text-sm text-gray-600">{r.comment}</p>
                        {!r.is_correct && (
                            <div className="mt-2 bg-emerald-50 rounded-xl p-3">
                                <p className="text-xs text-emerald-700 font-medium">📌 Correct Answer: <strong>{r.correct_answer}</strong></p>
                                <p className="text-xs text-gray-600 mt-1">{r.explanation}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="p-4 pb-24 space-y-3">
                <Link href="/training/english-reading" className="block w-full py-3 rounded-2xl text-center font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg">Try Again</Link>
                <Link href="/" className="block w-full py-3 rounded-2xl text-center font-bold text-emerald-700 bg-emerald-100">返回首页</Link>
            </div>
        </div>
    );
}

export default function EnglishReadingResultPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" /></div>}>
            <ResultContent />
        </Suspense>
    );
}
