import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/lib/types"

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <article
      className={cn(
        "max-w-2xl rounded-3xl border px-4 py-3 shadow-sm",
        isUser
          ? "ml-auto border-emerald-300/60 bg-emerald-100/80 text-slate-900 dark:border-emerald-300/30 dark:bg-emerald-500/15 dark:text-emerald-50"
          : "border-border/70 bg-card dark:border-white/10 dark:bg-slate-950/80"
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <Badge variant={isUser ? "secondary" : "outline"}>
          {isUser ? "You" : "AI Tutor"}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <p className={cn("text-sm leading-7", isUser ? "text-inherit" : "text-foreground")}>
        {message.content}
      </p>
      {message.correction ? (
        <div className="mt-3 rounded-2xl bg-muted/80 p-3 text-sm dark:bg-slate-900/80">
          <p className="font-medium text-foreground">Correction</p>
          <p className="mt-1 text-muted-foreground">{message.correction}</p>
          {message.translation ? (
            <p className="mt-2 text-xs text-muted-foreground/90">
              Translation: {message.translation}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
