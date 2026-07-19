import { authHeaders } from "./ai-client"

export interface RealtimeSessionCredentials {
  clientSecret: string
  expiresAt: number | null
  model: string
  learnerLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  speechRate: number
}

export const realtimeApi = {
  createSession: async (
    conversationId: string,
    technicalMode: boolean,
    signal?: AbortSignal,
  ): Promise<RealtimeSessionCredentials> => {
    const response = await fetch("/api/ai/realtime/session", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ conversationId, technicalMode }),
      signal,
    })

    const data = (await response.json().catch(() => ({}))) as Partial<RealtimeSessionCredentials> & {
      error?: string
    }
    if (!response.ok || !data.clientSecret) {
      throw new Error(data.error || "Could not start realtime voice")
    }

    return {
      clientSecret: data.clientSecret,
      expiresAt: data.expiresAt ?? null,
      model: data.model ?? "gpt-realtime",
      learnerLevel: data.learnerLevel ?? "BEGINNER",
      speechRate: data.speechRate ?? 0.88,
    }
  },
}
