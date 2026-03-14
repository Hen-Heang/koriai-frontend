"use client"

import { useState } from "react"
import { BookOpenCheck, Layers3, Loader2, Sparkles } from "lucide-react"
import { ReviewSession } from "@/components/vocab/ReviewSession"
import { VocabCard } from "@/components/vocab/VocabCard"
import { useVocab } from "@/hooks/useVocab"
import { Button } from "@/components/ui/button"

const CATEGORIES = [
  "Greetings", "Food & Drinks", "Travel & Transport", "Shopping",
  "Health & Body", "Work & Business", "Family & Relationships",
  "Weather & Nature", "Numbers & Time", "K-Drama Phrases",
]

export default function VocabPage() {
  const { dueToday, error, loading, markReviewed, words, generate } = useVocab()
  const [generating, setGenerating] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("")

  async function handleGenerate() {
    if (!selectedCategory) return
    setGenerating(true)
    await generate(selectedCategory)
    setGenerating(false)
  }

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Vocabulary
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Build your review deck
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          Generate themed flashcards, keep useful words from practice sessions, and
          review them in a cleaner study flow.
        </p>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="rounded-[1.75rem] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,247,250,0.96))] p-5 shadow-sm dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(8,15,28,0.98))]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Layers3 size={16} className="text-teal-500" />
                  <p className="text-sm font-semibold">AI Card Generator</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Pick a topic and generate a focused deck you can review immediately.
                </p>
              </div>
              <div className="hidden rounded-2xl bg-teal-500/10 p-3 text-teal-600 dark:block dark:text-teal-300">
                <BookOpenCheck size={18} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    selectedCategory === cat
                      ? "border-teal-500 bg-teal-500 text-white"
                      : "border-border/60 text-muted-foreground hover:border-teal-400 hover:bg-teal-50 dark:border-white/10 dark:text-slate-400 dark:hover:bg-teal-400/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                className="h-10 rounded-2xl bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-500"
                onClick={handleGenerate}
                disabled={!selectedCategory || generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" /> Generate {selectedCategory || "cards"}
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                {dueToday.length} due today • {words.length} total saved
              </p>
            </div>
          </div>

          <div className="space-y-3">
          {loading ? (
            <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-muted/30 px-4 py-5 text-sm text-muted-foreground">
              Loading saved words...
            </div>
          ) : null}
          {words.map((item) => (
            <VocabCard key={item.id} item={item} />
          ))}
          {!loading && !words.length ? (
            <div className="rounded-[1.75rem] border border-dashed border-border/70 bg-muted/30 px-5 py-6">
              <p className="text-sm font-medium text-foreground">No saved words yet</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Pick a category above and generate your first flashcards, or save words
                from chat and correction sessions.
              </p>
            </div>
          ) : null}
          </div>
        </div>

        <ReviewSession
          dueToday={dueToday}
          allWords={words}
          loading={loading}
          onReview={markReviewed}
        />
      </div>
    </div>
  )
}
