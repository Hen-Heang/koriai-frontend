import { z } from "zod"
import { jsonAiRoute } from "@/lib/server/ai"

export const POST = jsonAiRoute(
  z.object({
    challengePrompt: z.string(),
    contextHint: z.string(),
    exampleAnswer: z.string(),
  }),
  (body) =>
    `Create a practice challenge for the Korean phrase "${String(body.phrase)}" (${String(body.meaning)}): ` +
    "an English prompt describing a workplace situation where the learner should use the phrase in a Korean " +
    "sentence, a context hint, and one example answer.",
)
