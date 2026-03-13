import axios from "axios"

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("token") : null

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Auth
export const authApi = {
  register: (data: { email: string; password: string; displayName: string; koreanLevel: string }) =>
    api.post("/auth/register", data).then((r) => r.data.data),

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
}

// Correction
export const correctionApi = {
  check: (text: string) =>
    api.post("/corrections/check", { text }).then((r) => r.data.data),
}

// Users
export const userApi = {
  getById: (id: number) =>
    api.get(`/users/${id}`).then((r) => r.data.data),

  updateProfile: (id: number, displayName: string, koreanLevel: string) =>
    api.put(`/users/${id}/profile`, { displayName, koreanLevel }).then((r) => r.data.data),

  updatePreferredModel: (id: number, preferredModel: string) =>
    api.put(`/users/${id}/preferred-model`, { preferredModel }).then((r) => r.data.data),
}

// Diary
export const diaryApi = {
  createOrUpdate: (entryDate: string, originalText: string) =>
    api.post("/diary", { entryDate, originalText }).then((r) => r.data.data),
}

// Vocabulary
export const vocabApi = {
  getSavedWords: () => api.get("/vocab").then((r) => r.data.data),
  getDueWords: () => api.get("/vocab/review/due").then((r) => r.data.data),
  markReviewed: (id: string) => api.post(`/vocab/${id}/review`).then((r) => r.data.data),
}

// Dashboard / Progress
export const progressApi = {
  getDashboard: () => api.get("/dashboard/progress").then((r) => r.data.data),
}

// Scenarios
export const scenarioApi = {
  getList: () => api.get("/scenarios").then((r) => r.data.data),
  getById: (id: string) => api.get(`/scenarios/${id}`).then((r) => r.data.data),
}

export default api
