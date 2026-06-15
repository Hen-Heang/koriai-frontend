"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, type Variants } from "motion/react"
import { format } from "date-fns"
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Edit,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Star,
  Target,
  Trash2,
} from "lucide-react"

import EmojiIconPicker from "@/components/ui/emoji-icon-picker"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DeadlineStatusBadge } from "@/components/goals/DeadlineStatusBadge"
import { goalsApi } from "@/lib/api"
import { calculateGoalDeadlineInfo, getDeadlineStatusStyling, type Goal, type SortOption } from "@/lib/goals"
import { getUserId } from "@/lib/auth-store"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export interface GoalListProps {
  goals: Goal[]
  isLoading: boolean
  isDeleting: string | null
  sortOption: SortOption
  onDeleteGoal: (goal: Goal, event: React.MouseEvent) => void
  onEditGoal?: (goal: Goal, event: React.MouseEvent) => void
  onToggleStar?: (goalId: string) => void
}

// Spring-based card variants — enter once; hover/tap use their own spring.
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.94 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: Math.min(i, 6) * 0.05, duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  }),
  exit: { opacity: 0, scale: 0.92, y: 10, transition: { duration: 0.18 } },
  hover: { y: -9, transition: { type: "spring", stiffness: 380, damping: 26 } },
  tap: { scale: 0.975, transition: { type: "spring", stiffness: 600, damping: 40 } },
}

const progressGradient = (progress: number) =>
  progress >= 75
    ? "linear-gradient(90deg, #10b981, #059669)"
    : progress >= 40
      ? "linear-gradient(90deg, #3b82f6, #2563eb)"
      : "linear-gradient(90deg, #f59e0b, #ef4444)"

function GoalListComponent({
  goals,
  isLoading,
  onDeleteGoal,
  onEditGoal,
  onToggleStar,
}: GoalListProps) {
  const router = useRouter()
  const currentUser = getUserId()
  const [openingGoalId, setOpeningGoalId] = useState<string | null>(null)
  const [iconOverrides, setIconOverrides] = useState<Record<string, string | null>>({})
  // Default to single-row list view; only use grid if the user explicitly picked it.
  const [viewMode, setViewMode] = useState<"grid" | "list">(() =>
    typeof localStorage !== "undefined" && localStorage.getItem("dg_goal_view") === "grid"
      ? "grid"
      : "list"
  )

  const getGoalIcon = (goal: Goal): string | null => {
    if (Object.prototype.hasOwnProperty.call(iconOverrides, goal.id)) return iconOverrides[goal.id]
    return goal.metadata?.icon ?? null
  }

  // Optimistic inline icon update; persist via goalsApi, roll back on failure.
  const handleIconChange = async (goal: Goal, emoji: string | null) => {
    setIconOverrides((prev) => ({ ...prev, [goal.id]: emoji }))
    try {
      await goalsApi.update(goal.id, { metadata: { ...goal.metadata, icon: emoji ?? undefined } })
      toast.success(emoji ? `Icon updated to ${emoji}` : "Icon removed")
    } catch {
      setIconOverrides((prev) => {
        const next = { ...prev }
        delete next[goal.id]
        return next
      })
      toast.error("Failed to save icon")
    }
  }

  const goToGoal = (goalId: string) => {
    setOpeningGoalId(goalId)
    router.push(`/goals/${goalId}`)
  }

  const changeView = (mode: "grid" | "list") => {
    setViewMode(mode)
    try {
      localStorage.setItem("dg_goal_view", mode)
    } catch {
      /* ignore */
    }
  }

  // Per-user star/pin toggle. Filled amber = starred (pinned to top).
  const renderStarButton = (goal: Goal) => {
    if (!onToggleStar) return null
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              onToggleStar(goal.id)
            }}
            aria-label={goal.isStarred ? "Unstar goal" : "Star goal"}
            aria-pressed={!!goal.isStarred}
            data-ignore-navigation="true"
            className={cn(
              "h-10 w-10 rounded-xl transition-all",
              goal.isStarred
                ? "text-amber-500 hover:bg-amber-500/10 hover:text-amber-600"
                : "text-foreground/35 hover:bg-amber-500/10 hover:text-amber-500"
            )}
          >
            <Star className={cn("h-5 w-5 transition-all", goal.isStarred && "fill-current")} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{goal.isStarred ? "Unpin from top" : "Pin to top"}</TooltipContent>
      </Tooltip>
    )
  }

  // Owner-only actions menu (edit / delete).
  const renderActionsMenu = (goal: Goal) => {
    if (currentUser == null || String(currentUser) !== String(goal.user_id)) return null
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary"
            aria-label="Goal actions"
            data-ignore-navigation="true"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48" data-ignore-navigation="true">
          {onEditGoal && (
            <DropdownMenuItem
              onSelect={(e) => {
                e.stopPropagation()
                onEditGoal(goal, e as unknown as React.MouseEvent)
              }}
              className="cursor-pointer font-semibold"
            >
              <Edit className="mr-2 h-4 w-4 text-primary" /> Edit goal
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => {
              e.stopPropagation()
              onDeleteGoal(goal, e as unknown as React.MouseEvent)
            }}
            className="cursor-pointer font-semibold"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete goal
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Renders the goal icon: emoji override → goal first-letter. Owners can edit it.
  const renderIcon = (goal: Goal, sizeClass: string, textClass: string) => {
    const emoji = getGoalIcon(goal)
    const isOwner = currentUser != null && String(currentUser) === String(goal.user_id)
    const content = emoji ? (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-2xl bg-primary/10 transition-all duration-300 select-none group-hover:bg-primary/20",
          sizeClass,
          textClass
        )}
      >
        {emoji}
      </div>
    ) : (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-black text-primary transition-all duration-300 group-hover:bg-primary/20",
          sizeClass
        )}
      >
        {goal.title ? goal.title.charAt(0).toUpperCase() : "G"}
      </div>
    )

    if (!isOwner) return content

    return (
      <EmojiIconPicker value={emoji} onChange={(e) => handleIconChange(goal, e)} align="start">
        <div
          className="group/iconbtn relative shrink-0 cursor-pointer"
          data-ignore-navigation="true"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/55 opacity-0 transition-opacity group-hover/iconbtn:opacity-100">
            <Pencil className="h-4 w-4 text-white drop-shadow-md" />
          </div>
        </div>
      </EmojiIconPicker>
    )
  }

  // ── Loading skeletons ──
  if (isLoading) {
    return (
      <div
        className={cn(
          "grid gap-5 sm:gap-6",
          viewMode === "list" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
        )}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4"
          >
            <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="flex min-w-0 flex-col gap-2">
              <Skeleton className="h-5 w-36 rounded-lg" />
              <Skeleton className="h-4 w-20 rounded-md" />
            </div>
            <Skeleton className="h-2 flex-1 rounded-full" />
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  // ── Empty state ──
  if (goals.length === 0) {
    return (
      <Card className="rounded-[2rem] border-dashed">
        <CardContent className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Target size={56} strokeWidth={1.5} />
          </div>
          <h3 className="mb-2 text-2xl font-black tracking-tight">No goals yet</h3>
          <p className="mb-8 max-w-sm text-sm font-medium leading-relaxed text-muted-foreground">
            Create your first goal to start breaking it into scheduled tasks and tracking progress.
          </p>
          <Button onClick={() => router.push("/goals/create")} size="lg">
            <Plus size={18} strokeWidth={2.5} /> Create a goal
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Split (already starred-first sorted) goals into "Pinned" + rest, with section
  // headers only when both groups are non-empty on the current page.
  const starredGoals = goals.filter((g) => g.isStarred)
  const restGoals = goals.filter((g) => !g.isStarred)
  const showSections = starredGoals.length > 0 && restGoals.length > 0
  type GoalRow =
    | { kind: "header"; id: string; label: string; count: number }
    | { kind: "goal"; goal: Goal }
  const rows: GoalRow[] = showSections
    ? [
        { kind: "header", id: "hdr-pinned", label: "Pinned", count: starredGoals.length },
        ...starredGoals.map((g) => ({ kind: "goal", goal: g }) as GoalRow),
        { kind: "header", id: "hdr-others", label: "All Goals", count: restGoals.length },
        ...restGoals.map((g) => ({ kind: "goal", goal: g }) as GoalRow),
      ]
    : goals.map((g) => ({ kind: "goal", goal: g }) as GoalRow)

  // Navigation guard: ignore clicks that originate inside [data-ignore-navigation].
  const navIfAllowed = (e: React.MouseEvent, goalId: string) => {
    let node = e.target as HTMLElement | null
    const current = e.currentTarget as HTMLElement
    while (node && node !== current) {
      if (node.getAttribute?.("data-ignore-navigation") === "true") return
      node = node.parentElement
    }
    goToGoal(goalId)
  }

  return (
    <TooltipProvider delayDuration={300}>
      {/* View toggle: list ↔ grid */}
      <div className="mb-4 flex items-center justify-end">
        <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          <button
            type="button"
            aria-label="Grid view"
            aria-pressed={viewMode === "grid"}
            onClick={() => changeView("grid")}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              viewMode === "grid"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/60 hover:bg-accent hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="List view"
            aria-pressed={viewMode === "list"}
            onClick={() => changeView("list")}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              viewMode === "list"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/60 hover:bg-accent hover:text-foreground"
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "grid gap-5 sm:gap-6",
          viewMode === "list" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
        )}
      >
        <AnimatePresence mode="popLayout">
          {rows.map((row, index) => {
            if (row.kind === "header") {
              return (
                <div
                  key={row.id}
                  className="col-span-full flex items-center gap-2 px-1 pt-2 first:pt-0"
                >
                  {row.label === "Pinned" && (
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  )}
                  <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {row.label}
                  </span>
                  <span className="text-[11px] font-bold tabular-nums text-muted-foreground/35">
                    {row.count}
                  </span>
                  <span className="ml-2 h-px flex-1 bg-foreground/[0.06]" />
                </div>
              )
            }

            const goal = row.goal
            const deadlineInfo = calculateGoalDeadlineInfo(goal)
            const deadlineStyling = getDeadlineStatusStyling(
              deadlineInfo.status,
              deadlineInfo.urgencyLevel
            )
            const progress =
              goal.taskCounts && goal.taskCounts.total > 0
                ? Math.round((goal.taskCounts.completed / goal.taskCounts.total) * 100)
                : 0

            return (
              <motion.div
                key={goal.id}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                whileHover="hover"
                whileTap="tap"
                className="group relative h-full"
              >
                {viewMode === "list" ? (
                  /* ===== Compact row (list view) ===== */
                  <div
                    onClick={(e) => navIfAllowed(e, goal.id)}
                    className={cn(
                      "relative flex cursor-pointer items-center gap-3 rounded-2xl border bg-card px-3 py-4 shadow-sm transition-[background-color,box-shadow,border-color] duration-200 hover:shadow-md group-hover:border-primary/30 sm:gap-4 sm:px-5",
                      deadlineStyling.borderColor
                    )}
                  >
                    {renderIcon(goal, "h-12 w-12 sm:h-14 sm:w-14 text-2xl sm:text-3xl", "")}

                    {/* Title */}
                    <div className="flex min-w-0 max-w-[52%] shrink flex-col sm:max-w-[40%]">
                      <h3 className="truncate text-sm font-bold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-lg">
                        {goal.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="shrink-0 border-none bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary"
                        >
                          {goal.metadata?.goal_type || "General"}
                        </Badge>
                        <DeadlineStatusBadge deadlineInfo={deadlineInfo} size="sm" />
                      </div>
                    </div>

                    {/* Inline progress */}
                    <div className="flex min-w-[60px] flex-1 items-center gap-3">
                      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-foreground/[0.08]">
                        <div
                          className="h-full w-full origin-left rounded-full transition-transform duration-1000 ease-out"
                          style={{
                            transform: `scaleX(${progress / 100})`,
                            background: progressGradient(progress),
                          }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-sm font-black tabular-nums text-primary">
                        {progress}%
                      </span>
                    </div>

                    {/* Task count */}
                    <div className="hidden shrink-0 items-center gap-2 rounded-lg border border-foreground/[0.05] bg-foreground/[0.03] px-3 py-1.5 md:flex">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold text-foreground/80">
                        {goal.taskCounts
                          ? `${goal.taskCounts.completed}/${goal.taskCounts.total}`
                          : "0/0"}
                      </span>
                    </div>

                    {/* Members */}
                    {goal.members && goal.members.length > 0 && (
                      <div className="ml-2 hidden shrink-0 -space-x-2.5 lg:flex">
                        {goal.members.slice(0, 3).map((mem, idx) => (
                          <Avatar key={idx} className="h-8 w-8 ring-2 ring-background">
                            <AvatarImage src={mem.user_profiles?.avatar_url} />
                            <AvatarFallback className="bg-primary/5 text-[10px] font-bold text-primary">
                              {(mem.user_profiles?.display_name || "U").slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="ml-1 flex shrink-0 items-center" data-ignore-navigation="true">
                      {renderStarButton(goal)}
                      {renderActionsMenu(goal)}
                    </div>
                  </div>
                ) : (
                  /* ===== Full card (grid view) ===== */
                  <Card
                    className={cn(
                      "relative flex h-full cursor-pointer flex-col rounded-3xl border bg-card transition-[box-shadow,border-color] duration-300 hover:shadow-lg group-hover:border-primary/30 sm:rounded-[2.5rem]",
                      deadlineStyling.borderColor
                    )}
                    onClick={(e) => navIfAllowed(e, goal.id)}
                  >
                    <CardHeader className="p-0">
                      <div className="flex items-start justify-between gap-4 p-5 sm:p-7">
                        <div className="flex min-w-0 flex-1 items-start gap-4">
                          {renderIcon(
                            goal,
                            "h-14 w-14 sm:h-16 sm:w-16 text-3xl sm:text-4xl",
                            ""
                          )}
                          <div className="min-w-0 flex-1 pt-1">
                            <CardTitle className="line-clamp-2 text-xl font-black leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary">
                              {goal.title}
                            </CardTitle>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="border-none bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary"
                              >
                                {goal.metadata?.goal_type || "General"}
                              </Badge>
                              <DeadlineStatusBadge deadlineInfo={deadlineInfo} size="sm" />
                            </div>
                          </div>
                        </div>
                        <div
                          className="flex shrink-0 items-center gap-1 pt-1"
                          data-ignore-navigation="true"
                        >
                          {renderStarButton(goal)}
                          {renderActionsMenu(goal)}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col p-5 pt-0 sm:p-7 sm:pt-0">
                      <p className="mb-6 line-clamp-2 text-sm font-medium leading-relaxed tracking-tight text-muted-foreground/80">
                        {goal.description || "No description provided for this goal."}
                      </p>

                      <div className="mt-auto space-y-4">
                        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                          <span>Progress</span>
                          <span className="text-sm font-black tabular-nums text-primary">
                            {progress}%
                          </span>
                        </div>
                        <div className="relative h-3 w-full overflow-hidden rounded-full bg-foreground/[0.08]">
                          <motion.div
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: progress / 100, opacity: 1 }}
                            transition={{
                              duration: 1.2,
                              ease: [0.16, 1, 0.3, 1],
                              delay: 0.35 + index * 0.05,
                            }}
                            className="h-full w-full origin-left rounded-full"
                            style={{ background: progressGradient(progress) }}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-1">
                          <div className="flex items-center gap-3 rounded-2xl border border-foreground/[0.05] bg-foreground/[0.04] px-4 py-3">
                            <ClipboardList className="h-5 w-5 text-primary" />
                            <div className="flex flex-col">
                              <span className="mb-1 text-[10px] font-bold uppercase tracking-widest leading-none text-muted-foreground/60">
                                Tasks
                              </span>
                              <span className="text-sm font-black leading-none text-foreground/90">
                                {goal.taskCounts
                                  ? `${goal.taskCounts.completed}/${goal.taskCounts.total}`
                                  : "0/0"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 rounded-2xl border border-foreground/[0.05] bg-foreground/[0.04] px-4 py-3">
                            <CalendarDays className="h-5 w-5 text-primary" />
                            <div className="flex flex-col">
                              <span className="mb-1 text-[10px] font-bold uppercase tracking-widest leading-none text-muted-foreground/60">
                                Target
                              </span>
                              <span className="text-sm font-black leading-none text-foreground/90">
                                {(() => {
                                  if (!goal.target_date) return "TBD"
                                  const date = new Date(goal.target_date)
                                  return isNaN(date.getTime()) ? "TBD" : format(date, "MMM d, yyyy")
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-foreground/[0.08] pt-4">
                          {goal.members && goal.members.length > 0 ? (
                            <div className="flex -space-x-3 overflow-hidden p-1">
                              {goal.members.slice(0, 4).map((mem, idx) => (
                                <Avatar key={idx} className="h-9 w-9 ring-4 ring-background">
                                  <AvatarImage src={mem.user_profiles?.avatar_url} />
                                  <AvatarFallback className="bg-primary/5 text-[11px] font-black text-primary">
                                    {(mem.user_profiles?.display_name || "U")
                                      .slice(0, 1)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {goal.members.length > 4 && (
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-[10px] font-black text-muted-foreground ring-4 ring-background">
                                  +{goal.members.length - 4}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge
                              variant="outline"
                              className="rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50"
                            >
                              Solo
                            </Badge>
                          )}

                          <div className="flex items-center gap-2.5">
                            {goal.status === "completed" && (
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500/20">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              </div>
                            )}
                            <Badge
                              className={cn(
                                "rounded-xl px-4 py-1.5 text-[11px] font-black uppercase tracking-widest",
                                goal.status === "completed"
                                  ? "border-none bg-green-500 text-white hover:bg-green-600"
                                  : "border-none bg-primary/10 text-primary hover:bg-primary/20"
                              )}
                            >
                              {goal.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {openingGoalId === goal.id && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-background/70 backdrop-blur-sm">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}

export const GoalList = React.memo(GoalListComponent)
export default GoalList
