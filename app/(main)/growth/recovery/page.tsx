"use client"

import { motion } from "motion/react"

import { CreateHabitForm } from "@/components/recovery/CreateHabitForm"
import { RecoveryOverview } from "@/components/recovery/RecoveryOverview"
import { ErrorBanner } from "@/components/ui/error-banner"
import { Skeleton } from "@/components/ui/skeleton"
import { containerVariants, itemVariants } from "@/lib/motion"
import { daysSince } from "@/lib/recovery"
import { useRecoveryEvents, useRecoveryHabits } from "@/hooks/useRecovery"
import { useSessionTimer } from "@/hooks/useSessionTimer"

function RecoveryLoadingState() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-12 w-32" />
        <Skeleton className="mt-2 h-4 w-48" />
        <div className="mt-6 flex gap-3">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 flex-1 rounded-xl" />
      </div>
    </div>
  )
}

export default function RecoveryPage() {
  useSessionTimer("recovery")
  const {
    activeHabit,
    loading: habitsLoading,
    error: habitsError,
    addHabit,
    updateHabit,
    deleteHabit,
  } = useRecoveryHabits()
  const {
    daysSinceLastEvent,
    lastEventAt,
    rodeOutCount,
    lastSlipAt,
    loading: eventsLoading,
    error: eventsError,
  } = useRecoveryEvents(activeHabit?.id ?? null)

  if (habitsLoading || (activeHabit && eventsLoading)) {
    return <RecoveryLoadingState />
  }

  const error = habitsError || eventsError

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="pb-12">
      {error && (
        <motion.div variants={itemVariants} className="mx-auto mb-6 max-w-xl">
          <ErrorBanner>{error}</ErrorBanner>
        </motion.div>
      )}

      {!activeHabit ? (
        <CreateHabitForm onCreate={addHabit} />
      ) : (
        <RecoveryOverview
          habit={activeHabit}
          daysSinceLastEvent={daysSinceLastEvent}
          lastEventAt={lastEventAt}
          rodeOutCount={rodeOutCount}
          streakDays={daysSince(activeHabit.startedAt, lastSlipAt)}
          onUpdateHabit={(data) => updateHabit(activeHabit.id, data)}
          onDeleteHabit={() => deleteHabit(activeHabit.id)}
        />
      )}
    </motion.div>
  )
}
