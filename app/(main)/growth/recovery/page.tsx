"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Plus } from "lucide-react"

import { GrowthTabs } from "@/components/growth/GrowthTabs"
import { CreateHabitForm } from "@/components/recovery/CreateHabitForm"
import { RecoveryHabitCard } from "@/components/recovery/RecoveryHabitCard"
import { BackLink } from "@/components/ui/back-link"
import { Button } from "@/components/ui/button"
import { ErrorBanner } from "@/components/ui/error-banner"
import { Skeleton } from "@/components/ui/skeleton"
import { containerVariants, itemVariants } from "@/lib/motion"
import { useRecoveryHabits } from "@/hooks/useRecovery"
import { useSessionTimer } from "@/hooks/useSessionTimer"

function RecoveryLoadingState() {
  return (
    <div className="mx-auto max-w-xl space-y-3">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
    </div>
  )
}

export default function RecoveryListPage() {
  useSessionTimer("recovery")
  const { habits, loading, error, addHabit } = useRecoveryHabits()
  const [showForm, setShowForm] = useState(false)

  const activeHabits = habits.filter((h) => h.active)

  if (loading) return <RecoveryLoadingState />

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="mx-auto max-w-xl pb-12">
      <motion.div variants={itemVariants} className="mb-2">
        <BackLink href="/home" label="Home" mobileOnly className="mb-2" />
        <GrowthTabs />
      </motion.div>
      {error && (
        <motion.div variants={itemVariants} className="mb-4">
          <ErrorBanner>{error}</ErrorBanner>
        </motion.div>
      )}

      {activeHabits.length === 0 || showForm ? (
        <CreateHabitForm
          onCreate={async (input) => {
            const habit = await addHabit(input)
            setShowForm(false)
            return habit
          }}
          onClose={activeHabits.length > 0 ? () => setShowForm(false) : undefined}
        />
      ) : (
        <>
          <motion.div variants={itemVariants} className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">Recovery</h1>
            <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
              <Plus size={16} strokeWidth={2} />
              New habit
            </Button>
          </motion.div>
          <div className="space-y-3">
            {activeHabits.map((habit) => (
              <RecoveryHabitCard key={habit.id} habit={habit} />
            ))}
          </div>
        </>
      )}
    </motion.div>
  )
}
