"use client"

import { useState } from "react"

import { DiaryEditor } from "@/components/diary/DiaryEditor"
import { FeedbackPanel } from "@/components/diary/FeedbackPanel"
import { diaryApi } from "@/lib/api"
import type { DiaryFeedback } from "@/lib/types"

export default function DiaryPage() {
  const [feedback, setFeedback] = useState<DiaryFeedback[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleAnalyze(content: string) {
    if (!content.trim()) return
    setLoading(true)
    setError("")
    try {
      const today = new Date().toISOString().split("T")[0]
      const data = await diaryApi.createOrUpdate(today, content)

      const items: DiaryFeedback[] = [
        {
          id: "corrected",
          title: "Corrected version",
          description: data.correctedText,
        },
        {
          id: "feedback",
          title: "AI Feedback",
          description: data.feedback,
        },
      ]

      if (data.mood) {
        items.push({
          id: "mood",
          title: "Mood detected",
          description: data.mood,
        })
      }

      setFeedback(items)
    } catch {
      setError("Failed to analyze diary. Please try again.")
    } finally {
      setLoading(false)
    }
  }

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

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DiaryEditor onAnalyze={handleAnalyze} />
        {loading ? (
          <div className="flex items-center justify-center rounded-[2rem] border border-border/60 bg-white/90 p-8 text-sm text-muted-foreground shadow-lg">
            Analyzing your diary…
          </div>
        ) : (
          <FeedbackPanel items={feedback} />
        )}
      </div>
    </div>
  )
}