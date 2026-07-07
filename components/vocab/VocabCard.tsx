"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { VocabItem } from "@/lib/types"
import { SpeakButton } from "@/components/ui/SpeakButton"
import { motion } from "motion/react"
import { Calendar, Tag, ChevronRight, BookOpen, Pencil, Check, X, Loader2, Trash2 } from "lucide-react"
import { SentenceChallenge } from "@/components/vocab/SentenceChallenge"
import { vocabApi } from "@/lib/api"

type VocabCardProps = {
  item: VocabItem
  onReview?: (id: string) => void
  onUpdate?: (
    id: string,
    data: { term: string; meaning: string; example?: string; pronunciation?: string }
  ) => void | Promise<void>
  onDelete?: (id: string) => void | Promise<void>
}

function EditForm({
  item,
  onSave,
  onCancel,
}: {
  item: VocabItem
  onSave: (data: { term: string; meaning: string; example?: string; pronunciation?: string }) => Promise<void>
  onCancel: () => void
}) {
  const [term, setTerm] = useState(item.term)
  const [meaning, setMeaning] = useState(item.meaning)
  const [pronunciation, setPronunciation] = useState(item.pronunciation ?? "")
  const [example, setExample] = useState(item.example ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSave() {
    if (!term.trim() || !meaning.trim()) return
    setSaving(true)
    setError("")
    try {
      await onSave({
        term: term.trim(),
        meaning: meaning.trim(),
        pronunciation: pronunciation.trim() || undefined,
        example: example.trim() || undefined,
      })
    } catch {
      setError("Could not save changes.")
      setSaving(false)
    }
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-base font-medium text-foreground placeholder:text-sm placeholder:text-muted-foreground/40 focus:border-emerald-500/40 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-colors sm:text-sm"

  return (
    <div className="space-y-2.5 pt-2">
      <div>
        <label className="text-[12px] font-bold uppercase tracking-[0.18em] text-muted-foreground/50">Korean</label>
        <input value={term} onChange={(e) => setTerm(e.target.value)} maxLength={200} className={cn(inputClass, "mt-1 text-lg font-bold")} />
      </div>
      <div>
        <label className="text-[12px] font-bold uppercase tracking-[0.18em] text-muted-foreground/50">Meaning</label>
        <input value={meaning} onChange={(e) => setMeaning(e.target.value)} className={cn(inputClass, "mt-1")} />
      </div>
      <div>
        <label className="text-[12px] font-bold uppercase tracking-[0.18em] text-muted-foreground/50">Pronunciation</label>
        <input value={pronunciation} onChange={(e) => setPronunciation(e.target.value)} maxLength={300} placeholder="e.g. gong-gam" className={cn(inputClass, "mt-1")} />
      </div>
      <div>
        <label className="text-[12px] font-bold uppercase tracking-[0.18em] text-muted-foreground/50">Example sentence</label>
        <textarea value={example} onChange={(e) => setExample(e.target.value)} rows={2} className={cn(inputClass, "mt-1 resize-none")} />
      </div>
      {error && <p className="text-xs font-bold text-destructive">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !term.trim() || !meaning.trim()}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-40"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={3} />}
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-background py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground transition-all hover:bg-accent active:scale-95"
        >
          <X size={13} strokeWidth={3} />
          Cancel
        </button>
      </div>
    </div>
  )
}

export function VocabCard({ item, onReview, onUpdate, onDelete }: VocabCardProps) {
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const mastery = Math.max(0, Math.min(100, item.mastery))

  // Confirm state reverts on its own if the user doesn't follow through
  useEffect(() => {
    if (!confirmingDelete) return
    const timer = setTimeout(() => setConfirmingDelete(false), 4000)
    return () => clearTimeout(timer)
  }, [confirmingDelete])

  async function handleDelete() {
    if (!onDelete || deleting) return
    setDeleting(true)
    try {
      await onDelete(item.id)
      toast.success(`Deleted "${item.term}"`)
    } catch {
      toast.error("Could not delete word. Please try again.")
      setDeleting(false)
      setConfirmingDelete(false)
    }
  }
  const masteryColor =
    mastery >= 80
      ? "bg-emerald-500"
      : mastery >= 50
      ? "bg-amber-500"
      : "bg-red-500"

  const masteryBg =
    mastery >= 80
      ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400"
      : mastery >= 50
      ? "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400"
      : "bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400"

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-sm transition-all dark:bg-slate-900/40 dark:backdrop-blur-md sm:p-5 sm:hover:-translate-y-1 sm:hover:shadow-xl">
      {/* Mastery Progress Bar (Top) */}
      <div className="absolute inset-x-0 top-0 h-1 bg-accent/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${mastery}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full", masteryColor)}
        />
      </div>

      {editing && onUpdate ? (
        <EditForm
          item={item}
          onSave={async (data) => {
            await onUpdate(item.id, data)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <div className="flex items-start justify-between gap-3 pt-2 sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="min-w-0 break-keep text-2xl font-bold tracking-tight text-foreground [overflow-wrap:anywhere] sm:truncate sm:text-3xl">
                  {item.term}
                </h3>
                <SpeakButton
                  text={item.term}
                  className="h-10 w-10 shrink-0 rounded-xl bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground transition-all active:scale-90"
                />
              </div>
              {item.pronunciation && (
                <p className="mt-0.5 text-xs font-bold text-muted-foreground/50 italic">[{item.pronunciation}]</p>
              )}
              <p className="mt-2 text-lg font-bold text-muted-foreground leading-tight [overflow-wrap:anywhere] sm:text-xl">
                {item.meaning}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <div className="flex items-center gap-1.5">
                {onUpdate && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground/40 transition-all hover:bg-accent/50 hover:text-foreground active:scale-90"
                    aria-label="Edit word"
                  >
                    <Pencil size={14} strokeWidth={2.5} />
                  </button>
                )}
                {onDelete && (
                  confirmingDelete ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex h-8 items-center gap-1 rounded-xl bg-red-500/10 px-2.5 text-[12px] font-bold uppercase tracking-wider text-red-600 ring-1 ring-red-500/20 transition-all hover:bg-red-500/20 active:scale-95 dark:text-red-400"
                    >
                      {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} strokeWidth={2.5} />}
                      {deleting ? "Deleting" : "Sure?"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(true)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground/40 transition-all hover:bg-red-500/10 hover:text-red-500 active:scale-90"
                      aria-label="Delete word"
                    >
                      <Trash2 size={14} strokeWidth={2.5} />
                    </button>
                  )
                )}
                <div className={cn("shrink-0 rounded-2xl px-3 py-1.5 text-xs font-bold uppercase tracking-wide ring-1", masteryBg)}>
                  {mastery}%
                </div>
              </div>
              {item.difficultyLevel && (
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[12px] font-bold uppercase tracking-wider",
                  item.difficultyLevel === "Easy" ? "bg-emerald-500/10 text-emerald-600" :
                  item.difficultyLevel === "Medium" ? "bg-amber-500/10 text-amber-600" :
                  "bg-red-500/10 text-red-600"
                )}>
                  {item.difficultyLevel}
                </span>
              )}
            </div>
          </div>

          {/* Context/Example */}
          {item.example && (
            <div className="mt-6 rounded-2xl border border-border bg-accent/5 p-4 dark:bg-white/5">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={12} className="text-muted-foreground/40" />
                <span className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground/40">Usage Context</span>
              </div>
              <p className="text-sm font-bold leading-relaxed text-foreground/80 [overflow-wrap:anywhere] sm:text-[16px]">
                {item.example}
              </p>
              {item.exampleTranslation && (
                <p className="mt-2 text-xs font-medium italic text-muted-foreground/60 leading-relaxed [overflow-wrap:anywhere]">
                  {item.exampleTranslation}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Metadata */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/40">
        <div className="flex flex-wrap gap-1.5">
          {item.tags.length > 0 ? (
            item.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-accent/30 px-2.5 py-1 text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70"
              >
                <Tag size={10} strokeWidth={3} />
                {tag}
              </span>
            ))
          ) : (
            <span className="text-[12px] font-bold text-muted-foreground/60 italic">No tags</span>
          )}
        </div>
        
        <div className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-muted-foreground/40">
          <Calendar size={12} strokeWidth={3} />
          <span>Next: {item.nextReview}</span>
        </div>
      </div>

      {onReview && (
        <button
          type="button"
          onClick={() => onReview(item.id)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-bold uppercase tracking-[0.15em] text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-95"
        >
          Complete Review
          <ChevronRight size={16} strokeWidth={3} />
        </button>
      )}

      <SentenceChallenge
        cardId={item.id}
        term={item.term}
        onGetChallenge={(id) => vocabApi.getSentenceChallenge(id)}
        onCheckSentence={(id, challengePrompt, attempt) =>
          vocabApi.checkSentence(id, { challengePrompt, attempt })
        }
      />
    </div>
  )
}
