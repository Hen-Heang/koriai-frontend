import { z } from "zod"
import { FORMALITY_LABELS, jsonAiRoute } from "@/lib/server/ai"

export const POST = jsonAiRoute(
  z.object({
    intent: z.string(),
    category: z.string().nullable(),
    variations: z.array(
      z.object({
        korean: z.string(),
        romanization: z.string().nullable(),
        formality: z.string().nullable(),
        situation: z.string().nullable(),
      }),
    ),
    note: z.string().nullable(),
  }),
  (body) =>
    "You are a Korean workplace messaging coach for foreign software engineers at Korean tech companies.\n" +
    `The user wants to express the following intent at work: "${String(body.intent)}"` +
    `${body.category ? ` (category: ${String(body.category)})` : ""}\n` +
    "Rules:\n" +
    "- Provide exactly 3 variations ordered from most formal to most casual.\n" +
    `- Each formality must be exactly one of ${FORMALITY_LABELS}.\n` +
    "- Each Korean message must be natural workplace Korean a real Korean developer would use.\n" +
    "- \"note\" should give 1-2 sentences of overall English guidance on choosing between the variations.\n" +
    "- All explanations must be in English.\n\n" +
    "For each variation: the Korean message, romanization, formality label, and the best situation to use it. " +
    "Echo the intent and category back.",
)
