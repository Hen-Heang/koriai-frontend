"use client"

import { motion } from "motion/react"

import { PlansList } from "@/components/recovery/PlansList"
import { ErrorBanner } from "@/components/ui/error-banner"
import { Skeleton } from "@/components/ui/skeleton"
import { containerVariants } from "@/lib/motion"
import { useRecoveryHabits, useRecoveryPlans } from "@/hooks/useRecovery"
import { useSessionTimer } from "@/hooks/useSessionTimer"

function PlansLoadingState() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  )
}

export default function RecoveryPlansPage() {
  useSessionTimer("recovery")
  const { activeHabit, loading: habitsLoading, error: habitsError } = useRecoveryHabits()
  const {
    plans,
    duePlans,
    loading: plansLoading,
    error: plansError,
    reviewPlan,
    updatePlan,
    deletePlan,
  } = useRecoveryPlans(activeHabit?.id ?? null)

  if (habitsLoading || (activeHabit && plansLoading)) {
    return <PlansLoadingState />
  }

  const error = habitsError || plansError
  if (error || !activeHabit) {
    return (
      <div className="mx-auto max-w-xl pt-10">
        <ErrorBanner>{error || "Start a habit on the Recovery overview first."}</ErrorBanner>
      </div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="mx-auto max-w-xl pb-12">
      <PlansList plans={plans} duePlans={duePlans} onReview={reviewPlan} onUpdate={updatePlan} onDelete={deletePlan} />
    </motion.div>
  )
}
