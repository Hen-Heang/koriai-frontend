// Shared server-side plumbing for the app/api/ai/* routes — the AI features the
// Spring backend used to own. Server-only: uses OPENAI_API_KEY.
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js"
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import type { z } from "zod"
import { SUPABASE_URL, SUPABASE_KEY } from "@/lib/supabase"

export const DEFAULT_MODEL = process.env.AI_MODEL ?? "gpt-5-mini"

export function aiModel(name?: string | null) {
  return openai(name || DEFAULT_MODEL)
}

// gpt-5-mini is a reasoning model that defaults to "medium" reasoning effort
// and "medium" verbosity when neither is specified — noticeable latency for
// tasks as small as grading one sentence or looking up a word. Every route's
// generateObject/streamText call should pass this so the model only "thinks"
// as much as a short-form tutoring task actually needs.
export const AI_PROVIDER_OPTIONS = {
  openai: {
    reasoningEffort: "low",
    textVerbosity: "low",
  },
} as const

export interface AuthedRequest {
  user: User
  // Per-request client carrying the caller's JWT → RLS applies, no service key.
  db: SupabaseClient
}

export async function requireUser(req: Request): Promise<AuthedRequest | Response> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!token) return Response.json({ error: "Not signed in" }, { status: 401 })
  const db = createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await db.auth.getUser(token)
  if (error || !data.user) return Response.json({ error: "Invalid session" }, { status: 401 })
  return { user: data.user, db }
}

export const TUTOR_SYSTEM =
  "You are Hengo, a Korean-language tutor for software developers working in Korea. " +
  "Focus on practical workplace and technical Korean. Be concise and encouraging."

// Shared across every Korean-formality-producing prompt so the model always
// picks from the same three labels instead of inventing its own wording.
export const FORMALITY_LABELS = "반말 (casual), 존댓말 (polite), or 격식체 (formal)"

export interface LearnerProfile {
  occupation?: string | null
  learningGoal?: string | null
  nativeLanguage?: string | null
  country?: string | null
}

// Personalization snippet spliced into tutoring prompts — tailors examples/
// difficulty to the learner's job and goal without the model calling it out
// explicitly. Returns "" when nothing is set, so callers can drop it cleanly.
export function learnerProfileBlock(profile: LearnerProfile | null | undefined): string {
  if (!profile) return ""
  const lines: string[] = []
  if (profile.occupation) lines.push(`- Job: ${profile.occupation}`)
  if (profile.learningGoal) lines.push(`- Main learning goal: ${profile.learningGoal}`)
  if (profile.nativeLanguage) {
    lines.push(
      `- Native language: ${profile.nativeLanguage} — for hard words you may add a short gloss in ${profile.nativeLanguage} in addition to English.`,
    )
  }
  if (profile.country) lines.push(`- From: ${profile.country}`)
  if (lines.length === 0) return ""
  return (
    "About the learner (use this to tailor examples, topics, and difficulty to their job and goal — " +
    "don't mention it explicitly unless relevant):\n" +
    lines.join("\n")
  )
}

/** Factory for the JSON AI endpoints: auth → prompt → generateObject → JSON. */
export function jsonAiRoute<S extends z.ZodType>(
  schema: S,
  buildPrompt: (body: Record<string, unknown>, ctx: AuthedRequest) => string | Promise<string>,
  system: string = TUTOR_SYSTEM,
) {
  return async function POST(req: Request): Promise<Response> {
    const auth = await requireUser(req)
    if (auth instanceof Response) return auth
    try {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
      const prompt = await buildPrompt(body, auth)
      const { object } = await generateObject({
        model: aiModel(),
        providerOptions: AI_PROVIDER_OPTIONS,
        schema,
        system,
        prompt,
      })
      return Response.json(object)
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI request failed"
      return Response.json({ error: message }, { status: 500 })
    }
  }
}

// ── SSE helpers (same event protocol the Spring stream endpoints used) ──────

export function sseChunk(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

export function sseResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
