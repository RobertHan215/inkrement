"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const MODULE_INFO: Record<string, { title: string; subtitle: string; emoji: string; href: string; gradient: string }> = {
  chinese_writing: {
    title: "中文写作",
    subtitle: "AI 出题 · 智能批改",
    emoji: "✍️",
    href: "/training/chinese-writing",
    gradient: "from-cyan-500 to-teal-500",
  },
  classical_reading: {
    title: "古文阅读",
    subtitle: "经典篇目 · 逐句讲解",
    emoji: "📜",
    href: "/training/classical-reading",
    gradient: "from-emerald-500 to-green-500",
  },
  english_writing: {
    title: "英语写作",
    subtitle: "话题写作 · 语法纠错",
    emoji: "📝",
    href: "/training/english-writing",
    gradient: "from-blue-500 to-indigo-500",
  },
  english_reading: {
    title: "英语阅读",
    subtitle: "阅读理解 · 词汇积累",
    emoji: "📖",
    href: "/training/english-reading",
    gradient: "from-violet-500 to-purple-500",
  },
};

const ALL_MODULES = Object.entries(MODULE_INFO);

interface TodayPlan {
  id: string;
  module: string;
  status: string;
  latestSubmission: { id: string; score: number; grade: string } | null;
}

export default function HomePage() {
  const [plan, setPlan] = useState<TodayPlan | null>(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/training/today")
      .then((res) => res.json())
      .then((data) => {
        if (data.plan) setPlan(data.plan);
        if (data.user?.name) setUserName(data.user.name);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const todayModule = plan ? MODULE_INFO[plan.module] : null;
  const isCompleted = plan?.status === "completed";

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="gradient-hero text-white px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">日进</h1>
              <p className="text-cyan-100 text-sm mt-0.5">
                每日一练，日进一步
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
              {userName ? userName[0] : "👋"}
            </div>
          </div>

          {/* 今日任务卡片 */}
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 mt-4">
            {loading ? (
              <div className="h-12 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : todayModule ? (
              <Link
                href={
                  isCompleted && plan?.latestSubmission
                    ? `${todayModule.href}/result?submissionId=${plan.latestSubmission.id}`
                    : todayModule.href
                }
                className="flex items-center justify-between"
              >
                <div>
                  <p className="text-cyan-100 text-xs">今日训练</p>
                  <p className="text-white text-lg font-semibold mt-0.5">
                    {todayModule.emoji} {todayModule.title}
                    <span className="text-sm font-normal text-cyan-100 ml-2">
                      {isCompleted
                        ? `✓ ${plan?.latestSubmission?.score ?? ""}分`
                        : "· 待完成"}
                    </span>
                  </p>
                </div>
                <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ) : (
              <div>
                <p className="text-cyan-100 text-xs">今日训练</p>
                <p className="text-white text-sm mt-1">加载失败</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Module Cards */}
      <section className="px-4 -mt-3 max-w-lg mx-auto">
        <div className="grid grid-cols-2 gap-3">
          {ALL_MODULES.map(([id, mod], index) => (
            <Link
              key={id}
              href={mod.href}
              className="card p-4 flex flex-col gap-3 animate-fade-in"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center text-2xl shadow-sm`}
              >
                {mod.emoji}
              </div>
              <div>
                <h3 className="font-semibold text-sm text-text">
                  {mod.title}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {mod.subtitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="px-4 mt-6 max-w-lg mx-auto">
        <h2 className="text-sm font-semibold text-text-secondary mb-3 px-1">
          学习概览
        </h2>
        <div className="card p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">0</p>
              <p className="text-xs text-text-muted mt-1">连续打卡</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary">
                {isCompleted ? 1 : 0}
              </p>
              <p className="text-xs text-text-muted mt-1">本周完成</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">0</p>
              <p className="text-xs text-text-muted mt-1">错题待复习</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dev Mode Indicator */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed top-2 right-2 bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-mono z-50 opacity-60">
          DEV
        </div>
      )}
    </div>
  );
}
