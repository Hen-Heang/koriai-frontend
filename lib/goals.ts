import { differenceInDays, isToday, isPast, parseISO } from "date-fns"

// ── Types (ported from Orbit src/types/goal.ts) ──────────────────────────────

export interface GoalMetadata {
  version?: number
  goal_type: "general" | "financial" | "travel" | "finance" | "education"
  start_date?: string
  no_duration?: boolean
  priority?: "low" | "medium" | "high"
  category?: string
  recurrence?: {
    type: "daily" | "weekly" | "monthly"
    timeRange?: [string, string]
    daysOfWeek?: number[]
  }
  milestones?: Array<{ title: string; due_date?: string; done?: boolean }>
  template_id?: string
  icon?: string
  travel_destination?: string
  travel_accommodation?: string
  travel_transportation?: string
  travel_budget?: string
  travel_activities?: string[]
  financial_details?: {
    targetAmount?: number
    currentSavings?: number
    monthlySavingsTarget?: number
    currency?: string
  }
  [key: string]: unknown
}

export interface SortOption {
  field: SortField
  direction: "asc" | "desc"
}

export type SortField = "title" | "target_date" | "status" | "created_at"

export type GoalType = "general" | "travel" | "finance" | "education" | "financial"

export interface Goal {
  id: string
  title: string
  description: string
  target_date: string | null
  no_duration?: boolean
  status: string
  created_at: string
  updated_at: string
  metadata: GoalMetadata
  user_id: string
  // Per-user starred/pinned flag (client-side enrichment).
  isStarred?: boolean
  taskCounts?: {
    total: number
    completed: number
    incomplete: number
  }
  // ── Deferred-feature fields (sharing / themes) — kept optional so ported
  //    components compile; populated only once those features are re-enabled.
  share_code?: string
  is_public?: boolean
  public_slug?: string
  theme_id?: string
  memberCounts?: { total: number }
  members?: GoalMember[]
}

export interface GoalMember {
  id: string
  goal_id: string
  user_id: string
  joined_at: string
  role: "creator" | "member"
  last_seen?: string | null
  user_profiles?: { avatar_url?: string; display_name?: string }
}

export interface GoalData {
  title: string
  description: string
  target_date: string
  goal_type: GoalMetadata["goal_type"]
  start_date: string
  status?: string
  travel_details?: {
    destination?: string
    accommodation?: string
    transportation?: string
    budget?: string
    activities?: string[]
  }
  financial_details?: GoalMetadata["financial_details"]
}

export const goalDataToGoal = (goalData: GoalData, userId?: string): Partial<Goal> => {
  const { title, description, target_date, goal_type, start_date, status = "active", ...restData } =
    goalData

  return {
    title,
    description,
    target_date,
    status,
    metadata: { goal_type, start_date, ...restData },
    user_id: userId || "",
  }
}

export const goalToFormData = (goal: Goal) => {
  const { metadata } = goal
  return {
    title: goal.title,
    description: goal.description,
    target_date: goal.target_date,
    goal_type: metadata.goal_type,
    travel_details:
      metadata.goal_type === "travel"
        ? {
            destination: metadata.travel_destination || "",
            accommodation: metadata.travel_accommodation || "",
            transportation: metadata.travel_transportation || "",
            budget: metadata.travel_budget || "",
            activities: metadata.travel_activities || [],
          }
        : undefined,
  }
}

// ── Deadline logic (ported from Orbit src/utils/goalDeadlineUtils.ts) ─────────

export type GoalDeadlineStatus =
  | "on_track"
  | "approaching_deadline"
  | "due_today"
  | "overdue"
  | "completed"

export type UrgencyLevel = "low" | "medium" | "high" | "critical"

export interface GoalDeadlineInfo {
  status: GoalDeadlineStatus
  daysRemaining: number
  daysElapsed: number
  totalDays: number
  progressPercentage: number
  urgencyLevel: UrgencyLevel
  statusMessage: string
  actionSuggestions: string[]
}

export const calculateGoalDeadlineInfo = (goal: Goal): GoalDeadlineInfo => {
  const isNoDuration = Boolean(goal.no_duration || goal.metadata?.no_duration)
  const targetDateStr = goal.target_date || new Date().toISOString().split("T")[0]
  const targetDate = parseISO(targetDateStr)
  const startDateStr = goal.metadata?.start_date || new Date().toISOString().split("T")[0]
  const startDate = parseISO(startDateStr)
  const today = new Date()

  if (isNoDuration) {
    return {
      status: "on_track",
      daysRemaining: 0,
      daysElapsed: Math.max(0, differenceInDays(today, startDate)),
      totalDays: 0,
      progressPercentage: 0,
      urgencyLevel: "low",
      statusMessage: "No deadline",
      actionSuggestions: ["View tasks", "Update progress"],
    }
  }

  const daysRemaining = differenceInDays(targetDate, today)
  const daysElapsed = differenceInDays(today, startDate)
  const totalDays = differenceInDays(targetDate, startDate)
  const progressPercentage =
    totalDays > 0 ? Math.max(0, Math.min(100, (daysElapsed / totalDays) * 100)) : 0

  let status: GoalDeadlineStatus
  let urgencyLevel: UrgencyLevel
  let statusMessage: string
  let actionSuggestions: string[]

  if (goal.status === "completed") {
    status = "completed"
    urgencyLevel = "low"
    statusMessage = "Goal completed successfully!"
    actionSuggestions = ["View achievements", "Set new goal"]
  } else if (isPast(targetDate) && !isToday(targetDate)) {
    status = "overdue"
    urgencyLevel = "critical"
    const overdueDays = Math.abs(daysRemaining)
    statusMessage = `Overdue by ${overdueDays} day${overdueDays === 1 ? "" : "s"}`
    actionSuggestions = ["Mark as complete", "Extend deadline", "Archive goal"]
  } else if (isToday(targetDate)) {
    status = "due_today"
    urgencyLevel = "critical"
    statusMessage = "Due today!"
    actionSuggestions = ["Mark as complete", "Extend deadline", "Focus mode"]
  } else if (daysRemaining <= 7 && daysRemaining > 0) {
    status = "approaching_deadline"
    urgencyLevel = daysRemaining <= 3 ? "high" : "medium"
    statusMessage = `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`
    actionSuggestions = ["Focus mode", "Review progress", "Extend deadline"]
  } else {
    status = "on_track"
    urgencyLevel = "low"
    statusMessage = `${daysRemaining} days remaining`
    actionSuggestions = ["View tasks", "Update progress"]
  }

  return {
    status,
    daysRemaining,
    daysElapsed,
    totalDays,
    progressPercentage,
    urgencyLevel,
    statusMessage,
    actionSuggestions,
  }
}

export const getDeadlineStatusStyling = (status: GoalDeadlineStatus, urgencyLevel: UrgencyLevel) => {
  switch (status) {
    case "completed":
      return {
        borderColor: "border-green-200 dark:border-green-800",
        backgroundColor: "bg-green-50/60 dark:bg-green-900/20",
        badgeColor:
          "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
        iconColor: "text-green-600 dark:text-green-400",
        progressColor: "bg-green-500",
      }
    case "overdue":
      return {
        borderColor: "border-red-300 dark:border-red-700",
        backgroundColor: "bg-red-50/60 dark:bg-red-900/20",
        badgeColor:
          "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
        iconColor: "text-red-600 dark:text-red-400",
        progressColor: "bg-red-500",
      }
    case "due_today":
      return {
        borderColor: "border-orange-300 dark:border-orange-700",
        backgroundColor: "bg-orange-50/60 dark:bg-orange-900/20",
        badgeColor:
          "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
        iconColor: "text-orange-600 dark:text-orange-400",
        progressColor: "bg-orange-500",
      }
    case "approaching_deadline":
      return {
        borderColor:
          urgencyLevel === "high"
            ? "border-yellow-300 dark:border-yellow-700"
            : "border-yellow-200 dark:border-yellow-800",
        backgroundColor: "bg-yellow-50/60 dark:bg-yellow-900/20",
        badgeColor:
          "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
        iconColor: "text-yellow-600 dark:text-yellow-400",
        progressColor: "bg-yellow-500",
      }
    default:
      return {
        borderColor: "border-blue-200 dark:border-blue-800",
        backgroundColor: "bg-blue-50/60 dark:bg-blue-900/20",
        badgeColor:
          "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
        iconColor: "text-blue-600 dark:text-blue-400",
        progressColor: "bg-blue-500",
      }
  }
}

export const getDeadlineStatusIcon = (status: GoalDeadlineStatus) => {
  switch (status) {
    case "completed":
      return "CheckCircle2"
    case "overdue":
      return "AlertTriangle"
    case "due_today":
      return "Clock"
    case "approaching_deadline":
      return "Timer"
    default:
      return "Target"
  }
}

export const filterGoalsByDeadlineStatus = (goals: Goal[], status: GoalDeadlineStatus): Goal[] =>
  goals.filter((goal) => calculateGoalDeadlineInfo(goal).status === status)

export const getDeadlineNotificationMessage = (goals: Goal[]): string | null => {
  const overdue = filterGoalsByDeadlineStatus(goals, "overdue")
  const dueToday = filterGoalsByDeadlineStatus(goals, "due_today")
  const approaching = filterGoalsByDeadlineStatus(goals, "approaching_deadline")

  if (overdue.length > 0) {
    return `You have ${overdue.length} overdue goal${overdue.length === 1 ? "" : "s"}. Take action to get back on track!`
  }
  if (dueToday.length > 0) {
    return `${dueToday.length} goal${dueToday.length === 1 ? " is" : "s are"} due today. Time to finish strong!`
  }
  if (approaching.length > 0) {
    return `${approaching.length} goal${approaching.length === 1 ? " is" : "s are"} approaching the deadline. Stay focused!`
  }
  return null
}
