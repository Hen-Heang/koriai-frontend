import { Flame, Trophy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type StreakCardProps = {
  days: number
  wordsSaved: number
}

export function StreakCard({ days, wordsSaved }: StreakCardProps) {
  return (
    <Card className="overflow-hidden rounded-[1.5rem] border-border bg-card shadow-xl dark:bg-slate-900/60 dark:backdrop-blur-sm sm:rounded-[1.8rem] lg:rounded-3xl">
      <CardHeader className="relative flex flex-row items-start justify-between gap-3 pb-2 sm:pb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
            Momentum
          </p>
          <CardTitle className="mt-1 text-lg font-bold tracking-tight text-foreground sm:text-xl lg:text-2xl">Current Streak</CardTitle>
        </div>
        <Badge variant="outline" className="border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          <Flame
            size={14}
            strokeWidth={2}
            className="mr-1 text-amber-500 dark:text-amber-400"
          />
          Hot
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3.5 sm:space-y-4">
        <div>
          <p className="text-[2rem] font-bold tracking-tight text-foreground sm:text-[2.5rem] lg:text-5xl">{days} days</p>
          <div className="mt-2.5 flex items-center gap-2 text-[13px] text-muted-foreground sm:text-sm">
            <Trophy size={16} strokeWidth={1.5} className="text-amber-500" />
            <span>{wordsSaved} saved words reinforcing your retention.</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <div className="rounded-[1rem] border border-border bg-accent/10 px-3 py-2.5 dark:bg-white/5 sm:rounded-2xl sm:py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Consistency
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">
              {days >= 7 ? "Strong" : "Building"}
            </p>
          </div>
          <div className="rounded-[1rem] border border-border bg-accent/10 px-3 py-2.5 dark:bg-white/5 sm:rounded-2xl sm:py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Vocab support
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">
              {wordsSaved} words
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
