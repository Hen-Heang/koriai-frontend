import { cn } from "@/lib/utils"
import type { VocabItem } from "@/lib/types"
import { SpeakButton } from "@/components/ui/SpeakButton"

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

  return (
    <div className="flex flex-col gap-3 rounded-[1.25rem] border border-slate-800 bg-slate-900/60 px-5 py-4">
      {/* Term + mastery */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold tracking-tight text-white">{item.term}</p>
            <SpeakButton text={item.term} />
          </div>
          <p className="mt-0.5 text-sm text-slate-400">{item.meaning}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
            mastery >= 80
              ? "bg-emerald-500/15 text-emerald-400"
              : mastery >= 50
              ? "bg-amber-500/15 text-amber-400"
              : "bg-red-500/15 text-red-400"
          )}
        >
          {mastery}%
        </span>
      </div>

      {/* Mastery bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={cn("h-full rounded-full transition-all duration-500", masteryColor)}
          style={{ width: `${mastery}%` }}
        />
      </div>

      {/* Example */}
      {item.example ? (
        <p className="rounded-xl border border-slate-800 bg-slate-800/40 px-3 py-2 text-xs leading-6 text-slate-300">
          {item.example}
        </p>
      ) : null}

      {/* Tags + next review */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="text-[11px] text-slate-600">
          Next review: {item.nextReview}
        </span>
      </div>

      {onReview ? (
        <button
          type="button"
          onClick={() => onReview(item.id)}
          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800/50 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          Mark reviewed
        </button>
      ) : null}
    </div>
  )
}
