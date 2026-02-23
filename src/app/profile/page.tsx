"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface UserInfo {
    name: string | null;
    phone: string;
    grade: string | null;
    role: string;
}

export default function ProfilePage() {
    const [user, setUser] = useState<UserInfo | null>(null);

    useEffect(() => {
        fetch("/api/training/today")
            .then((r) => r.json())
            .then((d) => {
                if (d.user) setUser(d.user);
            })
            .catch(() => { });
    }, []);

    return (
        <div className="min-h-screen bg-bg">
            <header className="bg-gradient-to-br from-slate-700 to-slate-900 text-white px-6 pt-12 pb-8 rounded-b-3xl">
                <div className="max-w-lg mx-auto">
                    <h1 className="text-xl font-bold">我的</h1>
                    <div className="flex items-center gap-4 mt-5">
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl">
                            {user?.name?.[0] || "👤"}
                        </div>
                        <div>
                            <p className="text-lg font-semibold">{user?.name || "加载中..."}</p>
                            <p className="text-slate-300 text-sm">{user?.grade || ""}</p>
                            <p className="text-slate-400 text-xs mt-0.5 font-mono">
                                {user?.phone ? user.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") : ""}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-5 space-y-3">
                <MenuItem href="/calendar" icon="📅" label="打卡日历" />
                <MenuItem href="/history" icon="📋" label="历史记录" />
                <MenuItem href="/mistakes" icon="📝" label="错题本" />
                {user?.role === "parent" && (
                    <MenuItem href="/parent" icon="👨‍👩‍👧" label="家长端" />
                )}
                {user?.role === "admin" && (
                    <MenuItem href="/admin" icon="⚙️" label="管理后台" />
                )}
            </div>

            {process.env.NODE_ENV === "development" && (
                <div className="max-w-lg mx-auto px-4 py-4">
                    <div className="card p-4">
                        <p className="text-xs text-text-muted mb-2">开发模式快速切换</p>
                        <div className="flex gap-2">
                            <Link href="/" className="text-xs px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg">学生端</Link>
                            <Link href="/parent" className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg">家长端</Link>
                            <Link href="/admin" className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg">管理后台</Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function MenuItem({ href, icon, label }: { href: string; icon: string; label: string }) {
    return (
        <Link href={href} className="card flex items-center gap-3 p-4 hover:shadow-md transition-shadow">
            <span className="text-xl">{icon}</span>
            <span className="text-sm font-medium text-text flex-1">{label}</span>
            <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
        </Link>
    );
}
