"use client"

import { useState } from "react"
import {
  BookOpen,
  ChevronDown,
  MessageCircleQuestion,
  Quote,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { SpeakButton } from "@/components/ui/SpeakButton"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import type { InterviewTopic, PhraseEntry } from "@/lib/interview"
import { cn } from "@/lib/utils"

// Curated, audio-enabled study material for the selected topic. Collapsible so
// it doubles as a quick reference during a live session.
export function StudyPack({
  topic,
  defaultOpen = false,
}: {
  topic: InterviewTopic
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const prep = topic.prep
  if (!prep) return null

  return (
    <Card className="rounded-[1.8rem] border-border bg-card shadow-xl dark:bg-slate-900/40 sm:rounded-[2.2rem]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-5 text-left sm:px-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
            <BookOpen size={20} strokeWidth={2.5} />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">Study Pack</CardTitle>
            <p className="text-xs font-medium text-muted-foreground">
              Vocabulary, phrases &amp; likely questions — tap 🔊 to hear each one.
            </p>
          </div>
        </div>
        <ChevronDown
          size={20}
          className={cn("shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <CardContent className="space-y-7 border-t border-border/80 pt-6">
              {/* Vocabulary */}
              <section>
                <SectionLabel icon={<BookOpen size={13} strokeWidth={3} />} color="amber">
                  Vocabulary · {prep.vocabulary.length} words
                </SectionLabel>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {prep.vocabulary.map((item) => (
                    <div
                      key={item.term}
                      className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-accent/5 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold text-foreground">{item.term}</p>
                        <p className="truncate text-xs font-medium text-muted-foreground">
                          {item.meaning}
                        </p>
                      </div>
                      <SpeakButton text={item.term} className="shrink-0 p-1.5" />
                    </div>
                  ))}
                </div>
              </section>

              {/* Key phrases */}
              <section>
                <SectionLabel icon={<Quote size={13} strokeWidth={3} />} color="emerald">
                  Key phrases
                </SectionLabel>
                <div className="mt-3 space-y-2">
                  {prep.keyPhrases.map((entry) => (
                    <PhraseRow key={entry.ko} entry={entry} />
                  ))}
                </div>
              </section>

              {/* Likely questions */}
              <section>
                <SectionLabel
                  icon={<MessageCircleQuestion size={13} strokeWidth={3} />}
                  color="sky"
                >
                  Likely questions
                </SectionLabel>
                <div className="mt-3 space-y-2">
                  {prep.sampleQuestions.map((entry) => (
                    <PhraseRow key={entry.ko} entry={entry} />
                  ))}
                </div>
              </section>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

function SectionLabel({
  icon,
  color,
  children,
}: {
  icon: React.ReactNode
  color: "amber" | "emerald" | "sky"
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-md",
          color === "amber" && "bg-amber-500/10 text-amber-600",
          color === "emerald" && "bg-blue-500/10 text-blue-600",
          color === "sky" && "bg-sky-500/10 text-sky-600"
        )}
      >
        {icon}
      </span>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {children}
      </p>
    </div>
  )
}

function PhraseRow({ entry }: { entry: PhraseEntry }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-accent/5 px-3 py-3">
      <div className="min-w-0">
        <p className="font-bold leading-snug text-foreground">{entry.ko}</p>
        <p className="mt-1 text-sm font-medium leading-relaxed text-muted-foreground">
          {entry.en}
        </p>
      </div>
      <SpeakButton text={entry.ko} className="mt-0.5 shrink-0 p-1.5" />
    </div>
  )
}
