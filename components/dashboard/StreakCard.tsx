import { Flame, Trophy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type StreakCardProps = {
  days: number
  wordsSaved: number
}

export function StreakCard({ days, wordsSaved }: StreakCardProps) {
  return (
    <Card className="rounded-[2rem] border-border/60 bg-linear-to-br from-amber-50 via-white to-rose-50 shadow-lg shadow-slate-950/5 dark:border-amber-400/10 dark:bg-[linear-gradient(135deg,rgba(120,53,15,0.28),rgba(30,41,59,0.92)_44%,rgba(76,5,25,0.48))]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl dark:text-white">Current Streak</CardTitle>
        <Badge variant="outline" className="dark:border-amber-400/20 dark:bg-amber-300/10 dark:text-amber-100">
          <Flame
            size={20}
            strokeWidth={1.5}
            className="mr-1 text-amber-500 dark:text-amber-300"
          />
          Hot
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-5xl font-semibold tracking-tight dark:text-white">{days} days</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-slate-300">
          <Trophy size={20} strokeWidth={1.5} className="text-current" />
          {wordsSaved} saved words are reinforcing your retention.
        </div>
      </CardContent>
    </Card>
  )
}
