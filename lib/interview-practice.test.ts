import { describe, expect, it } from "vitest"

import {
  averageScore,
  computeNextProgress,
  focusScore,
  mostDifficultQuestions,
  selectFocusQueue,
  versionsToDeactivate,
  type QuestionBankItem,
  type QuestionProgress,
} from "./interview-practice"

function question(overrides: Partial<QuestionBankItem>): QuestionBankItem {
  return {
    id: "q1",
    questionKo: "질문",
    questionEn: "Question",
    sampleAnswerKo: null,
    sampleAnswerEn: null,
    category: "korean_summer",
    difficulty: "normal",
    priority: "recommended",
    keywords: [],
    displayOrder: 0,
    ownedByUser: false,
    ...overrides,
  }
}

function progress(overrides: Partial<QuestionProgress>): QuestionProgress {
  return {
    questionId: "q1",
    timesPracticed: 1,
    avgScore: 3,
    lastScore: 3,
    lastPracticedAt: new Date().toISOString(),
    status: "practicing",
    ...overrides,
  }
}

describe("averageScore", () => {
  it("averages every numeric value", () => {
    expect(averageScore({ a: 4, b: 2 })).toBe(3)
  })

  it("returns 0 for an empty scores object", () => {
    expect(averageScore({})).toBe(0)
  })
})

describe("computeNextProgress", () => {
  it("starts a brand-new question at timesPracticed 1", () => {
    const next = computeNextProgress(null, 4)
    expect(next.timesPracticed).toBe(1)
    expect(next.avgScore).toBe(4)
    expect(next.status).toBe("practicing")
  })

  it("averages incrementally across repeated practice", () => {
    const first = computeNextProgress(null, 2)
    const second = computeNextProgress(first, 4)
    expect(second.timesPracticed).toBe(2)
    expect(second.avgScore).toBe(3)
  })

  it("derives 'strong' once average score is high enough", () => {
    const next = computeNextProgress({ timesPracticed: 3, avgScore: 4.5 }, 4.5)
    expect(next.status).toBe("strong")
  })

  it("derives 'improving' after enough attempts at a solid but not top score", () => {
    const next = computeNextProgress({ timesPracticed: 1, avgScore: 3.6 }, 3.8)
    expect(next.status).toBe("improving")
  })
})

describe("focusScore", () => {
  it("ranks never-practiced questions above any practiced one", () => {
    const neverPracticed = focusScore(question({ priority: "optional" }), null)
    const practicedHighScore = focusScore(
      question({ priority: "must_practice" }),
      progress({ avgScore: 5, timesPracticed: 5 }),
    )
    expect(neverPracticed).toBeGreaterThan(practicedHighScore)
  })

  it("ranks lower average scores as more urgent", () => {
    const weak = focusScore(question({}), progress({ avgScore: 2 }))
    const strong = focusScore(question({}), progress({ avgScore: 4.5 }))
    expect(weak).toBeGreaterThan(strong)
  })

  it("uses priority as a tiebreaker for equal scores", () => {
    const mustPractice = focusScore(
      question({ priority: "must_practice" }),
      progress({ avgScore: 3, lastPracticedAt: null }),
    )
    const optional = focusScore(
      question({ priority: "optional" }),
      progress({ avgScore: 3, lastPracticedAt: null }),
    )
    expect(mustPractice).toBeGreaterThan(optional)
  })
})

describe("selectFocusQueue", () => {
  it("returns an empty queue for an empty bank", () => {
    expect(selectFocusQueue([], {}, 5)).toEqual([])
  })

  it("puts never-practiced questions first, deterministically", () => {
    const questions = [
      question({ id: "practiced-well", displayOrder: 0 }),
      question({ id: "never-practiced", displayOrder: 1 }),
    ]
    const progressMap: Record<string, QuestionProgress> = {
      "practiced-well": progress({ questionId: "practiced-well", avgScore: 5, timesPracticed: 5 }),
    }
    const queue = selectFocusQueue(questions, progressMap, 2)
    expect(queue[0].id).toBe("never-practiced")
  })

  it("is stable across repeated calls with the same input (no randomness)", () => {
    const questions = [
      question({ id: "a", displayOrder: 0 }),
      question({ id: "b", displayOrder: 1 }),
      question({ id: "c", displayOrder: 2 }),
    ]
    const first = selectFocusQueue(questions, {}, 3).map((q) => q.id)
    const second = selectFocusQueue(questions, {}, 3).map((q) => q.id)
    expect(first).toEqual(second)
  })

  it("caps results to the requested size", () => {
    const questions = [question({ id: "a" }), question({ id: "b" }), question({ id: "c" })]
    expect(selectFocusQueue(questions, {}, 1)).toHaveLength(1)
  })
})

describe("mostDifficultQuestions", () => {
  it("excludes questions that have never been practiced", () => {
    const questions = [question({ id: "a" }), question({ id: "b" })]
    const result = mostDifficultQuestions(questions, {
      a: progress({ questionId: "a", avgScore: 2, timesPracticed: 2 }),
    }, 5)
    expect(result.map((q) => q.id)).toEqual(["a"])
  })

  it("sorts lowest average score first", () => {
    const questions = [question({ id: "a" }), question({ id: "b" })]
    const result = mostDifficultQuestions(
      questions,
      {
        a: progress({ questionId: "a", avgScore: 4, timesPracticed: 3 }),
        b: progress({ questionId: "b", avgScore: 2, timesPracticed: 3 }),
      },
      5,
    )
    expect(result.map((q) => q.id)).toEqual(["b", "a"])
  })

  it("returns an empty list when nothing has been practiced yet", () => {
    expect(mostDifficultQuestions([question({})], {}, 5)).toEqual([])
  })
})

describe("versionsToDeactivate", () => {
  it("returns the other active version's id when activating a new one", () => {
    const versions = [
      { id: "v1", isActive: true },
      { id: "v2", isActive: false },
    ]
    expect(versionsToDeactivate(versions, "v2")).toEqual(["v1"])
  })

  it("returns an empty list when nothing else is active", () => {
    const versions = [{ id: "v1", isActive: false }]
    expect(versionsToDeactivate(versions, "v1")).toEqual([])
  })

  it("does not deactivate the version being activated even if already active", () => {
    const versions = [{ id: "v1", isActive: true }]
    expect(versionsToDeactivate(versions, "v1")).toEqual([])
  })
})
