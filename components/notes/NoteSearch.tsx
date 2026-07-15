"use client"

import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { NoteCard } from "@/components/notes/NoteCard"
import type { NoteMeta } from "@/lib/api"

export function NoteSearch({ notes }: { notes: NoteMeta[] }) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return notes
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        (n.category ?? "").toLowerCase().includes(q) ||
        (n.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
    )
  }, [query, notes])

  return (
    <div>
      {/* Search input */}
      <div className="group relative mb-10">
        <div className="absolute -inset-1 rounded-2xl bg-linear-to-r from-blue-500/20 to-sky-500/20 opacity-0 blur-sm transition-opacity duration-500 group-focus-within:opacity-100" />

        <div className="relative flex items-center rounded-2xl border border-border bg-card/80 px-4 py-4 shadow-sm backdrop-blur-xl transition-all duration-300 group-focus-within:border-blue-500/40">
          <Search
            size={18}
            className="mr-3 text-muted-foreground transition-colors group-focus-within:text-blue-500"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes by topic, concept, or tag..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none"
          />

          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setQuery("")}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X size={16} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center py-20 text-muted-foreground"
          >
            <Search size={40} className="mb-4 opacity-20" />
            <p className="text-sm">
              {query ? `No notes match "${query}"` : "No notes yet — create your first one."}
            </p>
            {query && (
              <button
                onClick={() => setQuery("")}
                className="mt-4 text-xs text-blue-500 hover:underline"
              >
                Clear search
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div key="results" layout className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {filtered.map((note, i) => (
              <NoteCard
                key={note.slug}
                slug={note.slug}
                title={note.title}
                description={note.description}
                icon={note.icon}
                index={i}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
