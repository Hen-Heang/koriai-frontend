"use client"

import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  Clock,
  Flame,
  Sparkles,
  SpellCheck2,
  Target,
  TrendingUp,
  Zap,
  Cpu,
} from "lucide-react"
import { motion } from "motion/react"

import { DailyGoalRing } from "@/components/dashboard/DailyGoalRing"
import { ProgressChart } from "@/components/dashboard/ProgressChart"
import { StreakCard } from "@/components/dashboard/StreakCard"
import { Button as UIButton } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { useProgress } from "@/hooks/useProgress"
import { getStudyFocus } from "@/lib/study-focus"

function DashboardLoadingState() {
  return (
    <div className="space-y-6 pb-8 sm:space-y-8 sm:pb-10">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] 2xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <div className="overflow-hidden rounded-[2rem] bg-slate-950 p-5 shadow-2xl sm:rounded-[2.5rem] sm:p-8">
          <Skeleton className="h-4 w-36 bg-white/10" />
          <Skeleton className="mt-4 h-14 w-52 bg-white/10 sm:h-16 sm:w-72" />
          <Skeleton className="mt-4 h-5 w-full max-w-xl bg-white/10" />
          <Skeleton className="mt-2 h-5 w-4/5 max-w-lg bg-white/10" />

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4 sm:rounded-[1.75rem] sm:p-5">
                <Skeleton className="h-10 w-24 bg-white/10" />
                <Skeleton className="mt-4 h-10 w-24 bg-white/10" />
                <Skeleton className="mt-2 h-4 w-20 bg-white/10" />
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-13 w-full rounded-2xl bg-white/10 sm:h-14 sm:w-44" />
            <Skeleton className="h-13 w-full rounded-2xl bg-white/10 sm:h-14 sm:w-40" />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="rounded-[2rem] border border-border bg-card p-5 shadow-xl sm:rounded-[2.5rem] sm:p-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-4 h-9 w-3/4" />
            <Skeleton className="mt-3 h-5 w-full" />
            <Skeleton className="mt-2 h-5 w-5/6" />
            <div className="mt-6 space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="rounded-2xl border border-border bg-accent/5 px-4 py-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="mt-2 h-4 w-full" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-1">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-3xl border border-border bg-card px-5 py-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-11 w-11 rounded-2xl" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="mt-2 h-4 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-9 w-80 max-w-full" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="rounded-[1.8rem] border border-border bg-card p-5 shadow-sm sm:rounded-[2.25rem] sm:p-6">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <Skeleton className="mt-5 h-6 w-28" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-4/5" />
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-xl sm:rounded-[2.5rem]">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-4 h-8 w-48" />
          <Skeleton className="mt-6 h-72 w-full rounded-3xl" />
        </div>
        <div className="flex flex-col gap-6">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[1.8rem] border border-border bg-card p-5 shadow-xl sm:rounded-3xl sm:p-6">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="mx-auto mt-6 h-32 w-32 rounded-full sm:h-36 sm:w-36" />
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
              </div>
            </div>
            <div className="rounded-[1.8rem] border border-border bg-card p-5 shadow-xl sm:rounded-3xl sm:p-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-4 h-12 w-28" />
              <Skeleton className="mt-4 h-5 w-full" />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
              </div>
            </div>
          </div>
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-xl sm:rounded-[2.5rem]">
            <Skeleton className="h-5 w-40" />
            <div className="mt-6 space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <Skeleton key={item} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
import { cn } from "@/lib/utils"

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
    href: "/vocab",
    label: "Vocabulary",
    description: "Build your deck and practice sentences with each word.",
    icon: Cpu,
    gradient: "from-blue-600 to-indigo-600",
    glow: "shadow-blue-500/10",
    iconBg: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
    tag: "Core focus",
  },
  {
    href: "/flashcards",
    label: "Flashcards",
    description: "Review due words with spaced repetition.",
    icon: Zap,
    gradient: "from-amber-600 to-orange-600",
    glow: "shadow-amber-500/10",
    iconBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
    tag: "Daily review",
  },
  {
    href: "/daily-phrase",
    label: "Daily Phrase",
    description: "One workplace phrase a day — learn it, then write with it.",
    icon: Sparkles,
    gradient: "from-emerald-500 to-teal-500",
    glow: "shadow-emerald-500/10",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400",
    tag: "New today",
  },
  {
    href: "/correct",
    label: "Correction",
    description: "Write Korean sentences and get AI corrections.",
    icon: SpellCheck2,
    gradient: "from-sky-500 to-blue-500",
    glow: "shadow-sky-500/10",
    iconBg: "bg-sky-500/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400",
    tag: "Daily practice",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
} as const

export default function DashboardPage() {
  const { chartData, dailyAverage, error, loading, stats } = useProgress()
  const studyFocus = getStudyFocus(stats)

  if (loading) {
    return <DashboardLoadingState />
  }

  const LoadingVal = ({ className }: { className?: string }) => (
    <Skeleton className={className ?? "h-8 w-16 bg-white/20"} />
  )

  const val = (n: number | undefined, suffix = "", className?: string) =>
    loading ? <LoadingVal className={className} /> : `${n ?? 0}${suffix}`

  const goalPct = Math.min(stats.dailyGoalProgress, 100)
  const completionTone =
    stats.dailyGoalProgress >= 100
      ? "Goal Hit"
      : stats.dailyGoalProgress >= 65
        ? "On track"
        : "Needs focus"

  const nextSteps = [
    {
      href: "/correct",
      title: "Write one sentence",
      detail: "Describe your work day in Korean and get an instant AI correction.",
    },
    {
      href: "/flashcards",
      title: "Clear today's reviews",
      detail: "Knock out the words due in your spaced repetition queue.",
    },
    {
      href: "/daily-phrase",
      title: "Learn today's phrase",
      detail: "Pick up one workplace expression and write a sentence with it.",
    },
  ]

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 pb-8 sm:space-y-10 sm:pb-12"
    >
      {/* ── Hero ── */}
      <motion.section
        variants={itemVariants}
        className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] 2xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]"
      >

        {/* Left — greeting card */}
        <div className="group relative min-w-0 overflow-hidden rounded-[1.85rem] bg-slate-950 p-4 text-white shadow-2xl sm:rounded-[2.2rem] sm:p-6 lg:p-7 dark:border dark:border-white/5">
          {/* Animated Background Gradients */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
             <div className="absolute -left-1/4 -top-1/4 h-[150%] w-[150%] bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.15),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(245,158,11,0.1),transparent_35%),radial-gradient(circle_at_50%_90%,rgba(99,102,241,0.1),transparent_40%)]" />
             <motion.div 
               animate={{ 
                 scale: [1, 1.1, 1],
                 opacity: [0.1, 0.15, 0.1] 
               }}
               transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
               className="absolute -right-16 top-0 h-96 w-96 rounded-full bg-emerald-500 blur-[100px]" 
             />
          </div>

          {/* Korean watermark */}
          <div className="pointer-events-none absolute -right-6 bottom-0 hidden text-[9rem] font-black leading-none text-white/[0.03] select-none lg:block">
            한국어
          </div>

          <div className="relative flex h-full min-w-0 flex-col justify-between gap-6 sm:gap-7">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-5">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-400 sm:text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  {getToday()}
                </p>
                <h1 className="mt-3 text-[1.5rem] font-extrabold leading-none tracking-tight sm:text-[2.25rem] lg:text-[2.5rem] 2xl:text-[2.8rem]">
                  {getGreeting()}, 👋
                </h1>
                <div className="mt-3 max-w-xl text-[13px] font-medium leading-5 text-slate-400 sm:text-[14px] sm:leading-6 lg:text-base">
                  Ready to level up? You&apos;re <span className="text-white font-bold underline decoration-emerald-500/50 underline-offset-4">{val(stats.dailyGoalProgress, "%")}</span> through today&apos;s target.
                </div>
              </div>

              {/* Status pill */}
              <div className="flex w-full flex-col items-start gap-1 rounded-[1.2rem] border border-white/10 bg-slate-900/80 px-3.5 py-2.5 sm:w-auto sm:min-w-[10rem] sm:items-center sm:rounded-[1.5rem] sm:px-4.5 sm:py-3">
                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white/50">
                  <Sparkles size={12} className="text-emerald-400" />
                  Status
                </div>
                {loading ? (
                  <Skeleton className="h-7 w-20 bg-white/10" />
                ) : (
                  <p className="text-lg font-extrabold text-white sm:text-xl">{completionTone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
              {[
                {
                  icon: Flame,
                  label: "Streak",
                  value: val(stats.streakDays, "", "h-8 w-12 bg-white/10"),
                  sub: "Days active",
                  color: "from-orange-500/20 to-amber-500/5",
                  iconColor: "text-orange-400",
                },
                {
                  icon: Target,
                  label: "Progress",
                  value: val(stats.dailyGoalProgress, "%", "h-8 w-18 bg-white/10"),
                  sub: "Daily goal",
                  color: "from-emerald-500/20 to-teal-500/5",
                  iconColor: "text-emerald-400",
                  progress: goalPct,
                },
                {
                  icon: Zap,
                  label: "Saved",
                  value: val(stats.wordsSaved, "", "h-8 w-12 bg-white/10"),
                  sub: "New words",
                  color: "from-sky-500/20 to-blue-500/5",
                  iconColor: "text-sky-400",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={cn(
                    "group/stat relative overflow-hidden rounded-[1.2rem] border border-white/10 bg-gradient-to-br p-2.5 transition-all hover:border-white/20 sm:rounded-[1.4rem] sm:p-4",
                    stat.color
                  )}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-[0.85rem] bg-white/5 text-white ring-1 ring-white/10 transition-transform group-hover/stat:scale-110 sm:h-9 sm:w-9 sm:rounded-xl">
                      <stat.icon size={14} className={stat.iconColor} strokeWidth={2.5} />
                    </div>
                    <span className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-white/50 sm:inline">
                      {stat.label}
                    </span>
                  </div>
                  <div className="mt-2 text-xl font-extrabold text-white sm:mt-3 sm:text-[1.75rem] lg:text-[1.95rem]">
                    {stat.value}
                  </div>
                  <p className="mt-0.5 text-[10px] font-semibold text-slate-500 sm:text-[13px]">{stat.sub}</p>
                  
                  {stat.progress !== undefined && (
                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/5 sm:mt-5 sm:h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.progress}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* CTA row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-3">
              <UIButton asChild size="lg" className="h-12 w-full rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98] sm:h-13 sm:w-auto sm:px-7 sm:text-base">
                <Link href="/flashcards">
                  {stats.dueReviews > 0
                    ? `Start today's review (${stats.dueReviews} due)`
                    : "Start today's review"}
                  <ArrowRight size={18} className="ml-2" />
                </Link>
              </UIButton>
              <UIButton asChild variant="outline" size="lg" className="h-12 w-full rounded-2xl border-white/10 bg-white/5 px-5 text-sm font-black text-white backdrop-blur-md hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] sm:h-13 sm:w-auto sm:px-7 sm:text-base">
                <Link href={studyFocus.ctaHref}>{studyFocus.ctaLabel}</Link>
              </UIButton>
            </div>
          </div>
        </div>

        {/* Right — Focus & Compact Metrics */}
        <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
          {/* Study focus card */}
          <div className="flex-1 rounded-[1.8rem] border border-border bg-card p-4 shadow-xl dark:bg-slate-900/40 dark:backdrop-blur-md sm:rounded-[2.2rem] sm:p-6">
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400 sm:text-xs">
                {studyFocus.badge}
              </p>
            </div>
            <h2 className="mt-3 text-[1.5rem] font-black leading-tight tracking-tight text-foreground sm:mt-4 sm:text-[2rem] lg:text-[2.4rem]">
              {studyFocus.title}
            </h2>
            <p className="mt-3 text-[14px] font-medium leading-6 text-muted-foreground sm:text-[15px] sm:leading-7 lg:text-base">
              {studyFocus.description}
            </p>

            <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
              {nextSteps.map((step, i) => (
                <Link
                  key={`${step.href}-${i}`}
                  href={step.href}
                  className="group flex min-w-0 items-center gap-3 rounded-[1.2rem] border border-border bg-accent/5 p-3 transition-all hover:bg-accent/10 hover:translate-x-1 dark:bg-white/5 dark:hover:bg-white/10 sm:gap-4 sm:rounded-2xl sm:p-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-[13px] font-black text-emerald-600 dark:text-emerald-400 sm:h-10 sm:w-10 sm:text-base">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-black text-foreground sm:text-base lg:text-lg">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-[13px] font-medium leading-5 text-muted-foreground/70 sm:mt-1 sm:text-sm sm:leading-relaxed">
                      {step.detail}
                    </p>
                  </div>
                  <ArrowRight
                    size={18}
                    className="hidden shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-1 group-hover:text-emerald-500 sm:block"
                  />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Metrics grid */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-1">
            {[
              {
                label: "Practice time",
                value: val(stats.weeklyMinutes, " min", "h-6 w-14"),
                icon: Clock,
                tone: "text-sky-600 dark:text-sky-400",
                bg: "bg-sky-500/10 dark:bg-sky-400/10",
                sub: "This week",
              },
              {
                label: "Daily average",
                value: val(dailyAverage, " min", "h-6 w-14"),
                icon: TrendingUp,
                tone: "text-emerald-600 dark:text-emerald-400",
                bg: "bg-emerald-500/10 dark:bg-emerald-400/10",
                sub: "Per session",
              },
              {
                label: "Corrections",
                value: val(stats.correctionsThisWeek, "", "h-6 w-10"),
                icon: SpellCheck2,
                tone: "text-violet-600 dark:text-violet-400",
                bg: "bg-violet-500/10 dark:bg-violet-400/10",
                sub: "Last 7 days",
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className="flex items-center gap-3 rounded-[1.35rem] border border-border bg-card px-4 py-3.5 shadow-sm dark:bg-slate-900/40 sm:gap-4 sm:rounded-[1.7rem] sm:px-5 sm:py-4"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] ${metric.bg} ${metric.tone} sm:h-11 sm:w-11 sm:rounded-2xl`}>
                  <metric.icon size={19} strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-black tabular-nums leading-none text-foreground sm:text-xl">
                    {metric.value}
                  </div>
                  <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px] sm:tracking-widest">
                    {metric.label}
                  </p>
                  <p className="mt-1 text-[12px] font-bold text-muted-foreground/60">{metric.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Quick Actions ── */}
      <motion.section variants={itemVariants}>
        <div className="mb-5 sm:mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/60 sm:text-xs sm:tracking-[0.35em]">
            Quick Start
          </p>
          <h2 className="mt-2 text-[1.65rem] font-black tracking-tight text-foreground sm:mt-3 sm:text-[2.2rem] lg:text-4xl">
            What are we practicing today?
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              aria-label={`Open ${action.label}: ${action.description}`}
              className={cn(
                "group relative overflow-hidden rounded-[1.35rem] border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-emerald-500/10 dark:bg-slate-900/40 sm:rounded-[1.8rem] sm:p-5 lg:rounded-[2.1rem] lg:p-6"
              )}
            >
              {/* top accent strip */}
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${action.gradient} opacity-0 transition-opacity group-hover:opacity-100`} />

              {action.tag && (
                <span className={`absolute right-4 top-4 rounded-full bg-gradient-to-r ${action.gradient} px-3 py-1 text-[10px] font-black uppercase text-white shadow-lg`}>
                  {action.tag}
                </span>
              )}

              <div className={`inline-flex rounded-[1rem] ${action.iconBg} p-3 shadow-sm ring-1 ring-border/50 transition-transform group-hover:scale-110 sm:rounded-2xl sm:p-4`}>
                <action.icon size={20} strokeWidth={2.5} />
              </div>
              <h3 className="mt-4 text-[15px] font-black text-foreground sm:mt-5 sm:text-lg lg:text-xl">
                {action.label}
              </h3>
              <p className="mt-2 text-[13px] font-medium leading-5 text-muted-foreground line-clamp-3 sm:text-[14px] sm:leading-6">
                {action.description}
              </p>
              
              <div className="mt-5 flex items-center justify-between sm:mt-6">
                <span className={`bg-gradient-to-r bg-clip-text text-[11px] font-black uppercase tracking-[0.18em] text-transparent sm:text-sm sm:tracking-widest ${action.gradient}`}>
                  Launch
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/50 text-muted-foreground/40 transition-all group-hover:bg-emerald-500 group-hover:text-white">
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* ── Visual Charts & Cards ── */}
      <motion.section
        variants={itemVariants}
        className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] sm:gap-8"
      >
        <ProgressChart data={chartData} />

        <div className="flex flex-col gap-6 sm:gap-8">
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 xl:grid-cols-1">
            <DailyGoalRing
              progress={stats.dailyGoalProgress}
              reviewsToday={stats.reviewsToday}
              correctionsToday={stats.correctionsToday}
            />
            <StreakCard days={stats.streakDays} wordsSaved={stats.wordsSaved} />
          </div>

          {/* Weekly summary component */}
          <div className="rounded-[2.5rem] border border-border bg-card p-6 shadow-xl dark:bg-slate-900/40 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TrendingUp size={22} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                  Retention
                </p>
                <h3 className="text-xl font-black text-foreground">
                  Weekly Momentum
                </h3>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {[
                {
                  icon: Clock,
                  label: "Practice time",
                  value: val(stats.weeklyMinutes, " min", "h-5 w-14"),
                  max: 300,
                  num: stats.weeklyMinutes,
                  color: "from-sky-500 to-sky-400",
                },
                {
                  icon: TrendingUp,
                  label: "Daily average",
                  value: val(dailyAverage, " min", "h-5 w-14"),
                  max: 60,
                  num: dailyAverage,
                  color: "from-emerald-500 to-emerald-400",
                },
                {
                  icon: SpellCheck2,
                  label: "Corrections",
                  value: val(stats.correctionsThisWeek, "", "h-5 w-10"),
                  max: 20,
                  num: stats.correctionsThisWeek,
                  color: "from-violet-500 to-violet-400",
                },
                {
                  icon: BookOpen,
                  label: "Words saved",
                  value: val(stats.wordsSaved, "", "h-5 w-10"),
                  max: 100,
                  num: stats.wordsSaved,
                  color: "from-amber-500 to-amber-400",
                },
              ].map((row) => (
                <div key={row.label} className="rounded-2xl bg-accent/5 px-5 py-4 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-background text-muted-foreground/60 ring-1 ring-border">
                        <row.icon size={14} strokeWidth={2.5} />
                      </span>
                      <span className="text-[15px] font-bold text-foreground">
                        {row.label}
                      </span>
                    </div>
                    <div className="text-base font-black tabular-nums text-foreground">
                      {row.value}
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted/20">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((row.num / row.max) * 100, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.8 }}
                      className={cn("h-full rounded-full bg-gradient-to-r shadow-[0_0_8px_rgba(0,0,0,0.1)]", row.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {error ? (
        <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-4 text-sm font-black text-destructive text-center">
          {error}
        </p>
      ) : null}
    </motion.div>
  )
}
