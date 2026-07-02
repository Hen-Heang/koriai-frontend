import { z } from "zod"
import { jsonAiRoute } from "@/lib/server/ai"

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
    `Write 3 Korean workplace-message variations (formal 합니다체, polite 해요체, and casual-to-peers) that express: ` +
    `"${String(body.intent)}"${body.category ? ` (category: ${String(body.category)})` : ""}. ` +
    "For each: the Korean message, romanization, formality label, and when to use it. Add one short cultural note. " +
    "Echo the intent and category back.",
)
