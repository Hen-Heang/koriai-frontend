"use client"

import { useCallback, useEffect, useState } from "react"

import { ChatWindow } from "@/components/chat/ChatWindow"
import { chatApi } from "@/lib/api"

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [isStartingNewChat, setIsStartingNewChat] = useState(false)

  useEffect(() => {
    chatApi
      .createConversation("General Practice", "FREE_CHAT")
      .then((data) => setConversationId(data.id))
      .catch(() => setError("Failed to start conversation. Please refresh."))
  }, [])

  const startNewChat = useCallback(async () => {
    setIsStartingNewChat(true)
    setError("")
    try {
      const data = await chatApi.createConversation("General Practice", "FREE_CHAT")
      setConversationId(data.id)
    } catch {
      setError("Failed to start a new conversation. Please try again.")
    } finally {
      setIsStartingNewChat(false)
    }
  }, [])

  return (
    <div className="flex w-full max-w-full flex-col gap-3 overflow-x-hidden">
      {/* Title hidden on mobile — ChatWindow header already shows it */}
      <div className="hidden lg:block">
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Chat</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">AI Korean chat tutor</h1>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {conversationId ? (
        <ChatWindow
          title="General Practice"
          subtitle="Conversation mode with inline corrections and translation support."
          conversationId={conversationId}
          onNewChat={startNewChat}
          isStartingNewChat={isStartingNewChat}
        />
      ) : !error ? (
        <p className="text-sm text-muted-foreground">Starting conversation…</p>
      ) : null}
    </div>
  )
}
