"use client"

import { useEffect, useRef, useState } from "react"
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Gauge,
  Headphones,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react"
import { motion } from "motion/react"

import { PageHero } from "@/components/app/page-hero"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { listeningApi, ttsApi, getApiErrorMessage } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { ListeningAttemptResult, ListeningLesson } from "@/lib/types"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
} as const

const FALLBACK_TOPICS = ["Daily Standup", "Code Review", "Team Meeting", "Bug Discussion", "Deployment"]

export default function ListeningPage() {
  const [topics, setTopics] = useState<string[]>(FALLBACK_TOPICS)
  const [topic, setTopic] = useState<string>(FALLBACK_TOPICS[0])
  const [lesson, setLesson] = useState<ListeningLesson | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [showTranscript, setShowTranscript] = useState(false)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [result, setResult] = useState<ListeningAttemptResult | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Audio playback
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)

  useEffect(() => {
    listeningApi
      .getTopics()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTopics(data)
          setTopic(data[0])
        }
      })
      .catch(() => {
        /* keep fallback */
      })
  }, [])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  function resetLessonState() {
    audioRef.current?.pause()
    audioRef.current = null
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setPlaying(false)
    setShowTranscript(false)
    setAnswers({})
    setResult(null)
  }

  async function handleGenerate() {
    setLoading(true)
    setError("")
    resetLessonState()
    try {
      const data = await listeningApi.generate(topic)
      setLesson(data)
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not generate a listening lesson. Please try again."))
    } finally {
      setLoading(false)
    }
  }

  async function ensureAudio(): Promise<HTMLAudioElement | null> {
    if (audioRef.current) return audioRef.current
    if (!lesson) return null
    setAudioLoading(true)
    try {
      const script = lesson.lines.map((l) => l.korean).join(" ")
      const url = await ttsApi.speak(script)
      const audio = new Audio(url)
      audio.onended = () => setPlaying(false)
      audioRef.current = audio
      setAudioUrl(url)
      return audio
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load audio."))
      return null
    } finally {
      setAudioLoading(false)
    }
  }

  async function handlePlay(targetRate: number) {
    const audio = await ensureAudio()
    if (!audio) return
    audio.playbackRate = targetRate
    setRate(targetRate)
    audio.play()
    setPlaying(true)
  }

  function handlePauseToggle() {
    const audio = audioRef.current
    if (!audio) {
      handlePlay(rate)
      return
    }
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play()
      setPlaying(true)
    }
  }

  async function handleSubmit() {
    if (!lesson) return
    setSubmitting(true)
    try {
      const ordered = lesson.quiz.map((_, i) => (answers[i] ?? -1))
      const res = await listeningApi.submitAttempt(lesson.id, ordered)
      setResult(res)
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not submit your answers."))
    } finally {
      setSubmitting(false)
    }
  }

  const allAnswered = lesson ? lesson.quiz.every((_, i) => answers[i] !== undefined) : false

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-12"
    >
      <motion.div variants={itemVariants}>
        <PageHero
          eyebrow="Listening"
          title="Listening Practice"
          description="Generate realistic Korean workplace conversations, listen at normal or slow speed, reveal the transcript, then test your comprehension with a quiz."
          stats={[
            { label: "Audio", value: "Normal + Slow" },
            { label: "Format", value: "Convo + Quiz" },
            { label: "Topics", value: `${topics.length}` },
          ]}
        />
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="rounded-[2rem] border border-border bg-card p-6 shadow-sm dark:bg-slate-900/40"
      >
        <label className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          Topic
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          {topics.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTopic(t)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-bold transition-all active:scale-95",
                topic === t
                  ? "border-emerald-500/40 bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="h-11 rounded-xl bg-emerald-600 px-6 text-sm font-black text-white hover:bg-emerald-500 active:scale-95"
          >
            <Sparkles size={16} className="mr-2" strokeWidth={2.5} />
            {loading ? "Generating..." : lesson ? "New Lesson" : "Generate Lesson"}
          </Button>
        </div>
      </motion.div>

      {error && (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-bold text-destructive"
        >
          {error}
        </motion.div>
      )}

      {loading && (
        <motion.div variants={itemVariants} className="rounded-[2rem] border border-border bg-card p-7 dark:bg-slate-900/40">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="mt-4 h-16 w-full rounded-2xl" />
          <Skeleton className="mt-3 h-24 w-full rounded-2xl" />
        </motion.div>
      )}

      {lesson && !loading && (
        <>
          {/* Player */}
          <motion.div
            variants={itemVariants}
            className="rounded-[2rem] border border-border bg-card p-6 shadow-sm dark:bg-slate-900/40"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Headphones size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600/70 dark:text-emerald-400/70">
                    {lesson.topic}
                  </p>
                  <h3 className="text-base font-extrabold text-foreground">{lesson.title}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={handlePauseToggle}
                  disabled={audioLoading}
                  className="h-10 w-10 rounded-full bg-emerald-600 p-0 text-white hover:bg-emerald-500 active:scale-95"
                  title={playing ? "Pause" : "Play"}
                >
                  {audioLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : playing ? (
                    <Pause size={18} />
                  ) : (
                    <Play size={18} />
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => handlePlay(1)}
                  className={cn(
                    "h-10 rounded-xl px-4 text-xs font-black active:scale-95",
                    rate === 1
                      ? "bg-foreground text-background"
                      : "border border-border bg-background text-foreground hover:bg-accent"
                  )}
                >
                  Normal
                </Button>
                <Button
                  type="button"
                  onClick={() => handlePlay(0.65)}
                  className={cn(
                    "h-10 rounded-xl px-4 text-xs font-black active:scale-95",
                    rate === 0.65
                      ? "bg-foreground text-background"
                      : "border border-border bg-background text-foreground hover:bg-accent"
                  )}
                >
                  <Gauge size={14} className="mr-1.5" /> Slow
                </Button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowTranscript((v) => !v)}
              className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400"
            >
              {showTranscript ? <EyeOff size={14} /> : <Eye size={14} />}
              {showTranscript ? "Hide transcript" : "Show transcript"}
            </button>

            {showTranscript && (
              <div className="mt-4 space-y-3">
                {lesson.lines.map((line, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-background/60 px-4 py-3 dark:bg-white/4">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70">
                      {line.speaker}
                    </p>
                    <p className="mt-1 font-bold text-foreground">{line.korean}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{line.english}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Quiz */}
          {lesson.quiz.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-4">
              <p className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Comprehension quiz
              </p>
              {lesson.quiz.map((q, qi) => {
                const chosen = answers[qi]
                const revealed = result !== null
                return (
                  <div
                    key={qi}
                    className="rounded-2xl border border-border bg-card p-5 dark:bg-slate-900/40"
                  >
                    <p className="font-bold text-foreground">
                      {qi + 1}. {q.question}
                    </p>
                    <div className="mt-3 space-y-2">
                      {q.options.map((opt, oi) => {
                        const isChosen = chosen === oi
                        const isCorrect = revealed && oi === q.answerIndex
                        const isWrongChoice = revealed && isChosen && oi !== q.answerIndex
                        return (
                          <button
                            key={oi}
                            type="button"
                            disabled={revealed}
                            onClick={() => setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                            className={cn(
                              "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all",
                              isCorrect && "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                              isWrongChoice && "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300",
                              !revealed && isChosen && "border-emerald-500/50 bg-emerald-500/5 text-foreground",
                              !revealed && !isChosen && "border-border bg-background text-foreground hover:bg-accent",
                              revealed && !isCorrect && !isWrongChoice && "border-border bg-background text-muted-foreground"
                            )}
                          >
                            <span>{opt}</span>
                            {isCorrect && <CheckCircle2 size={16} className="shrink-0" />}
                            {isWrongChoice && <XCircle size={16} className="shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                    {revealed && q.explanation && (
                      <p className="mt-3 rounded-xl bg-sky-50/60 px-4 py-2.5 text-sm leading-6 text-sky-800 dark:bg-sky-400/6 dark:text-sky-200">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                )
              })}

              {!result ? (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!allAnswered || submitting}
                    className="h-11 rounded-xl bg-emerald-600 px-6 text-sm font-black text-white hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? "Scoring..." : "Submit answers"}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-emerald-500/20 bg-emerald-500/5 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                      <CheckCircle2 size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                        {result.score} / {result.total} correct · {result.accuracy}%
                      </p>
                      <p className="text-xs font-medium text-muted-foreground">Saved to your progress.</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      setAnswers({})
                      setResult(null)
                    }}
                    className="h-10 rounded-xl border border-border bg-background px-5 text-xs font-black text-foreground hover:bg-accent active:scale-95"
                  >
                    <RotateCcw size={14} className="mr-2" /> Try again
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </>
      )}

      {!lesson && !loading && !error && (
        <motion.div
          variants={itemVariants}
          className="rounded-[2rem] border border-dashed border-border bg-card/40 p-10 text-center"
        >
          <Headphones size={32} className="mx-auto text-muted-foreground/50" strokeWidth={2} />
          <p className="mt-3 text-sm font-bold text-foreground">No lesson yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a topic above and generate your first listening lesson.
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}