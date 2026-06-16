"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, useSyncExternalStore } from "react"
import {
  BookOpen,
  BookOpenText,
  CalendarDays,
  Gauge,
  GraduationCap,
  Target,
  // Headphones, // hidden Listening nav
  // History, // moved into Settings page
  MessageCircle,
  // Mic, // hidden Speaking nav
  // ScanText, // hidden Analyzer nav
  Settings,
  Sparkles,
  // Theater, // hidden Meeting Sim nav
  // Trophy, // hidden Achievements nav
  // Wand2, // hidden Message Gen nav
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { UserAvatar } from "@/components/ui/UserAvatar"
import { isAuthenticated } from "@/lib/auth-store"
import { cn } from "@/lib/utils"

// Grouped nav so the sidebar stays scannable as features come back online.
// Each section renders under a subtle uppercase label.
const navSections = [
  {
    // Goals is the primary surface — keep it at the very top of the sidebar.
    label: "Plan",
    links: [
      { href: "/goals", label: "Goals", icon: Target },
      { href: "/dashboard", label: "Dashboard", icon: Gauge },
    ],
  },
  {
    label: "Learn",
    links: [
      { href: "/vocab", label: "Vocabulary", icon: BookOpen },
      { href: "/reading", label: "Reading", icon: BookOpenText },
      { href: "/daily-phrase", label: "Daily Phrase", icon: CalendarDays },
      { href: "/interview", label: "Exam Prep", icon: GraduationCap },
      // AI Coach now hosts Chat + Analyze + Generate as tabs (see /chat).
      { href: "/chat", label: "AI Coach", icon: MessageCircle },
      // ── built but hidden — restore by uncommenting (icons imported above) ──
      // { href: "/listening", label: "Listening", icon: Headphones },
      // { href: "/achievements", label: "Achievements", icon: Trophy },
    ],
  },
  {
    label: "Account",
    links: [
      // ── History moved into Settings — reach it from the Settings page ──
      // { href: "/history", label: "History", icon: History },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
]

// Flat list kept for the desktop top-bar title lookup.
const allLinks = navSections.flatMap((section) => section.links)

// Goals sits in the center slot so it reads as the app's primary action.
// AI Coach sits beside it so the chat tutor is one tap away on mobile.
// (Reading stays in the desktop sidebar — it reads better on a large screen.)
const bottomTabs = [
  { href: "/dashboard", label: "Home", icon: Gauge },
  { href: "/vocab", label: "Vocab", icon: BookOpen },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/chat", label: "AI", icon: MessageCircle },
  { href: "/interview", label: "Exam", icon: GraduationCap },
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
    let baseHeight = viewport?.height ?? window.innerHeight

    function updateKeyboardState() {
      const currentHeight = viewport?.height ?? window.innerHeight
      const activeElement = document.activeElement as HTMLElement | null
      const isEditable =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.isContentEditable

      // While nothing editable is focused the keyboard can't be open, so the
      // current height is the true baseline — re-capturing it here keeps the
      // detection correct after rotation or browser-chrome resizes.
      if (!isEditable) {
        baseHeight = currentHeight
      }

      const heightDelta = baseHeight - currentHeight
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
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl shadow-sm ring-1 ring-border/50 transition-transform group-hover:scale-105">
                <Image
                  src="/hengo-icon.svg"
                  alt="Hengo Logo"
                  width={40}
                  height={40}
                  className="h-full w-full"
                />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-foreground">
                  Hengo Lab
                </p>
                <p className="text-[10px] font-bold text-muted-foreground/60 text-nowrap">
                  Premium Learning
                </p>
              </div>
            </Link>
          </div>

          <div className="mx-6 h-px bg-border/60" />

          {/* Nav */}
          <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
            {navSections.map((section) => (
              <div key={section.label} className="space-y-1">
                <p className="px-4 pb-1 text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground/40">
                  {section.label}
                </p>
                {section.links.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(`${href}/`)
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-2xl px-4 py-2.5 text-[14px] font-bold transition-all",
                        active
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground dark:hover:bg-white/5"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="sidebar-active-bar"
                          className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-white"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      <Icon
                        size={18}
                        strokeWidth={2.5}
                        className={cn(
                          "shrink-0 transition-transform",
                          active ? "scale-105" : "group-hover:scale-110 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                        )}
                      />
                      {label}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* AI badge */}
          <div className="mx-4 mb-3 flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 shadow-sm">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <Sparkles size={12} strokeWidth={2.5} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">AI Active</span>
              </div>
              <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground/70">
                Monitoring your fluency live
              </p>
            </div>
          </div>

          {/* Theme + bottom */}
          <div className="flex items-center justify-between border-t border-border/60 px-6 py-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40">
              © 2026 Hen Heang
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
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg shadow-md">
                    <Image
                      src="/hengo-icon.svg"
                      alt=""
                      width={32}
                      height={32}
                      className="h-full w-full"
                    />
                  </div>
                </Link>
                <div className="flex flex-col">
                  <span className="text-[13px] font-black tracking-tight text-foreground leading-none">
                    Hengo
                  </span>
                  <span className="mt-0.5 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                    by Hen Heang
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <ThemeToggle />
                <UserAvatar
                  href="/settings"
                  title="Profile & settings"
                  className={cn(
                    pathname === "/settings" && "ring-2 ring-blue-500/40"
                  )}
                />
              </div>
            </header>
          )}

          {/* Desktop top bar */}
          <div className="hidden items-center justify-between border-b border-border/60 bg-card/30 px-8 py-5 backdrop-blur-xl lg:flex">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600/60 dark:text-blue-400/60">
                Workspace
              </p>
              <h2 className="mt-1 text-sm font-bold text-foreground">
                {allLinks.find(l => pathname.startsWith(l.href))?.label || "Hengo"}
              </h2>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 shadow-sm">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-foreground/60 text-nowrap">AI Sync Active</span>
               </div>
               <NotificationBell />
               <ThemeToggle />
               <UserAvatar href="/settings" title="Profile & settings" />
            </div>
          </div>

          {/* Page content */}
          <main
            className={cn(
              "flex-1 overflow-x-hidden",
              isChatRoute 
                ? "px-0 pt-0" // Full bleed for chat on mobile
                : "px-4 pt-4 sm:px-6 lg:px-8 lg:pt-8",
              isKeyboardOpen
                ? "pb-[max(1rem,env(safe-area-inset-bottom))] lg:pb-10"
                : isChatRoute
                  ? "pb-0" // Chat window has its own padding/safe-areas
                  : "pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-10"
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
            <div className="relative flex items-center justify-around rounded-[2rem] border border-border/80 bg-background/70 p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.14)] backdrop-blur-[32px] ring-1 ring-black/[0.04] dark:border-white/15 dark:bg-slate-900/60 dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:ring-white/10">
              
              {/* Sliding Active Indicator (Telegram-style) */}
              <AnimatePresence initial={false}>
                {activeTabIndex !== -1 && (
                  <motion.div
                    className="absolute z-0 h-[calc(100%-12px)] rounded-[1.45rem] bg-blue-500/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ring-1 ring-blue-500/20 dark:bg-blue-400/10 dark:ring-blue-400/20"
                    initial={false}
                    style={{ width: `calc((100% - 0.75rem) / ${bottomTabs.length})` }}
                    animate={{
                      // % offsets resolve against the padding box, but the tabs sit
                      // inside the p-1.5 content box — offset by the 0.375rem padding.
                      left: `calc(0.375rem + ${activeTabIndex} * (100% - 0.75rem) / ${bottomTabs.length})`,
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
                // Goals is the app's primary action — render it as an elevated
                // center pill so it stands out from the other tabs.
                const isPrimary = href === "/goals"

                if (isPrimary) {
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-label={label}
                      className="relative z-10 flex min-w-0 flex-1 flex-col items-center gap-1 py-2 transition-all duration-300 active:scale-90"
                    >
                      <div
                        className={cn(
                          "-mt-6 flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg ring-4 ring-background transition-all duration-300 dark:ring-slate-900",
                          active
                            ? "scale-105 bg-blue-600 text-white shadow-blue-600/40"
                            : "bg-blue-500 text-white shadow-blue-500/30 hover:scale-105"
                        )}
                      >
                        <Icon size={22} strokeWidth={2.6} />
                      </div>
                      <span
                        className={cn(
                          "truncate px-1 text-[9px] uppercase tracking-[0.08em] leading-none transition-all duration-300 sm:tracking-[0.12em]",
                          active
                            ? "font-black text-blue-600 opacity-100 dark:text-blue-400"
                            : "font-bold text-muted-foreground/60 opacity-80"
                        )}
                      >
                        {label}
                      </span>
                    </Link>
                  )
                }

                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "relative z-10 flex min-w-0 flex-1 flex-col items-center gap-1 py-2 transition-all duration-300 active:scale-90",
                      active
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-muted-foreground/50 hover:text-muted-foreground"
                    )}
                  >
                    <div className="flex h-5.5 w-5.5 items-center justify-center">
                      <Icon
                        size={20}
                        strokeWidth={active ? 2.8 : 2.2}
                        className={cn(
                          "transition-all duration-300",
                          active ? "scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" : "scale-100"
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
