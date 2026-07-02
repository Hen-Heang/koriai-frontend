import { streamText } from "ai"
import { aiModel, requireUser, sseChunk, sseResponse } from "@/lib/server/ai"

// Per-goal AI coach — ephemeral SSE chat (token* → done), history passed by the
// client each turn, nothing persisted. Mirrors the Spring coach/stream protocol.
export async function POST(req: Request): Promise<Response> {
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  const { db } = auth

  const { goalId, message, history } = (await req.json().catch(() => ({}))) as {
    goalId?: string
    message?: string
    history?: { role: "user" | "assistant"; content: string }[]
  }
  if (!goalId || !message) {
    return Response.json({ error: "goalId and message are required" }, { status: 400 })
  }

  const { data: goal } = await db
    .from("goals")
    .select("title, description, target_date, status, metadata")
    .eq("id", goalId)
    .single()
  if (!goal) return Response.json({ error: "Goal not found" }, { status: 404 })

  const system =
    "You are a supportive, practical goal coach. The user's goal:\n" +
    `Title: ${goal.title}\nDescription: ${goal.description ?? ""}\n` +
    `Target date: ${goal.target_date ?? "none"} · Status: ${goal.status}\n` +
    "Give specific, actionable advice in short paragraphs."

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const result = streamText({
          model: aiModel(),
          system,
          messages: [...(history ?? []).slice(-20), { role: "user" as const, content: message }],
        })
        for await (const token of result.textStream) {
          controller.enqueue(sseChunk("token", { token }))
        }
        controller.enqueue(sseChunk("done", {}))
      } catch (err) {
        controller.enqueue(
          sseChunk("error", { message: err instanceof Error ? err.message : "Coach failed" }),
        )
      } finally {
        controller.close()
      }
    },
  })

  return sseResponse(stream)
}
