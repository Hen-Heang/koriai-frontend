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
    <Card className="overflow-hidden rounded-[2rem] border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.95))] shadow-xl shadow-slate-950/5 ring-white/60 dark:border-sky-400/10 dark:bg-[linear-gradient(180deg,rgba(8,22,48,0.96),rgba(5,12,28,0.98))]">
      <CardHeader className="border-b border-slate-200/70 pb-5 dark:border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl dark:text-white">Daily Korean Diary</CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted-foreground dark:text-slate-300">
              Capture your day in Korean. The AI will rewrite tone, grammar, and word
              choice while keeping your meaning.
            </p>
          </div>
          <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500/12 text-sky-600 dark:flex dark:bg-sky-400/12 dark:text-sky-300">
            <BookOpenText size={20} strokeWidth={1.9} />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {diaryPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setValue(prompt)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs text-slate-600 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-sky-400/20 dark:hover:bg-sky-400/10 dark:hover:text-sky-200"
            >
              Use prompt
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="rounded-[1.6rem] border border-slate-200/80 bg-white/70 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <Textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Write about what happened today in Korean."
            className="min-h-64 resize-none rounded-[1.25rem] border-0 bg-transparent px-2 py-1 text-base leading-8 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-slate-100 dark:placeholder:text-slate-400"
          />
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200/70 pt-3 text-xs text-muted-foreground dark:border-white/10 dark:text-slate-400">
            <span>{value.trim().length} characters</span>
            <span>Short paragraphs are easier to review and reuse.</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3 text-xs text-muted-foreground dark:text-slate-400">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/12 dark:text-emerald-300">
              <Sparkles size={16} strokeWidth={1.9} />
            </div>
            <p className="max-w-xs leading-6">
              Write naturally first. The AI can improve grammar, tone, and vocabulary
              after you finish your draft.
            </p>
          </div>
          <Button
            onClick={() => onAnalyze(value)}
            disabled={!value.trim()}
            className="h-11 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-500 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300"
          >
            <WandSparkles size={16} strokeWidth={1.9} />
            Analyze diary
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
