type SpeakingAssessment = {
  score: number
  matchedWords: string[]
  missingWords: string[]
  extraWords: string[]
  feedback: string
  accuracyLabel: "Excellent" | "Good" | "Needs work"
}

function normalizeForChars(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[.,!?:;"'()[\]{}]/g, "")
    .trim()
}

function normalizeToken(token: string) {
  return token
    .toLowerCase()
    .replace(/[.,!?:;"'()[\]{}]/g, "")
    .trim()
}

function tokenize(text: string) {
  return text
    .split(/\s+/)
    .map(normalizeToken)
    .filter(Boolean)
}

function longestCommonSubsequenceLength(a: string, b: string) {
  const rows = a.length + 1
  const cols = b.length + 1
  const dp = Array.from({ length: rows }, () => Array<number>(cols).fill(0))

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  return dp[a.length][b.length]
}

export function assessSpeaking(target: string, transcript: string): SpeakingAssessment {
  const targetWords = tokenize(target)
  const spokenWords = tokenize(transcript)
  const targetChars = normalizeForChars(target)
  const spokenChars = normalizeForChars(transcript)

  if (!targetWords.length) {
    return {
      score: 0,
      matchedWords: [],
      missingWords: [],
      extraWords: spokenWords,
      feedback: "Pick a target sentence first.",
      accuracyLabel: "Needs work",
    }
  }

  if (!spokenWords.length && !spokenChars.length) {
    return {
      score: 0,
      matchedWords: [],
      missingWords: targetWords,
      extraWords: [],
      feedback: "Record yourself or type the transcript to get speaking feedback.",
      accuracyLabel: "Needs work",
    }
  }

  const spokenPool = [...spokenWords]
  const matchedWords: string[] = []

  for (const word of targetWords) {
    const index = spokenPool.indexOf(word)
    if (index >= 0) {
      matchedWords.push(word)
      spokenPool.splice(index, 1)
    }
  }

  const matchedSet = new Set(matchedWords)
  const missingWords = targetWords.filter((word) => !matchedSet.has(word))
  const extraWords = spokenPool

  const tokenScore = matchedWords.length / targetWords.length
  const charScore = targetChars.length
    ? longestCommonSubsequenceLength(targetChars, spokenChars) / targetChars.length
    : 0
  const blendedScore = (tokenScore * 0.65 + charScore * 0.35) * 100
  const spacingTolerantScore = charScore * 92
  const score = Math.max(
    0,
    Math.min(100, Math.round(Math.max(blendedScore, spacingTolerantScore)))
  )

  if (score >= 90) {
    return {
      score,
      matchedWords,
      missingWords,
      extraWords,
      feedback: "Excellent. Your rhythm and wording are very close to the target sentence.",
      accuracyLabel: "Excellent",
    }
  }

  if (score >= 70) {
    return {
      score,
      matchedWords,
      missingWords,
      extraWords,
      feedback: "Good attempt. Repeat once more and focus on the missing chunk instead of the full sentence.",
      accuracyLabel: "Good",
    }
  }

  return {
    score,
    matchedWords,
    missingWords,
    extraWords,
    feedback: "Needs work. Slow down, shadow the audio, and repeat the sentence in two smaller parts.",
    accuracyLabel: "Needs work",
  }
}
