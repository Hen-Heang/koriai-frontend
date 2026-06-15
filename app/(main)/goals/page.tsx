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

  // Cmd/Ctrl+K — global search seam (search feature deferred; see INTEGRATION.md).
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
    <div className="space-y-6">
      <PageHero
        eyebrow="Planner"
        title="Goals"
        description="Set goals, break them into scheduled tasks, and track every deadline in one place."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/goals/calendar">
                <CalendarDays size={16} strokeWidth={2.5} />
                Calendar
              </Link>
            </Button>
            <Button asChild>
              <Link href="/goals/create">
                <Plus size={16} strokeWidth={2.5} />
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

      {/* Deadline banner */}
      {deadlineMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-300">
          <AlertTriangle size={18} strokeWidth={2.5} className="shrink-0" />
          {deadlineMessage}
        </div>
      )}

      {/* Goals (left) + Today's Tasks rail (right on xl, stacks below otherwise) */}
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          {/* Filter tabs + sorter */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex w-fit gap-1 rounded-2xl bg-foreground/5 p-1">
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
                      "flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-bold capitalize transition-all sm:px-4 sm:gap-2",
                      isSelected
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab}
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums",
                        isSelected ? "bg-primary/10 text-primary" : "bg-foreground/5 text-muted-foreground"
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

          {/* Goals */}
          <GoalList
            goals={displayGoals}
            isLoading={isLoading}
            isDeleting={isDeleting}
            sortOption={sortOption}
            onDeleteGoal={confirmDelete}
            onEditGoal={handleEditGoal}
            onToggleStar={toggleStar}
          />

          {/* Pagination */}
          {filteredTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <span className="px-2 text-sm font-medium text-muted-foreground tabular-nums">
                {currentPage} / {filteredTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= filteredTotalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <TodaysTasks />
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
