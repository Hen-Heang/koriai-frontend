import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Scenario } from "@/lib/types"

const scenarios: Scenario[] = [
  {
    id: "restaurant",
    title: "Restaurant Ordering",
    category: "food",
    level: "Beginner",
    summary: "Practice ordering food, asking for recommendations, and paying naturally.",
    goal: "Order politely and handle follow-up questions from staff.",
  },
  {
    id: "job-interview",
    title: "Job Interview",
    category: "career",
    level: "Advanced",
    summary: "Train formal self-introduction and experience-based answers.",
    goal: "Respond clearly with professional vocabulary and structure.",
  },
  {
    id: "hospital",
    title: "Doctor Visit",
    category: "medical",
    level: "Intermediate",
    summary: "Explain symptoms and understand simple treatment instructions.",
    goal: "Describe pain, duration, and follow-up advice accurately.",
  },
]

export default function ScenariosPage() {
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
              <p className="text-sm leading-7 text-muted-foreground">
                {scenario.summary}
              </p>
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
