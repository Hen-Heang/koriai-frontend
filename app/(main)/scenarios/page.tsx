"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, Theater, WandSparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { scenarioApi } from "@/lib/api"
import type { Scenario } from "@/lib/types"

function normalizeLevel(rawLevel: unknown): Scenario["level"] {
  if (rawLevel === "Advanced" || rawLevel === "ADVANCED") {
    return "Advanced"
  }
  if (rawLevel === "Intermediate" || rawLevel === "INTERMEDIATE") {
    return "Intermediate"
  }
  return "Beginner"
}

function normalizeScenario(raw: unknown): Scenario {
  const source = (raw ?? {}) as Record<string, unknown>
  return {
    id: String(source.id ?? ""),
    title: String(source.title ?? ""),
    category: String(source.category ?? "general"),
    level: normalizeLevel(source.level),
    summary: String(source.summary ?? ""),
    goal: String(source.goal ?? ""),
  }
}

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    scenarioApi
      .getList()
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setScenarios(list.map((item) => normalizeScenario(item)))
      })
      .catch(() => setError("Failed to load scenarios."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Scenarios
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Choose a real-life simulation
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          Practice Korean inside guided role-play situations with clearer goals and
          level-based difficulty.
        </p>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {loading ? (
        <div className="rounded-[1.75rem] border border-dashed border-border/70 bg-muted/30 px-5 py-6 text-sm text-muted-foreground">
          Loading scenarios...
        </div>
      ) : null}
      {!loading && !scenarios.length ? (
        <div className="rounded-[1.75rem] border border-dashed border-border/70 bg-muted/30 px-5 py-6">
          <p className="text-sm font-medium text-foreground">No scenarios available yet</p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Add scenario seeds from your backend and they will appear here as guided
            role-play sessions.
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {scenarios.map((scenario) => (
          <Card
            key={scenario.id}
            className="group rounded-[2rem] border-border/60 bg-white/90 shadow-lg shadow-slate-950/5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-950/10 dark:bg-slate-900/90"
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                    <Theater size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{scenario.title}</CardTitle>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {scenario.category}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{scenario.level}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-7 text-muted-foreground">{scenario.summary}</p>
              <div className="rounded-2xl bg-muted/70 p-3 text-sm">
                <p className="font-medium text-foreground">Goal</p>
                <p className="mt-1 text-muted-foreground">{scenario.goal}</p>
              </div>
              <Button asChild className="w-full rounded-2xl">
                <Link href={`/scenarios/${scenario.id}`} className="flex items-center justify-center gap-2">
                  <WandSparkles size={15} />
                  Start scenario
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
