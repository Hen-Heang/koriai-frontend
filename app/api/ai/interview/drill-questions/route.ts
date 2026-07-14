import { z } from "zod"
import { jsonAiRoute } from "@/lib/server/ai"

// Batch question generation for the speaking/listening drill pages. One call
// per session keeps latency and cost predictable; glosses + grammarNote ride
// along so the listening reveal is instant (speaking simply ignores them).

export const POST = jsonAiRoute(
  z.object({
    questions: z
      .array(
        z.object({
          ko: z.string(),
          en: z.string(),
          glosses: z
            .array(z.object({ term: z.string(), meaning: z.string() }))
            .max(4),
          grammarNote: z.string(),
        })
      )
      .min(1)
      .max(8),
  }),
  (body) => {
    const avoid = Array.isArray(body.avoid) ? (body.avoid as string[]) : []
    const examples = Array.isArray(body.styleExamples) ? (body.styleExamples as string[]) : []
    return (
      `Generate ${String(body.count ?? 5)} NEW Korean questions a K-Specialist interviewer would ask — ` +
      "mix the candidate's prepared topic (Korean summer weather vs Cambodia, its impact on daily life and health) with " +
      "everyday off-topic probes (life in Korea, work, hometown, food, hobbies, future plans, Korean study). " +
      (examples.length
        ? "Use the formal interviewer register of these examples:\n" +
          examples.map((q) => `- ${q}`).join("\n") +
          "\n"
        : "") +
      `\nDifficulty: ${String(body.complexityHint ?? "natural interview phrasing")}\n` +
      (avoid.length
        ? `Do NOT repeat or trivially rephrase any of these:\n${avoid.map((q) => `- ${q}`).join("\n")}\n`
        : "") +
      "\nFor each question: en = a natural English translation; glosses = up to 4 words from the question an " +
      "intermediate learner may not know (term = the Korean word exactly as it appears in the question, " +
      "meaning = a short English gloss); grammarNote = one short English note on a grammar pattern the question uses."
    )
  },
)
