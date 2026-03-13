"use client"

import { ReviewSession } from "@/components/vocab/ReviewSession"
import { VocabCard } from "@/components/vocab/VocabCard"
import { useVocab } from "@/hooks/useVocab"

export default function VocabPage() {
  const { dueToday, error, loading, markReviewed, words } = useVocab()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Vocabulary
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Build your review deck
        </h1>
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading saved words…</p>
          ) : null}
          {words.map((item) => (
            <VocabCard key={item.id} item={item} />
          ))}
          {!loading && !words.length ? (
            <p className="text-sm text-muted-foreground">
              No saved words yet. Save words from chats or corrections.
            </p>
          ) : null}
        </div>
        <ReviewSession dueToday={dueToday} loading={loading} onReview={markReviewed} />
      </div>
    </div>
  )
}
