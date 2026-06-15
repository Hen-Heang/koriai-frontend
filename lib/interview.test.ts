import { describe, expect, it } from "vitest"

import {
  buildAnswerMessage,
  buildInterviewSystemPrompt,
  buildScriptDocument,
  getInterviewTopic,
  INTERVIEW_TOPICS,
  parseExaminerTurn,
} from "./interview"

describe("getInterviewTopic", () => {
  it("returns the matching topic", () => {
    expect(getInterviewTopic("weather").id).toBe("weather")
  })

  it("falls back to the first topic for an unknown id", () => {
    expect(getInterviewTopic("nope").id).toBe(INTERVIEW_TOPICS[0].id)
  })

  it("offers only the chosen weather topic", () => {
    expect(INTERVIEW_TOPICS).toHaveLength(1)
    expect(INTERVIEW_TOPICS[0].id).toBe("weather")
  })
})

describe("weather topic prep", () => {
  it("ships curated vocabulary, phrases, and sample questions", () => {
    const weather = getInterviewTopic("weather")
    expect(weather.recommended).toBe(true)
    expect(weather.prep).toBeDefined()
    expect(weather.prep!.vocabulary.length).toBeGreaterThanOrEqual(15)
    expect(weather.prep!.keyPhrases.length).toBeGreaterThan(0)
    expect(weather.prep!.sampleQuestions.length).toBeGreaterThan(0)
    // Every phrase/question carries both Korean and English.
    for (const entry of [
      ...weather.prep!.keyPhrases,
      ...weather.prep!.sampleQuestions,
    ]) {
      expect(entry.ko.trim()).not.toBe("")
      expect(entry.en.trim()).not.toBe("")
    }
  })
})

describe("weather topic script outline", () => {
  it("ships an ordered script outline", () => {
    const outline = getInterviewTopic("weather").scriptOutline
    expect(outline).toBeDefined()
    expect(outline!.length).toBeGreaterThanOrEqual(5)
    expect(outline![0].id).toBe("intro")
  })
})

describe("buildScriptDocument", () => {
  const weather = getInterviewTopic("weather")

  it("assembles filled sections with headings and skips empties", () => {
    const doc = buildScriptDocument(weather, {
      intro: "안녕하세요. 저는 헨입니다.",
      "korea-summer": "한국 여름은 덥고 습해요.",
      compare: "   ", // whitespace-only is skipped
    })
    expect(doc).toContain(weather.labelKo)
    expect(doc).toContain("인사 및 주제 소개")
    expect(doc).toContain("안녕하세요. 저는 헨입니다.")
    expect(doc).toContain("한국 여름은 덥고 습해요.")
    expect(doc).not.toContain("캄보디아 날씨와 비교")
  })

  it("returns just the title when nothing is written", () => {
    expect(buildScriptDocument(weather, {})).toBe(weather.labelKo)
  })
})

describe("buildInterviewSystemPrompt", () => {
  it("embeds the topic and the response-format tags", () => {
    const prompt = buildInterviewSystemPrompt(getInterviewTopic("weather"))
    expect(prompt).toContain("한국 여름 날씨")
    expect(prompt).toContain("[QUESTION_KO]")
    expect(prompt).toContain("[QUESTION_EN]")
    expect(prompt).toContain("[FEEDBACK]")
  })
})

describe("parseExaminerTurn", () => {
  it("splits a well-formed reply into sections", () => {
    const raw = [
      "[FEEDBACK]",
      "Good vocabulary, but try to speak with more confidence.",
      "[QUESTION_KO]",
      "한국 여름 날씨는 어때요?",
      "[QUESTION_EN]",
      "How is the summer weather in Korea?",
    ].join("\n")

    const turn = parseExaminerTurn(raw)
    expect(turn.feedback).toBe(
      "Good vocabulary, but try to speak with more confidence."
    )
    expect(turn.questionKo).toBe("한국 여름 날씨는 어때요?")
    expect(turn.questionEn).toBe("How is the summer weather in Korea?")
  })

  it("handles a missing feedback section", () => {
    const raw = "[QUESTION_KO]\n안녕하세요?\n[QUESTION_EN]\nHello?"
    const turn = parseExaminerTurn(raw)
    expect(turn.feedback).toBe("")
    expect(turn.questionKo).toBe("안녕하세요?")
    expect(turn.questionEn).toBe("Hello?")
  })

  it("falls back to treating unformatted text as the question", () => {
    const turn = parseExaminerTurn("한국 음식을 좋아하세요?")
    expect(turn.questionKo).toBe("한국 음식을 좋아하세요?")
    expect(turn.feedback).toBe("")
    expect(turn.questionEn).toBe("")
  })
})

describe("buildAnswerMessage", () => {
  it("wraps the answer and keeps the examiner on-format", () => {
    const message = buildAnswerMessage("  저는 더위를 안 좋아해요  ")
    expect(message).toContain("저는 더위를 안 좋아해요")
    expect(message).toContain("required format")
  })
})
