"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { 
  AlertCircle, 
  CheckCircle2, 
  Mic, 
  PencilLine, 
  RotateCcw, 
  Waves, 
  Play, 
  Trophy,
  Activity,
  Mic2
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { PageHero } from "@/components/app/page-hero"
import { SpeakButton } from "@/components/ui/SpeakButton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { assessSpeaking } from "@/lib/speaking"
import { useStreak } from "@/hooks/useStreak"
import { cn } from "@/lib/utils"

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

export default function SpeakingPage() {
  const { refreshStreak } = useStreak()
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

  function handleDrillKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>,
    drillId: string
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      setSelectedId(drillId)
    }
  }

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
      refreshStreak()
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
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 pb-12 sm:space-y-8"
    >
      <motion.div variants={itemVariants}>
        <PageHero
          eyebrow="Speaking"
          title="Master Natural Phrasing"
          description="Build muscle memory by shadowing native model sentences. Get instant feedback on your pronunciation and flow."
          stats={[
            { label: "Level", value: selectedDrill.level },
            { label: "Mode", value: supported ? "Voice AI" : "Manual" },
            { label: "Target", value: "90% Accuracy" },
          ]}
        />
      </motion.div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] xl:gap-6">
        {/* Left Col — Drill Selection */}
        <motion.div variants={itemVariants}>
          <Card className="h-full rounded-[1.8rem] border-border bg-card shadow-xl dark:bg-slate-900/40 sm:rounded-[2.2rem] lg:rounded-[2.5rem]">
            <CardHeader className="border-b border-border/80 px-5 pb-4 pt-5 sm:px-6 sm:pb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Play size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <CardTitle className="text-xl font-black">Practice Drills</CardTitle>
                  <p className="text-xs font-medium text-muted-foreground">Select a sentence to begin shadowing.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {drills.map((drill) => {
                const active = drill.id === selectedDrill.id

                return (
                  <div
                    key={drill.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={active}
                    onClick={() => selectDrill(drill.id)}
                    onKeyDown={(event) => handleDrillKeyDown(event, drill.id)}
                    className={cn(
                      "group relative w-full overflow-hidden rounded-[1.4rem] border p-4 text-left transition-all sm:rounded-3xl sm:p-5",
                      "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
                      active
                        ? "border-emerald-500/50 bg-emerald-500/5 shadow-inner"
                        : "border-border bg-accent/5 hover:border-emerald-500/30 hover:bg-emerald-500/5"
                    )}
                  >
                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={cn("font-black tracking-tight", active ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
                            {drill.label}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant={active ? "default" : "outline"} className="text-[10px] h-5 rounded-lg px-2">
                              {drill.level}
                            </Badge>
                            {active && <Badge variant="secondary" className="text-[10px] h-5 rounded-lg px-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none">Current</Badge>}
                          </div>
                        </div>
                        <div
                          className="rounded-xl border border-border bg-background p-1.5 shadow-sm transition-transform group-hover:scale-110"
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          <SpeakButton text={drill.target} className="p-1.5" />
                        </div>
                      </div>
                      <p className="mt-3 text-[15px] font-bold leading-7 text-foreground/90 sm:mt-4 sm:text-base sm:leading-relaxed">{drill.target}</p>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground/70">{drill.focus}</p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Col — Interactive Area */}
        <div className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="rounded-[1.8rem] border-border bg-card shadow-xl dark:bg-slate-900/40 backdrop-blur-md sm:rounded-[2.2rem] lg:rounded-[2.5rem]">
              <CardHeader className="border-b border-border/80 px-5 pb-4 pt-5 sm:px-6 sm:pb-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
                      <Waves size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black">Voice Session</CardTitle>
                      <p className="text-xs font-medium text-muted-foreground">Shadow the model then record your voice.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={status === "listening" ? "default" : "secondary"} className={cn(
                      "rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-wider border-none",
                      status === "listening" ? "bg-rose-500 animate-pulse" : "bg-accent/20"
                    )}>
                      {status === "listening" ? "Recording..." : status === "finished" ? "Captured" : "Ready"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-5 sm:space-y-6 sm:pt-6">
                {/* Target Sentence Display */}
                <div className="relative overflow-hidden rounded-[1.5rem] border border-border bg-accent/5 p-4 sm:rounded-[2rem] sm:p-6">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Mic2 size={80} />
                  </div>
                  
                  <p className="text-[1.55rem] font-black leading-tight text-foreground sm:text-2xl lg:text-3xl">
                    {selectedDrill.target}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Chunking</span>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedDrill.chunkHint}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-3 sm:mt-8">
                    <div className="flex items-center gap-1.5 rounded-2xl bg-background border border-border p-1.5 shadow-sm">
                      <div className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-accent transition-colors">
                        <SpeakButton text={selectedDrill.target} className="p-0" />
                        <span className="text-xs font-black uppercase tracking-tighter text-muted-foreground">Normal</span>
                      </div>
                      <div className="w-px h-4 bg-border mx-1" />
                      <div className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-accent transition-colors">
                        <SpeakButton text={selectedDrill.target} className="p-0" playbackRate={0.75} />
                        <span className="text-xs font-black uppercase tracking-tighter text-muted-foreground">Slow</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <Button
                    onClick={status === "listening" ? stopListening : startListening}
                    className={cn(
                      "h-12 w-full rounded-2xl px-6 text-sm font-black transition-all shadow-lg active:scale-95 sm:h-14 sm:w-auto sm:px-8 sm:text-base",
                      status === "listening" 
                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20" 
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                    )}
                  >
                    {status === "listening" ? (
                      <><Waves size={20} className="mr-2 animate-pulse" /> Stop</>
                    ) : (
                      <><Mic size={20} className="mr-2" /> Start Recording</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingTranscript((c) => !c)}
                    className="h-12 w-full rounded-2xl border-border bg-background px-6 font-bold hover:bg-accent active:scale-95 transition-all sm:h-14 sm:w-auto"
                  >
                    <PencilLine size={18} className="mr-2" />
                    {isEditingTranscript ? "Done" : "Manual Edit"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={resetAttempt} 
                    className="h-12 w-12 rounded-2xl border-border bg-background p-0 hover:bg-accent active:scale-95 transition-all sm:h-14 sm:w-14"
                    title="Reset"
                  >
                    <RotateCcw size={18} />
                  </Button>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 flex items-start gap-3"
                  >
                    <AlertCircle size={18} className="text-destructive mt-0.5 shrink-0" />
                    <p className="text-sm font-bold text-destructive leading-relaxed">{error}</p>
                  </motion.div>
                )}

                {/* Assessment Grid */}
                <div className="grid gap-4 lg:grid-cols-[0.45fr_0.55fr]">
                  <div className="rounded-[1.5rem] border border-border bg-accent/5 p-4 text-center shadow-inner lg:rounded-3xl lg:p-6 lg:text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                      Score
                    </p>
                    <div className="mt-4 flex flex-col items-center lg:items-start">
                      <p className="text-5xl font-black tracking-tighter text-foreground sm:text-6xl">
                        {transcript ? `${assessment.score}%` : "—"}
                      </p>
                      <div className="mt-4 flex items-center gap-2 rounded-full px-3 py-1.5 bg-background shadow-sm ring-1 ring-border">
                        {assessment.score >= 90 ? (
                          <CheckCircle2 size={14} className="text-emerald-600" strokeWidth={3} />
                        ) : (
                          <Activity size={14} className="text-amber-600" strokeWidth={3} />
                        )}
                        <span className="text-xs font-black uppercase tracking-tight text-foreground">
                          {transcript ? assessment.accuracyLabel : "No attempt"}
                        </span>
                      </div>
                    </div>
                    <p className="mt-6 text-sm font-medium leading-relaxed text-muted-foreground">
                      {assessment.feedback}
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] border border-border bg-background p-4 shadow-sm lg:rounded-3xl lg:p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                      Transcript
                    </p>
                    <AnimatePresence mode="wait">
                      {isEditingTranscript || !supported ? (
                        <motion.div
                          key="edit"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                        >
                          <Textarea
                            value={transcript}
                            onChange={(e) => {
                              setTranscript(e.target.value)
                              setStatus(e.target.value.trim() ? "finished" : "idle")
                            }}
                            placeholder="Type what you said if voice capture was weak..."
                            className="mt-4 min-h-[120px] rounded-2xl border-border bg-accent/5 focus:bg-background transition-colors sm:min-h-[140px]"
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="view"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-4 min-h-[140px]"
                        >
                          {transcript ? (
                            <p className="text-lg font-bold leading-relaxed text-foreground">
                              {transcript}
                            </p>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                              <Mic2 size={32} className="text-muted-foreground/20 mb-3" />
                              <p className="text-sm font-medium text-muted-foreground/40 italic">
                                Your spoken words will appear here.
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feedback Card */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-[1.8rem] border-border bg-card shadow-xl dark:bg-slate-900/40 sm:rounded-[2.2rem] lg:rounded-[2.5rem]">
              <CardHeader className="border-b border-border/80 px-5 pb-4 pt-5 sm:px-6 sm:pb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                    <Trophy size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black">Detailed Feedback</CardTitle>
                    <p className="text-xs font-medium text-muted-foreground">Focus on specific word patterns.</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "Matched", val: assessment.matchedWords, color: "emerald" },
                    { label: "Missing", val: assessment.missingWords, color: "amber" },
                    { label: "Extra", val: assessment.extraWords, color: "sky" }
                  ].map((cat) => (
                    <div key={cat.label} className={cn(
                      "rounded-2xl border p-4 shadow-inner",
                      cat.color === "emerald" ? "border-emerald-500/20 bg-emerald-500/5" :
                      cat.color === "amber" ? "border-amber-500/20 bg-amber-500/5" :
                      "border-sky-500/20 bg-sky-500/5"
                    )}>
                      <p className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em]",
                        cat.color === "emerald" ? "text-emerald-600" :
                        cat.color === "amber" ? "text-amber-600" :
                        "text-sky-600"
                      )}>
                        {cat.label}
                      </p>
                      <p className="mt-3 text-sm font-bold leading-relaxed text-foreground">
                        {cat.val.length ? cat.val.join(", ") : `No ${cat.label.toLowerCase()} words`}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-dashed border-border bg-accent/5 p-4">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 mt-0.5">
                    <Activity size={14} strokeWidth={3} />
                  </div>
                  <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                    <span className="font-bold text-foreground">Pro Routine:</span> Listen to the model twice, repeat slowly once, then do a full-speed recording. Focus on matching the rhythmic chunks highlighted above.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
