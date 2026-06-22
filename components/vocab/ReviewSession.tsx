"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import {
  ArrowLeft,
  ArrowLeftRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Eye,
  Flame,
  Gauge,
  Headphones,
  Layers3,
  Lightbulb,
  Loader2,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  XCircle,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { cn } from "@/lib/utils"
import { vocabApi } from "@/lib/api"
import { formatInterval, previewIntervalDays, RATINGS, type ReviewRating } from "@/lib/srs"
import { isCorrectTerm, readBestStreak, shuffle, writeBestStreak } from "@/lib/vocab-review"
import type { VocabItem } from "@/lib/types"
import { getCachedAudioUrl, SpeakButton } from "@/components/ui/SpeakButton"
import { toast } from "sonner"

function getChoices(correct: VocabItem, pool: VocabItem[]): VocabItem[] {
  const distractors = shuffle(pool.filter((w) => w.id !== correct.id)).slice(0, 3)
  return shuffle([correct, ...distractors])
}

// The romanized reading, shown under the term on every card variant. Size and
// spacing are passed in via className; the bracketed format is shared.
function Pronunciation({ text, className }: { text?: string | null; className?: string }) {
  if (!text) return null
  return <p className={cn("font-bold text-muted-foreground/70", className)}>[{text}]</p>
}

type Mode = "flashcard" | "choice" | "recall" | "listening"
type Phase = "idle" | "quiz" | "done"

type ReviewSessionProps = {
  dueToday: VocabItem[]
  allWords: VocabItem[]
  loading?: boolean
  onRate: (id: string, rating: ReviewRating) => void | Promise<void>
}

// Duolingo-style grade buttons: bright fill + darker bottom edge ("3D" press).
// label + the interval the card jumps to.
const GRADE_STYLES: Record<ReviewRating, { label: string; classes: string }> = {
  AGAIN: {
    label: "Again",
    classes: "bg-[#ff4b4b] border-[#e63b3b] text-white",
  },
  HARD: {
    label: "Hard",
    classes: "bg-[#ff9600] border-[#e08400] text-white",
  },
  GOOD: {
    label: "Good",
    classes: "bg-[#58cc02] border-[#46a302] text-white",
  },
  EASY: {
    label: "Easy",
    classes: "bg-[#1cb0f6] border-[#1499e0] text-white",
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
    <div className="grid grid-cols-4 gap-2.5">
      {RATINGS.map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onGrade(rating)}
          className={cn(
            "flex h-16 flex-col items-center justify-center gap-0.5 rounded-2xl border-b-4 transition-all active:translate-y-[3px] active:border-b-0",
            GRADE_STYLES[rating].classes
          )}
        >
          <span className="text-xs font-bold uppercase tracking-wider">
            {GRADE_STYLES[rating].label}
          </span>
          <span className="text-[11px] font-bold opacity-80">
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
      {/* Flip card — Duolingo-style chunky rounded card */}
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
            className="absolute inset-0 backface-hidden flex flex-col items-center justify-center rounded-3xl border-2 border-b-[6px] border-border bg-card p-6 text-center dark:bg-slate-900/60 sm:rounded-3xl sm:p-8"
          >
            <span className="mb-6 rounded-full bg-accent/40 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground/50">{reversed ? "English" : "Korean"}</span>
            <p className="w-full break-keep text-5xl font-bold leading-tight tracking-tight text-foreground [overflow-wrap:anywhere] sm:text-7xl">{reversed ? card.meaning : card.term}</p>
            {!reversed && <Pronunciation text={card.pronunciation} className="mt-4 text-xl sm:text-3xl" />}
            <div className="mt-10 flex items-center gap-2 rounded-2xl border-2 border-b-4 border-border bg-accent/5 px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground/60">
              Tap to Reveal
            </div>
          </button>

          {/* Back */}
          <div
            className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center rounded-3xl border-2 border-b-[6px] border-[#58cc02]/40 bg-[#58cc02]/[0.06] p-6 text-center dark:bg-[#58cc02]/[0.08] sm:rounded-3xl sm:p-8"
          >
            <span className="mb-4 rounded-full bg-[#58cc02]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#58a302] dark:text-[#89e219]">{reversed ? "Korean" : "Meaning"}</span>
            <p className="w-full break-keep text-3xl font-bold leading-tight tracking-tight text-foreground [overflow-wrap:anywhere] sm:text-5xl">{reversed ? card.term : card.meaning}</p>
            <Pronunciation text={card.pronunciation} className="mt-2 text-base sm:text-2xl" />
            {/* Always surface the other side too, so each card reinforces Korean + reading + meaning together. */}
            <p className="mt-2 break-keep text-lg font-bold text-muted-foreground/80 [overflow-wrap:anywhere] sm:text-2xl">
              {reversed ? card.meaning : card.term}
            </p>

            {card.example && (
              <div className="mt-6 w-full max-w-sm rounded-2xl border-2 border-[#58cc02]/20 bg-card/80 p-4 text-sm font-bold leading-relaxed text-muted-foreground">
                {card.example}
              </div>
            )}

            <div className="mt-8">
              <SpeakButton text={card.term} className="h-14 w-14 rounded-2xl border-b-4 border-[#1499e0] bg-[#1cb0f6] text-white transition-all active:translate-y-[3px] active:border-b-0" />
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
            <div className="rounded-2xl border-2 border-[#ffc800]/40 bg-[#ffc800]/10 p-4">
              {hint ? (
                <p className="text-sm font-bold leading-relaxed text-[#b88600] dark:text-[#ffd43b]">{hint}</p>
              ) : (
                <button
                  type="button"
                  onClick={fetchHint}
                  disabled={loadingHint}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#b88600] hover:text-[#9a7100] dark:text-[#ffd43b]"
                >
                  <Lightbulb size={14} strokeWidth={2.5} className={loadingHint ? "animate-pulse" : ""} />
                  {loadingHint ? "Creating AI sentence..." : "Get AI example sentence"}
                </button>
              )}
            </div>

            {/* Grading Buttons (Duolingo-style, keys 1-4) */}
            <GradeButtons card={card} onGrade={grade} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Correct-answer reaction ─────────────────────────────────────────────────
// A celebratory burst shown the instant a test answer is right. The combo
// (consecutive correct answers this session) escalates the praise so a hot
// streak feels rewarding and keeps the learner motivated.
const PRAISE = ["Nice!", "잘했어요!", "Perfect!", "You got it!", "Excellent!", "Spot on!"]

function praiseFor(combo: number): string {
  if (combo >= 10) return "Unstoppable! 🚀"
  if (combo >= 5) return "On fire! 🔥"
  if (combo >= 3) return `${combo} in a row! ⚡`
  return PRAISE[Math.floor(Math.random() * PRAISE.length)]
}

// Light haptic tap on supported mobile devices — a tiny "yes!" you can feel.
function buzz() {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(15)
  }
}

function CorrectReaction({ combo }: { combo: number }) {
  const message = useMemo(() => praiseFor(combo), [combo])
  const emojis = combo >= 5 ? ["🔥", "⭐", "🎉", "✨", "💪", "🚀"] : ["🎉", "✨", "⭐", "👏"]
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 18 }}
      className="relative flex items-center justify-center gap-2 overflow-visible rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3"
    >
      {/* floating emoji burst */}
      <div className="pointer-events-none absolute inset-x-0 top-0">
        {emojis.map((e, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], y: -52 - i * 3 }}
            transition={{ duration: 1, delay: i * 0.05, ease: "easeOut" }}
            className="absolute left-1/2 top-1 text-lg"
            style={{ marginLeft: (i - (emojis.length - 1) / 2) * 28 }}
          >
            {e}
          </motion.span>
        ))}
      </div>
      <CheckCircle2 size={18} strokeWidth={3} className="text-emerald-600 dark:text-emerald-400" />
      <span className="text-base font-semibold text-emerald-700 dark:text-emerald-400">{message}</span>
    </motion.div>
  )
}

// ─── Multiple choice ───────────────────────────────────────────────────────────
function ChoiceCard({
  card,
  allWords,
  streak,
  onResult,
  onKnew,
  onLearning,
}: {
  card: VocabItem
  allWords: VocabItem[]
  streak: number
  onResult: (correct: boolean) => void
  onKnew: () => void | Promise<void>
  onLearning: () => void
}) {
  const choices = useMemo(() => getChoices(card, allWords), [card, allWords])
  const [selected, setSelected] = useState<string | null>(null)
  const answered = selected !== null

  function pick(id: string) {
    if (answered) return
    setSelected(id)
    const correct = id === card.id
    onResult(correct)
    if (correct) buzz()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Prompt Card */}
      <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-accent/5 p-6 text-center dark:bg-white/5 sm:rounded-3xl sm:p-10">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/40 mb-4">Select Meaning</span>
        <p className="w-full break-keep text-5xl font-bold leading-tight tracking-tight text-foreground [overflow-wrap:anywhere] sm:text-7xl">{card.term}</p>
        <Pronunciation text={card.pronunciation} className="mt-3 text-lg sm:text-2xl" />
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
                "min-w-0 text-base font-bold [overflow-wrap:anywhere] sm:text-lg",
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
            className="mt-2 space-y-3"
          >
            {selected === card.id && <CorrectReaction combo={streak + 1} />}
            <button
              type="button"
              onClick={() => (selected === card.id ? onKnew() : onLearning())}
              className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 text-sm font-bold uppercase tracking-wide text-white shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95"
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
  streak,
  onResult,
  onKnew,
  onLearning,
}: {
  card: VocabItem
  streak: number
  onResult: (correct: boolean) => void
  onKnew: () => void | Promise<void>
  onLearning: () => void
}) {
  const [answer, setAnswer] = useState("")
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null)
  const answered = result !== null

  function submit() {
    if (answered || !answer.trim()) return
    const correct = isCorrectTerm(answer, card.term)
    setResult(correct ? "correct" : "incorrect")
    onResult(correct)
    if (correct) buzz()
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
      <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-accent/5 p-6 text-center dark:bg-white/5 sm:rounded-3xl sm:p-10">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/40 mb-4">Type in Korean</span>
        <p className="w-full break-keep text-3xl font-bold leading-tight tracking-tight text-foreground [overflow-wrap:anywhere] sm:text-5xl">{card.meaning}</p>
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
            "h-16 w-full rounded-2xl border bg-card px-5 text-center text-xl font-bold tracking-tight text-foreground placeholder:text-base placeholder:font-bold placeholder:text-muted-foreground/30 focus:outline-none transition-colors",
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
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-40"
            >
              <CheckCircle2 size={18} strokeWidth={2.5} />
              Check
            </button>
            <button
              type="button"
              onClick={() => {
                setResult("incorrect")
                onResult(false)
              }}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-5 text-xs font-bold uppercase tracking-wide text-muted-foreground transition-all hover:bg-accent active:scale-95"
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
            {result === "correct" && <CorrectReaction combo={streak + 1} />}
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
                  "text-[11px] font-bold uppercase tracking-wide",
                  result === "correct" ? "text-emerald-600" : "text-red-500"
                )}>
                  {result === "correct" ? "Correct" : "Answer"}
                </p>
                <p className="mt-1 break-keep text-2xl font-bold tracking-tight text-foreground [overflow-wrap:anywhere]">{card.term}</p>
                {card.example && (
                  <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground/70">{card.example}</p>
                )}
              </div>
              <SpeakButton text={card.term} className="h-11 w-11 shrink-0 rounded-xl bg-background shadow-sm ring-1 ring-border/50" />
            </div>

            <button
              type="button"
              onClick={next}
              className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 text-sm font-bold uppercase tracking-wide text-white shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95"
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

// ─── Audio-first (listening) ────────────────────────────────────────────────────
// Plays the Korean audio with the word hidden — you recall the meaning from
// sound alone, then reveal and self-grade. Trains listening, the hardest skill
// for a spoken exam. Auto-plays on mount; iOS may block that, so the big play
// button is the primary control.
function ListeningCard({
  card,
  onGrade,
}: {
  card: VocabItem
  onGrade: (rating: ReviewRating) => void | Promise<void>
}) {
  const [revealed, setRevealed] = useState(false)
  const [loadingAudio, setLoadingAudio] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [audioFailed, setAudioFailed] = useState(false)

  const play = useCallback(
    async (rate = 1) => {
      if (!card.term) return
      setLoadingAudio(true)
      setAudioFailed(false)
      try {
        const url = await getCachedAudioUrl(card.term)
        const audio = new Audio(url)
        audio.playbackRate = rate
        setLoadingAudio(false)
        setPlaying(true)
        audio.onended = () => setPlaying(false)
        await audio.play()
      } catch {
        // Autoplay blocked (often iOS without a gesture) or TTS unavailable.
        setLoadingAudio(false)
        setPlaying(false)
        setAudioFailed(true)
      }
    },
    [card.term]
  )

  // Auto-play once when the card appears. Kept separate from play() so the first
  // statement is an await (no setState synchronously in the effect body), and so
  // a card change cancels an in-flight play.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!card.term) return
      try {
        const url = await getCachedAudioUrl(card.term)
        if (cancelled) return
        const audio = new Audio(url)
        audio.onended = () => setPlaying(false)
        setPlaying(true)
        await audio.play()
      } catch {
        if (!cancelled) setAudioFailed(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [card.term])

  const grade = useCallback(
    (rating: ReviewRating) => {
      setRevealed(false)
      onGrade(rating)
    },
    [onGrade]
  )

  // Keys: R replays, Space/Enter reveals, then 1-4 grade.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key.toLowerCase() === "r") {
        e.preventDefault()
        void play()
      } else if (!revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault()
        setRevealed(true)
      } else if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
        grade(RATINGS[Number(e.key) - 1])
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [revealed, grade, play])

  return (
    <div className="flex flex-col gap-6">
      {/* Audio stage */}
      <div className="flex h-80 flex-col items-center justify-center gap-6 rounded-3xl border-2 border-b-[6px] border-border bg-card p-6 text-center dark:bg-slate-900/60 sm:h-96 sm:rounded-3xl sm:p-8">
        <span className="rounded-full bg-accent/40 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground/50">
          Listen &amp; Recall
        </span>

        {/* Big play button */}
        <button
          type="button"
          onClick={() => void play()}
          disabled={loadingAudio}
          aria-label="Play audio"
          className={cn(
            "flex h-28 w-28 items-center justify-center rounded-3xl border-b-4 text-white transition-all active:translate-y-[3px] active:border-b-0 disabled:opacity-60 sm:h-32 sm:w-32",
            "border-[#1499e0] bg-[#1cb0f6] shadow-lg shadow-[#1cb0f6]/30"
          )}
        >
          {loadingAudio ? (
            <Loader2 size={44} className="animate-spin" strokeWidth={2.5} />
          ) : (
            <Volume2
              size={48}
              strokeWidth={2.5}
              className={playing ? "animate-pulse" : ""}
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => void play(0.7)}
          className="flex items-center gap-2 rounded-full border-2 border-b-4 border-border bg-accent/5 px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground/70 transition-all active:translate-y-[2px] active:border-b-2 hover:text-foreground"
        >
          <Gauge size={13} strokeWidth={3} /> Slow
        </button>

        {audioFailed && (
          <p className="text-xs font-bold text-muted-foreground/50">
            Tap the speaker to play the audio.
          </p>
        )}
      </div>

      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl border-2 border-b-4 border-border bg-card text-sm font-bold uppercase tracking-wide text-foreground transition-all active:translate-y-[3px] active:border-b-0"
        >
          <Eye size={18} strokeWidth={2.5} /> Show Answer
        </button>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Answer reveal */}
          <div className="rounded-2xl border-2 border-[#58cc02]/40 bg-[#58cc02]/[0.06] p-5 text-center dark:bg-[#58cc02]/[0.08]">
            <p className="w-full break-keep text-4xl font-bold leading-tight tracking-tight text-foreground [overflow-wrap:anywhere] sm:text-6xl">
              {card.term}
            </p>
            <Pronunciation text={card.pronunciation} className="mt-2 text-lg sm:text-2xl" />
            <p className="mt-3 break-keep text-xl font-bold text-muted-foreground [overflow-wrap:anywhere] sm:text-2xl">
              {card.meaning}
            </p>
            {card.example && (
              <p className="mx-auto mt-4 max-w-sm rounded-2xl border-2 border-[#58cc02]/20 bg-card/80 p-3 text-sm font-bold leading-relaxed text-muted-foreground">
                {card.example}
              </p>
            )}
          </div>

          <GradeButtons card={card} onGrade={grade} />
        </motion.div>
      )}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export function ReviewSession({ dueToday, allWords, loading, onRate }: ReviewSessionProps) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [mode, setMode] = useState<Mode>("flashcard")
  const [reversed, setReversed] = useState(false)
  // Empty set reviews the whole deck; otherwise restricts the session (and
  // the quiz-mode distractor pool) to the chosen vocab categories.
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const toggleCategory = useCallback((cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) {
        next.delete(cat)
      } else {
        next.add(cat)
      }
      return next
    })
  }, [])
  const [queue, setQueue] = useState<VocabItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lapsedIds, setLapsedIds] = useState<Set<string>>(new Set())
  const [knewCount, setKnewCount] = useState(0)
  // Consecutive correct answers this session (Quiz/Recall) — drives the
  // escalating correct-answer reaction. Resets on a wrong answer.
  const [streak, setStreak] = useState(0)
  // Longest streak reached this session — surfaced on the results screen.
  const [bestStreak, setBestStreak] = useState(0)
  // All-time best (persisted) and whether this session beat it.
  const [allTimeBest, setAllTimeBest] = useState(0)
  const [isNewRecord, setIsNewRecord] = useState(false)
  const registerResult = useCallback((correct: boolean) => {
    setStreak((s) => {
      const next = correct ? s + 1 : 0
      setBestStreak((b) => (next > b ? next : b))
      return next
    })
  }, [])

  // On session end, reconcile this session's best with the stored all-time best
  // (read fresh from storage so a record set in another tab still counts).
  useEffect(() => {
    if (phase !== "done") return
    const stored = readBestStreak()
    if (bestStreak > stored) {
      writeBestStreak(bestStreak)
      setAllTimeBest(bestStreak)
      setIsNewRecord(true)
    } else {
      setAllTimeBest(stored)
      setIsNewRecord(false)
    }
  }, [phase, bestStreak])

  // Distinct categories across the whole deck, for the picker — derived at
  // runtime since vocab categories are free-form strings, not a fixed enum.
  const categories = useMemo(
    () => Array.from(new Set(allWords.map((w) => w.category).filter(Boolean))).sort(),
    [allWords]
  )

  const filteredAllWords = useMemo(
    () =>
      selectedCategories.size === 0
        ? allWords
        : allWords.filter((w) => selectedCategories.has(w.category)),
    [allWords, selectedCategories]
  )
  const filteredDueToday = useMemo(
    () =>
      selectedCategories.size === 0
        ? dueToday
        : dueToday.filter((w) => selectedCategories.has(w.category)),
    [dueToday, selectedCategories]
  )

  const canUseChoice = filteredAllWords.length >= 4

  // Lock the page behind the full-screen review so only the session scrolls.
  useEffect(() => {
    if (phase !== "quiz") return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [phase])

  function startQuiz() {
    const deck = filteredDueToday.length > 0 ? filteredDueToday : filteredAllWords
    setQueue(shuffle(deck))
    setCurrentIndex(0)
    setLapsedIds(new Set())
    setKnewCount(0)
    setStreak(0)
    setBestStreak(0)
    setPendingSaves(0)
    setSaveError(false)
    setPhase("quiz")
  }

  // Live sync status for the session header: how many ratings are in flight and
  // whether the last one failed to persist.
  const [pendingSaves, setPendingSaves] = useState(0)
  const [saveError, setSaveError] = useState(false)

  // Persist a rating with one retry. Grading stays optimistic (UI advances
  // immediately), but a failed save is retried once and then surfaced — so a
  // dropped review can't silently fail to sync to the user's other devices.
  const rateWithRetry = useCallback(
    async (id: string, rating: ReviewRating) => {
      setPendingSaves((p) => p + 1)
      try {
        try {
          await onRate(id, rating)
        } catch {
          await onRate(id, rating) // retry once
        }
        setSaveError(false)
      } catch {
        setSaveError(true)
        toast.error("Couldn't save that review", {
          description: "Check your connection — it may not have synced to your other devices.",
        })
      } finally {
        setPendingSaves((p) => Math.max(0, p - 1))
      }
    },
    [onRate]
  )

  const handleGrade = useCallback(
    (rating: ReviewRating) => {
      const card = queue[currentIndex]
      if (!card) return
      // Optimistic: advance instantly; rateWithRetry persists + surfaces failures.
      void rateWithRetry(card.id, rating)

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

      setKnewCount((c) => c + 1)

      if (currentIndex + 1 >= queue.length) {
        setPhase("done")
      } else {
        setCurrentIndex((i) => i + 1)
      }
    },
    [queue, currentIndex, rateWithRetry]
  )

  const total = queue.length

  // ── idle ──────────────────────────────────────────────────────────────────
  if (phase === "idle") {
    const deckSize = filteredDueToday.length > 0 ? filteredDueToday.length : filteredAllWords.length
    // A "due review" session (words the SRS scheduled for today) vs. a free
    // "practice the whole deck" session when nothing is due — kept distinct so
    // the full-deck fallback never reads as the due count resetting.
    const isDueSession = filteredDueToday.length > 0
    const caughtUp = !isDueSession && filteredAllWords.length > 0
    return (
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl dark:bg-slate-900/40 dark:backdrop-blur-md sm:rounded-3xl">
        {/* Top Header */}
        <div className="bg-emerald-500/[0.03] px-5 py-7 text-center border-b border-border/60 sm:px-8 sm:py-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
            <BrainCircuit size={32} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Memory Lab</h2>
          <p className="mt-2 text-sm font-medium text-muted-foreground/60">
            {isDueSession
              ? `${filteredDueToday.length} ${filteredDueToday.length === 1 ? "word" : "words"} due for review`
              : caughtUp
                ? "You're all caught up — practice your full deck anytime"
                : "Add words to start building your deck"}
          </p>
        </div>

        <div className="flex flex-col gap-6 p-5 sm:p-8">
          {/* Category Selector — multi-select; restricts the session (and quiz
              distractor pool) to the chosen categories, or the whole deck if none are picked */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 px-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground/40">
                <Layers3 size={12} strokeWidth={3} />
                Categories
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedCategories(new Set())}
                  className={cn(
                    "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide transition-all active:scale-95",
                    selectedCategories.size === 0
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-border bg-card text-muted-foreground/60 hover:text-foreground dark:bg-slate-900/40"
                  )}
                >
                  All Categories
                </button>
                {categories.map((cat) => {
                  const selected = selectedCategories.has(cat)
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      aria-pressed={selected}
                      className={cn(
                        "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide transition-all active:scale-95",
                        selected
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-border bg-card text-muted-foreground/60 hover:text-foreground dark:bg-slate-900/40"
                      )}
                    >
                      {selected && <CheckCircle2 size={12} strokeWidth={3} />}
                      {cat}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Deck Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl border border-border bg-accent/5 p-5 text-center">
              <p className="text-3xl font-bold text-emerald-600">{filteredDueToday.length}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground/40">Due Now</p>
            </div>
            <div className="rounded-3xl border border-border bg-accent/5 p-5 text-center">
              <p className="text-3xl font-bold text-foreground">{filteredAllWords.length}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground/40">Total Deck</p>
            </div>
          </div>

          {/* Mode Selector - iOS style */}
          <div className="flex gap-1 rounded-2xl bg-accent/10 p-1">
            {(["flashcard", ...(canUseChoice ? (["choice"] as Mode[]) : []), "recall", "listening"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1 rounded-[0.9rem] py-3 text-xs font-bold uppercase tracking-wide transition-all",
                  mode === m
                    ? "bg-card text-emerald-600 shadow-sm shadow-emerald-500/10 ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "listening" && <Headphones size={13} strokeWidth={3} />}
                {m === "flashcard" ? "Cards" : m === "choice" ? "Quiz" : m === "recall" ? "Recall" : "Listen"}
              </button>
            ))}
          </div>

          {/* Direction toggle for flashcards */}
          {mode === "flashcard" && (
            <button
              type="button"
              onClick={() => setReversed((r) => !r)}
              className="mx-auto -mt-2 flex items-center gap-2 rounded-full border border-border bg-accent/5 px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground transition-all hover:bg-accent/20 hover:text-foreground active:scale-95"
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
            className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 text-base font-bold uppercase tracking-wide text-white shadow-xl shadow-emerald-600/30 transition-all hover:bg-emerald-500 hover:scale-[1.02] active:scale-95 disabled:opacity-40"
          >
            <Sparkles size={20} strokeWidth={2.5} />
            {loading
              ? "Loading..."
              : deckSize === 0
                ? "No words yet"
                : isDueSession
                  ? `Review ${filteredDueToday.length} due`
                  : "Practice all words"}
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
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl dark:bg-slate-900/40 sm:rounded-3xl">
        <div className="flex flex-col items-center gap-8 px-5 py-10 text-center sm:px-8 sm:py-16">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-600 shadow-inner ring-1 ring-emerald-500/20">
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
            <h2 className="text-4xl font-bold tracking-tight text-foreground">{headline}</h2>
            <p className="mt-3 text-[15px] font-medium text-muted-foreground/60 leading-relaxed">
              You knew <span className="text-emerald-600 font-bold">{knew}</span> of <span className="text-foreground font-bold">{total}</span> words on the first try.
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

          {/* Best streak — only meaningful for the test modes that score answers */}
          {(mode === "choice" || mode === "recall") && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: isNewRecord ? 0.9 : 1 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3, type: isNewRecord ? "spring" : "tween", stiffness: 400, damping: 16 }}
              className={cn(
                "flex items-center gap-2.5 rounded-2xl border px-5 py-3 text-sm font-semibold",
                isNewRecord && bestStreak > 0
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-orange-500/20 bg-orange-500/5 text-orange-600 dark:text-orange-400"
              )}
            >
              <Flame size={18} strokeWidth={2.5} />
              {isNewRecord && bestStreak > 0
                ? `New personal best! 🎉 ${bestStreak} in a row`
                : bestStreak > 0
                  ? `Best this session: ${bestStreak} · All-time: ${allTimeBest}`
                  : allTimeBest > 0
                    ? `No streak this time — your record is ${allTimeBest}`
                    : "No streak yet — chain correct answers next time!"}
            </motion.div>
          )}

          <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={startQuiz}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-background py-4 text-xs font-bold uppercase tracking-wide text-foreground transition-all hover:bg-accent active:scale-95"
            >
              <RotateCcw size={16} strokeWidth={3} />
              Re-run
            </button>
            <button
              type="button"
              onClick={() => setPhase("idle")}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-xs font-bold uppercase tracking-wide text-white shadow-xl shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-95"
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
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Session Progress Header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-accent/5 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:py-5">
        <button
          onClick={() => setPhase("idle")}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground/40 hover:bg-accent/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <span className="text-[13px] font-bold uppercase tracking-wide text-foreground">
            {currentIndex + 1} <span className="opacity-20 mx-1">/</span> {total}
          </span>
          {/* Sync status — reassures the user reviews are persisting (and warns if not) */}
          {(saveError || pendingSaves > 0 || knewCount + lapsedIds.size > 0) && (
            <span
              className={cn(
                "flex items-center gap-1 text-[11px] font-medium",
                saveError
                  ? "text-red-500"
                  : pendingSaves > 0
                    ? "text-muted-foreground/60"
                    : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {saveError ? (
                <>
                  <XCircle size={12} strokeWidth={3} /> Not saved
                </>
              ) : pendingSaves > 0 ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <CheckCircle2 size={12} strokeWidth={3} /> Synced
                </>
              )}
            </span>
          )}
        </div>
        {/* Live tally: remembered vs. relearning */}
        <div className="flex items-center gap-2.5 text-xs font-bold tabular-nums">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={13} strokeWidth={3} />
            {knewCount}
          </span>
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <RotateCcw size={13} strokeWidth={3} />
            {lapsedIds.size}
          </span>
        </div>
      </div>

      {/* Smooth Progress Indicator */}
      <div className="h-1 w-full bg-accent/10">
        <motion.div
          animate={{ width: `${(currentIndex / total) * 100}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-emerald-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={card.id + currentIndex}
            initial={{ opacity: 0, scale: 0.98, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.98, x: -10 }}
            transition={{ duration: 0.3 }}
          >
            {mode === "listening" ? (
              <ListeningCard card={card} onGrade={handleGrade} />
            ) : mode === "recall" ? (
              <RecallCard
                card={card}
                streak={streak}
                onResult={registerResult}
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
                allWords={filteredAllWords}
                streak={streak}
                onResult={registerResult}
                onKnew={() => handleGrade("GOOD")}
                onLearning={() => handleGrade("AGAIN")}
              />
            )}
          </motion.div>
        </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
