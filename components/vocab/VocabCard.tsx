"use client"

import { cn } from "@/lib/utils"
import type { VocabItem } from "@/lib/types"
import { SpeakButton } from "@/components/ui/SpeakButton"
import { motion } from "motion/react"
import { Calendar, Tag, ChevronRight, BookOpen } from "lucide-react"

type VocabCardProps = {
  item: VocabItem
  onReview?: (id: string) => void
}

export function VocabCard({ item, onReview }: VocabCardProps) {
  const mastery = Math.max(0, Math.min(100, item.mastery))
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
    <div className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900/40 dark:backdrop-blur-md">
      {/* Mastery Progress Bar (Top) */}
      <div className="absolute inset-x-0 top-0 h-1 bg-accent/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${mastery}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full", masteryColor)}
        />
      </div>

      <div className="flex items-start justify-between gap-4 pt-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="truncate text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              {item.term}
            </h3>
            <SpeakButton
              text={item.term}
              className="h-10 w-10 rounded-xl bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground transition-all active:scale-90"
            />
          </div>
          {item.pronunciation && (
            <p className="mt-0.5 text-xs font-bold text-muted-foreground/50 italic">[{item.pronunciation}]</p>
          )}
          <p className="mt-2 text-lg font-bold text-muted-foreground leading-tight sm:text-xl">
            {item.meaning}
          </p>
          {item.khmTranslation && (
            <p className="mt-1 text-sm font-medium text-violet-600 dark:text-violet-400">
              {item.khmTranslation}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className={cn("shrink-0 rounded-2xl px-3 py-1.5 text-xs font-black uppercase tracking-widest ring-1", masteryBg)}>
            {mastery}%
          </div>
          {item.difficultyLevel && (
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
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
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Usage Context</span>
          </div>
          <p className="text-sm font-bold leading-relaxed text-foreground/80 sm:text-[15px]">
            {item.example}
          </p>
          {item.exampleTranslation && (
            <p className="mt-2 text-xs font-medium italic text-muted-foreground/60 leading-relaxed">
              {item.exampleTranslation}
            </p>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/40">
        <div className="flex flex-wrap gap-1.5">
          {item.tags.length > 0 ? (
            item.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-accent/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground/70"
              >
                <Tag size={10} strokeWidth={3} />
                {tag}
              </span>
            ))
          ) : (
            <span className="text-[10px] font-bold text-muted-foreground/30 italic">No tags</span>
          )}
        </div>
        
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
          <Calendar size={12} strokeWidth={3} />
          <span>Next: {item.nextReview}</span>
        </div>
      </div>

      {onReview && (
        <button
          type="button"
          onClick={() => onReview(item.id)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-95"
        >
          Complete Review
          <ChevronRight size={16} strokeWidth={3} />
        </button>
      )}
    </div>
  )
}
