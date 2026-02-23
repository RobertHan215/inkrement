import Link from "next/link";

const modules = [
  {
    id: "chinese_writing",
    title: "中文写作",
    subtitle: "AI 出题 · 智能批改",
    emoji: "✍️",
    href: "/training/chinese-writing",
    gradient: "from-cyan-500 to-teal-500",
  },
  {
    id: "classical_reading",
    title: "古文阅读",
    subtitle: "经典篇目 · 逐句讲解",
    emoji: "📜",
    href: "/training/classical-reading",
    gradient: "from-emerald-500 to-green-500",
  },
  {
    id: "english_writing",
    title: "英语写作",
    subtitle: "话题写作 · 语法纠错",
    emoji: "📝",
    href: "/training/english-writing",
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    id: "english_reading",
    title: "英语阅读",
    subtitle: "阅读理解 · 词汇积累",
    emoji: "📖",
    href: "/training/english-reading",
    gradient: "from-violet-500 to-purple-500",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="gradient-hero text-white px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">日进</h1>
              <p className="text-cyan-100 text-sm mt-0.5">每日一练，日进一步</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
              👋
            </div>
          </div>

          {/* 今日进度卡片 */}
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-100 text-xs">今日训练</p>
                <p className="text-white text-lg font-semibold mt-0.5">
                  未完成 <span className="text-sm font-normal text-cyan-100">· 每日一练</span>
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center">
                <span className="text-white/60 text-xs">○</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Module Cards */}
      <section className="px-4 -mt-3 max-w-lg mx-auto">
        <div className="grid grid-cols-2 gap-3">
          {modules.map((mod, index) => (
            <Link
              key={mod.id}
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
              <p className="text-2xl font-bold text-secondary">0</p>
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
