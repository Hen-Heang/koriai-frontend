"use client"

import { useEffect, useRef } from "react"
import { CornerDownLeft, Sparkles } from "lucide-react"

import { MessageBubble } from "@/components/chat/MessageBubble"
import { TypingIndicator } from "@/components/chat/TypingIndicator"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useChat } from "@/hooks/useChat"
import type { ChatMessage } from "@/lib/types"

type ChatWindowProps = {
  title: string
  subtitle: string
  conversationId?: number
  initialMessages?: ChatMessage[]
}

export function ChatWindow({
  title,
  subtitle,
  conversationId,
  initialMessages,
}: ChatWindowProps) {
  const { draft, error, isStreaming, messages, sendMessage, setDraft } = useChat({
    conversationId,
    initialMessages,
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isStreaming])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      if (draft.trim() && conversationId) {
        sendMessage()
      }
    }
  }

  return (
    <Card className="flex h-[calc(100vh-12rem)] flex-col overflow-hidden border-border/60 bg-white/90 shadow-lg shadow-slate-950/5 dark:border-white/10 dark:bg-slate-950/55 dark:shadow-black/30">
      {/* Header - Fixed */}
      <CardHeader className="flex-shrink-0 border-b border-border/60 bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <Button variant="outline" size="sm">
            <Sparkles size={20} strokeWidth={1.5} className="text-current" />
            Prompt Boost
          </Button>
        </div>
      </CardHeader>

      {/* Messages Area - Scrollable */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto scroll-smooth"
      >
        <div className="space-y-4 p-4">
          {messages.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-center">
              <div className="rounded-full bg-muted/50 p-4">
                <Sparkles size={24} className="text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Start a conversation with your AI tutor
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Ask questions in Korean or English
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isStreaming && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-border/60 bg-white/80 p-4 backdrop-blur-sm dark:bg-slate-950/80">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            sendMessage()
          }}
        >
          <div className="relative">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write in Korean or English. Press Enter to send, Shift+Enter for new line."
              className="min-h-20 max-h-40 resize-none rounded-2xl border-border/70 bg-slate-50/80 pr-24 dark:border-white/10 dark:bg-slate-900/70"
              rows={2}
            />
            <Button
              type="submit"
              disabled={!conversationId || !draft.trim()}
              size="sm"
              className="absolute bottom-3 right-3"
            >
              Send
              <CornerDownLeft size={16} strokeWidth={1.5} />
            </Button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <p className="text-xs text-muted-foreground">
            Tip: ask for correction, translation, or level-specific examples.
          </p>
        </form>
      </div>
    </Card>
  )
}
