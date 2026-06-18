"use client"

import { useState } from "react"
import { Copy, Check, Info, Sparkles, Wand2 } from "lucide-react"
import { motion } from "motion/react"

import { PageHero } from "@/components/app/page-hero"
import { TipCard } from "@/components/app/tip-card"
import { Button } from "@/components/ui/button"
import { ChipSelect } from "@/components/ui/chip-select"
import { ErrorBanner } from "@/components/ui/error-banner"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { SpeakButton } from "@/components/ui/SpeakButton"
import { useChoices } from "@/hooks/useChoices"
import { useCopy } from "@/hooks/useCopy"
import { messageGenApi, getApiErrorMessage } from "@/lib/api"
import { staggerContainer, itemVariants } from "@/lib/motion"
import type { GeneratedMessages } from "@/lib/types"

const containerVariants = staggerContainer(0.1)

const FALLBACK_CATEGORIES = [
  "Reporting Progress",
  "Asking Questions",
  "Requesting Help",
  "Meeting Communication",
  "Deployment Updates",
  "Bug Reports",
]

export function MessageGenerator() {
  const { options: categories, selected: category, setSelected: setCategory } = useChoices(
    messageGenApi.getCategories,
    FALLBACK_CATEGORIES
  )
  const [intent, setIntent] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<GeneratedMessages | null>(null)
  const { copied: copiedIndex, copy } = useCopy()

  async function handleGenerate() {
    if (!intent.trim()) return
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const data = await messageGenApi.generate(intent.trim(), category)
      setResult(data)
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not generate messages. Please try again."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-12"
    >
      <motion.div variants={itemVariants}>
        <PageHero
          eyebrow="Message Generator"
          title="Workplace Message Generator"
          description="Describe what you want to say at work in plain English. Get natural Korean phrasings across formality levels, with guidance on when to use each one."
          stats={[
            { label: "Variations", value: "3 per request" },
            { label: "Range", value: "Formal → Casual" },
            { label: "Context", value: "Dev Workplace" },
          ]}
        />
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="rounded-3xl border border-border bg-card p-6 shadow-sm dark:bg-slate-900/40"
      >
        <label className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Category
        </label>
        <ChipSelect options={categories} value={category} onChange={setCategory} className="mt-3" />

        <label className="mt-6 block text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          What do you want to say?
        </label>
        <Textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder='e.g. "I finished the task and deployed it to staging."'
          className="mt-3 min-h-28 resize-none rounded-2xl"
        />

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Tip: the more context you give, the more natural the result.
          </p>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !intent.trim()}
            className="h-11 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white hover:bg-blue-500 active:scale-95"
          >
            <Wand2 size={16} className="mr-2" strokeWidth={2.5} />
            {loading ? "Generating..." : "Generate"}
          </Button>
        </div>
      </motion.div>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {loading && (
        <motion.div variants={itemVariants} className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 dark:bg-slate-900/40">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-6 w-2/3" />
              <Skeleton className="mt-2 h-4 w-1/2" />
            </div>
          ))}
        </motion.div>
      )}

      {result && !loading && (
        <>
          <motion.div variants={itemVariants} className="space-y-3">
            {result.variations.map((v, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-border bg-card dark:bg-white/4"
              >
                <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-accent/5 px-4 py-2.5">
                  {v.formality && (
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">
                      {v.formality}
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <SpeakButton text={v.korean} />
                    <button
                      type="button"
                      onClick={() => copy(v.korean, i)}
                      title="Copy"
                      className="inline-flex items-center justify-center rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {copiedIndex === i ? (
                        <Check className="size-3.5 text-blue-500" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="px-4 py-3.5">
                  <p className="text-lg font-bold text-foreground">{v.korean}</p>
                  {v.romanization && (
                    <p className="mt-1 text-sm italic text-muted-foreground">{v.romanization}</p>
                  )}
                  {v.situation && (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      <span className="font-bold text-foreground/80">Best for: </span>
                      {v.situation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </motion.div>

          {result.note && (
            <motion.div variants={itemVariants}>
              <TipCard icon={Sparkles} title="Which one should I use?">
                {result.note}
              </TipCard>
            </motion.div>
          )}
        </>
      )}

      {!result && !loading && !error && (
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-2 px-1 text-xs text-muted-foreground"
        >
          <Info size={13} />
          <span>Pick a category, describe your intent, and generate Korean variations.</span>
        </motion.div>
      )}
    </motion.div>
  )
}
