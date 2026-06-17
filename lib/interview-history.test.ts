import { describe, expect, it } from "vitest"

import { appendScorecard, computeOverall } from "./interview-history"
import type { InterviewEvaluation } from "./interview"

const evalWith = (scores: [string, number][]): InterviewEvaluation => ({
  scores: scores.map(([label, score]) => ({ label, score, max: 5 })),
  summary: "",
  advice: [],
})

describe("computeOverall", () => {
  it("averages the criteria on a 0–5 scale", () => {
    expect(computeOverall([
      { label: "Speaking", score: 4, max: 5 },
      { label: "Pronunciation", score: 3, max: 5 },
      { label: "Vocabulary", score: 5, max: 5 },
      { label: "Confidence", score: 4, max: 5 },
    ])).toBe(4) // (4+3+5+4)/4
  })

  it("normalises mixed maxes before averaging", () => {
    // 2/4 -> 2.5/5, and 5/5 -> 5/5 ; average = 3.75
    expect(computeOverall([
      { label: "A", score: 2, max: 4 },
      { label: "B", score: 5, max: 5 },
    ])).toBe(3.8) // 3.75 rounded to 1 dp
  })

  it("returns 0 for no scores", () => {
    expect(computeOverall([])).toBe(0)
  })
})

describe("appendScorecard", () => {
  it("appends a dated record with the computed overall", () => {
    const now = new Date("2026-07-01T10:00:00Z")
    const next = appendScorecard([], evalWith([["Speaking", 4], ["Confidence", 4]]), now)
    expect(next).toHaveLength(1)
    expect(next[0]).toMatchObject({ overall: 4, date: now.toISOString() })
    expect(next[0].scores).toHaveLength(2)
  })

  it("ignores an evaluation with no scores", () => {
    const history = appendScorecard([], evalWith([["Speaking", 4]]))
    expect(appendScorecard(history, evalWith([]))).toBe(history)
  })

  it("caps history to the 50 most recent", () => {
    let history = appendScorecard([], evalWith([["Speaking", 3]]))
    for (let i = 0; i < 60; i++) {
      history = appendScorecard(history, evalWith([["Speaking", 4]]))
    }
    expect(history).toHaveLength(50)
    // The oldest (the first 3/5) has been dropped.
    expect(history.every((r) => r.overall === 4)).toBe(true)
  })
})
