"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, useSyncExternalStore } from "react"
import {
  BookOpen,
  Gauge,
  History,
  MessageCircle,
  Mic,
  NotebookText,
  Settings,
  Sparkles,
  SpellCheck2,
  Theater,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { ThemeToggle } from "@/components/theme-toggle"
import { isAuthenticated } from "@/lib/auth-store"
import { cn } from "@/lib/utils"

const allLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/chat", label: "AI Chat", icon: MessageCircle },
  { href: "/correct", label: "Correction", icon: SpellCheck2 },
  { href: "/diary", label: "Diary", icon: NotebookText },
  { href: "/speaking", label: "Speaking", icon: Mic },
  { href: "/vocab", label: "Vocabulary", icon: BookOpen },
  { href: "/scenarios", label: "Scenarios", icon: Theater },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
]

const bottomTabs = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/correct", label: "Correct", icon: SpellCheck2 },
  { href: "/diary", label: "Diary", icon: NotebookText },
  { href: "/vocab", label: "Vocab", icon: BookOpen },
]

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname()
  const router = useRouter()
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  
  const activeTabIndex = bottomTabs.findIndex(tab => 
    pathname === tab.href || pathname.startsWith(`${tab.href}/`)
  )

  const mounted = useSyncExternalStore(
    (callback) => {
      queueMicrotask(callback)
      return () => undefined
    },
    () => true,
    () => false
  )

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const viewport = window.visualViewport
    const baseHeight = viewport?.height ?? window.innerHeight

    function updateKeyboardState() {
      const currentHeight = viewport?.height ?? window.innerHeight
      const heightDelta = baseHeight - currentHeight
      const activeElement = document.activeElement as HTMLElement | null
      const isEditable =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.isContentEditable

      setIsKeyboardOpen(Boolean(isEditable && heightDelta > 120))
    }

    function handleFocusIn(event: FocusEvent) {
      const target = event.target as HTMLElement | null
      const isEditable =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable

      if (isEditable) {
        updateKeyboardState()
      }
    }

    function handleFocusOut() {
      window.setTimeout(updateKeyboardState, 120)
    }

    updateKeyboardState()
    viewport?.addEventListener("resize", updateKeyboardState)
    window.addEventListener("focusin", handleFocusIn)
    window.addEventListener("focusout", handleFocusOut)

    return () => {
      viewport?.removeEventListener("resize", updateKeyboardState)
      window.removeEventListener("focusin", handleFocusIn)
      window.removeEventListener("focusout", handleFocusOut)
    }
  }, [])

  if (!mounted) return null

  if (!isAuthenticated()) {
    router.replace("/login")
    return null
  }

  const isChatRoute = pathname === "/chat" || pathname.startsWith("/chat/")

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="mx-auto flex w-full max-w-[92rem] lg:grid lg:grid-cols-[280px_1fr]">

        {/* ── Desktop sidebar ── */}
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-border/60 bg-card/50 backdrop-blur-2xl dark:border-white/[0.07] dark:bg-[#08111f]/80 lg:flex">
          {/* Brand */}
          <div className="px-6 pt-8 pb-6">
            <Link href="/" className="group flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border/50 transition-transform group-hover:scale-105">
                <Image
                  src="/koriai-logo.svg"
                  alt="KoriAI Logo"
                  width={28}
                  height={28}
                  className="transition-all"
                />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-foreground">
                  KoriAI Lab
                </p>
                <p className="text-[10px] font-bold text-muted-foreground/60 text-nowrap">
                  Premium Learning
                </p>
              </div>
            </Link>
          </div>

          <div className="mx-6 h-px bg-border/60" />

          {/* Nav */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
            {allLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-[14px] font-bold transition-all",
                    active
                      ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/20"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground dark:hover:bg-white/5"
                  )}
                >
                  <Icon size={18} strokeWidth={2.5} className="shrink-0" />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* AI badge */}
          <div className="m-4 rounded-[2rem] border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Sparkles size={14} strokeWidth={2.5} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                AI Active
              </span>
            </div>
            <p className="mt-3 text-[12px] font-medium leading-relaxed text-muted-foreground/80">
              Tutor is monitoring your fluency patterns in real-time.
            </p>
          </div>

          {/* Theme + bottom */}
          <div className="flex items-center justify-between border-t border-border/60 px-6 py-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40">
              © 2026 Hen Heang · FullStack Developer
            </span>
            <ThemeToggle />
          </div>
        </aside>

        {/* ── Main column ── */}
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">

          {/* Mobile top bar - Hidden on chat for full screen immersive experience */}
          {!isChatRoute && (
            <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl lg:hidden">
              <div className="flex items-center gap-3">
                <Link href="/" className="group flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-md">
                    <Image
                      src="/koriai-logo.svg"
                      alt=""
                      width={18}
                      height={18}
                      className="invert brightness-0"
                    />
                  </div>
                </Link>
                <div className="flex flex-col">
                  <span className="text-[13px] font-black tracking-tight text-foreground leading-none">
                    KoriAI
                  </span>
                  <span className="mt-0.5 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                    by Hen Heang
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link
                  href="/settings"
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card shadow-sm transition-all active:scale-95",
                    pathname === "/settings"
                      ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/5"
                      : "text-muted-foreground"
                  )}
                >
                  <Settings size={18} strokeWidth={2.5} />
                </Link>
              </div>
            </header>
          )}

          {/* Desktop top bar */}
          <div className="hidden items-center justify-between border-b border-border/60 bg-card/30 px-8 py-5 backdrop-blur-xl lg:flex">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600/60 dark:text-emerald-400/60">
                Workspace
              </p>
              <h2 className="mt-1 text-sm font-bold text-foreground">
                {allLinks.find(l => pathname.startsWith(l.href))?.label || "KoriAI"}
              </h2>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 shadow-sm">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-foreground/60 text-nowrap">AI Sync Active</span>
               </div>
               <ThemeToggle />
            </div>
          </div>

          {/* Page content */}
          <main
            className={cn(
              "flex-1 overflow-x-hidden",
              isChatRoute 
                ? "px-0 pt-0" // Full bleed for chat on mobile
                : "px-3.5 pt-5 sm:px-6 lg:px-8 lg:pt-8",
              isKeyboardOpen
                ? "pb-[max(1rem,env(safe-area-inset-bottom))] lg:pb-10"
                : isChatRoute
                  ? "pb-0" // Chat window has its own padding/safe-areas
                  : "pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-10"
            )}
          >
            <div className={cn(
              "mx-auto w-full",
              isChatRoute ? "h-full max-w-none" : "max-w-6xl"
            )}>
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* ── Mobile bottom tab bar (Telegram-style Switcher) ── */}
      {!isChatRoute && (
        <nav
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 transition-all duration-500 ease-in-out lg:hidden",
            isKeyboardOpen ? "pointer-events-none translate-y-20 opacity-0" : "translate-y-0 opacity-100"
          )}
          style={{
            paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
          }}
          aria-hidden={isKeyboardOpen}
        >
          <div className="mx-auto max-w-md px-3.5">
            <div className="relative flex items-center justify-around rounded-[2rem] border border-white/15 bg-background/40 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-[32px] ring-1 ring-white/10 dark:bg-slate-900/60">
              
              {/* Sliding Active Indicator (Telegram-style) */}
              <AnimatePresence initial={false}>
                {activeTabIndex !== -1 && (
                  <motion.div
                    className="absolute z-0 h-[calc(100%-12px)] rounded-[1.45rem] bg-emerald-500/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ring-1 ring-emerald-500/20 dark:bg-emerald-400/10 dark:ring-emerald-400/20"
                    initial={false}
                    animate={{
                      left: `${(activeTabIndex * 100) / bottomTabs.length}%`,
                      width: `${100 / bottomTabs.length}%`,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                      mass: 1
                    }}
                  />
                )}
              </AnimatePresence>

              {bottomTabs.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "relative z-10 flex min-w-0 flex-1 flex-col items-center gap-1 py-2 transition-all duration-300 active:scale-90",
                      active
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground/50 hover:text-muted-foreground"
                    )}
                  >
                    <div className="flex h-5.5 w-5.5 items-center justify-center">
                      <Icon 
                        size={20} 
                        strokeWidth={active ? 2.8 : 2.2} 
                        className={cn(
                          "transition-all duration-300",
                          active ? "scale-110 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "scale-100"
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "truncate px-1 text-[9px] uppercase tracking-[0.08em] leading-none transition-all duration-300 sm:tracking-[0.12em]",
                        active ? "font-black opacity-100 translate-y-0" : "font-bold opacity-60 translate-y-0.5"
                      )}
                    >
                      {label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>
      )}    </div>
  )
}
