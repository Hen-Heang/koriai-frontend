import { z } from "zod"
import { DEFAULT_MODEL, jsonAiRoute } from "@/lib/server/ai"

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
  modelUsed: z.string().default(DEFAULT_MODEL),
})

export const POST = jsonAiRoute(
  schema,
  (body) =>
    `Analyze this Korean workplace message a developer received${body.source ? ` (via ${String(body.source)})` : ""}:\n` +
    `"${String(body.text)}"\n\n` +
    "Give: literal meaning, natural meaning, the business context/subtext, politeness level, tone, " +
    "a fragment-by-fragment breakdown (fragment, meaning, grammar/culture note), and 3 suggested Korean replies " +
    `(with English + formality). Set modelUsed to "${DEFAULT_MODEL}".`,
)
