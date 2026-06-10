"use client"

import { useMemo } from "react"
import { Layers3 } from "lucide-react"
import { motion } from "motion/react"

import { Skeleton } from "@/components/ui/skeleton"
import { VocabDeck } from "@/components/vocab/VocabDeck"
import type { VocabItem } from "@/lib/types"

type VocabDictionaryProps = {
  words: VocabItem[]
  loading: boolean
  onUpdate: (
    id: string,
    data: { term: string; meaning: string; example?: string; pronunciation?: string }
  ) => void | Promise<void>
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
} as const

function groupByCategory(words: VocabItem[]) {
  const groups = words.reduce<Record<string, VocabItem[]>>((acc, word) => {
    ;(acc[word.category] ??= []).push(word)
    return acc
  }, {})
  return Object.entries(groups).sort((a, b) => b[1].length - a[1].length)
}

function DeckSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
      {[1, 2, 3].map((i) => (
        <div key={i} className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-5 shadow-sm dark:bg-slate-900/40">
          {/* top mastery bar */}
          <Skeleton className="absolute inset-x-0 top-0 h-1 rounded-none" />
          <div className="flex items-start justify-between gap-4 pt-2">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
              <Skeleton className="h-5 w-48" />
            </div>
            <Skeleton className="h-7 w-12 rounded-2xl" />
          </div>
          <Skeleton className="mt-6 h-20 w-full rounded-2xl" />
          <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function VocabDictionary({ words, loading, onUpdate }: VocabDictionaryProps) {
  const decks = useMemo(() => groupByCategory(words), [words])

  return (
    <div className="space-y-6">
      <div className="px-4">
        <h4 className="text-sm font-black uppercase tracking-[0.25em] text-muted-foreground/60">Your Dictionary</h4>
        <p className="mt-1 text-xs font-bold text-muted-foreground/30">{words.length} items collected</p>
      </div>

      {loading && !words.length ? <DeckSkeleton /> : null}

      <div className="space-y-3">
        {decks.map(([category, items], index) => (
          <motion.div key={category} variants={itemVariants}>
            <VocabDeck
              name={category}
              items={items}
              defaultOpen={index === 0}
              onUpdate={onUpdate}
            />
          </motion.div>
        ))}
      </div>

      {!loading && !words.length ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-border bg-accent/5 p-10 text-center sm:rounded-[3rem] sm:p-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-[2.5rem] bg-muted/10 text-muted-foreground/20 mb-6">
            <Layers3 size={40} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-black text-foreground">Start Your Collection</h3>
          <p className="mx-auto mt-3 max-w-xs text-[15px] font-medium leading-relaxed text-muted-foreground/60">
            Save words from chat sessions or use the AI Deck Builder to start mastering Korean vocabulary.
          </p>
        </div>
      ) : null}
    </div>
  )
}
