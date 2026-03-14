"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useSyncExternalStore } from "react"
import {
  BookOpen,
  Gauge,
  MessageCircle,
  NotebookText,
  Settings,
  Sparkles,
  SpellCheck2,
  Theater,
} from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { isAuthenticated } from "@/lib/auth-store"
import { cn } from "@/lib/utils"

const allLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/chat", label: "AI Chat", icon: MessageCircle },
  { href: "/correct", label: "Correction", icon: SpellCheck2 },
  { href: "/diary", label: "Diary", icon: NotebookText },
  { href: "/vocab", label: "Vocabulary", icon: BookOpen },
  { href: "/scenarios", label: "Scenarios", icon: Theater },
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
  const mounted = useSyncExternalStore(
    (callback) => {
      queueMicrotask(callback)
      return () => undefined
    },
    () => true,
    () => false
  )

  if (!mounted) return null

  if (!isAuthenticated()) {
    router.replace("/login")
    return null
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#030712]">
      <div className="mx-auto flex max-w-7xl lg:grid lg:grid-cols-[256px_1fr]">

        {/* ── Desktop sidebar ── */}
        <aside className="hidden lg:flex h-screen sticky top-0 flex-col border-r border-slate-200/70 bg-white dark:border-white/[0.07] dark:bg-[#0a0f1e]">
          {/* Brand */}
          <div className="px-5 pt-5 pb-4">
            <Link href="/" className="flex items-center gap-3 rounded-2xl p-2 -ml-2 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <Image
                src="/koriai-logo.svg"
                alt="KoriAI"
                width={36}
                height={36}
                className="rounded-xl shrink-0"
              />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400">
                  KoriAI
                </p>
                <p className="text-[13px] text-slate-500 dark:text-slate-400">
                  Korean AI Platform
                </p>
              </div>
            </Link>
          </div>

          <div className="mx-4 h-px bg-slate-100 dark:bg-white/[0.06]" />

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
            {allLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[14px] font-medium transition-all",
                    active
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                  )}
                >
                  <Icon size={18} strokeWidth={active ? 2 : 1.6} className="shrink-0" />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* AI badge */}
          <div className="m-3 rounded-[1.4rem] border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4 dark:border-emerald-500/20 dark:from-emerald-500/10 dark:to-teal-500/5">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <Sparkles size={14} strokeWidth={2} />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
                AI Tutor
              </span>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
              Your AI tutor is always ready to chat, correct, and coach in Korean.
            </p>
          </div>

          {/* Theme + bottom */}
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-white/[0.06]">
            <span className="text-[12px] text-slate-400 dark:text-slate-500">
              © 2026 KoriAI
            </span>
            <ThemeToggle />
          </div>
        </aside>

        {/* ── Main column ── */}
        <div className="flex min-w-0 flex-col overflow-x-hidden">

          {/* Mobile top bar */}
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200/60 bg-white/90 px-4 py-3 backdrop-blur-xl dark:border-white/[0.07] dark:bg-[#030712]/90 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/koriai-logo.svg"
                alt="KoriAI"
                width={28}
                height={28}
                className="rounded-lg"
              />
              <span className="text-[14px] font-semibold text-slate-900 dark:text-white">
                KoriAI
              </span>
            </Link>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Link
                href="/settings"
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  pathname === "/settings"
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                    : "text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                )}
              >
                <Settings size={17} strokeWidth={1.6} />
              </Link>
            </div>
          </header>

          {/* Desktop top bar */}
          <div className="hidden items-center justify-end border-b border-slate-200/60 px-6 py-3 dark:border-white/[0.07] lg:flex">
            <ThemeToggle />
          </div>

          {/* Page content */}
          <main className="flex-1 overflow-x-hidden px-4 pt-5 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-5 lg:pb-8 lg:px-7 lg:pt-7">
            {children}
          </main>
        </div>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
        style={{
          paddingBottom: "max(0.6rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto max-w-md px-3">
          <div className="flex items-end gap-1.5 rounded-[2rem] border border-white/45 bg-white/70 px-2.5 py-2 shadow-[0_20px_50px_rgba(15,23,42,0.16)] ring-1 ring-white/35 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06] dark:ring-white/8 dark:shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          {bottomTabs.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-[1.35rem] px-1 py-1.5 transition-all duration-200",
                  active
                    ? "text-emerald-600 dark:text-emerald-300"
                    : "text-slate-500/90 dark:text-slate-400"
                )}
              >
                <div
                  className={cn(
                    "flex min-w-[3.5rem] items-center justify-center rounded-[1.1rem] px-3.5 py-2.5 transition-all duration-200",
                    active
                      ? "bg-[linear-gradient(180deg,rgba(16,185,129,0.22),rgba(16,185,129,0.1))] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_10px_24px_rgba(16,185,129,0.18)] ring-1 ring-emerald-200/70 dark:bg-emerald-500/18 dark:ring-emerald-400/20"
                      : "bg-transparent opacity-90"
                  )}
                >
                  <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                </div>
                <span
                  className={cn(
                    "truncate px-1 text-[12px] leading-none tracking-[-0.015em]",
                    active ? "font-semibold" : "font-medium"
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
    </div>
  )
}
