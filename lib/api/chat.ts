import { api, API_BASE_URL } from "./client"

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
