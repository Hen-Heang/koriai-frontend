import { Skeleton } from "@/components/ui/skeleton"

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
      <Skeleton className="h-2.5 w-2.5 rounded-full" />
      <Skeleton className="h-2.5 w-2.5 rounded-full" />
      <Skeleton className="h-2.5 w-2.5 rounded-full" />
      <span className="text-sm text-muted-foreground">AI tutor is thinking...</span>
    </div>
  )
}
