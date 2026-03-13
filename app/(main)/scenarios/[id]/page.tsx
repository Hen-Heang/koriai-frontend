"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

import { ChatWindow } from "@/components/chat/ChatWindow"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { chatApi, scenarioApi } from "@/lib/api"
import type { ScenarioDetail } from "@/lib/types"

function normalizeLevel(rawLevel: unknown): ScenarioDetail["level"] {
  if (rawLevel === "Advanced" || rawLevel === "ADVANCED") {
    return "Advanced"
  }
  if (rawLevel === "Intermediate" || rawLevel === "INTERMEDIATE") {
    return "Intermediate"
  }
  return "Beginner"
}

export default function ScenarioDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ""
  const [scenario, setScenario] = useState<ScenarioDetail | null>(null)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) {
      return
    }

    Promise.all([scenarioApi.getById(id), chatApi.createConversation(id, "SCENARIO")])
      .then(([scenarioData, conversation]) => {
        const source = (scenarioData ?? {}) as Record<string, unknown>
        setScenario({
          id: String(source.id ?? ""),
          title: String(source.title ?? ""),
          category: String(source.category ?? "general"),
          level: normalizeLevel(source.level),
          summary: String(source.summary ?? ""),
          goal: String(source.goal ?? ""),
          introMessage: source.introMessage ? String(source.introMessage) : undefined,
        })
        const nextConversationId = Number(conversation?.id)
        setConversationId(Number.isFinite(nextConversationId) ? nextConversationId : null)
      })
      .catch(() => setError("Failed to load scenario."))
  }, [id])

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <ChatWindow
        title={scenario ? `Scenario: ${scenario.title}` : "Scenario"}
        subtitle="The AI stays in character and keeps role-play focused on this context."
        conversationId={conversationId ?? undefined}
      />
      <Card className="rounded-[2rem] border-border/60 bg-white/90 shadow-lg shadow-slate-950/5">
        <CardHeader>
          <CardTitle className="text-xl">Scenario briefing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {error ? <p className="text-red-500">{error}</p> : null}
          {!scenario && !error ? <p className="text-muted-foreground">Loading scenario…</p> : null}
          {scenario ? (
            <>
              <Badge variant="secondary">{scenario.level}</Badge>
              <p className="text-muted-foreground">{scenario.summary}</p>
              <div className="rounded-2xl bg-muted/70 p-4">
                <p className="font-medium text-foreground">Goal</p>
                <p className="mt-2 text-muted-foreground">{scenario.goal}</p>
              </div>
              <p className="text-xs text-muted-foreground">Scenario id: {id}</p>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
