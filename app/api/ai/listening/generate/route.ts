import { z } from "zod"
import { jsonAiRoute } from "@/lib/server/ai"

export const POST = jsonAiRoute(
  z.object({
    title: z.string(),
    level: z.string(),
    lines: z.array(z.object({ speaker: z.string(), korean: z.string(), english: z.string() })),
    quiz: z.array(
      z.object({
        question: z.string(),
        options: z.array(z.string()).length(4),
        answerIndex: z.number().min(0).max(3),
        explanation: z.string(),
      }),
    ),
  }),
  async (body, { db }) => {
    const { data: profile } = await db.from("kori_profiles").select("korean_level").maybeSingle()
    return (
      `Create a Korean listening-practice dialogue about "${String(body.topic)}" in a software-company setting, ` +
      `for a ${profile?.korean_level ?? "BEGINNER"} learner. 8–12 dialogue lines between two named speakers ` +
      "(Korean + English translation per line), then 4 multiple-choice comprehension questions with 4 options each, " +
      "the correct answerIndex, and a short explanation. Give the lesson a title and level."
    )
  },
)
