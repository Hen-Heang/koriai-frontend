"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Lightbulb,
  Loader2,
  MessageCircleQuestion,
  Mic,
  PencilLine,
  Quote,
  RotateCcw,
  Send,
  Sparkles,
  Waves,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import dynamic from "next/dynamic"

import { PageHero } from "@/components/app/page-hero"
import { StudyPlanCard } from "@/components/interview/StudyPlanCard"
import { SpeakButton } from "@/components/ui/SpeakButton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { useLogActivity } from "@/hooks/useLogActivity"
import { useSessionTimer } from "@/hooks/useSessionTimer"
import { chatApi, getApiErrorMessage, ttsApi } from "@/lib/api"
import {
  buildAnswerMessage,
  buildEvaluationPrompt,
  buildInterviewSystemPrompt,
  INTERVIEW_TOPICS,
  parseEvaluation,
  parseExaminerTurn,
  type ExaminerTurn,
  type InterviewEvaluation,
  type InterviewTopic,
  type PhraseEntry,
} from "@/lib/interview"
import {
  loadScorecards,
  saveScorecard,
  type ScorecardRecord,
} from "@/lib/interview-history"
import { cn } from "@/lib/utils"

type SessionEntry =
  | { id: string; kind: "examiner"; turn: ExaminerTurn }
  | { id: string; kind: "answer"; text: string }

// recharts-backed; deferred so the page paints before the chart chunk loads.
const ScoreTrend = dynamic(
  () => import("@/components/interview/ScoreTrend").then((m) => m.ScoreTrend),
  { ssr: false, loading: () => <div className="h-48 w-full animate-pulse rounded-3xl bg-muted/20" /> }
)

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
} as const

// Auto-play the examiner question. iOS Safari may block playback that isn't a
// direct tap — failures are swallowed and the candidate uses the speaker button.
async function autoSpeak(text: string) {
  if (!text) return
  let url: string | undefined
  try {
    url = await ttsApi.speak(text)
    const audio = new Audio(url)
    // ttsApi.speak hands back an object URL — release it once playback ends or
    // errors, otherwise every spoken question leaks a blob for the whole session.
    const release = () => {
      if (url) URL.revokeObjectURL(url)
    }
    audio.addEventListener("ended", release, { once: true })
    audio.addEventListener("error", release, { once: true })
    await audio.play()
  } catch {
    // Autoplay blocked or TTS unavailable — manual playback still works.
    // play() never started, so revoke the URL now rather than on an event.
    if (url) URL.revokeObjectURL(url)
  }
}

export default function InterviewPage() {
  const { logActivity } = useLogActivity()
  useSessionTimer("interview")

  const [phase, setPhase] = useState<"select" | "session" | "summary">("select")
  const [entries, setEntries] = useState<SessionEntry[]>([])
  const [current, setCurrent] = useState<ExaminerTurn | null>(null)
  const [streamingText, setStreamingText] = useState("")
  const [isExaminerThinking, setIsExaminerThinking] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [isEditingAnswer, setIsEditingAnswer] = useState(false)
  const [showEnglish, setShowEnglish] = useState(false)
  const [error, setError] = useState("")
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null)
  // Past scorecards (localStorage) — lazy-loaded so the trend survives reloads.
  const [history, setHistory] = useState<ScorecardRecord[]>(loadScorecards)

  const speech = useSpeechRecognition({ lang: "ko-KR" })
  const conversationRef = useRef<string | null>(null)

  const topic = INTERVIEW_TOPICS[0]

  // Streams one examiner turn, then parses it into question + feedback and
  // speaks the Korean question aloud.
  async function runExaminerTurn(message: string) {
    const convId = conversationRef.current
    if (!convId) return

    setIsExaminerThinking(true)
    setStreamingText("")
    setShowEnglish(false)
    setError("")

    let buffer = ""
    try {
      await chatApi.streamMessage(
        convId,
        message,
        (token) => {
          buffer += token
          setStreamingText(buffer)
        },
        () => {},
        () => {}
      )

      const turn = parseExaminerTurn(buffer)
      setCurrent(turn)
      setEntries((prev) => [
        ...prev,
        { id: crypto.randomUUID(), kind: "examiner", turn },
      ])
      setQuestionCount((count) => count + 1)
      setStreamingText("")
      void logActivity()
      void autoSpeak(turn.questionKo)
    } catch (err) {
      setError(getApiErrorMessage(err, "The examiner could not respond. Try again."))
      setStreamingText("")
    } finally {
      setIsExaminerThinking(false)
    }
  }

  async function startSession() {
    setError("")
    setIsExaminerThinking(true)
    try {
      const data = await chatApi.createConversation(
        `Mock Interview · ${topic.label}`,
        "FREE_CHAT"
      )
      conversationRef.current = data.id
      setEntries([])
      setCurrent(null)
      setQuestionCount(0)
      setEvaluation(null)
      speech.reset()
      setPhase("session")
      await runExaminerTurn(buildInterviewSystemPrompt(topic))
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not start the interview. Is the backend running?"))
      setIsExaminerThinking(false)
      setPhase("select")
    }
  }

  function submitAnswer() {
    const answer = speech.transcript.trim()
    if (!answer || isExaminerThinking) return

    setEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), kind: "answer", text: answer },
    ])
    speech.reset()
    setIsEditingAnswer(false)
    void runExaminerTurn(buildAnswerMessage(answer))
  }

  // Ends the Q&A and asks the examiner for a final scorecard against the four
  // exam criteria, judged on the full transcript it already holds. Lands on the
  // "summary" phase; the conversation stays open so the candidate can retry.
  async function finishInterview() {
    const convId = conversationRef.current
    if (!convId || isEvaluating || isExaminerThinking) return

    setError("")
    setIsEvaluating(true)
    speech.stop()

    let buffer = ""
    try {
      await chatApi.streamMessage(
        convId,
        buildEvaluationPrompt(),
        (token) => {
          buffer += token
        },
        () => {},
        () => {}
      )
      const parsed = parseEvaluation(buffer)
      setEvaluation(parsed)
      // Persist this scorecard so the progress trend builds over time.
      setHistory(saveScorecard(parsed))
      setPhase("summary")
      void logActivity()
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not generate your evaluation. Try again."))
    } finally {
      setIsEvaluating(false)
    }
  }

  function endSession() {
    speech.reset()
    conversationRef.current = null
    setEntries([])
    setCurrent(null)
    setStreamingText("")
    setQuestionCount(0)
    setEvaluation(null)
    setPhase("select")
  }

  // ── Topic selection ──────────────────────────────────────────────
  if (phase === "select") {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6 pb-12 sm:space-y-8"
      >
        <motion.div variants={itemVariants}>
          <PageHero
            eyebrow="Exam Prep · 면접 연습"
            title="Mock Interview"
            description="Practice the K-Specialist spoken Q&A. The AI examiner asks one question at a time — listen, answer out loud, and get instant feedback on vocabulary, grammar, and confidence."
            stats={[
              { label: "Exam", value: "Aug 29" },
              { label: "Format", value: "Q&A only" },
              { label: "Judged on", value: "Speaking" },
            ]}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="rounded-[1.8rem] border-blue-500/40 bg-blue-500/5 shadow-xl dark:bg-slate-900/40 sm:rounded-[2.2rem]">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-lg border-none bg-blue-500/10 px-2 py-0.5 text-[11px] text-blue-600 dark:text-blue-400">
                  Your topic
                </Badge>
                <Badge variant="outline" className="rounded-lg px-2 py-0.5 text-[11px]">
                  {topic.difficulty}
                </Badge>
              </div>
              <p className="mt-4 text-lg font-bold leading-snug text-blue-600 dark:text-blue-400 sm:text-xl">
                {topic.labelKo}
              </p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
                {topic.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Renders itself only after mount + when scorecards exist, so it's safe
            to leave ungated here (no SSR/CSR conditional mismatch). */}
        <ScoreTrend records={history} />

        <motion.div variants={itemVariants}>
          <StudyPlanCard />
        </motion.div>

        {topic.prep && (
          <motion.div variants={itemVariants}>
            <StudyPack topic={topic} defaultOpen />
          </motion.div>
        )}

        {error && <ErrorBanner message={error} />}

        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-3 sm:flex-row sm:justify-center"
        >
          <Button
            onClick={startSession}
            disabled={isExaminerThinking}
            className="h-14 w-full rounded-2xl bg-blue-600 px-10 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-60 sm:w-auto"
          >
            {isExaminerThinking ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" /> Starting…
              </>
            ) : (
              <>
                <GraduationCap size={20} className="mr-2" /> Start Interview
              </>
            )}
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-14 w-full rounded-2xl border-border bg-background px-8 text-base font-bold hover:bg-accent active:scale-95 sm:w-auto"
          >
            <Link href="/interview/script">
              <FileText size={20} className="mr-2" /> Write my script
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    )
  }

  // ── Evaluation summary ───────────────────────────────────────────
  if (phase === "summary" && evaluation) {
    return (
      <EvaluationSummary
        topic={topic}
        evaluation={evaluation}
        history={history}
        onPracticeAgain={startSession}
        onBackToTopics={endSession}
      />
    )
  }

  // ── Live session ─────────────────────────────────────────────────
  const recording = speech.status === "listening"
  const answeredCount = entries.filter((entry) => entry.kind === "answer").length

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-5 pb-12 sm:space-y-6"
    >
      <motion.div variants={itemVariants}>
        <PageHero
          eyebrow="Mock Interview · In Progress"
          title={topic.label}
          description="Listen to each question, then tap the mic and answer out loud in Korean. Reveal the English only if you need it — train your listening first."
          stats={[
            { label: "Question", value: String(Math.max(questionCount, 1)) },
            { label: "Topic", value: topic.difficulty },
            { label: "Mode", value: speech.supported ? "Voice" : "Manual" },
          ]}
          actions={
            <Button
              variant="outline"
              onClick={endSession}
              className="h-10 rounded-xl border-border bg-background px-4 font-bold hover:bg-accent"
            >
              <RotateCcw size={16} className="mr-2" /> End & change topic
            </Button>
          }
        />
      </motion.div>

      {/* Current question */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-[1.8rem] border-border bg-card shadow-xl dark:bg-slate-900/40 sm:rounded-[2.2rem]">
          <CardHeader className="border-b border-border/80 px-5 pb-4 pt-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                <GraduationCap size={20} strokeWidth={2.5} />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Examiner</CardTitle>
                <p className="text-xs font-medium text-muted-foreground">
                  Question {Math.max(questionCount, 1)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-5 sm:pt-6">
            {/* Feedback on the previous answer */}
            {current?.feedback && (
              <div className="flex items-start gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
                  <Sparkles size={14} strokeWidth={3} />
                </div>
                <p className="text-sm font-medium leading-relaxed text-foreground/90">
                  {current.feedback}
                </p>
              </div>
            )}

            {/* Question text */}
            <div className="relative overflow-hidden rounded-[1.5rem] border border-border bg-accent/5 p-5 sm:rounded-3xl sm:p-6">
              {isExaminerThinking && !streamingText ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm font-bold">The examiner is thinking…</span>
                </div>
              ) : (
                <>
                  <p className="text-[1.5rem] font-bold leading-tight text-foreground sm:text-2xl lg:text-[1.7rem]">
                    {streamingText
                      ? parseExaminerTurn(streamingText).questionKo
                      : current?.questionKo}
                  </p>

                  {current && !streamingText && (
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-background p-1.5 shadow-sm">
                        <div className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-accent">
                          <SpeakButton text={current.questionKo} className="p-0" />
                          <span className="text-xs font-bold uppercase tracking-tighter text-muted-foreground">
                            Normal
                          </span>
                        </div>
                        <div className="mx-1 h-4 w-px bg-border" />
                        <div className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-accent">
                          <SpeakButton
                            text={current.questionKo}
                            className="p-0"
                            playbackRate={0.75}
                          />
                          <span className="text-xs font-bold uppercase tracking-tighter text-muted-foreground">
                            Slow
                          </span>
                        </div>
                      </div>

                      {current.questionEn && (
                        <Button
                          variant="outline"
                          onClick={() => setShowEnglish((v) => !v)}
                          className="h-11 rounded-2xl border-border bg-background px-4 font-bold hover:bg-accent"
                        >
                          {showEnglish ? (
                            <>
                              <EyeOff size={16} className="mr-2" /> Hide English
                            </>
                          ) : (
                            <>
                              <Eye size={16} className="mr-2" /> Show English
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}

                  <AnimatePresence>
                    {showEnglish && current?.questionEn && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 text-sm font-medium italic leading-relaxed text-muted-foreground"
                      >
                        {current.questionEn}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {error && <ErrorBanner message={error} />}
          </CardContent>
        </Card>
      </motion.div>

      {/* Answer area */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-[1.8rem] border-border bg-card shadow-xl dark:bg-slate-900/40 sm:rounded-[2.2rem]">
          <CardHeader className="border-b border-border/80 px-5 pb-4 pt-5 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
                  <Waves size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Your Answer</CardTitle>
                  <p className="text-xs font-medium text-muted-foreground">
                    Speak in Korean, then submit.
                  </p>
                </div>
              </div>
              <Badge
                className={cn(
                  "rounded-lg border-none px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
                  recording ? "animate-pulse bg-rose-500 text-white" : "bg-accent/20"
                )}
              >
                {recording ? "Recording…" : speech.transcript ? "Captured" : "Ready"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-5 sm:pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                onClick={() => (recording ? speech.stop() : speech.start())}
                disabled={isExaminerThinking}
                className={cn(
                  "h-12 w-full rounded-2xl px-6 text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 sm:h-14 sm:w-auto sm:px-8 sm:text-base",
                  recording
                    ? "bg-rose-600 text-white shadow-rose-600/20 hover:bg-rose-700"
                    : "bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700"
                )}
              >
                {recording ? (
                  <>
                    <Waves size={20} className="mr-2 animate-pulse" /> Stop
                  </>
                ) : (
                  <>
                    <Mic size={20} className="mr-2" /> Record Answer
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditingAnswer((v) => !v)}
                className="h-12 w-full rounded-2xl border-border bg-background px-6 font-bold hover:bg-accent active:scale-95 sm:h-14 sm:w-auto"
              >
                <PencilLine size={18} className="mr-2" />
                {isEditingAnswer ? "Done" : "Manual Edit"}
              </Button>
            </div>

            {/* Transcript */}
            <div className="rounded-[1.5rem] border border-border bg-background p-4 shadow-sm sm:rounded-3xl sm:p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/60">
                Transcript
              </p>
              {isEditingAnswer || !speech.supported ? (
                <Textarea
                  value={speech.transcript}
                  onChange={(e) => speech.setTranscript(e.target.value)}
                  placeholder="Type your Korean answer if voice capture was weak…"
                  className="mt-3 min-h-[110px] rounded-2xl border-border bg-accent/5 transition-colors focus:bg-background"
                />
              ) : speech.transcript ? (
                <p className="mt-3 text-lg font-bold leading-relaxed text-foreground">
                  {speech.transcript}
                </p>
              ) : (
                <p className="mt-3 py-6 text-center text-sm font-medium italic text-muted-foreground/40">
                  Your spoken answer will appear here.
                </p>
              )}
            </div>

            {speech.error && <ErrorBanner message={speech.error} />}

            <Button
              onClick={submitAnswer}
              disabled={!speech.transcript.trim() || isExaminerThinking}
              className="h-12 w-full rounded-2xl bg-foreground px-6 text-sm font-bold text-background shadow-lg transition-all active:scale-95 disabled:opacity-40 sm:h-14"
            >
              <Send size={18} className="mr-2" /> Submit Answer & Next Question
            </Button>

            {/* Wrap up the session and get a scorecard. Needs at least one
                answered question so the examiner has something to judge. */}
            {answeredCount >= 1 && (
              <Button
                variant="outline"
                onClick={finishInterview}
                disabled={isEvaluating || isExaminerThinking}
                className="h-12 w-full rounded-2xl border-blue-500/40 bg-blue-500/5 px-6 text-sm font-bold text-blue-600 transition-all hover:bg-blue-500/10 active:scale-95 disabled:opacity-50 dark:text-blue-400 sm:h-14"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" /> Scoring your interview…
                  </>
                ) : (
                  <>
                    <Award size={18} className="mr-2" /> Finish & Get Evaluation
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick-reference study pack during the session */}
      {topic.prep && (
        <motion.div variants={itemVariants}>
          <StudyPack topic={topic} />
        </motion.div>
      )}

      {/* Session history */}
      {entries.length > 1 && (
        <motion.div variants={itemVariants}>
          <Card className="rounded-[1.8rem] border-border bg-card shadow-xl dark:bg-slate-900/40 sm:rounded-[2.2rem]">
            <CardHeader className="border-b border-border/80 px-5 pb-4 pt-5 sm:px-6">
              <CardTitle className="text-base font-bold">Session Transcript</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              {entries.map((entry) =>
                entry.kind === "examiner" ? (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-border bg-accent/5 p-4"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wide text-blue-600">
                      Examiner
                    </p>
                    <p className="mt-1.5 font-bold text-foreground">
                      {entry.turn.questionKo}
                    </p>
                    {entry.turn.questionEn && (
                      <p className="mt-1 text-sm italic text-muted-foreground">
                        {entry.turn.questionEn}
                      </p>
                    )}
                  </div>
                ) : (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      You
                    </p>
                    <p className="mt-1.5 font-medium text-foreground">{entry.text}</p>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}

// Curated, audio-enabled study material for the selected topic. Collapsible so
// it doubles as a quick reference during a live session.
function StudyPack({
  topic,
  defaultOpen = false,
}: {
  topic: InterviewTopic
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const prep = topic.prep
  if (!prep) return null

  return (
    <Card className="rounded-[1.8rem] border-border bg-card shadow-xl dark:bg-slate-900/40 sm:rounded-[2.2rem]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-5 text-left sm:px-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
            <BookOpen size={20} strokeWidth={2.5} />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">Study Pack</CardTitle>
            <p className="text-xs font-medium text-muted-foreground">
              Vocabulary, phrases & likely questions — tap 🔊 to hear each one.
            </p>
          </div>
        </div>
        <ChevronDown
          size={20}
          className={cn("shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <CardContent className="space-y-7 border-t border-border/80 pt-6">
              {/* Vocabulary */}
              <section>
                <SectionLabel icon={<BookOpen size={13} strokeWidth={3} />} color="amber">
                  Vocabulary · {prep.vocabulary.length} words
                </SectionLabel>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {prep.vocabulary.map((item) => (
                    <div
                      key={item.term}
                      className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-accent/5 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold text-foreground">{item.term}</p>
                        <p className="truncate text-xs font-medium text-muted-foreground">
                          {item.meaning}
                        </p>
                      </div>
                      <SpeakButton text={item.term} className="shrink-0 p-1.5" />
                    </div>
                  ))}
                </div>
              </section>

              {/* Key phrases */}
              <section>
                <SectionLabel icon={<Quote size={13} strokeWidth={3} />} color="emerald">
                  Key phrases
                </SectionLabel>
                <div className="mt-3 space-y-2">
                  {prep.keyPhrases.map((entry) => (
                    <PhraseRow key={entry.ko} entry={entry} />
                  ))}
                </div>
              </section>

              {/* Likely questions */}
              <section>
                <SectionLabel
                  icon={<MessageCircleQuestion size={13} strokeWidth={3} />}
                  color="sky"
                >
                  Likely questions
                </SectionLabel>
                <div className="mt-3 space-y-2">
                  {prep.sampleQuestions.map((entry) => (
                    <PhraseRow key={entry.ko} entry={entry} />
                  ))}
                </div>
              </section>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

function SectionLabel({
  icon,
  color,
  children,
}: {
  icon: React.ReactNode
  color: "amber" | "emerald" | "sky"
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-md",
          color === "amber" && "bg-amber-500/10 text-amber-600",
          color === "emerald" && "bg-blue-500/10 text-blue-600",
          color === "sky" && "bg-sky-500/10 text-sky-600"
        )}
      >
        {icon}
      </span>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {children}
      </p>
    </div>
  )
}

function PhraseRow({ entry }: { entry: PhraseEntry }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-accent/5 px-3 py-3">
      <div className="min-w-0">
        <p className="font-bold leading-snug text-foreground">{entry.ko}</p>
        <p className="mt-1 text-sm font-medium leading-relaxed text-muted-foreground">
          {entry.en}
        </p>
      </div>
      <SpeakButton text={entry.ko} className="mt-0.5 shrink-0 p-1.5" />
    </div>
  )
}

// End-of-session scorecard: the four exam criteria as scored bars, an overall
// summary, and concrete next-step advice. Ends with retry / change-topic.
function EvaluationSummary({
  topic,
  evaluation,
  history,
  onPracticeAgain,
  onBackToTopics,
}: {
  topic: InterviewTopic
  evaluation: InterviewEvaluation
  history: ScorecardRecord[]
  onPracticeAgain: () => void
  onBackToTopics: () => void
}) {
  const { scores, summary, advice } = evaluation
  const overall =
    scores.length > 0
      ? scores.reduce((sum, s) => sum + (s.score / s.max) * 5, 0) / scores.length
      : 0

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-5 pb-12 sm:space-y-6"
    >
      <motion.div variants={itemVariants}>
        <PageHero
          eyebrow="Mock Interview · Result"
          title="Your Evaluation"
          description="An overall read on this session across the four official exam criteria — speaking, pronunciation, vocabulary, and confidence. Practice again to push each score up."
          stats={[
            { label: "Overall", value: overall ? `${overall.toFixed(1)} / 5` : "—" },
            { label: "Topic", value: topic.difficulty },
            { label: "Criteria", value: String(scores.length || 4) },
          ]}
        />
      </motion.div>

      {/* Scorecard */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-[1.8rem] border-border bg-card shadow-xl dark:bg-slate-900/40 sm:rounded-[2.2rem]">
          <CardHeader className="border-b border-border/80 px-5 pb-4 pt-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                <Award size={20} strokeWidth={2.5} />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Scorecard</CardTitle>
                <p className="text-xs font-medium text-muted-foreground">
                  Judged on the exam&apos;s four criteria
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-5 sm:pt-6">
            {scores.length > 0 ? (
              scores.map((s) => (
                <div key={s.label} className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-bold text-foreground">{s.label}</span>
                    <span className="text-sm font-bold tabular-nums text-blue-600 dark:text-blue-400">
                      {s.score}
                      <span className="text-muted-foreground/50"> / {s.max}</span>
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-accent/40">
                    <motion.div
                      className="h-full rounded-full bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.score / s.max) * 100}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm font-medium text-muted-foreground">
                No scores were returned — see the summary below.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Overall summary */}
      {summary && (
        <motion.div variants={itemVariants}>
          <Card className="rounded-[1.8rem] border-sky-500/20 bg-sky-500/5 shadow-xl dark:bg-slate-900/40 sm:rounded-[2.2rem]">
            <CardContent className="flex items-start gap-3 p-5 sm:p-6">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
                <CheckCircle2 size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
                  Overall
                </p>
                <p className="mt-1.5 text-sm font-medium leading-relaxed text-foreground/90">
                  {summary}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Actionable advice */}
      {advice.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="rounded-[1.8rem] border-border bg-card shadow-xl dark:bg-slate-900/40 sm:rounded-[2.2rem]">
            <CardHeader className="border-b border-border/80 px-5 pb-4 pt-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                  <Lightbulb size={20} strokeWidth={2.5} />
                </div>
                <CardTitle className="text-base font-bold">What to work on next</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-5">
              {advice.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-accent/5 p-4"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-xs font-bold text-amber-600">
                    {i + 1}
                  </span>
                  <p className="text-sm font-medium leading-relaxed text-foreground/90">{tip}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Trajectory across past mocks — shown once there's more than one. */}
      {history.length > 1 && (
        <motion.div variants={itemVariants}>
          <ScoreTrend records={history} />
        </motion.div>
      )}

      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-3 sm:flex-row sm:justify-center"
      >
        <Button
          onClick={onPracticeAgain}
          className="h-14 w-full rounded-2xl bg-blue-600 px-10 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95 sm:w-auto"
        >
          <RotateCcw size={20} className="mr-2" /> Practice Again
        </Button>
        <Button
          variant="outline"
          onClick={onBackToTopics}
          className="h-14 w-full rounded-2xl border-border bg-background px-8 text-base font-bold hover:bg-accent active:scale-95 sm:w-auto"
        >
          <GraduationCap size={20} className="mr-2" /> Back to Topic
        </Button>
      </motion.div>
    </motion.div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4"
    >
      <AlertCircle size={18} className="mt-0.5 shrink-0 text-destructive" />
      <p className="text-sm font-bold leading-relaxed text-destructive">{message}</p>
    </motion.div>
  )
}
