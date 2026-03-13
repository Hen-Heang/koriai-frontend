"use client"

import { useMemo, useState } from "react"

import type { VocabItem } from "@/lib/types"

const initialWords: VocabItem[] = [
  {
    id: "word-1",
    term: "적응하다",
    meaning: "to adapt",
    example: "한국 생활에 빨리 적응하고 싶어요.",
    mastery: 74,
    nextReview: "Tomorrow",
    tags: ["daily-life", "verb"],
  },
  {
    id: "word-2",
    term: "면접",
    meaning: "interview",
    example: "내일 한국 회사 면접이 있어요.",
    mastery: 51,
    nextReview: "Today",
    tags: ["career", "noun"],
  },
  {
    id: "word-3",
    term: "예약하다",
    meaning: "to reserve",
    example: "식당을 미리 예약했어요.",
    mastery: 88,
    nextReview: "In 3 days",
    tags: ["travel", "verb"],
  },
]

export function useVocab() {
  const [words, setWords] = useState(initialWords)

  const dueToday = useMemo(
    () => words.filter((word) => word.nextReview === "Today"),
    [words]
  )

  const markReviewed = (id: string) => {
    setWords((current) =>
      current.map((word) =>
        word.id === id
          ? {
              ...word,
              mastery: Math.min(word.mastery + 8, 100),
              nextReview: "In 4 days",
            }
          : word
      )
    )
  }

  return {
    dueToday,
    markReviewed,
    words,
  }
}
