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
    <Card className="rounded-[2rem] border-border/60 bg-white/90 shadow-lg shadow-slate-950/5 dark:border-cyan-400/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(3,7,18,0.95))]">
      <CardHeader>
        <CardTitle className="text-xl dark:text-white">Weekly Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 min-w-0 w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="minutesFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(148,163,184,0.18)"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "rgba(148,163,184,0.92)", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "18px",
                    border: "1px solid rgba(148,163,184,0.18)",
                    background: "rgba(2, 6, 23, 0.94)",
                    color: "#e2e8f0",
                    boxShadow: "0 16px 50px rgba(2, 6, 23, 0.35)",
                  }}
                  labelStyle={{ color: "#f8fafc" }}
                  itemStyle={{ color: "#99f6e4" }}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="#14b8a6"
                  fill="url(#minutesFill)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full rounded-3xl bg-muted/70 dark:bg-white/[0.04]" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
