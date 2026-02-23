"use client";

import { useState, useEffect } from "react";

interface UserInfo {
    id: string;
    phone: string;
    role: string;
    grade: string | null;
    name: string | null;
    createdAt: string;
    _count: { trainingPlans: number; submissions: number };
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
    student: { label: "学生", color: "bg-cyan-100 text-cyan-800" },
    parent: { label: "家长", color: "bg-purple-100 text-purple-800" },
    admin: { label: "管理员", color: "bg-amber-100 text-amber-800" },
};

export default function UsersPage() {
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/users?role=admin")
            .then((r) => r.json())
            .then((d) => setUsers(d.users || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">👥 用户管理</h1>

            {loading ? (
                <div className="h-40 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-12 text-slate-400">暂无用户</div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-slate-600">姓名</th>
                                <th className="text-left px-4 py-3 font-medium text-slate-600">手机号</th>
                                <th className="text-left px-4 py-3 font-medium text-slate-600">角色</th>
                                <th className="text-left px-4 py-3 font-medium text-slate-600">年级</th>
                                <th className="text-center px-4 py-3 font-medium text-slate-600">训练数</th>
                                <th className="text-center px-4 py-3 font-medium text-slate-600">提交数</th>
                                <th className="text-left px-4 py-3 font-medium text-slate-600">注册时间</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map((u) => {
                                const roleInfo = ROLE_LABELS[u.role] || { label: u.role, color: "bg-gray-100 text-gray-800" };
                                return (
                                    <tr key={u.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-900">{u.name || "—"}</td>
                                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{u.phone}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${roleInfo.color}`}>
                                                {roleInfo.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{u.grade || "—"}</td>
                                        <td className="px-4 py-3 text-center text-slate-600">{u._count.trainingPlans}</td>
                                        <td className="px-4 py-3 text-center text-slate-600">{u._count.submissions}</td>
                                        <td className="px-4 py-3 text-slate-500 text-xs">
                                            {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
