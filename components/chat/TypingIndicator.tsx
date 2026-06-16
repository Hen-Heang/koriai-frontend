export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-3.5 shadow-sm dark:border-emerald-400/10 dark:bg-emerald-400/[0.04]">
      <span
        className="h-2 w-2 rounded-full bg-emerald-500/70 animate-bounce dark:bg-emerald-400/70"
        style={{ animationDelay: "0ms", animationDuration: "1s" }}
      />
      <span
        className="h-2 w-2 rounded-full bg-emerald-500/70 animate-bounce dark:bg-emerald-400/70"
        style={{ animationDelay: "160ms", animationDuration: "1s" }}
      />
      <span
        className="h-2 w-2 rounded-full bg-emerald-500/70 animate-bounce dark:bg-emerald-400/70"
        style={{ animationDelay: "320ms", animationDuration: "1s" }}
      />
    </div>
  )
}
