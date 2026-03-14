"use client"

import { useEffect, useState } from "react"

import { chatApi } from "@/lib/api"
import type { ChatMessage, MessageRole } from "@/lib/types"

type UseChatOptions = {
  conversationId?: number
  initialMessages?: ChatMessage[]
}

type ResponseLanguage = "auto" | "english" | "korean"

function detectLanguagePreference(input: string): ResponseLanguage | null {
  const normalized = input.toLowerCase()

  const wantsEnglish =
    /\benglish\b/.test(normalized) ||
    /\bin english\b/.test(normalized) ||
    /\bspeak english\b/.test(normalized) ||
    /\buse english\b/.test(normalized) ||
    /영어/.test(input)

  if (wantsEnglish) {
    return "english"
  }

  const wantsKorean =
    /\bkorean\b/.test(normalized) ||
    /\bin korean\b/.test(normalized) ||
    /\buse korean\b/.test(normalized) ||
    /한국어|한글/.test(input)

  if (wantsKorean) {
    return "korean"
  }

  return null
}

function buildMessageForApi(content: string, language: ResponseLanguage): string {
  if (language === "english") {
    return `${content}\n\n[Response preference: Reply in English unless I ask for another language.]`
  }

  if (language === "korean") {
    return `${content}\n\n[Response preference: Reply in Korean unless I ask for another language.]`
  }

  return content
}

export function useChat({ conversationId, initialMessages = [] }: UseChatOptions) {
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState("")
  const [responseLanguage, setResponseLanguage] = useState<ResponseLanguage>("auto")
  const [error, setError] = useState("")
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (!conversationId) {
      return
    }

    setMessages([])
    setDraft("")
    setError("")
    setIsLoadingMessages(true)
    chatApi
      .getMessages(conversationId)
      .then((data) => {
        setError("")
        const history = Array.isArray(data) ? data : []
        const normalized = history.map((item, index) => {
          const message = item as Record<string, unknown>
          const role: MessageRole =
            message.role === "assistant" || message.senderType === "ASSISTANT"
              ? "assistant"
              : "user"
          return {
            id: String(message.id ?? message.messageId ?? `${conversationId}-${index}`),
            role,
            content: String(message.content ?? message.message ?? message.text ?? ""),
            correction: message.correction ? String(message.correction) : undefined,
            translation: message.translation ? String(message.translation) : undefined,
            createdAt: String(message.createdAt ?? new Date().toISOString()),
          }
        })
        setMessages(normalized)
      })
      .catch(() => setError("Failed to load messages."))
      .finally(() => setIsLoadingMessages(false))
  }, [conversationId])

  const sendMessage = async (content?: string) => {
    const nextContent = (content ?? draft).trim()

    if (!nextContent || isSending) {
      return
    }

    const detectedLanguage = detectLanguagePreference(nextContent)
    const nextLanguage = detectedLanguage ?? responseLanguage
    if (detectedLanguage) {
      setResponseLanguage(detectedLanguage)
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: nextContent,
      createdAt: new Date().toISOString(),
    }

    setMessages((current) => [...current, userMessage])
    setDraft("")

    if (!conversationId) {
      setError("Conversation is not available.")
      return
    }

    setIsSending(true)
    try {
      const response = await chatApi.sendMessage(
        conversationId,
        buildMessageForApi(nextContent, nextLanguage)
      )
      setError("")
      const assistantMessage: ChatMessage = {
        id: String(response.assistantMessageId),
        role: "assistant",
        content: response.assistantReply,
        createdAt: new Date().toISOString(),
      }
      setMessages((current) => [...current, assistantMessage])
    } catch {
      setError("Failed to send message.")
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            nextLanguage === "korean"
              ? "문제가 발생했어요. 다시 시도해 주세요."
              : "Sorry, something went wrong. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  return {
    draft,
    error,
    isLoadingMessages,
    isStreaming: isSending,
    messages,
    sendMessage,
    setDraft,
  }
}
