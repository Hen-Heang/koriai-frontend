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
import { SmartAnalytics } from "@/components/goals/SmartAnalytics"
import { GoalCoach } from "@/components/goals/GoalCoach"
import { GoalCoachChat } from "@/components/goals/GoalCoachChat"
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

type DetailTab = "overview" | "tasks" | "members" | "coach" | "settings"
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
    async (memberUserId: number, name: string) => {
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

  if (goalLoading) {
    return (
      <div className="space-y-8 pb-12">
        <Skeleton className="h-6 w-24 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-[2.5rem]" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-[2rem]" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-[2.5rem]" />
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-muted/20 text-muted-foreground/40">
          <Target size={48} strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight">Goal not found</h2>
          <p className="mt-2 max-w-sm text-sm font-medium text-muted-foreground">
            This goal may have been deleted or moved.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-2xl font-bold">
          <Link href="/goals">
            <ArrowLeft size={18} strokeWidth={2.5} className="mr-2" /> Back to Goals
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
    <div className="space-y-8 pb-12" data-goal-id={id}>
      <Link
        href="/goals"
        className="group inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground/60 transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} strokeWidth={2.5} className="transition-transform group-hover:-translate-x-1" />
        Back to Goals
      </Link>

      {/* Hero Card */}
      <section
        className={cn(
          "relative overflow-hidden rounded-[2rem] border border-border bg-card p-5 shadow-2xl dark:bg-slate-900/40 dark:backdrop-blur-xl sm:rounded-[2.5rem] sm:p-10",
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
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-3xl font-black text-primary shadow-inner sm:h-24 sm:w-24 sm:rounded-[2rem] sm:text-5xl">
                {icon || (goal.title ? goal.title.charAt(0).toUpperCase() : "G")}
              </div>
              <div className="min-w-0 flex-1 space-y-2 sm:space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/20 sm:px-3 sm:py-1">
                    {goal.metadata?.goal_type || "General"}
                  </Badge>
                  {deadlineInfo && <DeadlineStatusBadge deadlineInfo={deadlineInfo} size="sm" />}
                </div>
                <h1 className="text-2xl font-black leading-tight tracking-tight text-foreground break-words sm:text-4xl lg:text-5xl">
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
                  "h-10 w-10 rounded-xl transition-all sm:h-12 sm:w-12",
                  goal.isStarred
                    ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                    : "bg-background/50 text-muted-foreground/30 hover:bg-background hover:text-amber-500"
                )}
              >
                <Star className={cn("h-5 w-5 sm:h-6 sm:w-6", goal.isStarred && "fill-current")} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-background/50 backdrop-blur-sm sm:h-12 sm:w-12">
                    <MoreHorizontal className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl">
                  <DropdownMenuItem className="rounded-xl font-bold" onSelect={() => setShowEditPanel(true)}>
                    <Pencil className="mr-3 h-4 w-4 text-primary" /> Edit Goal
                  </DropdownMenuItem>
                  {!isCompleted && (
                    <DropdownMenuItem className="rounded-xl font-bold" disabled={isMutatingStatus} onSelect={() => updateStatus("completed", "Goal completed!")}>
                      <CheckCircle2 className="mr-3 h-4 w-4 text-blue-500" /> Mark Complete
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem variant="destructive" className="rounded-xl font-bold" onSelect={() => setShowDeleteDialog(true)}>
                    <Trash2 className="mr-3 h-4 w-4" /> Delete Goal
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 sm:text-[11px]">
              <span>Goal Progress</span>
              <span className="text-xs font-black text-primary sm:text-sm">{taskProgress}%</span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-foreground/5 shadow-inner sm:h-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${taskProgress}%` }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full shadow-lg"
                style={{ background: progressGradient(taskProgress) }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard icon={<ClipboardList size={18} className="sm:size-[22px]" />} label="Tasks" value={`${completedTasks}/${totalTasks}`} color="text-blue-500" />
        <StatCard icon={<Target size={18} className="sm:size-[22px]" />} label="Progress" value={`${taskProgress}%`} color="text-blue-500" />
        <StatCard icon={<Clock size={18} className="sm:size-[22px]" />} label="Days Left" value={String(deadlineInfo?.daysRemaining ?? "—")} color="text-orange-500" />
        <StatCard icon={<CalendarDays size={18} className="sm:size-[22px]" />} label="Target" value={goal.target_date ? format(new Date(goal.target_date), "MMM d") : "TBD"} color="text-purple-500" />
      </div>

      {/* Content Tabs */}
      <Tabs value={tab} onValueChange={changeTab} className="flex-col space-y-6 sm:space-y-8">
        <div className="no-scrollbar overflow-x-auto pb-1">
          <TabsList className="inline-flex h-12 w-auto min-w-full justify-start gap-1 rounded-[1.25rem] bg-foreground/5 p-1.5 backdrop-blur-sm sm:h-14 sm:gap-2 sm:rounded-2xl sm:p-2 sm:justify-center">
            <TabsTrigger value="overview" className="rounded-lg px-3 text-[10px] font-black uppercase tracking-widest sm:rounded-xl sm:px-6 sm:text-xs">Overview</TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-lg px-3 text-[10px] font-black uppercase tracking-widest sm:rounded-xl sm:px-6 sm:text-xs">Tasks</TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-1.5 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest sm:rounded-xl sm:px-6 sm:text-xs">
              <Users size={12} className="sm:size-3.5" /> Members
              {memberCount > 0 && <span className="tabular-nums opacity-60">{memberCount}</span>}
            </TabsTrigger>
            <TabsTrigger value="coach" className="flex items-center gap-1.5 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest sm:rounded-xl sm:px-6 sm:text-xs">
              <Sparkles size={12} className="sm:size-3.5" /> Coach
            </TabsTrigger>
            {isOwner && <TabsTrigger value="settings" className="rounded-lg px-3 text-[10px] font-black uppercase tracking-widest sm:rounded-xl sm:px-6 sm:text-xs">Settings</TabsTrigger>}
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-[2rem] border-border bg-card/50 p-6 shadow-sm sm:rounded-[2.5rem] sm:p-8">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Description</h3>
              <p className="mt-4 text-base font-medium leading-relaxed text-foreground/80">
                {goal.description || "No description provided."}
              </p>
            </Card>

            {deadlineInfo && (
              <Card className="rounded-[2rem] border-border bg-card/50 p-6 shadow-sm sm:rounded-[2.5rem] sm:p-8">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Timeline</h3>
                <div className="mt-6 space-y-6">
                  <div className="flex items-center justify-between font-black uppercase tracking-widest">
                    <span className="text-[10px] text-muted-foreground/60">Time Elapsed</span>
                    <span className="text-xs text-foreground">{deadlineInfo.daysElapsed} / {deadlineInfo.totalDays} days</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/5 shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${deadlineInfo.progressPercentage}%` }}
                      className={cn("h-full rounded-full", deadlineStyling?.progressColor || "bg-primary")} 
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div>
            <h3 className="mb-4 px-1 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
              Smart analytics
            </h3>
            <SmartAnalytics tasks={tasks} targetDate={goal.target_date} />
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="rounded-[1.75rem] border border-border bg-card/50 p-1 shadow-2xl overflow-hidden sm:rounded-[2.5rem]">
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
            <Card className="rounded-[2.5rem] border-border bg-card/50 p-6 shadow-sm sm:p-8">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
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
                          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                            {name.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-foreground">
                            {name}
                            {isSelf && <span className="ml-1 text-muted-foreground/60">(you)</span>}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                            {m.role}
                          </p>
                        </div>
                        {isCreator ? (
                          <Badge
                            variant="secondary"
                            className="border-none bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary"
                          >
                            Owner
                          </Badge>
                        ) : isSelf ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-lg text-xs font-bold text-muted-foreground hover:text-destructive"
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
              <Card className="rounded-[2.5rem] border-border bg-card/50 p-6 shadow-sm sm:p-8">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
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
            onGenerated={() => {
              void queryClient.invalidateQueries({ queryKey: tasksKey })
              void queryClient.invalidateQueries({ queryKey: goalKey })
              changeTab("tasks")
            }}
          />
        </TabsContent>

        {isOwner && (
          <TabsContent value="settings" className="space-y-6">
            <Card className="overflow-hidden rounded-[2.5rem] border-border bg-card/50 shadow-sm">
              <div className="divide-y divide-border/60">
                <SettingsRow title="Edit Goal" description="Update details, dates, and visuals." action={<Button variant="outline" className="rounded-xl font-bold" onClick={() => setShowEditPanel(true)}>Edit</Button>} />
                <SettingsRow title="Target Date" description="Extend or change your deadline." action={<div className="w-56"><DateTimePicker value={goal.target_date ? new Date(goal.target_date) : null} onChange={extendDeadline} /></div>} />
                <SettingsRow title="Goal Status" description="Archive or reactivate this goal." action={<Button variant="outline" className="rounded-xl font-bold" onClick={() => updateStatus(isArchived ? "active" : "archived", "Status updated")}>{isArchived ? "Unarchive" : "Archive"}</Button>} />
              </div>
            </Card>
            <Card className="rounded-[2.5rem] border-destructive/20 bg-destructive/[0.02] p-2">
              <SettingsRow title="Delete Goal" description="Permanently remove this goal and its tasks." action={<Button variant="destructive" className="rounded-xl font-bold" onClick={() => setShowDeleteDialog(true)}>Delete</Button>} />
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
    <div className="flex flex-col gap-2 rounded-[1.5rem] border border-border bg-card p-4 shadow-sm dark:bg-slate-900/40 sm:gap-3 sm:rounded-[2rem] sm:p-6">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-foreground/5 shadow-inner sm:h-12 sm:w-12 sm:rounded-2xl", color)}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-black tabular-nums tracking-tight text-foreground sm:text-2xl">{value}</p>
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 sm:text-[10px]">{label}</p>
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