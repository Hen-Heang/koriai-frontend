"use client"

import { motion } from "motion/react"

import { PageHero } from "@/components/app/page-hero"
import { DeckBuilder } from "@/components/vocab/DeckBuilder"
import { ReviewSession } from "@/components/vocab/ReviewSession"
import { TextbookImport } from "@/components/vocab/TextbookImport"
import { VocabDictionary } from "@/components/vocab/VocabDictionary"
import { useStreak } from "@/hooks/useStreak"
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
  const { dueToday, error, loading, rateWord, words, generate, importList, updateWord, deleteWord } = useVocab()
  const { refreshStreak } = useStreak()

  async function handleGenerate(category: string) {
    await generate(category)
    refreshStreak()
  }

  async function handleImport(deckName: string, text: string) {
    const count = await importList(deckName, text)
    if (count > 0) {
      refreshStreak()
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

      {error && (
        <motion.div variants={itemVariants} className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-bold text-destructive">
          {error}
        </motion.div>
      )}

      <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
        <div className="order-2 min-w-0 space-y-8 xl:order-1">
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

          <VocabDictionary words={words} loading={loading} onUpdate={updateWord} onDelete={deleteWord} />
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
