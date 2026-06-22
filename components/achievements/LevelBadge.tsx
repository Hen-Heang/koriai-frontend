"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Trophy } from "lucide-react"

import { achievementsApi } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { LevelInfo } from "@/lib/types"

// Compact XP/level pill surfaced in the shell header — Achievements lives
// behind a single click everywhere, not just on its own hidden-away page.
export function LevelBadge({ className }: { className?: string }) {
  const [level, setLevel] = useState<LevelInfo | null>(null)

  useEffect(() => {
    let active = true
    achievementsApi
      .getSummary()
      .then((summary) => {
        if (active) setLevel(summary.level)
      })
      .catch(() => {
        /* badge is decorative — fail silently */
      })
    return () => {
      active = false
    }
  }, [])

  if (!level) return null

  return (
    <Link
      href="/achievements"
      title={`Level ${level.level} · ${level.totalXp} XP`}
      className={cn(
        "flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-amber-700 transition-transform hover:scale-105 active:scale-95 dark:text-amber-400",
        className
      )}
    >
      <Trophy size={13} strokeWidth={2.5} />
      <span className="text-[11px] font-bold uppercase tracking-wide text-nowrap">
        Lv {level.level} · {level.totalXp} XP
      </span>
    </Link>
  )
}
