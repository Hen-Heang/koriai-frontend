"use client"

import Link from "next/link"
import { useSyncExternalStore } from "react"
import {
  BookOpenText,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock3,
  Plus,
} from "lucide-react"
import { motion } from "motion/react"

import { PageHero } from "@/components/app/page-hero"
import {
  READING_CATEGORIES,
  getAllReadingUnits,
  getReadingProgress,
  getReadingProgressServerSnapshot,
  getReadingUnitsServerSnapshot,
  isBuiltinReadingUnit,
  subscribeReadingProgress,
  subscribeReadingUnits,
  type ReadingCategory,
  type ReadingProgressEntry,
} from "@/lib/reading"
import { cn } from "@/lib/utils"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
} as const

const CATEGORY_ORDER: ReadingCategory[] = ["DAILY_LIFE", "CULTURE", "BEGINNER_STORY"]

function StatusBadge({ entry }: { entry: ReadingProgressEntry }) {
  if (entry.status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 size={11} strokeWidth={3} /> Completed
      </span>
    )
  }
  if (entry.status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
        <Clock3 size={11} strokeWidth={3} /> In progress
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
      <CircleDashed size={11} strokeWidth={3} /> Not started
    </span>
  )
}

export default function ReadingPage() {
  const progress = useSyncExternalStore(
    subscribeReadingProgress,
    getReadingProgress,
    getReadingProgressServerSnapshot
  )
  const units = useSyncExternalStore(
    subscribeReadingUnits,
    getAllReadingUnits,
    getReadingUnitsServerSnapshot
  )

  const completedCount = units.filter((u) => progress[u.id]?.status === "completed").length

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-12"
    >
      <motion.div variants={itemVariants}>
        <PageHero
          eyebrow="Reading"
          title="Reading Units"
          description="Real Korean articles, podcast transcripts, and stories — organized into units. Read with tap-to-translate and audio, save the vocabulary, then pass the quiz to complete each unit. Add your own texts too."
          actions={
            <Link
              href="/reading/new"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-95"
            >
              <Plus size={14} strokeWidth={3} /> New unit
            </Link>
          }
          stats={[
            { label: "Units", value: String(units.length) },
            { label: "Completed", value: `${completedCount}/${units.length}` },
            { label: "Flow", value: "Read · Vocab · Quiz" },
          ]}
        />
      </motion.div>

      {CATEGORY_ORDER.map((category) => {
        const categoryUnits = units.filter((u) => u.category === category)
        if (categoryUnits.length === 0) return null
        const done = categoryUnits.filter((u) => progress[u.id]?.status === "completed").length

        return (
          <motion.section key={category} variants={itemVariants} className="space-y-3">
            <div className="flex items-end justify-between px-1">
              <div>
                <h3 className="text-base font-black tracking-tight text-foreground">
                  {READING_CATEGORIES[category].label}
                </h3>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                  {READING_CATEGORIES[category].description}
                </p>
              </div>
              <span className="text-xs font-black text-muted-foreground/70">
                {done}/{categoryUnits.length} done
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {categoryUnits.map((unit) => {
                const entry = progress[unit.id] ?? { status: "not_started" as const }
                return (
                  <Link
                    key={unit.id}
                    href={`/reading/${unit.id}`}
                    className={cn(
                      "group relative flex flex-col rounded-[1.8rem] border bg-card p-5 shadow-sm transition-all hover:shadow-lg active:scale-[0.99] dark:bg-slate-900/40",
                      entry.status === "completed"
                        ? "border-emerald-500/30"
                        : "border-border hover:border-emerald-500/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <BookOpenText size={18} strokeWidth={2.5} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {!isBuiltinReadingUnit(unit.id) && (
                          <span className="inline-flex rounded-full bg-sky-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
                            Custom
                          </span>
                        )}
                        <StatusBadge entry={entry} />
                      </div>
                    </div>

                    <h4 className="mt-4 text-lg font-extrabold tracking-tight text-foreground">
                      {unit.episode ? `${unit.episode} · ` : ""}
                      {unit.title}
                    </h4>
                    <p className="text-sm font-bold text-muted-foreground">{unit.titleEnglish}</p>
                    <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-relaxed text-muted-foreground/80">
                      {unit.summary}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">
                        <span>{unit.level}</span>
                        <span>·</span>
                        <span>{unit.vocab.length} words</span>
                        <span>·</span>
                        <span>{unit.quiz.length} questions</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {typeof entry.quizScore === "number" && (
                          <span className="text-[10px] font-black text-muted-foreground/50">
                            Quiz {entry.quizScore}/{entry.quizTotal}
                          </span>
                        )}
                        <ChevronRight
                          size={16}
                          strokeWidth={3}
                          className="text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-500"
                        />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </motion.section>
        )
      })}
    </motion.div>
  )
}
