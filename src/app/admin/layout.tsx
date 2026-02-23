"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    { href: "/admin", label: "概览", icon: "📊" },
    { href: "/admin/texts", label: "古文篇目", icon: "📜" },
    { href: "/admin/ai-config", label: "AI 配置", icon: "🤖" },
    { href: "/admin/users", label: "用户管理", icon: "👥" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-56 bg-slate-900 text-white flex flex-col shrink-0">
                <div className="px-5 py-5 border-b border-slate-700">
                    <h1 className="text-lg font-bold">日进 管理后台</h1>
                    <p className="text-slate-400 text-xs mt-0.5">Inkrement Admin</p>
                </div>
                <nav className="flex-1 py-3">
                    {navItems.map((item) => {
                        const isActive = item.href === "/admin"
                            ? pathname === "/admin"
                            : pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${isActive
                                        ? "bg-slate-700/50 text-white font-medium border-r-2 border-cyan-400"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                                    }`}
                            >
                                <span>{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="px-5 py-4 border-t border-slate-700">
                    <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
                        ← 返回首页
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
