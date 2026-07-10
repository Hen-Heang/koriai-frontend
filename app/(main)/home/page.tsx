"use client"

import { Flame } from "lucide-react"
import { motion } from "motion/react"
import dynamic from "next/dynamic"

import { AiSuggestionCard } from "@/components/home/AiSuggestionCard"
import { ContinueCards } from "@/components/home/ContinueCards"
import { MissionCard } from "@/components/home/MissionCard"
import { QuickActions } from "@/components/home/QuickActions"
import { DailyGoalRing } from "@/components/dashboard/DailyGoalRing"
import { FirstRunBanner } from "@/components/dashboard/FirstRunBanner"
import { GoalsOverview } from "@/components/dashboard/GoalsOverview"
import { ProgressIntelligence } from "@/components/dashboard/ProgressIntelligence"
import { Skeleton } from "@/components/ui/skeleton"
import { useProgress } from "@/hooks/useProgress"
import { containerVariants, itemVariants } from "@/lib/motion"

// recharts is heavy; defer it so the Home shell + above-the-fold cards paint
// first, then the weekly graph streams in — same pattern as /dashboard.
const ProgressChart = dynamic(
  () => import("@/components/dashboard/ProgressChart").then((m) => m.ProgressChart),
  {
    ssr: false,
    loading: () => <div className="h-64 w-full animate-pulse rounded-2xl bg-muted/20" />,
  }
)

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function HomeLoadingState() {
  return (
    <div className="space-y-6 pb-12 sm:space-y-8">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  )
}

export default function HomePage() {
  const { chartData, error, loading, stats } = useProgress()

  if (loading) return <HomeLoadingState />

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-12 sm:space-y-10"
    >
      {/* ── Hero strip ── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-sm font-medium text-muted-foreground">Your AI growth platform</p>
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

      {/* ── Continue where you left off ── */}
      <motion.div variants={itemVariants}>
        <ContinueCards />
      </motion.div>

      {/* ── Mission + AI suggestion ── */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <MissionCard />
        <AiSuggestionCard stats={stats} />
      </motion.div>

      {/* ── Learning summary + Productivity summary ── */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <DailyGoalRing
          progress={stats.dailyGoalProgress}
          reviewsToday={stats.reviewsToday}
          correctionsToday={stats.correctionsToday}
          className="h-full"
        />
        <GoalsOverview />
      </motion.div>

      {/* ── Weekly progress ── */}
      <motion.div variants={itemVariants}>
        <ProgressChart data={chartData} />
      </motion.div>

      {/* ── Needs attention ── */}
      <motion.div variants={itemVariants}>
        <ProgressIntelligence />
      </motion.div>

      {/* ── Quick actions ── */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/70">Quick actions</h2>
        <QuickActions />
      </motion.div>

      {error ? (
        <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-4 text-center text-sm font-bold text-destructive">
          {error}
        </p>
      ) : null}
    </motion.div>
  )
}
