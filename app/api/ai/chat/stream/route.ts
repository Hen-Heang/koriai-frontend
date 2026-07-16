import { streamText } from "ai"
import { AI_PROVIDER_OPTIONS, aiModel, requireUser, sseChunk, sseResponse, TUTOR_SYSTEM } from "@/lib/server/ai"

// Streaming chat reply. Persists both message rows (RLS via the caller's JWT)
// and emits the same SSE events the Spring /chat/stream endpoint used:
// start { userMessageId } → token { token }* → done { assistantMessageId }.
export async function POST(req: Request): Promise<Response> {
  const requestStartedAt = performance.now()
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  const { user, db } = auth

  const body = (await req.json().catch(() => ({}))) as {
    conversationId?: string
    message?: string
  }
  const conversationId = body.conversationId
  const message = body.message?.trim()
  if (!conversationId || !message) {
    return Response.json({ error: "conversationId and message are required" }, { status: 400 })
  }

  // Conversation must exist and belong to the caller (RLS enforces the latter).
  const { data: conversation, error: convError } = await db
    .from("kori_conversations")
    .select("id")
    .eq("id", conversationId)
    .single()
  if (convError || !conversation) {
    return Response.json({ error: "Conversation not found" }, { status: 404 })
  }

  const [{ data: historyRows }, { data: profile }, { data: userMessage, error: insertError }] = await Promise.all([
    db
      .from("kori_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(29),
    db.from("kori_profiles").select("korean_level, preferred_model").maybeSingle(),
    db
      .from("kori_messages")
      .insert({ conversation_id: conversationId, user_id: user.id, role: "user", content: message })
      .select("id")
      .single(),
  ])
  if (insertError) return Response.json({ error: insertError.message }, { status: 500 })

  const history = [
    ...((historyRows ?? []).reverse().map((row) => ({
      role: row.role as "user" | "assistant",
      content: row.content,
    }))),
    { role: "user" as const, content: message },
  ]
  const preparedAt = performance.now()

  const system =
    `${TUTOR_SYSTEM} The learner's level is ${profile?.korean_level ?? "BEGINNER"}. ` +
    "Reply in natural Korean appropriate to their level, and add short English help when useful."

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(sseChunk("start", { userMessageId: userMessage.id }))
      let firstTokenAt: number | null = null
      try {
        const result = streamText({
          model: aiModel(profile?.preferred_model),
          providerOptions: AI_PROVIDER_OPTIONS,
          system,
          messages: history,
        })
        let full = ""
        for await (const token of result.textStream) {
          if (firstTokenAt === null) {
            firstTokenAt = performance.now()
          }
          full += token
          controller.enqueue(sseChunk("token", { token }))
        }
        const generationFinishedAt = performance.now()
        const [assistantInsert, conversationTouch] = await Promise.all([
          db
            .from("kori_messages")
            .insert({
              conversation_id: conversationId,
              user_id: user.id,
              role: "assistant",
              content: full,
            })
            .select("id")
            .single(),
          db
            .from("kori_conversations")
            .update({ model_used: profile?.preferred_model ?? null })
            .eq("id", conversationId),
        ])
        if (assistantInsert.error) throw assistantInsert.error
        if (conversationTouch.error) throw conversationTouch.error
        const completedAt = performance.now()
        console.info("[chat-stream] timings", {
          conversationId,
          historyCount: history.length,
          prepareMs: Math.round(preparedAt - requestStartedAt),
          firstTokenMs: firstTokenAt === null ? null : Math.round(firstTokenAt - requestStartedAt),
          generationMs: Math.round(generationFinishedAt - preparedAt),
          persistMs: Math.round(completedAt - generationFinishedAt),
          totalMs: Math.round(completedAt - requestStartedAt),
        })
        controller.enqueue(sseChunk("done", { assistantMessageId: assistantInsert.data.id }))
      } catch (err) {
        controller.enqueue(
          sseChunk("error", { message: err instanceof Error ? err.message : "Chat failed" }),
        )
      } finally {
        controller.close()
      }
    },
  })

  return sseResponse(stream)
}


