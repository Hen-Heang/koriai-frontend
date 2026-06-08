"use client"

import { useEffect, useState } from "react"
import { Copy, Check, Info, Sparkles, Wand2 } from "lucide-react"
import { motion } from "motion/react"

import { PageHero } from "@/components/app/page-hero"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { SpeakButton } from "@/components/ui/SpeakButton"
import { messageGenApi, getApiErrorMessage } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { GeneratedMessages } from "@/lib/types"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
} as const

const FALLBACK_CATEGORIES = [
  "Reporting Progress",
  "Asking Questions",
  "Requesting Help",
  "Meeting Communication",
  "Deployment Updates",
  "Bug Reports",
]

export default function GeneratorPage() {
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES)
  const [category, setCategory] = useState<string>(FALLBACK_CATEGORIES[0])
  const [intent, setIntent] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<GeneratedMessages | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  useEffect(() => {
    messageGenApi
      .getCategories()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data)
          setCategory(data[0])
        }
      })
      .catch(() => {
        /* keep fallback categories */
      })
  }, [])

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

  async function handleCopy(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 1500)
    } catch {
      /* clipboard unavailable */
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
        className="rounded-[2rem] border border-border bg-card p-6 shadow-sm dark:bg-slate-900/40"
      >
        <label className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          Category
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-bold transition-all active:scale-95",
                category === c
                  ? "border-emerald-500/40 bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <label className="mt-6 block text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
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
            className="h-11 rounded-xl bg-emerald-600 px-6 text-sm font-black text-white hover:bg-emerald-500 active:scale-95"
          >
            <Wand2 size={16} className="mr-2" strokeWidth={2.5} />
            {loading ? "Generating..." : "Generate"}
          </Button>
        </div>
      </motion.div>

      {error && (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-bold text-destructive"
        >
          {error}
        </motion.div>
      )}

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
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400">
                      {v.formality}
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <SpeakButton text={v.korean} />
                    <button
                      type="button"
                      onClick={() => handleCopy(v.korean, i)}
                      title="Copy"
                      className="inline-flex items-center justify-center rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {copiedIndex === i ? (
                        <Check className="size-3.5 text-emerald-500" />
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
            <motion.div
              variants={itemVariants}
              className="rounded-[2rem] border border-border bg-card/50 p-6 backdrop-blur-sm dark:bg-slate-900/20"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-base font-black text-foreground">Which one should I use?</h4>
                  <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground">
                    {result.note}
                  </p>
                </div>
              </div>
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