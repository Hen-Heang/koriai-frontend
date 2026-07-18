"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ArrowUpRight, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { homeLink, settingsLink, workspaces } from "@/lib/navigation"
import { cn } from "@/lib/utils"

const QUICK_LINKS = [
  { ...homeLink, workspace: "App" },
  ...workspaces.flatMap((workspace) =>
    workspace.links
      .filter((link) => !link.soon)
      .map((link) => ({ ...link, workspace: workspace.label }))
  ),
  { ...settingsLink, workspace: "App" },
]

export function QuickSwitcher({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return QUICK_LINKS
    return QUICK_LINKS.filter((item) =>
      `${item.label} ${item.workspace}`.toLowerCase().includes(normalized)
    )
  }, [query])

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const editing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setQuery("")
        setActiveIndex(0)
        setOpen((current) => !current)
      } else if (!editing && event.key === "/") {
        event.preventDefault()
        setQuery("")
        setActiveIndex(0)
        setOpen(true)
      }
    }

    window.addEventListener("keydown", handleShortcut)
    return () => window.removeEventListener("keydown", handleShortcut)
  }, [])

  function visit(href: string) {
    setOpen(false)
    router.push(href)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setQuery("")
      setActiveIndex(0)
    }
    setOpen(nextOpen)
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((current) => Math.min(current + 1, results.length - 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, 0))
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault()
      visit(results[activeIndex].href)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={compact ? "icon" : "sm"}
        onClick={() => handleOpenChange(true)}
        className={cn(
          compact
            ? "size-9 rounded-xl border-border/70 bg-background/70"
            : "h-9 min-w-44 justify-start gap-2.5 rounded-xl border-border/70 bg-background/60 px-3 text-muted-foreground shadow-none",
          className
        )}
        aria-label="Open quick navigation"
      >
        <Search size={16} />
        {!compact && (
          <>
            <span className="flex-1 text-left">Jump to…</span>
            <kbd className="rounded-md border border-border bg-muted/70 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="top-[min(42%,22rem)] max-w-xl gap-0 overflow-hidden rounded-2xl border border-border/70 bg-background/95 p-0 shadow-2xl shadow-slate-950/20 backdrop-blur-2xl"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Quick navigation</DialogTitle>
            <DialogDescription>Search and open any Hengo workspace.</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-3 border-b border-border/70 px-4">
            <Search size={18} className="shrink-0 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Search learning, goals, AI, progress…"
              aria-label="Search destinations"
              className="h-14 border-0 bg-transparent px-0 shadow-none focus-visible:bg-transparent focus-visible:ring-0"
            />
            <kbd className="rounded-md border border-border bg-muted/60 px-2 py-1 font-mono text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>

          <div className="max-h-[min(60vh,26rem)] overflow-y-auto p-2" role="listbox">
            {results.length > 0 ? (
              results.map((item, index) => {
                const Icon = item.icon
                const current = !item.href.includes("?") && pathname === item.href
                const active = index === activeIndex
                return (
                  <button
                    key={`${item.workspace}-${item.href}`}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => visit(item.href)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-colors",
                      active ? "bg-primary/10 text-foreground" : "hover:bg-muted/70",
                      current && "text-primary"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background",
                        active && "border-primary/20 bg-primary/10 text-primary"
                      )}
                    >
                      <Icon size={17} strokeWidth={2.2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{item.label}</span>
                      <span className="block text-xs text-muted-foreground">{item.workspace}</span>
                    </span>
                    <ArrowUpRight
                      size={15}
                      className={cn("text-muted-foreground/50", active && "text-primary")}
                    />
                  </button>
                )
              })
            ) : (
              <div className="px-4 py-12 text-center">
                <p className="text-sm font-semibold text-foreground">No matching destination</p>
                <p className="mt-1 text-sm text-muted-foreground">Try “interview”, “vocab”, or “goals”.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border/70 bg-muted/35 px-4 py-2 text-[11px] text-muted-foreground">
            <span>↑↓ navigate · Enter open</span>
            <span>/ opens from anywhere</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
