import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"
import type {
  EvaluationScore,
  InterviewAnalytics,
  CriterionScores,
} from "@/lib/interview"
import type { EnrichedDrillQuestion, SpeakingScores } from "@/lib/interview-drills"
import type { InterviewMode } from "@/lib/interview-modes"
import type { SkillCode } from "@/lib/learning/skills"
import { aiPost } from "./ai-client"
import { skillsApi } from "./skills"

const EVALUATION_LABEL_TO_SKILL: Record<string, SkillCode> = {
  Speaking: "interview.speaking",
  Pronunciation: "interview.speaking",
  Vocabulary: "interview.vocabulary",
  Confidence: "interview.confidence",
}

// Mock Interview / Exam Prep
// The examiner Q&A itself runs over the chat layer (chatApi). These helpers
// keep interview-specific persistence — the written script the candidate
// submits before the exam, and finished mock-interview attempts — plus the
// structured end-of-session evaluation route.
export interface InterviewScript {
  topicId: string
  sections: Record<string, string>
  updatedAt: string
}

/** One line of the session transcript sent to the evaluate route. */
export interface TranscriptEntry {
  role: "examiner" | "candidate"
  text: string
}

/** Structured response from POST /api/ai/interview/evaluate. */
export interface EvaluateResponse {
  scores: CriterionScores
  summary: string
  advice: string[]
  analytics: InterviewAnalytics
}

/** Structured response from POST /api/ai/interview/speaking-check. */
export interface SpeakingCheckResponse {
  scores: SpeakingScores
  feedback: string
  correctedAnswer: string
  betterAlternative: string
  tip: string
}

/** A finished mock interview, as stored in kori_interview_attempts. */
export interface InterviewAttempt {
  id: string
  mode: InterviewMode
  topicId: string
  scores: EvaluationScore[]
  overall: number
  summary: string
  advice: string[]
  analytics: InterviewAnalytics | null
  questionCount: number
  durationSeconds: number
  createdAt: string
}

interface AttemptRow {
  id: string
  mode: InterviewMode
  topic_id: string
  scores: EvaluationScore[]
  overall: number
  summary: string
  advice: string[]
  analytics: InterviewAnalytics | null
  question_count: number
  duration_seconds: number
  created_at: string
}

const ATTEMPT_COLUMNS =
  "id, mode, topic_id, scores, overall, summary, advice, analytics, question_count, duration_seconds, created_at"

function mapAttempt(row: AttemptRow): InterviewAttempt {
  return {
    id: row.id,
    mode: row.mode,
    topicId: row.topic_id,
    scores: row.scores,
    overall: Number(row.overall),
    summary: row.summary,
    advice: row.advice,
    analytics: row.analytics,
    questionCount: row.question_count,
    durationSeconds: row.duration_seconds,
    createdAt: row.created_at,
  }
}

export const interviewApi = {
  getScript: async (topicId: string): Promise<InterviewScript | null> => {
    const { data, error } = await supabase
      .from("kori_interview_scripts")
      .select("topic_id, sections, updated_at")
      .eq("topic_id", topicId)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return { topicId: data.topic_id, sections: data.sections, updatedAt: data.updated_at }
  },

  saveScript: async (topicId: string, sections: Record<string, string>): Promise<InterviewScript> => {
    const userId = requireUserId()
    const { data, error } = await supabase
      .from("kori_interview_scripts")
      .upsert({ user_id: userId, topic_id: topicId, sections })
      .select("topic_id, sections, updated_at")
      .single()
    if (error) throw error
    return { topicId: data.topic_id, sections: data.sections, updatedAt: data.updated_at }
  },

  /** One batch of fresh drill questions (with listening glosses) per session. */
  drillQuestions: (payload: {
    kind: "speaking" | "listening"
    count: number
    complexityHint: string
    styleExamples: string[]
    avoid: string[]
  }): Promise<{ questions: EnrichedDrillQuestion[] }> =>
    aiPost<{ questions: EnrichedDrillQuestion[] }>("/interview/drill-questions", payload),

  /** Grades one spoken drill answer (six 1–5 scores + coaching). */
  speakingCheck: (payload: { question: string; answer: string }): Promise<SpeakingCheckResponse> =>
    aiPost<SpeakingCheckResponse>("/interview/speaking-check", payload),

  /** Structured end-of-session scorecard + transcript analytics. */
  evaluate: (payload: {
    topicId: string
    mode: InterviewMode
    transcript: TranscriptEntry[]
    questionCount: number
    durationSeconds: number
  }): Promise<EvaluateResponse> => aiPost<EvaluateResponse>("/interview/evaluate", payload),

  /** Persists a finished mock. The id is client-generated and shared with the
   *  localStorage scorecard so merged reads can dedupe. */
  saveAttempt: async (attempt: Omit<InterviewAttempt, "createdAt">): Promise<InterviewAttempt> => {
    const userId = requireUserId()
    const { data, error } = await supabase
      .from("kori_interview_attempts")
      .insert({
        id: attempt.id,
        user_id: userId,
        mode: attempt.mode,
        topic_id: attempt.topicId,
        scores: attempt.scores,
        overall: attempt.overall,
        summary: attempt.summary,
        advice: attempt.advice,
        analytics: attempt.analytics,
        question_count: attempt.questionCount,
        duration_seconds: attempt.durationSeconds,
      })
      .select(ATTEMPT_COLUMNS)
      .single()
    if (error) throw error

    for (const s of attempt.scores) {
      const skillCode = EVALUATION_LABEL_TO_SKILL[s.label]
      if (!skillCode) continue
      void skillsApi.recordEvent({
        skillCode,
        sourceFeature: "interview_evaluation",
        sourceId: attempt.id,
        score: Math.round((s.score / s.max) * 100),
      })
    }
    void skillsApi.recordEvent({
      skillCode: "interview.task_completion",
      sourceFeature: "interview_evaluation",
      sourceId: attempt.id,
      score: Math.round(attempt.overall * 20),
    })

    return mapAttempt(data as AttemptRow)
  },

  /** Past attempts, oldest first (matches the local trend's ordering). */
  listAttempts: async (limit = 50): Promise<InterviewAttempt[]> => {
    const { data, error } = await supabase
      .from("kori_interview_attempts")
      .select(ATTEMPT_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) throw error
    return ((data ?? []) as AttemptRow[]).map(mapAttempt).reverse()
  },
}
