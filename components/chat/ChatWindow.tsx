"use client"

import { CornerDownLeft, Sparkles } from "lucide-react"

import { MessageBubble } from "@/components/chat/MessageBubble"
import { TypingIndicator } from "@/components/chat/TypingIndicator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

  return (
    <Card className="border-border/60 bg-white/90 shadow-lg shadow-slate-950/5 dark:border-white/10 dark:bg-slate-950/55 dark:shadow-black/30">
      <CardHeader className="border-b border-border/60">
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
      <CardContent className="space-y-4 p-4">
        <div className="space-y-3 rounded-3xl border border-border/60 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-slate-900/55">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isStreaming ? <TypingIndicator /> : null}
        </div>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            sendMessage()
          }}
        >
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write in Korean or English. Tip: say 'English please' to switch response language."
            className="min-h-28 resize-none rounded-3xl border-border/70 bg-white/90 dark:border-white/10 dark:bg-slate-900/70"
          />
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Tip: ask for correction, translation, or level-specific examples.
            </p>
            <Button type="submit" disabled={!conversationId}>
              Send
              <CornerDownLeft
                size={20}
                strokeWidth={1.5}
                className="text-current"
              />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
