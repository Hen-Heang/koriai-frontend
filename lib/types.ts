export type MessageRole = "assistant" | "user" | "system"

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  correction?: string
  translation?: string
  createdAt: string
}

export interface VocabItem {
  id: string
  category: string
  term: string
  meaning: string
  pronunciation?: string
  example?: string
  exampleTranslation?: string
  difficultyLevel?: "Easy" | "Medium" | "Hard"
  mastery: number
  nextReview: string
  tags: string[]
  easeFactor: number
  intervalDays: number
  repetitions: number
  lapses: number
}

export interface Scenario {
  id: string
  title: string
  category: string
  level: "Beginner" | "Intermediate" | "Advanced"
  summary: string
  goal: string
}

export interface ScenarioDetail extends Scenario {
  introMessage?: string
}

export interface ProgressPoint {
  day: string
  minutes: number
  accuracy: number
}

export interface SimilarExpression {
  phrase: string
  meaning: string
}

export interface DailyPhrase {
  id: string
  date: string
  phrase: string
  meaning: string
  romanization?: string
  whenToUse?: string
  formality?: string
  similarExpressions: SimilarExpression[]
  learned: boolean
}

export interface MessageVariation {
  korean: string
  romanization?: string
  formality?: string
  situation?: string
}

export interface GeneratedMessages {
  intent: string
  category?: string
  variations: MessageVariation[]
  note?: string
}

export interface TranscriptLine {
  speaker: string
  korean: string
  english: string
}

export interface QuizQuestion {
  question: string
  options: string[]
  answerIndex: number
  explanation: string
}

export interface ListeningLesson {
  id: string
  topic: string
  title: string
  level: string
  lines: TranscriptLine[]
  quiz: QuizQuestion[]
  createdAt?: string
}

export interface ListeningAttemptResult {
  lessonId: string
  score: number
  total: number
  accuracy: number
  results: boolean[]
}

export interface Achievement {
  code: string
  title: string
  description: string
  icon: string
  category: string
  xp: number
  unlocked: boolean
  unlockedAt?: string | null
}

export interface LevelInfo {
  level: number
  name: string
  totalXp: number
  xpIntoLevel: number
  xpForNextLevel: number | null
  nextLevelName: string | null
}

export interface AchievementSummary {
  level: LevelInfo
  unlockedCount: number
  totalCount: number
  achievements: Achievement[]
}

export interface DashboardStats {
  streakDays: number
  weeklyMinutes: number
  wordsSaved: number
  correctionsThisWeek: number
  dailyGoalProgress: number
  reviewsToday: number
  correctionsToday: number
  dueReviews: number
}

export interface Conversation {
  id: number
  userId: number
  scenarioId?: number | null
  title: string
  conversationType: string
  modelUsed: string
  messageCount: number
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: number
  conversationId: number
  role: string
  content: string
  corrections?: string | null
  tokensUsed: number
  createdAt: string
}

export interface AnalysisBreakdownItem {
  fragment: string
  meaning: string
  note: string
}

export interface SuggestedReply {
  korean: string
  english: string
  formality: string
}

export interface SentenceChallengeResponse {
  cardId: string
  term: string
  meaning: string
  challengePrompt: string
  contextHint: string
  exampleAnswer: string
}

export interface SentenceCheckResponse {
  score: number
  correct: boolean
  feedback: string
  correctedSentence: string
  betterAlternative: string
  grammarNote: string
}

// ── Foundations (basics + grammar) ──────────────────────────────────────────
// Three beginner tracks: "survival" teaches Level-0 phrases you need on day one
// (greetings, ordering, emergencies); "alphabet" teaches Hangul (자음/모음 →
// syllables); "grammar" teaches sentence patterns (particles, 요-form, tenses,
// numbers, irregular verbs).
export type LearnTrack = "survival" | "alphabet" | "grammar"

export type LessonLevel = "Intro" | "Beginner" | "Elementary"

// One lesson as shown in the track list (no teaching/practice payload).
export interface LessonSummary {
  id: string
  track: LearnTrack
  order: number
  title: string
  subtitle: string
  level: LessonLevel
  estimatedMinutes: number
  completed: boolean
  // 0–100, % of this lesson's exercises answered correctly on the best attempt.
  progress: number
}

// A teaching card shown before practice. The same shape serves both tracks:
// alphabet → `hangul` is a jamo/syllable, `meaning` is its sound; grammar →
// `hangul` is the pattern/headword, `meaning` is the rule it expresses.
export interface LessonCard {
  hangul: string
  romanization?: string
  meaning: string
  example?: string
  exampleTranslation?: string
  note?: string
}

// A single practice item. "multiple-choice" reveals the right option;
// "type-answer" expects a short typed string (e.g. the romanization).
export interface LessonExercise {
  id: string
  type: "multiple-choice" | "type-answer"
  prompt: string
  options?: string[]
  answerIndex?: number
  answer?: string
  explanation?: string
}

// Full lesson payload for the runner: intro + teaching cards + practice.
export interface LessonDetail extends LessonSummary {
  intro: string
  cards: LessonCard[]
  exercises: LessonExercise[]
}

export interface LessonAttemptResult {
  lessonId: string
  score: number
  total: number
  accuracy: number
  completed: boolean
  results: boolean[]
}

export interface MessageAnalysis {
  id: number
  source?: string | null
  originalText: string
  literalMeaning: string
  naturalMeaning: string
  businessContext: string
  politenessLevel: string
  tone: string
  breakdown: AnalysisBreakdownItem[]
  suggestedReplies: SuggestedReply[]
  modelUsed: string
  createdAt: string
}
