"use client"

import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { getUserId } from "@/lib/auth-store"
import { streakQueryKey } from "@/hooks/useStreak"
import { dashboardQueryKey } from "@/hooks/useProgress"

/**
 * Call `logActivity()` after ANY learning action completes (analyze a message,
 * review/generate vocab, finish an interview turn, submit a listening quiz,
 * complete a reading unit, …).
 *
 * The backend derives the streak from the underlying feature tables (corrections,
 * messages, vocab, listening_attempts, …) — the write the action just made *is*
 * the activity record, so there's nothing to POST. This hook simply invalidates
 * the streak + dashboard caches so both re-read the freshly recomputed values.
 */
export function useLogActivity() {
  const queryClient = useQueryClient()
  const userId = getUserId()

  const logActivity = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: streakQueryKey(userId) }),
      queryClient.invalidateQueries({ queryKey: dashboardQueryKey(userId) }),
    ])
  }, [queryClient, userId])

  return { logActivity }
}
