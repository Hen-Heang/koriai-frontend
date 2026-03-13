import Link from "next/link"
import {
  BookOpenCheck,
  BrainCircuit,
  Languages,
  MessageSquareText,
  NotebookPen,
  ShieldCheck,
} from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    title: "AI Korean chat",
    description:
      "Talk with a tutor that replies in Korean and surfaces corrections inline.",
    icon: MessageSquareText,
  },
  {
    title: "Sentence correction",
    description:
      "Rewrite awkward phrasing into clearer, more natural Korean with explanations.",
    icon: Languages,
  },
  {
    title: "Diary feedback",
    description:
      "Turn daily writing into a guided loop for grammar, tone, and vocabulary growth.",
    icon: NotebookPen,
  },
  {
    title: "Vocabulary review",
    description:
      "Save words from chats and practice them with lightweight repetition sessions.",
    icon: BookOpenCheck,
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(244,114,182,0.14),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef6ff_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.1),_transparent_26%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)]">
      <section className="mx-auto grid min-h-screen max-w-7xl gap-8 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:py-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10 lg:px-10">
        <div className="flex flex-col justify-center">
          <div className="mb-5 flex justify-end lg:justify-start">
            <ThemeToggle />
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/60 bg-white/80 px-3.5 py-2 text-xs text-emerald-800 shadow-sm backdrop-blur sm:px-4 sm:text-sm dark:border-emerald-500/30 dark:bg-slate-900/70 dark:text-emerald-200">
            <BrainCircuit size={20} strokeWidth={1.5} className="text-current" />
            Next.js frontend structure aligned to your Korean AI platform blueprint
          </div>
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 sm:text-5xl md:text-6xl lg:text-7xl">
            Build a Korean learning platform that feels like a real product, not
            a demo.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 dark:text-slate-300">
            This frontend now mirrors your planned route groups, feature
            modules, and reusable Next.js components so you can connect APIs
            later without rebuilding the app shell.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/login">Try auth flow</Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card
                  key={feature.title}
                  className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-lg shadow-slate-950/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/70 sm:rounded-[2rem]"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <span className="rounded-2xl bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        <Icon size={20} strokeWidth={1.5} className="text-current" />
                      </span>
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {feature.description}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <div className="flex items-center">
          <Card className="w-full rounded-[1.85rem] border-white/70 bg-slate-950 text-white shadow-2xl shadow-slate-950/20 dark:border-white/10 dark:bg-slate-900 sm:rounded-[2.25rem]">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <ShieldCheck
                  size={20}
                  strokeWidth={1.5}
                  className="text-emerald-300"
                />
                Frontend scope
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5 sm:space-y-5 sm:p-6">
              <div className="rounded-[1.5rem] bg-white/6 p-4 sm:rounded-3xl">
                <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">
                  Route groups
                </p>
                <p className="mt-2 text-lg text-white/90">
                  `/(auth)` and `/(main)` are now represented with dedicated
                  pages and shell layout.
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-white/6 p-4 sm:rounded-3xl">
                <p className="text-sm uppercase tracking-[0.2em] text-sky-200">
                  Feature modules
                </p>
                <p className="mt-2 text-lg text-white/90">
                  Chat, vocab, diary, dashboard, scenarios, hooks, and lib
                  stubs are all separated.
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-white/6 p-4 sm:rounded-3xl">
                <p className="text-sm uppercase tracking-[0.2em] text-amber-200">
                  Ready for backend
                </p>
                <p className="mt-2 text-lg text-white/90">
                  Axios client, auth config, React Query providers, and typed
                  models are prepared.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
