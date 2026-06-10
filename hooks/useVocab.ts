"use client"

import { useEffect, useState } from "react"

import { vocabApi } from "@/lib/api"
import type { VocabItem } from "@/lib/types"

function normalizeWord(raw: unknown): VocabItem {
  const source = (raw ?? {}) as Record<string, unknown>
  return {
    id: String(source.id ?? crypto.randomUUID()),
    term: String(source.term ?? ""),
    meaning: String(source.meaning ?? ""),
    example: source.example ? String(source.example) : undefined,
    exampleTranslation: source.exampleTranslation ? String(source.exampleTranslation) : undefined,
    pronunciation: source.pronunciation ? String(source.pronunciation) : undefined,
    difficultyLevel: source.difficultyLevel as VocabItem["difficultyLevel"],
    mastery: Number(source.mastery ?? 0),
    nextReview: String(source.nextReview ?? "-"),
    tags: Array.isArray(source.tags) ? source.tags.map((tag) => String(tag)) : [],
  }
}

export function useVocab() {
  const [words, setWords] = useState<VocabItem[]>([])
  const [dueToday, setDueToday] = useState<VocabItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function fetchWords() {
    const [savedData, dueData] = await Promise.all([
      vocabApi.getSavedWords(),
      vocabApi.getDueWords(),
    ])

    const savedWords = Array.isArray(savedData)
      ? savedData.map((item) => normalizeWord(item))
      : []
    const dueWords = Array.isArray(dueData)
      ? dueData.map((item) => normalizeWord(item))
      : []

    return { dueWords, savedWords }
  }

  useEffect(() => {
    let active = true

    fetchWords()
      .then(({ dueWords, savedWords }) => {
        if (!active) {
          return
        }
        setWords(savedWords)
        setDueToday(dueWords)
      })
      .catch(() => {
        if (active) {
          setError("Failed to load vocabulary data.")
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const markReviewed = async (id: string) => {
    await vocabApi.markReviewed(id)
    const { dueWords, savedWords } = await fetchWords()
    setWords(savedWords)
    setDueToday(dueWords)
  }

  const generate = async (category: string) => {
    const generated = await vocabApi.generate(category)
    const { dueWords, savedWords } = await fetchWords()
    setWords(savedWords)
    setDueToday(dueWords)
    return generated
  }

  const updateWord = async (
    id: string,
    data: { term: string; meaning: string; example?: string; pronunciation?: string }
  ) => {
    await vocabApi.update(id, data)
    const { dueWords, savedWords } = await fetchWords()
    setWords(savedWords)
    setDueToday(dueWords)
  }

  const importList = async (category: string, text: string) => {
    const imported = await vocabApi.importList(category, text)
    const { dueWords, savedWords } = await fetchWords()
    setWords(savedWords)
    setDueToday(dueWords)
    return Array.isArray(imported) ? imported.length : 0
  }

  return {
    dueToday,
    error,
    loading,
    markReviewed,
    generate,
    importList,
    updateWord,
    words,
  }
}
