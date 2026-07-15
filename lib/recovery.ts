import type { RecoveryEvent } from "./types"
import { applyRating, type ReviewRating, type SrsCardState, type SrsResult } from "./srs"

// Pure logic for the Recovery module — no React, no Supabase. Korea has no DST,
// so KST day/hour boundaries are a fixed +9h shift rather than a timezone
// library call; this keeps a slip logged at 00:30 KST filed under the
// correct calendar day.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

function kstDayNumber(iso: string): number {
  return Math.floor((new Date(iso).getTime() + KST_OFFSET_MS) / DAY_MS)
}

function kstHour(iso: string): number {
  return new Date(new Date(iso).getTime() + KST_OFFSET_MS).getUTCHours()
}

/** Most recent event's timestamp across any kind. Null if never logged. */
export function lastEventTimestamp(events: RecoveryEvent[]): string | null {
  if (events.length === 0) return null
  return events.reduce((latest, e) => (e.occurredAt > latest ? e.occurredAt : latest), events[0].occurredAt)
}

/** Primary metric: days since the most recent event of any kind, in this habit. Null if never logged. */
export function daysSinceLastEvent(events: RecoveryEvent[], now: Date = new Date()): number | null {
  const last = lastEventTimestamp(events)
  if (last === null) return null
  return kstDayNumber(now.toISOString()) - kstDayNumber(last)
}

export interface ElapsedBreakdown {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/**
 * Continuous elapsed time since `sinceIso`, broken into whole units — for a
 * live-ticking clock display. Unlike daysSinceLastEvent (calendar-day
 * boundaries, for the headline threshold logic), this is raw wall-clock
 * duration, clamped to zero if `now` is somehow before `sinceIso`.
 */
export function elapsedBreakdown(sinceIso: string, now: Date = new Date()): ElapsedBreakdown {
  const totalSeconds = Math.max(0, Math.floor((now.getTime() - new Date(sinceIso).getTime()) / 1000))
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  }
}

/** Secondary metric: urges logged and survived. Grows even on a day with a slip. */
export function rodeOutCount(events: RecoveryEvent[], since?: Date): number {
  return events.filter((e) => e.rodeOut === true && (!since || new Date(e.occurredAt) >= since)).length
}

/** Tertiary metric: the streak chip. Counts from the last slip, or from start if there hasn't been one. */
export function daysSince(startedAt: string, lastSlipAt: string | null, now: Date = new Date()): number {
  const anchor = lastSlipAt ?? startedAt
  return kstDayNumber(now.toISOString()) - kstDayNumber(anchor)
}

/**
 * 0..1 breathing-ring value for the pause timer: t^2 * (1-t)^3 peaks at
 * t=0.4 (a/(a+b) for exponents a=2, b=3), normalized to that peak.
 */
export function pauseCurve(elapsedSeconds: number, totalSeconds: number): number {
  const t = Math.min(1, Math.max(0, elapsedSeconds / totalSeconds))
  const raw = t ** 2 * (1 - t) ** 3
  const peak = 0.4 ** 2 * 0.6 ** 3
  return raw / peak
}

export interface RecoveryPatterns {
  topHour: number | null
  topTriggerId: string | null
  topEmotion: string | null
}

function mostCommon<T>(items: T[]): T | null {
  const counts = new Map<T, number>()
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1)
  let best: T | null = null
  let bestCount = 0
  for (const [item, count] of counts) {
    if (count > bestCount) {
      best = item
      bestCount = count
    }
  }
  return best
}

/** Most common hour bucket (KST), trigger, and emotion across a habit's events. */
export function topPatterns(events: RecoveryEvent[]): RecoveryPatterns {
  const triggerIds = events.map((e) => e.triggerId).filter((t): t is string => Boolean(t))
  const emotions = events.map((e) => e.emotion).filter((e): e is string => Boolean(e))
  return {
    topHour: mostCommon(events.map((e) => kstHour(e.occurredAt))),
    topTriggerId: mostCommon(triggerIds),
    topEmotion: mostCommon(emotions),
  }
}

// Rating adapter (Step 1, option 2): plans are rehearsed if-then statements,
// not vocab cards, so "was this EASY?" doesn't read right. This is the only
// place PlanOutcome <-> ReviewRating translation happens; lib/srs.ts stays
// generic and vocab-shaped.
export type PlanOutcome = "skipped" | "struggled" | "followed" | "followed_easily"

const OUTCOME_TO_RATING: Record<PlanOutcome, ReviewRating> = {
  skipped: "AGAIN",
  struggled: "HARD",
  followed: "GOOD",
  followed_easily: "EASY",
}

export function ratePlan(plan: SrsCardState, outcome: PlanOutcome): SrsResult {
  return applyRating(plan, OUTCOME_TO_RATING[outcome])
}
