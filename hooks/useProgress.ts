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
}

function normalizePoint(raw: unknown): ProgressPoint {
  const source = (raw ?? {}) as Record<string, unknown>
  return {
    day: String(source.day ?? source.label ?? source.date ?? ""),
    minutes: Number(source.minutes ?? source.studyMinutes ?? 0),
    accuracy: Number(source.accuracy ?? source.accuracyRate ?? 0),
  }
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
        const rawChartData: unknown[] = Array.isArray(data?.chartData)
          ? data.chartData
          : Array.isArray(data?.weeklyProgress)
            ? data.weeklyProgress
            : []
        setChartData(rawChartData.map((item) => normalizePoint(item)))
        setStats({
          streakDays: Number(data?.stats?.streakDays ?? data?.streakDays ?? 0),
          weeklyMinutes: Number(data?.stats?.weeklyMinutes ?? data?.weeklyMinutes ?? 0),
          wordsSaved: Number(data?.stats?.wordsSaved ?? data?.wordsSaved ?? 0),
          correctionsThisWeek: Number(
            data?.stats?.correctionsThisWeek ?? data?.correctionsThisWeek ?? 0
          ),
          dailyGoalProgress: Number(
            data?.stats?.dailyGoalProgress ?? data?.dailyGoalProgress ?? 0
          ),
        })
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
