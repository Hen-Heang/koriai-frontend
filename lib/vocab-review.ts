import type { VocabItem } from "./types"

export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function normalizeAnswer(text: string): string {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[.,!?~…·。、'’"“”()[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Lenient comparison for typed recall answers: Unicode-normalized,
 * case/whitespace/punctuation-insensitive. A term like "출시(하다)" accepts
 * both "출시하다" and "출시".
 */
export function isCorrectTerm(input: string, term: string): boolean {
  const answer = normalizeAnswer(input)
  if (!answer) return false
  const variants = new Set([
    normalizeAnswer(term),
    normalizeAnswer(term.replace(/\([^)]*\)/g, "")),
  ])
  return variants.has(answer)
}

export type MasteryFilter = "all" | "weak" | "learning" | "mastered"

export function matchesMastery(mastery: number, filter: MasteryFilter): boolean {
  switch (filter) {
    case "weak":
      return mastery < 50
    case "learning":
      return mastery >= 50 && mastery < 80
    case "mastered":
      return mastery >= 80
    default:
      return true
  }
}

export function filterVocab(
  words: VocabItem[],
  query: string,
  filter: MasteryFilter
): VocabItem[] {
  const q = query.trim().toLowerCase()
  return words.filter((word) => {
    if (!matchesMastery(word.mastery, filter)) return false
    if (!q) return true
    return [word.term, word.meaning, word.pronunciation ?? "", word.category, ...word.tags].some(
      (field) => field.toLowerCase().includes(q)
    )
  })
}
