"use client"

import { useState } from "react"
import { ArrowRight, BookmarkPlus, CheckCircle2, Info, Languages } from "lucide-react"
import { motion } from "motion/react"

import { PageHero } from "@/components/app/page-hero"
import { DiaryEditor } from "@/components/diary/DiaryEditor"
import { FeedbackPanel } from "@/components/diary/FeedbackPanel"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { diaryApi, vocabApi } from "@/lib/api"
import { useStreak } from "@/hooks/useStreak"
import type { DiaryFeedback } from "@/lib/types"

type DiaryChange = {
  original: string
  corrected: string
  englishMeaning: string
  reason: string
}

type DiaryResult = {
  correctedText: string
  feedback: string
  originalText: string
  mood?: string
  grammarPoints?: string[]
  changes?: DiaryChange[]
}

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

export default function DiaryPage() {
  const [feedback, setFeedback] = useState<DiaryFeedback[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<DiaryResult | null>(null)
  const [saveMessage, setSaveMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const { streakDays, refreshStreak } = useStreak()

  async function handleAnalyze(content: string) {
    if (!content.trim()) return
    setLoading(true)
    setError("")
    setSaveMessage("")
    try {
      const today = new Date().toISOString().split("T")[0]
      const data = await diaryApi.createOrUpdate(today, content)
      setResult({
        correctedText: data.correctedText,
        feedback: data.feedback,
        originalText: data.originalText,
        mood: data.mood ?? undefined,
        grammarPoints: Array.isArray(data.grammarPoints) ? data.grammarPoints : [],
        changes: Array.isArray(data.changes) ? data.changes : [],
      })

      const items: DiaryFeedback[] = [
        {
          id: "corrected",
          title: "Corrected version",
          description: data.correctedText,
        },
        {
          id: "feedback",
          title: "AI Feedback",
          description: data.feedback,
        },
      ]

      if (data.mood) {
        items.push({
          id: "mood",
          title: "Mood detected",
          description: data.mood,
        })
      }

      setFeedback(items)
      refreshStreak()
    } catch {
      setError("Failed to analyze diary. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSavePhrase() {
    if (!result) return
    setSaving(true)
    setSaveMessage("")
    try {
      await vocabApi.save({
        category: "Diary phrase",
        term: result.correctedText,
        meaning: result.feedback,
        example: result.originalText,
      })
      setSaveMessage("Saved to your vocabulary deck.")
    } catch {
      setSaveMessage("Could not save this phrase right now.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-12"
    >
      <motion.div variants={itemVariants}>
        <PageHero
          eyebrow="Diary"
          title="Daily Writing Studio"
          description="Turn rough Korean journal entries into polished, natural writing. Get detailed coaching on your tone and word choice."
          stats={[
            { label: "Method", value: "Natural Journaling" },
            { label: "Feedback", value: "Tone + Mood" },
            { label: "Outcome", value: "Native Phrasing" },
          ]}
        />
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-bold text-destructive">
          {error}
        </motion.div>
      )}

      {result && (
        <motion.div 
          variants={itemVariants}
          className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-emerald-500/20 bg-emerald-500/5 px-6 py-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 size={18} strokeWidth={2.5} />
            </div>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Entry analyzed and improved.</p>
            {streakDays !== null && (
              <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-600 dark:bg-orange-400/15 dark:text-orange-300">
                🔥 {streakDays} day{streakDays !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {saveMessage && (
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{saveMessage}</p>
            )}
            <Button 
              type="button" 
              onClick={handleSavePhrase} 
              disabled={saving}
              className="h-10 rounded-xl bg-emerald-600 px-5 text-xs font-black text-white hover:bg-emerald-500 active:scale-95"
            >
              <BookmarkPlus size={14} className="mr-2" strokeWidth={2.5} />
              {saving ? "Saving..." : "Save to Vocab"}
            </Button>
          </div>
        </motion.div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <motion.div variants={itemVariants}>
          <DiaryEditor onAnalyze={handleAnalyze} />
        </motion.div>
        
        <motion.div variants={itemVariants} className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {/* Feedback card skeletons matching FeedbackPanel item shape */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-[2rem] border border-border bg-card p-5 shadow-sm dark:bg-slate-900/40">
                  <div className="flex items-start gap-3">
                    <Skeleton className="mt-0.5 h-5 w-5 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-5/6" />
                      {i === 1 && <Skeleton className="h-3 w-3/4" />}
                    </div>
                  </div>
                </div>
              ))}
              {/* Change breakdown skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-28" />
                {[1, 2].map((i) => (
                  <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                    <div className="flex items-center gap-2 border-b border-border/60 bg-accent/5 px-4 py-3">
                      <Skeleton className="h-6 w-20 rounded-lg" />
                      <Skeleton className="h-3 w-4" />
                      <Skeleton className="h-6 w-24 rounded-lg" />
                    </div>
                    <div className="space-y-1.5 px-4 py-3">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <FeedbackPanel items={feedback} />

              {/* Per-correction breakdown */}
              {result?.changes && result.changes.length > 0 && (
                <div className="space-y-2">
                  <p className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    What changed &amp; why
                  </p>
                  <div className="space-y-2">
                    {result.changes.map((c, i) => (
                      <div
                        key={i}
                        className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 dark:border-white/10 dark:bg-white/4"
                      >
                        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/70 bg-slate-50/60 px-4 py-3 dark:border-white/10 dark:bg-white/3">
                          <span className="rounded-lg bg-red-100 px-2.5 py-1 text-sm text-red-700 line-through dark:bg-red-400/12 dark:text-red-300">
                            {c.original}
                          </span>
                          <ArrowRight size={14} className="shrink-0 text-muted-foreground" />
                          <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-400/12 dark:text-emerald-300">
                            {c.corrected}
                          </span>
                        </div>
                        {c.englishMeaning && (
                          <div className="flex items-center gap-2 border-b border-slate-200/70 bg-sky-50/50 px-4 py-2.5 dark:border-white/10 dark:bg-sky-400/6">
                            <Languages size={13} className="shrink-0 text-sky-600 dark:text-sky-400" />
                            <p className="text-sm text-sky-700 dark:text-sky-300">{c.englishMeaning}</p>
                          </div>
                        )}
                        <div className="px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">Why</p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">{c.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grammar points */}
              {result?.grammarPoints && result.grammarPoints.length > 0 && (
                <div className="rounded-[1.6rem] border border-slate-200/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Grammar points
                  </p>
                  <ul className="mt-3 space-y-2">
                    {result.grammarPoints.map((point, i) => (
                      <li key={i} className="flex gap-2 text-muted-foreground">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        <span className="leading-7 text-sm">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="rounded-[2rem] border border-border bg-card/50 p-6 backdrop-blur-sm dark:bg-slate-900/20">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Info size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-base font-black text-foreground">Writing Tip</h4>
            <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground max-w-2xl">
              Don't worry about being perfect. Write as much as you can, then let the AI show you how a native speaker would express the same thoughts. This comparison is one of the most effective ways to reach an advanced level.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
