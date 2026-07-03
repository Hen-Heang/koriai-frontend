import type { Achievement, AchievementSummary, DashboardStats, LevelInfo, ProgressPoint } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"
import { getDailyGoalMinutes } from "@/lib/onboarding-store"

// Dashboard / streak / achievements, computed client-side from Supabase counts
// (the Spring backend used to compose these responses server-side).

function localDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function todayLocal(): string {
  return localDate(new Date().toISOString())
}

// Distinct local activity dates, newest first (bounded fetch is fine for a
// personal-scale app).
async function getActivityDates(): Promise<string[]> {
  const { data, error } = await supabase
    .from("kori_activity_log")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(2000)
  if (error) throw error
  const dates = new Set<string>()
  for (const row of data ?? []) dates.add(localDate(row.created_at))
  return [...dates].sort().reverse()
}

function computeStreak(dates: string[]): { streakDays: number; activityToday: boolean } {
  const set = new Set(dates)
  const today = new Date()
  const activityToday = set.has(todayLocal())
  let streak = 0
  // A streak survives a missing "today" (you haven't practiced yet).
  const cursor = new Date(today)
  if (!activityToday) cursor.setDate(cursor.getDate() - 1)
  while (set.has(localDate(cursor.toISOString()))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return { streakDays: streak, activityToday }
}

// ── Achievements / Gamification ─────────────────────────────────────────────
// Catalog lives here now; unlock rows persist in kori_achievements.

type Counts = {
  wordsSaved: number
  streakDays: number
  conversations: number
  corrections: number
  lessonsCompleted: number
}

const CATALOG: Array<Achievement & { met: (c: Counts) => boolean }> = [
  { code: "FIRST_WORD", title: "First Word", description: "Save your first vocabulary word", icon: "BookOpen", category: "Vocabulary", xp: 10, unlocked: false, met: (c) => c.wordsSaved >= 1 },
  { code: "WORD_COLLECTOR", title: "Word Collector", description: "Save 50 vocabulary words", icon: "Library", category: "Vocabulary", xp: 50, unlocked: false, met: (c) => c.wordsSaved >= 50 },
  { code: "LEXICON_MASTER", title: "Lexicon Master", description: "Save 200 vocabulary words", icon: "GraduationCap", category: "Vocabulary", xp: 150, unlocked: false, met: (c) => c.wordsSaved >= 200 },
  { code: "FIRST_CHAT", title: "First Conversation", description: "Start a conversation with the AI tutor", icon: "MessagesSquare", category: "Conversation", xp: 10, unlocked: false, met: (c) => c.conversations >= 1 },
  { code: "STREAK_3", title: "Warming Up", description: "Practice 3 days in a row", icon: "Flame", category: "Consistency", xp: 30, unlocked: false, met: (c) => c.streakDays >= 3 },
  { code: "STREAK_7", title: "One Week Strong", description: "Practice 7 days in a row", icon: "Flame", category: "Consistency", xp: 70, unlocked: false, met: (c) => c.streakDays >= 7 },
  { code: "STREAK_30", title: "Habit Formed", description: "Practice 30 days in a row", icon: "Trophy", category: "Consistency", xp: 300, unlocked: false, met: (c) => c.streakDays >= 30 },
  { code: "MISTAKE_LEARNER", title: "Learning from Mistakes", description: "Collect 10 corrections", icon: "CheckCheck", category: "Grammar", xp: 40, unlocked: false, met: (c) => c.corrections >= 10 },
  { code: "FOUNDATION_BUILDER", title: "Foundation Builder", description: "Complete 5 foundation lessons", icon: "Blocks", category: "Foundations", xp: 50, unlocked: false, met: (c) => c.lessonsCompleted >= 5 },
]

const LEVELS = [
  { level: 1, name: "Newcomer", xp: 0 },
  { level: 2, name: "Beginner", xp: 50 },
  { level: 3, name: "Student", xp: 150 },
  { level: 4, name: "Conversationalist", xp: 300 },
  { level: 5, name: "Professional", xp: 500 },
  { level: 6, name: "Fluent Colleague", xp: 800 },
]

function levelFromXp(totalXp: number): LevelInfo {
  let current = LEVELS[0]
  let next: (typeof LEVELS)[number] | null = null
  for (const l of LEVELS) {
    if (totalXp >= l.xp) current = l
    else {
      next = l
      break
    }
  }
  return {
    level: current.level,
    name: current.name,
    totalXp,
    xpIntoLevel: totalXp - current.xp,
    xpForNextLevel: next ? next.xp - current.xp : null,
    nextLevelName: next?.name ?? null,
  }
}

async function getCounts(): Promise<Counts> {
  const [vocab, conversations, corrections, lessons, dates] = await Promise.all([
    supabase.from("kori_vocab_cards").select("id", { count: "exact", head: true }),
    supabase.from("kori_conversations").select("id", { count: "exact", head: true }),
    supabase.from("kori_corrections").select("id", { count: "exact", head: true }),
    supabase
      .from("kori_foundation_progress")
      .select("lesson_id", { count: "exact", head: true })
      .eq("completed", true),
    getActivityDates(),
  ])
  return {
    wordsSaved: vocab.count ?? 0,
    conversations: conversations.count ?? 0,
    corrections: corrections.count ?? 0,
    lessonsCompleted: lessons.count ?? 0,
    streakDays: computeStreak(dates).streakDays,
  }
}

export const achievementsApi = {
  getSummary: async (): Promise<AchievementSummary> => {
    // Sync unlocked rows with current counts first, so XP/level always
    // reflect real activity instead of whatever was last recorded.
    await achievementsApi.check()
    const { data, error } = await supabase
      .from("kori_achievements")
      .select("code, unlocked_at")
    if (error) throw error
    const unlockedAt = new Map((data ?? []).map((a) => [a.code, a.unlocked_at as string]))
    const achievements: Achievement[] = CATALOG.map(({ met: _met, ...a }) => ({
      ...a,
      unlocked: unlockedAt.has(a.code),
      unlockedAt: unlockedAt.get(a.code) ?? null,
    }))
    const totalXp = achievements.filter((a) => a.unlocked).reduce((s, a) => s + a.xp, 0)
    return {
      level: levelFromXp(totalXp),
      unlockedCount: achievements.filter((a) => a.unlocked).length,
      totalCount: achievements.length,
      achievements,
    }
  },

  // Evaluates conditions and records any newly-met achievements; returns them.
  check: async (): Promise<Achievement[]> => {
    const userId = requireUserId()
    const [counts, { data: existing }] = await Promise.all([
      getCounts(),
      supabase.from("kori_achievements").select("code"),
    ])
    const have = new Set((existing ?? []).map((a) => a.code))
    const newlyMet = CATALOG.filter((a) => !have.has(a.code) && a.met(counts))
    if (newlyMet.length > 0) {
      await supabase
        .from("kori_achievements")
        .upsert(newlyMet.map((a) => ({ user_id: userId, code: a.code })))
    }
    return newlyMet.map(({ met: _met, ...a }) => ({ ...a, unlocked: true }))
  },
}

// ── Dashboard / Progress ────────────────────────────────────────────────────

export const progressApi = {
  // Returns { stats, chartData } — the same envelope the Spring dashboard
  // endpoint composed (useProgress consumes both).
  getDashboard: async (): Promise<{ stats: DashboardStats; chartData: ProgressPoint[] }> => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

    const [activityWeek, vocabCount, correctionsWeek, correctionsToday, dueVocab, dueCorrections, dates] =
      await Promise.all([
        supabase.from("kori_activity_log").select("duration_ms, created_at").gte("created_at", weekAgo),
        supabase.from("kori_vocab_cards").select("id", { count: "exact", head: true }),
        supabase.from("kori_corrections").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("kori_corrections").select("id", { count: "exact", head: true }).gte("created_at", startOfToday),
        supabase.from("kori_vocab_cards").select("id", { count: "exact", head: true }).lte("next_review", now.toISOString()),
        supabase.from("kori_corrections").select("id", { count: "exact", head: true }).lte("next_review_date", now.toISOString()),
        getActivityDates(),
      ])

    const weekRows = activityWeek.data ?? []
    const weeklyMinutes = Math.round(weekRows.reduce((s, r) => s + (r.duration_ms ?? 0), 0) / 60000)
    const todayRows = weekRows.filter((r) => r.created_at >= startOfToday)
    const todayMs = todayRows.reduce((s, r) => s + (r.duration_ms ?? 0), 0)
    const reviewsToday = todayRows.length

    // Minutes per day for the last 7 days (accuracy isn't tracked per-day here).
    const chartData: ProgressPoint[] = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const dayKey = localDate(day.toISOString())
      const ms = weekRows
        .filter((r) => localDate(r.created_at) === dayKey)
        .reduce((s, r) => s + (r.duration_ms ?? 0), 0)
      chartData.push({
        day: day.toLocaleDateString("en-US", { weekday: "short" }),
        minutes: Math.round(ms / 60000),
        accuracy: 0,
      })
    }

    const DAILY_GOAL_MINUTES = getDailyGoalMinutes()
    const stats: DashboardStats = {
      streakDays: computeStreak(dates).streakDays,
      weeklyMinutes,
      wordsSaved: vocabCount.count ?? 0,
      correctionsThisWeek: correctionsWeek.count ?? 0,
      dailyGoalProgress: Math.min(100, Math.round((todayMs / 60000 / DAILY_GOAL_MINUTES) * 100)),
      reviewsToday,
      correctionsToday: correctionsToday.count ?? 0,
      dueReviews: (dueVocab.count ?? 0) + (dueCorrections.count ?? 0),
    }
    return { stats, chartData }
  },

  getStreak: async (): Promise<{ streakDays: number; activityToday: boolean }> => {
    return computeStreak(await getActivityDates())
  },

  // Days (YYYY-MM-DD) with any activity in the given month ("YYYY-MM").
  getActivityDays: async (month: string): Promise<string[]> => {
    const dates = await getActivityDates()
    return dates.filter((d) => d.startsWith(month))
  },

  logDuration: async (feature: string, durationMs: number) => {
    const { error } = await supabase.from("kori_activity_log").insert({
      user_id: requireUserId(),
      feature,
      duration_ms: Math.round(durationMs),
    })
    if (error) throw error
  },
}

/* ── Spring backend implementation (kept for later restore) ──────────────────
import { api } from "./client"

export const achievementsApi = {
  getSummary: () => api.get("/achievements").then((r) => r.data.data),
  check: () => api.post("/achievements/check").then((r) => r.data.data),
}

export const progressApi = {
  getDashboard: () => api.get("/dashboard/progress").then((r) => r.data.data),
  getStreak: () => api.get("/dashboard/streak").then((r) => r.data.data),
  getActivityDays: (month: string) => api.get(`/dashboard/activity?month=${month}`).then((r) => r.data.data),
  logDuration: (feature: string, durationMs: number) =>
    api.post("/activity/log", { feature, durationMs }).then((r) => r.data.data),
}
────────────────────────────────────────────────────────────────────────────── */
