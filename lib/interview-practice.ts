// Pure logic for the interview-practice extension (kori_interview_questions /
// _question_progress / _answers / _script_versions — see the migration
// comment in supabase/migrations/20260722010000_interview_practice.sql for
// why these exist alongside the older kori_interview_scripts/_attempts).
// Kept side-effect-free and unit-tested, same split as lib/srs.ts /
// lib/learning/corrections.ts: the actual Supabase reads/writes live in
// lib/api/interview.ts and just call these.

export type QuestionCategory =
  | "topic_selection"
  | "korean_summer"
  | "cambodian_weather"
  | "comparison"
  | "daily_life"
  | "health"
  | "personal_experience"
  | "swimming_pool"
  | "seonyudo_park"
  | "adaptation"
  | "opinion"
  | "unexpected_followup"

export type QuestionDifficulty = "beginner" | "normal" | "challenging"
export type QuestionPriority = "must_practice" | "recommended" | "optional"
export type QuestionProgressStatus = "new" | "practicing" | "improving" | "strong"

export interface QuestionBankItem {
  id: string
  questionKo: string
  questionEn: string | null
  sampleAnswerKo: string | null
  sampleAnswerEn: string | null
  category: QuestionCategory
  difficulty: QuestionDifficulty
  priority: QuestionPriority
  keywords: string[]
  displayOrder: number
  ownedByUser: boolean
}

export interface QuestionProgress {
  questionId: string
  timesPracticed: number
  avgScore: number | null
  lastScore: number | null
  lastPracticedAt: string | null
  status: QuestionProgressStatus
}

/** Mean of every numeric value in a scores object (works for both the 6-key
 *  drill SpeakingCheckResponse.scores and the 4-key mock-interview scores). */
export function averageScore(scores: Record<string, number>): number {
  const values = Object.values(scores)
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function deriveStatus(timesPracticed: number, avgScore: number): QuestionProgressStatus {
  if (timesPracticed === 0) return "new"
  if (avgScore >= 4.3) return "strong"
  if (timesPracticed >= 2 && avgScore >= 3.5) return "improving"
  return "practicing"
}

/** Incremental-average update of a question's progress after one new answer
 *  is scored. `existing` is null the first time a question is practiced. */
export function computeNextProgress(
  existing: Pick<QuestionProgress, "timesPracticed" | "avgScore"> | null,
  newScore: number,
  now: Date = new Date(),
): Omit<QuestionProgress, "questionId"> {
  const timesPracticed = (existing?.timesPracticed ?? 0) + 1
  const previousAvg = existing?.avgScore ?? newScore
  const avgScore = previousAvg + (newScore - previousAvg) / timesPracticed
  return {
    timesPracticed,
    avgScore,
    lastScore: newScore,
    lastPracticedAt: now.toISOString(),
    status: deriveStatus(timesPracticed, avgScore),
  }
}

const PRIORITY_WEIGHT: Record<QuestionPriority, number> = {
  must_practice: 30,
  recommended: 15,
  optional: 0,
}

// Days-since-last-practiced contribution is capped so a question practiced
// months ago doesn't permanently dominate the queue over a genuinely weak one.
const MAX_STALENESS_DAYS = 30

/**
 * Deterministic urgency score for "Focus on weak questions" mode — higher
 * sorts first. Never-practiced questions always outrank practiced ones;
 * among practiced questions, lower average score wins, with priority and
 * staleness (days since last practiced) as tiebreakers. No randomness, so
 * ordering is stable and testable.
 */
export function focusScore(
  question: Pick<QuestionBankItem, "priority">,
  progress: QuestionProgress | null,
  now: Date = new Date(),
): number {
  const priorityWeight = PRIORITY_WEIGHT[question.priority]
  if (!progress || progress.timesPracticed === 0) {
    return 1000 + priorityWeight
  }
  const avgScore = progress.avgScore ?? 0
  const urgency = (5 - avgScore) * 20
  const daysSince = progress.lastPracticedAt
    ? Math.min(
        MAX_STALENESS_DAYS,
        Math.floor((now.getTime() - new Date(progress.lastPracticedAt).getTime()) / 86_400_000),
      )
    : MAX_STALENESS_DAYS
  return urgency + priorityWeight + daysSince
}

/**
 * Orders questions for "Focus on weak questions" mode and returns the top
 * `size`. Ties (equal focusScore) keep the bank's own displayOrder so the
 * result is fully deterministic — no RNG, per the "simple deterministic
 * selection first" requirement.
 */
export function selectFocusQueue(
  questions: QuestionBankItem[],
  progressByQuestionId: Record<string, QuestionProgress>,
  size: number,
  now: Date = new Date(),
): QuestionBankItem[] {
  return [...questions]
    .sort((a, b) => {
      const scoreDiff =
        focusScore(a, progressByQuestionId[a.id] ?? null, now) -
        focusScore(b, progressByQuestionId[b.id] ?? null, now)
      if (scoreDiff !== 0) return -scoreDiff
      return a.displayOrder - b.displayOrder
    })
    .slice(0, Math.max(0, size))
}

export interface ScriptVersionRef {
  id: string
  isActive: boolean
}

/**
 * "Only one active script version at a time": given the current versions and
 * the id being activated, returns the ids that must be flipped to inactive.
 * Pure so the invariant is testable without a database — lib/api/interview.ts
 * runs this then issues the actual updates.
 */
export function versionsToDeactivate(versions: ScriptVersionRef[], activatingId: string): string[] {
  return versions.filter((v) => v.isActive && v.id !== activatingId).map((v) => v.id)
}

/** The N lowest-scoring practiced questions — the dashboard's "most difficult
 *  questions" list. Unpracticed questions are excluded (nothing to rank yet). */
export function mostDifficultQuestions(
  questions: QuestionBankItem[],
  progressByQuestionId: Record<string, QuestionProgress>,
  size: number,
): QuestionBankItem[] {
  return questions
    .filter((q) => (progressByQuestionId[q.id]?.timesPracticed ?? 0) > 0)
    .sort((a, b) => {
      const scoreA = progressByQuestionId[a.id]?.avgScore ?? 0
      const scoreB = progressByQuestionId[b.id]?.avgScore ?? 0
      return scoreA - scoreB
    })
    .slice(0, Math.max(0, size))
}
