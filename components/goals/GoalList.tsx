"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence, type Variants } from "motion/react"
import { format } from "date-fns"
import {
  CalendarDays,
  ClipboardList,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Star,
  Target,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import EmojiIconPicker from "@/components/ui/emoji-icon-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { DeadlineStatusBadge } from "@/components/goals/DeadlineStatusBadge"
import { goalsApi } from "@/lib/api"
import { goalsQueryKey } from "@/hooks/useGoals"
import { calculateGoalDeadlineInfo, getDeadlineStatusStyling, type Goal, type SortOption } from "@/lib/goals"
import { getUserId } from "@/lib/auth-store"
import { cn } from "@/lib/utils"

export interface GoalListProps {
  goals: Goal[]
  isLoading: boolean
  isDeleting: string | null
  sortOption: SortOption
  onDeleteGoal: (goal: Goal, event: React.MouseEvent) => void
  onEditGoal?: (goal: Goal, event: React.MouseEvent) => void
  onToggleStar?: (goalId: string) => void
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: Math.min(i, 6) * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
  exit: { opacity: 0, scale: 0.92, y: 10, transition: { duration: 0.2 } },
  hover: { y: -6, transition: { type: "spring", stiffness: 400, damping: 25 } },
  tap: { scale: 0.98, transition: { type: "spring", stiffness: 600, damping: 40 } },
}

const progressGradient = (progress: number) =>
  progress >= 75
    ? "linear-gradient(90deg, #10b981, #059669)"
    : progress >= 40
      ? "linear-gradient(90deg, #3b82f6, #2563eb)"
      : "linear-gradient(90deg, #f59e0b, #ef4444)"

export function GoalList({
  goals,
  isLoading,
  onDeleteGoal,
  onEditGoal,
  onToggleStar,
}: GoalListProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const currentUser = getUserId()
  const [openingGoalId, setOpeningGoalId] = useState<string | null>(null)
  const [iconOverrides, setIconOverrides] = useState<Record<string, string | null>>({})
  const [viewMode, setViewMode] = useState<"grid" | "list">(() =>
    typeof localStorage !== "undefined" && localStorage.getItem("dg_goal_view") === "grid"
      ? "grid"
      : "list"
  )

  const toggleViewMode = () => {
    const next = viewMode === "grid" ? "list" : "grid"
    setViewMode(next)
    localStorage.setItem("dg_goal_view", next)
  }

  const getGoalIcon = (goal: Goal): string | null => {
    if (Object.prototype.hasOwnProperty.call(iconOverrides, goal.id)) return iconOverrides[goal.id]
    return goal.metadata?.icon ?? null
  }

  const handleIconChange = async (goal: Goal, emoji: string | null) => {
    setIconOverrides((prev) => ({ ...prev, [goal.id]: emoji }))
    try {
      // Send the full goal payload (mirroring the edit panel) so the backend
      // persists the metadata change — a metadata-only PUT was being dropped.
      const updated = await goalsApi.update(goal.id, {
        title: goal.title,
        description: goal.description ?? "",
        target_date: goal.target_date ?? null,
        no_duration: goal.no_duration ?? Boolean(goal.metadata?.no_duration),
        metadata: { ...goal.metadata, icon: emoji ?? undefined },
      })
      // Propagate the saved icon into the cached list so it survives refetch
      // and navigation instead of living only in local override state.
      queryClient.setQueryData<Goal[]>(goalsQueryKey(currentUser), (prev) =>
        prev?.map((g) => (g.id === goal.id ? { ...g, ...updated } : g))
      )
      toast.success(emoji ? "Icon updated" : "Icon removed")
    } catch {
      setIconOverrides((prev) => {
        const next = { ...prev }
        delete next[goal.id]
        return next
      })
      toast.error("Could not update icon")
    }
  }

  if (isLoading) {
    return (
      <div className={cn("grid gap-5", viewMode === "grid" ? "sm:grid-cols-2" : "grid-cols-1")}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className={cn("rounded-[2.5rem]", viewMode === "grid" ? "h-64" : "h-32")} />
        ))}
      </div>
    )
  }

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 rounded-[2.5rem] border-2 border-dashed border-border bg-card/30 py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Target size={36} strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-xl font-black tracking-tight">No goals found</h3>
          <p className="mt-2 max-w-sm text-sm font-medium text-muted-foreground">
            Try adjusting your filters or create a new goal to get started.
          </p>
        </div>
        <Button onClick={() => router.push("/goals/create")} size="lg" className="rounded-2xl font-bold shadow-xl shadow-emerald-600/20">
          <Plus size={18} strokeWidth={2.5} className="mr-2" /> New Goal
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleViewMode}
          className="h-10 gap-2 rounded-xl px-4 font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground"
        >
          {viewMode === "grid" ? <List size={16} /> : <LayoutGrid size={16} />}
          {viewMode === "grid" ? "List View" : "Grid View"}
        </Button>
      </div>

      <div className={cn("grid gap-6", viewMode === "grid" ? "sm:grid-cols-2" : "grid-cols-1")}>
        <AnimatePresence mode="popLayout">
          {goals.map((goal, i) => {
            const deadlineInfo = calculateGoalDeadlineInfo(goal)
            const deadlineStyling = deadlineInfo
              ? getDeadlineStatusStyling(deadlineInfo.status, deadlineInfo.urgencyLevel)
              : null
            const total = goal.taskCounts?.total ?? 0
            const done = goal.taskCounts?.completed ?? 0
            const progress = total > 0 ? Math.round((done / total) * 100) : 0
            const goalIcon = getGoalIcon(goal)
            const isOpening = openingGoalId === goal.id
            const isOwner = currentUser != null && String(currentUser) === String(goal.user_id)

            return (
              <motion.div
                key={goal.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                whileHover="hover"
                whileTap="tap"
                layout
                className="group relative"
              >
                <Card
                  className={cn(
                    "h-full overflow-hidden rounded-[1.75rem] border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 dark:bg-slate-900/40 sm:rounded-[2rem]",
                    isOpening && "ring-2 ring-primary",
                    deadlineStyling?.borderColor
                  )}
                  onClick={() => {
                    setOpeningGoalId(goal.id)
                    router.push(`/goals/${goal.id}`)
                  }}
                >
                  <CardContent className="flex h-full flex-col p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 flex-1 gap-5">
                        <div
                          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[1.5rem] bg-primary/10 text-3xl font-black text-primary transition-transform group-hover:scale-105"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <EmojiIconPicker
                            value={goalIcon}
                            onChange={(emoji) => handleIconChange(goal, emoji)}
                          >
                            <button className="flex h-full w-full items-center justify-center">
                              {goalIcon || goal.title.charAt(0).toUpperCase()}
                            </button>
                          </EmojiIconPicker>
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="rounded-full bg-primary/10 px-3 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary">
                              {goal.metadata?.goal_type || "General"}
                            </Badge>
                            {deadlineInfo && <DeadlineStatusBadge deadlineInfo={deadlineInfo} size="sm" />}
                          </div>
                          <h3 className="truncate text-xl font-black tracking-tight text-foreground transition-colors group-hover:text-primary">
                            {goal.title}
                          </h3>
                        </div>
                      </div>

                      {isOwner && (
                        <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onToggleStar?.(goal.id)}
                            className={cn(
                              "h-11 w-11 rounded-2xl",
                              goal.isStarred
                                ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                                : "text-muted-foreground/30 hover:bg-amber-500/10 hover:text-amber-500"
                            )}
                          >
                            <Star className={cn("h-5 w-5", goal.isStarred && "fill-current")} />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl hover:bg-foreground/5">
                                <MoreHorizontal className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 shadow-2xl">
                              <DropdownMenuItem className="rounded-xl font-bold" onSelect={(e) => onEditGoal?.(goal, e as any)}>
                                <Pencil className="mr-3 h-4 w-4 text-primary" /> Edit Goal
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-2" />
                              <DropdownMenuItem variant="destructive" className="rounded-xl font-bold" onSelect={(e) => onDeleteGoal(goal, e as any)}>
                                <Trash2 className="mr-3 h-4 w-4" /> Delete Goal
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto space-y-6 pt-8">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                          <span>Overall Progress</span>
                          <span className="text-sm font-black text-primary">{progress}%</span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-foreground/5 shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full rounded-full"
                            style={{ background: progressGradient(progress) }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-border/40 pt-5">
                        <div className="flex items-center gap-5">
                          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                            <ClipboardList size={16} className="text-primary/60" />
                            {done}/{total}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                            <CalendarDays size={16} className="text-primary/60" />
                            {goal.target_date ? format(new Date(goal.target_date), "MMM d") : "TBD"}
                          </div>
                        </div>
                        {isOpening && <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default GoalList
