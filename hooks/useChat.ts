"use client"

import { useState, useTransition } from "react"

import type { ChatMessage } from "@/lib/types"

type UseChatOptions = {
  initialMessages?: ChatMessage[]
}

function createAssistantReply(content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: `좋아요. "${content}"에 맞춰서 더 자연스러운 한국어 표현으로 연습해볼게요.`,
    correction: "문장을 조금 더 자연스럽게 다듬고, 존댓말 톤을 유지해보세요.",
    translation: "Good. Let's practice a more natural Korean version of that sentence.",
    createdAt: new Date().toISOString(),
  }
}

export function useChat({ initialMessages = [] }: UseChatOptions = {}) {
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState("")
  const [isPending, startTransition] = useTransition()

  const sendMessage = (content?: string) => {
    const nextContent = (content ?? draft).trim()

    if (!nextContent) {
      return
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: nextContent,
      createdAt: new Date().toISOString(),
    }

    setMessages((current) => [...current, userMessage])
    setDraft("")

    startTransition(() => {
      window.setTimeout(() => {
        setMessages((current) => [...current, createAssistantReply(nextContent)])
      }, 700)
    })
  }

  return {
    draft,
    isStreaming: isPending,
    messages,
    sendMessage,
    setDraft,
  }
}
