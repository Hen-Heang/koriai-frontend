"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

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
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Scenarios
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Choose a real-life simulation
        </h1>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {loading ? <p className="text-sm text-muted-foreground">Loading scenarios…</p> : null}
      {!loading && !scenarios.length ? (
        <p className="text-sm text-muted-foreground">No scenarios available yet.</p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {scenarios.map((scenario) => (
          <Card
            key={scenario.id}
            className="rounded-[2rem] border-border/60 bg-white/90 shadow-lg shadow-slate-950/5"
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-xl">{scenario.title}</CardTitle>
                <Badge variant="outline">{scenario.level}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-7 text-muted-foreground">{scenario.summary}</p>
              <div className="rounded-2xl bg-muted/70 p-3 text-sm">
                <p className="font-medium text-foreground">Goal</p>
                <p className="mt-1 text-muted-foreground">{scenario.goal}</p>
              </div>
              <Button asChild className="w-full">
                <Link href={`/scenarios/${scenario.id}`}>Start scenario</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
