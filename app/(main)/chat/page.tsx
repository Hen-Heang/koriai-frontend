"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { motion } from "motion/react"

import { ChatWindow } from "@/components/chat/ChatWindow"
import { chatApi } from "@/lib/api"
import { cn } from "@/lib/utils"

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageContent />
    </Suspense>
  )
}

function ChatPageContent() {
  const searchParams = useSearchParams()
  const initialDraft = searchParams.get("prompt") ?? undefined
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

  const containerHeight =
    "h-[100dvh] lg:h-[calc(100dvh-10rem)] lg:min-h-[36rem]"

  if (error && !conversationId) {
    return (
      <div className={cn("flex items-center justify-center p-4", containerHeight)}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 text-center max-w-sm p-8 rounded-[2.5rem] border border-destructive/20 bg-destructive/5"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-black text-foreground">Connection Error</h3>
            <p className="mt-2 text-sm font-medium text-muted-foreground leading-relaxed">{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-500 underline underline-offset-4"
          >
            Try refreshing
          </button>
        </motion.div>
      </div>
    )
  }

  // Render the chat shell immediately (empty state + composer) instead of
  // blocking the whole page on createConversation. The composer enables itself
  // the moment the conversation id arrives (~one quick round trip).
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={containerHeight}
    >
      <ChatWindow
        title="AI Language Tutor"
        subtitle={conversationId ? "Active Session · Korean" : "Connecting…"}
        conversationId={conversationId ?? undefined}
        initialDraft={initialDraft}
        onNewChat={startNewChat}
        isStartingNewChat={isStartingNewChat}
      />
    </motion.div>
  )
}
