"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, CheckCircle2, Mic, PencilLine, RotateCcw, Waves } from "lucide-react"

import { SpeakButton } from "@/components/ui/SpeakButton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { assessSpeaking } from "@/lib/speaking"

const drills = [
  {
    id: "greeting",
    label: "Greeting",
    level: "Beginner",
    target: "안녕하세요 저는 한국어를 공부하고 있어요",
    focus: "Introduce yourself clearly and keep each phrase separated.",
    chunkHint: "안녕하세요 / 저는 / 한국어를 / 공부하고 있어요",
  },
  {
    id: "cafe",
    label: "Cafe order",
    level: "Beginner",
    target: "아이스 아메리카노 한 잔 주세요",
    focus: "Keep 한 잔 together and land clearly on 주세요.",
    chunkHint: "아이스 아메리카노 / 한 잔 / 주세요",
  },
  {
    id: "daily",
    label: "Daily routine",
    level: "Intermediate",
    target: "오늘 퇴근 후에 집에서 한국어 일기를 쓸 거예요",
    focus: "Maintain smooth flow through 퇴근 후에 and finish cleanly with 쓸 거예요.",
    chunkHint: "오늘 퇴근 후에 / 집에서 / 한국어 일기를 / 쓸 거예요",
  },
]

type BrowserRecognitionErrorEvent = {
  error?: string
}

type BrowserRecognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onresult: ((event: {
    results: ArrayLike<ArrayLike<{ transcript: string }>>
    resultIndex: number
  }) => void) | null
  onend: (() => void) | null
  onerror: ((event: BrowserRecognitionErrorEvent) => void) | null
  start: () => void
  stop: () => void
}

declare global {
  interface Window {
    SpeechRecognition?: new () => BrowserRecognition
    webkitSpeechRecognition?: new () => BrowserRecognition
  }
}

const supportMessage =
  "Speech recognition depends on the browser. Chrome and Safari usually work better than embedded webviews."

export default function SpeakingPage() {
  const [selectedId, setSelectedId] = useState(drills[0].id)
  const [status, setStatus] = useState<"idle" | "listening" | "finished">("idle")
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState("")
  const [isEditingTranscript, setIsEditingTranscript] = useState(false)
  const recognitionRef = useRef<BrowserRecognition | null>(null)

  const supported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition)

  const selectedDrill = useMemo(
    () => drills.find((drill) => drill.id === selectedId) ?? drills[0],
    [selectedId]
  )

  const assessment = useMemo(
    () => assessSpeaking(selectedDrill.target, transcript),
    [selectedDrill.target, transcript]
  )

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition

    if (!Recognition) {
      return
    }

    const recognition = new Recognition()
    recognition.lang = "ko-KR"
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setStatus("listening")
      setError("")
    }

    recognition.onresult = (event) => {
      const result = event.results[event.resultIndex]
      const spokenText = Array.from(result)
        .map((item) => item.transcript)
        .join(" ")
        .trim()

      setTranscript(spokenText)
      setStatus("finished")
    }

    recognition.onend = () => {
      setStatus((current) => (current === "listening" ? "idle" : current))
    }

    recognition.onerror = (event) => {
      setStatus("idle")

      if (event.error === "not-allowed") {
        setError("Microphone permission is blocked. Allow microphone access in the browser and try again.")
        return
      }

      if (event.error === "no-speech") {
        setError("No speech was detected. Try holding the phone closer and speaking once clearly.")
        return
      }

      setError("Speech capture failed. You can still type or edit the transcript manually below.")
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [])

  function resetAttempt() {
    recognitionRef.current?.stop()
    setStatus("idle")
    setTranscript("")
    setError("")
    setIsEditingTranscript(false)
  }

  function selectDrill(id: string) {
    setSelectedId(id)
    resetAttempt()
  }

  function startListening() {
    if (!recognitionRef.current) {
      setError("Speech recognition is not available here. Use the manual transcript box below instead.")
      setIsEditingTranscript(true)
      return
    }

    setError("")
    setTranscript("")
    setIsEditingTranscript(false)

    try {
      recognitionRef.current.start()
    } catch {
      setStatus("idle")
      setError("Could not start microphone capture. Wait a moment and try again.")
    }
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setStatus("idle")
  }

  return (
    <div className="space-y-6">
      <div className="max-w-4xl">
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Speaking
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Speak Korean more clearly
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
          Follow a simple loop: listen to a model sentence, repeat it out loud, then check which chunks matched and which ones still need work.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <Card className="rounded-[2rem] border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,247,250,0.96))] shadow-lg shadow-slate-950/5 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(8,15,28,0.98))]">
          <CardHeader className="border-b border-slate-200/70 pb-5 dark:border-white/10">
            <CardTitle className="text-xl">1. Pick a speaking drill</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Start with a short sentence you can repeat 3 to 5 times without rushing.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {drills.map((drill) => {
              const active = drill.id === selectedDrill.id

              return (
                <div
                  key={drill.id}
                  className={`w-full rounded-[1.5rem] border p-4 text-left transition-all ${
                    active
                      ? "border-emerald-400 bg-emerald-50 shadow-sm dark:border-emerald-400/30 dark:bg-emerald-400/10"
                      : "border-border/60 bg-background hover:border-emerald-300 hover:-translate-y-0.5 dark:border-white/10 dark:hover:border-emerald-400/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{drill.label}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant={active ? "default" : "outline"}>{drill.level}</Badge>
                        {active ? <Badge variant="secondary">Current</Badge> : null}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200/70 bg-white/80 p-1 dark:border-white/10 dark:bg-white/5">
                      <SpeakButton text={drill.target} className="p-2" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-foreground">{drill.target}</p>
                  <p className="mt-3 text-sm text-muted-foreground">{drill.focus}</p>
                  <Button
                    type="button"
                    variant={active ? "default" : "outline"}
                    onClick={() => selectDrill(drill.id)}
                    className="mt-4 rounded-xl"
                  >
                    {active ? "Selected Drill" : "Use This Drill"}
                  </Button>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border-slate-200/70 bg-white/95 shadow-lg shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900/95">
            <CardHeader className="border-b border-slate-200/70 pb-5 dark:border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">2. Listen, speak, and review</CardTitle>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Listen first, shadow once, then record one clean attempt.
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-400/12 dark:text-rose-300">
                  <Waves size={20} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="rounded-[1.75rem] border border-rose-200/70 bg-[linear-gradient(135deg,rgba(255,241,242,0.95),rgba(255,247,237,0.92))] p-5 dark:border-rose-400/15 dark:bg-[linear-gradient(135deg,rgba(127,29,29,0.18),rgba(67,20,7,0.22))]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">Target Sentence</Badge>
                      <Badge variant={status === "listening" ? "default" : "secondary"}>
                        {status === "listening"
                          ? "Listening live"
                          : status === "finished"
                            ? "Attempt captured"
                            : "Ready"}
                      </Badge>
                    </div>
                    <p className="mt-3 text-xl font-semibold leading-8 text-slate-900 dark:text-white">
                      {selectedDrill.target}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Chunk hint: {selectedDrill.chunkHint}
                    </p>
                  </div>
                    <div className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/80 p-2 shadow-sm dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-center gap-1 rounded-xl border border-slate-200/70 bg-white px-2 py-1 dark:border-white/10 dark:bg-white/5">
                        <SpeakButton text={selectedDrill.target} className="p-1.5" title="Play normal speed" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Normal</span>
                      </div>
                      <div className="flex items-center gap-1 rounded-xl border border-slate-200/70 bg-white px-2 py-1 dark:border-white/10 dark:bg-white/5">
                        <SpeakButton
                          text={selectedDrill.target}
                          className="p-1.5"
                          playbackRate={0.8}
                          title="Play slower"
                        />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Slow</span>
                      </div>
                    </div>
                  </div>
                </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[1.4rem] border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Step 1
                  </p>
                  <p className="mt-2 font-medium text-foreground">Play the sentence</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Listen twice before recording.
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Step 2
                  </p>
                  <p className="mt-2 font-medium text-foreground">Say it once clearly</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Aim for smooth chunks, not speed.
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Step 3
                  </p>
                  <p className="mt-2 font-medium text-foreground">Fix one weak chunk</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Repeat after reviewing missing words.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={status === "listening" ? stopListening : startListening}
                  className="h-11 rounded-2xl bg-rose-600 px-5 text-white hover:bg-rose-500"
                >
                  <Mic size={16} />
                  {status === "listening" ? "Stop Recording" : "Start Recording"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditingTranscript((current) => !current)}
                  className="h-11 rounded-2xl"
                >
                  <PencilLine size={16} />
                  {isEditingTranscript ? "Hide Transcript Box" : "Edit Transcript Manually"}
                </Button>
                <Button type="button" variant="outline" onClick={resetAttempt} className="h-11 rounded-2xl">
                  <RotateCcw size={16} />
                  Reset Attempt
                </Button>
              </div>

              <div className="rounded-[1.4rem] border border-dashed border-border/70 bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>{supportMessage}</p>
                </div>
              </div>

              {error ? (
                <div className="rounded-[1.4rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
                  {error}
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
                <div className="rounded-[1.6rem] border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Speaking Score
                  </p>
                  <p className="mt-3 text-5xl font-semibold tracking-tight text-foreground">
                    {transcript ? `${assessment.score}%` : "—"}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    {assessment.score >= 90 ? (
                      <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-300" />
                    ) : (
                      <AlertCircle size={16} className="text-amber-600 dark:text-amber-300" />
                    )}
                    <span className="text-sm font-medium text-foreground">
                      {transcript ? assessment.accuracyLabel : "No attempt yet"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {assessment.feedback}
                  </p>
                </div>

                <div className="rounded-[1.6rem] border border-border/60 bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Transcript
                  </p>
                  {isEditingTranscript || !supported ? (
                    <Textarea
                      value={transcript}
                      onChange={(event) => {
                        setTranscript(event.target.value)
                        setStatus(event.target.value.trim() ? "finished" : "idle")
                      }}
                      placeholder="Type or paste your recognized Korean here if microphone capture is weak."
                      className="mt-3 min-h-32 rounded-[1.2rem]"
                    />
                  ) : (
                    <p className="mt-3 min-h-24 text-sm leading-7 text-foreground">
                      {transcript || "No transcript yet. Record one attempt or open the transcript box to type manually."}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-slate-200/70 bg-white/95 shadow-lg shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900/95">
            <CardHeader className="border-b border-slate-200/70 pb-5 dark:border-white/10">
              <CardTitle className="text-xl">3. Focus on the weak part</CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                Don&apos;t fix everything at once. Improve one chunk, then repeat the full sentence.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.4rem] border border-emerald-200/70 bg-emerald-50/70 p-4 dark:border-emerald-400/15 dark:bg-emerald-400/8">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                    Matched words
                  </p>
                  <p className="mt-3 text-sm leading-7 text-foreground">
                    {assessment.matchedWords.length ? assessment.matchedWords.join(", ") : "No matched words yet"}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-amber-200/70 bg-amber-50/70 p-4 dark:border-amber-400/15 dark:bg-amber-400/8">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
                    Missing words
                  </p>
                  <p className="mt-3 text-sm leading-7 text-foreground">
                    {assessment.missingWords.length ? assessment.missingWords.join(", ") : "No missing words"}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-sky-200/70 bg-sky-50/70 p-4 dark:border-sky-400/15 dark:bg-sky-400/8">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">
                    Extra words
                  </p>
                  <p className="mt-3 text-sm leading-7 text-foreground">
                    {assessment.extraWords.length ? assessment.extraWords.join(", ") : "No extra words"}
                  </p>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-dashed border-border/70 bg-muted/30 p-4 text-sm leading-7 text-muted-foreground">
                Recommended routine: play the target audio twice, repeat once slowly, fix the missing chunk, then do one final full-speed attempt.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
