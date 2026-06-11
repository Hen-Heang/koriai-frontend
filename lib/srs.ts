// Client-side mirror of the backend SM-2 scheduler (SrsScheduler.java).
// Used to preview the next interval on the grading buttons, Anki-style.
// Keep the rules in sync with the backend — it is the source of truth.

export type ReviewRating = "AGAIN" | "HARD" | "GOOD" | "EASY"

export const RATINGS: ReviewRating[] = ["AGAIN", "HARD", "GOOD", "EASY"]

const MIN_EASE = 1.3
const START_EASE = 2.5
const MAX_INTERVAL_DAYS = 365
const EASY_BONUS = 1.3

type SrsState = {
  easeFactor: number
  intervalDays: number
  repetitions: number
}

/** Days until the card would come back if graded with `rating` right now. */
export function previewIntervalDays(card: SrsState, rating: ReviewRating): number {
  const ease = card.easeFactor < MIN_EASE ? START_EASE : card.easeFactor
  const reps = Math.max(0, card.repetitions)
  const interval = Math.max(0, card.intervalDays)

  let next: number
  switch (rating) {
    case "AGAIN":
      next = 0
      break
    case "HARD":
      next = reps === 0 ? 1 : Math.max(interval + 1, Math.round(interval * 1.2))
      break
    case "GOOD":
      if (reps === 0) next = 1
      else if (reps === 1) next = 3
      else next = Math.max(interval + 1, Math.round(interval * ease))
      break
    case "EASY":
      if (reps === 0) next = 4
      else if (reps === 1) next = 7
      else next = Math.max(interval + 1, Math.round(interval * (ease + 0.15) * EASY_BONUS))
      break
  }
  return Math.min(next, MAX_INTERVAL_DAYS)
}

/** "Today", "3d", "2.5mo", "1y" — compact Anki-style interval labels. */
export function formatInterval(days: number): string {
  if (days <= 0) return "Today"
  if (days < 30) return `${days}d`
  if (days < 365) {
    const months = Math.round((days / 30) * 10) / 10
    return `${months % 1 === 0 ? months.toFixed(0) : months}mo`
  }
  const years = Math.round((days / 365) * 10) / 10
  return `${years % 1 === 0 ? years.toFixed(0) : years}y`
}
