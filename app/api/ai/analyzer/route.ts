import { streamObject } from "ai"
import { z } from "zod"
import {
  AI_PROVIDER_OPTIONS,
  DEFAULT_MODEL,
  FORMALITY_LABELS,
  aiModel,
  requireUser,
  sseChunk,
  sseResponse,
} from "@/lib/server/ai"

const schema = z.object({
  originalText: z.string(),
  literalMeaning: z.string(),
  naturalMeaning: z.string(),
  businessContext: z.string(),
  politenessLevel: z.string(),
  tone: z.string(),
  breakdown: z.array(z.object({ fragment: z.string(), meaning: z.string(), note: z.string() })),
  suggestedReplies: z.array(
    z.object({ korean: z.string(), english: z.string(), formality: z.string() }),
  ),
  modelUsed: z.string(),
})

const ANALYZER_SYSTEM =
  "You are a Korean workplace communication analyst helping a foreign software engineer fully understand real " +
  "Korean messages from coworkers (Slack, KakaoTalk, meeting notes, team chat)."

// Streams the analysis as it's generated (start → partial* → done → error),
// same SSE event shape as chat/stream and goals/coach, so the UI can render
// each field/breakdown item as soon as the model produces it instead of
// waiting ~8s for the whole structured object at once.
export async function POST(req: Request): Promise<Response> {
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const prompt =
    "Analyze the message below in EXTREME detail so a non-native engineer understands exactly what was meant, " +
    "how it lands socially, and how they should respond.\n" +
    "Rules:\n" +
    "- \"breakdown\" must cover EVERY meaningful phrase/honorific in the message so nothing is left unexplained.\n" +
    "- Pay special attention to honorifics (-시-, -습니다, -드리다, 분, 님) and explain the social signal each sends.\n" +
    `- \"politenessLevel\" must be exactly one of ${FORMALITY_LABELS}, followed by a short English note on who it's appropriate for.\n` +
    `- Provide 2-3 \"suggestedReplies\" ranging across formality (each formality exactly one of ${FORMALITY_LABELS}) unless a reply would be inappropriate, then return [].\n` +
    "- All explanations must be in English.\n\n" +
    `Analyze this Korean workplace message a developer received${body.source ? ` (via ${String(body.source)})` : ""}:\n` +
    `"${String(body.text)}"\n\n` +
    "Give: literal meaning, natural meaning, the business context/subtext, politeness level, tone, " +
    `the fragment breakdown, and suggested replies. Set modelUsed to "${DEFAULT_MODEL}".`

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(sseChunk("start", {}))
      try {
        const result = streamObject({
          model: aiModel(),
          providerOptions: AI_PROVIDER_OPTIONS,
          schema,
          system: ANALYZER_SYSTEM,
          prompt,
        })
        for await (const partial of result.partialObjectStream) {
          controller.enqueue(sseChunk("partial", partial))
        }
        const object = await result.object
        controller.enqueue(sseChunk("done", object))
      } catch (err) {
        controller.enqueue(
          sseChunk("error", { message: err instanceof Error ? err.message : "Analysis failed" }),
        )
      } finally {
        controller.close()
      }
    },
  })

  return sseResponse(stream)
}
