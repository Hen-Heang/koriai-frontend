"use client"

import { useEffect, useState } from "react"

import { vocabApi } from "@/lib/api"
import type { VocabItem } from "@/lib/types"

function normalizeWord(raw: unknown): VocabItem {
  const source = (raw ?? {}) as Record<string, unknown>
  const id = String(source.id ?? source.vocabId ?? crypto.randomUUID())
  const term = String(source.term ?? source.word ?? "")
  const meaning = String(source.meaning ?? source.definition ?? "")
  const example = source.example ? String(source.example) : undefined
  const exampleTranslation = source.exampleTranslation ? String(source.exampleTranslation) : undefined
  const mastery = Number(source.mastery ?? source.masteryRate ?? 0)
  const nextReview = String(source.nextReview ?? source.nextReviewDate ?? "-")
  const tags = Array.isArray(source.tags)
    ? source.tags.map((tag) => String(tag))
    : []

  return { id, term, meaning, example, exampleTranslation, mastery, nextReview, tags }
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

  return {
    dueToday,
    error,
    loading,
    markReviewed,
    generate,
    words,
  }
}
