import { Skeleton } from "@/components/ui/skeleton"

// Generic route-level fallback for Next.js `loading.tsx` boundaries — shown
// immediately during navigation while a heavy client page's JS mounts and
// runs its first render, so the tab never goes blank while that happens.
export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-full max-w-md" />
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <Skeleton className="mt-4 h-5 w-3/4" />
            <Skeleton className="mt-2 h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
