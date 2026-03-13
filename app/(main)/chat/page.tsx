"use client"

import { useEffect, useState } from "react"

import { ChatWindow } from "@/components/chat/ChatWindow"
import { chatApi } from "@/lib/api"

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    chatApi
      .createConversation("General Practice", "FREE_CHAT")
      .then((data) => setConversationId(data.id))
      .catch(() => setError("Failed to start conversation. Please refresh."))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Chat</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          AI Korean chat tutor
        </h1>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {conversationId ? (
        <ChatWindow
          title="General Practice"
          subtitle="Conversation mode with inline corrections and translation support."
          conversationId={conversationId}
        />
      ) : !error ? (
        <p className="text-sm text-muted-foreground">Starting conversation…</p>
      ) : null}
    </div>
  )
}
