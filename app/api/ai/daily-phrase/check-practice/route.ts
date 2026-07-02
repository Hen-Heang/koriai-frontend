import { z } from "zod"
import { jsonAiRoute } from "@/lib/server/ai"

export const POST = jsonAiRoute(
  z.object({
    score: z.number().min(0).max(100),
    correct: z.boolean(),
    feedback: z.string(),
    correctedSentence: z.string(),
    betterAlternative: z.string(),
    grammarNote: z.string(),
  }),
  (body) =>
    `Challenge: ${String(body.challengePrompt)}\nLearner's Korean sentence: ${String(body.attempt)}\n\n` +
    "Grade 0–100 (correct = score ≥ 70) with brief feedback, the corrected sentence, a more natural " +
    "alternative, and one grammar note.",
)
