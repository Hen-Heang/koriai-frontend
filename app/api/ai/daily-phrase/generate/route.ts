import { z } from "zod"
import { jsonAiRoute } from "@/lib/server/ai"

export const POST = jsonAiRoute(
  z.object({
    phrase: z.string(),
    meaning: z.string(),
    romanization: z.string().nullable(),
    whenToUse: z.string().nullable(),
    formality: z.string().nullable(),
    similarExpressions: z.array(z.object({ phrase: z.string(), meaning: z.string() })),
  }),
  async (_body, { db }) => {
    const { data: profile } = await db.from("kori_profiles").select("korean_level").maybeSingle()
    const { data: recent } = await db
      .from("kori_daily_phrases")
      .select("phrase")
      .order("date", { ascending: false })
      .limit(30)
    const avoid = (recent ?? []).map((r) => r.phrase).join(", ")
    return (
      `Give one useful Korean workplace phrase of the day for a ${profile?.korean_level ?? "BEGINNER"} learner ` +
      "who is a software developer in Korea. Include meaning, romanization, when to use it, its formality level, " +
      `and 2 similar expressions. Avoid these recently used phrases: ${avoid || "(none)"}.`
    )
  },
)
