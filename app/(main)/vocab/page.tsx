"use client"

import { useState } from "react"
import { BookOpenCheck, Layers3, Sparkles, Activity } from "lucide-react"
import { motion } from "motion/react"

import { PageHero } from "@/components/app/page-hero"
import { ReviewSession } from "@/components/vocab/ReviewSession"
import { VocabCard } from "@/components/vocab/VocabCard"
import { useVocab } from "@/hooks/useVocab"
import { useStreak } from "@/hooks/useStreak"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  { id: "Daily Life", label: "Daily Life", emoji: "🌅" },
  { id: "Workplace", label: "Workplace", emoji: "💼" },
  { id: "Developer", label: "Developer", emoji: "💻" },
  { id: "Meeting & Standup", label: "Meeting", emoji: "🗣️" },
  { id: "Greetings", label: "Greetings", emoji: "👋" },
  { id: "Food & Drinks", label: "Food", emoji: "🍱" },
  { id: "Travel & Transport", label: "Travel", emoji: "✈️" },
  { id: "Shopping", label: "Shopping", emoji: "🛍️" },
  { id: "Health & Body", label: "Health", emoji: "🏥" },
  { id: "Numbers & Time", label: "Time", emoji: "🕙" },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
} as const

export default function VocabPage() {
  const { dueToday, error, loading, markReviewed, words, generate } = useVocab()
  const { refreshStreak } = useStreak()
  const [generating, setGenerating] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("")

  async function handleGenerate() {
    if (!selectedCategory) return
    setGenerating(true)
    await generate(selectedCategory)
    refreshStreak()
    setGenerating(false)
  }

  const heroStats = loading
    ? [
        { label: "Due Today", value: "..." },
        { label: "Total Deck", value: "..." },
        { label: "Method", value: "Spaced Repetition" },
      ]
    : [
        { label: "Due Today", value: `${dueToday.length}` },
        { label: "Total Deck", value: `${words.length}` },
        { label: "Method", value: "Spaced Repetition" },
      ]

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-16"
    >
      <motion.div variants={itemVariants}>
        <PageHero
          eyebrow="Vocabulary"
          title="Memory Studio"
          description="Build your personal Korean lexicon. Generate themed flashcards and master them using scientifically proven spaced repetition."
          stats={heroStats}
        />
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-bold text-destructive">
          {error}
        </motion.div>
      )}

      <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
        <div className="order-2 space-y-8 xl:order-1">
          {/* Card Generator Section */}
          <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-border bg-card p-6 shadow-xl dark:bg-slate-900/40 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-600 dark:text-teal-400">Card Generator</p>
                </div>
                <h3 className="mt-4 text-2xl font-black text-foreground">AI Deck Builder</h3>
                <p className="mt-2 text-[15px] font-medium leading-relaxed text-muted-foreground">
                  Select a category to expand your vocabulary with relevant high-frequency terms.
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600">
                <BookOpenCheck size={24} strokeWidth={2.5} />
              </div>
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all active:scale-95",
                    selectedCategory === cat.id
                      ? "border-teal-500 bg-teal-500/10 ring-1 ring-teal-500/20"
                      : "border-border bg-background text-muted-foreground hover:border-teal-500/40 hover:bg-teal-500/[0.02]"
                  )}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className={cn(
                    "text-[11px] font-black uppercase tracking-tight",
                    selectedCategory === cat.id ? "text-teal-600 dark:text-teal-400" : "text-muted-foreground/60"
                  )}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-border/60 pt-8">
              <Button
                className="h-14 rounded-2xl bg-teal-600 px-8 text-base font-black text-white shadow-xl shadow-teal-600/20 transition-all hover:bg-teal-500 active:scale-95"
                onClick={handleGenerate}
                disabled={!selectedCategory || generating}
              >
                {generating ? (
                  <>
                    <Activity size={20} className="mr-2 animate-pulse" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} strokeWidth={2.5} className="mr-2" /> 
                    Build {selectedCategory || "New Deck"}
                  </>
                )}
              </Button>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                <div className="flex flex-col items-end">
                  <span>{dueToday.length} REVIEWS DUE</span>
                  <span className="mt-0.5">{words.length} TOTAL CARDS</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Vocabulary List Section */}
          <div className="space-y-6">
            <div className="px-4">
              <h4 className="text-sm font-black uppercase tracking-[0.25em] text-muted-foreground/60">Your Dictionary</h4>
              <p className="mt-1 text-xs font-bold text-muted-foreground/30">{words.length} items collected</p>
            </div>

            {loading && !words.length ? (
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
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {words.map((item) => (
                <motion.div key={item.id} variants={itemVariants}>
                  <VocabCard item={item} />
                </motion.div>
              ))}
            </div>

            {!loading && !words.length ? (
              <div className="flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-border bg-accent/5 p-16 text-center">
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
        </div>

        {/* Sidebar Quiz Section */}
        <motion.div variants={itemVariants} className="order-1 xl:order-2 xl:sticky xl:top-8 xl:self-start">
          <ReviewSession
            dueToday={dueToday}
            allWords={words}
            loading={loading}
            onReview={markReviewed}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}
