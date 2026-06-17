// Local history of mock-interview scorecards, so the candidate can see their
// trajectory across the four exam criteria over time. Frontend-only persistence
// (localStorage) — the evaluation rides on the existing chat backend and there
// is no scorecard endpoint, so the device is the source of truth.

import type { EvaluationScore, InterviewEvaluation } from "./interview"

const STORAGE_KEY = "koriai-interview-scorecards"
const MAX_RECORDS = 50

export interface ScorecardRecord {
  id: string
  /** ISO timestamp of when the mock was scored. */
  date: string
  /** Average of the criteria, normalised to a 0–5 scale. */
  overall: number
  scores: EvaluationScore[]
}

/** Average of the scores normalised to 0–5, rounded to one decimal. */
export function computeOverall(scores: EvaluationScore[]): number {
  if (scores.length === 0) return 0
  const sum = scores.reduce((acc, s) => acc + (s.score / s.max) * 5, 0)
  return Math.round((sum / scores.length) * 10) / 10
}

/**
 * Pure: append a scorecard for `evaluation` to `history`, capping to the most
 * recent MAX_RECORDS. Returns `history` unchanged when there are no scores.
 */
export function appendScorecard(
  history: ScorecardRecord[],
  evaluation: InterviewEvaluation,
  now: Date = new Date()
): ScorecardRecord[] {
  if (evaluation.scores.length === 0) return history
  const record: ScorecardRecord = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `sc-${now.getTime()}`,
    date: now.toISOString(),
    overall: computeOverall(evaluation.scores),
    scores: evaluation.scores,
  }
  return [...history, record].slice(-MAX_RECORDS)
}

export function loadScorecards(): ScorecardRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as ScorecardRecord[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Append the evaluation to the stored history and persist it. Returns the
 * updated list so callers can update state without a re-read.
 */
export function saveScorecard(
  evaluation: InterviewEvaluation,
  now: Date = new Date()
): ScorecardRecord[] {
  const next = appendScorecard(loadScorecards(), evaluation, now)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Ignore quota / private-mode failures — the in-memory list still updates.
  }
  return next
}
