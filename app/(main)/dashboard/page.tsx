"use client"

import Link from "next/link"
import {
  BookOpen,
  MessageCircle,
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
    gradient: "from-emerald-500/15 to-teal-500/8",
    border: "border-emerald-200/60 dark:border-emerald-500/20",
    iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    darkGradient: "dark:from-emerald-500/15 dark:to-teal-500/5",
  },
  {
    href: "/correct",
    label: "Correction",
    description: "Fix your Korean",
    icon: SpellCheck2,
    gradient: "from-sky-500/15 to-blue-500/8",
    border: "border-sky-200/60 dark:border-sky-500/20",
    iconBg: "bg-sky-100 dark:bg-sky-500/20",
    iconColor: "text-sky-600 dark:text-sky-400",
    darkGradient: "dark:from-sky-500/15 dark:to-blue-500/5",
  },
  {
    href: "/diary",
    label: "Diary",
    description: "Writing feedback",
    icon: NotebookText,
    gradient: "from-violet-500/15 to-purple-500/8",
    border: "border-violet-200/60 dark:border-violet-500/20",
    iconBg: "bg-violet-100 dark:bg-violet-500/20",
    iconColor: "text-violet-600 dark:text-violet-400",
    darkGradient: "dark:from-violet-500/15 dark:to-purple-500/5",
  },
  {
    href: "/vocab",
    label: "Vocabulary",
    description: "Review saved words",
    icon: BookOpen,
    gradient: "from-amber-500/15 to-orange-500/8",
    border: "border-amber-200/60 dark:border-amber-500/20",
    iconBg: "bg-amber-100 dark:bg-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    darkGradient: "dark:from-amber-500/15 dark:to-orange-500/5",
  },
]

export default function DashboardPage() {
  const { chartData, dailyAverage, error, loading, stats } = useProgress()

  const val = (n: number | undefined, suffix = "") =>
    loading ? "—" : `${n ?? 0}${suffix}`

  return (
    <div className="space-y-5 lg:space-y-6">

      {/* ── Greeting banner ── */}
      <div className="relative overflow-hidden rounded-[1.75rem] bg-linear-to-br from-emerald-500 via-teal-500 to-sky-500 p-5 text-white shadow-lg shadow-emerald-500/20 sm:p-6">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-6 left-1/3 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

        <div className="relative">
          <p className="text-[12px] font-medium text-emerald-100 sm:text-[13px]">
            {getToday()}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-[1.75rem]">
            {getGreeting()} 👋
          </h1>
          <p className="mt-1 text-[13px] text-emerald-100 sm:text-[14px]">
            Your Korean tutor is ready when you are.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5">
              <Flame size={14} className="text-amber-300" />
              <span className="text-[13px] font-semibold">
                {val(stats.streakDays)} day streak
              </span>
            </div>
            <div className="h-3.5 w-px bg-white/30" />
            <div className="flex items-center gap-1.5">
              <Target size={14} className="text-sky-200" />
              <span className="text-[13px] font-semibold">
                {val(stats.dailyGoalProgress)}% of today&apos;s goal
              </span>
            </div>
            <div className="h-3.5 w-px bg-white/30" />
            <div className="flex items-center gap-1.5">
              <Zap size={14} className="text-yellow-200" />
              <span className="text-[13px] font-semibold">
                {val(stats.wordsSaved)} words saved
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          Quick start
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map(({ href, label, description, icon: Icon, gradient, border, iconBg, iconColor, darkGradient }) => (
            <Link
              key={href}
              href={href}
              className={`group relative overflow-hidden rounded-2xl border ${border} bg-linear-to-br ${gradient} ${darkGradient} bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 dark:bg-transparent`}
            >
              <div className={`inline-flex rounded-xl ${iconBg} p-2.5`}>
                <Icon size={18} strokeWidth={1.7} className={iconColor} />
              </div>
              <p className="mt-3 text-[13px] font-semibold text-slate-800 dark:text-white">
                {label}
              </p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                {description}
              </p>
              <ArrowRight
                size={13}
                className="absolute right-3 top-3 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-600"
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

          {/* Weekly summary */}
          <div className="rounded-[1.75rem] border border-slate-200/70 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-[#0e1724]">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp size={15} strokeWidth={1.8} className="text-emerald-500" />
              <h3 className="text-[13px] font-semibold text-slate-700 dark:text-white">
                This week
              </h3>
            </div>
            <div className="space-y-3">
              {[
                { icon: Clock, label: "Practice time", value: val(stats.weeklyMinutes, " min") },
                { icon: TrendingUp, label: "Daily average", value: val(dailyAverage, " min") },
                { icon: SpellCheck2, label: "Corrections", value: val(stats.correctionsThisWeek) },
                { icon: BookOpen, label: "Words saved", value: val(stats.wordsSaved) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={13} strokeWidth={1.6} className="text-slate-400 dark:text-slate-500" />
                    <span className="text-[12.5px] text-slate-500 dark:text-slate-400">{label}</span>
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
