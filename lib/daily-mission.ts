// Tracks the one mission step that has no backend completion signal yet
// (practicing today's scenario in AI Coach). Vocab/mistakes/phrase use real
// data instead — see usage in app/(main)/practice/page.tsx.
const STORAGE_KEY = "hengo:mission:scenario"

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function isScenarioDoneToday(): boolean {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(STORAGE_KEY) === todayKey()
}

export function markScenarioDoneToday() {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, todayKey())
}
