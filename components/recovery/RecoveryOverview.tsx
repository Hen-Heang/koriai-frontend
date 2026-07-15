"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { Wind, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EditHabitDialog } from "@/components/recovery/EditHabitDialog"
import { LiveElapsedClock } from "@/components/recovery/LiveElapsedClock"
import { itemVariants } from "@/lib/motion"
import type { RecoveryHabit } from "@/lib/types"

// Headline is always daysSinceLastEvent (the one metric that would have
// caught a long silent gap) — never the streak. See lib/recovery.ts. Below the
// quiet-gap threshold, it's shown as a live-ticking clock (days:hrs:min:sec);
// above it, the exact count is deliberately dropped for calmer "welcome back"
// copy — a large ticking number for a long-neglected habit reads as guilt,
// which is exactly what this module is designed against.
const QUIET_GAP_DAYS = 3

export function RecoveryOverview({
  habit,
  daysSinceLastEvent,
  lastEventAt,
  rodeOutCount,
  streakDays,
  onUpdateHabit,
  onDeleteHabit,
}: {
  habit: RecoveryHabit
  daysSinceLastEvent: number | null
  lastEventAt: string | null
  rodeOutCount: number
  streakDays: number
  onUpdateHabit: (data: { label: string; replacementBehavior?: string | null }) => Promise<unknown>
  onDeleteHabit: () => Promise<unknown>
}) {
  const neverLogged = daysSinceLastEvent === null
  const isQuietGap = daysSinceLastEvent !== null && daysSinceLastEvent > QUIET_GAP_DAYS

  return (
    <motion.div variants={itemVariants} className="mx-auto max-w-xl space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-muted-foreground">{habit.label}</p>
          <EditHabitDialog habit={habit} onUpdate={onUpdateHabit} onDelete={onDeleteHabit} />
        </div>

        {neverLogged ? (
          <>
            <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">Ready when you are</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Log a moment whenever something comes up — there&apos;s nothing to catch up on.
            </p>
          </>
        ) : isQuietGap ? (
          <>
            <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Nothing to catch up on — just log where you are now.
            </p>
          </>
        ) : (
          <>
            {lastEventAt && (
              <div className="mt-5">
                <LiveElapsedClock since={lastEventAt} />
              </div>
            )}
            <p className="mt-3 text-sm text-muted-foreground">since your last check-in</p>
          </>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground">
            {rodeOutCount} ridden out
          </div>
          {/* Streak: small chip only, never the headline, never celebrated. */}
          <div className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
            {streakDays}d streak
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="w-full sm:flex-1">
          <Link href="/growth/recovery/pause">
            <Wind size={18} strokeWidth={2} />
            Pause
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="w-full sm:flex-1">
          <Link href="/growth/recovery/log">
            <Zap size={18} strokeWidth={2} />
            Log a moment
          </Link>
        </Button>
      </div>
    </motion.div>
  )
}
