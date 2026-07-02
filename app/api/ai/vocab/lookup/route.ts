import { z } from "zod"
import { jsonAiRoute } from "@/lib/server/ai"

export const POST = jsonAiRoute(
  z.object({
    word: z.string(),
    definition: z.string(),
    example: z.string().nullable(),
    exampleTranslation: z.string().nullable(),
    hanja: z.string().nullable(),
  }),
  (body) =>
    `Define the Korean word or phrase "${String(body.word)}" for a developer learning workplace Korean. ` +
    "Give a concise English definition, one natural workplace example sentence with its translation, " +
    "and the hanja if the word is Sino-Korean.",
)
