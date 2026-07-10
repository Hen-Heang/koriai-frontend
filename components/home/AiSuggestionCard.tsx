import Link from "next/link"
import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getStudyFocus } from "@/lib/study-focus"
import type { DashboardStats } from "@/lib/types"

// Reuses the same personal-plan logic the old Dashboard hero used
// (lib/study-focus.ts) so Home's "AI suggestion" isn't a second, diverging
// recommendation engine.
export function AiSuggestionCard({ stats }: { stats: DashboardStats }) {
  const focus = getStudyFocus(stats)

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-slate-950 p-6 text-white shadow-sm lg:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/15 blur-[90px]" />
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-blue-300">
          <Sparkles size={12} />
          AI suggestion
        </div>
        <h3 className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">{focus.title}</h3>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">{focus.description}</p>
        <Button
          asChild
          size="lg"
          className="mt-5 h-11 rounded-xl bg-blue-600 px-6 font-semibold hover:bg-blue-500"
        >
          <Link href={focus.ctaHref}>{focus.ctaLabel}</Link>
        </Button>
      </div>
    </div>
  )
}
