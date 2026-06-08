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
    // Originally pointed to "/correct" (now hidden); repointed to chat tutor.
    return {
      badge: "Sharpen accuracy",
      title: "Get feedback on your own sentences",
      description:
        "You have enough exposure. The next gain comes from producing your own Korean and letting the tutor fix repeated grammar and phrasing mistakes.",
      ctaLabel: "Open chat tutor",
      ctaHref: "/chat",
    }
  }

  // Originally pointed to "/diary" (now hidden); repointed to message generator.
  return {
    badge: "Keep momentum",
    title: "Turn today into output practice",
    description:
      "Your consistency looks solid. Draft a workplace message to turn passive understanding into active Korean production.",
    ctaLabel: "Generate a message",
    ctaHref: "/generator",
  }
}
