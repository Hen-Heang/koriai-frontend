"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, useSyncExternalStore } from "react"
import { Menu, MessageCircle, Settings } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { QuickSwitcher } from "@/components/app/quick-switcher"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { LevelBadge } from "@/components/achievements/LevelBadge"
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserAvatar } from "@/components/ui/UserAvatar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { userApi } from "@/lib/api"
import { isAuthenticated, getUserId } from "@/lib/auth-store"
import { hasCompletedOnboarding, markOnboardingComplete } from "@/lib/onboarding-store"
import { cn } from "@/lib/utils"
import {
  allLinks,
  bottomTabs,
  getWorkspaceForPath,
  homeLink,
  isLinkActive,
  moreWorkspaces,
  settingsLink,
  workspaceRoutePrefixes,
  workspaces,
} from "@/lib/navigation"
import { recordLastVisited } from "@/lib/last-visited"

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname()
  const router = useRouter()
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const slotCount = bottomTabs.length + 1
  const primaryTabIndex = bottomTabs.findIndex((tab) => isLinkActive(pathname, tab.href))
  const onMoreRoute = moreWorkspaces
    .flatMap((w) => w.links)
    .some((link) => isLinkActive(pathname, link.href))
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

  // Record the current route against its workspace so Home's "Continue"
  // cards can deep-link back into whatever the user was actually doing.
  useEffect(() => {
    if (workspaceRoutePrefixes.learning.some((prefix) => pathname.startsWith(prefix))) {
      recordLastVisited("learning", pathname)
    } else if (workspaceRoutePrefixes.productivity.some((prefix) => pathname.startsWith(prefix))) {
      recordLastVisited("productivity", pathname)
    } else if (workspaceRoutePrefixes.progress.some((prefix) => pathname.startsWith(prefix))) {
      recordLastVisited("progress", pathname)
    }
  }, [pathname])

  useEffect(() => {
    if (!mounted || !isAuthenticated()) return
    const userId = getUserId()
    if (!userId || hasCompletedOnboarding(userId)) return
    let active = true
    // Cross-device fallback: the "seen it" flag is local-only, so also check
    // whether the profile already has a learning goal set (from a prior
    // session on another device) before showing the wizard again.
    userApi
      .getById(userId)
      .then((profile) => {
        if (!active) return
        if (profile.learningGoal) markOnboardingComplete(userId)
        else setShowOnboarding(true)
      })
      .catch(() => {
        /* if the profile check fails, don't block the app on the wizard */
      })
    return () => {
      active = false
    }
  }, [mounted])

  if (!mounted) return null
  if (!isAuthenticated()) return null

  const isChatRoute = pathname === "/chat" || pathname.startsWith("/chat/")
  // Immersive breathing-timer screen — same full-bleed treatment as chat:
  // no mobile top bar, no bottom tab bar, no content padding.
  const isPauseRoute = pathname === "/growth/recovery/pause"
  // Home is the immersive "pick a lane" gate — no sidebar, no top bar, no
  // bottom tabs on desktop or mobile. Nav comes back once the user has picked
  // Learning or Productivity and is inside that workspace.
  const isHomeRoute = pathname === "/home"
  // Drives the desktop sidebar's contextual view — only the current
  // workspace's links are shown, switched via the icon row above them.
  const activeWorkspace = getWorkspaceForPath(pathname)

  return (
    <div className="min-h-[100dvh] bg-background">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-20 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-xl transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <div
        className={cn(
          "mx-auto flex w-full max-w-[92rem]",
          !isHomeRoute && "lg:grid lg:grid-cols-[280px_1fr]"
        )}
      >

        {/* ── Desktop sidebar — hidden on the Home gate ── */}
        {!isHomeRoute && (
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-border/60 bg-card/65 backdrop-blur-2xl dark:border-white/[0.07] dark:bg-[#08111f]/88 lg:flex">
          {/* Brand */}
          <div className="px-5 pt-7 pb-5">
            <Link href="/home" className="group flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl shadow-sm ring-1 ring-border/50 transition-transform group-hover:scale-105">
                <Image src="/hengo-icon.svg" alt="Hengo Logo" width={36} height={36} className="h-full w-full" />
              </div>
              <div>
                <p className="text-base font-semibold tracking-tight text-foreground">Hengo</p>
                <p className="text-[11px] font-medium text-muted-foreground">Korean for developers</p>
              </div>
            </Link>
          </div>

          {/* Home */}
          <div className="px-4 pb-3">
            <Link
              href={homeLink.href}
              aria-current={isLinkActive(pathname, homeLink.href) ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/70",
                isLinkActive(pathname, homeLink.href)
                  ? "bg-accent/60 text-foreground dark:bg-white/[0.06]"
                  : "text-muted-foreground/70 hover:bg-accent/40 hover:text-foreground dark:hover:bg-white/5"
              )}
            >
              <homeLink.icon size={16} strokeWidth={2} className="shrink-0 transition-transform group-hover:scale-110" />
              {homeLink.label}
            </Link>
          </div>

          {/* Workspace switcher — jump between the 4 workspaces; AI is just
              one of them here instead of a bespoke hero button. Icons only
              (no labels) so it stays a compact row regardless of how long a
              workspace's name is — hover/focus reveals the name via title. */}
          <div className="flex items-center justify-center gap-2 px-4 pb-4">
            {workspaces.map((workspace) => {
              const active = workspace.id === activeWorkspace?.id
              return (
                <Link
                  key={workspace.id}
                  href={workspace.links[0].href}
                  aria-current={active ? "page" : undefined}
                  aria-label={workspace.label}
                  title={workspace.label}
                  className={cn(
                    "group flex h-11 w-11 items-center justify-center rounded-xl outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring/70",
                    active
                      ? "bg-primary/15 text-primary shadow-sm dark:bg-primary/20"
                      : "text-muted-foreground/60 hover:bg-accent/40 hover:text-foreground dark:hover:bg-white/5"
                  )}
                >
                  <workspace.icon size={20} strokeWidth={active ? 2.5 : 2} className="shrink-0 transition-transform group-hover:scale-110" />
                </Link>
              )
            })}
          </div>

          <div className="mx-4 h-px bg-border/60" />

          <p className="px-7 pt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {activeWorkspace?.label ?? "Workspace"}
          </p>

          {/* Active workspace's links only — contextual to whichever
              workspace the current route belongs to */}
          <nav aria-label={activeWorkspace ? `${activeWorkspace.label} navigation` : "Workspace navigation"} className="flex-1 space-y-1 overflow-y-auto px-4 py-3">
            {activeWorkspace?.links.map(({ href, label, icon: Icon, soon }) => {
              const active = !soon && isLinkActive(pathname, href)

              if (soon) {
                return (
                  <div
                    key={href}
                    className="flex cursor-default items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground/60"
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
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/70",
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
          </nav>

          {/* Settings pinned at bottom */}
          <div className="border-t border-border/60 px-4 py-4">
            <Link
              href={settingsLink.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/70",
                pathname === settingsLink.href
                  ? "bg-accent/60 text-foreground dark:bg-white/[0.06]"
                  : "text-muted-foreground/70 hover:bg-accent/40 hover:text-foreground dark:hover:bg-white/5"
              )}
            >
              <Settings size={16} strokeWidth={2} className="shrink-0 transition-transform group-hover:scale-110" />
              Settings
            </Link>
          </div>
        </aside>
        )}

        {/* ── Main column ── */}
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">

          {isHomeRoute && (
            <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl sm:px-6 lg:px-8">
              <Link href="/home" className="group flex items-center gap-3" aria-label="Hengo home">
                <span className="flex size-9 items-center justify-center overflow-hidden rounded-xl shadow-sm ring-1 ring-border/60 transition-transform group-hover:scale-105">
                  <Image src="/hengo-icon.svg" alt="" width={36} height={36} className="size-full" />
                </span>
                <span>
                  <span className="block text-sm font-semibold leading-none tracking-tight text-foreground sm:text-base">Hengo</span>
                  <span className="mt-1 block text-[11px] font-medium leading-none text-muted-foreground">Korean for developers</span>
                </span>
              </Link>
              <div className="flex items-center gap-2">
                <QuickSwitcher compact className="sm:hidden" />
                <QuickSwitcher className="hidden sm:inline-flex" />
                <ThemeToggle />
                <NotificationBell />
                <UserAvatar href="/settings" title="Profile & settings" />
              </div>
            </header>
          )}

          {/* Mobile top bar — hidden on chat, pause, and Home for a full-bleed/gate experience */}
          {!isChatRoute && !isPauseRoute && !isHomeRoute && (
            <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl lg:hidden">
              <div className="flex items-center gap-3">
                <Link href="/home" className="group flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl shadow-md">
                    <Image src="/hengo-icon.svg" alt="" width={32} height={32} className="h-full w-full" />
                  </div>
                </Link>
                <div className="flex flex-col">
                  <span className="text-[15px] font-semibold tracking-tight text-foreground leading-none">Hengo</span>
                  <span className="mt-1 max-w-28 truncate text-[11px] font-medium leading-none text-muted-foreground">
                    {allLinks.find((link) => isLinkActive(pathname, link.href))?.label ?? "Workspace"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <QuickSwitcher compact />
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

          {/* Desktop top bar — hidden on the Home gate */}
          {!isHomeRoute && (
          <div className="hidden items-center justify-between border-b border-border/60 bg-card/35 px-8 py-3.5 backdrop-blur-xl lg:flex">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {activeWorkspace?.label ?? "Hengo"}
              </p>
              <h2 className="mt-0.5 text-sm font-semibold text-foreground">
                {allLinks.find((l) => isLinkActive(pathname, l.href))?.label ?? "Workspace"}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <QuickSwitcher />
              <Link
                href="/chat"
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-bold outline-none transition-all hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-95",
                  isChatRoute
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400"
                )}
              >
                <MessageCircle size={15} strokeWidth={2.5} />
                AI Coach
              </Link>
              <ThemeToggle />
              <LevelBadge />
              <NotificationBell />
              <UserAvatar href="/settings" title="Profile & settings" />
            </div>
          </div>
          )}

          {/* Page content */}
          <main
            id="main-content"
            tabIndex={-1}
            className={cn(
              "flex-1 overflow-x-hidden",
              isChatRoute || isPauseRoute
                ? "px-0 pt-0"
                : "px-4 pt-4 sm:px-6 lg:px-8 lg:pt-8",
              isKeyboardOpen
                ? "pb-[max(1rem,env(safe-area-inset-bottom))] lg:pb-10"
                : isChatRoute || isPauseRoute || isHomeRoute
                  ? "pb-0"
                  : "pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-10"
            )}
          >
            <div className={cn("mx-auto w-full", isChatRoute || isPauseRoute ? "h-full max-w-none" : "max-w-6xl")}>
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* ── Mobile bottom tab bar — hidden on chat, pause, and the Home gate ── */}
      {!isChatRoute && !isPauseRoute && !isHomeRoute && (
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
                const active = isLinkActive(pathname, href)
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-label={label}
                    className={cn(
                      "relative z-10 flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-90",
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
                        "w-full truncate px-0.5 text-center text-[11px] leading-none transition-all duration-300",
                        active ? "font-extrabold opacity-100" : "font-bold opacity-70 translate-y-0.5"
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
                  "relative z-10 flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-90",
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
                    "w-full truncate px-0.5 text-center text-[11px] leading-none transition-all duration-300",
                    onMoreRoute ? "font-extrabold opacity-100" : "font-bold opacity-70 translate-y-0.5"
                  )}
                >
                  More
                </span>
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* ── Mobile floating AI button — chat moved out of the bottom tabs ── */}
      {!isChatRoute && !isPauseRoute && !isHomeRoute && (
        <Link
          href="/chat"
          aria-label="AI Chat"
          aria-hidden={isKeyboardOpen}
          tabIndex={isKeyboardOpen ? -1 : undefined}
          className={cn(
            "fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/35 ring-1 ring-white/20 outline-none transition-all duration-500 ease-in-out hover:bg-blue-500 focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-90 lg:hidden",
            isKeyboardOpen ? "pointer-events-none translate-y-24 opacity-0" : "translate-y-0 opacity-100"
          )}
          style={{ bottom: "calc(4.75rem + max(1.25rem, env(safe-area-inset-bottom)))" }}
        >
          <MessageCircle size={24} strokeWidth={2.5} />
        </Link>
      )}

      {/* ── More sheet — grouped by workspace ── */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-[2rem] pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:hidden">
          <SheetHeader className="pb-2">
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto px-4 pb-2">
            {moreWorkspaces.map((workspace) => (
              workspace.links.length > 0 && (
                <div key={workspace.id}>
                  <p className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground/50">
                    <workspace.icon size={12} strokeWidth={2.5} />
                    {workspace.label}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {workspace.links.map(({ href, label, icon: Icon, soon }) => {
                      const active = !soon && isLinkActive(pathname, href)
                      if (soon) {
                        return (
                          <div
                            key={href}
                            aria-disabled="true"
                            className="flex cursor-not-allowed items-center gap-3 rounded-2xl border border-border/40 bg-accent/5 p-4 text-sm font-semibold text-muted-foreground/60"
                          >
                            <Icon size={20} strokeWidth={2.2} className="shrink-0" />
                            <span className="flex-1">{label}</span>
                            <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Soon
                            </span>
                          </div>
                        )
                      }
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setMoreOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border p-4 text-sm font-semibold outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-[0.98]",
                            active
                              ? "border-primary/35 bg-primary/10 text-primary"
                              : "border-border bg-accent/5 text-foreground hover:bg-accent/40"
                          )}
                        >
                          <Icon size={20} strokeWidth={2.5} className="shrink-0" />
                          <span className="flex-1">{label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            ))}
            <div>
              <p className="mb-2 px-1 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground/50">
                App
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/settings"
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-4 text-sm font-bold outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-[0.98]",
                    pathname === "/settings"
                      ? "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "border-border bg-accent/5 text-foreground hover:bg-accent/40"
                  )}
                >
                  <Settings size={20} strokeWidth={2.5} className="shrink-0" />
                  <span className="flex-1">Settings</span>
                </Link>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {showOnboarding && (
        <OnboardingFlow userId={getUserId()!} onDone={() => {
          markOnboardingComplete(getUserId())
          setShowOnboarding(false)
        }} />
      )}
    </div>
  )
}
