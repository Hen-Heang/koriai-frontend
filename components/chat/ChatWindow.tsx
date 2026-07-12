"use client"

import { createContext, useContext, useEffect, useRef, type FC } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { SquarePen, Sparkles, Terminal, Briefcase, ChevronLeft, EllipsisVertical, Mic, Headphones, Square } from "lucide-react"
import { motion } from "motion/react"
import { toast } from "sonner"
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  useThreadRuntime,
  type AppendMessage,
  type ThreadMessageLike,
} from "@assistant-ui/react"

import { Thread } from "@/components/assistant-ui/thread"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useChat } from "@/hooks/useChat"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { ttsApi } from "@/lib/api"
import { CHAT_PRESETS } from "@/lib/chat-presets"
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

// Bridges ChatWindow state to the pieces rendered inside the assistant-ui
// Thread (welcome screen, composer mic button, listening banner).
type HengoChatContextValue = {
  isTechnicalMode: boolean
  canInteract: boolean
  mic: {
    supported: boolean
    isListening: boolean
    error: string | null
    transcript: string
    onClick: () => void
  }
}

const HengoChatContext = createContext<HengoChatContextValue | null>(null)

function useHengoChat(): HengoChatContextValue {
  const value = useContext(HengoChatContext)
  if (!value) throw new Error("useHengoChat must be used inside ChatWindow")
  return value
}

// Maps the app's ChatMessage rows into assistant-ui's message shape; the
// correction/translation columns ride along as custom metadata so the thread
// can render the "Suggested Improvement" card.
function convertMessage(message: ChatMessage): ThreadMessageLike {
  return {
    id: message.id,
    role: message.role,
    content: [{ type: "text", text: message.content }],
    createdAt: new Date(message.createdAt),
    metadata: {
      custom: {
        correction: message.correction,
        translation: message.translation,
      },
    },
  }
}

function getAppendedText(message: AppendMessage): string {
  return message.content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("\n")
    .trim()
}

// Seeds the composer once when arriving via a deep link (e.g. dashboard
// "Correction" card → /chat?prompt=...) so the user lands ready to paste.
const ComposerSeeder: FC<{ text: string }> = ({ text }) => {
  const runtime = useThreadRuntime()
  const seededRef = useRef(false)
  useEffect(() => {
    if (seededRef.current || !text) return
    seededRef.current = true
    runtime.composer.setText(text)
  }, [text, runtime])
  return null
}

// ── Empty-state welcome: presets + suggestion chips (rendered inside Thread) ──
const HengoWelcome: FC = () => {
  const { isTechnicalMode, canInteract } = useHengoChat()
  const runtime = useThreadRuntime()
  const suggestions = isTechnicalMode ? TECHNICAL_SUGGESTIONS : GENERAL_SUGGESTIONS

  function send(text: string) {
    if (!canInteract) return
    runtime.append({ role: "user", content: [{ type: "text", text }] })
  }

  function sendSuggestion(suggestion: Suggestion) {
    if (!canInteract) return
    if (suggestion.prefill) {
      runtime.composer.setText(suggestion.text)
      return
    }
    send(suggestion.text)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-8 py-10 sm:py-14"
    >
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl shadow-inner ring-1 ring-blue-500/20">
          {isTechnicalMode ? "💻" : "🇰🇷"}
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
          {isTechnicalMode ? "Dev Tutor" : "Hengo"}
        </h2>
        <p className="mx-auto max-w-xs text-[14px] font-medium leading-relaxed text-muted-foreground">
          {isTechnicalMode
            ? "Master technical Korean for your career."
            : "How can I help you practice today?"}
        </p>
      </div>

      <div className="w-full max-w-2xl space-y-2.5 px-4">
        <p className="text-center text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
          Practice a scenario
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CHAT_PRESETS.map((preset, i) => (
            <motion.button
              key={preset.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              type="button"
              disabled={!canInteract}
              onClick={() => send(preset.prompt)}
              className="group flex flex-col items-start gap-1 rounded-2xl border border-border/60 bg-background/50 p-3 text-left transition-all hover:border-blue-500/40 hover:bg-accent/10 disabled:opacity-40 active:scale-95"
            >
              <span className="text-lg">{preset.emoji}</span>
              <span className="text-[13px] font-bold text-foreground/80 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {preset.label}
              </span>
              <span className="text-[12px] font-medium leading-snug text-muted-foreground">
                {preset.description}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex w-full max-w-2xl flex-wrap justify-center gap-2 px-4">
        {suggestions.map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            type="button"
            disabled={!canInteract}
            onClick={() => sendSuggestion(s)}
            className="group flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-4 py-2 text-left transition-all hover:border-blue-500/40 hover:bg-accent/10 disabled:opacity-40 active:scale-95"
          >
            <span className="text-sm">{s.emoji}</span>
            <span className="text-[14px] font-semibold text-foreground/80 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {s.label}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

// ── Composer slots: mic button + live-transcript banner ──
const MicButton: FC = () => {
  const { canInteract, mic } = useHengoChat()
  if (!mic.supported) return null

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={mic.onClick}
      disabled={!canInteract}
      title={mic.isListening ? "Stop listening" : "Speak in Korean"}
      aria-label={mic.isListening ? "Stop listening" : "Speak in Korean"}
      className={cn(
        "size-8 shrink-0 rounded-full transition-colors",
        mic.isListening
          ? "bg-red-500 text-white hover:bg-red-500 animate-pulse"
          : "text-muted-foreground/60 hover:bg-accent hover:text-foreground"
      )}
    >
      {mic.isListening ? <Square size={14} /> : <Mic size={18} />}
    </Button>
  )
}

const ListeningBanner: FC = () => {
  const { mic } = useHengoChat()
  if (!mic.isListening && !mic.error) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3",
        mic.error ? "border-destructive/30 bg-destructive/5" : "border-blue-500/30 bg-blue-500/5"
      )}
    >
      {mic.error ? (
        <p className="text-[13px] font-semibold text-destructive">{mic.error}</p>
      ) : (
        <>
          <span className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            <Mic size={12} className="animate-pulse" /> Listening
          </span>
          <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-foreground">
            {mic.transcript || "한국어로 말해 보세요…"}
          </p>
        </>
      )}
    </motion.div>
  )
}

const THREAD_COMPONENTS = {
  Welcome: HengoWelcome,
  ComposerLeading: MicButton,
  ComposerHeader: ListeningBanner,
}

type ChatWindowProps = {
  title: string
  subtitle: string
  conversationId?: string
  initialMessages?: ChatMessage[]
  initialDraft?: string
  onNewChat?: () => void
  isStartingNewChat?: boolean
  // Fired once the conversation is auto-titled from its first message, so the
  // sidebar list can refetch and show the new title instead of the placeholder.
  onConversationTitled?: () => void
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
  onConversationTitled,
  embedded = false,
}: ChatWindowProps) {
  const {
    error,
    isLoadingMessages,
    isStreaming,
    messages,
    sendMessage,
    cancel,
    isTechnicalMode,
    setIsTechnicalMode,
    voiceMode,
    setVoiceMode,
  } = useChat({ conversationId, initialMessages, onConversationTitled })

  const router = useRouter()
  const canInteract = Boolean(conversationId) && !isStreaming && !isLoadingMessages

  const runtime = useExternalStoreRuntime({
    messages,
    isRunning: isStreaming,
    isDisabled: !conversationId || isLoadingMessages,
    convertMessage,
    onNew: async (message: AppendMessage) => {
      const text = getAppendedText(message)
      if (text) await sendMessage(text)
    },
    onCancel: async () => {
      cancel()
    },
  })

  // Streaming errors used to render above the composer; the composer now lives
  // inside the Thread, so surface them as a toast instead.
  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

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

  const hengoContext: HengoChatContextValue = {
    isTechnicalMode,
    canInteract,
    mic: {
      supported: micSupported,
      isListening,
      error: micError,
      transcript: liveTranscript,
      onClick: handleMicClick,
    },
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <HengoChatContext.Provider value={hengoContext}>
        <div className="flex h-full min-h-0 w-full max-w-full min-w-0 flex-col overflow-hidden border-border/60 bg-card shadow-2xl dark:bg-slate-950/40 dark:backdrop-blur-md md:rounded-3xl md:border">

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
                  onClick={() => router.push("/home")}
                  title="Back to home"
                >
                  <ChevronLeft size={24} strokeWidth={2.5} />
                </Button>
              )}

              <div className="relative shrink-0">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[1.1rem] shadow-lg shadow-blue-500/20">
                  <Image src="/hengo-icon.svg" alt="" width={40} height={40} className="h-full w-full" />
                </div>
                <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-card bg-blue-400" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-[16px] font-bold tracking-tight text-foreground leading-none">{title}</h3>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
                  <p className="truncate text-[12px] font-bold uppercase tracking-wide text-muted-foreground">{subtitle}</p>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {/* Technical Mode + Voice toggles — full controls on tablet/desktop */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTechnicalMode(!isTechnicalMode)}
                className={cn(
                  "hidden h-9 items-center gap-2 rounded-xl px-3 text-[12px] font-bold uppercase tracking-wider transition-all sm:flex",
                  isTechnicalMode
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "border-border/60 bg-background/50 text-muted-foreground"
                )}
              >
                {isTechnicalMode ? <Terminal size={14} /> : <Briefcase size={14} />}
                <span>{isTechnicalMode ? "Dev Mode ON" : "General Mode"}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setVoiceMode(!voiceMode)}
                title="Korean voice conversation: speak and hear replies with subtitles"
                className={cn(
                  "hidden h-9 items-center gap-2 rounded-xl px-3 text-[12px] font-bold uppercase tracking-wider transition-all sm:flex",
                  voiceMode
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "border-border/60 bg-background/50 text-muted-foreground"
                )}
              >
                <Headphones size={14} />
                <span>{voiceMode ? "Voice ON" : "Voice"}</span>
              </Button>

              {onNewChat && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden h-9 w-9 rounded-xl border border-border/60 bg-background/50 text-muted-foreground hover:bg-accent hover:text-foreground transition-all active:scale-95 sm:flex"
                  onClick={onNewChat}
                  disabled={isStartingNewChat}
                  title="Start fresh"
                >
                  <SquarePen size={16} strokeWidth={2.5} />
                </Button>
              )}

              {/* Mobile: same controls collapsed into one menu so the narrow header isn't a wall of icons */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl border border-border/60 bg-background/50 text-muted-foreground transition-all active:scale-95 sm:hidden"
                    title="Chat options"
                  >
                    <EllipsisVertical size={18} strokeWidth={2.5} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuCheckboxItem
                    checked={isTechnicalMode}
                    onCheckedChange={() => setIsTechnicalMode(!isTechnicalMode)}
                  >
                    {isTechnicalMode ? <Terminal size={14} className="mr-2" /> : <Briefcase size={14} className="mr-2" />}
                    Dev Mode (technical Korean)
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={voiceMode} onCheckedChange={() => setVoiceMode(!voiceMode)}>
                    <Headphones size={14} className="mr-2" />
                    Voice conversation
                  </DropdownMenuCheckboxItem>
                  {onNewChat && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onNewChat} disabled={isStartingNewChat}>
                        <SquarePen size={14} className="mr-2" />
                        Start fresh chat
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* ── assistant-ui Thread: messages + composer ── */}
          <div className="relative min-h-0 flex-1">
            {isLoadingMessages && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-card/60 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 shadow-inner">
                  <Sparkles size={24} className="animate-pulse" />
                </div>
                <p className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">Syncing History</p>
              </div>
            )}
            <Thread components={THREAD_COMPONENTS} />
            {initialDraft ? <ComposerSeeder text={initialDraft} /> : null}
          </div>
        </div>
      </HengoChatContext.Provider>
    </AssistantRuntimeProvider>
  )
}
