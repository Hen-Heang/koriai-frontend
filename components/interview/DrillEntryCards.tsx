"use client"

import Link from "next/link"
import { ArrowRight, Headphones, Mic } from "lucide-react"

// Entry points to the two daily drill pages, shown on the interview select
// screen. Mock interviews are the weekly test; these are the daily reps.
const DRILLS = [
  {
    href: "/interview/speaking",
    label: "Speaking Drill",
    description: "One question at a time — answer out loud, get scored instantly.",
    icon: Mic,
    tone: "blue" as const,
  },
  {
    href: "/interview/listening",
    label: "Listening Drill",
    description: "Audio only — understand the question before you see it.",
    icon: Headphones,
    tone: "violet" as const,
  },
]

export function DrillEntryCards() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {DRILLS.map((drill) => (
        <Link
          key={drill.href}
          href={drill.href}
          className="group rounded-[1.5rem] border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md active:scale-[0.99] dark:bg-slate-900/40 sm:rounded-3xl"
        >
          <div className="flex items-center justify-between gap-2">
            <div
              className={
                drill.tone === "blue"
                  ? "flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600"
                  : "flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600"
              }
            >
              <drill.icon size={20} strokeWidth={2.5} />
            </div>
            <ArrowRight
              size={18}
              className="text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
            />
          </div>
          <p className="mt-3 text-lg font-bold text-foreground">{drill.label}</p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-muted-foreground">
            {drill.description}
          </p>
        </Link>
      ))}
    </div>
  )
}
