// Relative imports so vitest (which has no config / path-alias setup) can resolve them
import { READING_UNITS } from "./reading-data"
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

// ── User-managed units: add / update / delete / get ──
// Stored in localStorage and merged over the built-in units.
// A stored entry overrides the built-in with the same id; `null` hides a built-in.

export type StoredUnitMap = Record<string, ReadingUnit | null>

const UNITS_KEY = "koriai-reading-units"

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

let unitsSnapshot: ReadingUnit[] | null = null
const unitListeners = new Set<() => void>()

function readStoredUnits(): StoredUnitMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(UNITS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeStoredUnits(map: StoredUnitMap) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(UNITS_KEY, JSON.stringify(map))
  unitsSnapshot = null
  unitListeners.forEach((listener) => listener())
}

export function subscribeReadingUnits(callback: () => void) {
  unitListeners.add(callback)
  return () => {
    unitListeners.delete(callback)
  }
}

export function getAllReadingUnits(): ReadingUnit[] {
  if (unitsSnapshot === null) {
    unitsSnapshot = mergeReadingUnits(READING_UNITS, readStoredUnits())
  }
  return unitsSnapshot
}

export function getReadingUnitsServerSnapshot(): ReadingUnit[] {
  return READING_UNITS
}

export function getReadingUnit(unitId: string): ReadingUnit | undefined {
  return getAllReadingUnits().find((u) => u.id === unitId)
}

export function isBuiltinReadingUnit(unitId: string): boolean {
  return READING_UNITS.some((u) => u.id === unitId)
}

export function upsertReadingUnit(unit: ReadingUnit) {
  writeStoredUnits({ ...readStoredUnits(), [unit.id]: unit })
}

export function deleteReadingUnit(unitId: string) {
  const map = { ...readStoredUnits() }
  if (isBuiltinReadingUnit(unitId)) {
    map[unitId] = null
  } else {
    delete map[unitId]
  }
  writeStoredUnits(map)

  const progress = { ...getReadingProgress() }
  if (progress[unitId]) {
    delete progress[unitId]
    saveReadingProgress(progress)
  }
}

export function createReadingUnitId(title: string, existingIds?: Set<string>): string {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/(^-+|-+$)/g, "") || "unit"
  const taken =
    existingIds ??
    new Set([...READING_UNITS.map((u) => u.id), ...Object.keys(readStoredUnits())])
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
