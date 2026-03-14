"use client"

import Link from "next/link"
import {
  BookOpen,
  MessageCircle,
  Mic,
  NotebookText,
  SpellCheck2,
  Flame,
  ArrowRight,
  Target,
  TrendingUp,
  Clock,
  Zap,
} from "lucide-react"

import { DailyGoalRing } from "@/components/dashboard/DailyGoalRing"
import { ProgressChart } from "@/components/dashboard/ProgressChart"
import { useProgress } from "@/hooks/useProgress"
import { getStudyFocus } from "@/lib/study-focus"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function getToday() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

const quickActions = [
  {
    href: "/chat",
    label: "AI Chat",
    description: "Practice conversation",
    icon: MessageCircle,
    gradient: "from-slate-100 to-white",
    border: "border-slate-200/70 dark:border-white/10",
    iconBg: "bg-emerald-50 dark:bg-emerald-500/12",
    iconColor: "text-emerald-600 dark:text-emerald-300",
    darkGradient: "dark:from-white/[0.04] dark:to-white/[0.02]",
  },
  {
    href: "/correct",
    label: "Correction",
    description: "Fix your Korean",
    icon: SpellCheck2,
    gradient: "from-slate-100 to-white",
    border: "border-slate-200/70 dark:border-white/10",
    iconBg: "bg-sky-50 dark:bg-sky-500/12",
    iconColor: "text-sky-600 dark:text-sky-300",
    darkGradient: "dark:from-white/[0.04] dark:to-white/[0.02]",
  },
  {
    href: "/diary",
    label: "Diary",
    description: "Writing feedback",
    icon: NotebookText,
    gradient: "from-slate-100 to-white",
    border: "border-slate-200/70 dark:border-white/10",
    iconBg: "bg-violet-50 dark:bg-violet-500/12",
    iconColor: "text-violet-600 dark:text-violet-300",
    darkGradient: "dark:from-white/[0.04] dark:to-white/[0.02]",
  },
  {
    href: "/speaking",
    label: "Speaking",
    description: "Shadow and repeat",
    icon: Mic,
    gradient: "from-slate-100 to-white",
    border: "border-slate-200/70 dark:border-white/10",
    iconBg: "bg-rose-50 dark:bg-rose-500/12",
    iconColor: "text-rose-600 dark:text-rose-300",
    darkGradient: "dark:from-white/[0.04] dark:to-white/[0.02]",
  },
  {
    href: "/vocab",
    label: "Vocabulary",
    description: "Review saved words",
    icon: BookOpen,
    gradient: "from-slate-100 to-white",
    border: "border-slate-200/70 dark:border-white/10",
    iconBg: "bg-amber-50 dark:bg-amber-500/12",
    iconColor: "text-amber-600 dark:text-amber-300",
    darkGradient: "dark:from-white/[0.04] dark:to-white/[0.02]",
  },
]

export default function DashboardPage() {
  const { chartData, dailyAverage, error, loading, stats } = useProgress()
  const studyFocus = getStudyFocus(stats)

  const val = (n: number | undefined, suffix = "") =>
    loading ? "—" : `${n ?? 0}${suffix}`

  return (
    <div className="space-y-5 lg:space-y-6">

      {/* ── Greeting banner ── */}
      <div className="relative overflow-hidden rounded-[2.25rem] border border-indigo-300/16 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.18),transparent_24%),radial-gradient(circle_at_78%_20%,rgba(244,114,182,0.1),transparent_20%),linear-gradient(180deg,#0b1220_0%,#151b33_26%,#2d3f78_58%,#6d6ccf_82%,#f39a74_100%)] p-5 text-white shadow-[0_30px_90px_rgba(15,23,42,0.42)] sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_30%,rgba(10,14,29,0.08)_100%)]" />
        <div className="pointer-events-none absolute -left-12 top-[-2rem] h-44 w-44 rounded-full bg-sky-300/10 blur-3xl" />
        <div className="pointer-events-none absolute right-[-3rem] top-10 h-56 w-56 rounded-full bg-fuchsia-300/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/18" />

        <div className="relative">
          <p className="text-[12px] font-semibold tracking-[0.1em] text-slate-100/72 sm:text-[13px]">
            {getToday()}
          </p>
          <h1 className="mt-2 text-[2rem] font-bold tracking-[-0.06em] text-white sm:text-[2.7rem]">
            {getGreeting()} 👋
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-7 text-slate-100/82 sm:text-[15px]">
            Your Korean tutor is ready when you are.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-[1.35rem] border border-white/12 bg-white/[0.08] px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.08] text-sky-100 ring-1 ring-white/10">
                  <Flame size={16} />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-100/72">
                  Streak
                </span>
              </div>
              <p className="mt-2.5 text-[1rem] font-semibold tracking-tight text-white">
                {val(stats.streakDays)} day streak
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-white/12 bg-white/[0.08] px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.08] text-sky-100 ring-1 ring-white/10">
                  <Target size={16} />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-100/72">
                  Daily Goal
                </span>
              </div>
              <p className="mt-2.5 text-[1rem] font-semibold tracking-tight text-white">
                {val(stats.dailyGoalProgress)}% of today&apos;s goal
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-white/12 bg-white/[0.08] px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.08] text-sky-100 ring-1 ring-white/10">
                  <Zap size={16} />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-100/72">
                  Vocabulary
                </span>
              </div>
              <p className="mt-2.5 text-[1rem] font-semibold tracking-tight text-white">
                {val(stats.wordsSaved)} words saved
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          Quick start
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
          {quickActions.map(({ href, label, description, icon: Icon, gradient, border, iconBg, iconColor, darkGradient }) => (
            <Link
              key={href}
              href={href}
              className={`group relative overflow-hidden rounded-[1.35rem] border ${border} bg-linear-to-br ${gradient} ${darkGradient} bg-white p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] dark:bg-transparent`}
            >
              <div className={`inline-flex rounded-[0.95rem] ${iconBg} p-2.5 ring-1 ring-black/5 dark:ring-white/8`}>
                <Icon size={18} strokeWidth={1.95} className={iconColor} />
              </div>
              <p className="mt-2.5 text-[13px] font-semibold text-slate-800 dark:text-white">
                {label}
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                {description}
              </p>
              <ArrowRight
                size={13}
                className="absolute right-3 top-3 text-slate-300 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-slate-600"
              />
            </Link>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-500 dark:bg-red-500/10">
          {error}
        </p>
      ) : null}

      {/* ── Progress chart + right column ── */}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <ProgressChart data={chartData} />

        <div className="space-y-4">
          <DailyGoalRing progress={stats.dailyGoalProgress} />

          <div className="rounded-[1.75rem] border border-emerald-200/70 bg-[linear-gradient(180deg,rgba(236,253,245,0.95),rgba(255,255,255,0.98))] p-5 shadow-sm dark:border-emerald-400/15 dark:bg-[linear-gradient(180deg,rgba(6,78,59,0.22),rgba(15,23,42,0.98))]">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-300">
              {studyFocus.badge}
            </p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              {studyFocus.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {studyFocus.description}
            </p>
            <Link
              href={studyFocus.ctaHref}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-600 dark:text-emerald-300 dark:hover:text-emerald-200"
            >
              {studyFocus.ctaLabel}
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Weekly summary */}
          <div className="rounded-[1.75rem] border border-slate-200/70 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-[#0e1724]">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                <TrendingUp size={16} strokeWidth={2} />
              </span>
              <h3 className="text-[13px] font-semibold text-slate-700 dark:text-white">
                This week
              </h3>
            </div>
            <div className="space-y-2.5">
              {[
                { icon: Clock, label: "Practice time", value: val(stats.weeklyMinutes, " min") },
                { icon: TrendingUp, label: "Daily average", value: val(dailyAverage, " min") },
                { icon: SpellCheck2, label: "Corrections", value: val(stats.correctionsThisWeek) },
                { icon: BookOpen, label: "Words saved", value: val(stats.wordsSaved) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-[1.15rem] bg-slate-50/80 px-3 py-2 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-[0.9rem] bg-white text-slate-600 ring-1 ring-slate-200/80 dark:bg-slate-900/80 dark:text-slate-300 dark:ring-white/8">
                      <Icon size={14} strokeWidth={1.9} />
                    </span>
                    <span className="text-[12px] font-medium text-slate-600 dark:text-slate-300">{label}</span>
                  </div>
                  <span className="text-[13px] font-semibold tabular-nums text-slate-900 dark:text-white">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
