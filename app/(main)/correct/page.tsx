"use client"

import { useState } from "react"
import { CheckCircle2, Languages, Lightbulb, Sparkles, WandSparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { SpeakButton } from "@/components/ui/SpeakButton"
import { correctionApi } from "@/lib/api"

type CorrectionResult = {
  originalText: string
  correctedText: string
  explanation: string
  grammarPoints: string[]
}

const starterPrompts = [
  "오늘 친구를 만나서 밥을 먹었어요 그리고 영화 봤어요.",
  "저는 어제 학교에 갔어요 친구랑.",
  "한국어를 더 자연스럽게 말하고 싶어서 매일 연습해요.",
]

export default function CorrectPage() {
  const [text, setText] = useState("")
  const [result, setResult] = useState<CorrectionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleAnalyze() {
    if (!text.trim()) return
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const data = await correctionApi.check(text)
      setResult(data)
    } catch {
      setError("Failed to analyze. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 lg:space-y-7">
      <div className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Correction
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Sentence correction workspace
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          Paste Korean writing and get a cleaner rewrite, explanation, and grammar
          takeaways that are easier to review.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <Card className="overflow-hidden rounded-[2rem] border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.95))] shadow-xl shadow-slate-950/5 ring-white/60 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(9,14,27,0.98))]">
          <CardHeader className="border-b border-slate-200/70 pb-5 dark:border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">Submit writing</CardTitle>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Best for one sentence to one short paragraph. Longer input works, but
                  shorter text usually gets sharper explanations.
                </p>
              </div>
              <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-600 dark:flex dark:bg-emerald-400/12 dark:text-emerald-300">
                <WandSparkles size={20} strokeWidth={1.9} />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setText(prompt)}
                  className="max-w-60 truncate rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-white/10 dark:bg-white/4 dark:text-slate-300 dark:hover:border-emerald-400/20 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200"
                  title={prompt}
                >
                  {prompt}
                </button>
              ))}
            </div>
        </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="rounded-[1.6rem] border border-slate-200/80 bg-white/70 p-3 shadow-sm dark:border-white/10 dark:bg-white/3">
              <Textarea
                className="min-h-56 resize-none rounded-[1.25rem] border-0 bg-transparent px-2 py-1 text-base leading-8 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:min-h-64"
                placeholder="Paste a Korean sentence or paragraph to get corrections and explanations."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200/70 pt-3 text-xs text-muted-foreground dark:border-white/10">
                <span>{text.trim().length} characters</span>
                <span>Clear, natural Korean gets the best rewrite.</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleAnalyze}
                disabled={loading || !text.trim()}
                className="h-11 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                <Sparkles size={16} strokeWidth={1.9} />
                {loading ? "Analyzing..." : "Analyze sentence"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setText("")
                  setResult(null)
                  setError("")
                }}
                disabled={loading || (!text && !result)}
                className="h-11 rounded-2xl"
              >
                Reset
              </Button>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {result ? (
              <div className="space-y-4 rounded-[1.6rem] border border-emerald-200/70 bg-emerald-50/60 p-4 text-sm dark:border-emerald-400/15 dark:bg-emerald-400/8">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 size={16} strokeWidth={2} />
                  <p className="font-medium">Analysis ready</p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl bg-white/80 p-4 dark:bg-white/4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Original
                    </p>
                    <p className="mt-2 leading-7 text-muted-foreground">
                      {result.originalText}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-4 dark:bg-white/4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Corrected
                      </p>
                      <SpeakButton text={result.correctedText} />
                    </div>
                    <p className="mt-2 leading-7 text-emerald-700 dark:text-emerald-300">
                      {result.correctedText}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl bg-white/80 p-4 dark:bg-white/4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Explanation
                  </p>
                  <p className="mt-2 leading-7 text-muted-foreground">{result.explanation}</p>
                </div>
                {result.grammarPoints.length > 0 && (
                  <div className="rounded-2xl bg-white/80 p-4 dark:bg-white/4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Grammar points
                    </p>
                    <ul className="mt-3 space-y-2">
                      {result.grammarPoints.map((point, i) => (
                        <li key={i} className="flex gap-2 text-muted-foreground">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                          <span className="leading-7">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[1.6rem] border border-dashed border-slate-200 bg-slate-50/70 p-5 dark:border-white/10 dark:bg-white/3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300">
                    <Lightbulb size={18} strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">What you will get</p>
                    <p className="mt-1 text-sm leading-7 text-muted-foreground">
                      A corrected version, a plain-language explanation, and key grammar
                      notes you can review later.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-[2rem] border-border/60 bg-white/90 shadow-lg shadow-slate-950/5 dark:bg-slate-900/90">
            <CardHeader>
              <CardTitle className="text-lg">Tips for better results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <Languages className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-300" size={18} />
                <p>Write naturally first. The model can improve awkward phrasing better than over-edited text.</p>
              </div>
              <div className="flex gap-3">
                <Sparkles className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-300" size={18} />
                <p>One idea per sentence usually produces more precise explanations.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-300" size={18} />
                <p>Use corrections as study notes. Compare the original and corrected versions line by line.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
