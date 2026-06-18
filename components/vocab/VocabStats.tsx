"use client"

import { motion } from "motion/react"
import { Flame, Sparkles, Target, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { computeVocabStats } from "@/lib/vocab-review"
import type { VocabItem } from "@/lib/types"

type VocabStatsProps = {
  words: VocabItem[]
  dueCount: number
}

const BUCKETS = [
  { key: "weak", label: "Weak", bar: "bg-red-500", text: "text-red-500", dot: "bg-red-500" },
  { key: "learning", label: "Learning", bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  { key: "mastered", label: "Mastered", bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
] as const

export function VocabStats({ words, dueCount }: VocabStatsProps) {
  const stats = computeVocabStats(words)

  if (stats.total === 0) return null

  const tiles = [
    { label: "Due Today", value: dueCount, icon: Flame, accent: "text-emerald-600" },
    { label: "Total Words", value: stats.total, icon: Sparkles, accent: "text-foreground" },
    { label: "Mastered", value: stats.mastered, icon: Target, accent: "text-emerald-600" },
    { label: "Avg Mastery", value: `${stats.averageMastery}%`, icon: TrendingUp, accent: "text-foreground" },
  ]

  return (
    <div className="space-y-4 rounded-[1.8rem] border border-border bg-card p-5 shadow-sm dark:bg-slate-900/40 sm:p-6">
      {/* Quick tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="rounded-2xl border border-border/60 bg-accent/5 p-3.5 dark:bg-white/[0.02]">
            <Icon size={15} strokeWidth={2.5} className={cn("mb-2", accent)} />
            <p className={cn("text-2xl font-bold tabular-nums tracking-tight", accent)}>{value}</p>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground/40">{label}</p>
          </div>
        ))}
      </div>

      {/* Mastery distribution bar */}
      <div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-accent/15">
          {BUCKETS.map(({ key, bar }) => {
            const count = stats[key]
            if (count === 0) return null
            return (
              <motion.div
                key={key}
                initial={{ width: 0 }}
                animate={{ width: `${(count / stats.total) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={cn("h-full", bar)}
              />
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {BUCKETS.map(({ key, label, text, dot }) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", dot)} />
              <span className="text-xs font-bold text-muted-foreground/60">{label}</span>
              <span className={cn("text-xs font-bold tabular-nums", text)}>{stats[key]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
