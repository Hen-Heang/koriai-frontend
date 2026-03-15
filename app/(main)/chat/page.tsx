"use client"

import { useCallback, useEffect, useState } from "react"
import { MessageCircle, AlertCircle } from "lucide-react"
import { motion } from "motion/react"

import { ChatWindow } from "@/components/chat/ChatWindow"
import { chatApi } from "@/lib/api"
import { cn } from "@/lib/utils"

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

  const containerHeight =
    "h-[calc(100dvh-8.75rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] min-h-[32rem] lg:h-[calc(100dvh-10rem)] lg:min-h-[36rem]"

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
            className="mt-2 text-xs font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-500 underline underline-offset-4"
          >
            Try refreshing
          </button>
        </motion.div>
      </div>
    )
  }

  if (!conversationId) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-4", containerHeight)}>
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-[2rem] bg-emerald-500/10 text-emerald-600 shadow-inner">
            <MessageCircle size={28} strokeWidth={2.5} />
          </div>
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -inset-2 rounded-[2.25rem] border-2 border-emerald-500/20"
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-black uppercase tracking-widest text-foreground">Initializing AI</p>
          <div className="flex items-center gap-1.5 mt-1">
            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="h-1 w-1 rounded-full bg-emerald-500" />
            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-1 w-1 rounded-full bg-emerald-500" />
            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-1 w-1 rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={containerHeight}
    >
      <ChatWindow
        title="AI Language Tutor"
        subtitle="Active Session · Korean"
        conversationId={conversationId}
        onNewChat={startNewChat}
        isStartingNewChat={isStartingNewChat}
      />
    </motion.div>
  )
}
