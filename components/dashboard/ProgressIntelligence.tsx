"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, BookOpen, CalendarDays, CheckCircle2, RotateCcw, Target } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { useGoals } from "@/hooks/useGoals"
import { practiceApi } from "@/lib/api"
import { calculateGoalDeadlineInfo } from "@/lib/goals"
import type { PracticeToday } from "@/lib/types"

interface Insight {
  icon: LucideIcon
  label: string
  detail: string
  href: string
  weight: number
}

// "Progress Intelligence" — ranks what genuinely needs attention from data
// that already exists (vocab/correction due-counts, daily phrase, overdue
// goals) instead of a fixed checklist. There's no backend per-skill accuracy
// breakdown (e.g. "weak at particles") to rank against, so this sticks to
// real due-counts rather than fabricating a weakness score.
export function ProgressIntelligence() {
  const [today, setToday] = useState<PracticeToday | null>(null)
  const [loading, setLoading] = useState(true)
  const { sortedGoals, isLoading: goalsLoading } = useGoals()

  useEffect(() => {
    let active = true
    practiceApi
      .getToday()
      .then((data) => {
        if (active) setToday(data)
      })
      .catch(() => {
        /* this panel is a bonus — fail silently */
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const overdueGoals = useMemo(
    () =>
      sortedGoals.filter(
        (g) => g.status !== "completed" && g.status !== "archived" && calculateGoalDeadlineInfo(g).status === "overdue"
      ).length,
    [sortedGoals]
  )

  const insights: Insight[] = useMemo(() => {
    const items: Insight[] = []
    if (today && today.dueVocabCount > 0) {
      items.push({
        icon: BookOpen,
        label: "Vocabulary",
        detail: `${today.dueVocabCount} card${today.dueVocabCount === 1 ? "" : "s"} due for review`,
        href: "/vocab",
        weight: today.dueVocabCount,
      })
    }
    if (today && today.dueCorrectionsCount > 0) {
      items.push({
        icon: RotateCcw,
        label: "Mistakes",
        detail: `${today.dueCorrectionsCount} repeated mistake${today.dueCorrectionsCount === 1 ? "" : "s"} to clear`,
        href: "/chat?mode=corrections",
        weight: today.dueCorrectionsCount,
      })
    }
    if (overdueGoals > 0) {
      items.push({
        icon: AlertTriangle,
        label: "Goals",
        detail: `${overdueGoals} goal${overdueGoals === 1 ? "" : "s"} overdue`,
        href: "/goals",
        weight: overdueGoals * 2, // overdue goals are the most urgent signal
      })
    }
    if (today && !today.dailyPhrase.learned) {
      items.push({
        icon: CalendarDays,
        label: "Daily Phrase",
        detail: "Today's phrase isn't learned yet",
        href: "/practice",
        weight: 1,
      })
    }
    return items.sort((a, b) => b.weight - a.weight)
  }, [today, overdueGoals])

  const ready = !loading && !goalsLoading

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm dark:bg-slate-900/40">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
        <Target size={14} strokeWidth={2.5} />
        Needs Attention
      </h3>

      {!ready ? (
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-4">
          <CheckCircle2 size={20} className="shrink-0 text-emerald-500" strokeWidth={2.5} />
          <p className="text-sm font-bold text-foreground">All caught up — nice work.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {insights.slice(0, 4).map((insight, i) => (
            <Link
              key={insight.label}
              href={insight.href}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-background/40 px-4 py-3 transition-colors hover:bg-accent/40"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent text-[13px] font-bold text-muted-foreground transition-colors group-hover:bg-blue-500 group-hover:text-white">
                {i + 1}
              </div>
              <insight.icon size={16} className="shrink-0 text-muted-foreground/60" strokeWidth={2.5} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {insight.label}
                </p>
                <p className="truncate text-xs font-medium text-muted-foreground/70">{insight.detail}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
