import { api } from "./client"

// Achievements / Gamification
export const achievementsApi = {
  getSummary: () => api.get("/achievements").then((r) => r.data.data),
  check: () => api.post("/achievements/check").then((r) => r.data.data),
}

// Dashboard / Progress
export const progressApi = {
  getDashboard: () => api.get("/dashboard/progress").then((r) => r.data.data),
  getStreak: () => api.get("/dashboard/streak").then((r) => r.data.data) as Promise<{ streakDays: number; activityToday: boolean }>,
  getActivityDays: (month: string) =>
    api.get(`/dashboard/activity?month=${month}`).then((r) => r.data.data) as Promise<string[]>,
  logDuration: (feature: string, durationMs: number) =>
    api.post("/activity/log", { feature, durationMs }).then((r) => r.data.data),
}
