"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { DebriefForm } from "@/components/recovery/DebriefForm"
import { ErrorBanner } from "@/components/ui/error-banner"
import { useRecoveryEvents, useRecoveryHabits, useRecoveryPlans } from "@/hooks/useRecovery"
import { useSessionTimer } from "@/hooks/useSessionTimer"

export default function RecoveryDebriefPage() {
  useSessionTimer("recovery")
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get("eventId")

  const { activeHabit, loading: habitsLoading, error: habitsError } = useRecoveryHabits()
  const { annotateEvent, error: eventsError } = useRecoveryEvents(activeHabit?.id ?? null)
  const { addPlan, error: plansError } = useRecoveryPlans(activeHabit?.id ?? null)

  if (habitsLoading) return null

  const error = habitsError || eventsError || plansError
  if (error || !activeHabit) {
    return (
      <div className="mx-auto max-w-lg pt-10">
        <ErrorBanner>{error || "Start a habit on the Recovery overview first."}</ErrorBanner>
      </div>
    )
  }

  return (
    <div className="pb-12">
      <DebriefForm
        onSave={async ({ reflection, ifText, thenText }) => {
          if (eventId && reflection) await annotateEvent(eventId, reflection)
          await addPlan({ ifText, thenText, sourceEventId: eventId ?? undefined })
          router.push("/growth/recovery")
        }}
      />
    </div>
  )
}
