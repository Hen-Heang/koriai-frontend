"use client"

import { useState } from "react"
import {
  BookOpen,
  Volume2,
  Languages,
  Sparkles,
} from "lucide-react"
import { motion } from "motion/react"

import { PageHero } from "@/components/app/page-hero"
import { ReviewSession } from "@/components/vocab/ReviewSession"
import { useVocab } from "@/hooks/useVocab"
import { cn } from "@/lib/utils"

type FlashcardMode = "korean-english" | "english-korean" | "audio-meaning"

const MODES: {
  id: FlashcardMode
  label: string
  description: string
  icon: React.ElementType
  color: string
  iconBg: string
  available: boolean
}[] = [
  {
    id: "korean-english",
    label: "Korean → English",
    description: "See Korean, recall the English meaning.",
    icon: BookOpen,
    color: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10",
    available: true,
  },
  {
    id: "english-korean",
    label: "English → Korean",
    description: "See the English word, write the Korean.",
    icon: Languages,
    color: "text-sky-600 dark:text-sky-400",
    iconBg: "bg-sky-500/10",
    available: false,
  },
  {
    id: "audio-meaning",
    label: "Audio → Meaning",
    description: "Listen to pronunciation and recall the meaning.",
    icon: Volume2,
    color: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/10",
    available: false,
  },
]

export default function FlashcardsPage() {
  const { dueToday, words, loading, rateWord } = useVocab()
  const [selectedMode, setSelectedMode] = useState<FlashcardMode>("korean-english")

  const heroStats = loading
    ? [
        { label: "Due Today", value: "..." },
        { label: "Total Deck", value: "..." },
        { label: "SRS Mode", value: "Active" },
      ]
    : [
        { label: "Due Today", value: `${dueToday.length}` },
        { label: "Total Deck", value: `${words.length}` },
        { label: "SRS Mode", value: "Active" },
      ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-8 pb-16"
    >
      <PageHero
        eyebrow="Flashcards"
        title="Spaced Repetition"
        description="Master Korean vocabulary with scientifically proven spaced repetition. Choose your study mode and build lasting memory."
        stats={heroStats}
      />

      <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          {/* Mode Selector */}
          <div className="rounded-[2.5rem] border border-border bg-card p-6 shadow-xl dark:bg-slate-900/40 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">
                Study Mode
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {MODES.map((mode) => {
                const Icon = mode.icon
                const active = selectedMode === mode.id
                return (
                  <button
                    key={mode.id}
                    type="button"
                    disabled={!mode.available}
                    onClick={() => mode.available && setSelectedMode(mode.id)}
                    className={cn(
                      "group relative flex items-start gap-4 rounded-2xl border p-5 text-left transition-all active:scale-[0.98]",
                      !mode.available && "opacity-50 cursor-not-allowed",
                      active
                        ? "border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20"
                        : mode.available
                        ? "border-border bg-accent/5 hover:border-emerald-500/20 hover:bg-background"
                        : "border-border bg-accent/5"
                    )}
                  >
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", mode.iconBg, mode.color)}>
                      <Icon size={20} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "text-sm font-black tracking-tight",
                          active ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {mode.label}
                        </p>
                        {!mode.available && (
                          <span className="rounded-full bg-border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-muted-foreground/50">
                            Soon
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[12px] font-medium text-muted-foreground/60 leading-relaxed">
                        {mode.description}
                      </p>
                    </div>
                    {active && (
                      <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* SRS Info */}
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <Sparkles size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                Spaced Repetition System (SRS)
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground/70 leading-relaxed">
                Cards you find easy are shown less often. Hard cards come back sooner. This is how you build lasting memory — not cramming.
              </p>
            </div>
          </div>
        </div>

        {/* Review Session Sidebar */}
        <div className="min-w-0 xl:sticky xl:top-8 xl:self-start">
          <ReviewSession
            dueToday={dueToday}
            allWords={words}
            loading={loading}
            onRate={rateWord}
          />
        </div>
      </div>
    </motion.div>
  )
}
