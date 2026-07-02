import { z } from "zod"
import { jsonAiRoute } from "@/lib/server/ai"

export const POST = jsonAiRoute(
  z.object({
    tasks: z.array(
      z.object({
        title: z.string(),
        description: z.string().nullable(),
        start_date: z.string().describe("ISO date"),
        end_date: z.string().describe("ISO date"),
        duration_minutes: z.number().nullable(),
      }),
    ),
  }),
  (body) =>
    `Break this goal into ${Number(body.count) || 5} concrete tasks:\n` +
    `Goal: ${String(body.goalTitle)}\nDescription: ${String(body.goalDescription ?? "")}\n` +
    `Target date: ${String(body.targetDate ?? "none")}\nToday: ${new Date().toISOString().slice(0, 10)}\n` +
    `${body.note ? `Extra instructions: ${String(body.note)}\n` : ""}` +
    "Each task: title, one-line description, realistic start_date and end_date (ISO dates between today and the " +
    "target date), and estimated duration in minutes.",
  "You are a practical project planner. Make tasks small, ordered, and achievable.",
)
