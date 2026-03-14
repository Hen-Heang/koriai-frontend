import { describe, expect, it } from "vitest"

import { assessSpeaking } from "./speaking"

describe("assessSpeaking", () => {
  it("returns a high score for a close transcript", () => {
    expect(assessSpeaking("안녕하세요 저는 학생이에요", "안녕하세요 저는 학생이에요").score).toBe(100)
  })

  it("reports missing words when the learner skips part of the sentence", () => {
    const result = assessSpeaking("오늘 카페에서 한국어를 연습했어요", "오늘 카페에서 연습했어요")
    expect(result.missingWords).toContain("한국어를")
    expect(result.score).toBeLessThan(100)
  })

  it("handles spacing differences better for Korean transcripts", () => {
    const result = assessSpeaking("아이스 아메리카노 한 잔 주세요", "아이스아메리카노 한잔 주세요")
    expect(result.score).toBeGreaterThanOrEqual(70)
  })
})
