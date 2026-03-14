import { CheckCircle2, Sparkles } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DiaryFeedback } from "@/lib/types"

export function FeedbackPanel({ items }: { items: DiaryFeedback[] }) {
  const hasItems = items.length > 0

  return (
    <Card className="rounded-[2rem] border-border/60 bg-white/90 shadow-lg shadow-slate-950/5 dark:border-violet-400/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(6,10,24,0.98))]">
      <CardHeader className="border-b border-slate-200/70 pb-5 dark:border-white/10">
        <CardTitle className="text-2xl dark:text-white">AI Feedback</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground dark:text-slate-300">
          Review the rewritten version first, then scan the notes for what changed and
          why.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {hasItems ? (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-[1.6rem] border border-border/60 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.06]"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={20}
                  strokeWidth={1.5}
                  className="text-emerald-600 dark:text-emerald-300"
                />
                <p className="font-medium text-foreground dark:text-white">{item.title}</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground dark:text-slate-300">
                {item.description}
              </p>
              {item.example ? (
                <p className="mt-3 rounded-2xl bg-white px-3 py-3 text-sm leading-7 text-foreground dark:bg-slate-900/80 dark:text-slate-100">
                  {item.example}
                </p>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-[1.6rem] border border-dashed border-border/70 bg-slate-50/70 p-5 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:bg-violet-400/12 dark:text-violet-300">
                <Sparkles size={18} strokeWidth={1.8} />
              </div>
              <div>
                <p className="font-medium text-foreground dark:text-white">Your feedback will appear here</p>
                <p className="mt-1 text-sm leading-7 text-muted-foreground dark:text-slate-300">
                  Submit a diary entry to get a corrected rewrite, coaching notes, and
                  mood or tone observations.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
