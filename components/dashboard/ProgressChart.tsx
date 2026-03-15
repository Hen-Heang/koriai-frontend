"use client"

import { useSyncExternalStore } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ProgressPoint } from "@/lib/types"

function subscribeToHydration(callback: () => void) {
  queueMicrotask(callback)
  return () => undefined
}

export function ProgressChart({ data }: { data: ProgressPoint[] }) {
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  )

  return (
    <Card className="overflow-hidden rounded-[1.8rem] border-border bg-card shadow-xl dark:bg-slate-900/60 dark:backdrop-blur-sm sm:rounded-3xl">
      <CardHeader className="pb-1 sm:pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
              Activity
            </p>
            <CardTitle className="mt-1 text-lg font-bold tracking-tight text-foreground sm:text-xl">Weekly Progress</CardTitle>
          </div>
          <div className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500/20 sm:px-3 sm:text-[11px]">
            Last 7 days
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3 sm:pt-4">
        <div className="h-56 min-w-0 w-full sm:h-64 lg:h-72">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ left: -20, right: 8, top: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="minutesFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="var(--color-border)"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11, fontWeight: 500 }}
                  dy={10}
                />
                <Tooltip
                  cursor={{ stroke: "var(--color-primary)", strokeWidth: 1, strokeDasharray: "4 4" }}
                  contentStyle={{
                    borderRadius: "16px",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-popover)",
                    color: "var(--color-popover-foreground)",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                    padding: "10px 14px",
                  }}
                  labelStyle={{ fontWeight: "bold", marginBottom: "4px", color: "var(--color-foreground)" }}
                  itemStyle={{ padding: 0, fontSize: "13px" }}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="var(--color-primary)"
                  fill="url(#minutesFill)"
                  strokeWidth={3}
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full rounded-2xl bg-muted/20 animate-pulse" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
