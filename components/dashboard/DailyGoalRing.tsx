import { cn } from "@/lib/utils"

type DailyGoalRingProps = {
  progress: number
  label?: string
  className?: string
}

export function DailyGoalRing({
  progress,
  label = "Daily Goal",
  className,
}: DailyGoalRingProps) {
  const clamped = Math.max(0, Math.min(progress, 100))

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[2rem] border border-border/60 bg-white/90 p-6 shadow-lg shadow-slate-950/5 dark:border-emerald-400/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,8,23,0.96))]",
        className
      )}
    >
      <div
        className="grid size-36 place-items-center rounded-full"
        style={{
          background: `conic-gradient(oklch(0.64 0.16 160) ${clamped}%, rgba(148,163,184,0.2) ${clamped}% 100%)`,
        }}
      >
        <div className="grid size-26 place-items-center rounded-full bg-white text-center dark:bg-slate-950">
          <p className="text-3xl font-semibold dark:text-white">{clamped}%</p>
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-foreground dark:text-white">{label}</p>
      <p className="text-xs text-muted-foreground dark:text-slate-400">Target: 45 minutes today</p>
    </div>
  )
}
