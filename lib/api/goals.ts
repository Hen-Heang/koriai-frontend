// ── Goal tracking (ported from Orbit / DailyGoalMap) ─────────────────────────
// Replaces Orbit's direct-to-Supabase data layer. Backend endpoints live on the
// Spring Boot service; goals/tasks are scoped to the JWT user. See INTEGRATION.md.
import type { Goal } from "@/lib/goals"
import type { Task } from "@/lib/tasks"
import { api, API_BASE_URL } from "./client"

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
