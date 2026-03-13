"use client"

import { useState } from "react"

import { DiaryEditor } from "@/components/diary/DiaryEditor"
import { FeedbackPanel } from "@/components/diary/FeedbackPanel"
import type { DiaryFeedback } from "@/lib/types"

const initialFeedback: DiaryFeedback[] = [
  {
    id: "feedback-1",
    title: "Grammar polish",
    description:
      "Use past tense consistently when summarizing what happened earlier today.",
    example:
      "One polished version: Today I had a meeting at work and talked about a new project.",
  },
  {
    id: "feedback-2",
    title: "Vocabulary upgrade",
    description:
      "Swap basic adjectives for more precise ones to sound more natural.",
    example:
      "Try replacing simple adjectives with more specific ones, like 'interesting' to 'memorable' or 'rewarding'.",
  },
]

export default function DiaryPage() {
  const [feedback, setFeedback] = useState(initialFeedback)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Diary
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight dark:text-white">
          Daily writing with AI feedback
        </h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DiaryEditor
          onAnalyze={(content) => {
            setFeedback((current) => [
              {
                id: crypto.randomUUID(),
                title: "Fresh diary insight",
                description: `Your latest draft has ${content.length} characters. Add linking phrases like "so", "however", and "especially" to improve flow.`,
              },
              ...current,
            ])
          }}
        />
        <FeedbackPanel items={feedback} />
      </div>
    </div>
  )
}
