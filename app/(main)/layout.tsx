"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  Gauge,
  Menu,
  MessageCircle,
  NotebookText,
  Settings,
  Sparkles,
  SpellCheck2,
  Theater,
} from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const links = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/chat", label: "AI Chat", icon: MessageCircle },
  { href: "/correct", label: "Correction", icon: SpellCheck2 },
  { href: "/diary", label: "Diary", icon: NotebookText },
  { href: "/vocab", label: "Vocabulary", icon: BookOpen },
  { href: "/scenarios", label: "Scenarios", icon: Theater },
  { href: "/settings", label: "Settings", icon: Settings },
]

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname()

  const navItems = links.map((item) => {
    const Icon = item.icon
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors",
          active
            ? "bg-emerald-400 text-slate-950"
            : "bg-white/5 text-white/78 hover:bg-white/10"
        )}
      >
        <Icon size={20} strokeWidth={1.5} className="shrink-0 text-current" />
        {item.label}
      </Link>
    )
  })

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef6ff_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.08),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.08),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#081225_100%)]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-4 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4 lg:grid-cols-[280px_1fr] lg:gap-6 lg:px-6 lg:py-4">
        <aside className="hidden rounded-[2rem] border border-white/70 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/10 dark:border-emerald-500/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,8,23,0.98))] dark:shadow-black/40 lg:block">
          <Link href="/" className="block rounded-3xl bg-white/8 p-4">
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-200">KoriAI</p>
            <p className="mt-2 text-2xl font-semibold">Frontend shell</p>
            <p className="mt-2 text-sm text-white/70">
              Structured for chat, vocabulary, diary, scenarios, and progress.
            </p>
          </Link>

          <nav className="mt-6 space-y-2">{navItems}</nav>

          <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/6 p-4">
            <Badge className="bg-emerald-300 text-slate-950 hover:bg-emerald-300">
              <Sparkles size={20} strokeWidth={1.5} className="mr-1 text-current" />
              GPT-ready UI
            </Badge>
            <p className="mt-3 text-sm text-white/75">
              Attach your backend endpoints later without replacing the route
              structure.
            </p>
          </div>
        </aside>

        <div className="flex min-h-[calc(100vh-1rem)] flex-col rounded-[1.6rem] border border-white/70 bg-white/65 p-3 shadow-xl shadow-slate-950/5 backdrop-blur dark:border-white/8 dark:bg-[linear-gradient(180deg,rgba(8,18,37,0.78),rgba(2,8,23,0.86))] dark:shadow-black/35 sm:p-4 lg:min-h-[calc(100vh-2rem)] lg:rounded-[2rem] lg:p-6">
          <div className="mb-4 flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-slate-950/70 px-3 py-2 text-white shadow-lg shadow-black/20 backdrop-blur lg:hidden">
            <Link href="/" className="min-w-0">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-emerald-200">
                KoriAI
              </p>
              <p className="truncate text-sm font-medium text-white/90">
                Korean AI Platform
              </p>
            </Link>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-white/10 bg-white/6 text-white hover:bg-white/10"
                  >
                    <Menu size={20} strokeWidth={1.5} className="text-current" />
                    Menu
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="border-r border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,8,23,1))] p-0 text-white"
                >
                  <SheetHeader className="border-b border-white/10 p-5">
                    <SheetTitle className="text-left text-white">
                      Korean AI Platform
                    </SheetTitle>
                    <p className="text-sm text-white/65">
                      Optimized for iPhone and desktop workflows.
                    </p>
                  </SheetHeader>
                  <nav className="space-y-2 p-4">{navItems}</nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="mb-4 hidden items-center justify-end lg:flex">
            <ThemeToggle />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
