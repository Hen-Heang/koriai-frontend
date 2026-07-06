"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"
import { motion } from "motion/react"

import { PageHero } from "@/components/app/page-hero"
import { AddWordCard } from "@/components/vocab/AddWordCard"
import { DeckBuilder } from "@/components/vocab/DeckBuilder"
import { ReviewSession } from "@/components/vocab/ReviewSession"
import { TextbookImport } from "@/components/vocab/TextbookImport"
import { VocabDictionary } from "@/components/vocab/VocabDictionary"
import { useLogActivity } from "@/hooks/useLogActivity"
import { useSessionTimer } from "@/hooks/useSessionTimer"
import { useVocab } from "@/hooks/useVocab"

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
  const { dueToday, error, loading, rateWord, words, addWord, generate, importList, updateWord, deleteWord } = useVocab()
  const { logActivity } = useLogActivity("vocab")
  useSessionTimer("vocab")
  const [query, setQuery] = useState("")

  // Scroll to the filtered results once, when the search box is first
  // focused — not on every keystroke, which would fight the user's scroll.
  function scrollToDictionary() {
    document.getElementById("vocab-dictionary")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const topics = Array.from(new Set(words.map((w) => w.category).filter(Boolean))).sort()

  async function handleGenerate(category: string) {
    await generate(category)
    void logActivity()
  }

  async function handleImport(deckName: string, text: string) {
    const count = await importList(deckName, text)
    if (count > 0) {
      void logActivity()
    }
    return count
  }

  const heroStats = [
    { label: "Due Today", value: loading ? "..." : `${dueToday.length}` },
    { label: "Total Deck", value: loading ? "..." : `${words.length}` },
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

      {/* Quick search — surfaced right under the hero so it's usable without
          scrolling past Add Word / Deck Builder / Textbook Import first. */}
      {words.length > 0 && (
        <motion.div variants={itemVariants} className="relative">
          <Search size={18} strokeWidth={2.5} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={scrollToDictionary}
            placeholder={`Search ${words.length} saved words...`}
            className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-11 text-base font-bold text-foreground shadow-sm placeholder:text-muted-foreground/40 transition-colors focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:bg-slate-900/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground/40 transition-colors hover:bg-accent/50 hover:text-foreground"
            >
              <X size={16} strokeWidth={3} />
            </button>
          )}
        </motion.div>
      )}

      {error && (
        <motion.div variants={itemVariants} className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-bold text-destructive">
          {error}
        </motion.div>
      )}

      <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
        <div className="order-2 min-w-0 space-y-8 xl:order-1">
          <motion.div variants={itemVariants}>
            <AddWordCard categories={topics} onAdd={addWord} />
          </motion.div>

          <motion.div variants={itemVariants}>
            <DeckBuilder
              dueCount={dueToday.length}
              totalCount={words.length}
              onGenerate={handleGenerate}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <TextbookImport
              existingTerms={words.map((word) => word.term)}
              onImport={handleImport}
            />
          </motion.div>

          <VocabDictionary
            words={words}
            loading={loading}
            dueCount={dueToday.length}
            query={query}
            onQueryChange={setQuery}
            onUpdate={updateWord}
            onDelete={deleteWord}
          />
        </div>

        <motion.div variants={itemVariants} className="order-1 min-w-0 xl:order-2 xl:sticky xl:top-8 xl:self-start">
          <ReviewSession
            dueToday={dueToday}
            allWords={words}
            loading={loading}
            onRate={rateWord}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}
