"use client"

import { useEffect, useRef, useState } from "react"

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

// Voice mode = spoken Korean immersion. The labelled EN:/RR: lines let the UI
// show subtitles and let TTS speak only the Korean part.
const VOICE_MODE_INSTRUCTION =
  "This is a spoken Korean conversation for speaking practice. Reply in natural, " +
  "simple Korean appropriate to my level (1-3 short sentences) and always end with a " +
  "short follow-up question so we keep talking. After the Korean, add the English " +
  "translation on a new line starting with 'EN: ' and the Revised Romanization on a " +
  "new line starting with 'RR: '. If I made a Korean mistake, gently give the correct " +
  "version on a new line starting with 'FIX: '."

function buildMessageForApi(
  content: string,
  language: ResponseLanguage,
  isTechnical: boolean,
  voiceMode: boolean,
): string {
  const instructions = []

  if (voiceMode) {
    instructions.push(VOICE_MODE_INSTRUCTION)
  } else if (language === "english") {
    instructions.push("Reply in English unless I ask for another language.")
  } else if (language === "korean") {
    instructions.push("Reply in Korean unless I ask for another language.")
  }

  if (isTechnical) {
    instructions.push("I am a software developer. Use technical and workplace Korean terms (IT terminology, office honorifics) where appropriate. Explain advanced terms in a developer-friendly way.")
  }

  if (instructions.length === 0) return content

  return `${content}\n\n[Response preference: ${instructions.join(" ")}]`
}

export function useChat({ conversationId, initialMessages = [] }: UseChatOptions) {
  const [messages, setMessages] = useState(conversationId ? [] : initialMessages)
  const [draft, setDraft] = useState("")
  const [responseLanguage, setResponseLanguage] = useState<ResponseLanguage>("auto")
  const [isTechnicalMode, setIsTechnicalMode] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const [error, setError] = useState("")
  const [isLoadingMessages, setIsLoadingMessages] = useState(Boolean(conversationId))
  const [isSending, setIsSending] = useState(false)

  // Tracks the in-flight stream so we can cancel it when the user navigates
  // away or switches conversations, instead of leaking the fetch and writing
  // to an unmounted component.
  const abortRef = useRef<AbortController | null>(null)
  useEffect(() => () => abortRef.current?.abort(), [])

  // Reset during render when switching conversations, so stale messages
  // never flash while the new history loads.
  const [activeConversationId, setActiveConversationId] = useState(conversationId)
  if (activeConversationId !== conversationId) {
    setActiveConversationId(conversationId)
    setMessages([])
    setDraft("")
    setError("")
    setIsLoadingMessages(Boolean(conversationId))
  }

  useEffect(() => {
    if (!conversationId) {
      return
    }

    let active = true

    chatApi
      .getMessages(conversationId)
      .then((data) => {
        if (!active) {
          return
        }
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
      .catch(() => {
        if (active) {
          setError("Failed to load messages.")
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingMessages(false)
        }
      })

    return () => {
      active = false
    }
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

    const streamingId = crypto.randomUUID()
    setMessages((current) => [
      ...current,
      { id: streamingId, role: "assistant", content: "", createdAt: new Date().toISOString() },
    ])

    setIsSending(true)

    // Cancel any prior in-flight stream, then track this one for cleanup.
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    // Tokens arrive far faster than the screen refreshes. Buffer them and flush
    // once per animation frame (~60fps) so a long reply triggers ~60 re-renders
    // a second instead of one per token (which made replies stutter as they grew).
    let pending = ""
    let frame: number | null = null
    // Cancels any scheduled frame and applies buffered tokens immediately, so
    // every caller can just `flush()` without repeating the cancel dance.
    const flush = () => {
      if (frame !== null) {
        cancelAnimationFrame(frame)
        frame = null
      }
      if (!pending) return
      const chunk = pending
      pending = ""
      setMessages((current) =>
        current.map((m) => (m.id === streamingId ? { ...m, content: m.content + chunk } : m))
      )
    }

    try {
      await chatApi.streamMessage(
        conversationId,
        buildMessageForApi(nextContent, nextLanguage, isTechnicalMode, voiceMode),
        (token) => {
          pending += token
          if (frame === null) frame = requestAnimationFrame(flush)
        },
        () => {
          // user message already shown
        },
        (assistantMessageId) => {
          flush()
          setMessages((current) =>
            current.map((m) => (m.id === streamingId ? { ...m, id: assistantMessageId } : m))
          )
        },
        controller.signal,
      )
      // Flush any tail tokens if the stream ended without a `done` event.
      flush()
      setError("")
    } catch (err) {
      flush()
      // Aborted (navigation/new send) — drop the placeholder silently.
      if (err instanceof DOMException && err.name === "AbortError") {
        setMessages((current) => current.filter((m) => m.id !== streamingId))
        return
      }
      setError("Failed to send message.")
      setMessages((current) => current.filter((m) => m.id !== streamingId))
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
    isTechnicalMode,
    setIsTechnicalMode,
    voiceMode,
    setVoiceMode,
  }
}
