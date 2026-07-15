import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const ACCENTS = {
  blue: {
    glow: "bg-blue-500/10",
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    border: "hover:border-blue-500/40",
    eyebrow: "text-blue-600 dark:text-blue-400",
    cta: "text-blue-600 dark:text-blue-400",
  },
  emerald: {
    glow: "bg-emerald-500/10",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    border: "hover:border-emerald-500/40",
    eyebrow: "text-emerald-600 dark:text-emerald-400",
    cta: "text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    glow: "bg-amber-500/10",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    border: "hover:border-amber-500/40",
    eyebrow: "text-amber-600 dark:text-amber-400",
    cta: "text-amber-600 dark:text-amber-400",
  },
  violet: {
    glow: "bg-violet-500/10",
    iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    border: "hover:border-violet-500/40",
    eyebrow: "text-violet-600 dark:text-violet-400",
    cta: "text-violet-600 dark:text-violet-400",
  },
} as const

export interface WorkspacePosterStat {
  label: string
  value: string
}

// One of the big "pick a lane" entry points on Home — Korean Learning, Goal
// Setting, Progress, and Growth. The whole card deep-links via getLastVisited so it
// carries forward the same "continue where you left off" behavior the old
// ContinueCards had, just with a real-data summary instead of a bare label.
export function WorkspacePosterCard({
  href,
  eyebrow,
  title,
  description,
  icon: Icon,
  accentColor,
  stats,
  cta,
}: {
  href: string
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
  accentColor: keyof typeof ACCENTS
  stats: WorkspacePosterStat[]
  cta: string
}) {
  const accent = ACCENTS[accentColor]

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm transition-colors dark:bg-slate-900/40 dark:backdrop-blur-xl sm:p-8",
        accent.border
      )}
    >
      <div className={cn("pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full blur-[100px]", accent.glow)} />

      <div className="relative z-10 flex flex-1 flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", accent.iconBg)}>
            <Icon size={22} strokeWidth={2} />
          </div>
          <p className={cn("text-xs font-semibold uppercase tracking-wide", accent.eyebrow)}>{eyebrow}</p>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h2>
          <p className="text-sm font-medium leading-relaxed text-muted-foreground">{description}</p>
        </div>

        <div className="mt-auto flex flex-wrap gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border bg-background/50 px-4 py-3 dark:bg-white/5"
            >
              <p className="text-lg font-bold tracking-tight text-foreground">{stat.value}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className={cn("flex items-center gap-1.5 text-sm font-semibold", accent.cta)}>
          {cta}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  )
}
