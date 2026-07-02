"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, useSyncExternalStore } from "react"
import {
  BookOpen,
  BookOpenText,
  Drama,
  Gauge,
  GraduationCap,
  Headphones,
  History,
  Languages,
  Menu,
  MessageCircle,
  Settings,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { NotificationBell } from "@/components/notifications/NotificationBell"
import { LevelBadge } from "@/components/achievements/LevelBadge"
import { UserAvatar } from "@/components/ui/UserAvatar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { isAuthenticated } from "@/lib/auth-store"
import { cn } from "@/lib/utils"

// ─── Nav data ─────────────────────────────────────────────────────────────────

type NavLink = {
  href: string
  label: string
  icon: React.ElementType
  soon?: boolean
}

// Desktop sidebar sections
const navSections: Array<{ label: string; links: NavLink[] }> = [
  {
    label: "Practice",
    links: [
      { href: "/practice", label: "Today", icon: Sparkles },
      { href: "/goals", label: "Goals", icon: Target },
      { href: "/dashboard", label: "Dashboard", icon: Gauge },
    ],
  },
  {
    label: "Study",
    links: [
      { href: "/learn", label: "Foundations", icon: Languages },
      { href: "/vocab", label: "Vocabulary", icon: BookOpen },
      { href: "/interview", label: "Exam Prep", icon: GraduationCap },
      { href: "/scenarios", label: "Scenarios", icon: Drama },
      { href: "/reading", label: "Reading", icon: BookOpenText },
      // { href: "/listening", label: "Listening", icon: Headphones, soon: true },
    ],
  },
  {
    label: "Track",
    links: [
      { href: "/history", label: "History", icon: History },
      { href: "/achievements", label: "Achievements", icon: Trophy },
    ],
  },
]

// Primary five bottom tabs — most-used daily surfaces
const bottomTabs: NavLink[] = [
  { href: "/dashboard", label: "Home", icon: Gauge },
  { href: "/practice", label: "Today", icon: Sparkles },
  { href: "/vocab", label: "Vocab", icon: BookOpen },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/chat", label: "AI", icon: MessageCircle },
]

// All navigable links (for page-title lookup)
const allLinks: NavLink[] = [
  ...navSections.flatMap((s) => s.links),
  { href: "/chat", label: "AI Coach", icon: MessageCircle },
  { href: "/account", label: "Account", icon: Settings },
  { href: "/settings", label: "Settings", icon: Settings },
]

// More-sheet groups — everything not already a bottom tab
const moreGroups: Array<{ label: string; links: NavLink[] }> = [
  {
    label: "Study",
    links: allLinks.filter(
      (l) =>
        !bottomTabs.some((t) => t.href === l.href) &&
        ["/learn", "/interview", "/scenarios", "/reading"].includes(l.href)
    ),
  },
  {
    label: "Track",
    links: allLinks.filter(
      (l) =>
        !bottomTabs.some((t) => t.href === l.href) &&
        ["/history", "/achievements"].includes(l.href)
    ),
  },
  {
    label: "App",
    links: allLinks.filter(
      (l) =>
        !bottomTabs.some((t) => t.href === l.href) &&
        ["/account", "/settings"].includes(l.href)
    ),
  },
]

// Flat list used for the "onMoreRoute" check
const moreLinks = allLinks.filter(
  (link) => !bottomTabs.some((tab) => tab.href === link.href)
)

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname()
  const router = useRouter()
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  const slotCount = bottomTabs.length + 1
  const primaryTabIndex = bottomTabs.findIndex(
    (tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`)
  )
  const onMoreRoute = moreLinks.some(
    (link) => pathname === link.href || pathname.startsWith(`${link.href}/`)
  )
  const activeTabIndex =
    primaryTabIndex !== -1 ? primaryTabIndex : onMoreRoute ? bottomTabs.length : -1

  const mounted = useSyncExternalStore(
    (callback) => {
      queueMicrotask(callback)
      return () => undefined
    },
    () => true,
    () => false
  )

  useEffect(() => {
    if (typeof window === "undefined") return

    const viewport = window.visualViewport
    let baseHeight = viewport?.height ?? window.innerHeight

    function updateKeyboardState() {
      const currentHeight = viewport?.height ?? window.innerHeight
      const activeElement = document.activeElement as HTMLElement | null
      const isEditable =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.isContentEditable

      if (!isEditable) baseHeight = currentHeight

      const heightDelta = baseHeight - currentHeight
      setIsKeyboardOpen(Boolean(isEditable && heightDelta > 120))
    }

    function handleFocusIn(event: FocusEvent) {
      const target = event.target as HTMLElement | null
      const isEditable =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      if (isEditable) updateKeyboardState()
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

  useEffect(() => {
    if (mounted && !isAuthenticated()) {
      router.replace("/login")
    }
  }, [mounted, router])

  if (!mounted) return null
  if (!isAuthenticated()) return null

  const isChatRoute = pathname === "/chat" || pathname.startsWith("/chat/")

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="mx-auto flex w-full max-w-[92rem] lg:grid lg:grid-cols-[280px_1fr]">

        {/* ── Desktop sidebar ── */}
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-border/60 bg-card/50 backdrop-blur-2xl dark:border-white/[0.07] dark:bg-[#08111f]/80 lg:flex">
          {/* Brand */}
          <div className="px-5 pt-7 pb-5">
            <Link href="/" className="group flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl shadow-sm ring-1 ring-border/50 transition-transform group-hover:scale-105">
                <Image src="/hengo-icon.svg" alt="Hengo Logo" width={36} height={36} className="h-full w-full" />
              </div>
              <div>
                <p className="text-[12px] font-bold tracking-tight text-foreground">Hengo Lab</p>
                <p className="text-[10px] font-medium text-muted-foreground/50">Korean for Devs</p>
              </div>
            </Link>
          </div>

          {/* AI Coach — primary CTA */}
          <div className="px-4 pb-4">
            <Link
              href="/chat"
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all",
                isChatRoute
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400"
              )}
            >
              <MessageCircle size={18} strokeWidth={2.5} className="shrink-0" />
              AI Coach
              <span className="relative ml-auto flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            </Link>
          </div>

          <div className="mx-4 h-px bg-border/60" />

          {/* Nav sections */}
          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            {navSections.map((section) => (
              <div key={section.label} className="space-y-0.5">
                <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">
                  {section.label}
                </p>
                {section.links.map(({ href, label, icon: Icon, soon }) => {
                  const active = !soon && (pathname === href || pathname.startsWith(`${href}/`))

                  if (soon) {
                    return (
                      <div
                        key={href}
                        className="flex cursor-default items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-muted-foreground/30"
                      >
                        <Icon size={16} strokeWidth={2} className="shrink-0" />
                        {label}
                        <span className="ml-auto rounded-full bg-muted/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground/40">
                          Soon
                        </span>
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors",
                        active
                          ? "bg-accent/60 text-foreground dark:bg-white/[0.06]"
                          : "text-muted-foreground/70 hover:bg-accent/40 hover:text-foreground dark:hover:bg-white/5"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="sidebar-active-bar"
                          className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-foreground/40"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      <Icon
                        size={16}
                        strokeWidth={active ? 2.5 : 2}
                        className="shrink-0 transition-transform group-hover:scale-110"
                      />
                      {label}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* Settings pinned at bottom */}
          <div className="border-t border-border/60 px-4 py-4">
            <Link
              href="/settings"
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors",
                pathname === "/settings"
                  ? "bg-accent/60 text-foreground dark:bg-white/[0.06]"
                  : "text-muted-foreground/70 hover:bg-accent/40 hover:text-foreground dark:hover:bg-white/5"
              )}
            >
              <Settings size={16} strokeWidth={2} className="shrink-0 transition-transform group-hover:scale-110" />
              Settings
            </Link>
          </div>
        </aside>

        {/* ── Main column ── */}
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">

          {/* Mobile top bar — hidden on chat for full-bleed experience */}
          {!isChatRoute && (
            <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl lg:hidden">
              <div className="flex items-center gap-3">
                <Link href="/" className="group flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl shadow-md">
                    <Image src="/hengo-icon.svg" alt="" width={32} height={32} className="h-full w-full" />
                  </div>
                </Link>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold tracking-tight text-foreground leading-none">Hengo</span>
                  <span className="mt-0.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight">by Hen Heang</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <LevelBadge />
                <NotificationBell />
                <UserAvatar
                  href="/settings"
                  title="Profile & settings"
                  className={cn(pathname === "/settings" && "ring-2 ring-blue-500/40")}
                />
              </div>
            </header>
          )}

          {/* Desktop top bar */}
          <div className="hidden items-center justify-between border-b border-border/60 bg-card/30 px-8 py-4 backdrop-blur-xl lg:flex">
            <h2 className="text-sm font-bold text-foreground">
              {allLinks.find((l) => pathname === l.href || pathname.startsWith(`${l.href}/`))?.label ?? "Hengo"}
            </h2>
            <div className="flex items-center gap-3">
              <Link
                href="/chat"
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-bold transition-all hover:scale-[1.02] active:scale-95",
                  isChatRoute
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400"
                )}
              >
                <MessageCircle size={15} strokeWidth={2.5} />
                AI Coach
              </Link>
              <LevelBadge />
              <NotificationBell />
              <UserAvatar href="/settings" title="Profile & settings" />
            </div>
          </div>

          {/* Page content */}
          <main
            className={cn(
              "flex-1 overflow-x-hidden",
              isChatRoute
                ? "px-0 pt-0"
                : "px-4 pt-4 sm:px-6 lg:px-8 lg:pt-8",
              isKeyboardOpen
                ? "pb-[max(1rem,env(safe-area-inset-bottom))] lg:pb-10"
                : isChatRoute
                  ? "pb-0"
                  : "pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-10"
            )}
          >
            <div className={cn("mx-auto w-full", isChatRoute ? "h-full max-w-none" : "max-w-6xl")}>
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      {!isChatRoute && (
        <nav
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 transition-all duration-500 ease-in-out lg:hidden",
            isKeyboardOpen ? "pointer-events-none translate-y-20 opacity-0" : "translate-y-0 opacity-100"
          )}
          style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
          aria-hidden={isKeyboardOpen}
        >
          <div className="mx-auto max-w-md px-2 sm:px-3.5">
            <div className="relative flex items-center justify-around rounded-[1.75rem] border border-border/80 bg-background/70 p-1 shadow-[0_12px_40px_rgba(15,23,42,0.14)] backdrop-blur-[32px] ring-1 ring-black/4 dark:border-white/15 dark:bg-slate-900/60 dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:ring-white/10">

              {/* Sliding active indicator */}
              <AnimatePresence initial={false}>
                {activeTabIndex !== -1 && (
                  <motion.div
                    className="absolute z-0 h-[calc(100%-8px)] rounded-[1.35rem] bg-blue-500/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ring-1 ring-blue-500/20 dark:bg-blue-400/10 dark:ring-blue-400/20"
                    initial={false}
                    style={{ width: `calc((100% - 0.5rem) / ${slotCount})` }}
                    animate={{
                      left: `calc(0.25rem + ${activeTabIndex} * (100% - 0.5rem) / ${slotCount})`,
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 30, mass: 1 }}
                  />
                )}
              </AnimatePresence>

              {bottomTabs.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-label={label}
                    className={cn(
                      "relative z-10 flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1.5 transition-all duration-300 active:scale-90",
                      active ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground/50 hover:text-muted-foreground"
                    )}
                  >
                    <div className="flex h-6 w-6 items-center justify-center">
                      <Icon
                        size={22}
                        strokeWidth={active ? 2.8 : 2.2}
                        className={cn("transition-all duration-300", active ? "scale-110" : "scale-100")}
                      />
                    </div>
                    <span
                      className={cn(
                        "w-full truncate px-0.5 text-center text-[10px] uppercase tracking-[0.03em] leading-none transition-all duration-300",
                        active ? "font-bold opacity-100" : "font-bold opacity-60 translate-y-0.5"
                      )}
                    >
                      {label}
                    </span>
                  </Link>
                )
              })}

              {/* More button */}
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                aria-label="More"
                aria-haspopup="dialog"
                className={cn(
                  "relative z-10 flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1.5 transition-all duration-300 active:scale-90",
                  onMoreRoute ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground/50 hover:text-muted-foreground"
                )}
              >
                <div className="flex h-6 w-6 items-center justify-center">
                  <Menu
                    size={22}
                    strokeWidth={onMoreRoute ? 2.8 : 2.2}
                    className={cn("transition-all duration-300", onMoreRoute ? "scale-110" : "scale-100")}
                  />
                </div>
                <span
                  className={cn(
                    "w-full truncate px-0.5 text-center text-[10px] uppercase tracking-[0.03em] leading-none transition-all duration-300",
                    onMoreRoute ? "font-bold opacity-100" : "font-bold opacity-60 translate-y-0.5"
                  )}
                >
                  More
                </span>
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* ── More sheet — grouped feature list ── */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-[2rem] pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:hidden">
          <SheetHeader className="pb-2">
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-2">
            {moreGroups.map((group) => (
              group.links.length > 0 && (
                <div key={group.label}>
                  <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.links.map(({ href, label, icon: Icon, soon }) => {
                      const active = !soon && (pathname === href || pathname.startsWith(`${href}/`))
                      return (
                        <Link
                          key={href}
                          href={soon ? "#" : href}
                          onClick={() => { if (!soon) setMoreOpen(false) }}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border p-4 text-sm font-bold transition-all active:scale-[0.98]",
                            soon
                              ? "cursor-default border-border/40 bg-accent/5 text-muted-foreground/30"
                              : active
                                ? "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : "border-border bg-accent/5 text-foreground hover:bg-accent/40"
                          )}
                        >
                          <Icon size={20} strokeWidth={2.5} className="shrink-0" />
                          <span className="flex-1">{label}</span>
                          {soon && (
                            <span className="rounded-full bg-muted/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground/40">
                              Soon
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
