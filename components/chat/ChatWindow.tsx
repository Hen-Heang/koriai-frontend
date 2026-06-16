"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowUp, SquarePen, Sparkles, Terminal, Briefcase, ChevronLeft, Plus, Mic, Headphones, Square } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { MessageBubble } from "@/components/chat/MessageBubble"
import { TypingIndicator } from "@/components/chat/TypingIndicator"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useChat } from "@/hooks/useChat"
import { useProfileImage } from "@/hooks/useProfileImage"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { ttsApi } from "@/lib/api"
import type { ChatMessage } from "@/lib/types"
import { cn } from "@/lib/utils"

const SUBTITLE_LINE = /^(EN|RR|FIX)\s*:/i
const HANGUL = /[가-힣]/

// Pulls just the Korean (Hangul-bearing) lines out of a coach reply so TTS
// speaks the spoken part, not the EN:/RR:/FIX: subtitle lines.
function extractKoreanForSpeech(content: string): string {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => HANGUL.test(line) && !SUBTITLE_LINE.test(line))
    .join(" ")
    .replace(/\*\*/g, "")
    .trim()
}

type Suggestion = {
  emoji: string
  label: string
  text: string
  // When true, the chip fills the composer (so the user can paste/append their
  // own text) instead of sending immediately — used for the "correct my writing" flow.
  prefill?: boolean
}

const GENERAL_SUGGESTIONS: Suggestion[] = [
  { emoji: "👋", label: "Greetings", text: "Teach me 5 everyday Korean greetings with pronunciation tips." },
  { emoji: "✍️", label: "Beginner chat", text: "I'm a beginner. Give me a simple Korean conversation I can practice right now." },
  { emoji: "🔤", label: "Grammar", text: "Explain the difference between 이/가 and 은/는 with short examples." },
  { emoji: "🛠️", label: "Fix my writing", text: "Please correct my Korean and explain each change in English.\n\nMy text:\n", prefill: true },
]

const TECHNICAL_SUGGESTIONS: Suggestion[] = [
  { emoji: "📝", label: "Fix my report", text: "Please correct my Korean writing and explain each change in English. Make it sound natural for a work report.\n\nMy text:\n", prefill: true },
  { emoji: "💻", label: "PR Review", text: "How do I ask a colleague to review my Pull Request politely in Korean?" },
  { emoji: "📅", label: "Stand-up", text: "Help me prepare a short daily stand-up update in Korean: I finished the login bug and I'm starting the API integration today." },
  { emoji: "🚀", label: "Deployment", text: "What are some common Korean terms used during a production deployment or system maintenance?" },
]

type ChatWindowProps = {
  title: string
  subtitle: string
  conversationId?: number
  initialMessages?: ChatMessage[]
  initialDraft?: string
  onNewChat?: () => void
  isStartingNewChat?: boolean
  // When rendered inside the AI workspace tabs, the surrounding mode bar already
  // provides the back button and safe-area top padding — so we drop ours here.
  embedded?: boolean
}

export function ChatWindow({
  title,
  subtitle,
  conversationId,
  initialMessages,
  initialDraft,
  onNewChat,
  isStartingNewChat,
  embedded = false,
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
    voiceMode,
    setVoiceMode,
  } = useChat({ conversationId, initialMessages })

  const router = useRouter()
  const { url: userAvatarUrl } = useProfileImage()
  const suggestions = isTechnicalMode ? TECHNICAL_SUGGESTIONS : GENERAL_SUGGESTIONS

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // ── Voice conversation: speech-to-text in, text-to-speech out ──
  const {
    supported: micSupported,
    status: micStatus,
    transcript: liveTranscript,
    error: micError,
    start: startListening,
    stop: stopListening,
  } = useSpeechRecognition({
    lang: "ko-KR",
    onResult: (spoken) => {
      const text = spoken.trim()
      if (text && conversationId && !isStreaming && !isLoadingMessages) {
        sendMessage(text)
      }
    },
  })
  const isListening = micStatus === "listening"

  function handleMicClick() {
    if (!micSupported) return
    if (isListening) {
      stopListening()
    } else {
      if (!voiceMode) setVoiceMode(true)
      startListening()
    }
  }

  // Auto-play the coach's Korean reply once streaming finishes (voice mode only).
  // `messages` is read through a ref so this effect fires only on the
  // streaming→idle transition, not on every buffered token flush mid-stream.
  const messagesRef = useRef(messages)
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])
  const prevStreamingRef = useRef(false)
  const lastSpokenIdRef = useRef<string | null>(null)
  useEffect(() => {
    const justFinished = prevStreamingRef.current && !isStreaming
    prevStreamingRef.current = isStreaming
    if (!justFinished || !voiceMode) return

    let lastAssistant: ChatMessage | undefined
    for (let i = messagesRef.current.length - 1; i >= 0; i--) {
      if (messagesRef.current[i].role === "assistant") {
        lastAssistant = messagesRef.current[i]
        break
      }
    }
    if (!lastAssistant || lastAssistant.id === lastSpokenIdRef.current) return
    const korean = extractKoreanForSpeech(lastAssistant.content)
    if (!korean) return
    lastSpokenIdRef.current = lastAssistant.id
    ttsApi
      .speak(korean, "nova")
      .then((url) => {
        const audio = new Audio(url)
        // Free the blob URL once playback ends so it doesn't leak per reply.
        audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true })
        return audio.play().catch(() => URL.revokeObjectURL(url))
      })
      .catch(() => {})
  }, [isStreaming, voiceMode])

  // Seed the composer once when arriving via a deep link (e.g. dashboard
  // "Correction" card → /chat?prompt=...) so the user lands ready to paste.
  const seededRef = useRef(false)
  useEffect(() => {
    if (seededRef.current || !initialDraft) return
    seededRef.current = true
    setDraft(initialDraft)
    const textarea = textareaRef.current
    if (textarea) {
      textarea.focus()
      const end = initialDraft.length
      textarea.setSelectionRange(end, end)
    }
  }, [initialDraft, setDraft])

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

  function sendSuggestion(suggestion: Suggestion) {
    if (!conversationId || isStreaming || isLoadingMessages) return
    if (suggestion.prefill) {
      setDraft(suggestion.text)
      const textarea = textareaRef.current
      if (textarea) {
        textarea.focus()
        const end = suggestion.text.length
        textarea.setSelectionRange(end, end)
      }
      return
    }
    sendMessage(suggestion.text)
  }

  const isEmpty = messages.length === 0 && !isLoadingMessages

  return (
    <div className="flex h-full min-h-0 w-full max-w-full min-w-0 flex-col overflow-hidden border-border/60 bg-card shadow-2xl dark:bg-slate-950/40 dark:backdrop-blur-md md:rounded-[2.5rem] md:border">

      {/* ── Desktop/Mobile Optimized Header ── */}
      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-3 border-b border-border/40 bg-background/40 px-5 py-4 backdrop-blur-xl sm:px-6",
          embedded ? "pt-4" : "pt-[max(1rem,env(safe-area-inset-top))]"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          {!embedded && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 -ml-2 rounded-xl text-muted-foreground transition-all active:scale-95 md:hidden"
              onClick={() => router.push("/dashboard")}
              title="Back to home"
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </Button>
          )}

          <div className="relative shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-[1.1rem] bg-linear-to-br from-blue-500 to-indigo-600 text-[10px] font-black text-white shadow-lg shadow-blue-500/20">
              AI
            </div>
            <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-card bg-blue-400" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-black tracking-tight text-foreground leading-none">{title}</h3>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
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
                ? "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                : "border-border/60 bg-background/50 text-muted-foreground/60"
            )}
          >
            {isTechnicalMode ? <Terminal size={14} /> : <Briefcase size={14} />}
            <span className="hidden sm:inline">{isTechnicalMode ? "Dev Mode ON" : "General Mode"}</span>
          </Button>

          {/* Voice Conversation Mode toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVoiceMode(!voiceMode)}
            title="Korean voice conversation: speak and hear replies with subtitles"
            className={cn(
              "flex h-9 items-center gap-2 rounded-xl px-3 text-[10px] font-black uppercase tracking-wider transition-all",
              voiceMode
                ? "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : "border-border/60 bg-background/50 text-muted-foreground/60"
            )}
          >
            <Headphones size={14} />
            <span className="hidden sm:inline">{voiceMode ? "Voice ON" : "Voice"}</span>
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
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 shadow-inner">
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
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl shadow-inner ring-1 ring-blue-500/20">
                  {isTechnicalMode ? "💻" : "🇰🇷"}
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                  {isTechnicalMode ? "Dev Tutor" : "Hengo"}
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
                    onClick={() => sendSuggestion(s)}
                    className="group flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-4 py-2 text-left transition-all hover:border-blue-500/40 hover:bg-accent/10 disabled:opacity-40 active:scale-95"
                  >
                    <span className="text-sm">{s.emoji}</span>
                    <span className="text-[13px] font-semibold text-foreground/80 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {s.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-8 pb-10">
              {messages.map((message, i) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  userAvatarUrl={userAvatarUrl}
                  live={isStreaming && i === messages.length - 1 && message.role === "assistant"}
                />
              ))}
              <AnimatePresence>
                {isStreaming && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-4 sm:gap-6"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-sm sm:h-9 sm:w-9">
                      <Sparkles size={18} strokeWidth={2.5} />
                    </div>
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

          {(isListening || micError) && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mb-3 flex items-center gap-3 rounded-2xl border px-4 py-3",
                micError
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-blue-500/30 bg-blue-500/5"
              )}
            >
              {micError ? (
                <p className="text-[12px] font-medium text-destructive">{micError}</p>
              ) : (
                <>
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                    <Mic size={12} className="animate-pulse" /> Listening
                  </span>
                  <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground">
                    {liveTranscript || "한국어로 말해 보세요…"}
                  </p>
                </>
              )}
            </motion.div>
          )}

          <form
            onSubmit={handleSubmit}
            className="group relative flex items-center gap-1 rounded-[2.5rem] border border-border/80 bg-background p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] ring-1 ring-border/5 transition-all focus-within:border-blue-500/40 focus-within:ring-4 focus-within:ring-blue-500/5 dark:bg-slate-900 dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
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
              placeholder="Ask Hengo anything..."
              aria-label="Chat message"
              className="max-h-48 min-h-[44px] min-w-0 flex-1 resize-none border-0 bg-transparent px-2 py-3 text-[15px] font-medium leading-relaxed text-foreground placeholder:text-muted-foreground/40 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-base"
              disabled={!conversationId || isStreaming || isLoadingMessages}
              rows={1}
            />
            
            <div className="flex items-center gap-1 pr-1">
              {micSupported && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={handleMicClick}
                  disabled={!conversationId || isStreaming || isLoadingMessages}
                  title={isListening ? "Stop listening" : "Speak in Korean"}
                  aria-label={isListening ? "Stop listening" : "Speak in Korean"}
                  className={cn(
                    "h-10 w-10 shrink-0 rounded-full transition-colors",
                    isListening
                      ? "bg-red-500 text-white hover:bg-red-500 animate-pulse"
                      : "text-muted-foreground/60 hover:bg-accent hover:text-foreground"
                  )}
                >
                  {isListening ? <Square size={16} /> : <Mic size={20} />}
                </Button>
              )}

              <Button
                type="submit"
                size="icon"
                aria-label="Send message"
                className={cn(
                  "h-10 w-10 shrink-0 rounded-full transition-all duration-300",
                  draft.trim() 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 active:scale-90"
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
            Hengo can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  )
}
