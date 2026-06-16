"use client"

import Link from "next/link"
import {
  ArrowRight,
  Flame,
  Sparkles,
  SpellCheck2,
  Target,
  Zap,
  Cpu,
} from "lucide-react"
import { motion } from "motion/react"

import { DailyGoalRing } from "@/components/dashboard/DailyGoalRing"
import { GoalsOverview } from "@/components/dashboard/GoalsOverview"
import { ProgressChart } from "@/components/dashboard/ProgressChart"
import { StreakCard } from "@/components/dashboard/StreakCard"
import { TodaysTasks } from "@/components/goals/TodaysTasks"
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
    description: "Build your deck and clear due words with spaced repetition.",
    icon: Cpu,
    gradient: "from-blue-600 to-indigo-600",
    glow: "shadow-blue-500/10",
    iconBg: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
    tag: "Core focus",
  },
  {
    href: "/daily-phrase",
    label: "Daily Phrase",
    description: "One workplace phrase a day — learn it, then write with it.",
    icon: Sparkles,
    gradient: "from-blue-500 to-indigo-500",
    glow: "shadow-blue-500/10",
    iconBg: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
    tag: "New today",
  },
  {
    href: "/chat?prompt=" + encodeURIComponent("Please correct my Korean writing and explain each change in English.\n\nMy text:\n"),
    label: "Correction",
    description: "Write Korean sentences and get AI corrections from your coach.",
    icon: SpellCheck2,
    gradient: "from-sky-500 to-blue-500",
    glow: "shadow-sky-500/10",
    iconBg: "bg-sky-500/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400",
    tag: "Daily practice",
  },
  {
    href: "/goals",
    label: "Goals & Tasks",
    description: "Set goals, plan tasks, and track every deadline.",
    icon: Target,
    gradient: "from-blue-500 to-blue-600",
    glow: "shadow-blue-500/10",
    iconBg: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
    tag: "Plan ahead",
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
  const { chartData, error, loading, stats } = useProgress()
  const studyFocus = getStudyFocus(stats)

  if (loading) {
    return <DashboardLoadingState />
  }

  const goalPct = Math.min(stats.dailyGoalProgress, 100)

  const nextSteps = [
    {
      href: "/goals",
      title: "Review your goals",
      detail: "Check what's due and plan your next tasks.",
    },
    {
      href: "/chat?prompt=" + encodeURIComponent("Please correct my Korean writing and explain each change in English.\n\nMy text:\n"),
      title: "Write one sentence",
      detail: "Describe your work day in Korean and get an instant AI correction.",
    },
    {
      href: "/vocab",
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
      className="space-y-8 pb-12 sm:space-y-10"
    >
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 sm:text-[11px]">
            {getToday()}
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            {getGreeting()}, 👋
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
            <Flame size={14} className="text-orange-500" />
            <span className="text-xs font-bold sm:text-sm">{stats.streakDays} day streak</span>
          </div>
          <UIButton asChild size="sm" className="h-9 rounded-full bg-blue-600 px-4 font-bold hover:bg-blue-500">
            <Link href="/vocab">
              Continue
              <ArrowRight size={14} className="ml-1" />
            </Link>
          </UIButton>
        </div>
      </motion.div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 sm:gap-6">
        
        {/* Main Hero Card (8 cols) */}
        <motion.div 
          variants={itemVariants}
          className="relative col-span-1 overflow-hidden rounded-[2rem] border border-border bg-slate-950 p-6 text-white shadow-2xl sm:rounded-[2.5rem] md:col-span-8 lg:p-10"
        >
          {/* Decorative Gradients */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
             <div className="absolute -left-1/4 -top-1/4 h-[150%] w-[150%] bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.15),transparent_40%)]" />
             <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-500/10 blur-[100px]" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-400">
              <Sparkles size={12} />
              Personal Plan
            </div>
            <h2 className="mt-6 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
              {studyFocus.title}
            </h2>
            <p className="mt-4 max-w-xl text-[13px] font-medium leading-relaxed text-slate-400 sm:text-base">
              {studyFocus.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <UIButton asChild size="lg" className="h-11 rounded-2xl bg-blue-600 px-6 font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-500 sm:h-12">
                <Link href={studyFocus.ctaHref}>{studyFocus.ctaLabel}</Link>
              </UIButton>
              <UIButton asChild variant="outline" size="lg" className="h-11 rounded-2xl border-white/10 bg-white/5 px-6 font-bold backdrop-blur-md hover:bg-white/10 sm:h-12">
                <Link href="/vocab">Review Vocab</Link>
              </UIButton>
            </div>
          </div>

          {/* Floating Korean Text Watermark */}
          <div className="pointer-events-none absolute -bottom-10 -right-10 hidden text-[12rem] font-black leading-none text-white/[0.02] select-none xl:block">
            한국어
          </div>
        </motion.div>

        {/* Daily Goal Bento (4 cols) */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-4">
          <DailyGoalRing
            progress={stats.dailyGoalProgress}
            reviewsToday={stats.reviewsToday}
            correctionsToday={stats.correctionsToday}
            className="h-full"
          />
        </motion.div>

        {/* Quick Actions (Full width grid) */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-12">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group relative overflow-hidden rounded-[2rem] border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900/40"
              >
                <div className={cn("inline-flex rounded-2xl p-3", action.iconBg)}>
                  <action.icon size={20} strokeWidth={2.5} />
                </div>
                <h3 className="mt-4 text-base font-black text-foreground">{action.label}</h3>
                <p className="mt-1 text-xs font-medium text-muted-foreground line-clamp-2">{action.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", action.gradient.split(' ')[0].replace('from-', 'text-'))}>
                    Start
                  </span>
                  <ArrowRight size={14} className="text-muted-foreground/30 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Progress Chart (7 cols) */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-7 lg:col-span-8">
          <ProgressChart data={chartData} />
        </motion.div>

        {/* Streak & Stats Bento (5 cols) */}
        <motion.div variants={itemVariants} className="col-span-1 space-y-6 md:col-span-5 lg:col-span-4">
          <StreakCard days={stats.streakDays} wordsSaved={stats.wordsSaved} />
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm dark:bg-slate-900/40">
            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/50">Next Steps</h3>
            <div className="mt-4 space-y-4">
              {nextSteps.map((step, i) => (
                <Link key={i} href={step.href} className="group flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-[12px] font-black group-hover:bg-blue-500 group-hover:text-white">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">{step.title}</p>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground/20 group-hover:translate-x-1 group-hover:text-blue-500" />
                </Link>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Goals & Tasks (Full width) */}
        <motion.div variants={itemVariants} className="col-span-1 grid gap-6 md:col-span-12 md:grid-cols-2">
          <GoalsOverview />
          <TodaysTasks />
        </motion.div>

      </div>

      {error ? (
        <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-4 text-sm font-bold text-destructive text-center">
          {error}
        </p>
      ) : null}
    </motion.div>
  )
}
