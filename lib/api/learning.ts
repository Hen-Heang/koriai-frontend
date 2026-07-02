// Assorted single-purpose learning-feature endpoints, now split between
// Supabase tables (persistence, SRS) and app/api/ai routes (generation/grading).
import type {
  CorrectionReview,
  DailyPhrase,
  SentenceChallengeResponse,
  SentenceCheckResponse,
  GeneratedMessages,
  ListeningAttemptResult,
  ListeningLesson,
  MessageAnalysis,
  PracticeToday,
  QuizQuestion,
  ScenarioDetail,
} from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"
import { applyRating, type ReviewRating } from "@/lib/srs"
import { aiPost } from "./ai-client"
import { vocabApi } from "./vocab"

// ── Correction ──────────────────────────────────────────────────────────────

type CorrectionRow = {
  id: string
  original_text: string
  corrected_text: string
  explanation: string | null
  grammar_points: string[]
  mastery: number
  next_review_date: string
  ease_factor: number
  interval_days: number
  repetitions: number
  lapses: number
  created_at: string
}

function toCorrectionReview(row: CorrectionRow): CorrectionReview & { createdAt: string } {
  return {
    createdAt: row.created_at,
    id: row.id,
    originalText: row.original_text,
    correctedText: row.corrected_text,
    explanation: row.explanation ?? undefined,
    grammarPoints: row.grammar_points ?? [],
    mastery: row.mastery,
    nextReviewDate: row.next_review_date,
    easeFactor: row.ease_factor,
    intervalDays: row.interval_days,
    repetitions: row.repetitions,
    lapses: row.lapses,
  }
}

export const correctionApi = {
  // AI checks the text; if it found mistakes, the correction is saved so it
  // resurfaces on the SRS schedule (same algorithm as vocab cards).
  check: async (text: string) => {
    const result = await aiPost<{
      originalText: string
      correctedText: string
      hasErrors: boolean
      explanation?: string
      grammarPoints?: string[]
    }>("/corrections/check", { text })
    if (result.hasErrors) {
      await supabase.from("kori_corrections").insert({
        user_id: requireUserId(),
        original_text: result.originalText,
        corrected_text: result.correctedText,
        explanation: result.explanation ?? null,
        grammar_points: result.grammarPoints ?? [],
      })
    }
    return result
  },

  history: async (limit = 10) => {
    const { data, error } = await supabase
      .from("kori_corrections")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data as CorrectionRow[]).map(toCorrectionReview)
  },

  getDueReviews: async (): Promise<CorrectionReview[]> => {
    const { data, error } = await supabase
      .from("kori_corrections")
      .select("*")
      .lte("next_review_date", new Date().toISOString())
      .order("next_review_date", { ascending: true })
    if (error) throw error
    return (data as CorrectionRow[]).map(toCorrectionReview)
  },

  rate: async (id: string | number, rating: ReviewRating): Promise<CorrectionReview> => {
    const { data: row, error } = await supabase
      .from("kori_corrections")
      .select("*")
      .eq("id", String(id))
      .single()
    if (error) throw error
    const c = row as CorrectionRow
    const next = applyRating(
      {
        easeFactor: c.ease_factor,
        intervalDays: c.interval_days,
        repetitions: c.repetitions,
        lapses: c.lapses,
        mastery: c.mastery,
      },
      rating,
    )
    const { data: updated, error: updateError } = await supabase
      .from("kori_corrections")
      .update({
        ease_factor: next.easeFactor,
        interval_days: next.intervalDays,
        repetitions: next.repetitions,
        lapses: next.lapses,
        mastery: next.mastery,
        next_review_date: next.nextReview,
      })
      .eq("id", String(id))
      .select()
      .single()
    if (updateError) throw updateError
    return toCorrectionReview(updated as CorrectionRow)
  },

  remove: async (id: string | number) => {
    const { error } = await supabase.from("kori_corrections").delete().eq("id", String(id))
    if (error) throw error
  },
}

// ── Daily Phrase ────────────────────────────────────────────────────────────

type DailyPhraseRow = {
  id: string
  date: string
  phrase: string
  meaning: string
  romanization: string | null
  when_to_use: string | null
  formality: string | null
  similar_expressions: DailyPhrase["similarExpressions"]
  learned: boolean
}

function toDailyPhrase(row: DailyPhraseRow): DailyPhrase {
  return {
    id: row.id,
    date: row.date,
    phrase: row.phrase,
    meaning: row.meaning,
    romanization: row.romanization ?? undefined,
    whenToUse: row.when_to_use ?? undefined,
    formality: row.formality ?? undefined,
    similarExpressions: row.similar_expressions ?? [],
    learned: row.learned,
  }
}

export const dailyPhraseApi = {
  // Today's phrase; generated on first request of the day.
  getToday: async (): Promise<DailyPhrase> => {
    const today = new Date().toISOString().slice(0, 10)
    const { data: existing, error } = await supabase
      .from("kori_daily_phrases")
      .select("*")
      .eq("date", today)
      .maybeSingle()
    if (error) throw error
    if (existing) return toDailyPhrase(existing as DailyPhraseRow)

    const generated = await aiPost<{
      phrase: string
      meaning: string
      romanization?: string
      whenToUse?: string
      formality?: string
      similarExpressions?: DailyPhrase["similarExpressions"]
    }>("/daily-phrase/generate", {})
    const { data: row, error: insertError } = await supabase
      .from("kori_daily_phrases")
      .insert({
        user_id: requireUserId(),
        date: today,
        phrase: generated.phrase,
        meaning: generated.meaning,
        romanization: generated.romanization ?? null,
        when_to_use: generated.whenToUse ?? null,
        formality: generated.formality ?? null,
        similar_expressions: generated.similarExpressions ?? [],
      })
      .select()
      .single()
    if (insertError) throw insertError
    return toDailyPhrase(row as DailyPhraseRow)
  },

  getHistory: async (): Promise<DailyPhrase[]> => {
    const { data, error } = await supabase
      .from("kori_daily_phrases")
      .select("*")
      .order("date", { ascending: false })
    if (error) throw error
    return (data as DailyPhraseRow[]).map(toDailyPhrase)
  },

  markLearned: async (id: string, learned = true) => {
    const { error } = await supabase
      .from("kori_daily_phrases")
      .update({ learned })
      .eq("id", id)
    if (error) throw error
  },

  addToFlashcards: async (id: string) => {
    const { data, error } = await supabase
      .from("kori_daily_phrases")
      .select("phrase, meaning")
      .eq("id", id)
      .single()
    if (error) throw error
    return vocabApi.save({ category: "Daily Phrase", term: data.phrase, meaning: data.meaning })
  },

  getPractice: async (id: string) => {
    const { data, error } = await supabase
      .from("kori_daily_phrases")
      .select("id, phrase, meaning")
      .eq("id", id)
      .single()
    if (error) throw error
    return aiPost<SentenceChallengeResponse>("/daily-phrase/practice", {
      phrase: data.phrase,
      meaning: data.meaning,
    })
  },

  checkPractice: (id: string, data: { challengePrompt: string; attempt: string }) =>
    aiPost<SentenceCheckResponse>("/daily-phrase/check-practice", data),
}

// ── Workplace Message Generator ─────────────────────────────────────────────

// Category list was a backend constant; now a frontend one.
const MESSAGE_CATEGORIES = [
  "Leave request",
  "Meeting scheduling",
  "Status update",
  "Asking for help",
  "Apology / delay",
  "Announcement",
  "Thanks / appreciation",
  "Code review comment",
]

export const messageGenApi = {
  getCategories: async (): Promise<string[]> => MESSAGE_CATEGORIES,
  generate: (intent: string, category?: string) =>
    aiPost<GeneratedMessages>("/message-generator", { intent, category }),
}

// ── Listening Practice ──────────────────────────────────────────────────────

const LISTENING_TOPICS = [
  "Daily standup",
  "Sprint planning",
  "Code review discussion",
  "Lunch with coworkers",
  "IT helpdesk call",
  "Team dinner (회식)",
  "One-on-one with manager",
  "Client meeting",
]

type ListeningRow = {
  id: string
  topic: string
  title: string
  level: string
  lines: ListeningLesson["lines"]
  quiz: QuizQuestion[]
  created_at: string
}

function toLesson(row: ListeningRow): ListeningLesson {
  return {
    id: row.id,
    topic: row.topic,
    title: row.title,
    level: row.level,
    lines: row.lines ?? [],
    quiz: row.quiz ?? [],
    createdAt: row.created_at,
  }
}

export const listeningApi = {
  getTopics: async (): Promise<string[]> => LISTENING_TOPICS,

  generate: async (topic: string): Promise<ListeningLesson> => {
    const generated = await aiPost<{
      title: string
      level: string
      lines: ListeningLesson["lines"]
      quiz: QuizQuestion[]
    }>("/listening/generate", { topic })
    const { data, error } = await supabase
      .from("kori_listening_lessons")
      .insert({
        user_id: requireUserId(),
        topic,
        title: generated.title,
        level: generated.level ?? "Beginner",
        lines: generated.lines ?? [],
        quiz: generated.quiz ?? [],
      })
      .select()
      .single()
    if (error) throw error
    return toLesson(data as ListeningRow)
  },

  getLessons: async (): Promise<ListeningLesson[]> => {
    const { data, error } = await supabase
      .from("kori_listening_lessons")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data as ListeningRow[]).map(toLesson)
  },

  getLesson: async (id: string): Promise<ListeningLesson> => {
    const { data, error } = await supabase
      .from("kori_listening_lessons")
      .select("*")
      .eq("id", id)
      .single()
    if (error) throw error
    return toLesson(data as ListeningRow)
  },

  // Graded client-side against the stored quiz; the attempt row is history.
  submitAttempt: async (lessonId: string, answers: number[]): Promise<ListeningAttemptResult> => {
    const lesson = await listeningApi.getLesson(lessonId)
    const results = lesson.quiz.map((q, i) => answers[i] === q.answerIndex)
    const score = results.filter(Boolean).length
    const total = lesson.quiz.length
    const accuracy = total > 0 ? Math.round((score / total) * 100) : 0
    const { error } = await supabase.from("kori_listening_attempts").insert({
      user_id: requireUserId(),
      lesson_id: lessonId,
      score,
      total,
      accuracy,
      results,
    })
    if (error) throw error
    return { lessonId, score, total, accuracy, results }
  },
}

// ── Scenarios ───────────────────────────────────────────────────────────────

type ScenarioRow = {
  id: string
  title: string
  category: string
  level: string
  summary: string
  goal: string
  intro_message: string | null
}

function toScenario(row: ScenarioRow): ScenarioDetail {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    level: row.level as ScenarioDetail["level"],
    summary: row.summary,
    goal: row.goal,
    introMessage: row.intro_message ?? undefined,
  }
}

export const scenarioApi = {
  getList: async (): Promise<ScenarioDetail[]> => {
    const { data, error } = await supabase.from("kori_scenarios").select("*").order("id")
    if (error) throw error
    return (data as ScenarioRow[]).map(toScenario)
  },
  getById: async (id: string): Promise<ScenarioDetail> => {
    const { data, error } = await supabase
      .from("kori_scenarios")
      .select("*")
      .eq("id", id)
      .single()
    if (error) throw error
    return toScenario(data as ScenarioRow)
  },
}

// ── Workplace Korean Analyzer (Module 9) ────────────────────────────────────

type AnalyzerRow = {
  id: string
  source: string | null
  original_text: string
  analysis: Omit<MessageAnalysis, "id" | "source" | "originalText" | "modelUsed" | "createdAt">
  model_used: string | null
  created_at: string
}

function toAnalysis(row: AnalyzerRow): MessageAnalysis {
  return {
    ...row.analysis,
    id: row.id,
    source: row.source,
    originalText: row.original_text,
    modelUsed: row.model_used ?? "",
    createdAt: row.created_at,
  }
}

export const analyzerApi = {
  analyze: async (text: string, source?: string): Promise<MessageAnalysis> => {
    const analysis = await aiPost<Omit<MessageAnalysis, "id" | "source" | "createdAt">>(
      "/analyzer",
      { text, source },
    )
    const { originalText: _o, modelUsed, ...rest } = analysis
    const { data, error } = await supabase
      .from("kori_analyzer_history")
      .insert({
        user_id: requireUserId(),
        source: source ?? null,
        original_text: text,
        analysis: rest,
        model_used: modelUsed ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return toAnalysis(data as AnalyzerRow)
  },

  history: async (limit = 30): Promise<MessageAnalysis[]> => {
    const { data, error } = await supabase
      .from("kori_analyzer_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data as AnalyzerRow[]).map(toAnalysis)
  },
}

// ── Daily Practice Hub ──────────────────────────────────────────────────────
// Aggregated client-side now (the backend used to compose this response).

const FALLBACK_SCENARIO: ScenarioDetail = {
  id: "daily-standup",
  title: "Daily Standup",
  category: "Meetings",
  level: "Beginner",
  summary: "Report yesterday's work, today's plan, and blockers in Korean.",
  goal: "Give a 3-sentence standup update.",
}

export const practiceApi = {
  getToday: async (): Promise<PracticeToday> => {
    const [profileRes, dueVocab, dueCorrections, dailyPhrase, scenarios] = await Promise.all([
      supabase.from("kori_profiles").select("korean_level").maybeSingle(),
      vocabApi.getDueWords(),
      correctionApi.getDueReviews(),
      dailyPhraseApi.getToday(),
      scenarioApi.getList().catch(() => [] as ScenarioDetail[]),
    ])
    const scenario =
      scenarios.length > 0
        ? scenarios[Math.floor(Math.random() * scenarios.length)]
        : FALLBACK_SCENARIO
    return {
      userLevel: profileRes.data?.korean_level ?? "BEGINNER",
      dueVocabCount: dueVocab.length,
      dueVocabSample: dueVocab.slice(0, 5),
      dueCorrectionsCount: dueCorrections.length,
      dueCorrectionsSample: dueCorrections.slice(0, 5),
      dailyPhrase,
      suggestedScenario: scenario,
      suggestedMessageCategory:
        MESSAGE_CATEGORIES[Math.floor(Math.random() * MESSAGE_CATEGORIES.length)],
      suggestedListeningTopic:
        LISTENING_TOPICS[Math.floor(Math.random() * LISTENING_TOPICS.length)],
    }
  },
}

/* ── Spring backend implementation (kept for later restore) ──────────────────
import { api } from "./client"

export const correctionApi = {
  check: (text: string) => api.post("/corrections/check", { text }).then((r) => r.data.data),
  history: (limit = 10) => api.get(`/corrections/history?limit=${limit}`).then((r) => r.data.data),
  getDueReviews: () => api.get("/corrections/review/due").then((r) => r.data.data),
  rate: (id, rating) => api.post(`/corrections/${id}/rate?rating=${rating}`).then((r) => r.data.data),
  remove: (id) => api.delete(`/corrections/${id}`).then((r) => r.data.data),
}
export const dailyPhraseApi = {
  getToday: () => api.get("/daily-phrase/today").then((r) => r.data.data),
  getHistory: () => api.get("/daily-phrase/history").then((r) => r.data.data),
  markLearned: (id, learned = true) => api.post(`/daily-phrase/${id}/learned?learned=${learned}`).then((r) => r.data.data),
  addToFlashcards: (id) => api.post(`/daily-phrase/${id}/flashcard`).then((r) => r.data.data),
  getPractice: (id) => api.get(`/daily-phrase/${id}/practice`).then((r) => r.data.data),
  checkPractice: (id, data) => api.post(`/daily-phrase/${id}/check-practice`, data).then((r) => r.data.data),
}
export const messageGenApi = {
  getCategories: () => api.get("/message-generator/categories").then((r) => r.data.data),
  generate: (intent, category) => api.post("/message-generator/generate", { intent, category }).then((r) => r.data.data),
}
export const listeningApi = {
  getTopics: () => api.get("/listening/topics").then((r) => r.data.data),
  generate: (topic) => api.post(`/listening/generate?topic=${encodeURIComponent(topic)}`).then((r) => r.data.data),
  getLessons: () => api.get("/listening/lessons").then((r) => r.data.data),
  getLesson: (id) => api.get(`/listening/lessons/${id}`).then((r) => r.data.data),
  submitAttempt: (lessonId, answers) => api.post("/listening/attempts", { lessonId: Number(lessonId), answers }).then((r) => r.data.data),
}
export const scenarioApi = {
  getList: () => api.get("/scenarios").then((r) => r.data.data),
  getById: (id) => api.get(`/scenarios/${id}`).then((r) => r.data.data),
}
export const analyzerApi = {
  analyze: (text, source) => api.post("/analyzer/analyze", { text, source }).then((r) => r.data.data),
  history: (limit = 30) => api.get(`/analyzer/history?limit=${limit}`).then((r) => r.data.data),
}
export const practiceApi = {
  getToday: () => api.get("/practice/today").then((r) => r.data.data),
}
────────────────────────────────────────────────────────────────────────────── */
