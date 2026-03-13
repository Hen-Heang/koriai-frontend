"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

type DiaryEditorProps = {
  initialValue?: string
  onAnalyze: (content: string) => void
}

export function DiaryEditor({ initialValue = "", onAnalyze }: DiaryEditorProps) {
  const [value, setValue] = useState(initialValue)

  return (
    <Card className="rounded-[2rem] border-border/60 bg-white/90 shadow-lg shadow-slate-950/5 dark:border-sky-400/10 dark:bg-[linear-gradient(180deg,rgba(8,22,48,0.96),rgba(5,12,28,0.98))]">
      <CardHeader>
        <CardTitle className="text-xl dark:text-white">Daily Korean Diary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Write about what happened today in Korean."
          className="min-h-64 resize-none rounded-3xl border-border/70 bg-slate-50/70 dark:border-white/10 dark:bg-slate-900/75 dark:text-slate-100 dark:placeholder:text-slate-400"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground dark:text-slate-400">
            Write naturally. The AI can rewrite tone, grammar, and vocabulary.
          </p>
          <Button
            onClick={() => onAnalyze(value)}
            className="dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300"
          >
            Analyze diary
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
