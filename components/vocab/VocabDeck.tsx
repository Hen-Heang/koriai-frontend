"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ChevronDown, FolderOpen } from "lucide-react"

import { cn } from "@/lib/utils"
import type { VocabItem } from "@/lib/types"
import { VocabCard } from "@/components/vocab/VocabCard"
import { SpeakButton } from "@/components/ui/SpeakButton"

type VocabDeckProps = {
  name: string
  items: VocabItem[]
  defaultOpen?: boolean
  /** Keeps the deck expanded regardless of its toggle state (e.g. while searching). */
  forceOpen?: boolean
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

export function VocabDeck({ name, items, defaultOpen = false, forceOpen = false, onUpdate, onDelete }: VocabDeckProps) {
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
          <p className="truncate text-[15px] font-black text-foreground">{name}</p>
          <p className="text-[11px] font-bold text-muted-foreground/50">
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
            <div className="divide-y divide-border/40 border-t border-border/60">
              {items.map((item) => {
                const isExpanded = expandedId === item.id
                return (
                  <div key={item.id}>
                    {isExpanded ? (
                      <div className="bg-accent/[0.03] p-3 sm:p-4">
                        <VocabCard item={item} onUpdate={onUpdate} onDelete={onDelete} />
                        <button
                          type="button"
                          onClick={() => setExpandedId(null)}
                          className="mt-2 w-full rounded-xl py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 transition-colors hover:bg-accent/30 hover:text-foreground"
                        >
                          Collapse
                        </button>
                      </div>
                    ) : (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setExpandedId(item.id)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpandedId(item.id) }}
                        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/5 sm:px-6"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="truncate text-[15px] font-black text-foreground">{item.term}</span>
                            {item.pronunciation && (
                              <span className="hidden truncate text-[11px] font-medium italic text-muted-foreground/40 sm:inline">
                                {item.pronunciation}
                              </span>
                            )}
                          </div>
                          <p className="truncate text-[13px] font-medium text-muted-foreground/70">{item.meaning}</p>
                        </div>
                        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black tabular-nums", masteryColor(item.mastery))}>
                          {item.mastery}%
                        </span>
                        <span onClick={(e) => e.stopPropagation()}>
                          <SpeakButton
                            text={item.term}
                            className="h-8 w-8 shrink-0 rounded-lg bg-accent/30"
                          />
                        </span>
                      </div>
                    )}
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
