// Assorted single-purpose learning-feature endpoints. Each is a small, distinct
// surface (correction, daily phrase, message generator, listening, scenarios,
// analyzer); grouped here to avoid a sprawl of two-method files.
import { api } from "./client"

// Correction
export const correctionApi = {
  check: (text: string) =>
    api.post("/corrections/check", { text }).then((r) => r.data.data),
  history: (limit = 10) =>
    api.get(`/corrections/history?limit=${limit}`).then((r) => r.data.data),
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
