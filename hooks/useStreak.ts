"use client"

import { useCallback, useState } from "react"
import { progressApi } from "@/lib/api"

export function useStreak() {
  const [streakDays, setStreakDays] = useState<number | null>(null)
  const [activityToday, setActivityToday] = useState(false)

  const refreshStreak = useCallback(async () => {
    try {
      const data = await progressApi.getStreak()
      setStreakDays(data.streakDays)
      setActivityToday(data.activityToday)
    } catch {
      // non-critical, ignore
    }
  }, [])

  return { streakDays, activityToday, refreshStreak }
}
