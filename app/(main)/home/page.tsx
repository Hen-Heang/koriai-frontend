"use client"

import { useQuery } from "@tanstack/react-query"
import { Flame, Sparkles, Target, TreeDeciduous, Trophy } from "lucide-react"
import { motion } from "motion/react"

import { FirstRunBanner } from "@/components/dashboard/FirstRunBanner"
import { WorkspacePosterCard } from "@/components/home/WorkspacePosterCard"
import { Skeleton } from "@/components/ui/skeleton"
import { achievementsApi } from "@/lib/api"
import { useGoals } from "@/hooks/useGoals"
import { useHabits } from "@/hooks/useHabits"
import { useProgress } from "@/hooks/useProgress"
import { useRecoveryEvents, useRecoveryHabits } from "@/hooks/useRecovery"
import { getUserId } from "@/lib/auth-store"
import { calculateGoalDeadlineInfo } from "@/lib/goals"
import { daysSince } from "@/lib/recovery"
import { containerVariants, itemVariants } from "@/lib/motion"
import { getLastVisited } from "@/lib/last-visited"

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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-72 w-full rounded-3xl" />
        <Skeleton className="h-72 w-full rounded-3xl" />
        <Skeleton className="h-72 w-full rounded-3xl" />
        <Skeleton className="h-72 w-full rounded-3xl" />
      </div>
    </div>
  )
}

export default function HomePage() {
  const { loading, stats } = useProgress()
  const { sortedGoals, isLoading: goalsLoading } = useGoals()
  const { activeHabits, loading: habitsLoading } = useHabits()
  const { activeHabit: recoveryHabit, loading: recoveryHabitsLoading } = useRecoveryHabits()
  const { lastSlipAt, loading: recoveryEventsLoading } = useRecoveryEvents(recoveryHabit?.id ?? null)
  const userId = getUserId()
  const { data: achievementsSummary, isPending: achievementsLoading } = useQuery({
    queryKey: ["achievements-summary", userId],
    queryFn: () => achievementsApi.getSummary(),
    enabled: userId != null,
  })

  if (
    loading ||
    goalsLoading ||
    achievementsLoading ||
    habitsLoading ||
    recoveryHabitsLoading ||
    (recoveryHabit && recoveryEventsLoading)
  ) {
    return <HomeLoadingState />
  }

  const activeGoals = sortedGoals.filter((g) => g.status !== "completed" && g.status !== "archived")
  const overdueGoals = activeGoals.filter((g) => calculateGoalDeadlineInfo(g).status === "overdue")
  const completedGoals = sortedGoals.filter((g) => g.status === "completed")
  const level = achievementsSummary?.level
  const unlockedCount = achievementsSummary?.unlockedCount ?? 0
  const totalCount = achievementsSummary?.totalCount ?? 0
  const recoveryStreakDays = recoveryHabit ? daysSince(recoveryHabit.startedAt, lastSlipAt) : null

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

      {/* ── Big entry points ── */}
      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
        <WorkspacePosterCard
          href={getLastVisited("learning", "/practice")}
          eyebrow="Learning"
          title="Korean Learning"
          description="Vocab, grammar corrections, listening, reading, and exam prep — pick up today's practice."
          icon={Sparkles}
          accentColor="blue"
          stats={[
            { label: "Day streak", value: String(stats.streakDays) },
            { label: "Due today", value: String(stats.dueReviews) },
            { label: "Words saved", value: String(stats.wordsSaved) },
          ]}
          cta="Continue learning"
        />
        <WorkspacePosterCard
          href={getLastVisited("productivity", "/dashboard")}
          eyebrow="Productivity"
          title="Goal Setting"
          description="Plan goals, break them into tasks, and track deadlines — see what needs you today."
          icon={Target}
          accentColor="emerald"
          stats={[
            { label: "Active goals", value: String(activeGoals.length) },
            {
              label: overdueGoals.length > 0 ? "Overdue" : "Completed",
              value: overdueGoals.length > 0 ? String(overdueGoals.length) : String(completedGoals.length),
            },
          ]}
          cta="Continue planning"
        />
        <WorkspacePosterCard
          href={getLastVisited("progress", "/achievements")}
          eyebrow="Progress"
          title="Your Progress"
          description="Level, XP, and badges earned across every module — see how far you've come."
          icon={Trophy}
          accentColor="amber"
          stats={[
            { label: "Level", value: level ? String(level.level) : "1" },
            { label: "XP", value: level ? String(level.totalXp) : "0" },
            { label: "Badges", value: `${unlockedCount}/${totalCount}` },
          ]}
          cta="View achievements"
        />
        <WorkspacePosterCard
          href="/growth/habits"
          eyebrow="Growth"
          title="Habits & Recovery"
          description="Build identity-based habits and track recovery, one calm check-in at a time."
          icon={TreeDeciduous}
          accentColor="violet"
          stats={[
            { label: "Active habits", value: String(activeHabits.length) },
            ...(recoveryStreakDays !== null ? [{ label: "Recovery streak", value: `${recoveryStreakDays}d` }] : []),
          ]}
          cta="Open Growth"
        />
      </motion.div>
    </motion.div>
  )
}
