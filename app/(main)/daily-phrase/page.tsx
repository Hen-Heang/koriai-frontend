"use client"

import { useEffect, useState } from "react"
import { BookmarkPlus, CheckCircle2, Info, Lightbulb, RefreshCw, PenLine } from "lucide-react"
import { motion } from "motion/react"

import { PageHero } from "@/components/app/page-hero"
import { TipCard } from "@/components/app/tip-card"
import { Button } from "@/components/ui/button"
import { ErrorBanner } from "@/components/ui/error-banner"
import { Skeleton } from "@/components/ui/skeleton"
import { SpeakButton } from "@/components/ui/SpeakButton"
import { dailyPhraseApi, getApiErrorMessage } from "@/lib/api"
import { staggerContainer, itemVariants } from "@/lib/motion"
import type { DailyPhrase } from "@/lib/types"
import { SentenceChallenge } from "@/components/vocab/SentenceChallenge"

const containerVariants = staggerContainer(0.1)

export default function DailyPhrasePage() {
  const [phrase, setPhrase] = useState<DailyPhrase | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [marking, setMarking] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")

  async function load() {
    setLoading(true)
    setError("")
    try {
      setPhrase(await dailyPhraseApi.getToday())
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load today's phrase."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    dailyPhraseApi
      .getToday()
      .then((data) => {
        if (active) {
          setPhrase(data)
        }
      })
      .catch((err) => {
        if (active) {
          setError(getApiErrorMessage(err, "Could not load today's phrase."))
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  async function handleSave() {
    if (!phrase) return
    setSaving(true)
    setSaveMessage("")
    try {
      await dailyPhraseApi.addToFlashcards(phrase.id)
      setSaveMessage("Added to your flashcards.")
    } catch (err) {
      setSaveMessage(getApiErrorMessage(err, "Could not save this phrase."))
    } finally {
      setSaving(false)
    }
  }

  async function handleMarkLearned() {
    if (!phrase) return
    setMarking(true)
    try {
      const next = !phrase.learned
      await dailyPhraseApi.markLearned(phrase.id, next)
      setPhrase({ ...phrase, learned: next })
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not update status."))
    } finally {
      setMarking(false)
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
          eyebrow="Daily Phrase"
          title="Phrase of the Day"
          description="One practical Korean workplace expression every day — with meaning, when to use it, formality, and similar expressions you can swap in."
          stats={[
            { label: "Cadence", value: "Daily" },
            { label: "Focus", value: "Workplace" },
            { label: "Action", value: "Save + Learn" },
          ]}
        />
      </motion.div>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {loading ? (
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="rounded-[2rem] border border-border bg-card p-7 shadow-sm dark:bg-slate-900/40">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-5 h-9 w-3/4" />
            <Skeleton className="mt-3 h-5 w-1/2" />
            <Skeleton className="mt-6 h-20 w-full rounded-2xl" />
          </div>
        </motion.div>
      ) : phrase ? (
        <>
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-xl dark:bg-slate-900/40 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {phrase.formality && (
                  <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                    {phrase.formality}
                  </span>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                    {phrase.phrase}
                  </h2>
                  <SpeakButton text={phrase.phrase} className="shrink-0" />
                </div>
                {phrase.romanization && (
                  <p className="mt-1 text-sm font-medium italic text-muted-foreground">
                    {phrase.romanization}
                  </p>
                )}
                <p className="mt-3 text-lg font-bold text-foreground/90">{phrase.meaning}</p>
              </div>
            </div>

            {phrase.whenToUse && (
              <div className="mt-6 rounded-2xl border border-sky-200/60 bg-sky-50/60 p-4 dark:border-sky-400/15 dark:bg-sky-400/6">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
                  When to use
                </p>
                <p className="mt-1.5 text-sm leading-6 text-sky-800 dark:text-sky-200">
                  {phrase.whenToUse}
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={handleMarkLearned}
                disabled={marking}
                className={
                  phrase.learned
                    ? "h-10 rounded-xl bg-emerald-600 px-5 text-xs font-black text-white hover:bg-emerald-500 active:scale-95"
                    : "h-10 rounded-xl border border-border bg-background px-5 text-xs font-black text-foreground hover:bg-accent active:scale-95"
                }
              >
                <CheckCircle2 size={14} className="mr-2" strokeWidth={2.5} />
                {phrase.learned ? "Learned" : "Mark as learned"}
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="h-10 rounded-xl border border-border bg-background px-5 text-xs font-black text-foreground hover:bg-accent active:scale-95"
              >
                <BookmarkPlus size={14} className="mr-2" strokeWidth={2.5} />
                {saving ? "Saving..." : "Add to flashcards"}
              </Button>
              {saveMessage && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {saveMessage}
                </span>
              )}
            </div>
          </motion.div>

          {phrase.similarExpressions && phrase.similarExpressions.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-2">
              <p className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Similar expressions
              </p>
              <div className="space-y-2">
                {phrase.similarExpressions.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-border bg-card px-4 py-3 dark:bg-white/4"
                  >
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-foreground">{s.phrase}</p>
                      <SpeakButton text={s.phrase} />
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{s.meaning}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Sentence Practice */}
          <motion.div variants={itemVariants} className="rounded-[2rem] border border-border bg-card p-5 shadow-sm dark:bg-slate-900/40">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <PenLine size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="text-sm font-black text-foreground">Write it yourself</h4>
                <p className="text-xs font-medium text-muted-foreground/60">Use today&apos;s phrase in your own sentence</p>
              </div>
            </div>
            <SentenceChallenge
              cardId={phrase.id}
              term={phrase.phrase}
              onGetChallenge={(id) => dailyPhraseApi.getPractice(id)}
              onCheckSentence={(id, challengePrompt, attempt) =>
                dailyPhraseApi.checkPractice(id, { challengePrompt, attempt })
              }
            />
          </motion.div>
        </>
      ) : null}

      <motion.div variants={itemVariants}>
        <TipCard icon={Lightbulb} title="Make it stick">
          Say today&apos;s phrase out loud three times, then try to use it once in your next
          standup or team chat. Add it to your flashcards so it comes back in your spaced
          repetition reviews.
        </TipCard>
      </motion.div>

      {!loading && (
        <motion.div variants={itemVariants} className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info size={13} />
          <span>A fresh phrase is generated for you once per day.</span>
          <button
            type="button"
            onClick={load}
            className="ml-auto inline-flex items-center gap-1.5 font-bold text-emerald-600 hover:underline dark:text-emerald-400"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}
