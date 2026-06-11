"use client"

import { useEffect, useMemo, useState } from "react"

import { progressApi } from "@/lib/api"
import type { DashboardStats, ProgressPoint } from "@/lib/types"

const emptyStats: DashboardStats = {
  streakDays: 0,
  weeklyMinutes: 0,
  wordsSaved: 0,
  correctionsThisWeek: 0,
  dailyGoalProgress: 0,
  reviewsToday: 0,
  correctionsToday: 0,
  dueReviews: 0,
}

export function useProgress() {
  const [chartData, setChartData] = useState<ProgressPoint[]>([])
  const [stats, setStats] = useState<DashboardStats>(emptyStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    progressApi
      .getDashboard()
      .then((data) => {
        setChartData(Array.isArray(data?.chartData) ? data.chartData : [])
        setStats({ ...emptyStats, ...data?.stats })
      })
      .catch(() => setError("Failed to load progress data."))
      .finally(() => setLoading(false))
  }, [])

  const dailyAverage = useMemo(
    () =>
      chartData.length
        ? Math.round(
            chartData.reduce((total, item) => total + item.minutes, 0) /
              chartData.length
          )
        : 0,
    [chartData]
  )

  return {
    chartData,
    dailyAverage,
    error,
    loading,
    stats,
  }
}
