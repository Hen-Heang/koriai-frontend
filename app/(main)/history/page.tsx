"use client"

import { useState, useEffect } from "react"
import {
  ArrowRight,
  Brain,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ScrollText,
  Languages,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { PageHero } from "@/components/app/page-hero"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { SpeakButton } from "@/components/ui/SpeakButton"
import { correctionApi, progressApi } from "@/lib/api"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type CorrectionEntry = {
  id: string
  createdAt: string
  originalText: string
  correctedText: string
  grammarPoints: string[]
  explanation: string
  englishTranslation?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

// Aggregate grammar points from all corrections, sorted by frequency
function aggregateGrammar(entries: CorrectionEntry[]) {
  const counts: Record<string, number> = {}
  for (const entry of entries) {
    for (const point of entry.grammarPoints ?? []) {
      const key = point.trim()
      if (key) counts[key] = (counts[key] ?? 0) + 1
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GrammarTracker({ entries }: { entries: CorrectionEntry[] }) {
  const patterns = aggregateGrammar(entries)
  const max = patterns[0]?.[1] ?? 1

  if (patterns.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <Brain size={36} className="text-muted-foreground/30" strokeWidth={1.5} />
        <p className="text-sm font-bold text-muted-foreground/50">No patterns yet — keep correcting!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {patterns.map(([point, count], i) => (
        <motion.div
          key={point}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          className="group space-y-1.5"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-bold leading-snug text-foreground/80 line-clamp-2">{point}</span>
            <span className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
              count >= 4 ? "bg-red-500/10 text-red-600 dark:text-red-400" :
              count >= 2 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
              "bg-slate-500/10 text-slate-500"
            )}>
              ×{count}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(count / max) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.04 + 0.1 }}
              className={cn(
                "h-full rounded-full",
                count >= 4 ? "bg-red-500" :
                count >= 2 ? "bg-amber-500" :
                "bg-slate-400"
              )}
            />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function PracticeCalendar({ month, activeDays, onPrev, onNext }: {
  month: Date
  activeDays: Set<number>
  onPrev: () => void
  onNext: () => void
}) {
  const year = month.getFullYear()
  const m = month.getMonth()
  const days = getDaysInMonth(year, m)
  const firstDay = getFirstDayOfMonth(year, m)
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === m

  const monthName = month.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onPrev} className="h-9 w-9 rounded-xl">
          <ChevronLeft size={18} strokeWidth={2.5} />
        </Button>
        <span className="text-sm font-bold text-foreground">{monthName}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          disabled={isCurrentMonth}
          className="h-9 w-9 rounded-xl"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {weekdays.map((d) => (
          <div key={d} className="py-1 text-center text-[11px] font-bold uppercase tracking-wide text-muted-foreground/40">
            {d}
          </div>
        ))}

        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1
          const isActive = activeDays.has(day)
          const isToday = isCurrentMonth && today.getDate() === day

          return (
            <div
              key={day}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-xl text-[13px] font-bold",
                isActive
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                  : isToday
                    ? "ring-2 ring-blue-500/40 text-blue-600 font-bold"
                    : "text-muted-foreground/50"
              )}
            >
              {day}
            </div>
          )
        })}
      </div>

      {/* Entry count */}
      <p className="text-center text-xs font-bold text-muted-foreground/50">
        {activeDays.size} {activeDays.size === 1 ? "practice day" : "practice days"} this month
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
} as const

export default function HistoryPage() {
  const [corrections, setCorrections] = useState<CorrectionEntry[]>([])
  const [loadingCorrections, setLoadingCorrections] = useState(true)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [activeDays, setActiveDays] = useState<Set<number>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    correctionApi
      .history(30)
      .then((data) => setCorrections(Array.isArray(data) ? data : []))
      .catch(() => setCorrections([]))
      .finally(() => setLoadingCorrections(false))
  }, [])

  function prevMonth() {
    setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  }

  function nextMonth() {
    const now = new Date()
    const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
    if (next <= now) {
      setCalendarMonth(next)
    }
  }

  useEffect(() => {
    const month = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}`
    let cancelled = false
    progressApi
      .getActivityDays(month)
      .then((days) => {
        if (!cancelled) setActiveDays(new Set(days.map((d) => Number(d.slice(8)))))
      })
      .catch(() => { if (!cancelled) setActiveDays(new Set()) })
    return () => { cancelled = true }
  }, [calendarMonth])

  const grammarPatterns = aggregateGrammar(corrections)

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
      className="space-y-6 pb-12 sm:space-y-8 sm:pb-16"
    >
      <motion.div variants={itemVariants}>
        <PageHero
          eyebrow="Progress Lab"
          title="Your Study History"
          description="Track your past corrections, see your practice days, and spot recurring grammar patterns."
          stats={[
            { label: "Corrections", value: String(corrections.length) },
            { label: "Patterns Found", value: String(grammarPatterns.length) },
            { label: "Practice Days", value: String(activeDays.size) },
          ]}
        />
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6">
        {/* ── Left column: Corrections + Grammar ── */}
        <div className="space-y-6 min-w-0">

          {/* Grammar Patterns */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden rounded-[1.8rem] border-border bg-card shadow-xl dark:bg-slate-900/40 sm:rounded-[2.2rem] lg:rounded-3xl">
              <CardHeader className="border-b border-border/60 bg-accent/5 px-5 py-4 sm:px-6 sm:py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 shadow-sm ring-1 ring-red-500/20">
                    <Brain size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Recurring Mistakes</h2>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/60">
                      Grammar patterns from your corrections
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6">
                {loadingCorrections ? (
                  <div className="space-y-3">
                    {[70, 55, 90, 40, 65, 50].map((w, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <Skeleton className="h-4" style={{ width: `${w}%` }} />
                          <Skeleton className="h-5 w-8 rounded-full" />
                        </div>
                        <Skeleton className="h-1.5 w-full rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <GrammarTracker entries={corrections} />
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Correction History */}
          <motion.div variants={itemVariants}>
            <div className="space-y-4">
              <h3 className="px-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground/60">
                Correction History
              </h3>

              {loadingCorrections ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="overflow-hidden rounded-[1.5rem] border border-border bg-card px-5 py-4 shadow-sm dark:bg-slate-900/40 sm:rounded-3xl sm:px-6 sm:py-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-4 w-4/5" />
                          <Skeleton className="h-4 w-3/5" />
                        </div>
                        <Skeleton className="mt-1 h-4 w-4 shrink-0 rounded-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : corrections.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-[1.5rem] border border-border bg-card px-4 py-10 text-center sm:rounded-3xl sm:py-12">
                  <ScrollText size={36} className="text-muted-foreground/30" strokeWidth={1.5} />
                  <p className="text-sm font-bold text-muted-foreground/50">No corrections yet</p>
                  <p className="text-xs text-muted-foreground/40">Submit a daily report in Correction to see history here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {corrections.map((entry) => {
                    const isExpanded = expandedId === entry.id
                    return (
                      <motion.div
                        key={entry.id}
                        layout
                        className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-sm dark:bg-slate-900/40 sm:rounded-3xl"
                      >
                        {/* Header row */}
                        <button
                          className="w-full text-left"
                          onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        >
                          <div className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5">
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/40">
                                {formatDate(entry.createdAt)}
                              </p>
                              <p className="line-clamp-1 text-sm font-bold text-muted-foreground/70">
                                {entry.originalText}
                              </p>
                              <p className="line-clamp-1 text-sm font-bold text-foreground">
                                {entry.correctedText}
                              </p>
                            </div>
                            <div className={cn(
                              "mt-1 shrink-0 transition-transform duration-200",
                              isExpanded ? "rotate-90" : "rotate-0"
                            )}>
                              <ArrowRight size={16} className="text-muted-foreground/40" strokeWidth={2.5} />
                            </div>
                          </div>
                        </button>

                        {/* Expanded detail */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-5 border-t border-border/60 px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
                                {/* Original vs Corrected */}
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="rounded-2xl bg-red-500/5 p-4">
                                    <p className="mb-2 text-[9px] font-bold uppercase tracking-wide text-red-500/60">Original</p>
                                    <p className="text-sm font-medium leading-relaxed text-foreground/70">{entry.originalText}</p>
                                  </div>
                                  <div className="rounded-2xl bg-blue-500/5 p-4">
                                    <div className="mb-2 flex items-center justify-between">
                                      <p className="text-[9px] font-bold uppercase tracking-wide text-blue-600/60">Corrected</p>
                                      <SpeakButton text={entry.correctedText} className="h-7 w-7 rounded-lg" />
                                    </div>
                                    <p className="text-sm font-bold leading-relaxed text-foreground">{entry.correctedText}</p>
                                  </div>
                                </div>

                                {/* English translation */}
                                {entry.englishTranslation && (
                                  <div className="flex items-start gap-2 rounded-2xl bg-sky-500/5 px-4 py-3">
                                    <Languages size={13} className="mt-0.5 shrink-0 text-sky-500" strokeWidth={2.5} />
                                    <p className="text-[13px] font-bold text-sky-700 dark:text-sky-300">{entry.englishTranslation}</p>
                                  </div>
                                )}

                                {/* Grammar points */}
                                {entry.grammarPoints?.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {entry.grammarPoints.map((p, i) => (
                                      <span
                                        key={i}
                                        className="rounded-full border border-border bg-accent/30 px-3 py-1 text-[12px] font-bold text-foreground/70"
                                      >
                                        {p}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Explanation */}
                                <p className="text-[13px] font-medium leading-relaxed text-muted-foreground">{entry.explanation}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Right column: Practice Calendar ── */}
        <div>
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden rounded-[1.8rem] border-border bg-card shadow-xl dark:bg-slate-900/40 lg:sticky lg:top-8 sm:rounded-[2.2rem] lg:rounded-3xl">
              <CardHeader className="border-b border-border/60 bg-accent/5 px-5 py-4 sm:px-6 sm:py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500 shadow-sm ring-1 ring-violet-500/20">
                    <CalendarDays size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold">Practice Calendar</h2>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/60">
                      Days you practiced
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                {loadingCorrections ? (
                  <div className="space-y-4">
                    {/* Month nav */}
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-9 w-9 rounded-xl" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-9 w-9 rounded-xl" />
                    </div>
                    {/* Day grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 35 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-xl" />
                      ))}
                    </div>
                    <Skeleton className="mx-auto h-3 w-32" />
                  </div>
                ) : (
                  <PracticeCalendar
                    month={calendarMonth}
                    activeDays={activeDays}
                    onPrev={prevMonth}
                    onNext={nextMonth}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
