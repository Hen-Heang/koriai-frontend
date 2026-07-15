"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  Info,
  Loader2,
  Mic,
  RotateCcw,
  Send,
} from "lucide-react"
import { motion } from "motion/react"

import { PageHero } from "@/components/app/page-hero"
import { DrillAnswerBox } from "@/components/interview/DrillAnswerBox"
import { SpeakingScoreCard } from "@/components/interview/SpeakingScoreCard"
import { SpeakButton, getCachedAudioUrl } from "@/components/ui/SpeakButton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { useLogActivity } from "@/hooks/useLogActivity"
import { useSessionTimer } from "@/hooks/useSessionTimer"
import { getApiErrorMessage, interviewApi } from "@/lib/api"
import type { SpeakingCheckResponse } from "@/lib/api/interview"
import {
  averageSpeakingScores,
  buildDrillQueue,
  DRILL_SIZE,
  pickStyleExamples,
  replaceUnseenTail,
  SPEAKING_SCORE_KEYS,
  SPEAKING_SCORE_LABELS,
  type DrillQuestion,
  type SpeakingScores,
} from "@/lib/interview-drills"
import { cn } from "@/lib/utils"

const LAST_SESSION_KEY = "kori.drill.speaking.last"

interface DrillResult {
  question: DrillQuestion
  answer: string
  result: SpeakingCheckResponse
}

interface LastSession {
  finishedAt: string
  answered: number
  averages: SpeakingScores | null
}

function loadLastSession(): LastSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(LAST_SESSION_KEY)
    return raw ? (JSON.parse(raw) as LastSession) : null
  } catch {
    return null
  }
}

// Auto-speak through the shared session cache (SpeakButton owns the URLs, so
// nothing to revoke). Autoplay failures are silent — the SpeakButton remains.
async function autoSpeak(text: string) {
  if (!text) return
  try {
    const url = await getCachedAudioUrl(text)
    await new Audio(url).play()
  } catch {
    // Blocked autoplay or TTS down — manual playback still works.
  }
}

export default function SpeakingDrillPage() {
  const { logActivity } = useLogActivity("interview")
  useSessionTimer("interview")

  const [phase, setPhase] = useState<"intro" | "drill" | "summary">("intro")
  const [queue, setQueue] = useState<DrillQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<DrillResult[]>([])
  const [current, setCurrent] = useState<SpeakingCheckResponse | null>(null)
  const [isScoring, setIsScoring] = useState(false)
  const [error, setError] = useState("")
  const [lastSession, setLastSession] = useState<LastSession | null>(null)

  const speech = useSpeechRecognition({ lang: "ko-KR" })
  // Mirrors `index` so the background AI splice never clobbers a shown question.
  const indexRef = useRef(0)
  indexRef.current = index

  useEffect(() => {
    setLastSession(loadLastSession())
  }, [])

  const question = queue[index]

  function startDrill() {
    const staticQueue = buildDrillQueue()
    setQueue(staticQueue)
    setIndex(0)
    setResults([])
    setCurrent(null)
    setError("")
    speech.reset()
    setPhase("drill")
    void autoSpeak(staticQueue[0]?.ko ?? "")

    // Fresh AI questions replace whatever hasn't been shown yet; failure is
    // silent — the static queue is a complete drill on its own.
    interviewApi
      .drillQuestions({
        kind: "speaking",
        count: DRILL_SIZE,
        complexityHint: "natural interview phrasing",
        styleExamples: pickStyleExamples(),
        avoid: staticQueue.map((q) => q.ko),
      })
      .then(({ questions }) => {
        if (questions.length === 0) return
        setQueue((prev) =>
          replaceUnseenTail(
            prev,
            questions.map((q) => ({ ko: q.ko, en: q.en })),
            indexRef.current + 1
          )
        )
      })
      .catch(() => {})
  }

  async function submitAnswer() {
    const answer = speech.transcript.trim()
    if (!answer || !question || isScoring) return
    setError("")
    setIsScoring(true)
    speech.stop()
    try {
      const result = await interviewApi.speakingCheck({ question: question.ko, answer })
      setCurrent(result)
      setResults((prev) => [...prev, { question, answer, result }])
      void logActivity()
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not score your answer. Try again."))
    } finally {
      setIsScoring(false)
    }
  }

  function nextQuestion() {
    speech.reset()
    setCurrent(null)
    setError("")
    if (index + 1 >= queue.length) {
      finishDrill()
      return
    }
    const nextIdx = index + 1
    setIndex(nextIdx)
    void autoSpeak(queue[nextIdx]?.ko ?? "")
  }

  function finishDrill() {
    const summary: LastSession = {
      finishedAt: new Date().toISOString(),
      answered: results.length,
      averages: averageSpeakingScores(results.map((r) => r.result.scores)),
    }
    try {
      window.localStorage.setItem(LAST_SESSION_KEY, JSON.stringify(summary))
    } catch {
      // ignore
    }
    setLastSession(summary)
    setPhase("summary")
  }

  // ── Intro ────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="space-y-6 pb-12 sm:space-y-8">
        <PageHero
          eyebrow="Exam Prep · 말하기 드릴"
          title="Speaking Drill"
          description="Rapid reps for the real interview: one question at a time — answer out loud in 2–3 sentences and get instant scores with a corrected version and a natural model answer."
          stats={[
            { label: "Questions", value: String(DRILL_SIZE) },
            { label: "Answer length", value: "2–3 sentences" },
            { label: "Scored on", value: "6 criteria" },
          ]}
          actions={
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-xl border-border bg-background px-4 font-bold hover:bg-accent"
            >
              <Link href="/interview">
                <ArrowLeft size={16} className="mr-2" /> Mock Interview
              </Link>
            </Button>
          }
        />

        {lastSession?.averages && (
          <Card className="rounded-[1.8rem] border-border bg-card shadow-sm dark:bg-slate-900/40 sm:rounded-[2.2rem]">
            <CardContent className="p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Last session · {new Date(lastSession.finishedAt).toLocaleDateString()}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-6">
                {SPEAKING_SCORE_KEYS.map((key) => (
                  <div key={key} className="rounded-2xl border border-border bg-accent/5 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      {SPEAKING_SCORE_LABELS[key]}
                    </p>
                    <p className="text-lg font-bold tabular-nums text-foreground">
                      {lastSession.averages![key]}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <Button
            onClick={startDrill}
            className="h-14 w-full rounded-2xl bg-blue-600 px-10 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95 sm:w-auto"
          >
            <Mic size={20} className="mr-2" /> Start Drill
          </Button>
        </div>
      </div>
    )
  }

  // ── Summary ──────────────────────────────────────────────────────
  if (phase === "summary") {
    const averages = averageSpeakingScores(results.map((r) => r.result.scores))
    return (
      <div className="space-y-5 pb-12 sm:space-y-6">
        <PageHero
          eyebrow="Speaking Drill · Result"
          title="Drill Complete"
          description={`You answered ${results.length} question${results.length === 1 ? "" : "s"}. Review the model answers below — reading them aloud once is the fastest way to lock them in.`}
          stats={[
            { label: "Answered", value: String(results.length) },
            {
              label: "Avg Speaking",
              value: averages ? `${averages.speaking} / 5` : "—",
            },
            {
              label: "Avg Naturalness",
              value: averages ? `${averages.naturalness} / 5` : "—",
            },
          ]}
        />

        {averages && (
          <Card className="rounded-[1.8rem] border-border bg-card shadow-xl dark:bg-slate-900/40 sm:rounded-[2.2rem]">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Session averages
                </p>
                <Badge className="rounded-lg border-none bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  <Info size={12} className="mr-1" strokeWidth={2.5} />
                  Estimated from transcript — no audio analysis
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SPEAKING_SCORE_KEYS.map((key) => {
                  const score = averages[key]
                  return (
                    <div key={key} className="rounded-2xl border border-border bg-accent/5 px-3 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        {SPEAKING_SCORE_LABELS[key]}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-xl font-bold tabular-nums",
                          score >= 4
                            ? "text-emerald-600 dark:text-emerald-400"
                            : score >= 3
                              ? "text-foreground"
                              : "text-rose-600 dark:text-rose-400"
                        )}
                      >
                        {score}
                        <span className="text-xs font-medium text-muted-foreground"> / 5</span>
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review list */}
        {results.map((r, i) => (
          <Card
            key={i}
            className="rounded-[1.8rem] border-border bg-card shadow-sm dark:bg-slate-900/40 sm:rounded-[2.2rem]"
          >
            <CardContent className="space-y-3 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <p className="font-bold leading-snug text-foreground">
                  {i + 1}. {r.question.ko}
                </p>
                <SpeakButton text={r.question.ko} className="mt-0.5 shrink-0 p-1.5" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">You: {r.answer}</p>
              {r.result.betterAlternative && (
                <div className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-sm font-bold leading-relaxed text-foreground">
                    {r.result.betterAlternative}
                  </p>
                  <SpeakButton text={r.result.betterAlternative} className="mt-0.5 shrink-0 p-1.5" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={startDrill}
            className="h-14 w-full rounded-2xl bg-blue-600 px-10 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95 sm:w-auto"
          >
            <RotateCcw size={20} className="mr-2" /> Drill Again
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-14 w-full rounded-2xl border-border bg-background px-8 text-base font-bold hover:bg-accent active:scale-95 sm:w-auto"
          >
            <Link href="/interview">
              <ArrowLeft size={20} className="mr-2" /> Back to Mock Interview
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // ── Drill ────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-12 sm:space-y-6">
      <PageHero
        eyebrow="Speaking Drill · In Progress"
        title={`Question ${index + 1} of ${queue.length}`}
        description="Answer out loud in 2–3 complete sentences. Short, clear, confident — exactly like the real exam."
        stats={[
          { label: "Question", value: `${index + 1}/${queue.length}` },
          { label: "Scored", value: String(results.length) },
          { label: "Input", value: speech.supported ? "Voice" : "Manual" },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={finishDrill}
            className="h-10 rounded-xl border-border bg-background px-4 font-bold hover:bg-accent"
          >
            End drill
          </Button>
        }
      />

      {/* Question */}
      <Card className="rounded-[1.8rem] border-border bg-card shadow-xl dark:bg-slate-900/40 sm:rounded-[2.2rem]">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[1.4rem] font-bold leading-tight text-foreground sm:text-2xl">
              {question?.ko}
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-background p-1.5 shadow-sm w-fit">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-accent">
              <SpeakButton text={question?.ko ?? ""} className="p-0" />
              <span className="text-xs font-bold uppercase tracking-tighter text-muted-foreground">
                Normal
              </span>
            </div>
            <div className="mx-1 h-4 w-px bg-border" />
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-accent">
              <SpeakButton text={question?.ko ?? ""} className="p-0" playbackRate={0.75} />
              <span className="text-xs font-bold uppercase tracking-tighter text-muted-foreground">
                Slow
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Answer or result */}
      {current ? (
        <>
          <SpeakingScoreCard result={current} />
          <Button
            onClick={nextQuestion}
            className="h-12 w-full rounded-2xl bg-foreground px-6 text-sm font-bold text-background shadow-lg transition-all active:scale-95 sm:h-14"
          >
            {index + 1 >= queue.length ? (
              <>
                <Award size={18} className="mr-2" /> See Session Summary
              </>
            ) : (
              <>
                <ArrowRight size={18} className="mr-2" /> Next Question
              </>
            )}
          </Button>
        </>
      ) : (
        <Card className="rounded-[1.8rem] border-border bg-card shadow-xl dark:bg-slate-900/40 sm:rounded-[2.2rem]">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <DrillAnswerBox speech={speech} disabled={isScoring} />
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-destructive" />
                <p className="text-sm font-bold leading-relaxed text-destructive">{error}</p>
              </motion.div>
            )}
            <Button
              onClick={submitAnswer}
              disabled={!speech.transcript.trim() || isScoring}
              className="h-12 w-full rounded-2xl bg-foreground px-6 text-sm font-bold text-background shadow-lg transition-all active:scale-95 disabled:opacity-40 sm:h-14"
            >
              {isScoring ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" /> Scoring…
                </>
              ) : (
                <>
                  <Send size={18} className="mr-2" /> Submit for Scoring
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
