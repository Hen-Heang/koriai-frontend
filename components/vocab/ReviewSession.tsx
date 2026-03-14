"use client"

import { useState, useMemo, useCallback } from "react"
import {
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { chatApi } from "@/lib/api"
import type { VocabItem } from "@/lib/types"

// ─── helpers ──────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function getChoices(correct: VocabItem, pool: VocabItem[]): VocabItem[] {
  const distractors = shuffle(pool.filter((w) => w.id !== correct.id)).slice(0, 3)
  return shuffle([correct, ...distractors])
}

// ─── types ────────────────────────────────────────────────────────────────────
type Mode = "flashcard" | "choice"
type Phase = "idle" | "quiz" | "done"

type ReviewSessionProps = {
  dueToday: VocabItem[]
  allWords: VocabItem[]
  loading?: boolean
  onReview: (id: string) => void | Promise<void>
}

// ─── Flashcard face ───────────────────────────────────────────────────────────
function FlashCard({
  card,
  onKnew,
  onLearning,
}: {
  card: VocabItem
  onKnew: () => void | Promise<void>
  onLearning: () => void
}) {
  const [flipped, setFlipped] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const [loadingHint, setLoadingHint] = useState(false)

  async function fetchHint() {
    if (hint || loadingHint) return
    setLoadingHint(true)
    try {
      const conv = await chatApi.createConversation("Vocab Hint", "FREE_CHAT")
      const res = await chatApi.sendMessage(
        conv.id,
        `Give me one short, natural Korean sentence using the word "${card.term}" (${card.meaning}). Reply with only the sentence and its English translation, nothing else. Format: Korean sentence / English translation`
      )
      setHint(res.assistantReply)
    } catch {
      setHint("Could not load hint. Please try again.")
    } finally {
      setLoadingHint(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Card */}
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className={cn(
          "group relative w-full cursor-pointer rounded-[1.5rem] border text-left transition-all duration-200",
          flipped
            ? "border-violet-500/30 bg-violet-950/40"
            : "border-slate-700 bg-slate-900/60 hover:border-slate-600"
        )}
      >
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          {!flipped ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-slate-500">
                Korean
              </span>
              <p className="text-4xl font-bold tracking-tight text-white">{card.term}</p>
              <span className="mt-2 text-xs text-slate-500">tap to reveal meaning</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-violet-400">
                  Meaning
                </span>
                <p className="text-2xl font-semibold text-white">{card.meaning}</p>
              </div>
              {card.example ? (
                <div className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-300">
                  {card.example}
                </div>
              ) : null}
              {card.tags.length ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {card.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </button>

      {/* AI Hint */}
      {flipped && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          {hint ? (
            <p className="text-sm leading-6 text-amber-200/90">{hint}</p>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto gap-2 px-0 text-xs text-amber-400 hover:bg-transparent hover:text-amber-300"
              onClick={fetchHint}
              disabled={loadingHint}
            >
              <Lightbulb size={13} />
              {loadingHint ? "Generating AI example…" : "Get AI example sentence"}
            </Button>
          )}
        </div>
      )}

      {/* Grade buttons — only visible after flip */}
      {flipped && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-12 gap-2 rounded-2xl border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
            onClick={() => { setFlipped(false); setHint(null); onLearning() }}
          >
            <XCircle size={16} />
            Still learning
          </Button>
          <Button
            className="h-12 gap-2 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-500"
            onClick={() => { setFlipped(false); setHint(null); onKnew() }}
          >
            <CheckCircle2 size={16} />
            I knew it!
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Multiple choice card ─────────────────────────────────────────────────────
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

  function next() {
    if (selected === card.id) onKnew()
    else onLearning()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Prompt */}
      <div className="flex flex-col items-center gap-2 rounded-[1.5rem] border border-slate-700 bg-slate-900/60 px-6 py-8 text-center">
        <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-slate-500">
          What does this mean?
        </span>
        <p className="text-4xl font-bold tracking-tight text-white">{card.term}</p>
      </div>

      {/* Choices */}
      <div className="grid gap-2.5">
        {choices.map((choice) => {
          const isCorrect = choice.id === card.id
          const isSelected = choice.id === selected
          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => pick(choice.id)}
              disabled={answered}
              className={cn(
                "w-full rounded-2xl border px-5 py-3.5 text-left text-sm font-medium transition-all",
                !answered
                  ? "border-slate-700 bg-slate-800/60 text-slate-200 hover:border-slate-500 hover:bg-slate-800"
                  : isCorrect
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                  : isSelected
                  ? "border-red-500/50 bg-red-500/15 text-red-300"
                  : "border-slate-800 bg-slate-900/40 text-slate-500"
              )}
            >
              {choice.meaning}
            </button>
          )
        })}
      </div>

      {/* Feedback + next */}
      {answered && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3">
          <p className="text-sm font-medium">
            {selected === card.id ? (
              <span className="text-emerald-400">Correct!</span>
            ) : (
              <span className="text-red-400">Not quite — the answer was <strong className="text-slate-200">{card.meaning}</strong></span>
            )}
          </p>
          <Button size="sm" className="gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500" onClick={next}>
            Next <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ReviewSession({ dueToday, allWords, loading, onReview }: ReviewSessionProps) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [mode, setMode] = useState<Mode>("flashcard")
  const [queue, setQueue] = useState<VocabItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [stats, setStats] = useState({ knew: 0, learning: 0 })

  const canUseChoice = allWords.length >= 4

  function startQuiz() {
    const deck = dueToday.length > 0 ? dueToday : allWords
    setQueue(shuffle(deck))
    setCurrentIndex(0)
    setStats({ knew: 0, learning: 0 })
    setPhase("quiz")
  }

  const handleKnew = useCallback(async () => {
    const card = queue[currentIndex]
    setStats((s) => ({ ...s, knew: s.knew + 1 }))
    try { await onReview(card.id) } catch { /* ignore */ }
    if (currentIndex + 1 >= queue.length) {
      setPhase("done")
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }, [queue, currentIndex, onReview])

  const handleLearning = useCallback(() => {
    setStats((s) => ({ ...s, learning: s.learning + 1 }))
    // Push card to end of queue for another attempt
    setQueue((q) => {
      const next = [...q]
      const card = next.splice(currentIndex, 1)[0]
      next.push(card)
      return next
    })
    if (currentIndex >= queue.length - 1) {
      setCurrentIndex(0)
    }
  }, [queue, currentIndex])

  const total = queue.length

  // ── idle ──
  if (phase === "idle") {
    const deckSize = dueToday.length > 0 ? dueToday.length : allWords.length
    return (
      <div className="flex flex-col gap-5 rounded-[2rem] border border-slate-800 bg-[linear-gradient(180deg,#070b18,#040814)] p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/15">
            <BrainCircuit size={20} className="text-violet-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Quiz Mode</p>
            <p className="text-xs text-slate-400">
              {dueToday.length > 0
                ? `${dueToday.length} card${dueToday.length !== 1 ? "s" : ""} due today`
                : allWords.length > 0
                ? `${allWords.length} saved words`
                : "No words saved yet"}
            </p>
          </div>
        </div>

        {/* Mode selector */}
        {canUseChoice && (
          <div className="flex gap-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-1.5">
            {(["flashcard", "choice"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 rounded-xl py-2 text-sm font-medium transition-all",
                  mode === m
                    ? "bg-violet-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                {m === "flashcard" ? "Flashcard" : "Multiple Choice"}
              </button>
            ))}
          </div>
        )}

        <Button
          className="h-12 gap-2 rounded-2xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40"
          disabled={loading || deckSize === 0}
          onClick={startQuiz}
        >
          <Sparkles size={15} />
          {loading ? "Loading…" : deckSize === 0 ? "No words to review" : "Start Quiz"}
        </Button>

        {!loading && allWords.length === 0 && (
          <p className="text-center text-xs text-slate-500">
            Save words from your chat sessions to build your deck.
          </p>
        )}
      </div>
    )
  }

  // ── done ──
  if (phase === "done") {
    const pct = total > 0 ? Math.round((stats.knew / total) * 100) : 0
    return (
      <div className="flex flex-col items-center gap-5 rounded-[2rem] border border-slate-800 bg-[linear-gradient(180deg,#070b18,#040814)] px-6 py-10 text-center">
        <div className="text-4xl">{pct >= 80 ? "🎉" : pct >= 50 ? "💪" : "📚"}</div>
        <div>
          <p className="text-xl font-bold text-white">
            {pct >= 80 ? "Great session!" : pct >= 50 ? "Good effort!" : "Keep practicing!"}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            You knew <strong className="text-emerald-400">{stats.knew}</strong> of{" "}
            <strong className="text-white">{total}</strong> cards
          </p>
        </div>
        <div className="w-full rounded-full bg-slate-800 h-2">
          <div
            className="h-2 rounded-full bg-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex w-full gap-3">
          <Button
            variant="outline"
            className="flex-1 gap-2 rounded-2xl border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800"
            onClick={startQuiz}
          >
            <RotateCcw size={14} />
            Try again
          </Button>
          <Button
            className="flex-1 gap-2 rounded-2xl bg-violet-600 hover:bg-violet-500"
            onClick={() => setPhase("idle")}
          >
            <BookOpenCheck size={14} />
            Done
          </Button>
        </div>
      </div>
    )
  }

  // ── quiz ──
  const card = queue[currentIndex]
  if (!card) return null

  return (
    <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-800 bg-[linear-gradient(180deg,#070b18,#040814)] p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500">
          Card {Math.min(currentIndex + 1, total)} of {total}
        </span>
        <span className="text-xs font-medium text-emerald-400">{stats.knew} correct</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-violet-600 transition-all duration-500"
          style={{ width: `${((currentIndex) / total) * 100}%` }}
        />
      </div>

      {/* Card */}
      {mode === "flashcard" || !canUseChoice ? (
        <FlashCard
          key={card.id + currentIndex}
          card={card}
          onKnew={handleKnew}
          onLearning={handleLearning}
        />
      ) : (
        <ChoiceCard
          key={card.id + currentIndex}
          card={card}
          allWords={allWords}
          onKnew={handleKnew}
          onLearning={handleLearning}
        />
      )}
    </div>
  )
}
