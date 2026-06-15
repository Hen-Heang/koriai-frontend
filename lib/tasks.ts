// Types ported from Orbit src/types/task.ts. The original imported `User` from
// @supabase/supabase-js (unused) — dropped, since auth is unified on KoriAI's JWT.

export interface Task {
  id: string
  description: string
  completed: boolean
  user_id: string
  updated_by?: string | null
  created_at?: string
  updated_at?: string
  // Unified datetime fields
  title?: string
  goal_id?: string | null // null = personal (standalone) task
  start_date: string // ISO datetime (date portion used for the day)
  end_date: string // ISO datetime (date portion used for the day)
  daily_start_time?: string | null // 'HH:MM:SS'
  daily_end_time?: string | null // 'HH:MM:SS'
  is_anytime?: boolean | null
  duration_minutes?: number | null
  tags?: string[]
  color?: string | null // custom task color (hex, e.g. "#3b82f6")
}

export interface TaskTag {
  name: string
  color?: "red" | "blue" | "green" | "yellow" | "purple" | "orange" | "pink" | "gray"
  icon?: "flag" | "star" | "bell" | "clock" | "target" | "heart" | "circle" | "check"
}

export interface TaskManagerProps {
  goalId: string
  goalTitle: string
  goalDescription?: string
}

export interface FinancialData {
  goalId: string
  monthlyIncome?: number
  targetSavings?: number
  currency?: string
}

// Kept for the deferred AI task-generation seam.
export interface TaskGenerationParams {
  goalTitle: string
  goalDescription?: string
  financialData?: FinancialData | null
  startDate: string
  targetDate: string
  goalType?: string
  travelDetails?: {
    destination?: string
    accommodation?: string
    transportation?: string
    budget?: string
    activities?: string[]
  }
  userContext?: unknown
}

// 8 preset task colors (ported from Orbit's TaskColorPicker).
export const TASK_COLOR_PRESETS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#eab308", // yellow
  "#a855f7", // purple
  "#f97316", // orange
  "#ec4899", // pink
  "#6b7280", // gray
] as const

export const DEFAULT_TASK_COLOR = TASK_COLOR_PRESETS[0]

export const getTaskColor = (task: Pick<Task, "color">): string => task.color || DEFAULT_TASK_COLOR
