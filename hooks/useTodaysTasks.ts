"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { goalsApi, tasksApi, getApiErrorMessage } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"
import type { Task } from "@/lib/tasks"

// Ported from Orbit src/hooks/useTodaysTasks.ts. Supabase queries are replaced
// with KoriAI's REST api (tasksApi.range / goalsApi). Sharing + self-notification
// side effects are dropped (deferred seams — see INTEGRATION.md).

const selectionKey = (userId: number | string) =>
  `dg_todays_tasks_selected_goals_v1:${userId}`

const startOfToday = (): Date => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const endOfTodayIso = (): string => {
  const d = startOfToday()
  return new Date(d.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
}

// Pure sort: incomplete first, anytime before timed, then by daily start time.
const sortTasks = (tasks: Task[]): Task[] =>
  [...tasks].sort((a, b) => {
    if (a.completed && !b.completed) return 1
    if (!a.completed && b.completed) return -1
    if (a.is_anytime && !b.is_anytime) return -1
    if (!a.is_anytime && b.is_anytime) return 1
    if (a.is_anytime && b.is_anytime) return 0
    const ta = a.daily_start_time ?? ""
    const tb = b.daily_start_time ?? ""
    return ta < tb ? -1 : ta > tb ? 1 : 0
  })

// Keep today's tasks plus any still-incomplete task carried over from earlier days.
const isDueTodayOrCarriedOver = (t: Task, today: Date): boolean => {
  const endOk = !!t.end_date && new Date(t.end_date) >= today
  return endOk || !t.completed
}

export function useTodaysTasks() {
  const userId = getUserId()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [availableGoals, setAvailableGoals] = useState<Array<{ id: string; title: string }>>([])
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  // Ids changed by the last "mark all" — undo reverts exactly these.
  const [undoneIds, setUndoneIds] = useState<string[]>([])
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current)
    }
  }, [])

  const persistSelection = useCallback(
    (ids: string[]) => {
      if (userId == null) return
      try {
        localStorage.setItem(selectionKey(userId), JSON.stringify(ids))
      } catch {
        /* storage unavailable */
      }
    },
    [userId]
  )

  // Fetch all the user's tasks up to end-of-today, then keep the ones due today
  // (or carried over) whose goal is selected; standalone tasks are always shown.
  const loadTasks = useCallback(async (selected: string[]): Promise<void> => {
    const today = startOfToday()
    const all = await tasksApi.range({ to: endOfTodayIso() })
    const visible = all
      .filter((t) => isDueTodayOrCarriedOver(t, today))
      .filter((t) => !t.goal_id || selected.includes(t.goal_id))
    setTasks(sortTasks(visible))
  }, [])

  const refetchForSelection = useCallback(
    async (selected: string[]) => {
      setLoading(true)
      try {
        await loadTasks(selected)
      } catch (e) {
        console.error("Error loading today's tasks:", e)
      } finally {
        setLoading(false)
      }
    },
    [loadTasks]
  )

  // Initial load: hydrate available goals + restore the saved goal selection.
  useEffect(() => {
    let cancelled = false
    const init = async () => {
      if (userId == null) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const goals = await goalsApi.list()
        if (cancelled) return
        const allIds = goals.map((g) => g.id)
        setAvailableGoals(goals.map((g) => ({ id: g.id, title: g.title })))

        let initial: string[] = allIds.slice()
        try {
          const saved = localStorage.getItem(selectionKey(userId))
          if (saved) initial = (JSON.parse(saved) as string[]).filter((id) => allIds.includes(id))
        } catch {
          /* ignore */
        }
        if (cancelled) return
        setSelectedGoalIds(initial)
        await loadTasks(initial)
      } catch (e) {
        if (!cancelled) console.error("Error initializing today's tasks:", e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void init()
    return () => {
      cancelled = true
    }
  }, [userId, loadTasks])

  const toggleGoal = useCallback(
    (goalId: string) => {
      const next = selectedGoalIds.includes(goalId)
        ? selectedGoalIds.filter((id) => id !== goalId)
        : [...selectedGoalIds, goalId]
      setSelectedGoalIds(next)
      persistSelection(next)
      void refetchForSelection(next)
    },
    [selectedGoalIds, persistSelection, refetchForSelection]
  )

  const toggleAll = useCallback(() => {
    const allIds = availableGoals.map((g) => g.id)
    const allSelected = allIds.length > 0 && selectedGoalIds.length === allIds.length
    const next = allSelected ? [] : allIds
    setSelectedGoalIds(next)
    persistSelection(next)
    void refetchForSelection(next)
  }, [availableGoals, selectedGoalIds, persistSelection, refetchForSelection])

  const handleQuickAdd = useCallback(async () => {
    const title = newTaskTitle.trim()
    if (!title || isAdding) return
    setIsAdding(true)
    const start = startOfToday()
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)
    try {
      const created = await tasksApi.create({
        title,
        description: title,
        goal_id: null,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        is_anytime: true,
        completed: false,
      })
      setTasks((prev) => sortTasks([...prev, created]))
      setNewTaskTitle("")
    } catch (e) {
      toast.error("Could not add task", { description: getApiErrorMessage(e, "Please try again.") })
    } finally {
      setIsAdding(false)
    }
  }, [newTaskTitle, isAdding])

  const handleToggleTaskCompletion = useCallback(
    async (taskId: string, currentStatus: boolean) => {
      setTasks((prev) =>
        sortTasks(prev.map((t) => (t.id === taskId ? { ...t, completed: !currentStatus } : t)))
      )
      try {
        await tasksApi.update(taskId, { completed: !currentStatus })
      } catch (e) {
        setTasks((prev) =>
          sortTasks(prev.map((t) => (t.id === taskId ? { ...t, completed: currentStatus } : t)))
        )
        toast.error("Could not update task", {
          description: getApiErrorMessage(e, "Please try again."),
        })
      }
    },
    []
  )

  const handleMarkAllCompleted = useCallback(async () => {
    const incomplete = tasks.filter((t) => !t.completed)
    if (incomplete.length === 0) return
    setIsMarkingAll(true)
    const ids = incomplete.map((t) => t.id)
    try {
      await Promise.all(ids.map((id) => tasksApi.update(id, { completed: true })))
      setTasks((prev) => sortTasks(prev.map((t) => ({ ...t, completed: true }))))
      setUndoneIds(ids)
      const n = ids.length
      toast.success("Tasks marked complete", {
        description: `${n} task${n === 1 ? "" : "s"} marked as completed.`,
      })
      if (undoTimer.current) clearTimeout(undoTimer.current)
      undoTimer.current = setTimeout(() => setUndoneIds([]), 5000)
    } catch (e) {
      toast.error("Could not mark tasks complete", {
        description: getApiErrorMessage(e, "Please try again."),
      })
    } finally {
      setIsMarkingAll(false)
    }
  }, [tasks])

  const handleUndoMarkAllCompleted = useCallback(async () => {
    if (undoneIds.length === 0) return
    const ids = undoneIds
    setUndoneIds([])
    if (undoTimer.current) clearTimeout(undoTimer.current)
    setTasks((prev) => sortTasks(prev.map((t) => (ids.includes(t.id) ? { ...t, completed: false } : t))))
    try {
      await Promise.all(ids.map((id) => tasksApi.update(id, { completed: false })))
      toast.success("Undone", { description: "Tasks reverted to their previous state." })
    } catch (e) {
      toast.error("Could not undo", { description: getApiErrorMessage(e, "Please try again.") })
    }
  }, [undoneIds])

  const completedCount = useMemo(() => tasks.filter((t) => t.completed).length, [tasks])
  const totalCount = tasks.length
  const progressPct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0

  const goalTitleById = useMemo(() => {
    const map: Record<string, string> = {}
    availableGoals.forEach((g) => {
      map[g.id] = g.title
    })
    return map
  }, [availableGoals])

  const groups = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`

    const isCarriedOver = (t: Task) =>
      !t.completed && !!t.end_date && new Date(t.end_date) < todayStart

    const isOverdue = (t: Task) =>
      isCarriedOver(t) ||
      (!t.completed && !t.is_anytime && !!t.daily_end_time && t.daily_end_time < nowStr)

    const overdue: Task[] = []
    const scheduled: Task[] = []
    const anytime: Task[] = []
    const completed: Task[] = []
    for (const t of tasks) {
      if (t.completed) completed.push(t)
      else if (isCarriedOver(t)) overdue.push(t)
      else if (t.is_anytime) anytime.push(t)
      else scheduled.push(t)
    }
    return { overdue, scheduled, anytime, completed, isOverdue }
  }, [tasks])

  return {
    tasks,
    loading,
    availableGoals,
    selectedGoalIds,
    newTaskTitle,
    setNewTaskTitle,
    isAdding,
    isMarkingAll,
    canUndo: undoneIds.length > 0,
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
  }
}
