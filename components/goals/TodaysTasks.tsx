"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { motion, AnimatePresence } from "motion/react"
import {
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardList,
  Clock,
  Loader2,
  Plus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTodaysTasks } from "@/hooks/useTodaysTasks"
import type { Task } from "@/lib/tasks"
import { cn } from "@/lib/utils"

// Ported from Orbit dashboard/TodaysTasks.tsx. Goal multi-select filter, quick
// add, progress, overdue/scheduled/anytime/completed grouping, and mark-all +
// undo are kept. Sharing / select-mode (deferred) are dropped.

interface TodaysTasksProps {
  className?: string
}

export function TodaysTasks({ className }: TodaysTasksProps) {
  const router = useRouter()
  const [showCompleted, setShowCompleted] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const {
    tasks,
    loading,
    availableGoals,
    selectedGoalIds,
    newTaskTitle,
    setNewTaskTitle,
    isAdding,
    isMarkingAll,
    canUndo,
    completedCount,
    totalCount,
    progressPct,
    groups,
    goalTitleById,
    toggleGoal,
    toggleAll,
    handleQuickAdd,
    handleToggleTaskCompletion,
    handleMarkAllCompleted,
    handleUndoMarkAllCompleted,
  } = useTodaysTasks()

  const allSelected =
    availableGoals.length > 0 && selectedGoalIds.length === availableGoals.length

  const handleTaskClick = (task: Task) => {
    // Deep-link straight to the task in its goal's calendar (?task=).
    if (task.goal_id) router.push(`/goals/${task.goal_id}?task=${task.id}`)
    else router.push("/goals/calendar")
  }

  const renderProgress = () => {
    if (totalCount === 0) return null
    const allDone = completedCount === totalCount
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[12px] font-medium">
          <span
            className={cn(
              "flex items-center gap-1.5",
              allDone ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            )}
          >
            {allDone && <CheckCircle className="h-3 w-3" />}
            {allDone ? "All done" : "Progress"}
          </span>
          <span className="tabular-nums text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
          <motion.div
            className={cn(
              "h-full w-full origin-left rounded-full",
              allDone ? "bg-green-500" : "bg-primary"
            )}
            initial={false}
            animate={{ scaleX: progressPct / 100 }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          />
        </div>
      </div>
    )
  }

  const renderQuickAdd = () => (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/60 px-3 py-2 transition-colors focus-within:border-primary/40">
      <Plus className="h-4 w-4 shrink-0 text-muted-foreground/50" />
      <input
        value={newTaskTitle}
        onChange={(e) => setNewTaskTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void handleQuickAdd()
        }}
        placeholder="Add a personal task for today…"
        maxLength={200}
        className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground/40"
      />
      <Button
        size="sm"
        onClick={() => void handleQuickAdd()}
        disabled={!newTaskTitle.trim() || isAdding}
        className="h-7 shrink-0 rounded-lg px-3 text-xs"
      >
        {isAdding ? "Adding…" : "Add"}
      </Button>
    </div>
  )

  const renderActions = () => (
    <div className="flex flex-wrap items-center gap-2">
      {canUndo ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleUndoMarkAllCompleted()}
          className="h-8 gap-2 rounded-xl text-xs text-red-600 dark:text-red-400"
        >
          Undo
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleMarkAllCompleted()}
          disabled={isMarkingAll || completedCount === totalCount}
          className="h-8 gap-2 rounded-xl text-xs text-green-600 dark:text-green-400"
        >
          {isMarkingAll ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle className="h-3.5 w-3.5" />
          )}
          {isMarkingAll ? "Marking…" : "Mark all complete"}
        </Button>
      )}

      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 rounded-xl text-xs">
              Filter goals
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>Show tasks from</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={allSelected}
              onCheckedChange={() => toggleAll()}
              onSelect={(e) => e.preventDefault()}
              className="font-semibold"
            >
              All goals
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <div className="max-h-56 overflow-y-auto">
              {availableGoals.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">No goals</div>
              ) : (
                availableGoals.map((g) => (
                  <DropdownMenuCheckboxItem
                    key={g.id}
                    checked={selectedGoalIds.includes(g.id)}
                    onCheckedChange={() => toggleGoal(g.id)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <span className="truncate">{g.title || "Untitled"}</span>
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  const renderTaskItem = (task: Task) => {
    const overdue = groups.isOverdue(task)
    const goalTitle = task.goal_id ? goalTitleById[task.goal_id] : null
    return (
      <motion.div
        key={task.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.2 } }}
        className={cn(
          "group/item relative flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors duration-200",
          overdue
            ? "border-red-500/30 bg-red-500/[0.04] hover:bg-red-500/[0.07]"
            : "border-border bg-card hover:bg-accent/50"
        )}
        onClick={() => handleTaskClick(task)}
      >
        {overdue && <span className="absolute bottom-3 left-0 top-3 w-1 rounded-full bg-red-500/60" />}
        <button
          type="button"
          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
          onClick={(e) => {
            e.stopPropagation()
            void handleToggleTaskCompletion(task.id, task.completed)
          }}
          className={cn(
            "mt-0.5 shrink-0 transition-colors",
            task.completed ? "text-green-500" : "text-foreground/30 hover:text-primary"
          )}
        >
          {task.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
        </button>
        <div className="ml-0.5 min-w-0 flex-1">
          <span
            className={cn(
              "block text-sm font-semibold leading-snug tracking-tight transition-colors",
              task.completed
                ? "text-muted-foreground/40 line-through opacity-60"
                : "text-foreground group-hover/item:text-primary"
            )}
          >
            {task.title || task.description}
          </span>
          <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-muted-foreground/70">
            <span className={cn("flex items-center gap-1.5", overdue && "text-red-500/80")}>
              {overdue ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3 opacity-50" />
              )}
              {task.is_anytime
                ? "Anytime"
                : task.daily_start_time && task.daily_end_time
                  ? `${task.daily_start_time.slice(0, 5)} - ${task.daily_end_time.slice(0, 5)}${overdue ? " · Overdue" : ""}`
                  : "Not set"}
            </span>
            {goalTitle && (
              <span className="max-w-[140px] truncate rounded-md bg-foreground/[0.05] px-2 py-0.5 text-muted-foreground">
                {goalTitle}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  const sectionHeader = (label: string, count: number, accent?: string) => (
    <div className="flex items-center gap-2 px-1 pb-0.5 pt-2 first:pt-0">
      <span
        className={cn(
          "text-[10px] font-black uppercase tracking-[0.2em]",
          accent || "text-muted-foreground/50"
        )}
      >
        {label}
      </span>
      <span className="text-[10px] font-bold tabular-nums text-muted-foreground/40">{count}</span>
      <div className="h-px flex-1 bg-foreground/5" />
    </div>
  )

  const renderTasks = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      )
    }

    if (tasks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
          <div className="relative mb-5">
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <ClipboardList size={32} strokeWidth={1.5} />
            </motion.div>
            <div className="absolute inset-0 -z-10 rounded-full bg-primary/10 blur-2xl" />
          </div>
          <h3 className="mb-2 text-lg font-bold tracking-tight">All clear.</h3>
          <p className="max-w-[200px] text-sm font-medium leading-relaxed text-muted-foreground">
            No tasks scheduled for today. Enjoy the calm.
          </p>
        </div>
      )
    }

    const { overdue, scheduled, anytime, completed } = groups
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-2"
      >
        <AnimatePresence initial={false}>
          {overdue.length > 0 && (
            <React.Fragment key="grp-overdue">
              {sectionHeader("Overdue", overdue.length, "text-red-500/80")}
              {overdue.map((t) => renderTaskItem(t))}
            </React.Fragment>
          )}
          {scheduled.length > 0 && (
            <React.Fragment key="grp-scheduled">
              {sectionHeader("Scheduled", scheduled.length)}
              {scheduled.map((t) => renderTaskItem(t))}
            </React.Fragment>
          )}
          {anytime.length > 0 && (
            <React.Fragment key="grp-anytime">
              {sectionHeader("Anytime", anytime.length)}
              {anytime.map((t) => renderTaskItem(t))}
            </React.Fragment>
          )}
          {completed.length > 0 && (
            <React.Fragment key="grp-completed">
              <button
                onClick={() => setShowCompleted((s) => !s)}
                className="group/comp flex w-full items-center gap-2 px-1 pb-1 pt-3"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600/70 dark:text-green-400/70">
                  Completed
                </span>
                <span className="text-[10px] font-bold tabular-nums text-muted-foreground/40">
                  {completed.length}
                </span>
                <div className="h-px flex-1 bg-foreground/5" />
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground/40 transition-transform",
                    showCompleted && "rotate-180"
                  )}
                />
              </button>
              {showCompleted && completed.map((t) => renderTaskItem(t))}
            </React.Fragment>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm",
        className
      )}
    >
      <div className="flex-shrink-0 space-y-4 border-b border-border/60 bg-background/30 px-5 pb-5 pt-6">
        <div className="flex items-center gap-3.5">
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-2.5">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-tight text-foreground">Today&apos;s Tasks</h2>
            <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
              {format(new Date(), "EEEE, MMM d")}
            </p>
          </div>
          <span className="ml-auto shrink-0 rounded-lg bg-foreground/[0.05] px-2.5 py-1 text-xs font-semibold tabular-nums text-muted-foreground">
            {tasks.length}
          </span>
          {/* Collapse toggle — mobile-friendly per the Orbit "mobile collapsible" feature. */}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand" : "Collapse"}
            aria-expanded={!collapsed}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground lg:hidden"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", collapsed && "-rotate-90")} />
          </button>
        </div>

        {!collapsed && (
          <>
            {!loading && totalCount > 0 && renderProgress()}
            {renderQuickAdd()}
            {renderActions()}
          </>
        )}
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-4 py-4 lg:max-h-[calc(100vh-20rem)]">
          {renderTasks()}
        </div>
      )}
    </div>
  )
}

export default TodaysTasks
