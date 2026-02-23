"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface GrammarError { original: string; corrected: string; rule: string; }
interface Dimension { name: string; score: number; comment: string; }
interface Feedback {
    total_score: number;
    grade: string;
    summary: string;
    dimensions: Dimension[];
    grammar_errors: GrammarError[];
    suggestions: string[];
    rewrite_example: string;
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

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>;
    if (!feedback) return <div className="min-h-screen flex flex-col items-center justify-center p-6"><p className="text-gray-500">未找到批改结果</p><Link href="/" className="mt-4 text-cyan-600 underline">返回首页</Link></div>;

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
            <header className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white px-4 py-6 safe-top">
                <Link href="/" className="text-sm opacity-80 hover:opacity-100">← 返回首页</Link>
                <h1 className="text-xl font-bold mt-2">✍️ English Writing Result</h1>
            </header>

            <div className="p-4 -mt-2">
                <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                    <div className="text-5xl font-bold text-blue-600">{feedback.total_score}</div>
                    <div className="text-sm text-gray-500 mt-1">Grade {feedback.grade}</div>
                    <p className="text-sm text-gray-600 mt-3">{feedback.summary}</p>
                </div>
            </div>

            <div className="p-4 space-y-3">
                <h3 className="font-bold text-gray-800">📊 分项评分</h3>
                {feedback.dimensions.map((d, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-700">{d.name}</span>
                            <span className={`font-bold ${d.score >= 80 ? "text-green-600" : d.score >= 60 ? "text-amber-600" : "text-red-600"}`}>{d.score}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                            <div className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-500" style={{ width: `${d.score}%` }} />
                        </div>
                        <p className="text-xs text-gray-500">{d.comment}</p>
                    </div>
                ))}
            </div>

            {feedback.grammar_errors.length > 0 && (
                <div className="p-4 space-y-2">
                    <h3 className="font-bold text-gray-800">🔴 语法错误</h3>
                    {feedback.grammar_errors.map((ge, i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                            <p className="text-sm">
                                <span className="line-through text-red-500">{ge.original}</span>
                                <span className="mx-2">→</span>
                                <span className="text-green-600 font-medium">{ge.corrected}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">💡 {ge.rule}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="p-4 space-y-2">
                <h3 className="font-bold text-gray-800">💡 改进建议</h3>
                {feedback.suggestions.map((s, i) => (
                    <div key={i} className="bg-white rounded-xl p-3 shadow-sm flex gap-2 items-start">
                        <span className="text-blue-500 text-sm mt-0.5">•</span>
                        <p className="text-sm text-gray-600">{s}</p>
                    </div>
                ))}
            </div>

            {feedback.rewrite_example && (
                <div className="p-4">
                    <h3 className="font-bold text-gray-800 mb-2">📝 Model Paragraph</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                        <p className="text-sm text-gray-700 italic leading-relaxed" style={{ fontFamily: "'Georgia', serif" }}>{feedback.rewrite_example}</p>
                    </div>
                </div>
            )}

            <div className="p-4 pb-24 space-y-3">
                <Link href="/training/english-writing" className="block w-full py-3 rounded-2xl text-center font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg">Rewrite &amp; Resubmit</Link>
                <Link href="/" className="block w-full py-3 rounded-2xl text-center font-bold text-blue-700 bg-blue-100">返回首页</Link>
            </div>
        </div>
    );
}

export default function EnglishWritingResultPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>}>
            <ResultContent />
        </Suspense>
    );
}
