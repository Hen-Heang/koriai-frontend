import { z } from "zod"
import { jsonAiRoute } from "@/lib/server/ai"

export const POST = jsonAiRoute(
  z.object({
    originalText: z.string(),
    correctedText: z.string(),
    hasErrors: z.boolean(),
    explanation: z.string().nullable(),
    grammarPoints: z.array(z.string()),
  }),
  (body) =>
    `Check this Korean text written by a learner:\n"${String(body.text)}"\n\n` +
    "Return the original text, the corrected version (identical if already natural), whether it had errors, " +
    "a short English explanation of the main fixes, and the grammar points involved.",
)
