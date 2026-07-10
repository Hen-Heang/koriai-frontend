"use client"

import Link from "next/link"
import { ArrowRight, Sparkles, Target } from "lucide-react"
import { getLastVisited } from "@/lib/last-visited"

// "Continue where you left off" — deep-links back into whichever Learning or
// Productivity route the user was last on (tracked by the shell layout),
// falling back to each workspace's primary dashboard.
export function ContinueCards() {
  const learningHref = getLastVisited("learning", "/practice")
  const productivityHref = getLastVisited("productivity", "/dashboard")

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link
        href={learningHref}
        className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-blue-500/40 dark:bg-slate-900/40"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Sparkles size={20} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/60">Continue learning</p>
          <p className="truncate text-sm font-bold text-foreground">Pick up where you left off</p>
        </div>
        <ArrowRight size={16} className="shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-500" />
      </Link>

      <Link
        href={productivityHref}
        className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-emerald-500/40 dark:bg-slate-900/40"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Target size={20} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/60">Continue planning</p>
          <p className="truncate text-sm font-bold text-foreground">Back to your goals & tasks</p>
        </div>
        <ArrowRight size={16} className="shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-500" />
      </Link>
    </div>
  )
}
