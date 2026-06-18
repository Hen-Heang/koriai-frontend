import { motion } from "motion/react"
import { Target } from "lucide-react"
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
  
  const detail = clamped >= 100 
    ? "Done for today 🎉" 
    : `${reviewsToday}/5 reviews`

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm dark:bg-slate-900/40 sm:rounded-3xl lg:p-8",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            {label}
          </p>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-foreground">{status}</h3>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Target size={20} strokeWidth={2.5} />
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center py-6">
        <svg className="size-32 rotate-[-90deg] sm:size-36 lg:size-40" viewBox="0 0 100 100">
          {/* Background Circle */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-muted/20"
          />
          {/* Progress Circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeDasharray="263.89"
            initial={{ strokeDashoffset: 263.89 }}
            animate={{ strokeDashoffset: 263.89 - (263.89 * clamped) / 100 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
            className="text-emerald-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
            {clamped}%
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/50">
            Done
          </span>
        </div>
      </div>

      <div className="mt-auto space-y-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/20">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${clamped}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full rounded-full bg-emerald-500" 
          />
        </div>
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-muted-foreground">{detail}</span>
          <span className="text-emerald-600 dark:text-emerald-400">
            {clamped >= 100 ? "Goal Met" : `${100 - clamped}% left`}
          </span>
        </div>
      </div>
    </div>
  )
}
