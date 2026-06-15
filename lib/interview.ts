// Mock-interview ("Exam Prep") domain logic for the K-Specialist Korean
// interview (제5회). The exam is Q&A only — no presentation — so this trains
// the live loop: hear a question, answer aloud, get judged on speaking,
// pronunciation, vocabulary, and confidence.
//
// The examiner is driven entirely through the existing chat-streaming backend
// (chatApi), so no new endpoint is required. We inject the instructions into
// the message text, the same approach useChat uses for language/dev-mode.

export type InterviewTopicId = "weather"

export interface VocabEntry {
  term: string
  meaning: string
}

export interface PhraseEntry {
  ko: string
  en: string
}

/** Optional curated study material shown alongside a topic. */
export interface InterviewPrep {
  vocabulary: VocabEntry[]
  keyPhrases: PhraseEntry[]
  sampleQuestions: PhraseEntry[]
}

/** One section of the prepared script the candidate submits before the exam. */
export interface ScriptSection {
  id: string
  titleKo: string
  titleEn: string
  /** Korean guidance on what to write in this section. */
  hint: string
}

export interface InterviewTopic {
  id: InterviewTopicId
  /** English label for the picker. */
  label: string
  /** Korean label as it appears on the exam announcement. */
  labelKo: string
  /** One-line English description of the angle to prepare. */
  description: string
  difficulty: "Easy–Medium" | "Medium" | "Hard"
  /** Marks the topic recommended for this candidate's level. */
  recommended?: boolean
  /** Extra context handed to the examiner so questions stay on-topic. */
  examinerBrief: string
  /** Curated vocab / phrases / likely questions to drill daily. */
  prep?: InterviewPrep
  /** Outline for the written script submitted before the exam. */
  scriptOutline?: ScriptSection[]
}

// Section-by-section scaffold for the script the candidate writes and submits.
// Mirrors the examiner's question arc so practice and the written script align.
const WEATHER_SCRIPT_OUTLINE: ScriptSection[] = [
  {
    id: "intro",
    titleKo: "인사 및 주제 소개",
    titleEn: "Greeting & topic intro",
    hint: "간단히 인사하고 오늘 이야기할 주제를 소개하세요. 예: 안녕하세요. 저는 ___입니다. 오늘은 한국의 여름 날씨와 캄보디아 날씨에 대해 이야기하겠습니다.",
  },
  {
    id: "korea-summer",
    titleKo: "한국의 여름 날씨",
    titleEn: "Korea's summer weather",
    hint: "한국 여름의 특징을 설명하세요. 덥다, 습하다, 무덥다, 장마, 열대야 같은 표현을 사용해 보세요.",
  },
  {
    id: "compare",
    titleKo: "캄보디아 날씨와 비교",
    titleEn: "Compared with Cambodia",
    hint: "캄보디아 날씨와 어떻게 다른지 비교하세요. 어디가 더 덥고 더 습한지, 건기와 우기의 차이 등.",
  },
  {
    id: "daily-life",
    titleKo: "날씨와 일상생활",
    titleEn: "Weather & daily life",
    hint: "더위와 장마철이 출근, 잠, 에어컨 사용 등 일상생활에 어떤 영향을 주는지 이야기하세요.",
  },
  {
    id: "health",
    titleKo: "건강에 미치는 영향",
    titleEn: "Effects on health",
    hint: "더운 날씨가 건강에 어떤 영향을 주는지, 그리고 어떻게 건강을 지키는지 설명하세요. 수분 보충, 일사병, 냉방병 등.",
  },
  {
    id: "reflection",
    titleKo: "나의 경험과 느낀 점",
    titleEn: "My experience & reflection",
    hint: "처음 한국 여름을 겪었을 때와 지금을 비교해 보세요. '처음에는 ~했지만 지금은 ~' 표현이 유용합니다.",
  },
  {
    id: "conclusion",
    titleKo: "마무리",
    titleEn: "Conclusion",
    hint: "이야기를 간단히 정리하고 마무리 인사를 하세요. 예: 들어 주셔서 감사합니다.",
  },
]

// Curated study material for the chosen exam topic. Drilled daily, this is the
// 15–20 words and the handful of phrases that cover most of the Q&A.
const WEATHER_PREP: InterviewPrep = {
  vocabulary: [
    { term: "덥다", meaning: "to be hot" },
    { term: "습하다", meaning: "to be humid" },
    { term: "무덥다", meaning: "to be muggy (hot + humid)" },
    { term: "장마", meaning: "the rainy season (monsoon)" },
    { term: "장마철", meaning: "the rainy-season period" },
    { term: "소나기", meaning: "a sudden shower" },
    { term: "습도", meaning: "humidity (level)" },
    { term: "기온", meaning: "air temperature" },
    { term: "열대야", meaning: "a hot tropical night" },
    { term: "에어컨", meaning: "air conditioner" },
    { term: "선풍기", meaning: "electric fan" },
    { term: "땀", meaning: "sweat" },
    { term: "땀이 나다", meaning: "to sweat" },
    { term: "더위", meaning: "the heat" },
    { term: "더위를 먹다", meaning: "to suffer from the heat" },
    { term: "시원하다", meaning: "to be cool / refreshing" },
    { term: "수분 보충", meaning: "replenishing fluids / hydration" },
    { term: "일사병", meaning: "heatstroke" },
    { term: "냉방병", meaning: "illness from too much AC" },
    { term: "익숙해지다", meaning: "to get used to (something)" },
  ],
  keyPhrases: [
    { ko: "한국 여름은 정말 덥고 습해요.", en: "Korean summer is really hot and humid." },
    { ko: "캄보디아는 일 년 내내 더워요.", en: "Cambodia is hot all year round." },
    { ko: "장마철에는 비가 많이 와요.", en: "During the rainy season it rains a lot." },
    { ko: "저는 더위를 잘 타요.", en: "I'm very sensitive to the heat." },
    { ko: "에어컨이 없으면 잠을 못 자요.", en: "Without air conditioning I can't sleep." },
    { ko: "출근할 때 땀이 많이 나요.", en: "I sweat a lot on my commute to work." },
    { ko: "물을 자주 마시려고 해요.", en: "I try to drink water often." },
    {
      ko: "처음에는 힘들었지만 지금은 익숙해졌어요.",
      en: "At first it was hard, but now I've gotten used to it.",
    },
    {
      ko: "한국 여름이 캄보디아보다 더 습한 것 같아요.",
      en: "Korean summer feels more humid than Cambodia's.",
    },
    {
      ko: "건강을 위해서 무리하지 않으려고 해요.",
      en: "For my health, I try not to overdo it.",
    },
  ],
  sampleQuestions: [
    { ko: "한국의 여름 날씨는 어때요?", en: "How is Korea's summer weather?" },
    {
      ko: "캄보디아의 날씨와 어떻게 달라요?",
      en: "How is it different from Cambodia's weather?",
    },
    {
      ko: "한국 여름과 캄보디아 여름 중에서 어디가 더 더워요?",
      en: "Which is hotter — Korean or Cambodian summer?",
    },
    { ko: "장마철에 대해 어떻게 생각해요?", en: "What do you think about the rainy season?" },
    {
      ko: "더운 날씨가 건강에 어떤 영향을 줘요?",
      en: "How does hot weather affect your health?",
    },
    { ko: "더위를 이기기 위해서 무엇을 해요?", en: "What do you do to beat the heat?" },
    {
      ko: "한국에 와서 날씨 때문에 힘들었던 적이 있어요?",
      en: "Since coming to Korea, have you struggled because of the weather?",
    },
    {
      ko: "여름에 건강을 지키기 위해서 어떻게 해요?",
      en: "How do you stay healthy in the summer?",
    },
  ],
}

export const INTERVIEW_TOPICS: InterviewTopic[] = [
  {
    id: "weather",
    label: "Korea vs Cambodia summer weather",
    labelKo: "한국 여름 날씨 vs 캄보디아 날씨 (생활·건강 영향)",
    description:
      "Compare summer weather in Korea and Cambodia and how it affects daily life and health.",
    difficulty: "Easy–Medium",
    recommended: true,
    examinerBrief: [
      "The candidate is from Cambodia and is living through a Korean summer right now (June–August).",
      "Follow this natural question arc, one question per turn, going a little deeper each time:",
      "1) Describe Korea's summer weather (덥다, 습하다, 무덥다, 장마).",
      "2) Compare it with Cambodia's weather (which is hotter, which is more humid, the dry/rainy seasons).",
      "3) The rainy season 장마 and daily life (commute, 땀, 에어컨, sleep, 열대야).",
      "4) Health effects of the heat (더위를 먹다, 일사병, 냉방병, tiredness) and how the candidate copes (수분 보충, rest).",
      "5) A personal reflection (a hard day because of the weather, or how they got used to it: 익숙해지다).",
      "Keep vocabulary practical and everyday; encourage the candidate to compare with Cambodia and to give personal examples.",
    ].join("\n"),
    prep: WEATHER_PREP,
    scriptOutline: WEATHER_SCRIPT_OUTLINE,
  },
]

export function getInterviewTopic(id: string): InterviewTopic {
  return (
    INTERVIEW_TOPICS.find((topic) => topic.id === id) ?? INTERVIEW_TOPICS[0]
  )
}

/**
 * Assembles the written sections into one submittable document, skipping empty
 * sections, with a Korean heading per section.
 */
export function buildScriptDocument(
  topic: InterviewTopic,
  values: Record<string, string>,
  /** Candidate-added sections, appended after the fixed exam outline. */
  extraSections: { id: string; title: string }[] = []
): string {
  const blocks: string[] = [topic.labelKo, ""]

  const sections = [
    ...(topic.scriptOutline ?? []).map((s) => ({ id: s.id, titleKo: s.titleKo })),
    ...extraSections.map((s) => ({ id: s.id, titleKo: s.title.trim() || "Untitled" })),
  ]

  for (const section of sections) {
    const text = (values[section.id] ?? "").trim()
    if (!text) continue
    blocks.push(`【 ${section.titleKo} 】`, text, "")
  }

  return blocks.join("\n").trim()
}

// Markers the examiner must use so we can split each turn into feedback,
// the Korean question (for TTS), and an English translation (for the
// candidate, who is still building listening comprehension).
const FEEDBACK_TAG = "[FEEDBACK]"
const QUESTION_KO_TAG = "[QUESTION_KO]"
const QUESTION_EN_TAG = "[QUESTION_EN]"

const RESPONSE_FORMAT_RULES = [
  "Reply ONLY in this exact format, nothing before or after:",
  FEEDBACK_TAG,
  "<one or two short sentences of English feedback on the candidate's PREVIOUS answer — comment on vocabulary, grammar, and confidence, and when useful give a more natural way to say it. For the very first turn, write: Let's begin — relax and answer naturally.>",
  QUESTION_KO_TAG,
  "<exactly ONE interview question in natural spoken Korean>",
  QUESTION_EN_TAG,
  "<a plain English translation of that question>",
].join("\n")

/**
 * The kickoff message sent as the first turn of the conversation. It sets up
 * the examiner persona and asks for the first question.
 */
export function buildInterviewSystemPrompt(topic: InterviewTopic): string {
  return [
    "You are a Korean-language interviewer for the K-Specialist (케이 스페셜리스트) Korean speaking exam.",
    "This is a spoken Q&A interview — there is no presentation. You ask one question at a time and the candidate answers out loud.",
    `Interview topic: ${topic.labelKo} (${topic.label}).`,
    topic.examinerBrief,
    "Rules:",
    "- Ask ONE question per turn. Start easy, then go a little deeper with natural follow-up questions based on the candidate's previous answer.",
    "- Keep questions short and clearly spoken, suitable for an intermediate learner.",
    "- The candidate is evaluated on speaking ability, pronunciation, vocabulary, and confidence.",
    "- Be encouraging but honest in your feedback.",
    "",
    RESPONSE_FORMAT_RULES,
    "",
    "Begin the interview now with your first question.",
  ].join("\n")
}

/**
 * Wraps the candidate's spoken answer for the next turn, with a light reminder
 * to keep the examiner on-format (models drift over long chats).
 */
export function buildAnswerMessage(answer: string): string {
  return `${answer.trim()}\n\n[Give brief feedback on that answer, then ask the next question. Use the required format.]`
}

export interface ExaminerTurn {
  feedback: string
  questionKo: string
  questionEn: string
}

/**
 * Parses a completed examiner reply into its sections. Tolerant of missing
 * tags — falls back to treating the whole text as the Korean question so the
 * UI never ends up blank if the model ignores the format.
 */
export function parseExaminerTurn(raw: string): ExaminerTurn {
  const text = (raw ?? "").trim()

  const feedback = extractSection(text, FEEDBACK_TAG, [
    QUESTION_KO_TAG,
    QUESTION_EN_TAG,
  ])
  const questionKo = extractSection(text, QUESTION_KO_TAG, [QUESTION_EN_TAG])
  const questionEn = extractSection(text, QUESTION_EN_TAG, [])

  if (!questionKo && !questionEn && !feedback) {
    return { feedback: "", questionKo: text, questionEn: "" }
  }

  return {
    feedback,
    questionKo: questionKo || text,
    questionEn,
  }
}

function extractSection(
  text: string,
  startTag: string,
  endTags: string[]
): string {
  const startIndex = text.indexOf(startTag)
  if (startIndex === -1) {
    return ""
  }

  const contentStart = startIndex + startTag.length
  let contentEnd = text.length

  for (const endTag of endTags) {
    const endIndex = text.indexOf(endTag, contentStart)
    if (endIndex !== -1 && endIndex < contentEnd) {
      contentEnd = endIndex
    }
  }

  return text.slice(contentStart, contentEnd).trim()
}
