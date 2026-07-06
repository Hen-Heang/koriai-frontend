import type { VocabItem, SentenceChallengeResponse, SentenceCheckResponse } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { getUserId, requireUserId } from "@/lib/auth-store"
import { applyRating, type ReviewRating } from "@/lib/srs"
import { prepareVocabImport } from "@/lib/vocab-import"
import { aiPost } from "./ai-client"

// Vocab over kori_vocab_cards. SRS grading is computed client-side (lib/srs.ts,
// the mirror of the old backend SrsScheduler) and persisted here. AI features
// (lookup / generate / sentence challenge) go through app/api/ai/* routes.

// Cards fetched per review batch. Not a daily cap: when a batch is cleared the
// next one loads (useVocab invalidates once dueWords empties), so the learner
// can keep going until the true due count (getDueCount) reaches zero.
const REVIEW_SESSION_SIZE = 20

type VocabRow = {
  id: string
  category: string
  term: string
  meaning: string
  pronunciation: string | null
  example: string | null
  example_translation: string | null
  difficulty_level: string | null
  tags: string[]
  mastery: number
  next_review: string
  ease_factor: number
  interval_days: number
  repetitions: number
  lapses: number
}

function toItem(row: VocabRow): VocabItem {
  return {
    id: row.id,
    category: row.category,
    term: row.term,
    meaning: row.meaning,
    pronunciation: row.pronunciation ?? undefined,
    example: row.example ?? undefined,
    exampleTranslation: row.example_translation ?? undefined,
    difficultyLevel: (row.difficulty_level as VocabItem["difficultyLevel"]) ?? undefined,
    mastery: row.mastery,
    nextReview: row.next_review,
    tags: row.tags ?? [],
    easeFactor: row.ease_factor,
    intervalDays: row.interval_days,
    repetitions: row.repetitions,
    lapses: row.lapses,
  }
}

async function rateCard(id: string, rating: ReviewRating): Promise<VocabItem> {
  const { data: row, error } = await supabase
    .from("kori_vocab_cards")
    .select("*")
    .eq("id", id)
    .single()
  if (error) throw error
  const card = row as VocabRow
  const next = applyRating(
    {
      easeFactor: card.ease_factor,
      intervalDays: card.interval_days,
      repetitions: card.repetitions,
      lapses: card.lapses,
      mastery: card.mastery,
    },
    rating,
  )
  const { data: updated, error: updateError } = await supabase
    .from("kori_vocab_cards")
    .update({
      ease_factor: next.easeFactor,
      interval_days: next.intervalDays,
      repetitions: next.repetitions,
      lapses: next.lapses,
      mastery: next.mastery,
      next_review: next.nextReview,
    })
    .eq("id", id)
    .select()
    .single()
  if (updateError) throw updateError
  return toItem(updated as VocabRow)
}

export const vocabApi = {
  getSavedWords: async (): Promise<VocabItem[]> => {
    const { data, error } = await supabase
      .from("kori_vocab_cards")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data as VocabRow[]).map(toItem)
  },

  // One batch of due cards, most overdue first — a session-sized slice so a big
  // backlog doesn't render hundreds of cards at once. The full backlog size
  // comes from getDueCount. The .lte() filter is the server-side twin of
  // isDue() in lib/srs.ts — keep both comparing full ISO timestamps.
  getDueWords: async (): Promise<VocabItem[]> => {
    const { data, error } = await supabase
      .from("kori_vocab_cards")
      .select("*")
      .lte("next_review", new Date().toISOString())
      .order("next_review", { ascending: true })
      .limit(REVIEW_SESSION_SIZE)
    if (error) throw error
    return (data as VocabRow[]).map(toItem)
  },

  // True number of due cards (not capped at the batch size) — what the stats
  // and the Practice page show.
  getDueCount: async (): Promise<number> => {
    const { count, error } = await supabase
      .from("kori_vocab_cards")
      .select("id", { count: "exact", head: true })
      .lte("next_review", new Date().toISOString())
    if (error) throw error
    return count ?? 0
  },

  markReviewed: (id: string, correct = true) => rateCard(id, correct ? "GOOD" : "AGAIN"),

  rate: (id: string, rating: ReviewRating) => rateCard(id, rating),

  save: async (data: { category?: string; term: string; meaning: string; example?: string }) => {
    const { data: row, error } = await supabase
      .from("kori_vocab_cards")
      .insert({
        user_id: requireUserId(),
        category: data.category ?? "General",
        term: data.term,
        meaning: data.meaning,
        example: data.example ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return toItem(row as VocabRow)
  },

  lookup: (word: string) =>
    aiPost<{
      word: string
      definition: string
      example?: string | null
      exampleTranslation?: string | null
      hanja?: string | null
    }>("/vocab/lookup", { word }),

  generate: async (category: string, count = 10): Promise<VocabItem[]> => {
    const userId = requireUserId()
    const { words } = await aiPost<{
      words: Array<{
        term: string
        meaning: string
        pronunciation?: string
        example?: string
        exampleTranslation?: string
        difficultyLevel?: string
      }>
    }>("/vocab/generate", { category, count })
    const { data, error } = await supabase
      .from("kori_vocab_cards")
      .insert(
        words.map((w) => ({
          user_id: userId,
          category,
          term: w.term,
          meaning: w.meaning,
          pronunciation: w.pronunciation ?? null,
          example: w.example ?? null,
          example_translation: w.exampleTranslation ?? null,
          difficulty_level: w.difficultyLevel ?? null,
        })),
      )
      .select()
    if (error) throw error
    return (data as VocabRow[]).map(toItem)
  },

  importList: async (category: string, text: string): Promise<VocabItem[]> => {
    const userId = requireUserId()
    const { data: existingTerms, error: existingError } = await supabase
      .from("kori_vocab_cards")
      .select("term")
    if (existingError) throw existingError
    const prepared = prepareVocabImport(text, (existingTerms ?? []).map((w) => w.term))
    if (prepared.entries.length === 0) return []
    // Entries are cleaned "term — meaning" lines (the old backend parsed them
    // with AI); split on the first separator, meaning may be empty.
    const separator = /\s*(?:—|–|\s-\s|:|=|,|\t)\s*/
    const rows = prepared.entries.map((line) => {
      const [term, ...rest] = line.split(separator)
      return {
        user_id: userId,
        category,
        term: (term ?? line).trim() || line,
        meaning: rest.join(", ").trim(),
      }
    })
    const { data, error } = await supabase.from("kori_vocab_cards").insert(rows).select()
    if (error) throw error
    return (data as VocabRow[]).map(toItem)
  },

  update: async (
    id: string,
    data: { term: string; meaning: string; example?: string; pronunciation?: string; category?: string },
  ): Promise<VocabItem> => {
    const { data: row, error } = await supabase
      .from("kori_vocab_cards")
      .update({
        term: data.term,
        meaning: data.meaning,
        example: data.example ?? null,
        pronunciation: data.pronunciation ?? null,
        ...(data.category ? { category: data.category } : {}),
      })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return toItem(row as VocabRow)
  },

  remove: async (id: string) => {
    const { error } = await supabase.from("kori_vocab_cards").delete().eq("id", id)
    if (error) throw error
    return { deleted: true }
  },

  getSentenceChallenge: async (id: string): Promise<SentenceChallengeResponse> => {
    const { data, error } = await supabase
      .from("kori_vocab_cards")
      .select("id, term, meaning")
      .eq("id", id)
      .single()
    if (error) throw error
    return aiPost<SentenceChallengeResponse>("/vocab/sentence-challenge", {
      cardId: data.id,
      term: data.term,
      meaning: data.meaning,
    })
  },

  checkSentence: (id: string, data: { challengePrompt: string; attempt: string }) =>
    aiPost<SentenceCheckResponse>("/vocab/check-sentence", { cardId: id, ...data }),

  // All-time best correct-streak in quiz/recall review mode, server-backed so
  // it syncs across devices (kori_profiles.best_vocab_streak).
  getBestStreak: async (): Promise<{ bestStreak: number }> => {
    const { data, error } = await supabase
      .from("kori_profiles")
      .select("best_vocab_streak")
      .maybeSingle()
    if (error) throw error
    return { bestStreak: data?.best_vocab_streak ?? 0 }
  },

  submitBestStreak: async (streak: number): Promise<{ bestStreak: number }> => {
    const userId = requireUserId()
    const current = await vocabApi.getBestStreak()
    const bestStreak = Math.max(current.bestStreak, streak)
    if (bestStreak !== current.bestStreak) {
      const { error } = await supabase
        .from("kori_profiles")
        .upsert({ id: userId, best_vocab_streak: bestStreak })
      if (error) throw error
    }
    return { bestStreak }
  },
}
