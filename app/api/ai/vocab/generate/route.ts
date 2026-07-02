import { z } from "zod"
import { jsonAiRoute } from "@/lib/server/ai"

export const POST = jsonAiRoute(
  z.object({
    words: z.array(
      z.object({
        term: z.string(),
        meaning: z.string(),
        pronunciation: z.string().nullable(),
        example: z.string().nullable(),
        exampleTranslation: z.string().nullable(),
        difficultyLevel: z.enum(["Easy", "Medium", "Hard"]).nullable(),
      }),
    ),
  }),
  (body) =>
    `Generate ${Number(body.count) || 10} Korean vocabulary items for the category "${String(body.category)}", ` +
    "aimed at a software developer working in Korea. Each item: the Korean term, a concise English meaning, " +
    "romanized pronunciation, one workplace example sentence, its English translation, and a difficulty level.",
)
