// Types, categories, and reading progress.
// Reading UNITS now live in Postgres (see lib/reading-store.ts) — this file only
// keeps the shapes, the category metadata, a couple of pure helpers, and the
// per-unit progress that is still tracked locally in the browser.
// Relative imports only so vitest (no path-alias setup) can resolve this file.
import type { QuizQuestion } from "./types"

export type ReadingCategory = "DAILY_LIFE" | "CULTURE" | "BEGINNER_STORY"

export interface ReadingParagraph {
  korean: string
  english: string
}

export interface ReadingVocab {
  term: string
  meaning: string
  example?: string
}

export interface ReadingUnit {
  id: string
  episode?: string
  title: string
  titleEnglish: string
  category: ReadingCategory
  level: "Beginner" | "Intermediate"
  summary: string
  source: string
  grammarNote?: {
    pattern: string
    explanation: string
  }
  paragraphs: ReadingParagraph[]
  vocab: ReadingVocab[]
  quiz: QuizQuestion[]
}

export const READING_CATEGORIES: Record<
  ReadingCategory,
  { label: string; description: string }
> = {
  DAILY_LIFE: {
    label: "Daily Life",
    description: "Podcast transcripts about everyday life in Korea",
  },
  CULTURE: {
    label: "Culture & Etiquette",
    description: "Short articles about Korean culture and customs",
  },
  BEGINNER_STORY: {
    label: "Beginner Stories",
    description: "Super-simple stories with one grammar point each",
  },
}

// ── Pure helpers (kept for unit tests / id generation) ──

export type StoredUnitMap = Record<string, ReadingUnit | null>

/**
 * Merge built-in units with a stored override map.
 * A stored entry overrides the built-in with the same id; `null` hides a built-in.
 */
export function mergeReadingUnits(
  builtins: ReadingUnit[],
  stored: StoredUnitMap
): ReadingUnit[] {
  const merged: ReadingUnit[] = []
  for (const unit of builtins) {
    const entry = stored[unit.id]
    if (entry === null) continue
    merged.push(entry ?? unit)
  }
  for (const [id, entry] of Object.entries(stored)) {
    if (!entry) continue
    if (builtins.some((u) => u.id === id)) continue
    merged.push(entry)
  }
  return merged
}

export function createReadingUnitId(title: string, existingIds?: Set<string>): string {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/(^-+|-+$)/g, "") || "unit"
  const taken = existingIds ?? new Set<string>()
  if (!taken.has(base)) return base
  let suffix = 2
  while (taken.has(`${base}-${suffix}`)) suffix++
  return `${base}-${suffix}`
}

// ── Progress (localStorage until backend persistence exists) ──

export type ReadingStatus = "not_started" | "in_progress" | "completed"

export interface ReadingProgressEntry {
  status: ReadingStatus
  quizScore?: number
  quizTotal?: number
  completedAt?: string
}

const STORAGE_KEY = "koriai-reading-progress"
const EMPTY_PROGRESS: Record<string, ReadingProgressEntry> = {}

let snapshot: Record<string, ReadingProgressEntry> | null = null
const listeners = new Set<() => void>()

function readFromStorage(): Record<string, ReadingProgressEntry> {
  if (typeof window === "undefined") return EMPTY_PROGRESS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : EMPTY_PROGRESS
  } catch {
    return EMPTY_PROGRESS
  }
}

// External-store API for useSyncExternalStore
export function subscribeReadingProgress(callback: () => void) {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

export function getReadingProgress(): Record<string, ReadingProgressEntry> {
  if (snapshot === null) snapshot = readFromStorage()
  return snapshot
}

export function getReadingProgressServerSnapshot(): Record<string, ReadingProgressEntry> {
  return EMPTY_PROGRESS
}

function saveReadingProgress(progress: Record<string, ReadingProgressEntry>) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  snapshot = null
  listeners.forEach((listener) => listener())
}

export function getUnitProgress(unitId: string): ReadingProgressEntry {
  return getReadingProgress()[unitId] ?? { status: "not_started" }
}

export function markUnitStarted(unitId: string) {
  const current = getReadingProgress()
  if (current[unitId]?.status === "completed" || current[unitId]?.status === "in_progress") return
  const progress = { ...current }
  progress[unitId] = { ...progress[unitId], status: "in_progress" }
  saveReadingProgress(progress)
}

export function markUnitCompleted(unitId: string) {
  const progress = { ...getReadingProgress() }
  progress[unitId] = {
    ...progress[unitId],
    status: "completed",
    completedAt: new Date().toISOString(),
  }
  saveReadingProgress(progress)
}

export function markUnitQuizResult(unitId: string, score: number, total: number) {
  const progress = { ...getReadingProgress() }
  const passed = score >= Math.ceil(total * 0.6)
  progress[unitId] = {
    ...progress[unitId],
    status: passed ? "completed" : "in_progress",
    quizScore: score,
    quizTotal: total,
    ...(passed ? { completedAt: new Date().toISOString() } : {}),
  }
  saveReadingProgress(progress)
  return passed
}

/** Drop the locally-stored progress for a unit (used when the unit is deleted). */
export function removeUnitProgress(unitId: string) {
  const current = getReadingProgress()
  if (!current[unitId]) return
  const progress = { ...current }
  delete progress[unitId]
  saveReadingProgress(progress)
}
