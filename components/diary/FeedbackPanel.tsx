import { CheckCircle2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DiaryFeedback } from "@/lib/types"

export function FeedbackPanel({ items }: { items: DiaryFeedback[] }) {
  return (
    <Card className="rounded-[2rem] border-border/60 bg-white/90 shadow-lg shadow-slate-950/5 dark:border-violet-400/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(6,10,24,0.98))]">
      <CardHeader>
        <CardTitle className="text-xl dark:text-white">AI Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-3xl border border-border/60 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.06]"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2
                size={20}
                strokeWidth={1.5}
                className="text-emerald-600 dark:text-emerald-300"
              />
              <p className="font-medium text-foreground dark:text-white">{item.title}</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground dark:text-slate-300">
              {item.description}
            </p>
            {item.example ? (
              <p className="mt-2 rounded-2xl bg-white px-3 py-2 text-sm text-foreground dark:bg-slate-900/80 dark:text-slate-100">
                {item.example}
              </p>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
