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
    `You are a Korean language practice coach for foreign software engineers at Korean tech companies.\n` +
    `Create a sentence-writing challenge for the Korean word "${String(body.term)}" (${String(body.meaning)}).\n` +
    "Rules:\n" +
    "- challengePrompt must be in English, action-oriented, workplace-focused.\n" +
    "- contextHint must be 1 short English sentence giving the scene (e.g. standup, Slack message, code review).\n" +
    "- exampleAnswer must use the Korean term naturally and be realistic for a Korean tech company.\n\n" +
    "Return the cardId/term/meaning back unchanged, plus: challengePrompt, contextHint, and exampleAnswer. " +
    `cardId: ${String(body.cardId)}`,
)
