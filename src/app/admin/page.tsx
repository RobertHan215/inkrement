"use client";

import { useState, useEffect } from "react";

interface Stats {
    totalStudents: number;
    totalPlans: number;
    totalCompleted: number;
    totalTexts: number;
}

export default function AdminPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/stats?role=admin")
            .then((r) => r.json())
            .then(setStats)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">管理后台概览</h1>

            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : stats ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="学生人数" value={stats.totalStudents} emoji="👨‍🎓" color="bg-cyan-50 text-cyan-700" />
                    <StatCard label="训练计划" value={stats.totalPlans} emoji="📋" color="bg-blue-50 text-blue-700" />
                    <StatCard label="已完成" value={stats.totalCompleted} emoji="✅" color="bg-emerald-50 text-emerald-700" />
                    <StatCard label="古文篇目" value={stats.totalTexts} emoji="📜" color="bg-amber-50 text-amber-700" />
                </div>
            ) : (
                <p className="text-slate-500">加载失败</p>
            )}
        </div>
    );
}

function StatCard({ label, value, emoji, color }: { label: string; value: number; emoji: string; color: string }) {
    return (
        <div className={`rounded-xl p-5 ${color}`}>
            <p className="text-3xl mb-2">{emoji}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm mt-1 opacity-70">{label}</p>
        </div>
    );
}
