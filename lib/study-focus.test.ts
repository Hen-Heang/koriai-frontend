import { describe, expect, it } from "vitest"

import { getStudyFocus } from "./study-focus"

describe("getStudyFocus", () => {
  it("prioritizes daily momentum when the goal progress is low", () => {
    expect(
      getStudyFocus({
        streakDays: 2,
        weeklyMinutes: 25,
        wordsSaved: 20,
        correctionsThisWeek: 5,
        dailyGoalProgress: 15,
      })
    ).toMatchObject({
      ctaHref: "/chat",
      badge: "Start strong",
    })
  })

  it("recommends vocabulary work when the deck is still small", () => {
    expect(
      getStudyFocus({
        streakDays: 7,
        weeklyMinutes: 80,
        wordsSaved: 6,
        correctionsThisWeek: 5,
        dailyGoalProgress: 70,
      })
    ).toMatchObject({
      ctaHref: "/vocab",
      badge: "Grow your deck",
    })
  })

  it("falls back to diary practice when the learner is already on track", () => {
    expect(
      getStudyFocus({
        streakDays: 10,
        weeklyMinutes: 120,
        wordsSaved: 30,
        correctionsThisWeek: 4,
        dailyGoalProgress: 80,
      })
    ).toMatchObject({
      ctaHref: "/diary",
      badge: "Keep momentum",
    })
  })
})
