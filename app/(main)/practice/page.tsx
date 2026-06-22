"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Drama,
  Headphones,
  MessageCircle,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Wand2,
} from "lucide-react"
import { motion } from "motion/react"

import { PageHero } from "@/components/app/page-hero"
import { Button } from "@/components/ui/button"
import { ErrorBanner } from "@/components/ui/error-banner"
import { Skeleton } from "@/components/ui/skeleton"
import { DailyPhraseCard } from "@/components/practice/DailyPhraseCard"
import { isScenarioDoneToday, markScenarioDoneToday } from "@/lib/daily-mission"
import { levelApi, practiceApi, getApiErrorMessage } from "@/lib/api"
import { containerVariants, itemVariants } from "@/lib/motion"
import { cn } from "@/lib/utils"
import type { LevelSuggestion } from "@/lib/api/user"
import type { PracticeToday } from "@/lib/types"

export default function PracticePage() {
  const router = useRouter()
  const [data, setData] = useState<PracticeToday | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [suggestion, setSuggestion] = useState<LevelSuggestion | null>(null)
  const [applying, setApplying] = useState(false)
  const [scenarioDone, setScenarioDone] = useState(false)

  useEffect(() => {
    let active = true
    setScenarioDone(isScenarioDoneToday())
    practiceApi
      .getToday()
      .then((res) => {
        if (active) setData(res)
      })
      .catch((err) => {
        if (active) setError(getApiErrorMessage(err, "Could not load today's practice."))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    levelApi
      .getSuggestion()
      .then((res) => {
        if (active) setSuggestion(res)
      })
      .catch(() => {
        /* level suggestion is a bonus banner — fail silently */
      })
    return () => {
      active = false
    }
  }, [])

  async function handleApplyLevel() {
    if (!suggestion?.suggestedLevel) return
    setApplying(true)
    try {
      await levelApi.apply(suggestion.suggestedLevel)
      setSuggestion({ ...suggestion, currentLevel: suggestion.suggestedLevel, upgradeAvailable: false, suggestedLevel: null })
      setData((prev) => (prev ? { ...prev, userLevel: suggestion.suggestedLevel! } : prev))
    } catch {
      /* leave the banner up so the user can retry */
    } finally {
      setApplying(false)
    }
  }

  function goToScenario() {
    if (!data) return
    markScenarioDoneToday()
    setScenarioDone(true)
    router.push(
      `/chat?prompt=${encodeURIComponent(data.suggestedScenario.introMessage || data.suggestedScenario.goal)}`
    )
  }

  const missions = data
    ? [
        {
          key: "vocab",
          label: data.dueVocabCount > 0 ? `Review ${data.dueVocabCount} vocab cards` : "Vocab caught up",
          done: data.dueVocabCount === 0,
        },
        {
          key: "phrase",
          label: "Learn today's phrase",
          done: data.dailyPhrase.learned,
        },
        {
          key: "mistakes",
          label: data.dueCorrectionsCount > 0 ? `Clear ${data.dueCorrectionsCount} repeated mistakes` : "No mistakes due",
          done: data.dueCorrectionsCount === 0,
        },
        {
          key: "scenario",
          label: "Practice today's scenario in AI Coach",
          done: scenarioDone,
        },
      ]
    : []
  const completedCount = missions.filter((m) => m.done).length

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8 pb-12">
      <motion.div variants={itemVariants}>
        <PageHero
          eyebrow="Today"
          title="Today's Mission"
          description="One focused checklist for today — clear it and you've made real progress, no need to hunt through the rest of the app."
          stats={
            data
              ? [
                  { label: "Level", value: data.userLevel },
                  { label: "Progress", value: `${completedCount}/${missions.length}` },
                ]
              : undefined
          }
        />
      </motion.div>

      {suggestion?.upgradeAvailable && suggestion.suggestedLevel && (
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-5"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <TrendingUp size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                Ready for {suggestion.suggestedLevel}
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{suggestion.reason}</p>
            </div>
          </div>
          <Button
            type="button"
            onClick={handleApplyLevel}
            disabled={applying}
            className="h-10 rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white hover:bg-emerald-500 active:scale-95"
          >
            {applying ? "Updating..." : `Move up to ${suggestion.suggestedLevel}`}
          </Button>
        </motion.div>
      )}

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {loading && (
        <motion.div variants={itemVariants} className="space-y-4">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-80 w-full rounded-3xl" />
        </motion.div>
      )}

      {data && !loading && (
        <>
          {/* Today's Mission checklist */}
          <motion.div
            variants={itemVariants}
            className="rounded-3xl border border-border bg-card p-6 shadow-sm dark:bg-slate-900/40"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
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
                <li key={m.key} className="flex items-center gap-3">
                  {m.done ? (
                    <CheckCircle2 size={20} className="shrink-0 text-emerald-500" strokeWidth={2.5} />
                  ) : (
                    <Circle size={20} className="shrink-0 text-muted-foreground/30" strokeWidth={2.5} />
                  )}
                  <span
                    className={cn(
                      "text-sm font-bold",
                      m.done ? "text-muted-foreground/60 line-through" : "text-foreground"
                    )}
                  >
                    {m.label}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Daily phrase — merged in full from the old standalone page */}
          <motion.div variants={itemVariants}>
            <DailyPhraseCard
              phrase={data.dailyPhrase}
              onChange={(next) => setData((prev) => (prev ? { ...prev, dailyPhrase: next } : prev))}
            />
          </motion.div>

          <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2">
            {/* Vocab review */}
            <Card
              icon={<BookOpen size={20} strokeWidth={2.5} />}
              iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              eyebrow="Vocabulary"
              title={data.dueVocabCount > 0 ? `${data.dueVocabCount} cards due` : "All caught up"}
            >
              {data.dueVocabSample.length > 0 ? (
                <ul className="space-y-1.5 text-sm">
                  {data.dueVocabSample.map((card) => (
                    <li key={card.id} className="flex items-center justify-between text-foreground">
                      <span className="font-bold">{card.term}</span>
                      <span className="text-muted-foreground">{card.meaning}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No reviews due right now — nice work.</p>
              )}
              <ActionButton onClick={() => router.push("/vocab")} className="bg-emerald-600 hover:bg-emerald-500">
                Review vocab
              </ActionButton>
            </Card>

            {/* Mistake review */}
            <Card
              icon={<RotateCcw size={20} strokeWidth={2.5} />}
              iconClass="bg-red-500/10 text-red-600 dark:text-red-400"
              eyebrow="Mistake Review"
              title={data.dueCorrectionsCount > 0 ? `${data.dueCorrectionsCount} mistakes due` : "All caught up"}
            >
              {data.dueCorrectionsSample.length > 0 ? (
                <ul className="space-y-1.5 text-sm">
                  {data.dueCorrectionsSample.map((c) => (
                    <li key={c.id} className="text-foreground">
                      <span className="text-red-600/70 line-through dark:text-red-400/70">{c.originalText}</span>
                      <span className="ml-2 font-bold">{c.correctedText}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No repeated mistakes due — keep it up.</p>
              )}
              <ActionButton onClick={() => router.push("/chat?mode=corrections")} className="bg-red-600 hover:bg-red-500">
                Review mistakes
              </ActionButton>
            </Card>

            {/* Scenario */}
            <Card
              icon={<Drama size={20} strokeWidth={2.5} />}
              iconClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
              eyebrow={`Scenario · ${data.suggestedScenario.category}`}
              title={data.suggestedScenario.title}
            >
              <p className="text-sm text-muted-foreground">{data.suggestedScenario.summary}</p>
              <ActionButton
                onClick={goToScenario}
                className="bg-blue-600 hover:bg-blue-500"
                icon={<MessageCircle size={14} className="mr-2" />}
              >
                Practice with AI Coach
              </ActionButton>
            </Card>

            {/* Message generator */}
            <Card
              icon={<Wand2 size={20} strokeWidth={2.5} />}
              iconClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
              eyebrow="Message Generator"
              title={data.suggestedMessageCategory}
            >
              <p className="text-sm text-muted-foreground">
                Try phrasing a message for this situation across formality levels.
              </p>
              <ActionButton
                onClick={() => router.push(`/chat?mode=generate&category=${encodeURIComponent(data.suggestedMessageCategory)}`)}
                className="bg-violet-600 hover:bg-violet-500"
              >
                Generate a message
              </ActionButton>
            </Card>

            {/* Listening */}
            <Card
              icon={<Headphones size={20} strokeWidth={2.5} />}
              iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              eyebrow="Listening"
              title={data.suggestedListeningTopic}
            >
              <p className="text-sm text-muted-foreground">
                Generate a short workplace conversation on this topic and test your comprehension.
              </p>
              <ActionButton
                onClick={() => router.push(`/listening?topic=${encodeURIComponent(data.suggestedListeningTopic)}`)}
                className="bg-amber-600 hover:bg-amber-500"
                icon={<Sparkles size={14} className="mr-2" />}
              >
                Generate lesson
              </ActionButton>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}

function Card({
  icon,
  iconClass,
  eyebrow,
  title,
  children,
}: {
  icon: React.ReactNode
  iconClass: string
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm dark:bg-slate-900/40">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}>{icon}</div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">{eyebrow}</p>
          <h3 className="text-base font-extrabold text-foreground">{title}</h3>
        </div>
      </div>
      <div className="mt-4 flex-1 space-y-2">{children}</div>
    </div>
  )
}

function ActionButton({
  onClick,
  className,
  icon,
  children,
}: {
  onClick: () => void
  className?: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      className={`mt-4 h-10 w-full rounded-xl px-5 text-xs font-bold text-white active:scale-95 ${className ?? ""}`}
    >
      {icon}
      {children}
    </Button>
  )
}
