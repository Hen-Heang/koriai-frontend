"use client"

import { useEffect, useRef } from "react"
import { ArrowUp, SquarePen, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, isStreaming])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = "0px"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [draft])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!isStreaming && !isLoadingMessages && draft.trim()) sendMessage()
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!isStreaming && !isLoadingMessages && draft.trim()) sendMessage()
  }

  function sendSuggestion(text: string) {
    if (!conversationId || isStreaming || isLoadingMessages) return
    sendMessage(text)
  }

  const isEmpty = messages.length === 0 && !isLoadingMessages

  return (
    <div className="flex h-full min-h-0 w-full max-w-full min-w-0 flex-col overflow-hidden rounded-[2.5rem] border border-border/60 bg-card shadow-2xl dark:bg-slate-950/40 dark:backdrop-blur-md">

      {/* ── Desktop/Mobile Optimized Header ── */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/40 bg-background/40 px-5 py-4 backdrop-blur-xl sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-[1.1rem] bg-linear-to-br from-emerald-500 to-teal-600 text-[10px] font-black text-white shadow-lg shadow-emerald-500/20">
              AI
            </div>
            <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-400" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-black tracking-tight text-foreground leading-none">{title}</h3>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
              <p className="truncate text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onNewChat && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl border border-border/60 bg-background/50 text-muted-foreground hover:bg-accent hover:text-foreground transition-all active:scale-95"
              onClick={onNewChat}
              disabled={isStartingNewChat}
              title="Start fresh"
            >
              <SquarePen size={16} strokeWidth={2.5} />
            </Button>
          )}
        </div>
      </div>

      {/* ── Messages Container ── */}
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-6 sm:px-8">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col">
          {isLoadingMessages ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-inner">
                  <Sparkles size={24} className="animate-pulse" />
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Syncing History</p>
            </div>
          ) : isEmpty ? (
            /* ── Native-Style Empty State ── */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-1 flex-col justify-center gap-6 py-4 sm:gap-8 sm:py-8"
            >
              <div className="space-y-3 text-center sm:space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.6rem] bg-emerald-500/10 text-2xl shadow-inner ring-1 ring-emerald-500/20 sm:h-20 sm:w-20 sm:rounded-[2.5rem] sm:text-4xl">
                  🇰🇷
                </div>
                <div>
                  <h2 className="text-[2rem] font-black tracking-tight text-foreground sm:text-3xl">KoriAI Tutor</h2>
                  <p className="mx-auto mt-2 max-w-md text-[14px] leading-6 text-muted-foreground/60 sm:text-[15px] sm:leading-relaxed">
                    Your personal native-level assistant. What should we practice today?
                  </p>
                </div>
              </div>

              <div className="grid w-full grid-cols-1 gap-2.5 sm:gap-3 md:grid-cols-2">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={s.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    type="button"
                    disabled={!conversationId || isStreaming}
                    onClick={() => sendSuggestion(s.text)}
                    className="group relative flex min-h-[8.75rem] flex-col items-start gap-1.5 rounded-[1.4rem] border border-border/60 bg-accent/5 px-4 py-3.5 text-left transition-all hover:border-emerald-500/40 hover:bg-background hover:shadow-xl hover:shadow-emerald-500/[0.03] disabled:opacity-40 active:scale-[0.98] sm:min-h-[9.5rem] sm:gap-2 sm:rounded-[1.75rem] sm:px-5 sm:py-4.5"
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-background shadow-sm ring-1 ring-border/50 transition-transform group-hover:scale-110 sm:h-8 sm:w-8 sm:rounded-xl">
                        <span className="text-base sm:text-lg">{s.emoji}</span>
                      </div>
                      <ArrowUp size={14} className="translate-y-1 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-40" strokeWidth={3} />
                    </div>
                    <span className="mt-1 text-[15px] font-black text-foreground sm:mt-2 sm:text-base">{s.label}</span>
                    <span className="line-clamp-3 text-[13px] leading-6 text-muted-foreground/60 sm:line-clamp-2 sm:text-sm">
                      {s.text}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-8 pb-10">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              <AnimatePresence>
                {isStreaming && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-indigo-600 text-[9px] font-black text-white shadow-md">AI</div>
                    <TypingIndicator />
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} className="h-px" />
            </div>
          )}
        </div>
      </div>

      {/* ── iPhone Native-Style Input Bar ── */}
      <div className="shrink-0 bg-background/20 px-4 pb-6 pt-2 backdrop-blur-xl sm:px-10 sm:pb-10">
        <div className="mx-auto w-full max-w-3xl">
          {error ? (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-3 px-4 text-[11px] font-black uppercase tracking-widest text-destructive"
            >
              {error}
            </motion.p>
          ) : null}
          
          <form
            onSubmit={handleSubmit}
            className="group relative flex items-end gap-2 rounded-[2rem] border border-border/80 bg-background/80 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.1)] ring-1 ring-white/10 transition-all focus-within:border-emerald-500/40 focus-within:ring-4 focus-within:ring-emerald-500/5 dark:bg-slate-900/80"
          >
            <Textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message KoriAI..."
              aria-label="Chat message"
              className="max-h-48 min-h-[44px] min-w-0 flex-1 resize-none border-0 bg-transparent px-4 py-3 text-[15px] font-medium leading-relaxed text-foreground placeholder:text-muted-foreground/40 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-base"
              disabled={!conversationId || isStreaming || isLoadingMessages}
              rows={1}
            />
            
            <AnimatePresence mode="wait">
              {draft.trim() ? (
                <motion.div
                  key="send-button"
                  initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Button
                    type="submit"
                    size="icon"
                    aria-label="Send message"
                    className="h-10 w-10 shrink-0 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 active:scale-90 transition-colors"
                    disabled={!conversationId || isStreaming || isLoadingMessages}
                  >
                    <ArrowUp size={20} strokeWidth={3} />
                  </Button>
                </motion.div>
              ) : (
                <div key="placeholder-spacer" className="h-10 w-10 shrink-0 flex items-center justify-center">
                   <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/10" />
                </div>
              )}
            </AnimatePresence>
          </form>
          
          <p className="mt-3 text-center text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/25 max-sm:hidden">
            Enter to Send · Shift+Enter for New Line
          </p>
        </div>
      </div>
    </div>
  )
}
