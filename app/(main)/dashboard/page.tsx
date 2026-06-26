"use client"

import Link from "next/link"
import { useSyncExternalStore } from "react"
import {
  ArrowRight,
  Flame,
  Sparkles,
  SpellCheck2,
  Target,
  Cpu,
} from "lucide-react"
import { motion } from "motion/react"
import dynamic from "next/dynamic"

import { DailyGoalRing } from "@/components/dashboard/DailyGoalRing"
import { FirstRunBanner } from "@/components/dashboard/FirstRunBanner"
import { GoalsOverview } from "@/components/dashboard/GoalsOverview"
import { ProgressIntelligence } from "@/components/dashboard/ProgressIntelligence"
import { StreakCard } from "@/components/dashboard/StreakCard"
import { ExamCountdownBanner } from "@/components/interview/ExamCountdownBanner"
import { Button as UIButton } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { useProgress } from "@/hooks/useProgress"
import { getStudyFocus } from "@/lib/study-focus"
import {
  getBestStreak,
  getBestStreakServerSnapshot,
  subscribeBestStreak,
} from "@/lib/vocab-best-streak-store"

// recharts is heavy; defer it so the dashboard shell + above-the-fold cards
// paint first, then the chart streams in.
const ProgressChart = dynamic(
  () => import("@/components/dashboard/ProgressChart").then((m) => m.ProgressChart),
  {
    ssr: false,
    loading: () => <div className="h-72 w-full animate-pulse rounded-2xl bg-muted/20 sm:h-80" />,
  }
)

function DashboardLoadingState() {
  return (
    <div className="space-y-6 pb-8 sm:space-y-8 sm:pb-10">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] 2xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <div className="overflow-hidden rounded-2xl bg-slate-950 p-5 shadow-sm sm:p-8">
          <Skeleton className="h-4 w-36 bg-white/10" />
          <Skeleton className="mt-4 h-14 w-52 bg-white/10 sm:h-16 sm:w-72" />
          <Skeleton className="mt-4 h-5 w-full max-w-xl bg-white/10" />
          <Skeleton className="mt-2 h-5 w-4/5 max-w-lg bg-white/10" />

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
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
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
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
              <div key={item} className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
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
            <div key={item} className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <Skeleton className="mt-5 h-6 w-28" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-4/5" />
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-4 h-8 w-48" />
          <Skeleton className="mt-6 h-72 w-full rounded-2xl" />
        </div>
        <div className="flex flex-col gap-6">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="mx-auto mt-6 h-32 w-32 rounded-full sm:h-36 sm:w-36" />
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-4 h-12 w-28" />
              <Skeleton className="mt-4 h-5 w-full" />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
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
// Personal-best vocab quiz streak, server-backed so it syncs across devices.
// Written by the vocab ReviewSession.
function BestQuizStreakCard() {
  const best = useSyncExternalStore(subscribeBestStreak, getBestStreak, getBestStreakServerSnapshot)

  return (
    <Link
      href="/vocab"
      className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-orange-500/40 dark:bg-slate-900/40"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
        <Flame size={20} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xl font-bold tabular-nums text-foreground">
          {best ?? "—"}
          {best ? <span className="ml-1.5 text-sm font-medium text-muted-foreground">in a row</span> : null}
        </p>
        <p className="text-xs font-medium text-muted-foreground/70">Best quiz streak</p>
      </div>
      <ArrowRight size={16} className="text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-500" />
    </Link>
  )
}

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

const CORRECTION_PROMPT =
  "/chat?prompt=" +
  encodeURIComponent("Please correct my Korean writing and explain each change in English.\n\nMy text:\n")

const quickActions = [
  {
    href: "/vocab",
    label: "Vocabulary",
    description: "Build your deck and clear due words with spaced repetition.",
    icon: Cpu,
  },
  {
    href: "/practice",
    label: "Today",
    description: "Today's phrase, due reviews, and your daily mission in one place.",
    icon: Sparkles,
  },
  {
    href: CORRECTION_PROMPT,
    label: "Correction",
    description: "Write Korean sentences and get AI corrections from your coach.",
    icon: SpellCheck2,
  },
  {
    href: "/goals",
    label: "Goals & Tasks",
    description: "Set goals, plan tasks, and track every deadline.",
    icon: Target,
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

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-12 sm:space-y-10"
    >
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {getToday()}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {getGreeting()} 👋
          </h1>
        </div>
        <div className="flex items-center gap-1.5 self-start rounded-full border border-border bg-card px-3 py-1.5 sm:self-auto">
          <Flame size={14} className="text-orange-500" />
          <span className="text-sm font-medium text-foreground">{stats.streakDays} day streak</span>
        </div>
      </motion.div>

      {/* First-run onboarding — shown once to users with no activity yet */}
      {stats.wordsSaved === 0 && stats.streakDays === 0 && (
        <motion.div variants={itemVariants}>
          <FirstRunBanner />
        </motion.div>
      )}

      {/* ── Exam countdown reminder ── */}
      <motion.div variants={itemVariants}>
        <ExamCountdownBanner />
      </motion.div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 sm:gap-6">
        
        {/* Main Hero Card (8 cols) */}
        <motion.div
          variants={itemVariants}
          className="relative col-span-1 overflow-hidden rounded-2xl border border-border bg-slate-950 p-6 text-white shadow-sm md:col-span-8 lg:p-9"
        >
          {/* Single subtle accent — the hero is the page's only focal point */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/15 blur-[90px]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-blue-300">
              <Sparkles size={12} />
              Personal plan
            </div>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
              {studyFocus.title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
              {studyFocus.description}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <UIButton asChild size="lg" className="h-11 rounded-xl bg-blue-600 px-6 font-semibold hover:bg-blue-500 sm:h-12">
                <Link href={studyFocus.ctaHref}>{studyFocus.ctaLabel}</Link>
              </UIButton>
              <UIButton asChild variant="outline" size="lg" className="h-11 rounded-xl border-white/10 bg-white/5 px-6 font-semibold hover:bg-white/10 sm:h-12">
                <Link href="/chat">Ask the coach</Link>
              </UIButton>
            </div>
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
                className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-blue-500/40 dark:bg-slate-900/40"
              >
                <div className="inline-flex rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                  <action.icon size={20} strokeWidth={2} />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{action.label}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{action.description}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                  Start
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
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
          <BestQuizStreakCard />
          <ProgressIntelligence />
        </motion.div>

        {/* Goals overview — full width, analytics only */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-12">
          <GoalsOverview />
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
