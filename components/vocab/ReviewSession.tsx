"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import {
  ArrowLeft,
  ArrowLeftRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Eye,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { cn } from "@/lib/utils"
import { vocabApi } from "@/lib/api"
import { formatInterval, previewIntervalDays, RATINGS, type ReviewRating } from "@/lib/srs"
import { isCorrectTerm, shuffle } from "@/lib/vocab-review"
import type { VocabItem } from "@/lib/types"
import { SpeakButton } from "@/components/ui/SpeakButton"

function getChoices(correct: VocabItem, pool: VocabItem[]): VocabItem[] {
  const distractors = shuffle(pool.filter((w) => w.id !== correct.id)).slice(0, 3)
  return shuffle([correct, ...distractors])
}

type Mode = "flashcard" | "choice" | "recall"
type Phase = "idle" | "quiz" | "done"

type ReviewSessionProps = {
  dueToday: VocabItem[]
  allWords: VocabItem[]
  loading?: boolean
  onRate: (id: string, rating: ReviewRating) => void | Promise<void>
}

// Anki-style grade buttons: label + the interval the card jumps to.
const GRADE_STYLES: Record<ReviewRating, { label: string; classes: string }> = {
  AGAIN: {
    label: "Again",
    classes:
      "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400",
  },
  HARD: {
    label: "Hard",
    classes:
      "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400",
  },
  GOOD: {
    label: "Good",
    classes:
      "border-transparent bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500",
  },
  EASY: {
    label: "Easy",
    classes:
      "border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-400",
  },
}

function GradeButtons({
  card,
  onGrade,
}: {
  card: VocabItem
  onGrade: (rating: ReviewRating) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {RATINGS.map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onGrade(rating)}
          className={cn(
            "flex h-16 flex-col items-center justify-center gap-0.5 rounded-2xl border transition-all active:scale-95",
            GRADE_STYLES[rating].classes
          )}
        >
          <span className="text-xs font-black uppercase tracking-wider">
            {GRADE_STYLES[rating].label}
          </span>
          <span className="text-[10px] font-bold opacity-70">
            {formatInterval(previewIntervalDays(card, rating))}
          </span>
        </button>
      ))}
    </div>
  )
}

// ─── Flashcard ────────────────────────────────────────────────────────────────
function FlashCard({
  card,
  reversed = false,
  onGrade,
}: {
  card: VocabItem
  reversed?: boolean
  onGrade: (rating: ReviewRating) => void | Promise<void>
}) {
  const [flipped, setFlipped] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const [loadingHint, setLoadingHint] = useState(false)

  const grade = useCallback(
    (rating: ReviewRating) => {
      setFlipped(false)
      setHint(null)
      onGrade(rating)
    },
    [onGrade]
  )

  // Space/Enter flips, then 1-4 grade Again/Hard/Good/Easy (Anki keys)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (!flipped && (e.key === " " || e.key === "Enter")) {
        e.preventDefault()
        setFlipped(true)
      } else if (flipped && ["1", "2", "3", "4"].includes(e.key)) {
        grade(RATINGS[Number(e.key) - 1])
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [flipped, grade])

  async function fetchHint() {
    if (hint || loadingHint) return
    setLoadingHint(true)
    try {
      const res = await vocabApi.lookup(card.term)
      setHint(
        res.example
          ? `${res.example}${res.exampleTranslation ? ` / ${res.exampleTranslation}` : ""}`
          : res.definition
      )
    } catch {
      setHint("Could not load hint. Please try again.")
    } finally {
      setLoadingHint(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Flip card */}
      <div className="perspective-[1000px] h-80 sm:h-96">
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="relative h-full w-full transform-3d"
        >
          {/* Front */}
          <button
            type="button"
            onClick={() => setFlipped(true)}
            className="absolute inset-0 backface-hidden flex flex-col items-center justify-center rounded-[2rem] border border-border bg-card p-6 text-center shadow-xl dark:bg-slate-900/60 sm:rounded-[3rem] sm:p-8"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-6">{reversed ? "English" : "Korean"}</span>
            <p className="w-full break-keep text-4xl font-black leading-tight tracking-tight text-foreground [overflow-wrap:anywhere] sm:text-6xl">{reversed ? card.meaning : card.term}</p>
            <div className="mt-10 flex items-center gap-2 rounded-full border border-border bg-accent/5 px-5 py-2.5 text-xs font-bold text-muted-foreground/60 transition-colors hover:bg-accent/10">
              Tap to Reveal
            </div>
          </button>

          {/* Back */}
          <div
            className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center rounded-[2rem] border border-emerald-500/20 bg-card p-6 text-center shadow-2xl dark:bg-slate-900/80 sm:rounded-[3rem] sm:p-8"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400 mb-4">{reversed ? "Korean" : "Meaning"}</span>
            <p className="w-full break-keep text-2xl font-black leading-tight tracking-tight text-foreground [overflow-wrap:anywhere] sm:text-4xl">{reversed ? card.term : card.meaning}</p>
            
            {card.example && (
              <div className="mt-6 w-full max-w-sm rounded-2xl border border-border bg-accent/5 p-4 text-sm font-bold leading-relaxed text-muted-foreground">
                {card.example}
              </div>
            )}

            <div className="mt-8">
              <SpeakButton text={card.term} className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-sm ring-1 ring-emerald-500/20 active:scale-90" />
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* AI Hint Section */}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              {hint ? (
                <p className="text-sm font-bold text-amber-700 dark:text-amber-200/90 leading-relaxed">{hint}</p>
              ) : (
                <button
                  type="button"
                  onClick={fetchHint}
                  disabled={loadingHint}
                  className="flex items-center gap-2 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400"
                >
                  <Lightbulb size={14} strokeWidth={2.5} className={loadingHint ? "animate-pulse" : ""} />
                  {loadingHint ? "Creating AI sentence..." : "Get AI example sentence"}
                </button>
              )}
            </div>

            {/* Grading Buttons (Anki-style, keys 1-4) */}
            <GradeButtons card={card} onGrade={grade} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Multiple choice ───────────────────────────────────────────────────────────
function ChoiceCard({
  card,
  allWords,
  onKnew,
  onLearning,
}: {
  card: VocabItem
  allWords: VocabItem[]
  onKnew: () => void | Promise<void>
  onLearning: () => void
}) {
  const choices = useMemo(() => getChoices(card, allWords), [card, allWords])
  const [selected, setSelected] = useState<string | null>(null)
  const answered = selected !== null

  function pick(id: string) {
    if (answered) return
    setSelected(id)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Prompt Card */}
      <div className="flex flex-col items-center justify-center rounded-[2rem] border border-border bg-accent/5 p-6 text-center dark:bg-white/5 sm:rounded-[3rem] sm:p-10">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-4">Select Meaning</span>
        <p className="w-full break-keep text-4xl font-black leading-tight tracking-tight text-foreground [overflow-wrap:anywhere] sm:text-6xl">{card.term}</p>
        <div className="mt-6">
          <SpeakButton text={card.term} className="h-10 w-10 rounded-xl bg-background shadow-sm ring-1 ring-border/50" />
        </div>
      </div>

      {/* Choices List */}
      <div className="grid gap-3">
        {choices.map((choice, i) => {
          const isCorrect = choice.id === card.id
          const isSelected = choice.id === selected
          
          return (
            <motion.button
              key={choice.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              type="button"
              onClick={() => pick(choice.id)}
              disabled={answered}
              className={cn(
                "group flex w-full items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-left transition-all active:scale-[0.98] sm:px-6 sm:py-5",
                !answered
                  ? "border-border bg-card hover:border-emerald-500/40 hover:bg-emerald-500/[0.02]"
                  : isCorrect
                  ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/20"
                  : isSelected
                  ? "border-red-500 bg-red-500/10 ring-1 ring-red-500/20"
                  : "border-border/40 bg-accent/10 opacity-40"
              )}
            >
              <span className={cn(
                "min-w-0 text-[15px] font-bold [overflow-wrap:anywhere]",
                !answered ? "text-foreground" : isCorrect ? "text-emerald-700 dark:text-emerald-400" : isSelected ? "text-red-700 dark:text-red-400" : "text-muted-foreground"
              )}>
                {choice.meaning}
              </span>
              {answered && isCorrect && <CheckCircle2 size={18} className="text-emerald-600" strokeWidth={3} />}
              {answered && isSelected && !isCorrect && <XCircle size={18} className="text-red-600" strokeWidth={3} />}
            </motion.button>
          )
        })}
      </div>

      {/* Immediate Result / Next Button */}
      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2"
          >
            <button
              type="button"
              onClick={() => (selected === card.id ? onKnew() : onLearning())}
              className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 text-sm font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              Next Word
              <ChevronRight size={20} strokeWidth={3} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Typed recall ──────────────────────────────────────────────────────────────
function RecallCard({
  card,
  onKnew,
  onLearning,
}: {
  card: VocabItem
  onKnew: () => void | Promise<void>
  onLearning: () => void
}) {
  const [answer, setAnswer] = useState("")
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null)
  const answered = result !== null

  function submit() {
    if (answered || !answer.trim()) return
    setResult(isCorrectTerm(answer, card.term) ? "correct" : "incorrect")
  }

  function next() {
    if (result === "correct") {
      onKnew()
    } else {
      onLearning()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Prompt Card */}
      <div className="flex flex-col items-center justify-center rounded-[2rem] border border-border bg-accent/5 p-6 text-center dark:bg-white/5 sm:rounded-[3rem] sm:p-10">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-4">Type in Korean</span>
        <p className="w-full break-keep text-3xl font-black leading-tight tracking-tight text-foreground [overflow-wrap:anywhere] sm:text-5xl">{card.meaning}</p>
        {card.pronunciation && answered && (
          <p className="mt-3 text-xs font-bold italic text-muted-foreground/50">[{card.pronunciation}]</p>
        )}
      </div>

      {/* Answer Input */}
      <div className="space-y-3">
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return
            e.preventDefault()
            if (answered) {
              next()
            } else {
              submit()
            }
          }}
          disabled={answered}
          autoFocus
          lang="ko"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="한국어로 입력하세요..."
          className={cn(
            "h-16 w-full rounded-2xl border bg-card px-5 text-center text-xl font-black tracking-tight text-foreground placeholder:text-base placeholder:font-bold placeholder:text-muted-foreground/30 focus:outline-none transition-colors",
            !answered
              ? "border-border focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10"
              : result === "correct"
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400"
          )}
        />

        {!answered && (
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={!answer.trim()}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-40"
            >
              <CheckCircle2 size={18} strokeWidth={2.5} />
              Check
            </button>
            <button
              type="button"
              onClick={() => setResult("incorrect")}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-5 text-xs font-black uppercase tracking-widest text-muted-foreground transition-all hover:bg-accent active:scale-95"
            >
              <Eye size={16} strokeWidth={2.5} />
              Show
            </button>
          </div>
        )}
      </div>

      {/* Result + Next */}
      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div
              className={cn(
                "flex items-center justify-between gap-3 rounded-2xl border p-4",
                result === "correct"
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-red-500/20 bg-red-500/5"
              )}
            >
              <div className="min-w-0">
                <p className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em]",
                  result === "correct" ? "text-emerald-600" : "text-red-500"
                )}>
                  {result === "correct" ? "Correct" : "Answer"}
                </p>
                <p className="mt-1 break-keep text-2xl font-black tracking-tight text-foreground [overflow-wrap:anywhere]">{card.term}</p>
                {card.example && (
                  <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground/70">{card.example}</p>
                )}
              </div>
              <SpeakButton text={card.term} className="h-11 w-11 shrink-0 rounded-xl bg-background shadow-sm ring-1 ring-border/50" />
            </div>

            <button
              type="button"
              onClick={next}
              className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 text-sm font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              Next Word
              <ChevronRight size={20} strokeWidth={3} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export function ReviewSession({ dueToday, allWords, loading, onRate }: ReviewSessionProps) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [mode, setMode] = useState<Mode>("flashcard")
  const [reversed, setReversed] = useState(false)
  const [queue, setQueue] = useState<VocabItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lapsedIds, setLapsedIds] = useState<Set<string>>(new Set())

  const canUseChoice = allWords.length >= 4

  function startQuiz() {
    const deck = dueToday.length > 0 ? dueToday : allWords
    setQueue(shuffle(deck))
    setCurrentIndex(0)
    setLapsedIds(new Set())
    setPhase("quiz")
  }

  const handleGrade = useCallback(
    (rating: ReviewRating) => {
      const card = queue[currentIndex]
      if (!card) return
      // Fire-and-forget so grading feels instant; the hook reconciles state.
      void Promise.resolve(onRate(card.id, rating)).catch(() => {})

      if (rating === "AGAIN") {
        setLapsedIds((prev) => new Set(prev).add(card.id))
        // Mirror the backend lapse so the card's grade previews are correct
        // when it comes back around later in this session.
        const lapsed: VocabItem = {
          ...card,
          repetitions: 0,
          intervalDays: 0,
          easeFactor: Math.max(1.3, card.easeFactor - 0.2),
          lapses: card.lapses + 1,
        }
        setQueue((q) => {
          const next = [...q]
          next.splice(currentIndex, 1)
          next.push(lapsed)
          return next
        })
        if (currentIndex >= queue.length - 1) {
          setCurrentIndex(0)
        }
        return
      }

      if (currentIndex + 1 >= queue.length) {
        setPhase("done")
      } else {
        setCurrentIndex((i) => i + 1)
      }
    },
    [queue, currentIndex, onRate]
  )

  const total = queue.length

  // ── idle ──────────────────────────────────────────────────────────────────
  if (phase === "idle") {
    const deckSize = dueToday.length > 0 ? dueToday.length : allWords.length
    return (
      <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl dark:bg-slate-900/40 dark:backdrop-blur-md sm:rounded-[2.5rem]">
        {/* Top Header */}
        <div className="bg-emerald-500/[0.03] px-5 py-7 text-center border-b border-border/60 sm:px-8 sm:py-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[2rem] bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
            <BrainCircuit size={32} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">Memory Lab</h2>
          <p className="mt-2 text-sm font-medium text-muted-foreground/60">
            {dueToday.length > 0
              ? `${dueToday.length} reviews awaiting attention`
              : "Review your saved dictionary items"}
          </p>
        </div>

        <div className="flex flex-col gap-6 p-5 sm:p-8">
          {/* Deck Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl border border-border bg-accent/5 p-5 text-center">
              <p className="text-3xl font-black text-emerald-600">{dueToday.length}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Due Now</p>
            </div>
            <div className="rounded-3xl border border-border bg-accent/5 p-5 text-center">
              <p className="text-3xl font-black text-foreground">{allWords.length}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Total Deck</p>
            </div>
          </div>

          {/* Mode Selector - iOS style */}
          <div className="flex gap-1 rounded-2xl bg-accent/10 p-1">
            {(["flashcard", ...(canUseChoice ? (["choice"] as Mode[]) : []), "recall"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 rounded-[0.9rem] py-3 text-xs font-black uppercase tracking-widest transition-all",
                  mode === m
                    ? "bg-card text-emerald-600 shadow-sm shadow-emerald-500/10 ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "flashcard" ? "Cards" : m === "choice" ? "Quiz" : "Recall"}
              </button>
            ))}
          </div>

          {/* Direction toggle for flashcards */}
          {mode === "flashcard" && (
            <button
              type="button"
              onClick={() => setReversed((r) => !r)}
              className="mx-auto -mt-2 flex items-center gap-2 rounded-full border border-border bg-accent/5 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:bg-accent/20 hover:text-foreground active:scale-95"
            >
              <ArrowLeftRight size={13} strokeWidth={3} />
              {reversed ? "English → Korean" : "Korean → English"}
            </button>
          )}

          {/* Action Button */}
          <button
            type="button"
            disabled={loading || deckSize === 0}
            onClick={startQuiz}
            className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 text-base font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-emerald-600/30 transition-all hover:bg-emerald-500 hover:scale-[1.02] active:scale-95 disabled:opacity-40"
          >
            <Sparkles size={20} strokeWidth={2.5} />
            {loading ? "Loading..." : "Enter Session"}
          </button>
        </div>
      </div>
    )
  }

  // ── done ──────────────────────────────────────────────────────────────────
  if (phase === "done") {
    const knew = Math.max(0, total - lapsedIds.size)
    const pct = total > 0 ? Math.round((knew / total) * 100) : 0
    const headline = pct >= 80 ? "Perfect Loop" : pct >= 50 ? "Solid Growth" : "Keep Building"
    
    return (
      <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl dark:bg-slate-900/40 sm:rounded-[2.5rem]">
        <div className="flex flex-col items-center gap-8 px-5 py-10 text-center sm:px-8 sm:py-16">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-emerald-500/10 text-emerald-600 shadow-inner ring-1 ring-emerald-500/20">
              <Trophy size={48} strokeWidth={2} />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/40 ring-4 ring-card"
            >
              <CheckCircle2 size={24} strokeWidth={3} />
            </motion.div>
          </div>

          <div>
            <h2 className="text-4xl font-black tracking-tight text-foreground">{headline}</h2>
            <p className="mt-3 text-[15px] font-medium text-muted-foreground/60 leading-relaxed">
              You knew <span className="text-emerald-600 font-black">{knew}</span> of <span className="text-foreground font-black">{total}</span> words on the first try.
              Keep this momentum up to strengthen long-term memory.
            </p>
          </div>

          {/* Performance Visualization */}
          <div className="relative h-2 w-full max-w-xs overflow-hidden rounded-full bg-accent/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-linear-to-r from-emerald-500 to-teal-400"
            />
          </div>

          <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={startQuiz}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-background py-4 text-xs font-black uppercase tracking-widest text-foreground transition-all hover:bg-accent active:scale-95"
            >
              <RotateCcw size={16} strokeWidth={3} />
              Re-run
            </button>
            <button
              type="button"
              onClick={() => setPhase("idle")}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-95"
            >
              Finish Lab
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── quiz ──────────────────────────────────────────────────────────────────
  const card = queue[currentIndex]
  if (!card) return null

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl dark:bg-slate-900/40 dark:backdrop-blur-md sm:rounded-[2.5rem]">
      {/* Session Progress Header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-accent/5 px-4 py-4 sm:px-6 sm:py-5">
        <button 
          onClick={() => setPhase("idle")}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground/40 hover:bg-accent/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <span className="text-[13px] font-black uppercase tracking-widest text-foreground">
            {currentIndex + 1} <span className="opacity-20 mx-1">/</span> {total}
          </span>
        </div>
        <div className="h-9 w-9" /> {/* Spacer */}
      </div>

      {/* Smooth Progress Indicator */}
      <div className="h-1 w-full bg-accent/10">
        <motion.div
          animate={{ width: `${(currentIndex / total) * 100}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-emerald-500"
        />
      </div>

      <div className="p-4 sm:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={card.id + currentIndex}
            initial={{ opacity: 0, scale: 0.98, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.98, x: -10 }}
            transition={{ duration: 0.3 }}
          >
            {mode === "recall" ? (
              <RecallCard
                card={card}
                onKnew={() => handleGrade("GOOD")}
                onLearning={() => handleGrade("AGAIN")}
              />
            ) : mode === "flashcard" || !canUseChoice ? (
              <FlashCard
                card={card}
                reversed={reversed}
                onGrade={handleGrade}
              />
            ) : (
              <ChoiceCard
                card={card}
                allWords={allWords}
                onKnew={() => handleGrade("GOOD")}
                onLearning={() => handleGrade("AGAIN")}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
