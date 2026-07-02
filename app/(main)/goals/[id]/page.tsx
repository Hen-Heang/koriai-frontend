"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "motion/react"
import { format } from "date-fns"
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  Flag,
  Loader2,
  LogOut,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  Trash2,
  UserMinus,
  Users,
} from "lucide-react"
import { toast } from "sonner"

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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { DeadlineStatusBadge } from "@/components/goals/DeadlineStatusBadge"
import { DeleteConfirmDialog } from "@/components/goals/DeleteConfirmDialog"
import { EditGoalSlidePanel } from "@/components/goals/EditGoalSlidePanel"
import { InviteMembers } from "@/components/goals/InviteMembers"
import { ShareGoalCard } from "@/components/goals/ShareGoalCard"
import { GoalMilestones, type Milestone } from "@/components/goals/GoalMilestones"
import { LearningPracticeCard } from "@/components/goals/LearningPracticeCard"
import { GoalCoach } from "@/components/goals/GoalCoach"
import { GoalCoachChat } from "@/components/goals/GoalCoachChat"
import dynamic from "next/dynamic"
import { parseYMD } from "@/lib/calendar"
import { goalsApi, tasksApi, getApiErrorMessage } from "@/lib/api"
import { goalsQueryKey } from "@/hooks/useGoals"
import { getUserId } from "@/lib/auth-store"
import { EXAM_DATE, SCRIPT_DUE_DATE } from "@/lib/study-plan"
import {
  calculateGoalDeadlineInfo,
  getDeadlineStatusStyling,
  type Goal,
} from "@/lib/goals"
import { cn } from "@/lib/utils"

// Heavy, below-the-fold pieces — deferred so the goal header/tabs paint first.
// SmartAnalytics pulls in recharts; Calendar is a large date-grid component.
const SmartAnalytics = dynamic(
  () => import("@/components/goals/SmartAnalytics").then((m) => m.SmartAnalytics),
  { ssr: false, loading: () => <div className="h-64 w-full animate-pulse rounded-2xl bg-muted/20" /> }
)
const Calendar = dynamic(
  () => import("@/components/calendar/Calendar").then((m) => m.Calendar),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-muted/20" /> }
)

type DetailTab = "overview" | "tasks" | "members" | "coach" | "settings"

// Shared-layout sliding pill rendered behind whichever tab trigger is active —
// framer-motion FLIPs it between siblings on tab change instead of a per-trigger bg color.
function TabPill() {
  return (
    <motion.span
      layoutId="goal-detail-tab-pill"
      className="absolute inset-0 -z-10 rounded-full bg-background shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-border/80 dark:bg-white/10 dark:ring-white/15"
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
    />
  )
}
const TAB_STORAGE_KEY = "dg_goal_detail_tab"

const progressGradient = (progress: number) =>
  progress >= 75
    ? "linear-gradient(90deg, #10b981, #059669)"
    : progress >= 40
      ? "linear-gradient(90deg, #3b82f6, #2563eb)"
      : "linear-gradient(90deg, #f59e0b, #ef4444)"

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const userId = getUserId()

  const deepLinkTaskId = searchParams.get("task") ?? searchParams.get("taskId")

  const [tab, setTab] = useState<DetailTab>("overview")
  const [showEditPanel, setShowEditPanel] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMutatingStatus, setIsMutatingStatus] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [descDraft, setDescDraft] = useState("")
  const [savingDesc, setSavingDesc] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(TAB_STORAGE_KEY) as DetailTab | null
      if (
        saved === "overview" ||
        saved === "tasks" ||
        saved === "members" ||
        saved === "coach" ||
        saved === "settings"
      )
        setTab(saved)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (deepLinkTaskId) setTab("tasks")
  }, [deepLinkTaskId])

  const changeTab = useCallback((next: string) => {
    const t = next as DetailTab
    setTab(t)
    try {
      localStorage.setItem(TAB_STORAGE_KEY, t)
    } catch {
      /* ignore */
    }
  }, [])

  const goalKey = ["goal", id] as const
  const tasksKey = ["goal", id, "tasks"] as const

  const {
    data: goal,
    isPending: goalLoading,
    error: goalError,
  } = useQuery({
    queryKey: goalKey,
    queryFn: () => goalsApi.get(id),
    enabled: !!id,
  })

  const { data: tasks = [] } = useQuery({
    queryKey: tasksKey,
    queryFn: () => goalsApi.getTasks(id),
    enabled: !!id,
  })

  const membersKey = ["goal", id, "members"] as const
  const { data: members = [] } = useQuery({
    queryKey: membersKey,
    queryFn: () => goalsApi.getMembers(id),
    enabled: !!id,
  })

  useEffect(() => {
    if (goalError) toast.error("Could not load this goal", { description: "Please try again." })
  }, [goalError])

  const isOwner = goal != null && userId != null && String(userId) === String(goal.user_id)

  const deadlineInfo = useMemo(
    () => (goal ? calculateGoalDeadlineInfo(goal) : null),
    [goal]
  )
  const deadlineStyling = deadlineInfo
    ? getDeadlineStatusStyling(deadlineInfo.status, deadlineInfo.urgencyLevel)
    : null

  const completedTasks = tasks.filter((t) => t.completed).length
  const totalTasks = tasks.length
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const memberCount = members.length || goal?.memberCounts?.total || 0

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: goalKey })
    void queryClient.invalidateQueries({ queryKey: tasksKey })
    void queryClient.invalidateQueries({ queryKey: goalsQueryKey(userId) })
  }, [queryClient, goalKey, tasksKey, userId])

  const toggleTaskCompletion = useCallback(
    async (taskId: string, completed: boolean) => {
      try {
        await tasksApi.update(taskId, { completed: !completed })
        refresh()
      } catch {
        toast.error("Could not update task", { description: "Please try again." })
      }
    },
    [refresh]
  )

  const updateStatus = useCallback(
    async (status: string, successMsg: string) => {
      if (!goal) return
      setIsMutatingStatus(true)
      try {
        const updated = await goalsApi.update(goal.id, { status })
        queryClient.setQueryData<Goal>(goalKey, (prev) => (prev ? { ...prev, ...updated } : updated))
        refresh()
        toast.success(successMsg)
      } catch (e) {
        toast.error("Could not update goal", {
          description: getApiErrorMessage(e, "Please try again."),
        })
      } finally {
        setIsMutatingStatus(false)
      }
    },
    [goal, queryClient, goalKey, refresh]
  )

  const extendDeadline = useCallback(
    async (date: Date | null) => {
      if (!goal || !date) return
      const target_date = format(date, "yyyy-MM-dd")
      try {
        const updated = await goalsApi.update(goal.id, { target_date })
        queryClient.setQueryData<Goal>(goalKey, (prev) => (prev ? { ...prev, ...updated } : updated))
        refresh()
        toast.success("Deadline updated", { description: format(date, "MMM d, yyyy") })
      } catch (e) {
        toast.error("Could not update deadline", {
          description: getApiErrorMessage(e, "Please try again."),
        })
      }
    },
    [goal, queryClient, goalKey, refresh]
  )

  const toggleStar = useCallback(async () => {
    if (!goal) return
    queryClient.setQueryData<Goal>(goalKey, (prev) =>
      prev ? { ...prev, isStarred: !prev.isStarred } : prev
    )
    try {
      await goalsApi.toggleStar(goal.id)
      void queryClient.invalidateQueries({ queryKey: goalsQueryKey(userId) })
    } catch {
      queryClient.setQueryData<Goal>(goalKey, (prev) =>
        prev ? { ...prev, isStarred: !prev.isStarred } : prev
      )
      toast.error("Could not update pin")
    }
  }, [goal, queryClient, goalKey, userId])

  const deleteGoal = useCallback(async () => {
    if (!goal) return
    setIsDeleting(true)
    try {
      await goalsApi.remove(goal.id)
      void queryClient.invalidateQueries({ queryKey: goalsQueryKey(userId) })
      toast.success("Goal deleted")
      router.push("/goals")
    } catch (e) {
      toast.error("Could not delete goal", {
        description: getApiErrorMessage(e, "Please try again."),
      })
      setIsDeleting(false)
    }
  }, [goal, queryClient, userId, router])

  // Leave a shared goal (members only — the creator can't leave).
  const leaveGoal = useCallback(async () => {
    try {
      await goalsApi.leaveGoal(id)
      void queryClient.invalidateQueries({ queryKey: goalsQueryKey(userId) })
      toast.success("You left the goal")
      router.push("/goals")
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not leave the goal"))
    }
  }, [id, queryClient, userId, router])

  // Owner removes another member.
  const removeMember = useCallback(
    async (memberUserId: string, name: string) => {
      try {
        await goalsApi.removeMember(id, memberUserId)
        void queryClient.invalidateQueries({ queryKey: membersKey })
        void queryClient.invalidateQueries({ queryKey: goalKey })
        toast.success(`Removed ${name}`)
      } catch (e) {
        toast.error(getApiErrorMessage(e, "Could not remove member"))
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, queryClient]
  )

  const saveDescription = useCallback(async () => {
    if (!goal) return
    setSavingDesc(true)
    try {
      const updated = await goalsApi.update(goal.id, { description: descDraft })
      queryClient.setQueryData<Goal>(goalKey, (prev) => (prev ? { ...prev, ...updated } : updated))
      setEditingDesc(false)
    } catch (e) {
      toast.error("Could not save description", { description: getApiErrorMessage(e, "Please try again.") })
    } finally {
      setSavingDesc(false)
    }
  }, [goal, descDraft, queryClient, goalKey])

  if (goalLoading) {
    return (
      <div className="space-y-8 pb-12">
        <Skeleton className="h-6 w-24 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-muted/20 text-muted-foreground/40">
          <Target size={48} strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Goal not found</h2>
          <p className="mt-2 max-w-sm text-sm font-medium text-muted-foreground">
            This goal may have been deleted or moved.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-2xl font-semibold">
          <Link href="/goals">
            <ArrowLeft size={18} strokeWidth={2} className="mr-2" /> Back to Goals
          </Link>
        </Button>
      </div>
    )
  }

  const icon = goal.metadata?.icon
  // Exam-prep goals (detected loosely from the title/description) get a one-tap
  // starter milestone set seeded from the K-Specialist study-plan dates.
  const examGoalSuggestions: Milestone[] = /exam|interview|korean|한국어|k-?specialist|면접|topik|토픽/i.test(
    `${goal.title ?? ""} ${goal.description ?? ""}`
  )
    ? [
        { title: "Finish a full mock + note your baseline score", due_date: "2026-07-15" },
        { title: "All weather vocab + key phrases memorized", due_date: "2026-08-17" },
        { title: "Script final draft — no more changes", due_date: "2026-08-19" },
        { title: "Submit Korean script", due_date: SCRIPT_DUE_DATE },
        { title: "Score 4/5 across all criteria on a mock", due_date: "2026-08-25" },
        { title: "Exam day — K-Specialist interview", due_date: EXAM_DATE },
      ]
    : []
  const isCompleted = goal.status === "completed"
  const isArchived = goal.status === "archived"

  return (
    <div className="space-y-8 pb-12" data-goal-id={id}>
      <Link
        href="/goals"
        className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground/60 transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} strokeWidth={2} className="transition-transform group-hover:-translate-x-1" />
        Back to Goals
      </Link>

      {/* Hero Card */}
      <section
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm dark:bg-slate-900/40 dark:backdrop-blur-xl sm:p-10",
          deadlineStyling?.borderColor
        )}
      >
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-blue-500/5 blur-[120px]" />
          <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-sky-500/5 blur-[120px]" />
        </div>

        <div className="relative z-10 space-y-6 sm:space-y-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-semibold text-primary sm:h-16 sm:w-16 sm:text-3xl">
                {icon || (goal.title ? goal.title.charAt(0).toUpperCase() : "G")}
              </div>
              <div className="min-w-0 flex-1 space-y-2 sm:space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[9px] font-medium text-primary hover:bg-primary/20 sm:px-3 sm:py-1">
                    {goal.metadata?.goal_type || "General"}
                  </Badge>
                  {deadlineInfo && <DeadlineStatusBadge deadlineInfo={deadlineInfo} size="sm" />}
                </div>
                <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground break-words sm:text-3xl lg:text-4xl">
                  {goal.title}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleStar}
                className={cn(
                  "h-9 w-9 rounded-xl transition-all sm:h-10 sm:w-10",
                  goal.isStarred
                    ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                    : "bg-background/50 text-muted-foreground/30 hover:bg-background hover:text-amber-500"
                )}
              >
                <Star className={cn("h-4 w-4 sm:h-5 sm:w-5", goal.isStarred && "fill-current")} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl bg-background/50 backdrop-blur-sm sm:h-10 sm:w-10">
                    <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-sm">
                  <DropdownMenuItem className="rounded-xl font-medium" onSelect={() => setShowEditPanel(true)}>
                    <Pencil className="mr-3 h-4 w-4 text-primary" /> Edit
                  </DropdownMenuItem>
                  {!isCompleted && (
                    <DropdownMenuItem className="rounded-xl font-medium" disabled={isMutatingStatus} onSelect={() => updateStatus("completed", "Goal completed!")}>
                      <CheckCircle2 className="mr-3 h-4 w-4 text-blue-500" /> Mark complete
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem variant="destructive" className="rounded-xl font-medium" onSelect={() => setShowDeleteDialog(true)}>
                    <Trash2 className="mr-3 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground/60 sm:text-xs">
              <span>Progress</span>
              <span className="text-xs font-semibold text-primary sm:text-sm">{taskProgress}%</span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-foreground/5 sm:h-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${taskProgress}%` }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full"
                style={{ background: progressGradient(taskProgress) }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard icon={<ClipboardList size={18} className="sm:size-[22px]" />} label="Tasks" value={`${completedTasks}/${totalTasks}`} color="text-blue-500" />
        <StatCard icon={<Users size={18} className="sm:size-[22px]" />} label="Members" value={String(memberCount || 1)} color="text-violet-500" />
        <StatCard icon={<Clock size={18} className="sm:size-[22px]" />} label="Days Left" value={String(deadlineInfo?.daysRemaining ?? "—")} color="text-orange-500" />
        <StatCard icon={<CalendarDays size={18} className="sm:size-[22px]" />} label="Target" value={goal.target_date ? format(new Date(goal.target_date), "MMM d") : "TBD"} color="text-purple-500" />
      </div>

      {/* Content Tabs */}
      <Tabs value={tab} onValueChange={changeTab} className="flex-col space-y-6 sm:space-y-8">
        <div className="no-scrollbar overflow-x-auto pb-1">
          <TabsList className="inline-flex h-12 w-auto min-w-full justify-start gap-1 rounded-full border border-border/60 bg-foreground/3 p-1.5 shadow-sm backdrop-blur-sm sm:h-14 sm:justify-center sm:gap-1.5 sm:p-2 dark:border-white/10 dark:bg-white/3">
            <TabsTrigger
              value="overview"
              className="relative z-10 rounded-full px-3 text-[11px] font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent sm:px-6 sm:text-xs"
            >
              {tab === "overview" && <TabPill />}
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="relative z-10 rounded-full px-3 text-[11px] font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent sm:px-6 sm:text-xs"
            >
              {tab === "tasks" && <TabPill />}
              Tasks
            </TabsTrigger>
            <TabsTrigger
              value="members"
              className="relative z-10 flex items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent sm:px-6 sm:text-xs"
            >
              {tab === "members" && <TabPill />}
              <Users size={12} className="sm:size-3.5" /> Members
              {memberCount > 0 && (
                <Badge
                  variant="secondary"
                  className="h-4 min-w-4 rounded-full bg-foreground/10 px-1 text-[10px] leading-none tabular-nums text-foreground/70"
                >
                  {memberCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="coach"
              className="relative z-10 flex items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent sm:px-6 sm:text-xs"
            >
              {tab === "coach" && <TabPill />}
              <Sparkles size={12} className="text-violet-500/80 sm:size-3.5" /> Coach
            </TabsTrigger>
            {isOwner && (
              <TabsTrigger
                value="settings"
                className="relative z-10 rounded-full px-3 text-[11px] font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent sm:px-6 sm:text-xs"
              >
                {tab === "settings" && <TabPill />}
                Settings
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">

          {/* Description — inline editable */}
          <Card className="rounded-2xl border-border bg-card/50 p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">Description</h3>
              {!editingDesc && (
                <button
                  type="button"
                  onClick={() => { setDescDraft(goal.description || ""); setEditingDesc(true) }}
                  className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Pencil size={12} strokeWidth={2.5} /> Edit
                </button>
              )}
            </div>

            {editingDesc ? (
              <div className="mt-4 space-y-3">
                <textarea
                  autoFocus
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setEditingDesc(false)
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void saveDescription()
                  }}
                  placeholder="Describe your goal in detail — what success looks like, why it matters, key context…"
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium leading-relaxed text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void saveDescription()}
                    disabled={savingDesc}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                  >
                    {savingDesc ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={3} />}
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingDesc(false)}
                    className="inline-flex h-9 items-center rounded-xl border border-border px-4 text-xs font-semibold text-muted-foreground transition-all hover:bg-accent active:scale-95"
                  >
                    Cancel
                  </button>
                  <span className="ml-auto hidden text-[10px] font-medium text-muted-foreground/40 sm:inline">⌘ Enter to save</span>
                </div>
              </div>
            ) : (
              <p
                onClick={() => { setDescDraft(goal.description || ""); setEditingDesc(true) }}
                className={cn(
                  "mt-4 cursor-text text-sm font-medium leading-relaxed transition-colors",
                  goal.description ? "text-foreground/80" : "italic text-muted-foreground/30"
                )}
              >
                {goal.description || "No description yet — click to add one."}
              </p>
            )}
          </Card>

          {/* Sub-goals / Milestones */}
          <GoalMilestones
            goal={goal}
            suggestions={examGoalSuggestions}
            onGoalUpdated={(updated) =>
              queryClient.setQueryData<Goal>(goalKey, (prev) =>
                prev ? { ...prev, ...updated } : updated
              )
            }
          />

          {/* Timeline */}
          {deadlineInfo && (
            <Card className="rounded-2xl border-border bg-card/50 p-6 shadow-sm sm:p-8">
              <h3 className="text-sm font-semibold text-foreground">Timeline</h3>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-muted-foreground/50">Time elapsed</span>
                  <span className="tabular-nums text-foreground">{deadlineInfo.daysElapsed} / {deadlineInfo.totalDays} days</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${deadlineInfo.progressPercentage}%` }}
                    className={cn("h-full rounded-full", deadlineStyling?.progressColor || "bg-primary")}
                  />
                </div>
              </div>
            </Card>
          )}

          <LearningPracticeCard tasks={tasks} onToggle={toggleTaskCompletion} />

          <div>
            <h3 className="mb-4 px-1 text-sm font-semibold text-foreground">Smart analytics</h3>
            <SmartAnalytics tasks={tasks} targetDate={goal.target_date} />
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="rounded-2xl border border-border bg-card/50 p-1 shadow-sm overflow-hidden">
          <div className="h-[clamp(420px,75dvh,700px)]">
            <Calendar
              goalId={id}
              goalTitle={goal.title}
              initialTaskId={deepLinkTaskId}
            />
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border-border bg-card/50 p-6 shadow-sm sm:p-8">
              <h3 className="text-sm font-semibold text-foreground">
                People on this goal
              </h3>
              {members.length === 0 ? (
                <div className="mt-6 flex flex-col items-center justify-center gap-3 py-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Users size={28} strokeWidth={1.75} />
                  </div>
                  <p className="max-w-xs text-sm font-medium text-muted-foreground">
                    {isOwner
                      ? "It's just you so far. Invite teammates to collaborate on this goal."
                      : "No other members on this goal yet."}
                  </p>
                </div>
              ) : (
                <ul className="mt-6 space-y-2">
                  {members.map((m) => {
                    const name = m.displayName || m.email || "Member"
                    const isSelf = userId != null && String(m.userId) === String(userId)
                    const isCreator = m.role === "creator"
                    return (
                      <li key={m.id} className="flex items-center gap-3 rounded-xl p-2">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                            {name.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {name}
                            {isSelf && <span className="ml-1 text-muted-foreground/60">(you)</span>}
                          </p>
                          <p className="text-[11px] font-medium capitalize text-muted-foreground/50">
                            {m.role}
                          </p>
                        </div>
                        {isCreator ? (
                          <Badge
                            variant="secondary"
                            className="border-none bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
                          >
                            Owner
                          </Badge>
                        ) : isSelf ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-lg text-xs font-semibold text-muted-foreground hover:text-destructive"
                            onClick={leaveGoal}
                          >
                            <LogOut size={14} /> Leave
                          </Button>
                        ) : isOwner ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                            onClick={() => removeMember(m.userId, name)}
                            aria-label={`Remove ${name}`}
                            title={`Remove ${name}`}
                          >
                            <UserMinus size={16} />
                          </Button>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>

            {isOwner && (
              <Card className="rounded-2xl border-border bg-card/50 p-6 shadow-sm sm:p-8">
                <h3 className="text-sm font-semibold text-foreground">
                  Invite members
                </h3>
                <p className="mt-2 mb-6 text-sm font-medium leading-relaxed text-muted-foreground">
                  Search by name or email — they&apos;ll get an invitation in their notifications.
                </p>
                <InviteMembers goalId={id} onInvited={refresh} />
              </Card>
            )}

            {isOwner && (
              <ShareGoalCard goalId={id} shareCode={goal.share_code} onRegenerated={refresh} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="coach" className="space-y-6">
          <GoalCoachChat goalId={id} goalTitle={goal.title} />
          <GoalCoach
            goalId={id}
            goalType={goal.metadata?.goal_type}
            onGenerated={() => {
              void queryClient.invalidateQueries({ queryKey: tasksKey })
              void queryClient.invalidateQueries({ queryKey: goalKey })
              changeTab("tasks")
            }}
          />
        </TabsContent>

        {isOwner && (
          <TabsContent value="settings" className="space-y-6">
            <Card className="overflow-hidden rounded-2xl border-border bg-card/50 shadow-sm">
              <div className="divide-y divide-border/60">
                <SettingsRow title="Edit Goal" description="Update details, dates, and visuals." action={<Button variant="outline" className="rounded-xl font-semibold" onClick={() => setShowEditPanel(true)}>Edit</Button>} />
                <SettingsRow title="Target Date" description="Extend or change your deadline." action={<div className="w-56"><DateTimePicker value={goal.target_date ? new Date(goal.target_date) : null} onChange={extendDeadline} /></div>} />
                <SettingsRow title="Goal Status" description="Archive or reactivate this goal." action={<Button variant="outline" className="rounded-xl font-semibold" onClick={() => updateStatus(isArchived ? "active" : "archived", "Status updated")}>{isArchived ? "Unarchive" : "Archive"}</Button>} />
              </div>
            </Card>
            <Card className="rounded-2xl border-destructive/20 bg-destructive/[0.02] p-2">
              <SettingsRow title="Delete Goal" description="Permanently remove this goal and its tasks." action={<Button variant="destructive" className="rounded-xl font-semibold" onClick={() => setShowDeleteDialog(true)}>Delete</Button>} />
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <EditGoalSlidePanel isOpen={showEditPanel} goal={goal} onClose={() => setShowEditPanel(false)} onSuccess={refresh} />
      <DeleteConfirmDialog isOpen={showDeleteDialog} isDeleting={isDeleting ? goal.id : null} onCancel={() => setShowDeleteDialog(false)} onConfirm={deleteGoal} goalTitle={goal.title} />
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm dark:bg-slate-900/40 sm:gap-3 sm:p-6">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-foreground/5 sm:h-12 sm:w-12", color)}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl">{value}</p>
        <p className="text-[10px] font-medium text-muted-foreground/40 sm:text-[11px]">{label}</p>
      </div>
    </div>
  )
}

function SettingsRow({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs font-medium leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  )
}