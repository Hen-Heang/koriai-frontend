import { z } from "zod"
import { jsonAiRoute } from "@/lib/server/ai"

export const POST = jsonAiRoute(
  z.object({
    cardId: z.string(),
    term: z.string(),
    meaning: z.string(),
    challengePrompt: z.string(),
    contextHint: z.string(),
    exampleAnswer: z.string(),
  }),
  (body) =>
    `Create a sentence-writing challenge for the Korean word "${String(body.term)}" (${String(body.meaning)}). ` +
    "Return the cardId/term/meaning back unchanged, plus: a short English prompt describing a workplace situation " +
    "where the learner must use the word in a Korean sentence, a context hint, and one example answer. " +
    `cardId: ${String(body.cardId)}`,
)
