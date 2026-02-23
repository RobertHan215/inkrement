"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface WritingTopic {
    title: string;
    title_cn: string;
    type: string;
    description: string;
    description_cn: string;
    requirements: string;
    word_count: { min: number; max: number };
    useful_expressions: string[];
}

export default function EnglishWritingPage() {
    const router = useRouter();
    const [planId, setPlanId] = useState<string | null>(null);
    const [topic, setTopic] = useState<WritingTopic | null>(null);
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    const wordCount = content
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length;

    useEffect(() => {
        fetch("/api/training/today")
            .then((r) => r.json())
            .then((data) => {
                if (data.plan) {
                    setPlanId(data.plan.id);
                    if (data.plan.status === "completed" && data.plan.submissions?.[0]) {
                        router.push(`/training/english-writing/result?submissionId=${data.plan.submissions[0].id}`);
                        return;
                    }
                }
                return fetch("/api/training/english-writing/topic", { method: "POST" });
            })
            .then((r) => r?.json())
            .then((data) => {
                if (data?.topic) setTopic(data.topic);
            })
            .catch(() => { })
            .finally(() => setLoading(false));

        // 加载草稿
        const draft = localStorage.getItem("english-writing-draft");
        if (draft) setContent(draft);
    }, [router]);

    useEffect(() => {
        if (content) localStorage.setItem("english-writing-draft", content);
    }, [content]);

    async function handleSubmit() {
        if (!planId || !topic) return;
        if (wordCount < topic.word_count.min) {
            alert(`文章至少需要 ${topic.word_count.min} 个词！当前 ${wordCount} 词。`);
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/training/english-writing/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId, content, topicTitle: topic.title }),
            });
            const data = await res.json();
            if (data.submission) {
                localStorage.removeItem("english-writing-draft");
                router.push(`/training/english-writing/result?submissionId=${data.submission.id}`);
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
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!topic) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <p className="text-gray-500">今日不是英文写作训练日</p>
                <Link href="/" className="mt-4 text-cyan-600 underline">返回首页</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
            <header className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white px-4 py-6 safe-top">
                <Link href="/" className="text-sm opacity-80 hover:opacity-100">← 返回</Link>
                <h1 className="text-xl font-bold mt-2">✍️ English Writing</h1>
                <p className="text-sm opacity-80 mt-1">{topic.title_cn}</p>
            </header>

            <div className="p-4 space-y-4">
                {/* 题目 */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
                    <h2 className="font-bold text-blue-800 text-lg mb-1">{topic.title}</h2>
                    <p className="text-gray-700 text-sm mb-2">{topic.description}</p>
                    <p className="text-gray-500 text-xs mb-3">{topic.description_cn}</p>

                    <div className="text-xs text-gray-500 whitespace-pre-line bg-blue-50 rounded-xl p-3">
                        <strong>Requirements:</strong>
                        <br />
                        {topic.requirements}
                    </div>

                    {topic.useful_expressions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                            <span className="text-xs text-blue-600">💡 Useful:</span>
                            {topic.useful_expressions.map((exp, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                    {exp}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* 写作区 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Start writing your essay here..."
                        rows={12}
                        className="w-full border-0 focus:outline-none text-sm leading-relaxed resize-none"
                        style={{ fontFamily: "'Georgia', serif" }}
                    />
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className={`text-sm font-medium ${wordCount >= topic.word_count.min ? "text-green-600" : "text-gray-400"}`}>
                            {wordCount} / {topic.word_count.min}-{topic.word_count.max} words
                        </span>
                        <span className="text-xs text-gray-400">草稿自动保存</span>
                    </div>
                </div>

                {/* 提交 */}
                <button
                    onClick={handleSubmit}
                    disabled={submitting || wordCount < topic.word_count.min}
                    className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                    {submitting ? "Grading..." : "Submit Essay"}
                </button>
            </div>
        </div>
    );
}
