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
  Pencil,
  Plus,
  Trash2,
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState("")

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
    editTask,
    deleteTask,
  } = useTodaysTasks()

  const startEditing = (task: Task) => {
    setEditingId(task.id)
    setEditingValue(task.title || task.description || "")
  }

  const commitEdit = () => {
    if (editingId) void editTask(editingId, editingValue)
    setEditingId(null)
    setEditingValue("")
  }

  const allSelected =
    availableGoals.length > 0 && selectedGoalIds.length === availableGoals.length

  const handleTaskClick = (task: Task) => {
    if (task.goal_id) router.push(`/goals/${task.goal_id}?task=${task.id}`)
    else router.push("/goals/calendar")
  }

  const renderProgress = () => {
    if (totalCount === 0) return null
    const allDone = completedCount === totalCount
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide">
          <span className={cn(allDone ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/60")}>
            {allDone ? "All Tasks Done" : "Daily Progress"}
          </span>
          <span className="tabular-nums text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/5">
          <motion.div
            className={cn("h-full w-full origin-left rounded-full", allDone ? "bg-emerald-500" : "bg-primary")}
            initial={false}
            animate={{ scaleX: progressPct / 100 }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          />
        </div>
      </div>
    )
  }

  const renderQuickAdd = () => (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/40 px-3.5 py-2.5 transition-all focus-within:border-primary/50 focus-within:bg-background">
      <Plus className="h-4 w-4 shrink-0 text-muted-foreground/40" />
      <input
        value={newTaskTitle}
        onChange={(e) => setNewTaskTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void handleQuickAdd()
        }}
        placeholder="Add a task for today…"
        className="min-w-0 flex-1 border-0 bg-transparent text-sm font-bold outline-none placeholder:font-medium placeholder:text-muted-foreground/30"
      />
      <Button
        size="sm"
        onClick={() => void handleQuickAdd()}
        disabled={!newTaskTitle.trim() || isAdding}
        className="h-8 shrink-0 rounded-xl bg-primary px-3 text-xs font-bold uppercase tracking-wide text-white shadow-sm"
      >
        {isAdding ? "…" : "Add"}
      </Button>
    </div>
  )

  const renderActions = () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => (canUndo ? handleUndoMarkAllCompleted() : handleMarkAllCompleted())}
        disabled={isMarkingAll || (!canUndo && completedCount === totalCount)}
        className={cn(
          "h-9 gap-2 rounded-2xl border-border bg-background/50 px-4 text-xs font-bold",
          canUndo ? "text-red-500 hover:text-red-600" : "text-emerald-600 dark:text-emerald-400"
        )}
      >
        {isMarkingAll ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : canUndo ? (
          <AlertTriangle className="h-3.5 w-3.5" />
        ) : (
          <CheckCircle className="h-3.5 w-3.5" />
        )}
        {isMarkingAll ? "Marking…" : canUndo ? "Undo" : "Mark all complete"}
      </Button>

      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 rounded-2xl border-border bg-background/50 px-4 text-xs font-bold">
              Filter Goals
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 rounded-2xl p-2 shadow-xl">
            <DropdownMenuLabel className="px-3 pt-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground/50">Show tasks from</DropdownMenuLabel>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuCheckboxItem
              checked={allSelected}
              onCheckedChange={() => toggleAll()}
              onSelect={(e) => e.preventDefault()}
              className="rounded-xl font-bold"
            >
              All goals
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator className="my-2" />
            <div className="max-h-56 overflow-y-auto">
              {availableGoals.map((g) => (
                <DropdownMenuCheckboxItem
                  key={g.id}
                  checked={selectedGoalIds.includes(g.id)}
                  onCheckedChange={() => toggleGoal(g.id)}
                  onSelect={(e) => e.preventDefault()}
                  className="rounded-xl font-medium"
                >
                  <span className="truncate">{g.title || "Untitled"}</span>
                </DropdownMenuCheckboxItem>
              ))}
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
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "group/item relative flex cursor-pointer items-start gap-3.5 rounded-3xl border p-4 transition-all duration-300",
          overdue
            ? "border-red-500/20 bg-red-500/[0.03] hover:bg-red-500/[0.05]"
            : "border-border bg-background/40 hover:bg-accent/50 lg:p-5"
        )}
        onClick={() => {
          if (editingId !== task.id) handleTaskClick(task)
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            void handleToggleTaskCompletion(task.id, task.completed)
          }}
          className={cn(
            "mt-0.5 shrink-0 transition-transform active:scale-90",
            task.completed ? "text-emerald-500" : "text-muted-foreground/30 hover:text-primary"
          )}
        >
          {task.completed ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
        </button>
        <div className="min-w-0 flex-1">
          {editingId === task.id ? (
            <input
              autoFocus
              value={editingValue}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit()
                if (e.key === "Escape") {
                  setEditingId(null)
                  setEditingValue("")
                }
              }}
              onBlur={commitEdit}
              className="w-full rounded-lg border border-primary/40 bg-background px-2 py-1 text-base font-bold outline-none"
            />
          ) : (
            <span className={cn(
              "block text-base font-bold leading-snug tracking-tight transition-all",
              task.completed ? "text-muted-foreground/40 line-through" : "text-foreground group-hover/item:text-primary"
            )}>
              {task.title || task.description}
            </span>
          )}
          <div className="mt-2 flex items-center justify-between text-xs font-bold">
            <span className={cn("flex items-center gap-1.5", overdue ? "text-red-500/80" : "text-muted-foreground/60")}>
              {overdue ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {task.is_anytime ? "Anytime" : task.daily_start_time?.slice(0, 5)}
            </span>
            {goalTitle && (
              <span className="max-w-[120px] truncate rounded-lg bg-foreground/[0.03] px-2 py-0.5 text-muted-foreground/50">
                {goalTitle}
              </span>
            )}
          </div>
        </div>

        {/* Row actions (hover) */}
        {editingId !== task.id && (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/item:opacity-100">
            <button
              type="button"
              aria-label="Edit task"
              onClick={(e) => {
                e.stopPropagation()
                startEditing(task)
              }}
              className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-accent hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Delete task"
              onClick={(e) => {
                e.stopPropagation()
                void deleteTask(task.id)
              }}
              className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-red-500/10 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </motion.div>
    )
  }

  const sectionHeader = (label: string, count: number, accent?: string) => (
    <div className="flex items-center gap-2 px-1 py-2">
      <span className={cn("text-[11px] font-bold uppercase tracking-wide", accent || "text-muted-foreground/40")}>
        {label}
      </span>
      <span className="text-[11px] font-bold tabular-nums text-muted-foreground/20">{count}</span>
      <div className="h-px flex-1 bg-foreground/5" />
    </div>
  )

  return (
    <div className={cn(
      "flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm dark:bg-slate-900/40 sm:rounded-3xl lg:p-8",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ClipboardList size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground">Today&apos;s Tasks</h3>
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/50">
              {format(new Date(), "EEEE, MMM d")}
            </p>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-xl p-2 text-muted-foreground/40 hover:bg-accent hover:text-foreground lg:hidden"
        >
          <ChevronDown className={cn("h-5 w-5 transition-transform", collapsed && "-rotate-90")} />
        </button>
      </div>

      {!collapsed && (
        <div className="mt-6 space-y-5">
          {totalCount > 0 && renderProgress()}
          {renderQuickAdd()}
          {renderActions()}
          <div className="space-y-2 lg:max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <div className="space-y-3 pt-4">
                <Skeleton className="h-20 w-full rounded-3xl" />
                <Skeleton className="h-20 w-full rounded-3xl" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <CheckCircle size={28} />
                </div>
                <h3 className="text-base font-bold">All Clear</h3>
                <p className="mt-1 text-xs font-medium text-muted-foreground">No tasks left for today.</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {groups.overdue.length > 0 && (
                  <>
                    {sectionHeader("Overdue", groups.overdue.length, "text-red-500/80")}
                    {groups.overdue.map(t => renderTaskItem(t))}
                  </>
                )}
                {groups.scheduled.length > 0 && (
                  <>
                    {sectionHeader("Scheduled", groups.scheduled.length)}
                    {groups.scheduled.map(t => renderTaskItem(t))}
                  </>
                )}
                {groups.anytime.length > 0 && (
                  <>
                    {sectionHeader("Anytime", groups.anytime.length)}
                    {groups.anytime.map(t => renderTaskItem(t))}
                  </>
                )}
                {groups.completed.length > 0 && (
                  <>
                    <button
                      onClick={() => setShowCompleted(!showCompleted)}
                      className="flex w-full items-center gap-2 py-2"
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-600/60">Completed</span>
                      <span className="text-[11px] font-bold text-muted-foreground/20">{groups.completed.length}</span>
                      <div className="h-px flex-1 bg-foreground/5" />
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground/20", showCompleted && "rotate-180")} />
                    </button>
                    {showCompleted && groups.completed.map(t => renderTaskItem(t))}
                  </>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TodaysTasks
