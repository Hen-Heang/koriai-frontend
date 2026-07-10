"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Circle } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { isScenarioDoneToday } from "@/lib/daily-mission"
import { practiceApi } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { PracticeToday } from "@/lib/types"

// Thin Home-surface read of the same "Today's Mission" data /practice owns —
// intelligently surfaces due vocab/mistakes/phrase/scenario instead of
// making the user hunt for each one.
export function MissionCard() {
  const [data, setData] = useState<PracticeToday | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    practiceApi
      .getToday()
      .then((res) => {
        if (active) setData(res)
      })
      .catch(() => {
        /* Home surface is a bonus view of /practice data — fail silently */
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:bg-slate-900/40">
        <Skeleton className="h-4 w-32" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const missions = [
    {
      key: "vocab",
      label: data.dueVocabCount > 0 ? `${data.dueVocabCount} vocab cards due` : "No vocab due today",
      done: data.dueVocabCount === 0,
      href: "/vocab",
    },
    {
      key: "phrase",
      label: "Learn today's phrase",
      done: data.dailyPhrase.learned,
      href: "/practice#daily-phrase",
    },
    {
      key: "mistakes",
      label: data.dueCorrectionsCount > 0 ? `${data.dueCorrectionsCount} mistakes to review` : "No mistakes due today",
      done: data.dueCorrectionsCount === 0,
      href: "/chat?mode=corrections",
    },
    {
      key: "scenario",
      label: "Practice today's scenario",
      done: isScenarioDoneToday(),
      href: "/practice#todays-mission",
    },
  ]
  const completedCount = missions.filter((m) => m.done).length

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:bg-slate-900/40">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
          Today&apos;s Mission
        </h3>
        <span className="text-xs font-bold text-foreground">
          {completedCount}/{missions.length}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-accent/40">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${(completedCount / missions.length) * 100}%` }}
        />
      </div>
      <ul className="mt-5 space-y-3">
        {missions.map((m) => (
          <li key={m.key}>
            <Link href={m.href} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              {m.done ? (
                <CheckCircle2 size={18} className="shrink-0 text-emerald-500" strokeWidth={2.5} />
              ) : (
                <Circle size={18} className="shrink-0 text-muted-foreground/60" strokeWidth={2.5} />
              )}
              <span className={cn("text-sm font-bold", m.done ? "text-muted-foreground/60 line-through" : "text-foreground")}>
                {m.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
