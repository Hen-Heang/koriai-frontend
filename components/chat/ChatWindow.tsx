"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowUp, SquarePen, Sparkles, Terminal, Cpu, Briefcase, ChevronLeft, Plus, Mic } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { MessageBubble } from "@/components/chat/MessageBubble"
import { TypingIndicator } from "@/components/chat/TypingIndicator"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useChat } from "@/hooks/useChat"
import type { ChatMessage } from "@/lib/types"
import { cn } from "@/lib/utils"

const GENERAL_SUGGESTIONS = [
  { emoji: "👋", label: "Greetings", text: "Teach me 5 everyday Korean greetings with pronunciation tips." },
  { emoji: "✍️", label: "Beginner chat", text: "I'm a beginner. Give me a simple Korean conversation I can practice right now." },
  { emoji: "🔤", label: "Grammar", text: "Explain the difference between 이/가 and 은/는 with short examples." },
  { emoji: "🛠️", label: "Fix my Korean", text: "Please correct this sentence and explain why: 저는 어제 학교에 갔어요 친구랑." },
]

const TECHNICAL_SUGGESTIONS = [
  { emoji: "💻", label: "PR Review", text: "How do I ask a colleague to review my Pull Request politely in Korean?" },
  { emoji: "📅", label: "Stand-up", text: "Help me prepare a short daily stand-up update in Korean: I finished the login bug and I'm starting the API integration today." },
  { emoji: "🚀", label: "Deployment", text: "What are some common Korean terms used during a production deployment or system maintenance?" },
  { emoji: "🤝", label: "Technical Help", text: "How do I ask a senior developer for help with a complex bug without sounding too demanding?" },
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
    isTechnicalMode,
    setIsTechnicalMode,
  } = useChat({ conversationId, initialMessages })

  const router = useRouter()
  const suggestions = isTechnicalMode ? TECHNICAL_SUGGESTIONS : GENERAL_SUGGESTIONS

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
    <div className="flex h-full min-h-0 w-full max-w-full min-w-0 flex-col overflow-hidden border-border/60 bg-card shadow-2xl dark:bg-slate-950/40 dark:backdrop-blur-md md:rounded-[2.5rem] md:border">

      {/* ── Desktop/Mobile Optimized Header ── */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/40 bg-background/40 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-xl sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 -ml-2 rounded-xl text-muted-foreground transition-all active:scale-95 md:hidden"
            onClick={() => router.push("/dashboard")}
            title="Back to home"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </Button>

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
          {/* Technical Mode Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTechnicalMode(!isTechnicalMode)}
            className={cn(
              "flex h-9 items-center gap-2 rounded-xl px-3 text-[10px] font-black uppercase tracking-wider transition-all",
              isTechnicalMode 
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                : "border-border/60 bg-background/50 text-muted-foreground/60"
            )}
          >
            {isTechnicalMode ? <Terminal size={14} /> : <Briefcase size={14} />}
            <span className="hidden sm:inline">{isTechnicalMode ? "Dev Mode ON" : "General Mode"}</span>
          </Button>

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
              className="flex flex-1 flex-col items-center justify-center gap-8 py-10 sm:py-16"
            >
              <div className="space-y-3 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-3xl shadow-inner ring-1 ring-emerald-500/20">
                  {isTechnicalMode ? "💻" : "🇰🇷"}
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                  {isTechnicalMode ? "Dev Tutor" : "KoriAI"}
                </h2>
                <p className="mx-auto max-w-xs text-[13px] font-medium leading-relaxed text-muted-foreground/60">
                  {isTechnicalMode 
                    ? "Master technical Korean for your career."
                    : "How can I help you practice today?"}
                </p>
              </div>

              <div className="flex w-full max-w-2xl flex-wrap justify-center gap-2 px-4">
                {suggestions.map((s, i) => (
                  <motion.button
                    key={s.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    type="button"
                    disabled={!conversationId || isStreaming}
                    onClick={() => sendSuggestion(s.text)}
                    className="group flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-4 py-2 text-left transition-all hover:border-emerald-500/40 hover:bg-accent/10 disabled:opacity-40 active:scale-95"
                  >
                    <span className="text-sm">{s.emoji}</span>
                    <span className="text-[13px] font-semibold text-foreground/80 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      {s.label}
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

      {/* ── Gemini-style Input Bar ── */}
      <div className="shrink-0 bg-background/0 px-4 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-10 sm:pb-10">
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
            className="group relative flex items-center gap-1 rounded-[2.5rem] border border-border/80 bg-background p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] ring-1 ring-border/5 transition-all focus-within:border-emerald-500/40 focus-within:ring-4 focus-within:ring-emerald-500/5 dark:bg-slate-900 dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
          >
            <Button 
              type="button" 
              size="icon" 
              variant="ghost" 
              className="h-10 w-10 shrink-0 rounded-full text-muted-foreground/60 hover:bg-accent hover:text-foreground transition-colors"
            >
              <Plus size={22} />
            </Button>

            <Textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask KoriAI anything..."
              aria-label="Chat message"
              className="max-h-48 min-h-[44px] min-w-0 flex-1 resize-none border-0 bg-transparent px-2 py-3 text-[15px] font-medium leading-relaxed text-foreground placeholder:text-muted-foreground/40 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-base"
              disabled={!conversationId || isStreaming || isLoadingMessages}
              rows={1}
            />
            
            <div className="flex items-center gap-1 pr-1">
              <Button 
                type="button" 
                size="icon" 
                variant="ghost" 
                className="h-10 w-10 shrink-0 rounded-full text-muted-foreground/60 hover:bg-accent hover:text-foreground transition-colors"
              >
                <Mic size={20} />
              </Button>

              <Button
                type="submit"
                size="icon"
                aria-label="Send message"
                className={cn(
                  "h-10 w-10 shrink-0 rounded-full transition-all duration-300",
                  draft.trim() 
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 active:scale-90"
                    : "bg-muted text-muted-foreground/20"
                )}
                disabled={!draft.trim() || !conversationId || isStreaming || isLoadingMessages}
              >
                {isStreaming ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <ArrowUp size={20} strokeWidth={2.5} />
                )}
              </Button>
            </div>
          </form>
          
          <p className="mt-3 text-center text-[10px] font-medium text-muted-foreground/40 sm:text-[11px]">
            KoriAI can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  )
}
