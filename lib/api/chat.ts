import type { Conversation, Message } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"
import { authHeaders } from "./ai-client"
import { readSseStream } from "./sse"

// Chat over kori_conversations / kori_messages. The AI reply itself streams
// from app/api/ai/chat/stream (same start / token / done / error SSE protocol
// the Spring backend used); that route also persists both message rows.

type ConversationRow = {
  id: string
  user_id: string
  scenario_id: string | null
  title: string
  conversation_type: string
  model_used: string | null
  created_at: string
  updated_at: string
  kori_messages?: { count: number }[]
}

function toConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    userId: row.user_id,
    scenarioId: row.scenario_id,
    title: row.title,
    conversationType: row.conversation_type,
    modelUsed: row.model_used ?? "",
    messageCount: row.kori_messages?.[0]?.count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

type MessageRow = {
  id: string
  conversation_id: string
  role: string
  content: string
  corrections: string | null
  tokens_used: number
  created_at: string
}

function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    corrections: row.corrections,
    tokensUsed: row.tokens_used,
    createdAt: row.created_at,
  }
}

const CONVERSATION_SELECT = "*, kori_messages(count)"

export const chatApi = {
  createConversation: async (title: string, conversationType: string): Promise<Conversation> => {
    const userId = requireUserId()
    const { data, error } = await supabase
      .from("kori_conversations")
      .insert({ user_id: userId, title, conversation_type: conversationType })
      .select(CONVERSATION_SELECT)
      .single()
    if (error) throw error
    return toConversation(data as unknown as ConversationRow)
  },

  // Non-streaming send is served by the same route as the stream (it just
  // resolves with the full reply instead of tokens).
  sendMessage: async (conversationId: string, message: string) => {
    let full = ""
    let assistantMessageId = ""
    await chatApi.streamMessage(
      conversationId,
      message,
      (token) => {
        full += token
      },
      () => undefined,
      (id) => {
        assistantMessageId = id
      },
    )
    return { assistantMessageId, content: full }
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const { data, error } = await supabase
      .from("kori_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
    if (error) throw error
    return (data as MessageRow[]).map(toMessage)
  },

  getConversation: async (conversationId: string): Promise<Conversation> => {
    const { data, error } = await supabase
      .from("kori_conversations")
      .select(CONVERSATION_SELECT)
      .eq("id", conversationId)
      .single()
    if (error) throw error
    return toConversation(data as unknown as ConversationRow)
  },

  listConversations: async (limit = 20, offset = 0): Promise<Conversation[]> => {
    const { data, error } = await supabase
      .from("kori_conversations")
      .select(CONVERSATION_SELECT)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) throw error
    return (data as unknown as ConversationRow[]).map(toConversation)
  },

  renameConversation: async (conversationId: string, title: string): Promise<Conversation> => {
    const { data, error } = await supabase
      .from("kori_conversations")
      .update({ title })
      .eq("id", conversationId)
      .select(CONVERSATION_SELECT)
      .single()
    if (error) throw error
    return toConversation(data as unknown as ConversationRow)
  },

  deleteConversation: async (conversationId: string): Promise<{ deleted: boolean }> => {
    const { error } = await supabase.from("kori_conversations").delete().eq("id", conversationId)
    if (error) throw error
    return { deleted: true }
  },

  streamMessage: async (
    conversationId: string,
    message: string,
    onToken: (token: string) => void,
    onStart: (userMessageId: string) => void,
    onDone: (assistantMessageId: string) => void,
    signal?: AbortSignal,
  ): Promise<void> => {
    const response = await fetch(`/api/ai/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ conversationId, message }),
      signal,
    })

    if (!response.ok) throw new Error(`Stream failed: ${response.status}`)

    await readSseStream(response, (event, raw) => {
      const data = JSON.parse(raw)
      if (event === "start") onStart(String(data.userMessageId))
      else if (event === "token") onToken(data.token)
      else if (event === "done") onDone(String(data.assistantMessageId))
      else if (event === "error") throw new Error(data.message)
    })
  },
}

/* ── Spring backend implementation (kept for later restore; the original SSE
      parser body is identical — only the URL and auth header changed) ─────────
import { api, API_BASE_URL } from "./client"

export const chatApi = {
  createConversation: (title: string, conversationType: string) =>
    api.post("/chat/conversations", { title, conversationType }).then((r) => r.data.data),
  sendMessage: (conversationId: number, message: string) =>
    api.post("/chat/send", { conversationId, message }).then((r) => r.data.data),
  getMessages: (conversationId: number) =>
    api.get(`/chat/conversations/${conversationId}/messages`).then((r) => r.data.data),
  getConversation: (conversationId: number) =>
    api.get(`/chat/conversations/${conversationId}`).then((r) => r.data.data),
  listConversations: (limit = 20, offset = 0) =>
    api.get("/chat/conversations", { params: { limit, offset } }).then((r) => r.data.data),
  renameConversation: (conversationId: number, title: string) =>
    api.put(`/chat/conversations/${conversationId}`, { title }).then((r) => r.data.data),
  deleteConversation: (conversationId: number) =>
    api.delete(`/chat/conversations/${conversationId}`).then((r) => r.data.data),
  streamMessage: async (...) => { fetch(`${API_BASE_URL}/chat/stream`, ...) },
}
────────────────────────────────────────────────────────────────────────────── */
