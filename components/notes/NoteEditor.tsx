"use client"

import { useState } from "react"
import { Save, X, Loader2 } from "lucide-react"

export interface NoteEditorValues {
  slug: string
  title: string
  description: string
  icon: string
  content: string
}

interface NoteEditorProps {
  mode: "create" | "edit"
  initial: NoteEditorValues
  onSave: (values: NoteEditorValues) => Promise<void>
  onCancel: () => void
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function NoteEditor({ mode, initial, onSave, onCancel }: NoteEditorProps) {
  const [values, setValues] = useState<NoteEditorValues>(initial)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const set = (patch: Partial<NoteEditorValues>) =>
    setValues((prev) => ({ ...prev, ...patch }))

  const handleSave = async () => {
    if (!values.title.trim()) return setError("Title is required.")
    if (!values.slug.trim()) return setError("Slug is required.")
    if (!values.content.trim()) return setError("Content is required.")
    setError("")
    setIsSaving(true)
    try {
      await onSave({ ...values, slug: slugify(values.slug) })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save note.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm sm:flex-row">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-4">
            <input
              value={values.icon}
              onChange={(e) => set({ icon: e.target.value })}
              placeholder="java"
              title="Category / icon key (e.g. java, sql)"
              className="h-12 w-20 rounded-xl border border-border bg-background text-center text-sm font-mono transition-colors focus:border-blue-500/50 focus:outline-none"
            />
            <input
              value={values.title}
              onChange={(e) =>
                set({
                  title: e.target.value,
                  // keep slug synced to title while creating, until user edits it
                  ...(mode === "create" && values.slug === slugify(values.title)
                    ? { slug: slugify(e.target.value) }
                    : {}),
                })
              }
              placeholder="Note title"
              className="flex-1 bg-transparent text-2xl font-bold text-foreground placeholder:opacity-30 focus:outline-none sm:text-3xl"
            />
          </div>
          <input
            value={values.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="Short description..."
            className="w-full bg-transparent text-sm text-muted-foreground placeholder:opacity-30 focus:outline-none"
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono opacity-60">/notes/</span>
            <input
              value={values.slug}
              onChange={(e) => set({ slug: e.target.value })}
              disabled={mode === "edit"}
              placeholder="slug"
              className="flex-1 rounded-lg border border-border bg-background px-2 py-1 font-mono text-xs text-foreground disabled:opacity-50 focus:border-blue-500/50 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:self-start">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/70"
          >
            <X size={16} />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      <textarea
        value={values.content}
        onChange={(e) => set({ content: e.target.value })}
        placeholder="Write your markdown here..."
        className="min-h-[500px] w-full resize-none rounded-2xl border border-border/60 bg-card/30 p-6 font-mono text-sm leading-relaxed text-foreground transition-all focus:border-blue-500/30 focus:outline-none sm:p-8"
      />
    </div>
  )
}
