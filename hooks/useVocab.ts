"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"

import { vocabApi } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"
import { useLogActivity } from "@/hooks/useLogActivity"
import type { ReviewRating } from "@/lib/srs"
import type { VocabItem } from "@/lib/types"

function normalizeWord(raw: unknown): VocabItem {
  const source = (raw ?? {}) as Record<string, unknown>
  return {
    id: String(source.id ?? crypto.randomUUID()),
    category: String(source.category ?? "Saved phrases"),
    term: String(source.term ?? ""),
    meaning: String(source.meaning ?? ""),
    example: source.example ? String(source.example) : undefined,
    exampleTranslation: source.exampleTranslation ? String(source.exampleTranslation) : undefined,
    pronunciation: source.pronunciation ? String(source.pronunciation) : undefined,
    difficultyLevel: source.difficultyLevel as VocabItem["difficultyLevel"],
    mastery: Number(source.mastery ?? 0),
    nextReview: String(source.nextReview ?? "-"),
    tags: Array.isArray(source.tags) ? source.tags.map((tag) => String(tag)) : [],
    easeFactor: Number(source.easeFactor ?? 2.5),
    intervalDays: Number(source.intervalDays ?? 0),
    repetitions: Number(source.repetitions ?? 0),
    lapses: Number(source.lapses ?? 0),
  }
}

interface VocabData {
  savedWords: VocabItem[]
  dueWords: VocabItem[]
}

async function fetchWords(): Promise<VocabData> {
  const [savedData, dueData] = await Promise.all([
    vocabApi.getSavedWords(),
    vocabApi.getDueWords(),
  ])

  return {
    savedWords: Array.isArray(savedData) ? savedData.map(normalizeWord) : [],
    dueWords: Array.isArray(dueData) ? dueData.map(normalizeWord) : [],
  }
}

export const vocabQueryKey = (userId?: number | null) => ["vocab", userId] as const

export function useVocab() {
  const userId = getUserId()
  const queryClient = useQueryClient()
  const { logActivity } = useLogActivity()
  const key = vocabQueryKey(userId)

  const { data, isPending, isError } = useQuery({
    queryKey: key,
    queryFn: fetchWords,
    enabled: userId != null,
  })

  const words = data?.savedWords ?? []
  const dueToday = data?.dueWords ?? []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: key })

  // Manually add a single word, creating its topic/category on the fly if new.
  const addWord = async (data: {
    category?: string
    term: string
    meaning: string
    example?: string
  }) => {
    const saved = await vocabApi.save(data)
    await invalidate()
    void logActivity()
    return saved
  }

  const markReviewed = async (id: string) => {
    await vocabApi.markReviewed(id)
    await invalidate()
    void logActivity()
  }

  // Patch the cache from the response instead of refetching the whole deck, so
  // grading mid-session is instant.
  const rateWord = async (id: string, rating: ReviewRating) => {
    const updated = normalizeWord(await vocabApi.rate(id, rating))
    queryClient.setQueryData<VocabData>(key, (prev) => {
      if (!prev) return prev
      const savedWords = prev.savedWords.map((w) => (w.id === id ? updated : w))
      const today = new Date().toISOString().slice(0, 10)
      const without = prev.dueWords.filter((w) => w.id !== id)
      const dueWords = updated.nextReview <= today ? [...without, updated] : without
      return { savedWords, dueWords }
    })
    void logActivity()
  }

  const generate = async (category: string) => {
    const generated = await vocabApi.generate(category)
    await invalidate()
    return generated
  }

  const updateWord = async (
    id: string,
    data: { term: string; meaning: string; example?: string; pronunciation?: string }
  ) => {
    await vocabApi.update(id, data)
    await invalidate()
  }

  const deleteWord = async (id: string) => {
    await vocabApi.remove(id)
    await invalidate()
  }

  const importList = async (category: string, text: string) => {
    const imported = await vocabApi.importList(category, text)
    await invalidate()
    return Array.isArray(imported) ? imported.length : 0
  }

  return {
    dueToday,
    error: isError ? "Failed to load vocabulary data." : "",
    loading: isPending,
    addWord,
    markReviewed,
    rateWord,
    generate,
    importList,
    updateWord,
    deleteWord,
    words,
  }
}
