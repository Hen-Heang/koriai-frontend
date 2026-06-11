"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import {
  ArrowLeft,
  BookmarkPlus,
  BookOpenText,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Lightbulb,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { SmartPeek } from "@/components/ui/SmartPeek"
import { SpeakButton } from "@/components/ui/SpeakButton"
import { getApiErrorMessage, vocabApi } from "@/lib/api"
import { READING_UNITS } from "@/lib/reading-data"
import {
  READING_CATEGORIES,
  getReadingProgress,
  getReadingProgressServerSnapshot,
  markUnitQuizResult,
  markUnitStarted,
  subscribeReadingProgress,
} from "@/lib/reading"
import { cn } from "@/lib/utils"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
} as const

/** Splits Korean text into words so each one becomes tappable via SmartPeek. */
function PeekableText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((token, i) => {
        if (/^\s+$/.test(token) || token === "") return token
        const word = token.replace(/[.,!?~"'“”‘’()[\]…:;]/g, "")
        if (!word) return token
        return (
          <SmartPeek key={i} word={word}>
            {token}
          </SmartPeek>
        )
      })}
    </>
  )
}

export default function ReadingUnitPage() {
  const params = useParams<{ id: string }>()
  const unit = useMemo(() => READING_UNITS.find((u) => u.id === params.id), [params.id])

  const progressMap = useSyncExternalStore(
    subscribeReadingProgress,
    getReadingProgress,
    getReadingProgressServerSnapshot
  )
  const progress = (unit && progressMap[unit.id]) || { status: "not_started" as const }

  const [visibleTranslations, setVisibleTranslations] = useState<Set<number>>(new Set())
  const [allTranslations, setAllTranslations] = useState(false)

  const [savedWords, setSavedWords] = useState<Set<string>>(new Set())
  const [savingWord, setSavingWord] = useState<string | null>(null)
  const [savingAll, setSavingAll] = useState(false)
  const [vocabMessage, setVocabMessage] = useState("")

  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    if (!unit) return
    markUnitStarted(unit.id)
  }, [unit])

  if (!unit) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-lg font-bold text-foreground">Unit not found.</p>
        <Link href="/reading" className="text-sm font-black text-emerald-600 hover:underline">
          Back to Reading Units
        </Link>
      </div>
    )
  }

  function toggleTranslation(index: number) {
    setVisibleTranslations((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  async function handleSaveWord(term: string, meaning: string, example?: string) {
    if (savedWords.has(term) || savingWord) return
    setSavingWord(term)
    setVocabMessage("")
    try {
      await vocabApi.save({ term, meaning, example, category: "Reading" })
      setSavedWords((prev) => new Set(prev).add(term))
    } catch (err) {
      setVocabMessage(getApiErrorMessage(err, "Could not save this word."))
    } finally {
      setSavingWord(null)
    }
  }

  async function handleSaveAll() {
    if (savingAll || !unit) return
    setSavingAll(true)
    setVocabMessage("")
    const next = new Set(savedWords)
    try {
      for (const v of unit.vocab) {
        if (next.has(v.term)) continue
        await vocabApi.save({ term: v.term, meaning: v.meaning, example: v.example, category: "Reading" })
        next.add(v.term)
        setSavedWords(new Set(next))
      }
      setVocabMessage("All words added to your flashcards — they will appear in your vocab reviews.")
    } catch (err) {
      setVocabMessage(getApiErrorMessage(err, "Could not save all words."))
    } finally {
      setSavingAll(false)
    }
  }

  function handleSubmitQuiz() {
    if (!unit) return
    const correct = unit.quiz.reduce(
      (acc, q, i) => acc + (answers[i] === q.answerIndex ? 1 : 0),
      0
    )
    setScore(correct)
    setSubmitted(true)
    markUnitQuizResult(unit.id, correct, unit.quiz.length)
  }

  function handleRetryQuiz() {
    setAnswers({})
    setSubmitted(false)
    setScore(0)
  }

  const allAnswered = Object.keys(answers).length === unit.quiz.length
  const passed = submitted && score >= Math.ceil(unit.quiz.length * 0.6)

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-12"
    >
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="space-y-4">
        <Link
          href="/reading"
          className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} strokeWidth={3} /> All units
        </Link>

        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-xl dark:bg-slate-900/40 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
              {READING_CATEGORIES[unit.category].label}
            </span>
            <span className="inline-flex rounded-full bg-muted px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              {unit.level}
            </span>
            {progress.status === "completed" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                <CheckCircle2 size={11} strokeWidth={3} /> Completed
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {unit.episode ? `${unit.episode} · ` : ""}
              {unit.title}
            </h1>
            <SpeakButton text={unit.title} className="shrink-0" />
          </div>
          <p className="mt-1 text-base font-bold text-muted-foreground">{unit.titleEnglish}</p>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground/80">
            {unit.summary}
          </p>
          <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground/50">
            Source: {unit.source}
          </p>
        </div>
      </motion.div>

      {/* ── Grammar note ── */}
      {unit.grammarNote && (
        <motion.div
          variants={itemVariants}
          className="rounded-[1.8rem] border border-sky-200/60 bg-sky-50/60 p-5 dark:border-sky-400/15 dark:bg-sky-400/6"
        >
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
            <GraduationCap size={16} strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-[0.18em]">Grammar focus</span>
          </div>
          <p className="mt-2 text-lg font-extrabold text-foreground">{unit.grammarNote.pattern}</p>
          <p className="mt-1.5 text-sm leading-6 text-sky-800 dark:text-sky-200">
            {unit.grammarNote.explanation}
          </p>
        </motion.div>
      )}

      {/* ── Reading section ── */}
      <motion.section variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <BookOpenText size={16} strokeWidth={2.5} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-black tracking-tight text-foreground">Read</h3>
            <span className="text-[10px] font-bold text-muted-foreground/60">
              Tap any word to look it up · tap 🔊 to listen
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAllTranslations((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 hover:underline dark:text-emerald-400"
          >
            {allTranslations ? <EyeOff size={13} strokeWidth={3} /> : <Eye size={13} strokeWidth={3} />}
            {allTranslations ? "Hide all translations" : "Show all translations"}
          </button>
        </div>

        <div className="space-y-3">
          {unit.paragraphs.map((p, i) => {
            const showTranslation = allTranslations || visibleTranslations.has(i)
            return (
              <div
                key={i}
                className="rounded-[1.8rem] border border-border bg-card p-5 shadow-sm dark:bg-slate-900/40 sm:p-6"
              >
                <div className="flex items-start gap-2">
                  <p className="flex-1 text-[15px] font-medium leading-8 text-foreground sm:text-base sm:leading-9">
                    <PeekableText text={p.korean} />
                  </p>
                  <SpeakButton text={p.korean} className="mt-1 shrink-0" />
                </div>

                <div className="mt-3 border-t border-border/60 pt-3">
                  <button
                    type="button"
                    onClick={() => toggleTranslation(i)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground/70 transition-colors hover:text-foreground"
                  >
                    {showTranslation ? (
                      <EyeOff size={12} strokeWidth={3} />
                    ) : (
                      <Eye size={12} strokeWidth={3} />
                    )}
                    {showTranslation ? "Hide translation" : "Show translation"}
                  </button>
                  {showTranslation && (
                    <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
                      {p.english}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </motion.section>

      {/* ── Vocabulary section ── */}
      <motion.section variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <BookmarkPlus size={16} strokeWidth={2.5} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-black tracking-tight text-foreground">
              Key Vocabulary <span className="text-muted-foreground/50">({unit.vocab.length})</span>
            </h3>
          </div>
          <Button
            type="button"
            onClick={handleSaveAll}
            disabled={savingAll || savedWords.size === unit.vocab.length}
            className="h-9 rounded-xl bg-emerald-600 px-4 text-[11px] font-black uppercase tracking-wider text-white hover:bg-emerald-500 active:scale-95"
          >
            {savingAll ? (
              <Loader2 size={13} className="mr-1.5 animate-spin" />
            ) : (
              <BookmarkPlus size={13} className="mr-1.5" strokeWidth={3} />
            )}
            {savedWords.size === unit.vocab.length ? "All saved" : "Save all to flashcards"}
          </Button>
        </div>

        {vocabMessage && (
          <p className="px-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">{vocabMessage}</p>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          {unit.vocab.map((v) => {
            const saved = savedWords.has(v.term)
            return (
              <div
                key={v.term}
                className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 dark:bg-white/4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-extrabold text-foreground">{v.term}</p>
                    <SpeakButton text={v.term} />
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-muted-foreground">{v.meaning}</p>
                  {v.example && (
                    <p className="mt-1 text-xs font-medium italic text-muted-foreground/60">
                      {v.example}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleSaveWord(v.term, v.meaning, v.example)}
                  disabled={saved || savingWord === v.term}
                  title={saved ? "Saved to flashcards" : "Save to flashcards"}
                  className={cn(
                    "mt-1 shrink-0 rounded-xl border p-2 transition-all active:scale-90",
                    saved
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {savingWord === v.term ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : saved ? (
                    <CheckCircle2 size={14} strokeWidth={2.5} />
                  ) : (
                    <BookmarkPlus size={14} strokeWidth={2.5} />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </motion.section>

      {/* ── Quiz section ── */}
      <motion.section variants={itemVariants} className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <GraduationCap size={16} strokeWidth={2.5} className="text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-base font-black tracking-tight text-foreground">
            Comprehension Quiz
          </h3>
          <span className="text-[10px] font-bold text-muted-foreground/60">
            Pass to complete the unit
          </span>
        </div>

        {submitted && (
          <div
            className={cn(
              "flex items-center justify-between rounded-[1.8rem] border p-5",
              passed
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-amber-500/30 bg-amber-500/5"
            )}
          >
            <div className="flex items-center gap-3">
              {passed ? (
                <CheckCircle2 size={24} strokeWidth={2.5} className="text-emerald-600 dark:text-emerald-400" />
              ) : (
                <RotateCcw size={24} strokeWidth={2.5} className="text-amber-600 dark:text-amber-400" />
              )}
              <div>
                <p className="text-base font-black text-foreground">
                  {score}/{unit.quiz.length} correct
                </p>
                <p className="text-xs font-bold text-muted-foreground">
                  {passed
                    ? "Unit completed! The vocabulary you saved will come back in your reviews."
                    : "Almost there — re-read the text above and try again."}
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleRetryQuiz}
              className="h-9 rounded-xl border border-border bg-background px-4 text-[11px] font-black uppercase tracking-wider text-foreground hover:bg-accent active:scale-95"
            >
              <RotateCcw size={13} className="mr-1.5" strokeWidth={3} /> Retry
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {unit.quiz.map((q, qi) => {
            const selected = answers[qi]
            return (
              <div
                key={qi}
                className="rounded-[1.8rem] border border-border bg-card p-5 shadow-sm dark:bg-slate-900/40"
              >
                <p className="font-extrabold text-foreground">
                  <span className="mr-2 text-muted-foreground/50">Q{qi + 1}.</span>
                  {q.question}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {q.options.map((opt, oi) => {
                    const isSelected = selected === oi
                    const isCorrect = submitted && oi === q.answerIndex
                    const isWrongPick = submitted && isSelected && oi !== q.answerIndex
                    return (
                      <button
                        key={oi}
                        type="button"
                        disabled={submitted}
                        onClick={() => setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-left text-sm font-bold transition-all active:scale-[0.98]",
                          isCorrect
                            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : isWrongPick
                              ? "border-destructive/40 bg-destructive/5 text-destructive"
                              : isSelected
                                ? "border-emerald-500/50 bg-emerald-500/5 text-foreground"
                                : "border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        )}
                      >
                        <span>{opt}</span>
                        {isCorrect && <CheckCircle2 size={15} strokeWidth={3} className="shrink-0" />}
                        {isWrongPick && <XCircle size={15} strokeWidth={3} className="shrink-0" />}
                      </button>
                    )
                  })}
                </div>
                {submitted && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-accent/50 p-3 text-xs font-medium leading-relaxed text-muted-foreground">
                    <Lightbulb size={13} strokeWidth={2.5} className="mt-0.5 shrink-0 text-amber-500" />
                    {q.explanation}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {!submitted && (
          <Button
            type="button"
            onClick={handleSubmitQuiz}
            disabled={!allAnswered}
            className="h-11 w-full rounded-2xl bg-emerald-600 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-500 active:scale-[0.99] sm:w-auto sm:px-8"
          >
            {allAnswered
              ? "Submit answers"
              : `Answer all questions (${Object.keys(answers).length}/${unit.quiz.length})`}
          </Button>
        )}
      </motion.section>
    </motion.div>
  )
}
