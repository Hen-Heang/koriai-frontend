"use client"

import { useEffect, useRef } from "react"
import { ArrowUp, SquarePen, Sparkles } from "lucide-react"

import { MessageBubble } from "@/components/chat/MessageBubble"
import { TypingIndicator } from "@/components/chat/TypingIndicator"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useChat } from "@/hooks/useChat"
import type { ChatMessage } from "@/lib/types"

const SUGGESTIONS = [
  { emoji: "👋", label: "Greetings", text: "Teach me 5 everyday Korean greetings with pronunciation tips." },
  { emoji: "✍️", label: "Beginner chat", text: "I'm a beginner. Give me a simple Korean conversation I can practice right now." },
  { emoji: "🔤", label: "Grammar", text: "Explain the difference between 이/가 and 은/는 with short examples." },
  { emoji: "🛠️", label: "Fix my Korean", text: "Please correct this sentence and explain why: 저는 어제 학교에 갔어요 친구랑." },
]

type ChatWindowProps = {
  title: string
  subtitle: string
  conversationId?: number
  initialMessages?: ChatMessage[]
  onNewChat?: () => void
  isStartingNewChat?: boolean
}

export function ChatWindow({
  title,
  subtitle,
  conversationId,
  initialMessages,
  onNewChat,
  isStartingNewChat,
}: ChatWindowProps) {
  const {
    draft,
    error,
    isLoadingMessages,
    isStreaming,
    messages,
    sendMessage,
    setDraft,
  } = useChat({ conversationId, initialMessages })

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, isStreaming])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!isStreaming && !isLoadingMessages && draft.trim()) sendMessage()
    }
  }

  function sendSuggestion(text: string) {
    if (!conversationId || isStreaming || isLoadingMessages) return
    sendMessage(text)
  }

  const isEmpty = messages.length === 0 && !isLoadingMessages

  return (
    <div className="flex h-[calc(100dvh-9.5rem-env(safe-area-inset-bottom))] min-h-124 w-full max-w-full min-w-0 flex-col overflow-hidden rounded-[1.6rem] border border-slate-800 bg-[linear-gradient(180deg,#070b18_0%,#040814_100%)] text-slate-100 shadow-[0_24px_60px_rgba(2,6,23,0.42)] sm:min-h-136 sm:rounded-[2rem] lg:h-[calc(100dvh-7rem)] lg:min-h-152">

      {/* ── Compact header ── */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800/90 px-3 py-3 sm:px-6 sm:py-4">
        {/* Left: avatar + title + status */}
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          <div className="relative shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-linear-to-b from-violet-500 to-indigo-600 text-xs font-bold text-white shadow-[0_6px_18px_rgba(99,102,241,0.4)]">
              AI
            </div>
            {/* Online dot */}
            <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#070b18] bg-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-white">{title}</p>
            <p className="truncate text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden h-8 gap-1.5 rounded-xl border border-slate-700 bg-white/4 px-3 text-xs text-slate-300 hover:bg-white/8 hover:text-white sm:flex"
          >
            <Sparkles size={12} strokeWidth={1.5} />
            Prompt Boost
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700 bg-white/4 text-slate-300 hover:bg-white/8 hover:text-white sm:hidden"
          >
            <Sparkles size={14} strokeWidth={1.5} />
          </Button>
          {onNewChat && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 min-w-8 gap-1.5 rounded-xl border border-slate-700 bg-white/4 px-2.5 text-xs text-slate-300 hover:bg-white/8 hover:text-white sm:px-3"
              onClick={onNewChat}
              disabled={isStartingNewChat}
            >
              <SquarePen size={13} strokeWidth={1.5} />
              <span className="hidden sm:inline">{isStartingNewChat ? "Starting…" : "New Chat"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.05),transparent_28%)] px-3 py-4 sm:px-6 sm:py-6">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center gap-2 py-10">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:160ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:320ms]" />
          </div>
        ) : isEmpty ? (
          /* ── Empty state with suggestions ── */
          <div className="flex h-full flex-col items-center justify-center gap-5 px-1 py-2 sm:px-2">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20 text-xl">
                🇰🇷
              </div>
              <p className="text-base font-semibold text-white sm:text-xl">What would you like to practice?</p>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Tap a suggestion or type your own message below.
              </p>
            </div>

            {/* Suggestion chips */}
            <div className="grid w-full grid-cols-1 gap-2.5 sm:max-w-2xl sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  disabled={!conversationId || isStreaming}
                  onClick={() => sendSuggestion(s.text)}
                  className="flex min-w-0 flex-col items-start gap-1.5 overflow-hidden rounded-2xl border border-slate-700/80 bg-white/3 px-3.5 py-3 text-left transition-all hover:border-violet-500/40 hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:py-3.5"
                >
                  <span className="text-lg leading-none">{s.emoji}</span>
                  <span className="text-sm font-medium text-slate-200">{s.label}</span>
                  <span className="line-clamp-3 text-xs leading-5 text-slate-500">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isStreaming ? <TypingIndicator /> : null}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input area ── */}
      <div className="shrink-0 border-t border-slate-800/90 bg-[#050916]/90 px-3 py-3 backdrop-blur-sm sm:px-5 sm:py-4">
        {error ? <p className="mb-2 text-xs text-red-400">{error}</p> : null}
        <div className="flex min-w-0 items-end gap-2 rounded-[1.4rem] border border-slate-700 bg-white/4 px-3 py-2.5 transition-all focus-within:border-violet-500/50 focus-within:ring-2 focus-within:ring-violet-500/15 sm:px-4">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write in Korean or English…"
            className="max-h-32 min-h-0 min-w-0 flex-1 resize-none border-0 bg-transparent p-0 text-base text-slate-100 placeholder:text-slate-600 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-sm"
            disabled={!conversationId || isStreaming || isLoadingMessages}
            rows={1}
          />
          <Button
            type="button"
            size="icon"
            className="mb-0.5 h-9 w-9 shrink-0 rounded-xl bg-violet-600 text-white transition-all hover:bg-violet-500 disabled:opacity-30 sm:h-8 sm:w-8"
            disabled={!conversationId || isStreaming || isLoadingMessages || !draft.trim()}
            onClick={() => sendMessage()}
          >
            <ArrowUp size={15} strokeWidth={2.5} />
          </Button>
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-600 sm:text-[10px]">
          Enter to send · Shift+Enter for new line · KoriAI can make mistakes
        </p>
      </div>
    </div>
  )
}
