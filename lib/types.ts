export type MessageRole = "assistant" | "user" | "system"

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  correction?: string
  translation?: string
  createdAt: string
}

export interface VocabItem {
  id: string
  term: string
  meaning: string
  example?: string
  mastery: number
  nextReview: string
  tags: string[]
}

export interface DiaryFeedback {
  id: string
  title: string
  description: string
  example?: string
}

export interface Scenario {
  id: string
  title: string
  category: string
  level: "Beginner" | "Intermediate" | "Advanced"
  summary: string
  goal: string
}

export interface ScenarioDetail extends Scenario {
  introMessage?: string
}

export interface ProgressPoint {
  day: string
  minutes: number
  accuracy: number
}

export interface DashboardStats {
  streakDays: number
  weeklyMinutes: number
  wordsSaved: number
  correctionsThisWeek: number
  dailyGoalProgress: number
}
