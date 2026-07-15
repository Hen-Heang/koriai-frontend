"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { PauseTimer } from "@/components/recovery/PauseTimer"
import { useRecoveryEvents, useRecoveryHabits } from "@/hooks/useRecovery"
import { useSessionTimer } from "@/hooks/useSessionTimer"

export default function RecoveryPausePage() {
  useSessionTimer("recovery")
  const router = useRouter()
  const { activeHabit, loading } = useRecoveryHabits()
  const { logEvent } = useRecoveryEvents(activeHabit?.id ?? null)

  useEffect(() => {
    if (!loading && !activeHabit) router.replace("/growth/recovery")
  }, [loading, activeHabit, router])

  if (loading || !activeHabit) return <div className="h-[100dvh] bg-black" />

  return (
    <PauseTimer
      onComplete={async () => {
        await logEvent({ kind: "moment", rodeOut: true })
      }}
    />
  )
}
