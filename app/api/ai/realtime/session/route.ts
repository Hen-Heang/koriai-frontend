import { createHash } from "node:crypto"

import { requireUser } from "@/lib/server/ai"

const REALTIME_MODEL = process.env.REALTIME_MODEL ?? "gpt-realtime-2.1"

type KoreanLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED"

const VOICE_LEVELS: Record<
  KoreanLevel,
  { speed: number; maxOutputTokens: number; instructions: string }
> = {
  BEGINNER: {
    speed: 0.88,
    maxOutputTokens: 500,
    instructions:
      "- Use beginner Korean (TOPIK 1 / A1-A2) in polite 해요체. Use common everyday words and one idea per sentence. Avoid slang, idioms, abstract vocabulary, long clauses, and advanced connective endings.\n" +
      "- Reply with 3-4 short sentences, usually 4-8 Korean words per sentence. Keep the conversation substantial by using simple sentences, not by making sentences complex.\n" +
      "- Introduce at most one new expression per turn. When useful, naturally repeat or rephrase the key expression. Ask one simple open question.",
  },
  INTERMEDIATE: {
    speed: 0.94,
    maxOutputTokens: 700,
    instructions:
      "- Use intermediate Korean (roughly TOPIK 2-3 / B1) in natural polite speech. Prefer familiar vocabulary and clear sentence structures; explain uncommon expressions with a simpler Korean rephrasing.\n" +
      "- Reply with 3-5 natural sentences (about 25-50 Korean words), add at most two useful new expressions, and ask one relevant open question.",
  },
  ADVANCED: {
    speed: 0.99,
    maxOutputTokens: 900,
    instructions:
      "- Use natural advanced Korean appropriate to the topic, including nuanced vocabulary and idioms when they genuinely fit. Do not make the wording complex just to sound advanced.\n" +
      "- Reply with 4-6 natural sentences (about 40-75 Korean words) and ask one relevant open question.",
  },
}

function cleanProfileValue(value: unknown, maxLength = 120): string | null {
  if (typeof value !== "string") return null
  const cleaned = value.replace(/\s+/g, " ").trim()
  return cleaned ? cleaned.slice(0, maxLength) : null
}

function normalizeKoreanLevel(value: unknown): KoreanLevel {
  const normalized = cleanProfileValue(value, 30)?.toUpperCase()
  if (normalized === "ADVANCED") return "ADVANCED"
  if (normalized === "INTERMEDIATE") return "INTERMEDIATE"
  return "BEGINNER"
}

export async function POST(req: Request): Promise<Response> {
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return Response.json({ error: "Realtime voice is not configured" }, { status: 503 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    conversationId?: string
    technicalMode?: boolean
  }

  if (!body.conversationId) {
    return Response.json({ error: "conversationId is required" }, { status: 400 })
  }

  const [{ data: conversation, error: conversationError }, { data: profile }] = await Promise.all([
    auth.db
      .from("kori_conversations")
      .select("id, conversation_type")
      .eq("id", body.conversationId)
      .maybeSingle(),
    auth.db
      .from("kori_profiles")
      .select("display_name, korean_level, occupation, learning_goal, native_language, country")
      .maybeSingle(),
  ])

  if (conversationError || !conversation) {
    return Response.json({ error: "Conversation not found" }, { status: 404 })
  }

  const learnerName = cleanProfileValue(profile?.display_name, 60) ?? "the learner"
  const level = normalizeKoreanLevel(profile?.korean_level)
  const voiceLevel = VOICE_LEVELS[level]
  const occupation = cleanProfileValue(profile?.occupation)
  const learningGoal = cleanProfileValue(profile?.learning_goal)
  const nativeLanguage = cleanProfileValue(profile?.native_language, 60)
  const country = cleanProfileValue(profile?.country, 60)
  const profileDetails = [
    occupation && `Job: ${occupation}`,
    learningGoal && `Learning goal: ${learningGoal}`,
    nativeLanguage && `Native language: ${nativeLanguage} (do not speak it unless explicitly requested)`,
    country && `Country: ${country}`,
  ].filter(Boolean)
  const profileBlock = profileDetails.length
    ? `Learner context (adapt quietly; do not announce this profile):\n${profileDetails.map((line) => `- ${line}`).join("\n")}`
    : ""
  const practiceContext = body.technicalMode
    ? "Prioritize realistic Korean for software work, meetings, code reviews, and office relationships."
    : "Use practical everyday Korean and let the learner guide the topic naturally."

  const instructions =
    `You are Hengo, a warm Korean conversation partner and speaking coach for ${learnerName}. ` +
    `Their approximate Korean level is ${level}. The practice type is ${conversation.conversation_type}.\n\n` +
    "VOICE AND LANGUAGE:\n" +
    "- Speak only natural, contemporary Korean. Never read English translations, romanization, markdown, labels, or stage directions aloud.\n" +
    "- Sound like a real person in a relaxed one-to-one conversation: warm, responsive, expressive, and never scripted.\n" +
    "- Speak clearly at the configured learner pace, with natural intonation and a brief pause between every sentence.\n\n" +
    "LEVEL RULES (follow these strictly):\n" +
    `${voiceLevel.instructions}\n\n` +
    "CONVERSATION BEHAVIOR:\n" +
    "- React specifically to what the learner said, add one useful idea or personal-style observation, and move the same topic forward. Vary your openings and never praise automatically.\n" +
    "- Let the learner finish. If they pause mid-thought, wait patiently. They may interrupt you; adapt naturally and do not complain.\n" +
    "- Match vocabulary and grammar to their level. If they struggle, simplify and offer a short example in Korean.\n" +
    "- Correct only an important mistake that affects naturalness or meaning. First respond to their idea, then say '더 자연스럽게 말하면…' with one concise correction, and continue the conversation.\n" +
    "- On the first response when no learner audio has been provided yet, greet them warmly in Korean, introduce one easy topic, and ask a simple question that invites more than yes/no.\n" +
    `- ${practiceContext}\n` +
    (profileBlock ? `\n${profileBlock}\n` : "")

  const safetyIdentifier = createHash("sha256").update(auth.user.id).digest("hex")

  try {
    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Safety-Identifier": safetyIdentifier,
      },
      body: JSON.stringify({
        expires_after: { anchor: "created_at", seconds: 600 },
        session: {
          type: "realtime",
          model: REALTIME_MODEL,
          output_modalities: ["audio"],
          instructions,
          max_output_tokens: voiceLevel.maxOutputTokens,
          audio: {
            input: {
              noise_reduction: { type: "near_field" },
              transcription: {
                model: "gpt-4o-mini-transcribe",
                language: "ko",
                prompt: "Natural Korean conversation. Preserve Korean names, workplace terms, and software vocabulary accurately.",
              },
              turn_detection: {
                type: "semantic_vad",
                eagerness: "low",
                create_response: true,
                interrupt_response: true,
              },
            },
            output: {
              voice: "marin",
              speed: voiceLevel.speed,
            },
          },
        },
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      console.error("[realtime-session] OpenAI rejected session", response.status, detail)
      return Response.json({ error: "Could not start realtime voice" }, { status: 502 })
    }

    const data = (await response.json()) as { value?: string; expires_at?: number }
    if (!data.value) {
      return Response.json({ error: "Realtime voice returned no client secret" }, { status: 502 })
    }

    return Response.json({
      clientSecret: data.value,
      expiresAt: data.expires_at ?? null,
      model: REALTIME_MODEL,
      learnerLevel: level,
      speechRate: voiceLevel.speed,
    })
  } catch (error) {
    console.error("[realtime-session] Failed to create session", error)
    return Response.json({ error: "Could not connect to realtime voice" }, { status: 502 })
  }
}
