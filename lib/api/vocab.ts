import { api } from "./client"

export const vocabApi = {
  getSavedWords: () => api.get("/vocab").then((r) => r.data.data),
  getDueWords: () => api.get("/vocab/review/due").then((r) => r.data.data),
  markReviewed: (id: string, correct = true) => api.post(`/vocab/${id}/review?correct=${correct}`).then((r) => r.data.data),
  rate: (id: string, rating: "AGAIN" | "HARD" | "GOOD" | "EASY") =>
    api.post(`/vocab/${id}/rate?rating=${rating}`).then((r) => r.data.data),
  save: (data: { category?: string; term: string; meaning: string; example?: string }) =>
    api.post("/vocab/save", data).then((r) => r.data.data),
  lookup: (word: string) =>
    api.get(`/vocab/lookup?word=${encodeURIComponent(word)}`).then((r) => r.data.data) as Promise<{
      word: string
      definition: string
      example?: string | null
      exampleTranslation?: string | null
      hanja?: string | null
    }>,
  generate: (category: string, count = 10) =>
    api.post(`/vocab/generate?category=${encodeURIComponent(category)}&count=${count}`).then((r) => r.data.data),
  importList: (category: string, text: string) =>
    api.post("/vocab/import", { category, text }).then((r) => r.data.data),
  update: (id: string, data: { term: string; meaning: string; example?: string; pronunciation?: string; category?: string }) =>
    api.put(`/vocab/${id}`, data).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/vocab/${id}`).then((r) => r.data.data),
  getSentenceChallenge: (id: string) =>
    api.get(`/vocab/${id}/sentence-challenge`).then((r) => r.data.data),
  checkSentence: (id: string, data: { challengePrompt: string; attempt: string }) =>
    api.post(`/vocab/${id}/check-sentence`, data).then((r) => r.data.data),

  // All-time best correct-streak in quiz/recall review mode, server-backed so
  // it syncs across devices.
  getBestStreak: () =>
    api.get("/vocab/best-streak").then((r) => r.data.data) as Promise<{ bestStreak: number }>,
  submitBestStreak: (streak: number) =>
    api.post(`/vocab/best-streak?streak=${streak}`).then((r) => r.data.data) as Promise<{ bestStreak: number }>,
}
