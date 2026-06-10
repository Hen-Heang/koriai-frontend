"use client"

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
  Zap,
  CheckCircle2,
} from "lucide-react"
import { motion } from "motion/react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

const features = [
  {
    title: "AI Workplace Coach",
    description: "Ask \"How do Korean developers say this?\" and get real workplace phrases with grammar and politeness explained.",
    icon: MessageSquareText,
    color: "from-emerald-500/20 to-teal-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-500/15",
  },
  {
    title: "Meeting Simulator",
    description: "Practice daily standups, code reviews, and sprint planning with an AI that plays your Korean team lead.",
    icon: Languages,
    color: "from-sky-500/20 to-blue-500/10",
    iconColor: "text-sky-600 dark:text-sky-400",
    iconBg: "bg-sky-100 dark:bg-sky-500/15",
  },
  {
    title: "Message Generator",
    description: "Type your intent in English and get multiple natural Korean variations with formality levels explained.",
    icon: NotebookPen,
    color: "from-violet-500/20 to-purple-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
    iconBg: "bg-violet-100 dark:bg-violet-500/15",
  },
  {
    title: "Developer Vocabulary",
    description: "Master 배포, 서버, API, and 400+ IT terms with spaced repetition and Khmer/English translations.",
    icon: BookOpenCheck,
    color: "from-amber-500/20 to-orange-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-500/15",
  },
]

const chatMessages = [
  { role: "you", text: "How do I say \"I finished the deployment\" in Korean?" },
  {
    role: "ai",
    text: "배포 완료했습니다 ✓ — Natural & professional. 배포 = deployment, 완료 = completed.",
  },
  { role: "you", text: "More formal for team lead?" },
  {
    role: "ai",
    text: "배포 완료하였습니다 — Use with 팀장님. Sounds polished and respectful in standups.",
  },
]

const statsData = [
  { value: "400+", label: "IT vocab terms" },
  { value: "12", label: "Learning modules" },
  { value: "20+", label: "Countries" },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
} as const

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground selection:bg-emerald-500/30">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-32 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-radial from-emerald-300/20 via-teal-200/5 to-transparent blur-3xl dark:from-emerald-600/15 dark:via-teal-500/5" />
        <div className="absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-gradient-radial from-sky-300/15 via-blue-200/5 to-transparent blur-3xl dark:from-sky-600/10 dark:via-blue-500/5" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[500px] rounded-full bg-gradient-radial from-violet-300/10 to-transparent blur-3xl dark:from-violet-600/5" />
      </div>

      <div className="relative z-10">
        {/* Navbar */}
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/60 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
            <Link href="/" className="group flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Image
                  src="/koriai-logo.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="invert brightness-0"
                />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                KoriAI
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="hidden h-6 w-px bg-border/60 sm:block mx-2" />
              <Button asChild size="sm" variant="ghost" className="hidden font-medium text-muted-foreground hover:text-foreground sm:inline-flex">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full bg-emerald-600 px-5 font-bold text-white hover:bg-emerald-500 shadow-md">
                <Link href="/register">Get started</Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
              {/* Left — copy */}
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="flex flex-col"
              >
                <motion.div variants={itemVariants} className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                  <BrainCircuit size={14} strokeWidth={2.5} />
                  For Foreign Engineers in Korea
                </motion.div>

                <motion.h1 variants={itemVariants} className="mt-6 text-[2.8rem] font-black leading-[1.08] tracking-tight text-foreground sm:text-[4.2rem]">
                  Stop freezing up in{" "}
                  <span className="relative inline-block">
                    <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 bg-clip-text text-transparent">
                      Korean standups.
                    </span>
                    <motion.span
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.8, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute -bottom-1 left-0 right-0 h-[3px] origin-left rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 opacity-60"
                    />
                  </span>
                </motion.h1>

                <motion.p variants={itemVariants} className="mt-7 text-lg leading-relaxed text-muted-foreground sm:text-xl sm:leading-relaxed max-w-[520px]">
                  KoriAI teaches you workplace Korean the way your team actually speaks it — from{" "}
                  <span className="font-semibold text-foreground/80">daily standups</span> and{" "}
                  <span className="font-semibold text-foreground/80">Slack messages</span> to{" "}
                  <span className="font-semibold text-foreground/80">code review phrases</span>.
                </motion.p>

                <motion.div variants={itemVariants} className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="h-14 rounded-2xl bg-emerald-600 px-8 text-base font-bold text-white shadow-xl shadow-emerald-500/25 transition-all hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Link href="/register">
                      Start learning — it&apos;s free
                      <ArrowRight size={18} className="ml-2" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-14 rounded-2xl border-border bg-background/50 px-8 text-base font-medium backdrop-blur-sm transition-all hover:bg-accent hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Link href="/dashboard">See the dashboard</Link>
                  </Button>
                </motion.div>

                {/* Stats row */}
                <motion.div variants={itemVariants} className="mt-10 flex items-center gap-6 sm:gap-8">
                  {statsData.map((stat, i) => (
                    <div key={stat.label} className="flex items-center gap-4">
                      {i > 0 && <div className="h-8 w-px bg-border/60" />}
                      <div>
                        <p className="text-2xl font-black leading-none text-foreground">{stat.value}</p>
                        <p className="mt-1 text-xs font-medium text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>

                {/* Trust signals */}
                <motion.div variants={itemVariants} className="mt-8 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {["🇰🇭", "🇻🇳", "🇮🇩", "🇵🇭"].map((flag, i) => (
                      <div key={i} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-accent text-sm shadow-sm">
                        {flag}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">Engineers from 20+ countries</span> mastering workplace Korean
                  </p>
                </motion.div>
              </motion.div>

              {/* Right — chat preview */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                className="relative"
              >
                {/* Glow */}
                <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-sky-500/20 blur-3xl" />

                {/* Floating vocab chip */}
                <motion.div
                  initial={{ opacity: 0, x: 30, y: -10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.1 }}
                  className="absolute -right-4 top-16 z-10 hidden rounded-2xl border border-border bg-background px-4 py-2.5 shadow-xl lg:flex items-center gap-2.5"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                    <BookOpenCheck size={14} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-foreground">배포</p>
                    <p className="text-[10px] text-muted-foreground">deployment</p>
                  </div>
                  <div className="ml-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">+2 XP</div>
                </motion.div>

                {/* Floating streak chip */}
                <motion.div
                  initial={{ opacity: 0, x: -30, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.3 }}
                  className="absolute -left-4 bottom-24 z-10 hidden rounded-2xl border border-border bg-background px-4 py-2.5 shadow-xl lg:flex items-center gap-2.5"
                >
                  <div className="text-lg">🔥</div>
                  <div>
                    <p className="text-[11px] font-bold text-foreground">7-day streak</p>
                    <p className="text-[10px] text-muted-foreground">Keep it up!</p>
                  </div>
                </motion.div>

                {/* Phone frame mockup */}
                <div className="relative mx-auto w-full max-w-[360px]">
                  <div className="relative overflow-hidden rounded-[3rem] border-[8px] border-slate-900 bg-background shadow-2xl dark:border-slate-800">
                    {/* Notch */}
                    <div className="absolute left-1/2 top-0 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-slate-900 dark:bg-slate-800" />

                    <div className="flex h-[640px] flex-col">
                      {/* App header */}
                      <div className="flex items-center justify-between border-b border-border/50 bg-background/80 px-6 pb-4 pt-10 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                            <Sparkles size={16} className="text-white" strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="text-[13px] font-bold leading-none text-foreground">AI Coach</p>
                            <p className="mt-1 text-[10px] font-medium text-emerald-500">● Online now</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1">
                          <span className="text-[11px]">🔥</span>
                          <span className="text-[11px] font-bold text-amber-600">7</span>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 space-y-3.5 overflow-y-auto p-5 pb-3">
                        {chatMessages.map((msg, i) => (
                          <div
                            key={i}
                            className={`flex ${msg.role === "you" ? "justify-end" : "justify-start"}`}
                          >
                            {msg.role === "ai" && (
                              <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                                <Sparkles size={12} />
                              </div>
                            )}
                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-3 text-[12.5px] leading-relaxed shadow-sm ${
                                msg.role === "you"
                                  ? "rounded-tr-sm bg-emerald-600 font-medium text-white"
                                  : "rounded-tl-sm border border-border bg-accent/30 text-foreground"
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        ))}

                        {/* Animated typing */}
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                            <Sparkles size={12} />
                          </div>
                          <div className="flex gap-1 rounded-2xl rounded-tl-sm border border-border bg-accent/30 px-4 py-3.5">
                            {[0, 1, 2].map((j) => (
                              <motion.span
                                key={j}
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: j * 0.15 }}
                                className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Quick phrase chips */}
                      <div className="flex gap-2 overflow-x-auto px-5 pb-2 no-scrollbar">
                        {["오늘 배포했어요", "회의 중입니다", "잠깐만요"].map((phrase) => (
                          <div key={phrase} className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                            {phrase}
                          </div>
                        ))}
                      </div>

                      {/* Input bar */}
                      <div className="border-t border-border/50 bg-background/80 p-4 pt-3 backdrop-blur-md">
                        <div className="flex items-center gap-3 rounded-2xl border border-border bg-accent/30 px-4 py-3">
                          <span className="flex-1 text-[13px] text-muted-foreground font-medium">
                            Ask in English...
                          </span>
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
                            <Send size={14} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="relative px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-16 text-center"
            >
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
                Core Capabilities
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                Everything you need to <span className="text-muted-foreground/40 italic font-medium">thrive</span> in a Korean tech team.
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                12 learning modules designed around the real challenges foreign engineers face in Korean workplaces — from daily standups to deployment discussions.
              </p>
            </motion.div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, i) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="group relative h-full overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-sm transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/10 dark:bg-slate-900/40"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
                    <div className="relative">
                      <div className={`inline-flex rounded-2xl ${feature.iconBg} p-4 shadow-sm ring-1 ring-border/50 group-hover:scale-110 transition-transform duration-500`}>
                        <Icon size={24} strokeWidth={2} className={feature.iconColor} />
                      </div>
                      <h3 className="mt-6 text-xl font-bold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                      <div className="mt-6 flex items-center gap-2 text-sm font-bold text-foreground/40 group-hover:text-foreground transition-colors">
                        Learn more <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="border-y border-border/40 bg-accent/10 px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                  Built for the serious learner.
                </h2>
                <div className="space-y-6">
                  {[
                    { title: "Workplace Phrase Analyzer", desc: "Paste any Slack or KakaoTalk message and get full context: politeness level, business meaning, and suggested replies." },
                    { title: "Developer Vocabulary SRS", desc: "배포, API, 오류 and 400+ IT terms with Khmer/English translations, spaced repetition, and audio." },
                    { title: "Listening & Speaking Practice", desc: "AI-generated standup and code review audio with quizzes, plus voice scoring for pronunciation accuracy." },
                  ].map((benefit) => (
                    <div key={benefit.title} className="flex gap-4">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mt-1">
                        <CheckCircle2 size={16} strokeWidth={3} />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">{benefit.title}</h4>
                        <p className="mt-1 text-sm text-muted-foreground">{benefit.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative aspect-video overflow-hidden rounded-3xl border border-border shadow-2xl"
              >
                <div className="absolute inset-0 bg-emerald-600/5 backdrop-blur-sm flex items-center justify-center">
                   <div className="text-center p-8">
                      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-xl mb-4 text-emerald-600">
                        <Zap size={32} fill="currentColor" />
                      </div>
                      <p className="text-lg font-bold text-foreground">Interactive Demo Coming Soon</p>
                      <p className="mt-2 text-sm text-muted-foreground">Join engineers from Cambodia, Vietnam, and 20+ countries mastering workplace Korean.</p>
                   </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-12 text-center shadow-2xl dark:bg-slate-900/80 dark:border dark:border-white/5 sm:p-20"
            >
              {/* Decorative blobs */}
              <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-[80px]" />
              <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-sky-500/20 blur-[80px]" />

              <div className="relative z-10">
                <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                  Ready to survive your next standup?
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400">
                  Stop struggling in meetings. KoriAI gives you the workplace Korean you need to communicate confidently with your Korean team — starting today.
                </p>
                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="h-14 rounded-2xl bg-white px-10 text-base font-bold text-slate-900 transition-all hover:bg-slate-100 hover:scale-105 active:scale-95 shadow-xl"
                  >
                    <Link href="/register">Create free account</Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="ghost"
                    className="h-14 rounded-2xl px-10 text-base font-bold text-white transition-all hover:bg-white/10 hover:scale-105 active:scale-95"
                  >
                    <Link href="/login">Sign in</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/40 bg-background/50 px-4 py-12 backdrop-blur-sm sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-md">
                  <Image src="/koriai-logo.svg" alt="" width={18} height={18} className="invert brightness-0" />
                </div>
                <span className="text-sm font-bold tracking-tight text-foreground">
                  KoriAI
                </span>
                <span className="text-xs text-muted-foreground ml-4">
                  © 2026 KoriAI. All rights reserved.
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
                <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
                <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
                <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
