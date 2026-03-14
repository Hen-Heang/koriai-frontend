import Image from "next/image"
import Link from "next/link"
import {
  BookOpenCheck,
  BrainCircuit,
  Languages,
  MessageSquareText,
  NotebookPen,
  Sparkles,
  ArrowRight,
  Send,
} from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

const features = [
  {
    title: "AI Korean Chat",
    description: "Talk naturally with an AI tutor that keeps replies structured and focused on your level.",
    icon: MessageSquareText,
    color: "from-emerald-500/20 to-teal-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-500/15",
  },
  {
    title: "Sentence Correction",
    description: "Paste your Korean writing and get clean rewrites with explanations you can actually learn from.",
    icon: Languages,
    color: "from-sky-500/20 to-blue-500/10",
    iconColor: "text-sky-600 dark:text-sky-400",
    iconBg: "bg-sky-100 dark:bg-sky-500/15",
  },
  {
    title: "Diary Coaching",
    description: "Turn daily journal entries into structured feedback on tone, vocabulary, and natural phrasing.",
    icon: NotebookPen,
    color: "from-violet-500/20 to-purple-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
    iconBg: "bg-violet-100 dark:bg-violet-500/15",
  },
  {
    title: "Vocabulary Review",
    description: "Words you save from real sessions come back at the right moment through spaced repetition.",
    icon: BookOpenCheck,
    color: "from-amber-500/20 to-orange-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-500/15",
  },
]

const chatMessages = [
  { role: "you", text: "I want to practice ordering coffee in Korean." },
  {
    role: "ai",
    text: "Try: \"아이스 아메리카노 한 잔 주세요.\" — Want me to break down the grammar?",
  },
  { role: "you", text: "Yes please, and what does 주세요 mean exactly?" },
  {
    role: "ai",
    text: "주세요 is the polite form of 주다 (to give). Literally \"please give me.\" It's the go-to for polite requests.",
  },
]

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white dark:bg-[#030712]">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-32 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-radial from-emerald-300/30 via-teal-200/10 to-transparent blur-3xl dark:from-emerald-600/20 dark:via-teal-500/5" />
        <div className="absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-gradient-radial from-sky-300/20 via-blue-200/10 to-transparent blur-3xl dark:from-sky-600/15 dark:via-blue-500/5" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[500px] rounded-full bg-gradient-radial from-violet-300/15 to-transparent blur-3xl dark:from-violet-600/10" />
      </div>

      <div className="relative z-10">
        {/* Navbar */}
        <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 px-4 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#030712]/80 sm:px-6 lg:px-8">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between sm:h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/koriai-logo.svg"
                alt="KoriAI"
                width={34}
                height={34}
                className="rounded-xl"
              />
              <span className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
                KoriAI
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button asChild size="sm" variant="ghost" className="hidden text-slate-600 dark:text-slate-300 sm:inline-flex">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full px-4 text-[13px]">
                <Link href="/register">Get started</Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Left — copy */}
              <div className="flex flex-col">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-[13px] font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <BrainCircuit size={14} strokeWidth={2} />
                  AI-powered Korean learning
                </div>

                <h1 className="mt-5 text-[2.6rem] font-bold leading-[1.08] tracking-[-0.03em] text-slate-950 sm:text-5xl lg:text-[3.6rem] dark:text-white">
                  Learn Korean that{" "}
                  <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 bg-clip-text text-transparent">
                    actually sticks.
                  </span>
                </h1>

                <p className="mt-5 text-[1.05rem] leading-relaxed text-slate-600 sm:text-lg dark:text-slate-400">
                  Practice with an AI tutor, fix your writing, and build vocabulary — all inside one clean, focused app that feels right on iPhone and Mac.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-7 text-[15px] font-semibold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-500 hover:to-teal-500 dark:shadow-emerald-900/30"
                  >
                    <Link href="/register">
                      Start for free
                      <ArrowRight size={16} className="ml-1" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-full border-slate-200 px-7 text-[15px] font-medium dark:border-white/10 dark:bg-white/5 dark:text-white"
                  >
                    <Link href="/dashboard">Open dashboard</Link>
                  </Button>
                </div>

                {/* Stats row */}
                <div className="mt-10 grid grid-cols-3 divide-x divide-slate-200 dark:divide-white/10">
                  {[
                    { value: "4", label: "Learning modes" },
                    { value: "AI", label: "Powered tutor" },
                    { value: "iOS", label: "& Mac ready" },
                  ].map((stat) => (
                    <div key={stat.label} className="px-4 first:pl-0 last:pr-0">
                      <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {stat.value}
                      </p>
                      <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — chat preview */}
              <div className="relative">
                {/* Glow */}
                <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-emerald-400/20 via-teal-400/10 to-sky-400/15 blur-2xl dark:from-emerald-600/20 dark:via-teal-600/10 dark:to-sky-600/15" />

                {/* Phone frame */}
                <div className="relative mx-auto max-w-[340px] lg:max-w-full">
                  <div className="overflow-hidden rounded-[2.2rem] border border-slate-200/80 bg-white shadow-2xl shadow-slate-950/10 dark:border-white/10 dark:bg-[#0e1724]">
                    {/* Phone status bar */}
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-white/[0.07]">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400">
                          KoriAI Chat
                        </span>
                      </div>
                      <div className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        Live
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="space-y-3 p-4 pb-2">
                      {chatMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex ${msg.role === "you" ? "justify-end" : "justify-start"}`}
                        >
                          {msg.role === "ai" && (
                            <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600">
                              <Sparkles size={11} className="text-white" />
                            </div>
                          )}
                          <div
                            className={`max-w-[82%] rounded-[1.1rem] px-3.5 py-2.5 text-[13px] leading-[1.55] ${
                              msg.role === "you"
                                ? "rounded-br-[0.4rem] bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                                : "rounded-bl-[0.4rem] border border-slate-100 bg-slate-50 text-slate-800 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-slate-100"
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      ))}

                      {/* Typing indicator */}
                      <div className="flex items-center gap-2 pb-1">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600">
                          <Sparkles size={11} className="text-white" />
                        </div>
                        <div className="flex gap-1 rounded-[1.1rem] rounded-bl-[0.4rem] border border-slate-100 bg-slate-50 px-3.5 py-3 dark:border-white/[0.08] dark:bg-white/[0.05]">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500"
                              style={{ animationDelay: `${i * 0.15}s` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Input bar */}
                    <div className="border-t border-slate-100 px-4 py-3 dark:border-white/[0.07]">
                      <div className="flex items-center gap-2 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-white/10 dark:bg-white/[0.05]">
                        <span className="flex-1 text-[13px] text-slate-400 dark:text-slate-500">
                          Practice something new…
                        </span>
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600">
                          <Send size={12} className="text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center sm:mb-14">
              <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                What&apos;s inside
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
                Four focused learning modes
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[1.05rem] text-slate-500 dark:text-slate-400">
                Each mode targets a specific skill so you&apos;re always making progress, not just practicing randomly.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/[0.08] dark:bg-[#0e1724]"
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                    />
                    <div className="relative">
                      <div className={`inline-flex rounded-2xl ${feature.iconBg} p-3`}>
                        <Icon size={20} strokeWidth={1.7} className={feature.iconColor} />
                      </div>
                      <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-4 pb-20 pt-8 sm:px-6 sm:pb-24 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-600 p-8 text-center shadow-2xl shadow-emerald-900/20 sm:p-12">
              {/* Decorative blobs */}
              <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

              <div className="relative">
                <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
                  Start today
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Ready to speak more natural Korean?
                </h2>
                <p className="mx-auto mt-4 max-w-md text-[1.05rem] text-emerald-100">
                  Join KoriAI and practice the way that works — focused, structured, and designed for your phone.
                </p>
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-full bg-white px-8 text-[15px] font-semibold text-emerald-700 shadow-lg hover:bg-emerald-50"
                  >
                    <Link href="/register">Create free account</Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="ghost"
                    className="h-12 rounded-full px-8 text-[15px] font-medium text-white hover:bg-white/15"
                  >
                    <Link href="/login">Sign in</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200/60 px-4 py-6 dark:border-white/[0.07]">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/koriai-logo.svg" alt="KoriAI" width={24} height={24} className="rounded-lg opacity-70" />
              <span className="text-[13px] text-slate-400 dark:text-slate-500">
                © 2026 KoriAI
              </span>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
