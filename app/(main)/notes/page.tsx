"use client"

import Link from "next/link"
import { Loader2, NotebookPen, Plus, Terminal } from "lucide-react"
import { NoteSearch } from "@/components/notes/NoteSearch"
import { useNotes } from "@/hooks/useNotes"

export default function NotesPage() {
  const { notes, loading, error } = useNotes()

  return (
    <div className="mx-auto max-w-6xl py-4 sm:py-8">
      {/* Header */}
      <div className="mb-10 flex flex-col gap-6 border-b border-border/60 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">
            <NotebookPen size={12} />
            <span>Dev Notes</span>
          </div>
          <h1 className="flex items-center gap-4 text-3xl font-black text-foreground">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-2.5">
              <Terminal size={28} className="text-blue-500" />
            </div>
            Knowledge Library
          </h1>
          <p className="mt-3 text-base font-medium text-muted-foreground">
            Your study notes — Java, Spring, SQL, and the rest of the stack.
          </p>
        </div>

        <Link
          href="/notes/new"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500"
        >
          <Plus size={16} />
          New note
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Loader2 size={28} className="mb-4 animate-spin" />
          <p className="text-sm">Loading notes…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
          <p className="text-sm">{error}</p>
          <p className="mt-2 max-w-sm text-xs text-muted-foreground/60">
            The notes backend may not be available yet. You can still create a note once the
            <span className="font-mono"> /notes </span> endpoint is wired.
          </p>
        </div>
      ) : (
        <NoteSearch notes={notes} />
      )}
    </div>
  )
}
