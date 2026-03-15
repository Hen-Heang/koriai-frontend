"use client"

import { CheckCircle2, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DiaryFeedback } from "@/lib/types"
import { SmartPeek } from "@/components/ui/SmartPeek"

function SmartText({ text }: { text: string }) {
  const words = text.split(/(\s+)/)
  return (
    <>
      {words.map((word, i) => {
        if (!word.trim()) return <span key={i}>{word}</span>
        const cleanWord = word.replace(/[.,!??"']/g, "")
        return (
          <SmartPeek key={i} word={cleanWord}>
            {word}
          </SmartPeek>
        )
      })}
    </>
  )
}

export function FeedbackPanel({ items }: { items: DiaryFeedback[] }) {
  const hasItems = items.length > 0

  return (
    <Card className="rounded-3xl border-border bg-card shadow-xl dark:bg-slate-900/60 dark:backdrop-blur-sm">
      <CardHeader className="border-b border-border/80 pb-5">
        <CardTitle className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">AI Feedback</CardTitle>
        <p className="text-sm font-medium leading-relaxed text-muted-foreground">
          Review the rewritten version first, then scan the notes for what changed and why.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {hasItems ? (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-border bg-accent/10 p-4 transition-all hover:bg-accent/20 dark:bg-white/5"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={20}
                  strokeWidth={1.5}
                  className="text-emerald-600 dark:text-emerald-400"
                />
                <p className="font-black text-foreground">{item.title}</p>
              </div>
              <div className="mt-3 text-sm font-medium leading-relaxed text-muted-foreground">
                <SmartText text={item.description} />
              </div>
              {item.example ? (
                <div className="mt-3 rounded-xl bg-background px-4 py-3 text-sm font-bold leading-relaxed text-foreground shadow-sm ring-1 ring-border">
                  <SmartText text={item.example} />
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-accent/5 p-6 dark:bg-white/3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:bg-violet-400/12 dark:text-violet-300">
                <Sparkles size={18} strokeWidth={1.8} />
              </div>
              <div>
                <p className="font-black text-foreground">Your feedback will appear here</p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-muted-foreground">
                  Submit a diary entry to get a corrected rewrite, coaching notes, and
                  mood or tone observations.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
