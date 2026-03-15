"use client"

import { useState } from "react"
import { progressApi } from "@/lib/api"

export function useStreak() {
  const [streakDays, setStreakDays] = useState<number | null>(null)
  const [activityToday, setActivityToday] = useState(false)

  async function refreshStreak() {
    try {
      const data = await progressApi.getStreak()
      setStreakDays(data.streakDays)
      setActivityToday(data.activityToday)
    } catch {
      // non-critical, ignore
    }
  }

  return { streakDays, activityToday, refreshStreak }
}
