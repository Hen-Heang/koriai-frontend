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
  CheckCircle2,
  ClipboardList,
  Clock,
  Flag,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  Trash2,
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
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { DeadlineStatusBadge } from "@/components/goals/DeadlineStatusBadge"
import { DeleteConfirmDialog } from "@/components/goals/DeleteConfirmDialog"
import { EditGoalSlidePanel } from "@/components/goals/EditGoalSlidePanel"
import { Calendar } from "@/components/calendar/Calendar"
import { parseYMD } from "@/lib/calendar"
import { goalsApi, getApiErrorMessage } from "@/lib/api"
import { goalsQueryKey } from "@/hooks/useGoals"
import { getUserId } from "@/lib/auth-store"
import {
  calculateGoalDeadlineInfo,
  getDeadlineStatusStyling,
  type Goal,
} from "@/lib/goals"
import { cn } from "@/lib/utils"

type DetailTab = "overview" | "tasks" | "coach" | "settings"
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

  // Deep-link: ?task=<id> (also accepts ?taskId=) opens that task in the calendar.
  const deepLinkTaskId = searchParams.get("task") ?? searchParams.get("taskId")

  const [tab, setTab] = useState<DetailTab>("overview")
  const [showEditPanel, setShowEditPanel] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMutatingStatus, setIsMutatingStatus] = useState(false)

  // Restore the last-viewed tab.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TAB_STORAGE_KEY) as DetailTab | null
      if (
        saved === "overview" ||
        saved === "tasks" ||
        saved === "coach" ||
        saved === "settings"
      )
        setTab(saved)
    } catch {
      /* ignore */
    }
  }, [])

  // A deep-linked task always wins — jump to the Tasks tab so it can open.
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

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: goalKey })
    void queryClient.invalidateQueries({ queryKey: tasksKey })
    void queryClient.invalidateQueries({ queryKey: goalsQueryKey(userId) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, id, userId])

  // ── Status mutations (complete / archive / reactivate) ──
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [goal, queryClient, refresh]
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [goal, queryClient, refresh]
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal, queryClient, userId])

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

  // ── Loading ──
  if (goalLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-7 w-24 rounded-lg" />
        <Skeleton className="h-56 w-full rounded-[2rem]" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-[2rem]" />
      </div>
    )
  }

  // ── Not found ──
  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Target size={44} strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-black tracking-tight">Goal not found</h2>
        <p className="max-w-sm text-sm font-medium text-muted-foreground">
          This goal may have been deleted or you don&apos;t have access to it.
        </p>
        <Button asChild variant="outline">
          <Link href="/goals">
            <ArrowLeft size={16} strokeWidth={2.5} /> Back to goals
          </Link>
        </Button>
      </div>
    )
  }

  const icon = goal.metadata?.icon
  const milestones = goal.metadata?.milestones ?? []
  const isCompleted = goal.status === "completed"
  const isArchived = goal.status === "archived"

  return (
    <div className="space-y-6" data-goal-id={id}>
      {/* Back */}
      <Link
        href="/goals"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} strokeWidth={2.5} /> Goals
      </Link>

      {/* Hero header */}
      <section
        className={cn(
          "relative overflow-hidden rounded-[1.8rem] border bg-card p-5 shadow-xl dark:bg-slate-900/40 dark:backdrop-blur-md sm:rounded-[2.2rem] sm:p-7",
          deadlineStyling?.borderColor
        )}
      >
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-[80px]" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-sky-500/10 blur-[80px]" />
        </div>

        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-3xl font-black text-primary sm:h-20 sm:w-20 sm:text-4xl">
                {icon || (goal.title ? goal.title.charAt(0).toUpperCase() : "G")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="border-none bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary"
                  >
                    {goal.metadata?.goal_type || "General"}
                  </Badge>
                  {deadlineInfo && <DeadlineStatusBadge deadlineInfo={deadlineInfo} size="sm" />}
                  {goal.metadata?.priority && (
                    <Badge
                      variant="outline"
                      className="gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                    >
                      <Flag className="h-3 w-3" /> {goal.metadata.priority}
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                  {goal.title}
                </h1>
              </div>
            </div>

            {isOwner && (
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleStar}
                  aria-label={goal.isStarred ? "Unpin goal" : "Pin goal"}
                  className={cn(
                    "h-10 w-10 rounded-xl",
                    goal.isStarred
                      ? "text-amber-500 hover:bg-amber-500/10 hover:text-amber-600"
                      : "text-foreground/35 hover:bg-amber-500/10 hover:text-amber-500"
                  )}
                >
                  <Star className={cn("h-5 w-5", goal.isStarred && "fill-current")} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary"
                      aria-label="Goal actions"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem
                      className="cursor-pointer font-semibold"
                      onSelect={() => setShowEditPanel(true)}
                    >
                      <Pencil className="mr-2 h-4 w-4 text-primary" /> Edit goal
                    </DropdownMenuItem>
                    {!isCompleted && (
                      <DropdownMenuItem
                        className="cursor-pointer font-semibold"
                        disabled={isMutatingStatus}
                        onSelect={() => updateStatus("completed", "Goal marked complete")}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Mark complete
                      </DropdownMenuItem>
                    )}
                    {(isCompleted || isArchived) && (
                      <DropdownMenuItem
                        className="cursor-pointer font-semibold"
                        disabled={isMutatingStatus}
                        onSelect={() => updateStatus("active", "Goal reactivated")}
                      >
                        <RotateCcw className="mr-2 h-4 w-4 text-primary" /> Reactivate
                      </DropdownMenuItem>
                    )}
                    {!isArchived && (
                      <DropdownMenuItem
                        className="cursor-pointer font-semibold"
                        disabled={isMutatingStatus}
                        onSelect={() => updateStatus("archived", "Goal archived")}
                      >
                        <Archive className="mr-2 h-4 w-4 text-muted-foreground" /> Archive
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      className="cursor-pointer font-semibold"
                      onSelect={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete goal
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Task progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
              <span>Task Progress</span>
              <span className="text-sm font-black tabular-nums text-primary">{taskProgress}%</span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-foreground/[0.08]">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: taskProgress / 100 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="h-full w-full origin-left rounded-full"
                style={{ background: progressGradient(taskProgress) }}
              />
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/goals/calendar">
                <CalendarDays size={15} strokeWidth={2.5} /> Calendar
              </Link>
            </Button>
            {isOwner && !isCompleted && (
              <Button
                size="sm"
                disabled={isMutatingStatus}
                onClick={() => updateStatus("completed", "Goal marked complete")}
              >
                <CheckCircle2 size={15} strokeWidth={2.5} /> Mark complete
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard
          icon={<ClipboardList className="h-5 w-5 text-primary" />}
          label="Tasks"
          value={`${completedTasks}/${totalTasks}`}
        />
        <StatCard
          icon={<Target className="h-5 w-5 text-primary" />}
          label="Completion"
          value={`${taskProgress}%`}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-primary" />}
          label="Days Left"
          value={
            goal.no_duration || goal.metadata?.no_duration
              ? "—"
              : deadlineInfo && deadlineInfo.daysRemaining >= 0
                ? String(deadlineInfo.daysRemaining)
                : deadlineInfo
                  ? `${Math.abs(deadlineInfo.daysRemaining)} over`
                  : "—"
          }
        />
        <StatCard
          icon={<CalendarDays className="h-5 w-5 text-primary" />}
          label="Target"
          value={
            goal.target_date && !isNaN(new Date(goal.target_date).getTime())
              ? format(new Date(goal.target_date), "MMM d")
              : "TBD"
          }
        />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={changeTab} className="flex-col gap-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks {totalTasks > 0 && <span className="ml-1 tabular-nums opacity-60">{totalTasks}</span>}
          </TabsTrigger>
          <TabsTrigger value="coach">
            <Sparkles className="h-3.5 w-3.5" /> Coach
          </TabsTrigger>
          {isOwner && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="space-y-5">
          <Card className="rounded-[1.5rem]">
            <CardContent className="space-y-5 p-5 sm:p-7">
              <div>
                <h3 className="mb-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Description
                </h3>
                <p className="text-sm font-medium leading-relaxed text-foreground/80">
                  {goal.description || "No description provided for this goal."}
                </p>
              </div>

              {deadlineInfo && !(goal.no_duration || goal.metadata?.no_duration) && (
                <div>
                  <div className="mb-2 flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                    <span>Time Elapsed</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {deadlineInfo.daysElapsed} / {deadlineInfo.totalDays} days
                    </span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-foreground/[0.08]">
                    <div
                      className={cn("h-full rounded-full", deadlineStyling?.progressColor)}
                      style={{ width: `${deadlineInfo.progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {deadlineInfo && deadlineInfo.actionSuggestions.length > 0 && (
                <div>
                  <h3 className="mb-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Suggestions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {deadlineInfo.actionSuggestions.map((s) => (
                      <Badge
                        key={s}
                        variant="outline"
                        className="rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {milestones.length > 0 && (
            <Card className="rounded-[1.5rem]">
              <CardContent className="p-5 sm:p-7">
                <h3 className="mb-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Milestones
                </h3>
                <ul className="space-y-3">
                  {milestones.map((m, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Flag className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground">{m.title}</p>
                        {m.due_date && (
                          <p className="text-xs font-medium text-muted-foreground">
                            {format(new Date(m.due_date), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Tasks ── */}
        <TabsContent value="tasks">
          {/* Full day/week/month calendar + task dialogs, scoped to this goal. */}
          <div className="h-[calc(100dvh-24rem)] min-h-[520px]">
            <Calendar
              goalId={id}
              goalTitle={goal.title}
              goalStartDate={
                goal.metadata?.start_date ? parseYMD(goal.metadata.start_date) ?? undefined : undefined
              }
              goalTargetDate={goal.target_date ? parseYMD(goal.target_date) ?? undefined : undefined}
              initialTaskId={deepLinkTaskId}
            />
          </div>
        </TabsContent>

        {/* ── AI Coach (seam) ──
            Goal-scoped coaching + task auto-generation is a deferred feature
            (see INTEGRATION.md). This tab preserves the entry point and routes
            to the general AI Coach until the goal-aware backend lands. */}
        <TabsContent value="coach">
          <Card className="rounded-[1.5rem] border-dashed">
            <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="relative mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                  <Sparkles size={40} strokeWidth={1.75} />
                </div>
                <div className="absolute inset-0 -z-10 rounded-3xl bg-primary/20 blur-2xl" />
              </div>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-xl font-black tracking-tight">AI Coach for this goal</h3>
                <Badge
                  variant="secondary"
                  className="border-none bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary"
                >
                  Soon
                </Badge>
              </div>
              <p className="mb-8 max-w-sm text-sm font-medium leading-relaxed text-muted-foreground">
                Goal-aware coaching — progress check-ins, study plans, and auto-generated
                tasks tailored to <span className="font-bold text-foreground/80">{goal.title}</span> —
                is on the way. In the meantime, practice with the general AI Coach.
              </p>
              <Button asChild size="lg">
                <Link href="/chat">
                  <Sparkles size={18} strokeWidth={2.5} /> Open AI Coach
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Settings ── */}
        {isOwner && (
          <TabsContent value="settings" className="space-y-4">
            <Card className="rounded-[1.5rem]">
              <CardContent className="divide-y divide-border p-0">
                <SettingsRow
                  title="Edit goal"
                  description="Update title, description, dates, type, and icon."
                  action={
                    <Button variant="outline" size="sm" onClick={() => setShowEditPanel(true)}>
                      <Pencil size={15} strokeWidth={2.5} /> Edit
                    </Button>
                  }
                />
                <SettingsRow
                  title="Extend deadline"
                  description="Push out the target date for this goal."
                  action={
                    <div className="w-full sm:w-56">
                      <DateTimePicker
                        value={goal.target_date ? new Date(goal.target_date) : null}
                        onChange={extendDeadline}
                        granularity="day"
                      />
                    </div>
                  }
                />
                {!isCompleted ? (
                  <SettingsRow
                    title="Mark as complete"
                    description="Flag this goal as finished and celebrate the win."
                    action={
                      <Button
                        size="sm"
                        disabled={isMutatingStatus}
                        onClick={() => updateStatus("completed", "Goal marked complete")}
                      >
                        <CheckCircle2 size={15} strokeWidth={2.5} /> Complete
                      </Button>
                    }
                  />
                ) : (
                  <SettingsRow
                    title="Reactivate goal"
                    description="Move this goal back to active to keep working on it."
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isMutatingStatus}
                        onClick={() => updateStatus("active", "Goal reactivated")}
                      >
                        <RotateCcw size={15} strokeWidth={2.5} /> Reactivate
                      </Button>
                    }
                  />
                )}
                {!isArchived ? (
                  <SettingsRow
                    title="Archive goal"
                    description="Hide this goal from your active list without deleting it."
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isMutatingStatus}
                        onClick={() => updateStatus("archived", "Goal archived")}
                      >
                        <Archive size={15} strokeWidth={2.5} /> Archive
                      </Button>
                    }
                  />
                ) : (
                  <SettingsRow
                    title="Unarchive goal"
                    description="Return this goal to your active list."
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isMutatingStatus}
                        onClick={() => updateStatus("active", "Goal restored")}
                      >
                        <RotateCcw size={15} strokeWidth={2.5} /> Unarchive
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[1.5rem] border-destructive/30">
              <CardContent className="p-0">
                <SettingsRow
                  title="Delete goal"
                  description="Permanently remove this goal and all of its tasks."
                  action={
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 size={15} strokeWidth={2.5} /> Delete
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <EditGoalSlidePanel
        isOpen={showEditPanel}
        goal={goal}
        onClose={() => setShowEditPanel(false)}
        onSuccess={(updated) => {
          queryClient.setQueryData<Goal>(goalKey, (prev) => (prev ? { ...prev, ...updated } : updated))
          refresh()
          setShowEditPanel(false)
          toast.success("Goal updated")
        }}
      />

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        isDeleting={isDeleting ? goal.id : null}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={deleteGoal}
        goalTitle={goal.title}
      />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">{icon}</div>
      <div>
        <p className="text-lg font-black tabular-nums leading-none text-foreground">{value}</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          {label}
        </p>
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
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-xs font-medium leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  )
}