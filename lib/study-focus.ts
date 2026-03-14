import type { DashboardStats } from "@/lib/types"

type StudyFocus = {
  badge: string
  title: string
  description: string
  ctaLabel: string
  ctaHref: string
}

export function getStudyFocus(stats: DashboardStats): StudyFocus {
  if (stats.dailyGoalProgress < 40) {
    return {
      badge: "Start strong",
      title: "Do one short Korean session now",
      description:
        "A 10-minute chat or correction session is the fastest way to protect your streak and get back into Korean mode.",
      ctaLabel: "Open chat tutor",
      ctaHref: "/chat",
    }
  }

  if (stats.wordsSaved < 15) {
    return {
      badge: "Grow your deck",
      title: "Save more words from real practice",
      description:
        "Your vocabulary deck is still light. Generate a themed set, then keep words you actually use in conversations and diary entries.",
      ctaLabel: "Build vocab deck",
      ctaHref: "/vocab",
    }
  }

  if (stats.correctionsThisWeek < 3) {
    return {
      badge: "Sharpen accuracy",
      title: "Run a writing correction today",
      description:
        "You have enough exposure. The next gain comes from fixing repeated grammar and phrasing mistakes in your own sentences.",
      ctaLabel: "Check my writing",
      ctaHref: "/correct",
    }
  }

  return {
    badge: "Keep momentum",
    title: "Turn today into output practice",
    description:
      "Your consistency looks solid. Write a short diary entry to turn passive understanding into active Korean production.",
    ctaLabel: "Write diary entry",
    ctaHref: "/diary",
  }
}
