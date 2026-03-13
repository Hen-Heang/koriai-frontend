"use client"

import { useMemo } from "react"

import type { DashboardStats, ProgressPoint } from "@/lib/types"

const chartData: ProgressPoint[] = [
  { day: "Mon", minutes: 28, accuracy: 72 },
  { day: "Tue", minutes: 34, accuracy: 75 },
  { day: "Wed", minutes: 46, accuracy: 79 },
  { day: "Thu", minutes: 39, accuracy: 81 },
  { day: "Fri", minutes: 52, accuracy: 84 },
  { day: "Sat", minutes: 30, accuracy: 77 },
  { day: "Sun", minutes: 44, accuracy: 86 },
]

const stats: DashboardStats = {
  streakDays: 18,
  weeklyMinutes: 273,
  wordsSaved: 148,
  correctionsThisWeek: 36,
  dailyGoalProgress: 72,
}

export function useProgress() {
  const dailyAverage = useMemo(
    () =>
      Math.round(
        chartData.reduce((total, item) => total + item.minutes, 0) /
          chartData.length
      ),
    []
  )

  return {
    chartData,
    dailyAverage,
    stats,
  }
}
