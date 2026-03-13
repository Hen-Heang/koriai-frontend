"use client"

import { DailyGoalRing } from "@/components/dashboard/DailyGoalRing"
import { ProgressChart } from "@/components/dashboard/ProgressChart"
import { StreakCard } from "@/components/dashboard/StreakCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useProgress } from "@/hooks/useProgress"

export default function DashboardPage() {
  const { chartData, dailyAverage, stats } = useProgress()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Dashboard
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight dark:text-white">
          Your Korean learning pulse
        </h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <StreakCard days={stats.streakDays} wordsSaved={stats.wordsSaved} />
        <DailyGoalRing progress={stats.dailyGoalProgress} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <ProgressChart data={chartData} />
        <Card className="rounded-[2rem] border-border/60 bg-white/90 shadow-lg shadow-slate-950/5 dark:border-violet-400/10 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.9),rgba(15,23,42,0.96))]">
          <CardHeader>
            <CardTitle className="text-xl dark:text-white">Weekly summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl bg-muted/70 p-4 dark:bg-white/[0.06]">
              <p className="text-sm text-muted-foreground dark:text-slate-400">Practice time</p>
              <p className="mt-1 text-3xl font-semibold dark:text-white">{stats.weeklyMinutes} min</p>
            </div>
            <div className="rounded-3xl bg-muted/70 p-4 dark:bg-white/[0.06]">
              <p className="text-sm text-muted-foreground dark:text-slate-400">Average / day</p>
              <p className="mt-1 text-3xl font-semibold dark:text-white">{dailyAverage} min</p>
            </div>
            <div className="rounded-3xl bg-muted/70 p-4 dark:bg-white/[0.06]">
              <p className="text-sm text-muted-foreground dark:text-slate-400">Corrections this week</p>
              <p className="mt-1 text-3xl font-semibold dark:text-white">
                {stats.correctionsThisWeek}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
