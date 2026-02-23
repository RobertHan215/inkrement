"use client";

import { useState, useEffect, useCallback } from "react";

interface ClassicText {
    id: string;
    title: string;
    author: string;
    dynasty: string;
    content: string;
    translation: string;
    difficulty: number;
    gradeLevel: string;
}

const GRADES = ["预初", "初一", "初二", "初三"];

export default function TextsPage() {
    const [texts, setTexts] = useState<ClassicText[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [gradeFilter, setGradeFilter] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<ClassicText | null>(null);
    const [form, setForm] = useState({
        title: "", author: "", dynasty: "", content: "", translation: "", difficulty: "3", gradeLevel: "预初",
    });

    const fetchTexts = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (gradeFilter) params.set("grade", gradeFilter);
        fetch(`/api/admin/texts?role=admin&${params}`)
            .then((r) => r.json())
            .then((d) => setTexts(d.texts || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [search, gradeFilter]);

    useEffect(() => { fetchTexts(); }, [fetchTexts]);

    function openNew() {
        setEditing(null);
        setForm({ title: "", author: "", dynasty: "", content: "", translation: "", difficulty: "3", gradeLevel: "预初" });
        setShowForm(true);
    }

    function openEdit(t: ClassicText) {
        setEditing(t);
        setForm({
            title: t.title, author: t.author, dynasty: t.dynasty,
            content: t.content, translation: t.translation,
            difficulty: String(t.difficulty), gradeLevel: t.gradeLevel,
        });
        setShowForm(true);
    }

    async function handleSave() {
        const url = editing ? `/api/admin/texts/${editing.id}?role=admin` : "/api/admin/texts?role=admin";
        const method = editing ? "PUT" : "POST";
        await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        setShowForm(false);
        fetchTexts();
    }

    async function handleDelete(id: string) {
        if (!confirm("确定删除？")) return;
        await fetch(`/api/admin/texts/${id}?role=admin`, { method: "DELETE" });
        fetchTexts();
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-slate-900">📜 古文篇目管理</h1>
                <button
                    onClick={openNew}
                    className="px-4 py-2 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition-colors"
                >
                    + 新增篇目
                </button>
            </div>

            {/* 筛选栏 */}
            <div className="flex gap-3 mb-4">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="搜索标题/作者..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                    <option value="">全部年级</option>
                    {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>

            {/* 列表 */}
            {loading ? (
                <div className="h-40 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : texts.length === 0 ? (
                <div className="text-center py-12 text-slate-400">暂无篇目</div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-slate-600">标题</th>
                                <th className="text-left px-4 py-3 font-medium text-slate-600">作者</th>
                                <th className="text-left px-4 py-3 font-medium text-slate-600">朝代</th>
                                <th className="text-left px-4 py-3 font-medium text-slate-600">年级</th>
                                <th className="text-center px-4 py-3 font-medium text-slate-600">难度</th>
                                <th className="text-right px-4 py-3 font-medium text-slate-600">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {texts.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-900">{t.title}</td>
                                    <td className="px-4 py-3 text-slate-600">{t.author}</td>
                                    <td className="px-4 py-3 text-slate-600">{t.dynasty}</td>
                                    <td className="px-4 py-3 text-slate-600">{t.gradeLevel}</td>
                                    <td className="px-4 py-3 text-center">{"⭐".repeat(t.difficulty)}</td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <button onClick={() => openEdit(t)} className="text-cyan-600 hover:underline">编辑</button>
                                        <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:underline">删除</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 编辑弹窗 */}
            {showForm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto p-6 space-y-4">
                        <h2 className="text-lg font-bold text-slate-900">
                            {editing ? "编辑篇目" : "新增篇目"}
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="标题" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
                            <Field label="作者" value={form.author} onChange={(v) => setForm({ ...form, author: v })} />
                            <Field label="朝代" value={form.dynasty} onChange={(v) => setForm({ ...form, dynasty: v })} />
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">年级</label>
                                <select
                                    value={form.gradeLevel}
                                    onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                >
                                    {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">难度 (1-5)</label>
                            <input
                                type="range" min="1" max="5"
                                value={form.difficulty}
                                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                                className="w-full"
                            />
                            <p className="text-xs text-center">{"⭐".repeat(Number(form.difficulty))}</p>
                        </div>
                        <AreaField label="原文" value={form.content} onChange={(v) => setForm({ ...form, content: v })} />
                        <AreaField label="译文" value={form.translation} onChange={(v) => setForm({ ...form, translation: v })} />
                        <div className="flex gap-3 justify-end pt-2">
                            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
                                取消
                            </button>
                            <button onClick={handleSave} className="px-4 py-2 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="text-xs text-slate-500 mb-1 block">{label}</label>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
        </div>
    );
}

function AreaField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="text-xs text-slate-500 mb-1 block">{label}</label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />
        </div>
    );
}
