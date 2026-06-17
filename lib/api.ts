import axios from "axios"
import { clearAuth, getRefreshToken, setTokens } from "@/lib/auth-store"
import type { Goal } from "@/lib/goals"
import type { Task } from "@/lib/tasks"

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

// Single-flight refresh: if several requests 401 at once, they all await the same
// refresh call instead of firing N parallel refreshes (which would fail after the
// first because the backend rotates/revokes the refresh token on use).
let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error("No refresh token")
  // Use a bare axios call (not `api`) so this request skips the interceptors and
  // can't recurse into another refresh.
  const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
  const data = res.data.data
  setTokens(data.accessToken, data.refreshToken)
  return data.accessToken as string
}

function forceLogout() {
  clearAuth()
  if (typeof window !== "undefined") {
    window.location.href = "/login"
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const isRefreshCall = typeof original?.url === "string" && original.url.includes("/auth/refresh")

    // On an expired access token, try to silently refresh once, then retry the
    // original request. Only log out if the refresh itself fails.
    if (status === 401 && original && !original._retry && !isRefreshCall) {
      original._retry = true
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null
          })
        }
        const newToken = await refreshPromise
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        forceLogout()
        return Promise.reject(error)
      }
    }

    // Refresh endpoint itself 401'd, or we already retried → session is truly dead.
    if (status === 401) {
      forceLogout()
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

  loginWithGoogle: (idToken: string) =>
    api.post("/auth/google", { idToken }).then((r) => r.data.data),

  // Revoke the refresh token server-side so it can't be reused after logout.
  logout: (refreshToken: string) =>
    api.post("/auth/logout", { refreshToken }).then((r) => r.data.data),
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

  // Conversation history list (backend supports limit/offset paging).
  listConversations: (limit = 20, offset = 0) =>
    api
      .get("/chat/conversations", { params: { limit, offset } })
      .then((r) => r.data.data),

  renameConversation: (conversationId: number, title: string) =>
    api
      .put(`/chat/conversations/${conversationId}`, { title })
      .then((r) => r.data.data),

  deleteConversation: (conversationId: number) =>
    api
      .delete(`/chat/conversations/${conversationId}`)
      .then((r) => r.data.data) as Promise<{ deleted: boolean }>,

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
export interface SearchUser {
  id: number
  displayName: string | null
  email: string | null
  avatarUrl: string | null
}

export const userApi = {
  getById: (id: number) =>
    api.get(`/users/${id}`).then((r) => r.data.data),

  // Goal-sharing user lookup — backend excludes the current user. Used by the
  // invite-member flow on the goal detail page.
  search: (query: string) =>
    api
      .get("/users/search", { params: { q: query } })
      .then((r) => r.data.data) as Promise<SearchUser[]>,

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

  uploadProfileImage: (id: number, file: File) => {
    const form = new FormData()
    form.append("file", file)
    return api
      .post(`/users/${id}/profile-image`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data)
  },

  // The image endpoint is auth-protected, so fetch it as a blob (token attached
  // by the interceptor) and return an object URL the <img> tag can render.
  getProfileImageUrl: async (id: number): Promise<string> => {
    const response = await api.get(`/users/${id}/profile-image`, { responseType: "blob" })
    return URL.createObjectURL(response.data)
  },
}

// Vocabulary
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

// Reading Units (user-created units, CRUD)
export type ReadingUnitPayload = Omit<import("@/lib/reading").ReadingUnit, "id">

export const readingApi = {
  getUnits: () =>
    api.get("/reading/units").then((r) => r.data.data) as Promise<
      import("@/lib/reading").ReadingUnit[]
    >,
  getUnit: (id: string) =>
    api.get(`/reading/units/${id}`).then((r) => r.data.data) as Promise<
      import("@/lib/reading").ReadingUnit
    >,
  createUnit: (data: ReadingUnitPayload) =>
    api.post("/reading/units", data).then((r) => r.data.data) as Promise<
      import("@/lib/reading").ReadingUnit
    >,
  updateUnit: (id: string, data: ReadingUnitPayload) =>
    api.put(`/reading/units/${id}`, data).then((r) => r.data.data) as Promise<
      import("@/lib/reading").ReadingUnit
    >,
  deleteUnit: (id: string) =>
    api.delete(`/reading/units/${id}`).then((r) => r.data.data) as Promise<{
      deleted: boolean
    }>,
}

// Workplace Korean Analyzer (Module 9)
export const analyzerApi = {
  analyze: (text: string, source?: string) =>
    api.post("/analyzer/analyze", { text, source }).then((r) => r.data.data),
  history: (limit = 30) =>
    api.get(`/analyzer/history?limit=${limit}`).then((r) => r.data.data),
}

// Mock Interview / Exam Prep
// The examiner Q&A itself runs over the chat backend (chatApi). These helpers
// keep interview-specific persistence — the written script the candidate
// submits before the exam — in one place per the api-layer convention.
export interface InterviewScript {
  topicId: string
  sections: Record<string, string>
  updatedAt: string
}

export const interviewApi = {
  getScript: (topicId: string) =>
    api
      .get(`/interview/scripts/${encodeURIComponent(topicId)}`)
      .then((r) => r.data.data) as Promise<InterviewScript | null>,
  saveScript: (topicId: string, sections: Record<string, string>) =>
    api
      .put(`/interview/scripts/${encodeURIComponent(topicId)}`, { sections })
      .then((r) => r.data.data) as Promise<InterviewScript>,
}

// ── Goal tracking (ported from Orbit / DailyGoalMap) ─────────────────────────
// Replaces Orbit's direct-to-Supabase data layer. Backend endpoints live on the
// Spring Boot service; goals/tasks are scoped to the JWT user. See INTEGRATION.md.

export interface CreateGoalPayload {
  title: string
  description?: string
  target_date?: string | null
  no_duration?: boolean
  status?: string
  metadata: Goal["metadata"]
}

export type UpdateGoalPayload = Partial<CreateGoalPayload>

// Goal member (backend GoalMemberResponse, camelCase).
export interface GoalMemberDto {
  id: string
  goalId: string
  userId: number
  role: "creator" | "member" | string
  displayName: string | null
  email: string | null
  joinedAt: string | null
  lastSeen: string | null
}

export const goalsApi = {
  list: (status?: string) =>
    api
      .get("/goals", { params: status ? { status } : undefined })
      .then((r) => r.data.data) as Promise<Goal[]>,
  get: (id: string) => api.get(`/goals/${id}`).then((r) => r.data.data) as Promise<Goal>,
  create: (data: CreateGoalPayload) =>
    api.post("/goals", data).then((r) => r.data.data) as Promise<Goal>,
  update: (id: string, data: UpdateGoalPayload) =>
    api.put(`/goals/${id}`, data).then((r) => r.data.data) as Promise<Goal>,
  remove: (id: string) => api.delete(`/goals/${id}`).then((r) => r.data.data),
  // Share-link / join-by-code (backend GoalMemberController). Anyone with the
  // share code can preview + join; only the creator can regenerate it.
  previewByShareCode: (code: string) =>
    api.get(`/goals/by-share-code/${code}`).then((r) => r.data.data) as Promise<Goal>,
  joinByShareCode: (code: string) =>
    api.post(`/goals/by-share-code/${code}/join`).then((r) => r.data.data) as Promise<Goal>,
  regenerateShareCode: (id: string) =>
    api
      .post(`/goals/${id}/share-code/regenerate`)
      .then((r) => r.data.data) as Promise<{ shareCode: string }>,
  // Members (GoalMemberController). Backend returns camelCase GoalMemberResponse.
  getMembers: (id: string) =>
    api.get(`/goals/${id}/members`).then((r) => r.data.data) as Promise<GoalMemberDto[]>,
  leaveGoal: (id: string) => api.delete(`/goals/${id}/members/me`).then((r) => r.data.data),
  removeMember: (id: string, userId: number) =>
    api.delete(`/goals/${id}/members/${userId}`).then((r) => r.data.data),
  toggleStar: (id: string) =>
    api.post(`/goals/${id}/star`).then((r) => r.data.data) as Promise<{ isStarred: boolean }>,
  getTasks: (id: string) =>
    api.get(`/goals/${id}/tasks`).then((r) => r.data.data) as Promise<Task[]>,
  // AI-generate tasks for a goal (reuses the server OpenAI key); returns created tasks.
  generateTasks: (id: string, body?: { count?: number; note?: string }) =>
    api.post(`/goals/${id}/generate-tasks`, body ?? {}).then((r) => r.data.data) as Promise<Task[]>,

  // Per-goal AI coach chat — SSE stream. Ephemeral: pass recent history each turn.
  // Mirrors chatApi.streamMessage's event protocol (token / done / error).
  coachStream: async (
    id: string,
    message: string,
    history: { role: "user" | "assistant"; content: string }[],
    onToken: (token: string) => void,
    onDone: () => void,
    signal?: AbortSignal,
  ): Promise<void> => {
    const token =
      typeof window !== "undefined" ? window.localStorage.getItem("token") : null
    const response = await fetch(`${API_BASE_URL}/goals/${id}/coach/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, history }),
      signal,
    })
    if (!response.ok) throw new Error(`Coach stream failed: ${response.status}`)
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
        if (line.startsWith("event:")) eventName = line.slice(6).trim()
        else if (line.startsWith("data:")) {
          const raw = line.slice(5).trim()
          if (eventName === "token") {
            try {
              onToken(JSON.parse(raw).token)
            } catch {
              /* ignore malformed chunk */
            }
          } else if (eventName === "done") {
            onDone()
          } else if (eventName === "error") {
            let msg = "Coach is unavailable right now."
            try {
              msg = JSON.parse(raw).message || msg
            } catch {
              /* ignore */
            }
            throw new Error(msg)
          }
          eventName = ""
        }
      }
    }
  },
  // Sends a goal invitation to another user. The receiver gets it through the
  // goal-notifications feed and responds via notificationsApi.respond.
  // Backend: POST /api/goal-notifications/invite with { goalId, receiverUserId }.
  invite: (id: string, receiverId: number) =>
    api
      .post("/goal-notifications/invite", { goalId: id, receiverUserId: receiverId })
      .then((r) => r.data.data),
}

export interface CreateTaskPayload {
  title?: string
  description?: string
  goal_id?: string | null
  start_date: string
  end_date: string
  daily_start_time?: string | null
  daily_end_time?: string | null
  is_anytime?: boolean | null
  duration_minutes?: number | null
  color?: string | null
  tags?: string[]
  completed?: boolean
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>

export const tasksApi = {
  // Range query backs both the calendar and the "today" widget.
  // goalId omitted = all the user's tasks; goalId null = personal tasks only.
  range: (params: { from?: string; to?: string; goalId?: string | null }) =>
    api.get("/tasks", { params }).then((r) => r.data.data) as Promise<Task[]>,
  create: (data: CreateTaskPayload) =>
    api.post("/tasks", data).then((r) => r.data.data) as Promise<Task>,
  update: (id: string, data: UpdateTaskPayload) =>
    api.put(`/tasks/${id}`, data).then((r) => r.data.data) as Promise<Task>,
  remove: (id: string) => api.delete(`/tasks/${id}`).then((r) => r.data.data),
}

// Goal notifications. Backend serializes these as camelCase (no @JsonNaming),
// unlike the snake_case goals/tasks payloads. Realtime is deferred — the client
// polls + invalidates instead (see INTEGRATION.md). Sending invites is wired via
// goalsApi.invite; this feed delivers them and respond() accepts/rejects.
export interface GoalNotification {
  id: string
  type: string
  goalId: string | null
  senderId: number | null
  receiverId: number | null
  invitationStatus: string | null
  read: boolean
  url: string | null
  senderDisplayName: string | null
  goalTitle: string | null
  createdAt: string | null
}

export const notificationsApi = {
  list: (onlyUnread = false) =>
    api
      .get("/goal-notifications", { params: { onlyUnread } })
      .then((r) => r.data.data) as Promise<GoalNotification[]>,
  markRead: (id: string) => api.put(`/goal-notifications/${id}/read`).then((r) => r.data.data),
  respond: (id: string, accept: boolean) =>
    api
      .put(`/goal-notifications/${id}/respond`, null, { params: { accept } })
      .then((r) => r.data.data),
}

// TTS
export const ttsApi = {
  speak: async (text: string, voice = "nova"): Promise<string> => {
    const response = await api.post("/tts", { text, voice }, { responseType: "blob" })
    return URL.createObjectURL(response.data)
  },
}

// Push notifications (browser Web Push + Telegram). Backend domain/push is already
// wired into the notification dispatcher; these are the client endpoints.
export interface TelegramLink {
  deepLink: string | null
  code: string
  botUsername: string | null
}

// Browser PushSubscription.toJSON() shape — POSTed verbatim to the backend.
export interface WebPushSubscriptionJSON {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export const pushApi = {
  // ── Telegram ──
  telegramLink: () =>
    api.post("/push/telegram/link").then((r) => r.data.data) as Promise<TelegramLink>,
  telegramStatus: () =>
    api.get("/push/telegram/status").then((r) => r.data.data) as Promise<{ linked: boolean }>,
  telegramUnlink: () => api.delete("/push/telegram").then((r) => r.data.data),

  // ── Web Push ──
  vapidPublicKey: () =>
    api.get("/push/web/vapid-public-key").then((r) => r.data.data) as Promise<{ publicKey: string }>,
  webSubscribe: (sub: WebPushSubscriptionJSON) =>
    api.post("/push/web/subscribe", sub).then((r) => r.data.data),
  webUnsubscribe: (endpoint: string) =>
    api.post("/push/web/unsubscribe", { endpoint }).then((r) => r.data.data),
}

export default api
