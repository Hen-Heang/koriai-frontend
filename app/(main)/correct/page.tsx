"use client"

import { useState } from "react"
import { 
  ArrowRight, 
  BookmarkPlus, 
  CheckCircle2, 
  Languages, 
  Lightbulb, 
  Sparkles, 
  WandSparkles, 
  Activity,
  Copy,
  Check,
  Trash2,
  History
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { PageHero } from "@/components/app/page-hero"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { SpeakButton } from "@/components/ui/SpeakButton"
import { SmartPeek } from "@/components/ui/SmartPeek"
import { AiGenerating } from "@/components/ui/ai-loading"
import { Skeleton } from "@/components/ui/skeleton"
import { correctionApi, vocabApi } from "@/lib/api"
import { useStreak } from "@/hooks/useStreak"
import { cn } from "@/lib/utils"

type CorrectionChange = {
  original: string
  corrected: string
  englishMeaning: string
  reason: string
}

type CorrectionResult = {
  originalText: string
  correctedText: string
  englishTranslation?: string
  explanation: string
  grammarPoints: string[]
  changes?: CorrectionChange[]
}

const starterPrompts = [
  "오늘 친구를 만나서 밥을 먹었어요 그리고 영화 봤어요.",
  "저는 어제 학교에 갔어요 친구랑.",
  "한국어를 더 자연스럽게 말하고 싶어서 매일 연습해요.",
  "오늘 업무 보고서를 작성하는데 생각보다 시간이 많이 걸렸어요. 내일까지 제출해야 돼요.",
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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

function SmartText({ text, className }: { text: string; className?: string }) {
  const words = text.split(/(\s+)/)
  return (
    <div className={className}>
      {words.map((word, i) => {
        if (!word.trim()) return <span key={i}>{word}</span>
        const cleanWord = word.replace(/[.,!??"']/g, "")
        return (
          <SmartPeek key={i} word={cleanWord}>
            {word}
          </SmartPeek>
        )
      })}
    </div>
  )
}

export default function CorrectPage() {
  const [text, setText] = useState("")
  const [result, setResult] = useState<CorrectionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [saveMessage, setSaveMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const { refreshStreak } = useStreak()

  async function handleAnalyze() {
    if (!text.trim()) return
    setLoading(true)
    setError("")
    setSaveMessage("")
    setResult(null)
    try {
      const data = await correctionApi.check(text)
      setResult(data)
      refreshStreak()
    } catch {
      setError("Failed to analyze. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSavePhrase() {
    if (!result) return
    setSaving(true)
    setSaveMessage("")
    try {
      await vocabApi.save({
        category: "Correction phrase",
        term: result.correctedText,
        meaning: result.explanation,
        example: result.originalText,
      })
      setSaveMessage("Saved to deck!")
      setTimeout(() => setSaveMessage(""), 3000)
    } catch {
      setSaveMessage("Could not save.")
    } finally {
      setSaving(false)
    }
  }

  function handleCopy() {
    if (!result) return
    navigator.clipboard.writeText(result.correctedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleClear() {
    setText("")
    setResult(null)
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 pb-12 sm:space-y-8 sm:pb-16"
    >
      <motion.div variants={itemVariants}>
        <PageHero
          eyebrow="Writing Lab"
          title="Daily Report Editor"
          description="Refine your professional or daily Korean reports. Get natural phrasing, structural rewrites, and one-tap dictionary lookups."
          stats={[
            { label: "Mode", value: "Smart Peek Enabled" },
            { label: "Focus", value: "Business & Daily" },
            { label: "AI", value: "Fluent Editor" },
          ]}
        />
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
        {/* Main Workspace */}
        <div className="space-y-6 min-w-0">
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden rounded-[1.8rem] border-border bg-card shadow-xl dark:bg-slate-900/40 backdrop-blur-md sm:rounded-[2.2rem] lg:rounded-[2.5rem]">
              <CardHeader className="border-b border-border/60 bg-accent/5 px-5 pb-4 pt-5 sm:px-6 sm:pb-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-sm ring-1 ring-emerald-500/20">
                      <WandSparkles size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black">Draft Area</CardTitle>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Paste your report or sentences below</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleClear}
                      className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Clear text"
                    >
                      <Trash2 size={16} strokeWidth={2.5} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative">
                  <Textarea
                    className="min-h-[240px] w-full resize-none rounded-none border-0 bg-transparent p-5 text-[15px] font-medium leading-7 text-foreground placeholder:text-muted-foreground/30 shadow-none focus-visible:ring-0 sm:min-h-[320px] sm:p-6 sm:text-lg"
                    placeholder="Enter Korean text here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <AnimatePresence>
                    {!text && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="pointer-events-none absolute inset-0 flex items-center justify-center p-5 text-center sm:p-6"
                      >
                        <div className="max-w-xs space-y-4 opacity-20">
                          <Languages size={48} className="mx-auto" strokeWidth={1} />
                          <p className="text-sm font-medium leading-relaxed">Paste your rough writing. AI will provide a polished native version.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col items-start gap-3 border-t border-border/60 bg-accent/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                    {text.trim().length} characters
                  </span>
                  <Button
                    onClick={handleAnalyze}
                    disabled={loading || !text.trim()}
                    className="h-11 w-full rounded-[1.15rem] bg-emerald-600 px-6 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-95 sm:h-12 sm:w-auto sm:rounded-[1.25rem] sm:px-8"
                  >
                    {loading ? (
                      <><Activity size={18} className="mr-2 animate-pulse" /> Analyzing...</>
                    ) : (
                      <><Sparkles size={18} strokeWidth={2.5} className="mr-2" /> Correct Writing</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-bold text-destructive"
            >
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="rounded-[2rem] border border-border bg-card p-6 shadow-sm dark:bg-slate-900/40 sm:p-8"
              >
                <AiGenerating
                  stages={[
                    "Reading your Korean…",
                    "Checking grammar and spelling…",
                    "Comparing natural phrasing…",
                    "Writing explanations…",
                  ]}
                />
                <div className="mt-6 space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                  <Skeleton className="h-4 w-3/5" />
                </div>
              </motion.div>
            )}
            {result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                {/* Visual Comparison Card */}
                <Card className="overflow-hidden rounded-[2.5rem] border-border bg-card shadow-2xl dark:bg-slate-900/60">
                  <div className="flex items-center justify-between border-b border-border/60 bg-emerald-500/5 px-6 py-4">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={16} strokeWidth={3} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Correction Complete</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <SpeakButton text={result.correctedText} className="h-9 w-9 rounded-xl bg-background shadow-sm ring-1 ring-border transition-transform active:scale-90" />
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={handleCopy}
                        className={cn(
                          "h-9 gap-2 rounded-xl font-bold transition-all active:scale-95 px-4",
                          copied ? "bg-emerald-500 text-white" : "bg-background shadow-sm ring-1 ring-border"
                        )}
                      >
                        {copied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} strokeWidth={2.5} />}
                        {copied ? "Copied" : "Copy Result"}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid divide-y divide-border/60 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                    <div className="group relative p-6 sm:p-8">
                      <p className="absolute left-6 top-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Original Draft</p>
                      <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/70 sm:text-lg">
                        {result.originalText}
                      </p>
                    </div>
                    <div className="group relative bg-emerald-500/[0.01] p-6 sm:p-8">
                      <p className="absolute left-6 top-4 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600/40">Polished Result (Tap words to peek)</p>
                      <SmartText 
                        text={result.correctedText} 
                        className="mt-4 text-base font-black leading-relaxed text-foreground sm:text-lg lg:text-xl" 
                      />
                    </div>
                  </div>

                  {result.englishTranslation && (
                    <div className="border-t border-border/60 bg-sky-500/[0.02] p-6 sm:px-8">
                      <div className="flex items-center gap-2">
                        <Languages size={14} className="text-sky-600 dark:text-sky-400" strokeWidth={2.5} />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">Meaning</p>
                      </div>
                      <p className="mt-3 text-sm font-bold leading-relaxed text-slate-600 dark:text-sky-200/80">
                        {result.englishTranslation}
                      </p>
                    </div>
                  )}
                </Card>

                {/* Step-by-Step Breakdown */}
                {result.changes && result.changes.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="px-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Key Improvements</h4>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                      {result.changes.map((c, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="group overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm transition-all hover:border-emerald-500/20 hover:shadow-lg dark:bg-slate-900/40"
                        >
                          <div className="flex flex-wrap items-center gap-3 border-b border-border/60 bg-accent/5 px-5 py-4">
                            <span className="rounded-lg bg-red-500/10 px-3 py-1.5 text-[13px] font-bold text-red-600/80 line-through">
                              {c.original}
                            </span>
                            <ArrowRight size={14} className="shrink-0 text-muted-foreground/30" strokeWidth={3} />
                            <SmartText 
                              text={c.corrected} 
                              className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-[13px] font-black text-emerald-600 dark:text-emerald-400" 
                            />
                          </div>
                          <div className="p-5">
                            {c.englishMeaning && (
                              <div className="mb-2 flex items-center gap-2">
                                <Languages size={12} className="shrink-0 text-sky-500/60" strokeWidth={2.5} />
                                <p className="text-[12px] font-bold text-sky-600/80 dark:text-sky-400/80">{c.englishMeaning}</p>
                              </div>
                            )}
                            <p className="text-[13px] font-medium leading-relaxed text-muted-foreground">{c.reason}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grammar & Why */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <Card className="rounded-[2rem] border border-border bg-card shadow-sm dark:bg-slate-900/40">
                    <CardHeader className="pb-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Logic & Tone</p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[13px] font-medium leading-relaxed text-foreground/80">{result.explanation}</p>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[2rem] border border-border bg-card shadow-sm dark:bg-slate-900/40">
                    <CardHeader className="pb-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Grammar Focus</p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2.5">
                        {result.grammarPoints.map((point, i) => (
                          <li key={i} className="flex gap-2.5">
                            <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[13px] font-bold text-foreground/80">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Save Section */}
                <div className="flex items-center justify-between rounded-[2rem] border border-border bg-emerald-500/5 px-8 py-6">
                  <div>
                    <h4 className="text-sm font-black text-foreground">Save this rewrite</h4>
                    <p className="text-xs font-medium text-muted-foreground">Add the polished report to your vocabulary deck.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <AnimatePresence>
                      {saveMessage && (
                        <motion.p 
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400"
                        >
                          {saveMessage}
                        </motion.p>
                      )}
                    </AnimatePresence>
                    <Button
                      type="button"
                      onClick={handleSavePhrase}
                      disabled={saving}
                      className="h-12 rounded-xl bg-primary px-6 text-sm font-black text-primary-foreground shadow-xl active:scale-95"
                    >
                      <BookmarkPlus size={16} className="mr-2" strokeWidth={2.5} />
                      {saving ? "Saving..." : "Save to Vocab"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Guidance */}
        <div className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="rounded-[2rem] border-border bg-card shadow-xl dark:bg-slate-900/40">
              <CardHeader className="border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 shadow-sm ring-1 ring-sky-500/20">
                    <Lightbulb size={18} strokeWidth={2.5} />
                  </div>
                  <CardTitle className="text-base font-black uppercase tracking-tight">Writing Tips</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-5">
                  {[
                    { label: "Interactive Peek", text: "Tap any Korean word in the result to see its definition and Hanja.", icon: Sparkles, color: "text-amber-500" },
                    { label: "Daily Journaling", text: "Consistency is better than length. Even 3 sentences a day helps.", icon: CheckCircle2, color: "text-emerald-500" },
                    { label: "Compare Layers", text: "Notice how the AI moves verbs to sound more natural.", icon: Languages, color: "text-sky-500" },
                  ].map((tip) => (
                    <div key={tip.label} className="flex gap-3">
                      <div className={cn("mt-0.5 shrink-0", tip.color)}>
                        <tip.icon size={16} strokeWidth={3} />
                      </div>
                      <div>
                        <h4 className="text-[12px] font-black text-foreground uppercase tracking-wider">{tip.label}</h4>
                        <p className="mt-1 text-[12px] font-medium leading-relaxed text-muted-foreground">{tip.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="px-2">
              <div className="flex items-center gap-2 mb-4">
                <History size={14} className="text-muted-foreground/40" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Sample Scenarios</h4>
              </div>
              <div className="grid gap-2">
                {starterPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setText(prompt)}
                    className="group rounded-2xl border border-border bg-accent/5 p-4 text-left transition-all hover:bg-background hover:shadow-md active:scale-[0.98]"
                  >
                    <p className="line-clamp-2 text-xs font-bold leading-relaxed text-foreground/60 group-hover:text-foreground">
                      {prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
