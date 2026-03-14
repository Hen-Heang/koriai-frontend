import { Bot, User } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/lib/types"

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/30 dark:text-emerald-400"
            : "bg-slate-200/80 text-slate-600 dark:bg-slate-700/80 dark:text-slate-300"
        )}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Message Content */}
      <div className={cn("flex max-w-[80%] flex-col gap-1", isUser ? "items-end" : "items-start")}>
        {/* Sender and Time */}
        <div className={cn("flex items-center gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
          <span className="text-xs font-medium text-foreground">
            {isUser ? "You" : "AI Tutor"}
          </span>
          <span className="text-xs text-muted-foreground/70">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Message Bubble */}
        <article
          className={cn(
            "rounded-2xl px-4 py-3 shadow-sm",
            isUser
              ? "rounded-tr-md bg-emerald-500/15 text-foreground dark:bg-emerald-500/20"
              : "rounded-tl-md border border-border/60 bg-card dark:border-white/10 dark:bg-slate-900/80"
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>

          {/* Correction Section */}
          {message.correction && (
            <div className="mt-3 rounded-xl border border-amber-200/60 bg-amber-50/80 p-3 text-sm dark:border-amber-500/20 dark:bg-amber-500/10">
              <p className="font-medium text-amber-700 dark:text-amber-400">Correction</p>
              <p className="mt-1 text-amber-900/80 dark:text-amber-100/80">{message.correction}</p>
              {message.translation && (
                <p className="mt-2 text-xs text-amber-700/70 dark:text-amber-300/70">
                  Translation: {message.translation}
                </p>
              )}
            </div>
          )}
        </article>
      </div>
    </div>
  )
}
