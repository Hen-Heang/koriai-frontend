import { z } from "zod"
import { jsonAiRoute } from "@/lib/server/ai"

export const POST = jsonAiRoute(
  z.object({
    challengePrompt: z.string(),
    contextHint: z.string(),
    exampleAnswer: z.string(),
  }),
  (body) =>
    `You are a Korean language practice coach for foreign software engineers at Korean tech companies.\n` +
    `Create a practice challenge for the Korean phrase "${String(body.phrase)}" (${String(body.meaning)}).\n` +
    "Rules:\n" +
    "- challengePrompt must be in English, action-oriented, workplace-focused.\n" +
    "- contextHint must be 1 short English sentence giving the scene.\n" +
    "- exampleAnswer must use the phrase naturally and be realistic for a Korean tech company.",
)
