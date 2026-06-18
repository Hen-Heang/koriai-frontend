"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, CalendarDays, Plus } from "lucide-react"
import { toast } from "sonner"

import { PageHero } from "@/components/app/page-hero"
import { Button } from "@/components/ui/button"
import { DeleteConfirmDialog } from "@/components/goals/DeleteConfirmDialog"
import { EditGoalSlidePanel } from "@/components/goals/EditGoalSlidePanel"
import { GoalList } from "@/components/goals/GoalList"
import { GoalSorter } from "@/components/goals/GoalSorter"
import { TodaysTasks } from "@/components/goals/TodaysTasks"
import { useGoals } from "@/hooks/useGoals"
import { getDeadlineNotificationMessage, type Goal } from "@/lib/goals"
import { cn } from "@/lib/utils"

type GoalFilter = "all" | "active" | "completed"

export default function GoalsPage() {
  const {
    sortedGoals,
    isLoading,
    isDeleting,
    goalToDelete,
    showDeleteDialog,
    sortOption,
    currentPage,
    itemsPerPage,
    setCurrentPage,
    setShowDeleteDialog,
    deleteGoal,
    confirmDelete,
    updateSort,
    toggleStar,
    fetchGoals,
  } = useGoals()

  const [goalFilter, setGoalFilter] = useState<GoalFilter>("active")
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [showEditPanel, setShowEditPanel] = useState(false)

  const activeGoals = useMemo(
    () => sortedGoals.filter((g) => g.status !== "completed" && g.status !== "archived"),
    [sortedGoals]
  )
  const completedGoals = useMemo(
    () => sortedGoals.filter((g) => g.status === "completed"),
    [sortedGoals]
  )
  const allGoals = useMemo(
    () => sortedGoals.filter((g) => g.status !== "archived"),
    [sortedGoals]
  )

  const filteredGoals =
    goalFilter === "all" ? allGoals : goalFilter === "active" ? activeGoals : completedGoals
  const filteredTotalPages = Math.max(1, Math.ceil(filteredGoals.length / itemsPerPage))
  const displayGoals = useMemo(
    () => filteredGoals.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filteredGoals, currentPage, itemsPerPage]
  )

  const deadlineMessage = useMemo(() => getDeadlineNotificationMessage(sortedGoals), [sortedGoals])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        toast.info("Search is coming soon")
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const handleEditGoal = useCallback((goal: Goal, event: React.MouseEvent) => {
    event.stopPropagation()
    setEditingGoal(goal)
    setShowEditPanel(true)
  }, [])

  const handleGoalUpdated = useCallback(() => {
    fetchGoals()
    setShowEditPanel(false)
    setEditingGoal(null)
    toast.success("Goal updated")
  }, [fetchGoals])

  return (
    <div className="space-y-8 pb-12">
      <PageHero
        eyebrow="Planner"
        title="Goals"
        description="Set goals, break them into scheduled tasks, and track every deadline in one place."
        className="rounded-3xl sm:rounded-3xl"
        actions={
          <div className="flex w-full gap-3 sm:w-auto">
            <Button asChild variant="outline" className="h-11 flex-1 rounded-2xl border-border bg-background/50 font-bold backdrop-blur-sm sm:flex-none sm:px-6">
              <Link href="/goals/calendar">
                <CalendarDays size={18} strokeWidth={2.5} className="mr-2" />
                Calendar
              </Link>
            </Button>
            <Button asChild className="h-11 flex-1 rounded-2xl bg-blue-600 font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-500 sm:flex-none sm:px-6">
              <Link href="/goals/create">
                <Plus size={18} strokeWidth={2.5} className="mr-2" />
                New Goal
              </Link>
            </Button>
          </div>
        }
        stats={[
          { label: "Active", value: String(activeGoals.length) },
          { label: "Completed", value: String(completedGoals.length) },
        ]}
      />

      {deadlineMessage && (
        <div className="flex items-center gap-3 rounded-[1.5rem] border border-amber-500/20 bg-amber-500/5 px-5 py-4 text-sm font-bold text-amber-700 dark:text-amber-300">
          <AlertTriangle size={20} strokeWidth={2.5} className="shrink-0 text-amber-500" />
          {deadlineMessage}
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-fit gap-1 rounded-2xl bg-foreground/5 p-1 backdrop-blur-sm">
              {(["all", "active", "completed"] as const).map((tab) => {
                const count =
                  tab === "all" ? allGoals.length : tab === "active" ? activeGoals.length : completedGoals.length
                const isSelected = goalFilter === tab
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setGoalFilter(tab)
                      setCurrentPage(1)
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold uppercase tracking-wide transition-all",
                      isSelected
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground/60 hover:text-foreground hover:bg-background/40"
                    )}
                  >
                    {tab}
                    <span
                      className={cn(
                        "rounded-lg px-2 py-0.5 text-[11px] font-bold tabular-nums",
                        isSelected ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-foreground/5 text-muted-foreground/40"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
            <GoalSorter sortOption={sortOption} onSortChange={updateSort} />
          </div>

          <GoalList
            goals={displayGoals}
            isLoading={isLoading}
            isDeleting={isDeleting}
            sortOption={sortOption}
            onDeleteGoal={confirmDelete}
            onEditGoal={handleEditGoal}
            onToggleStar={toggleStar}
          />

          {filteredTotalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="h-10 rounded-xl font-bold"
              >
                Previous
              </Button>
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground/60 tabular-nums">
                Page {currentPage} of {filteredTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= filteredTotalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="h-10 rounded-xl font-bold"
              >
                Next
              </Button>
            </div>
          )}
        </div>

        <aside className="xl:sticky xl:top-8 xl:self-start">
          <TodaysTasks className="shadow-2xl shadow-blue-600/5" />
        </aside>
      </div>

      <EditGoalSlidePanel
        isOpen={showEditPanel}
        goal={editingGoal}
        onClose={() => {
          setShowEditPanel(false)
          setEditingGoal(null)
        }}
        onSuccess={handleGoalUpdated}
      />

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        isDeleting={isDeleting}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={() => {
          if (goalToDelete) void deleteGoal(goalToDelete.id)
        }}
        goalTitle={goalToDelete?.title || ""}
      />
    </div>
  )
}
