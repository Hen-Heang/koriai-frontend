import Link from "next/link"
import { ArrowRight, Cpu, GraduationCap, SpellCheck2, Target } from "lucide-react"

const CORRECTION_PROMPT =
  "/chat?prompt=" +
  encodeURIComponent("Please correct my Korean writing and explain each change in English.\n\nMy text:\n")

const actions = [
  {
    href: "/vocab",
    label: "Review vocab",
    description: "Clear due words with spaced repetition.",
    icon: Cpu,
  },
  {
    href: CORRECTION_PROMPT,
    label: "Ask AI",
    description: "Write Korean and get corrected.",
    icon: SpellCheck2,
  },
  {
    href: "/goals/create",
    label: "New goal",
    description: "Plan a goal and track it.",
    icon: Target,
  },
  {
    href: "/interview",
    label: "Exam Prep",
    description: "Practice interview questions.",
    icon: GraduationCap,
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-blue-500/40 dark:bg-slate-900/40"
        >
          <div className="inline-flex rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
            <action.icon size={20} strokeWidth={2} />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-foreground">{action.label}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{action.description}</p>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
            Start
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>
      ))}
    </div>
  )
}
