import { requireUser } from "@/lib/server/ai"

const BUILT_IN_VOICES = new Set([
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
  "verse",
  "marin",
  "cedar",
])

// Text-to-speech via OpenAI's audio API (the AI SDK has no stable speech call
// yet); returns raw MP3 bytes for an <audio> object URL.
export async function POST(req: Request): Promise<Response> {
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth

  const { text, voice, instructions, speed } = (await req.json().catch(() => ({}))) as {
    text?: string
    voice?: string
    instructions?: string
    speed?: number
  }
  const input = text?.trim()
  if (!input) return Response.json({ error: "text is required" }, { status: 400 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return Response.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 })

  const model = process.env.TTS_MODEL ?? "gpt-4o-mini-tts"
  const supportsInstructions = model !== "tts-1" && model !== "tts-1-hd"
  const selectedVoice = voice && BUILT_IN_VOICES.has(voice) ? voice : "nova"
  const selectedSpeed =
    typeof speed === "number" && Number.isFinite(speed) && speed >= 0.25 && speed <= 4
      ? speed
      : undefined

  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      voice: selectedVoice,
      input: input.slice(0, 4096),
      ...(supportsInstructions && instructions?.trim()
        ? { instructions: instructions.trim().slice(0, 1200) }
        : {}),
      ...(selectedSpeed ? { speed: selectedSpeed } : {}),
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    return Response.json({ error: `TTS failed: ${res.status} ${detail.slice(0, 200)}` }, { status: 500 })
  }
  return new Response(res.body, { headers: { "Content-Type": "audio/mpeg" } })
}
