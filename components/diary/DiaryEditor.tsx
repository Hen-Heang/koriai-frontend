"use client"

import { useState } from "react"
import { BookOpenText, Sparkles, WandSparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

type DiaryEditorProps = {
  initialValue?: string
  onAnalyze: (content: string) => void
}

const diaryPrompts = [
  "오늘 가장 기억에 남는 일을 써 보세요.",
  "오늘 누구를 만났고 어떤 대화를 했는지 적어 보세요.",
  "오늘 기분이 어땠는지 이유와 함께 써 보세요.",
]

export function DiaryEditor({ initialValue = "", onAnalyze }: DiaryEditorProps) {
  const [value, setValue] = useState(initialValue)

  return (
    <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-xl dark:bg-slate-900/60 dark:backdrop-blur-sm">
      <CardHeader className="border-b border-border/80 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Daily Korean Diary</CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Capture your day in Korean. The AI will rewrite tone, grammar, and word
              choice while keeping your meaning.
            </p>
          </div>
          <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:flex">
            <BookOpenText size={20} strokeWidth={1.9} />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {diaryPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setValue(prompt)}
              aria-label={`Use prompt: ${prompt}`}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-left text-xs text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary active:scale-95"
            >
              Use prompt
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="rounded-2xl border border-border bg-accent/10 p-3 shadow-sm transition-all focus-within:border-primary/40 focus-within:bg-accent/20 dark:bg-white/5">
          <Textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Write about what happened today in Korean..."
            aria-label="Diary content"
            className="min-h-64 resize-none rounded-xl border-0 bg-transparent px-2 py-1 text-base leading-relaxed text-foreground placeholder:text-muted-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-lg"
          />
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
            <span>{value.trim().length} characters</span>
            <span className="hidden sm:inline">Short paragraphs are easier to review and reuse.</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3 text-xs text-muted-foreground">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/12 dark:text-emerald-300">
              <Sparkles size={16} strokeWidth={1.9} />
            </div>
            <p className="max-w-xs leading-5">
              Write naturally first. The AI can improve grammar, tone, and vocabulary
              after you finish your draft.
            </p>
          </div>
          <Button
            onClick={() => onAnalyze(value)}
            disabled={!value.trim()}
            aria-label="Analyze diary entry"
            className="h-11 w-full rounded-2xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-lg transition-all hover:bg-emerald-500 active:scale-95 sm:w-auto dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
          >
            <WandSparkles size={16} strokeWidth={1.9} />
            Analyze diary
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
