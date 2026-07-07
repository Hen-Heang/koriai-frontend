"use client"

import { useState } from "react"
import { Plus, Search, X } from "lucide-react"
import { motion } from "motion/react"
import { toast } from "sonner"

import { PageHero } from "@/components/app/page-hero"
import { AddWordsDialog } from "@/components/vocab/AddWordsDialog"
import { ReviewSession } from "@/components/vocab/ReviewSession"
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
  const { dueToday, dueCount, error, loading, rateWord, words, addWord, generate, importList, updateWord, deleteWord } = useVocab()
  const { logActivity } = useLogActivity("vocab")
  useSessionTimer("vocab")
  const [query, setQuery] = useState("")
  const [addOpen, setAddOpen] = useState(false)

  const topics = Array.from(new Set(words.map((w) => w.category).filter(Boolean))).sort()

  async function handleGenerate(category: string) {
    await generate(category)
    void logActivity()
    // The dialog's job is done — close it so the fresh deck is visible below.
    setAddOpen(false)
    toast.success("Deck ready", { description: `New “${category}” cards were added to your dictionary.` })
  }

  async function handleImport(deckName: string, text: string) {
    const count = await importList(deckName, text)
    if (count > 0) {
      void logActivity()
    }
    return count
  }

  const heroStats = [
    { label: "Due Today", value: loading ? "..." : `${dueCount}` },
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
          actions={
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition-all hover:bg-blue-500 active:scale-95 lg:w-auto"
            >
              <Plus size={18} strokeWidth={2.5} />
              Add words
            </button>
          }
        />
      </motion.div>

      {/* The one search bar — top of the page, filters the dictionary below. */}
      {words.length > 0 && (
        <motion.div variants={itemVariants} className="relative">
          <Search size={18} strokeWidth={2.5} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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

      {/* Memory Lab launch banner — the session itself opens fullscreen. */}
      <motion.div variants={itemVariants}>
        <ReviewSession
          dueToday={dueToday}
          dueCount={dueCount}
          allWords={words}
          loading={loading}
          onRate={rateWord}
        />
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-bold text-destructive">
          {error}
        </motion.div>
      )}

      <VocabDictionary
        words={words}
        loading={loading}
        dueCount={dueCount}
        query={query}
        onUpdate={updateWord}
        onDelete={deleteWord}
        onAdd={addWord}
        onStartAdd={() => setAddOpen(true)}
      />

      <AddWordsDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        topics={topics}
        dueCount={dueCount}
        totalCount={words.length}
        existingTerms={words.map((word) => word.term)}
        onAdd={addWord}
        onGenerate={handleGenerate}
        onImport={handleImport}
      />
    </motion.div>
  )
}
