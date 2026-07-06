import { supabase } from "@/lib/supabase"

// TTS — audio comes from the app/api/ai/tts route (OpenAI TTS behind the
// server key); returns an object URL for <audio>.
export const ttsApi = {
  speak: async (text: string, voice = "nova"): Promise<string> => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    const res = await fetch("/api/ai/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text, voice }),
    })
    if (!res.ok) throw new Error(`TTS failed (${res.status})`)
    return URL.createObjectURL(await res.blob())
  },
}
