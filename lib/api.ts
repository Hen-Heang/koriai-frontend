import axios from "axios"
import { clearAuth } from "@/lib/auth-store"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api"

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  const serverMessage = error.response?.data?.data?.message
  if (typeof serverMessage === "string" && serverMessage.trim()) {
    return serverMessage
  }

  if (!error.response) {
    return `Cannot connect to the backend at ${API_BASE_URL}. Make sure the backend is running and CORS is configured for this frontend origin.`
  }

  return error.message || fallback
}

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("token") : null

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth()
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

// Auth
export const authApi = {
  register: (data: {
    email: string
    password: string
    displayName: string
    koreanLevel: string
    country?: string
    nativeLanguage?: string
    occupation?: string
    yearsOfExperience?: number
    learningGoal?: string
  }) => api.post("/auth/register", data).then((r) => r.data.data),

  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data).then((r) => r.data.data),
}

// Chat
export const chatApi = {
  createConversation: (title: string, conversationType: string) =>
    api
      .post("/chat/conversations", { title, conversationType })
      .then((r) => r.data.data),

  sendMessage: (conversationId: number, message: string) =>
    api
      .post("/chat/send", { conversationId, message })
      .then((r) => r.data.data),

  getMessages: (conversationId: number) =>
    api
      .get(`/chat/conversations/${conversationId}/messages`)
      .then((r) => r.data.data),

  getConversation: (conversationId: number) =>
    api.get(`/chat/conversations/${conversationId}`).then((r) => r.data.data),

  streamMessage: async (
    conversationId: number,
    message: string,
    onToken: (token: string) => void,
    onStart: (userMessageId: string) => void,
    onDone: (assistantMessageId: string) => void,
    signal?: AbortSignal,
  ): Promise<void> => {
    const token =
      typeof window !== "undefined" ? window.localStorage.getItem("token") : null
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ conversationId, message }),
      signal,
    })

    if (!response.ok) throw new Error(`Stream failed: ${response.status}`)
    if (!response.body) throw new Error("No response body")

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    let eventName = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim()
        } else if (line.startsWith("data:")) {
          const data = JSON.parse(line.slice(5).trim())
          if (eventName === "start") onStart(String(data.userMessageId))
          else if (eventName === "token") onToken(data.token)
          else if (eventName === "done") onDone(String(data.assistantMessageId))
          else if (eventName === "error") throw new Error(data.message)
          eventName = ""
        }
      }
    }
  },
}

// Correction
export const correctionApi = {
  check: (text: string) =>
    api.post("/corrections/check", { text }).then((r) => r.data.data),
  history: (limit = 10) =>
    api.get(`/corrections/history?limit=${limit}`).then((r) => r.data.data),
}

// Users
export const userApi = {
  getById: (id: number) =>
    api.get(`/users/${id}`).then((r) => r.data.data),

  updateProfile: (
    id: number,
    data: {
      displayName: string
      koreanLevel: string
      country?: string
      nativeLanguage?: string
      occupation?: string
      yearsOfExperience?: number
      learningGoal?: string
    }
  ) => api.put(`/users/${id}/profile`, data).then((r) => r.data.data),

  updatePreferredModel: (id: number, preferredModel: string) =>
    api.put(`/users/${id}/preferred-model`, { preferredModel }).then((r) => r.data.data),
}

// Vocabulary
export const vocabApi = {
  getSavedWords: () => api.get("/vocab").then((r) => r.data.data),
  getDueWords: () => api.get("/vocab/review/due").then((r) => r.data.data),
  markReviewed: (id: string, correct = true) => api.post(`/vocab/${id}/review?correct=${correct}`).then((r) => r.data.data),
  save: (data: { category?: string; term: string; meaning: string; example?: string }) =>
    api.post("/vocab/save", data).then((r) => r.data.data),
  generate: (category: string, count = 10) =>
    api.post(`/vocab/generate?category=${encodeURIComponent(category)}&count=${count}`).then((r) => r.data.data),
  importList: (category: string, text: string) =>
    api.post("/vocab/import", { category, text }).then((r) => r.data.data),
  update: (id: string, data: { term: string; meaning: string; example?: string; pronunciation?: string; category?: string }) =>
    api.put(`/vocab/${id}`, data).then((r) => r.data.data),
  getSentenceChallenge: (id: string) =>
    api.get(`/vocab/${id}/sentence-challenge`).then((r) => r.data.data),
  checkSentence: (id: string, data: { challengePrompt: string; attempt: string }) =>
    api.post(`/vocab/${id}/check-sentence`, data).then((r) => r.data.data),
}

// Daily Phrase
export const dailyPhraseApi = {
  getToday: () => api.get("/daily-phrase/today").then((r) => r.data.data),
  getHistory: () => api.get("/daily-phrase/history").then((r) => r.data.data),
  markLearned: (id: string, learned = true) =>
    api.post(`/daily-phrase/${id}/learned?learned=${learned}`).then((r) => r.data.data),
  addToFlashcards: (id: string) =>
    api.post(`/daily-phrase/${id}/flashcard`).then((r) => r.data.data),
  getPractice: (id: string) =>
    api.get(`/daily-phrase/${id}/practice`).then((r) => r.data.data),
  checkPractice: (id: string, data: { challengePrompt: string; attempt: string }) =>
    api.post(`/daily-phrase/${id}/check-practice`, data).then((r) => r.data.data),
}

// Workplace Message Generator
export const messageGenApi = {
  getCategories: () =>
    api.get("/message-generator/categories").then((r) => r.data.data) as Promise<string[]>,
  generate: (intent: string, category?: string) =>
    api.post("/message-generator/generate", { intent, category }).then((r) => r.data.data),
}

// Listening Practice
export const listeningApi = {
  getTopics: () =>
    api.get("/listening/topics").then((r) => r.data.data) as Promise<string[]>,
  generate: (topic: string) =>
    api.post(`/listening/generate?topic=${encodeURIComponent(topic)}`).then((r) => r.data.data),
  getLessons: () => api.get("/listening/lessons").then((r) => r.data.data),
  getLesson: (id: string) => api.get(`/listening/lessons/${id}`).then((r) => r.data.data),
  submitAttempt: (lessonId: string, answers: number[]) =>
    api.post("/listening/attempts", { lessonId: Number(lessonId), answers }).then((r) => r.data.data),
}

// Achievements / Gamification
export const achievementsApi = {
  getSummary: () => api.get("/achievements").then((r) => r.data.data),
  check: () => api.post("/achievements/check").then((r) => r.data.data),
}

// Dashboard / Progress
export const progressApi = {
  getDashboard: () => api.get("/dashboard/progress").then((r) => r.data.data),
  getStreak: () => api.get("/dashboard/streak").then((r) => r.data.data) as Promise<{ streakDays: number; activityToday: boolean }>,
  getActivityDays: (month: string) =>
    api.get(`/dashboard/activity?month=${month}`).then((r) => r.data.data) as Promise<string[]>,
}

// Scenarios
export const scenarioApi = {
  getList: () => api.get("/scenarios").then((r) => r.data.data),
  getById: (id: string) => api.get(`/scenarios/${id}`).then((r) => r.data.data),
}

// Workplace Korean Analyzer (Module 9)
export const analyzerApi = {
  analyze: (text: string, source?: string) =>
    api.post("/analyzer/analyze", { text, source }).then((r) => r.data.data),
  history: (limit = 30) =>
    api.get(`/analyzer/history?limit=${limit}`).then((r) => r.data.data),
}

// TTS
export const ttsApi = {
  speak: async (text: string, voice = "nova"): Promise<string> => {
    const response = await api.post("/tts", { text, voice }, { responseType: "blob" })
    return URL.createObjectURL(response.data)
  },
}

export default api
