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
