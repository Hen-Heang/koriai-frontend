import { cn } from "@/lib/utils"

type DailyGoalRingProps = {
  progress: number
  reviewsToday?: number
  correctionsToday?: number
  label?: string
  className?: string
}

export function DailyGoalRing({
  progress,
  reviewsToday = 0,
  correctionsToday = 0,
  label = "Daily Goal",
  className,
}: DailyGoalRingProps) {
  const clamped = Math.max(0, Math.min(progress, 100))
  const status =
    clamped >= 100 ? "Completed" : clamped >= 65 ? "On pace" : "Keep going"
  const detail =
    clamped >= 100
      ? "Done for today 🎉"
      : correctionsToday > 0
        ? `${reviewsToday}/5 reviews · 1 sentence written`
        : `${reviewsToday}/5 reviews or 1 sentence`

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.5rem] border border-border bg-card p-4 shadow-xl dark:bg-slate-900/60 dark:backdrop-blur-sm sm:rounded-[1.8rem] sm:p-5 lg:rounded-3xl lg:p-6",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_70%)]" />
      <div className="relative flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            {label}
          </p>
          <p className="mt-1 text-[13px] font-medium text-muted-foreground sm:text-sm">{detail}</p>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/20 sm:px-3 sm:text-[11px]">
          {status}
        </span>
      </div>

      <div
        className="relative mx-auto mt-4 grid size-28 place-items-center rounded-full shadow-inner sm:mt-5 sm:size-32 lg:mt-6 lg:size-36"
        style={{
          background: `conic-gradient(oklch(0.64 0.16 160) ${clamped}%, var(--muted) ${clamped}% 100%)`,
        }}
      >
        <div className="grid size-20 place-items-center rounded-full bg-background text-center shadow-lg dark:bg-slate-950 sm:size-24 lg:size-28">
          <div>
            <p className="text-[1.4rem] font-bold tracking-tight text-foreground sm:text-[1.7rem] lg:text-3xl">{clamped}%</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              done
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3">
        <div className="rounded-[1rem] border border-border bg-accent/10 px-3 py-2.5 dark:bg-white/5 sm:rounded-2xl sm:py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            Left
          </p>
          <p className="mt-1 text-sm font-bold text-foreground">
            {Math.max(0, 100 - clamped)}%
          </p>
        </div>
        <div className="rounded-[1rem] border border-border bg-accent/10 px-3 py-2.5 dark:bg-white/5 sm:rounded-2xl sm:py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            Status
          </p>
          <p className="mt-1 text-sm font-bold text-foreground">{status}</p>
        </div>
      </div>
    </div>
  )
}
