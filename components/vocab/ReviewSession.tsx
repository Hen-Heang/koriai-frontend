"use client"

import { BookOpenCheck } from "lucide-react"

import { VocabCard } from "@/components/vocab/VocabCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { VocabItem } from "@/lib/types"

type ReviewSessionProps = {
  dueToday: VocabItem[]
  loading?: boolean
  onReview: (id: string) => void | Promise<void>
}

export function ReviewSession({ dueToday, loading, onReview }: ReviewSessionProps) {

  return (
    <Card className="rounded-[2rem] border-border/60 bg-white/90 shadow-lg shadow-slate-950/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <BookOpenCheck size={20} strokeWidth={1.5} className="text-current" />
          Review Session
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading due cards…</p>
        ) : dueToday.length ? (
          dueToday.map((item) => (
            <VocabCard key={item.id} item={item} onReview={onReview} />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No cards due right now. Add more words after your next chat session.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
