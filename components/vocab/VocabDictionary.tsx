"use client"

import { useMemo, useState } from "react"
import { ArrowDownUp, LayoutGrid, Layers3, List, Search, SearchX, X } from "lucide-react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { VocabDeck } from "@/components/vocab/VocabDeck"
import { VocabStats } from "@/components/vocab/VocabStats"
import {
  filterVocab,
  matchesMastery,
  sortVocab,
  type MasteryFilter,
  type SortOrder,
} from "@/lib/vocab-review"
import type { VocabItem } from "@/lib/types"

export type VocabViewMode = "list" | "grid"

type VocabDictionaryProps = {
  words: VocabItem[]
  loading: boolean
  dueCount?: number
  onUpdate: (
    id: string,
    data: { term: string; meaning: string; example?: string; pronunciation?: string }
  ) => void | Promise<void>
  onDelete?: (id: string) => void | Promise<void>
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
        <div key={i} className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm dark:bg-slate-900/40">
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

const MASTERY_FILTERS: { value: MasteryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "weak", label: "Weak" },
  { value: "learning", label: "Learning" },
  { value: "mastered", label: "Mastered" },
]

const SORT_ORDERS: { value: SortOrder; label: string }[] = [
  { value: "alpha", label: "A → Z" },
  { value: "mastery-asc", label: "Weakest first" },
  { value: "mastery-desc", label: "Strongest first" },
  { value: "due", label: "Due soonest" },
]

export function VocabDictionary({ words, loading, dueCount = 0, onUpdate, onDelete }: VocabDictionaryProps) {
  const [query, setQuery] = useState("")
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>("all")
  const [sortOrder, setSortOrder] = useState<SortOrder>("alpha")
  const [viewMode, setViewMode] = useState<VocabViewMode>("list")
  const isFiltering = query.trim().length > 0 || masteryFilter !== "all"

  const filtered = useMemo(
    () => sortVocab(filterVocab(words, query, masteryFilter), sortOrder),
    [words, query, masteryFilter, sortOrder]
  )
  const decks = useMemo(() => groupByCategory(filtered), [filtered])

  // Per-bucket counts so the filter chips can advertise how many words match.
  const filterCount = (value: MasteryFilter) =>
    value === "all" ? words.length : words.filter((w) => matchesMastery(w.mastery, value)).length

  return (
    <div className="space-y-6">
      <div className="px-4">
        <h4 className="text-sm font-bold uppercase tracking-wide text-muted-foreground/60">Your Dictionary</h4>
        <p className="mt-1 text-xs font-bold text-muted-foreground/30">
          {isFiltering ? `${filtered.length} of ${words.length} items` : `${words.length} items collected`}
        </p>
      </div>

      <VocabStats words={words} dueCount={dueCount} />

      {words.length > 0 && (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} strokeWidth={2.5} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search words, meanings, tags..."
              className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-10 text-base font-bold text-foreground placeholder:text-sm placeholder:text-muted-foreground/40 transition-colors focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:bg-slate-900/40 sm:text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground/40 transition-colors hover:bg-accent/50 hover:text-foreground"
              >
                <X size={14} strokeWidth={3} />
              </button>
            )}
          </div>

          {/* Mastery filter chips + sort */}
          <div className="flex flex-wrap items-center gap-1.5">
            {MASTERY_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setMasteryFilter(value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide transition-all active:scale-95",
                  masteryFilter === value
                    ? "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "border-border bg-card text-muted-foreground/60 hover:text-foreground dark:bg-slate-900/40"
                )}
              >
                {label}
                <span className={cn(
                  "tabular-nums",
                  masteryFilter === value ? "text-blue-600/70 dark:text-blue-400/70" : "text-muted-foreground/30"
                )}>
                  {filterCount(value)}
                </span>
              </button>
            ))}

            <label className="relative ml-auto flex items-center gap-1.5 rounded-full border border-border bg-card pl-3 pr-2 text-xs font-bold uppercase tracking-wide text-muted-foreground/60 transition-colors hover:text-foreground dark:bg-slate-900/40">
              <ArrowDownUp size={12} strokeWidth={3} className="shrink-0" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                aria-label="Sort words"
                className="cursor-pointer appearance-none bg-transparent py-1.5 pr-1 text-xs font-bold uppercase tracking-wide text-foreground focus:outline-none"
              >
                {SORT_ORDERS.map(({ value, label }) => (
                  <option key={value} value={value} className="font-bold normal-case tracking-normal text-foreground">
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5 dark:bg-slate-900/40">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                aria-pressed={viewMode === "list"}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                  viewMode === "list"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground/40 hover:text-foreground"
                )}
              >
                <List size={14} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                  viewMode === "grid"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground/40 hover:text-foreground"
                )}
              >
                <LayoutGrid size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && !words.length ? <DeckSkeleton /> : null}

      <div className="space-y-3">
        {decks.map(([category, items], index) => (
          <motion.div key={category} variants={itemVariants}>
            <VocabDeck
              name={category}
              items={items}
              defaultOpen={index === 0}
              forceOpen={isFiltering}
              viewMode={viewMode}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          </motion.div>
        ))}
      </div>

      {!loading && words.length > 0 && !filtered.length ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-accent/5 p-10 text-center">
          <SearchX size={32} strokeWidth={1.5} className="mb-4 text-muted-foreground/30" />
          <p className="text-sm font-bold text-muted-foreground/60">
            No words match your search.
          </p>
        </div>
      ) : null}

      {!loading && !words.length ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-accent/5 p-10 text-center sm:rounded-3xl sm:p-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted/10 text-muted-foreground/20 mb-6">
            <Layers3 size={40} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-bold text-foreground">Start Your Collection</h3>
          <p className="mx-auto mt-3 max-w-xs text-[15px] font-medium leading-relaxed text-muted-foreground/60">
            Save words from chat sessions or use the AI Deck Builder to start mastering Korean vocabulary.
          </p>
        </div>
      ) : null}
    </div>
  )
}
