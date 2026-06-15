"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowRight, ClipboardList, Plus, Target } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { DeadlineStatusBadge } from "@/components/goals/DeadlineStatusBadge"
import { useGoals } from "@/hooks/useGoals"
import { calculateGoalDeadlineInfo, type Goal } from "@/lib/goals"
import { cn } from "@/lib/utils"

const progressGradient = (progress: number) =>
  progress >= 75
    ? "linear-gradient(90deg, #10b981, #059669)"
    : progress >= 40
      ? "linear-gradient(90deg, #3b82f6, #2563eb)"
      : "linear-gradient(90deg, #f59e0b, #ef4444)"

const taskProgress = (goal: Goal) =>
  goal.taskCounts && goal.taskCounts.total > 0
    ? Math.round((goal.taskCounts.completed / goal.taskCounts.total) * 100)
    : 0

// Compact, dashboard-sized view of the user's active goals. Reuses the shared
// useGoals query (cache-shared with /goals), shows the top few by sort order.
export function GoalsOverview({ className, limit = 3 }: { className?: string; limit?: number }) {
  const { sortedGoals, isLoading } = useGoals()

  const activeGoals = useMemo(
    () => sortedGoals.filter((g) => g.status !== "completed" && g.status !== "archived"),
    [sortedGoals]
  )
  const visible = activeGoals.slice(0, limit)

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-3.5 border-b border-border/60 bg-background/30 px-5 py-4">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-2.5">
          <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-foreground">Your Goals</h2>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            {isLoading ? "Loading…" : `${activeGoals.length} active`}
          </p>
        </div>
        <Link
          href="/goals"
          className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex-1 space-y-2 p-4">
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Target size={28} strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-black tracking-tight">No active goals</h3>
            <p className="mb-5 mt-1 max-w-[220px] text-xs font-medium leading-relaxed text-muted-foreground">
              Set a goal, break it into tasks, and track every deadline in one place.
            </p>
            <Link
              href="/goals/create"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-sm transition-colors hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" /> Create a goal
            </Link>
          </div>
        ) : (
          visible.map((goal) => {
            const deadlineInfo = calculateGoalDeadlineInfo(goal)
            const progress = taskProgress(goal)
            const icon = goal.metadata?.icon
            return (
              <Link
                key={goal.id}
                href={`/goals/${goal.id}`}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-background/40 px-3 py-3 transition-colors hover:bg-accent/50"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl font-black text-primary">
                  {icon || (goal.title ? goal.title.charAt(0).toUpperCase() : "G")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                      {goal.title}
                    </p>
                    <span className="shrink-0 text-xs font-black tabular-nums text-primary">
                      {progress}%
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/[0.08]">
                      <div
                        className="h-full origin-left rounded-full transition-transform duration-700"
                        style={{
                          width: `${progress}%`,
                          background: progressGradient(progress),
                        }}
                      />
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-muted-foreground">
                      <ClipboardList className="h-3 w-3" />
                      {goal.taskCounts
                        ? `${goal.taskCounts.completed}/${goal.taskCounts.total}`
                        : "0/0"}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <DeadlineStatusBadge deadlineInfo={deadlineInfo} size="sm" />
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}

export default GoalsOverview
