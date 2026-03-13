"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { correctionApi } from "@/lib/api"

type CorrectionResult = {
  originalText: string
  correctedText: string
  explanation: string
  grammarPoints: string[]
}

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
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Correction
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Sentence correction workspace
        </h1>
      </div>

      <Card className="rounded-[2rem] border-border/60 bg-white/90 shadow-lg shadow-slate-950/5">
        <CardHeader>
          <CardTitle className="text-xl">Submit writing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            className="min-h-48 resize-none rounded-3xl"
            placeholder="Paste a Korean sentence or paragraph to get corrections and explanations."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={handleAnalyze} disabled={loading || !text.trim()}>
              {loading ? "Analyzing…" : "Analyze sentence"}
            </Button>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {result && (
            <div className="space-y-4 rounded-3xl bg-muted/70 p-4 text-sm">
              <div>
                <p className="font-medium text-foreground">Original</p>
                <p className="mt-1 text-muted-foreground">{result.originalText}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Corrected</p>
                <p className="mt-1 text-emerald-700 dark:text-emerald-400">{result.correctedText}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Explanation</p>
                <p className="mt-1 text-muted-foreground">{result.explanation}</p>
              </div>
              {result.grammarPoints.length > 0 && (
                <div>
                  <p className="font-medium text-foreground">Grammar points</p>
                  <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                    {result.grammarPoints.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}