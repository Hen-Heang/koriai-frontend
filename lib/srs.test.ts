import { describe, expect, it } from "vitest"

import { formatInterval, previewIntervalDays } from "@/lib/srs"

const newCard = { easeFactor: 2.5, intervalDays: 0, repetitions: 0 }

describe("previewIntervalDays", () => {
  it("schedules a new card 1d on Good, 4d on Easy, today on Again", () => {
    expect(previewIntervalDays(newCard, "AGAIN")).toBe(0)
    expect(previewIntervalDays(newCard, "HARD")).toBe(1)
    expect(previewIntervalDays(newCard, "GOOD")).toBe(1)
    expect(previewIntervalDays(newCard, "EASY")).toBe(4)
  })

  it("uses the 3-day graduating step on the second Good", () => {
    const card = { easeFactor: 2.5, intervalDays: 1, repetitions: 1 }
    expect(previewIntervalDays(card, "GOOD")).toBe(3)
    expect(previewIntervalDays(card, "EASY")).toBe(7)
  })

  it("multiplies by ease for mature cards", () => {
    const card = { easeFactor: 2.5, intervalDays: 10, repetitions: 4 }
    expect(previewIntervalDays(card, "GOOD")).toBe(25) // 10 × 2.5
    expect(previewIntervalDays(card, "HARD")).toBe(12) // 10 × 1.2
    expect(previewIntervalDays(card, "EASY")).toBe(34) // 10 × 2.65 × 1.3, rounded
  })

  it("always grows the interval by at least one day on a pass", () => {
    const card = { easeFactor: 1.3, intervalDays: 1, repetitions: 5 }
    expect(previewIntervalDays(card, "GOOD")).toBeGreaterThan(1)
    expect(previewIntervalDays(card, "HARD")).toBeGreaterThan(1)
  })

  it("caps the interval at one year", () => {
    const card = { easeFactor: 2.5, intervalDays: 300, repetitions: 9 }
    expect(previewIntervalDays(card, "GOOD")).toBe(365)
  })

  it("treats corrupt ease values as the starting ease", () => {
    const card = { easeFactor: 0, intervalDays: 10, repetitions: 3 }
    expect(previewIntervalDays(card, "GOOD")).toBe(25)
  })
})

describe("formatInterval", () => {
  it("formats days, months, and years compactly", () => {
    expect(formatInterval(0)).toBe("Today")
    expect(formatInterval(1)).toBe("1d")
    expect(formatInterval(29)).toBe("29d")
    expect(formatInterval(30)).toBe("1mo")
    expect(formatInterval(75)).toBe("2.5mo")
    expect(formatInterval(365)).toBe("1y")
  })
})
