import { api } from "./client"

// TTS
export const ttsApi = {
  speak: async (text: string, voice = "nova"): Promise<string> => {
    const response = await api.post("/tts", { text, voice }, { responseType: "blob" })
    return URL.createObjectURL(response.data)
  },
}
