"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ChevronDown, FolderOpen } from "lucide-react"

import { cn } from "@/lib/utils"
import type { VocabItem } from "@/lib/types"
import { VocabCard } from "@/components/vocab/VocabCard"
import { SpeakButton } from "@/components/ui/SpeakButton"
import type { VocabViewMode } from "@/components/vocab/VocabDictionary"

type VocabDeckProps = {
  name: string
  items: VocabItem[]
  defaultOpen?: boolean
  /** Keeps the deck expanded regardless of its toggle state (e.g. while searching). */
  forceOpen?: boolean
  viewMode?: VocabViewMode
  onUpdate?: (
    id: string,
    data: { term: string; meaning: string; example?: string; pronunciation?: string }
  ) => void | Promise<void>
  onDelete?: (id: string) => void | Promise<void>
}

function masteryColor(mastery: number) {
  if (mastery >= 80) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
  if (mastery >= 50) return "bg-amber-500/10 text-amber-600 dark:text-amber-400"
  return "bg-red-500/10 text-red-500 dark:text-red-400"
}

export function VocabDeck({ name, items, defaultOpen = false, forceOpen = false, viewMode = "list", onUpdate, onDelete }: VocabDeckProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const isOpen = open || forceOpen

  const avgMastery = items.length
    ? Math.round(items.reduce((sum, w) => sum + w.mastery, 0) / items.length)
    : 0

  return (
    <div className="overflow-hidden rounded-[1.8rem] border border-border bg-card shadow-sm dark:bg-slate-900/40">
      {/* Deck header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-accent/5 sm:px-6"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
          <FolderOpen size={18} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-foreground">{name}</p>
          <p className="text-xs font-bold text-muted-foreground/50">
            {items.length} {items.length === 1 ? "word" : "words"} · {avgMastery}% mastered
          </p>
        </div>
        <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-accent/20 sm:w-24">
          <div
            className="h-full rounded-full bg-teal-500"
            style={{ width: `${avgMastery}%` }}
          />
        </div>
        <ChevronDown
          size={18}
          strokeWidth={2.5}
          className={cn(
            "shrink-0 text-muted-foreground/40 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Word rows */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-3 border-t border-border/60 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3"
                  : "divide-y divide-border/40 border-t border-border/60"
              )}
            >
              {items.map((item) => {
                const isExpanded = expandedId === item.id
                if (isExpanded) {
                  return (
                    <div
                      key={item.id}
                      className={cn("bg-accent/[0.03] p-3 sm:p-4", viewMode === "grid" && "col-span-full rounded-2xl")}
                    >
                      <VocabCard item={item} onUpdate={onUpdate} onDelete={onDelete} />
                      <button
                        type="button"
                        onClick={() => setExpandedId(null)}
                        className="mt-2 w-full rounded-xl py-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground/50 transition-colors hover:bg-accent/30 hover:text-foreground"
                      >
                        Collapse
                      </button>
                    </div>
                  )
                }

                if (viewMode === "grid") {
                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpandedId(item.id)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpandedId(item.id) }}
                      className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-border/60 bg-background/40 p-4 text-left transition-colors hover:bg-accent/5 dark:bg-white/[0.02]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="truncate text-lg font-bold text-foreground">{item.term}</span>
                        <span onClick={(e) => e.stopPropagation()}>
                          <SpeakButton text={item.term} className="h-8 w-8 shrink-0 rounded-lg bg-accent/30" />
                        </span>
                      </div>
                      {item.pronunciation && (
                        <span className="truncate text-xs font-medium italic text-muted-foreground/40">
                          {item.pronunciation}
                        </span>
                      )}
                      <p className="truncate text-sm font-medium text-muted-foreground/70">{item.meaning}</p>
                      <span className={cn("mt-1 w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums", masteryColor(item.mastery))}>
                        {item.mastery}%
                      </span>
                    </div>
                  )
                }

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedId(item.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpandedId(item.id) }}
                    className="flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-accent/5 sm:px-6"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="truncate text-xl font-bold text-foreground sm:text-2xl">{item.term}</span>
                        {item.pronunciation && (
                          <span className="hidden truncate text-[13px] font-medium italic text-muted-foreground/40 sm:inline">
                            {item.pronunciation}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[15px] font-medium text-muted-foreground/70 sm:text-base">{item.meaning}</p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums", masteryColor(item.mastery))}>
                      {item.mastery}%
                    </span>
                    <span onClick={(e) => e.stopPropagation()}>
                      <SpeakButton
                        text={item.term}
                        className="h-10 w-10 shrink-0 rounded-lg bg-accent/30"
                      />
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
