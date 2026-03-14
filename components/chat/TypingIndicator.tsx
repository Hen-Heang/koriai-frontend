import { Bot } from "lucide-react"

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-200/80 text-slate-600 dark:bg-slate-700/80 dark:text-slate-300">
        <Bot size={16} />
      </div>

      {/* Typing Bubble */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-foreground">AI Tutor</span>
        <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-border/60 bg-card px-4 py-3 shadow-sm dark:border-white/10 dark:bg-slate-900/80">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s] dark:bg-slate-500" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s] dark:bg-slate-500" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500" />
          </div>
          <span className="ml-1 text-sm text-muted-foreground">Thinking...</span>
        </div>
      </div>
    </div>
  )
}
