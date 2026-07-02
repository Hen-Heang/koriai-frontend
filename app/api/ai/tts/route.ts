import { requireUser } from "@/lib/server/ai"

// Text-to-speech via OpenAI's audio API (the AI SDK has no stable speech call
// yet); returns raw MP3 bytes for an <audio> object URL.
export async function POST(req: Request): Promise<Response> {
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth

  const { text, voice } = (await req.json().catch(() => ({}))) as {
    text?: string
    voice?: string
  }
  if (!text) return Response.json({ error: "text is required" }, { status: 400 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return Response.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 })

  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.TTS_MODEL ?? "gpt-4o-mini-tts",
      voice: voice ?? "nova",
      input: text.slice(0, 2000),
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    return Response.json({ error: `TTS failed: ${res.status} ${detail.slice(0, 200)}` }, { status: 500 })
  }
  return new Response(res.body, { headers: { "Content-Type": "audio/mpeg" } })
}
