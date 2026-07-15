"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Compass } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { itemVariants } from "@/lib/motion"

export function CreateHabitForm({
  onCreate,
}: {
  onCreate: (input: { label: string; replacementBehavior?: string }) => Promise<unknown>
}) {
  const [label, setLabel] = useState("")
  const [replacementBehavior, setReplacementBehavior] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return
    setSubmitting(true)
    try {
      await onCreate({ label: label.trim(), replacementBehavior: replacementBehavior.trim() || undefined })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.form
      variants={itemVariants}
      onSubmit={handleSubmit}
      className="mx-auto max-w-md space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      <div className="inline-flex rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
        <Compass size={20} strokeWidth={2} />
      </div>
      <div>
        <h1 className="text-xl font-bold text-foreground">What are you working on?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A short, private label. Only you will ever see it.
        </p>
      </div>
      <div className="space-y-2">
        <label htmlFor="habit-label" className="text-sm font-semibold text-foreground">
          Label
        </label>
        <Input
          id="habit-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. late-night phone scrolling"
          maxLength={80}
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="habit-replacement" className="text-sm font-semibold text-foreground">
          Replacement behavior <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Input
          id="habit-replacement"
          value={replacementBehavior}
          onChange={(e) => setReplacementBehavior(e.target.value)}
          placeholder="what you'd rather do instead"
          maxLength={120}
        />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={submitting || !label.trim()}>
        {submitting ? "Starting…" : "Start"}
      </Button>
    </motion.form>
  )
}
