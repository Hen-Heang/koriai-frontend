"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { itemVariants } from "@/lib/motion"

export function DebriefForm({
  onSave,
}: {
  onSave: (input: { reflection: string; ifText: string; thenText: string }) => Promise<void>
}) {
  const [where, setWhere] = useState("")
  const [feeling, setFeeling] = useState("")
  const [chain, setChain] = useState("")
  const [breakLink, setBreakLink] = useState("")

  const [ifText, setIfText] = useState("")
  const [thenText, setThenText] = useState("")
  const [ifEdited, setIfEdited] = useState(false)
  const [thenEdited, setThenEdited] = useState(false)
  const [saving, setSaving] = useState(false)

  // The plan drafts itself from the reflection as the user types — editable,
  // never presented as final until they hit save.
  useEffect(() => {
    if (!ifEdited) setIfText(where.trim() ? `I'm ${where.trim()} again` : "I'm in this situation again")
  }, [where, ifEdited])

  useEffect(() => {
    if (!thenEdited) setThenText(breakLink.trim())
  }, [breakLink, thenEdited])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ifText.trim() || !thenText.trim() || saving) return
    setSaving(true)
    try {
      const reflection = [
        where.trim() && `Where: ${where.trim()}`,
        feeling.trim() && `Felt (30 min before): ${feeling.trim()}`,
        chain.trim() && `Chain of events: ${chain.trim()}`,
      ]
        .filter(Boolean)
        .join("\n")
      await onSave({ reflection, ifText: ifText.trim(), thenText: thenText.trim() })
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.form
      variants={itemVariants}
      onSubmit={handleSubmit}
      className="mx-auto max-w-lg space-y-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 shadow-sm sm:p-8"
    >
      <div>
        <h1 className="text-xl font-bold text-foreground">A quick, calm look back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          No verdict here — just enough detail to make next time a little easier.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="debrief-where" className="text-sm font-semibold text-foreground">
          Where were you?
        </label>
        <Input id="debrief-where" value={where} onChange={(e) => setWhere(e.target.value)} placeholder="e.g. at my desk, in bed" />
      </div>

      <div className="space-y-2">
        <label htmlFor="debrief-feeling" className="text-sm font-semibold text-foreground">
          What did you feel 30 minutes before?
        </label>
        <Input
          id="debrief-feeling"
          value={feeling}
          onChange={(e) => setFeeling(e.target.value)}
          placeholder="e.g. bored, tired, anxious"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="debrief-chain" className="text-sm font-semibold text-foreground">
          What was the chain of events?
        </label>
        <Textarea
          id="debrief-chain"
          value={chain}
          onChange={(e) => setChain(e.target.value)}
          rows={3}
          placeholder="One thing led to another…"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="debrief-break" className="text-sm font-semibold text-foreground">
          What single link would you break next time?
        </label>
        <Textarea
          id="debrief-break"
          value={breakLink}
          onChange={(e) => setBreakLink(e.target.value)}
          rows={2}
          placeholder="One small, specific change"
        />
      </div>

      {breakLink.trim() && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Your plan</p>
          <div className="space-y-1.5">
            <label htmlFor="debrief-if" className="text-xs font-medium text-muted-foreground">
              If
            </label>
            <Input
              id="debrief-if"
              value={ifText}
              onChange={(e) => {
                setIfText(e.target.value)
                setIfEdited(true)
              }}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="debrief-then" className="text-xs font-medium text-muted-foreground">
              Then
            </label>
            <Input
              id="debrief-then"
              value={thenText}
              onChange={(e) => {
                setThenText(e.target.value)
                setThenEdited(true)
              }}
            />
          </div>
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={saving || !ifText.trim() || !thenText.trim()}>
        {saving ? "Saving…" : "Save plan"}
      </Button>
    </motion.form>
  )
}
