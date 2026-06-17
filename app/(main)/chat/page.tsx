"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, ChevronLeft, History, MessageCircle, PanelLeft, ScanText, Wand2 } from "lucide-react"
import { motion } from "motion/react"

import { ChatWindow } from "@/components/chat/ChatWindow"
import { ConversationSidebar } from "@/components/chat/ConversationSidebar"
import { MessageAnalyzer } from "@/components/ai/MessageAnalyzer"
import { MessageGenerator } from "@/components/ai/MessageGenerator"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useConversations } from "@/hooks/useConversations"
import { chatApi } from "@/lib/api"
import { cn } from "@/lib/utils"

type AiMode = "chat" | "analyze" | "generate"

const MODES: { id: AiMode; label: string; icon: typeof MessageCircle }[] = [
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "analyze", label: "Analyze", icon: ScanText },
  { id: "generate", label: "Generate", icon: Wand2 },
]

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageContent />
    </Suspense>
  )
}

function ChatPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialDraft = searchParams.get("prompt") ?? undefined

  // A ?prompt= deep link is a correction/chat request, so it always lands on Chat.
  const queryMode = searchParams.get("mode")
  const [mode, setMode] = useState<AiMode>(
    !initialDraft && (queryMode === "analyze" || queryMode === "generate")
      ? (queryMode as AiMode)
      : "chat"
  )

  const { conversations, isLoading: conversationsLoading, rename, remove, refresh } =
    useConversations()

  const [conversationId, setConversationId] = useState<number | null>(null)
  const [bootstrapped, setBootstrapped] = useState(false)
  const [error, setError] = useState("")
  const [isStartingNewChat, setIsStartingNewChat] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  // Desktop rail collapse — persisted so it sticks across visits.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  useEffect(() => {
    if (window.localStorage.getItem("koriai-chat-sidebar-collapsed") === "1") {
      setSidebarCollapsed(true)
    }
  }, [])
  const toggleSidebar = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed)
    try {
      window.localStorage.setItem("koriai-chat-sidebar-collapsed", collapsed ? "1" : "0")
    } catch {
      /* storage unavailable */
    }
  }, [])

  // Resume the most recent conversation (or create one if the user has none, or
  // when arriving via a ?prompt deep link, which should land in a fresh chat).
  useEffect(() => {
    if (mode !== "chat" || conversationId !== null || conversationsLoading || bootstrapped) {
      return
    }
    setBootstrapped(true)
    if (conversations.length > 0 && !initialDraft) {
      setConversationId(conversations[0].id)
      return
    }
    chatApi
      .createConversation("General Practice", "FREE_CHAT")
      .then((data) => {
        setConversationId(data.id)
        void refresh()
      })
      .catch(() => setError("Failed to start conversation. Please refresh."))
  }, [mode, conversationId, conversationsLoading, bootstrapped, conversations, initialDraft, refresh])

  const startNewChat = useCallback(async () => {
    setIsStartingNewChat(true)
    setError("")
    try {
      const data = await chatApi.createConversation("General Practice", "FREE_CHAT")
      setConversationId(data.id)
      await refresh()
      setSheetOpen(false)
    } catch {
      setError("Failed to start a new conversation. Please try again.")
    } finally {
      setIsStartingNewChat(false)
    }
  }, [refresh])

  const selectConversation = useCallback((id: number) => {
    setConversationId(id)
    setSheetOpen(false)
  }, [])

  // Deleting the open chat drops back to bootstrap (resume next / create fresh).
  const handleDelete = useCallback(
    async (id: number) => {
      await remove(id)
      if (id === conversationId) {
        setConversationId(null)
        setBootstrapped(false)
      }
    },
    [remove, conversationId]
  )

  const sidebarProps = {
    conversations,
    isLoading: conversationsLoading,
    activeId: conversationId,
    onSelect: selectConversation,
    onNew: startNewChat,
    isStartingNew: isStartingNewChat,
    onRename: rename,
    onDelete: handleDelete,
  }

  const containerHeight = "h-[100dvh] lg:h-[calc(100dvh-9rem)] lg:min-h-[40rem]"

  if (error && !conversationId && mode === "chat") {
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

  return (
    <div className={cn("flex flex-col", containerHeight)}>
      {/* ── AI workspace mode bar (back + Chat / Analyze / Generate) ── */}
      <div className="flex shrink-0 items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 sm:px-5">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          aria-label="Back to home"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-95"
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>

        {/* Desktop: show history when the rail is collapsed */}
        {mode === "chat" && sidebarCollapsed && (
          <button
            type="button"
            onClick={() => toggleSidebar(false)}
            aria-label="Show chat history"
            title="Show history"
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-95 md:flex"
          >
            <PanelLeft size={20} strokeWidth={2.5} />
          </button>
        )}

        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-1 rounded-2xl border border-border/70 bg-background/60 p-1 shadow-sm backdrop-blur-xl dark:bg-slate-900/50">
            {MODES.map(({ id, label, icon: Icon }) => {
              const active = mode === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[12px] font-black uppercase tracking-wide transition-all active:scale-95 sm:px-4",
                    active ? "text-white" : "text-muted-foreground/70 hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="ai-mode-pill"
                      className="absolute inset-0 -z-10 rounded-xl bg-blue-600 shadow-md shadow-blue-600/25"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon size={14} strokeWidth={2.6} />
                  <span>{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Mobile chat-history trigger; keeps the segmented control centered. */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center">
          {mode === "chat" && (
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Chat history"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-95 md:hidden"
                >
                  <History size={20} strokeWidth={2.5} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetTitle className="sr-only">Chat history</SheetTitle>
                <div className="h-full pt-10">
                  <ConversationSidebar {...sidebarProps} />
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      {/* ── Active mode ── */}
      <div className="min-h-0 flex-1">
        {mode === "chat" ? (
          <div className="flex h-full min-h-0">
            {/* Desktop history rail (collapsible) */}
            {!sidebarCollapsed && (
              <aside className="hidden w-64 shrink-0 flex-col border-r border-border/40 bg-background/30 md:flex">
                <ConversationSidebar {...sidebarProps} onCollapse={() => toggleSidebar(true)} />
              </aside>
            )}

            <div className="min-w-0 flex-1">
              <ChatWindow
                key={conversationId ?? "new"}
                title="AI Language Tutor"
                subtitle={conversationId ? "Active Session · Korean" : "Connecting…"}
                conversationId={conversationId ?? undefined}
                initialDraft={initialDraft}
                onNewChat={startNewChat}
                isStartingNewChat={isStartingNewChat}
                embedded
              />
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto overscroll-contain px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-2 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">
              {mode === "analyze" ? <MessageAnalyzer /> : <MessageGenerator />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
