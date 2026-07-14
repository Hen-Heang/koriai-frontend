// Mock-interview ("Exam Prep") domain logic for the K-Specialist Korean
// interview (제5회). The exam is Q&A only — no presentation — so this trains
// the live loop: hear a question, answer aloud, get judged on speaking,
// pronunciation, vocabulary, and confidence.
//
// The examiner is driven entirely through the existing chat-streaming backend
// (chatApi), so no new endpoint is required. We inject the instructions into
// the message text, the same approach useChat uses for language/dev-mode.

import { INTERVIEW_MODES, type InterviewModeConfig } from "./interview-modes"
import type { UnexpectedQuestion } from "./interview-unexpected"

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
  /**
   * The candidate's own drafted script, keyed by `scriptOutline` section id.
   * Any section left empty in the editor falls back to this text on load;
   * whatever the candidate has actually written (locally or in their account)
   * always wins.
   */
  scriptSeed?: Record<string, string>
  /**
   * English translation of the script, keyed by section id. Shown in the
   * editor as an editable reference under each Korean section; used as the
   * default whenever the candidate hasn't saved their own English text.
   */
  scriptSeedEn?: Record<string, string>
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
    hint: "캄보디아 날씨와 어떻게 다른지 비교하세요. 어디가 더 덥고 더 습한지, 한국의 사계절과 캄보디아의 건기·우기의 차이, 기후 차이 등을 이야기해 보세요.",
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
    hint: "처음 한국 여름을 겪었을 때와 지금을 비교해 보세요. '처음에는 ~했지만 지금은 ~' 표현이 유용합니다. 적응하다, 견디다, 고향 날씨가 그립다 같은 표현도 써 보세요.",
  },
  {
    id: "conclusion",
    titleKo: "마무리",
    titleEn: "Conclusion",
    hint: "이야기를 간단히 정리하고 마무리 인사를 하세요. 예: 들어 주셔서 감사합니다.",
  },
]

// The candidate's own drafted script, transcribed into the outline sections above.
const WEATHER_SCRIPT_SEED: Record<string, string> = {
  intro:
    "안녕하세요. 저는 히엉(Henry)입니다. 오늘 주제는 한국 여름 날씨와 캄보디아 날씨의 다른 점과 생활/건강에 미치는 영향입니다.\n오늘은 한국과 캄보디아의 여름이 어떻게 다른지, 그리고 그 날씨가 우리 생활과 건강에 주는 영향을 제 경험과 함께 이야기해보겠습니다.",
  "korea-summer":
    "한국의 여름은 6월부터 8월까지입니다. 보통 30도 정도인데, 더운 날은 35도가 넘습니다. 그리고 장마라고 해서 비가 계속 오는 때가 있습니다. 습도도 높아서 실제 온도보다 더 덥게 느껴집니다.\n그래서 사람들은 우산을 항상 가지고 다니고, 수영장이나 바다에 가기도 하고, 삼계탕을 먹으면서 힘을 얻기도 합니다.",
  compare:
    "캄보디아는 좀 다릅니다. 일 년 내내 덥고, 건기와 우기 두 계절만 있습니다. 가장 더운 때는 3월부터 5월인데, 40도 가까이 올라갑니다. 그래서 낮에는 너무 더워서 밖에 잘 나가지 않고, 저녁이 되면 시원해져서 저는 그때 친구들과 밖에 나가곤 했습니다.\n한국도 비슷하게, 더운 날에는 다들 에어컨이나 선풍기를 틀어놓은 곳에서 시간을 보냅니다.",
  "daily-life":
    "날씨가 다르니까 저희의 생활 방식도 조금 달라졌습니다. 다니는 시간도 바꾸게 되고, 낮에는 활동을 줄이게 됩니다.",
  health:
    "건강에도 영향을 많이 줍니다. 더우면 쉽게 피곤해지고, 심하면 더위를 먹을 수도 있어서 조심해야 합니다.\n그래서 저는 이 날씨에 적응하기 위해 물을 많이 마시려고 노력합니다.",
  reflection:
    "이번 여름은 한국에서 보내는 첫 여름이라 아직 익숙하지 않습니다. 날씨가 많이 덥고 습해서 가끔 잠을 잘 못 잘 때도 있습니다. 그래도 조금씩 적응하고 있습니다.\n나중에 기회가 된다면 여름에 바다나 산에도 한번 가보고 싶습니다.",
  conclusion: "이상으로 발표를 마치겠습니다. 들어 주셔서 감사합니다.",
}

// The candidate's own English translation of the script (from the same prep
// doc), section by section, mirroring WEATHER_SCRIPT_SEED's paragraphing.
const WEATHER_SCRIPT_SEED_EN: Record<string, string> = {
  intro:
    "Hello, I am Heang (Henry). Today's topic is the differences between Korean summer weather and Cambodian weather, and their impact on life and health.\nToday, I will talk about how summer in Korea and Cambodia are different, and how the weather affects our daily life and health, along with my own experience.",
  "korea-summer":
    "Summer in Korea is from June to August. The temperature is usually around 30°C, but on hot days it goes over 35°C. There is also a rainy period called \"jangma,\" when it rains continuously. The humidity is also high, so it feels hotter than the actual temperature.\nBecause of this, people always carry umbrellas, sometimes go to swimming pools or the beach, and sometimes eat samgyetang to regain energy.",
  compare:
    "Cambodia is a bit different. It is hot all year round and has only two seasons: the dry season and the rainy season. The hottest period is from March to May, when the temperature rises to nearly 40°C. So during the daytime, it is too hot and people do not go outside much. In the evening, it becomes cooler, so I used to go out with my friends at that time.\nKorea is similar in some ways — on hot days, everyone spends time in places with the air conditioner or fan on.",
  "daily-life":
    "Because the weather is different, our lifestyle has also changed a little. We end up changing the times we go out, and we reduce activities during the daytime.",
  health:
    "The weather also affects health a lot. When it is hot, people get tired easily, and in serious cases, they can even get heat sickness, so we have to be careful.\nThat is why I try to drink a lot of water to adapt to this weather.",
  reflection:
    "This is my first summer in Korea, so I am still not used to it. It is very hot and humid, so sometimes I cannot sleep well. But I am slowly getting used to it.\nIn the future, if I have the chance, I would like to visit the beach or the mountains in summer.",
  conclusion: "That concludes my presentation. Thank you for listening.",
}

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
    { term: "건기", meaning: "the dry season (Cambodia)" },
    { term: "우기", meaning: "the wet/rainy season (Cambodia)" },
    { term: "기후", meaning: "climate" },
    { term: "계절", meaning: "season" },
    { term: "사계절", meaning: "the four seasons" },
    { term: "폭염", meaning: "a heat wave" },
    { term: "자외선", meaning: "UV rays" },
    { term: "그늘", meaning: "shade" },
    { term: "환절기", meaning: "the changing-of-seasons period" },
    { term: "적응하다", meaning: "to adapt (to something)" },
    { term: "그립다", meaning: "to miss, to long for" },
    { term: "견디다", meaning: "to endure, to bear" },
    { term: "차이", meaning: "a difference" },
    // From TalkToMeInKorean "1100 Short & Useful Korean Phrases" (Pattern 009 example).
    { term: "미세먼지", meaning: "fine dust / particulate pollution" },
    { term: "불쾌지수", meaning: "discomfort index" },
    { term: "차이점", meaning: "point of difference" },
    { term: "반면에", meaning: "on the other hand" },
    { term: "식중독", meaning: "food poisoning" },
    { term: "탈수 증상", meaning: "dehydration symptoms" },
    { term: "수분 섭취", meaning: "water intake" },
    { term: "실내 활동", meaning: "indoor activities" },
    { term: "체력 관리", meaning: "physical strength management" },
    { term: "비슷하다", meaning: "to be similar" },
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
    {
      ko: "캄보디아는 건기와 우기로 나뉘어요.",
      en: "Cambodia is divided into a dry season and a rainy season.",
    },
    {
      ko: "한국은 사계절이 있지만 캄보디아는 그렇지 않아요.",
      en: "Korea has four seasons, but Cambodia doesn't.",
    },
    {
      ko: "한국 장마가 캄보디아 우기보다 짧은 것 같아요.",
      en: "Korea's rainy season seems shorter than Cambodia's wet season.",
    },
    { ko: "그늘에 있어도 더울 때가 많아요.", en: "Even in the shade, it's often still hot." },
    { ko: "고향 날씨가 그리울 때도 있어요.", en: "Sometimes I miss the weather back home." },
    {
      ko: "이제는 한국 더위를 잘 견딜 수 있어요.",
      en: "Now I can endure the Korean heat well.",
    },
    // From TalkToMeInKorean "Real-Life Korean Conversations: Intermediate",
    // Dialogue 02 "Exchanging Numbers" (formal small talk about weather).
    {
      ko: "날씨가 추워서 오시느라 고생하셨죠?",
      en: "It must've been hard to come here because of the cold weather, right?",
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
    { ko: "고향 날씨가 그리울 때가 있어요?", en: "Do you ever miss the weather back home?" },
    {
      ko: "한국 날씨에 적응하는 데 얼마나 걸렸어요?",
      en: "How long did it take you to adapt to Korean weather?",
    },
    {
      ko: "캄보디아의 건기와 우기에 대해 설명해 줄 수 있어요?",
      en: "Can you explain Cambodia's dry and rainy seasons?",
    },
    {
      ko: "여름에 더위를 식히기 위해 어떤 음식이나 음료를 마셔요?",
      en: "What food or drinks do you have to cool down in the summer?",
    },
    // From TalkToMeInKorean "1100 Short & Useful Korean Phrases" (Pattern 024 example).
    { ko: "날씨 어떤 것 같아요?", en: "What do you think about the weather?" },
    { ko: "냉방병을 예방하기 위해 어떤 노력을 하고 있어요?", en: "What efforts are you making to prevent air-conditioning sickness?" },
    { ko: "한국과 캄보디아 중 어느 쪽이 건강에 더 나쁘다고 생각해요?", en: "Which do you think is worse for health — Korean or Cambodian weather?" },
    { ko: "한국 여름에 가장 힘들었던 건강 문제는 무엇이었어요?", en: "What was the most difficult health issue you faced during Korean summer?" },
    { ko: "캄보디아에서는 더운 날씨에 어떻게 대처했어요?", en: "How did you cope with the hot weather in Cambodia?" },
    { ko: "습도가 높을 때 일상생활에 어떤 변화가 생겼어요?", en: "What changes happened in your daily life when humidity was high?" },
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
      "1) Describe Korea's summer weather (덥다, 습하다, 무덥다, 장마, 폭염, 자외선).",
      "2) Compare it with Cambodia's weather (Korea's 사계절 vs Cambodia's 건기/우기, which is hotter, which is more humid, climate/기후 differences, 차이).",
      "3) The rainy season 장마 and daily life (commute, 땀, 에어컨, 그늘, sleep, 열대야, 환절기).",
      "4) Health effects of the heat (더위를 먹다, 일사병, 냉방병, tiredness) and how the candidate copes (수분 보충, rest).",
      "5) A personal reflection (a hard day because of the weather, missing home weather: 고향이 그립다, or how they adapted/endured: 익숙해지다, 적응하다, 견디다).",
      "Keep vocabulary practical and everyday; encourage the candidate to compare with Cambodia and to give personal examples.",
    ].join("\n"),
    prep: WEATHER_PREP,
    scriptOutline: WEATHER_SCRIPT_OUTLINE,
    scriptSeed: WEATHER_SCRIPT_SEED,
    scriptSeedEn: WEATHER_SCRIPT_SEED_EN,
  },
]

export function getInterviewTopic(id: string): InterviewTopic {
  return (
    INTERVIEW_TOPICS.find((topic) => topic.id === id) ?? INTERVIEW_TOPICS[0]
  )
}

// ── Q&A preparation ───────────────────────────────────────────────────────
// The exam is spoken Q&A, so beyond the written script the candidate drafts an
// answer to each likely question. Answers are keyed by item id and ride in the
// same `values` map the script uses, so they autosave + sync with no new wiring.

export interface QAItem {
  id: string
  questionKo: string
  questionEn: string
}

/** Likely exam questions for the topic, seeded as the starting Q&A list. */
export function getSeedQA(topic: InterviewTopic): QAItem[] {
  return (topic.prep?.sampleQuestions ?? []).map((q, i) => ({
    id: `qa-seed-${i}`,
    questionKo: q.ko,
    questionEn: q.en,
  }))
}

/**
 * Renders the Q&A section of the exportable document. Skips items with neither a
 * question nor an answer so blank rows don't clutter what the mentor receives.
 */
export function buildQADocument(items: QAItem[], answers: Record<string, string>): string {
  const blocks: string[] = []
  for (const item of items) {
    const question = item.questionKo.trim()
    const answer = (answers[item.id] ?? "").trim()
    if (!question && !answer) continue
    if (question) blocks.push(`Q: ${question}`)
    blocks.push(answer ? `A: ${answer}` : "A: (작성 예정)")
    blocks.push("")
  }
  return blocks.join("\n").trim()
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

// Per-mode response contract. Practice keeps the full three-tag turn; exam is
// Korean-only — no feedback, no translation — like the real interviewer.
function responseFormatRules(mode: InterviewModeConfig): string {
  if (!mode.showFeedback && !mode.showEnglish) {
    return [
      "Reply ONLY in this exact format, nothing before or after:",
      QUESTION_KO_TAG,
      "<exactly ONE interview question in natural spoken Korean>",
      "Do NOT include feedback, English, or translations of any kind.",
    ].join("\n")
  }
  return [
    "Reply ONLY in this exact format, nothing before or after:",
    FEEDBACK_TAG,
    "<one or two short sentences of English feedback on the candidate's PREVIOUS answer — comment on vocabulary, grammar, and confidence, and when useful give a more natural way to say it. For the very first turn, write: Let's begin — relax and answer naturally.>",
    QUESTION_KO_TAG,
    "<exactly ONE interview question in natural spoken Korean>",
    QUESTION_EN_TAG,
    "<a plain English translation of that question>",
  ].join("\n")
}

/**
 * The kickoff message sent as the first turn of the conversation. It sets up
 * the examiner persona and asks for the first question. Defaults keep the old
 * one-argument call (and its tests) behaving exactly as before.
 */
export function buildInterviewSystemPrompt(
  topic: InterviewTopic,
  mode: InterviewModeConfig = INTERVIEW_MODES.practice,
  unexpected: UnexpectedQuestion[] = []
): string {
  const unexpectedBlock =
    unexpected.length > 0
      ? [
          "- Roughly every 2-3 questions, break from the topic and ask ONE unexpected everyday interview question, adapted naturally in your own words (do not read verbatim):",
          ...unexpected.map((q) => `  · ${q.ko}`),
          "  Return to the topic arc afterwards.",
        ]
      : []

  return [
    "You are a Korean-language interviewer for the K-Specialist (케이 스페셜리스트) Korean speaking exam.",
    "This is a spoken Q&A interview — there is no presentation. You ask one question at a time and the candidate answers out loud.",
    `Interview topic: ${topic.labelKo} (${topic.label}).`,
    topic.examinerBrief,
    "Rules:",
    "- Ask ONE question per turn, but NEVER move to a new sub-topic after only one question.",
    "- After every answer, probe it at least once with a natural follow-up before advancing the arc. Use probes like: 왜 그렇게 생각합니까? / 예를 들어 설명해 주세요 / 조금 더 자세히 말해 주세요 / 그때 기분이 어땠습니까?",
    "- If the answer is short or vague, dig into it; if it is detailed, challenge one detail.",
    ...unexpectedBlock,
    "- Keep questions short and clearly spoken, suitable for an intermediate learner.",
    "- The candidate is evaluated on speaking ability, pronunciation, vocabulary, and confidence.",
    mode.showFeedback
      ? "- Be encouraging but honest in your feedback."
      : "- Stay formal and neutral, like a real examiner. Give no feedback during the interview.",
    "",
    responseFormatRules(mode),
    "",
    "Begin the interview now with your first question.",
  ].join("\n")
}

/**
 * Wraps the candidate's spoken answer for the next turn, with a light reminder
 * to keep the examiner on-format (models drift over long chats).
 */
export function buildAnswerMessage(
  answer: string,
  mode: InterviewModeConfig = INTERVIEW_MODES.practice
): string {
  const reminder = mode.showFeedback
    ? "[Give brief feedback on that answer, then ask the next question. Use the required format.]"
    : "[Ask the next question in the required format. No feedback, no English.]"
  return `${answer.trim()}\n\n${reminder}`
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

// ── End-of-session evaluation ────────────────────────────────────────────
// After the Q&A the candidate can ask for an overall verdict. The examiner
// already has the full conversation, so we just switch it out of the per-turn
// question format and into a one-off scorecard keyed to the four official exam
// criteria (speaking, pronunciation, vocabulary, confidence).

const SCORES_TAG = "[SCORES]"
const SUMMARY_TAG = "[SUMMARY]"
const ADVICE_TAG = "[ADVICE]"

/** The four official K-Specialist criteria, in the order the exam lists them. */
export const EVALUATION_CRITERIA = [
  "Speaking",
  "Pronunciation",
  "Vocabulary",
  "Confidence",
] as const

export interface EvaluationScore {
  label: string
  score: number
  max: number
}

export interface InterviewEvaluation {
  scores: EvaluationScore[]
  summary: string
  advice: string[]
}

// Richer end-of-session analysis from the structured evaluate route
// (app/api/ai/interview/evaluate). All values are ESTIMATED from the
// speech-recognition transcript — there is no audio analysis.

export interface InterviewGrammarIssue {
  issue: string
  example: string
  fix: string
}

export interface InterviewAnalytics {
  fillerNotes: string
  avgSentenceLengthWords: number
  vocabRangeNotes: string
  grammarIssues: InterviewGrammarIssue[]
  wordsToPractice: string[]
}

/** The evaluate route's per-criterion scores, keyed by criterion. */
export interface CriterionScores {
  speaking: number
  pronunciation: number
  vocabulary: number
  confidence: number
}

/**
 * Maps the evaluate route's keyed scores into the ordered EvaluationScore list
 * the scorecard UI and history already consume, clamped to 1–5.
 */
export function toEvaluationScores(scores: CriterionScores): EvaluationScore[] {
  const byLabel: Record<(typeof EVALUATION_CRITERIA)[number], number> = {
    Speaking: scores.speaking,
    Pronunciation: scores.pronunciation,
    Vocabulary: scores.vocabulary,
    Confidence: scores.confidence,
  }
  return EVALUATION_CRITERIA.map((label) => ({
    label,
    score: Math.max(1, Math.min(5, Math.round(byLabel[label]))),
    max: 5,
  }))
}

/**
 * Final-turn message that ends the interview and asks for a scorecard instead
 * of another question. Sent on the same conversation, so the model judges the
 * whole transcript it already has.
 */
export function buildEvaluationPrompt(): string {
  return [
    "The interview is now over. Do NOT ask another question.",
    "Evaluate the candidate's overall spoken performance across the whole interview, judging the four official exam criteria on a 1–5 scale.",
    "Reply ONLY in this exact format, nothing before or after:",
    SCORES_TAG,
    "Speaking: <1-5>",
    "Pronunciation: <1-5>",
    "Vocabulary: <1-5>",
    "Confidence: <1-5>",
    SUMMARY_TAG,
    "<two or three sentences of honest, encouraging English feedback on the overall performance>",
    ADVICE_TAG,
    "- <one short, actionable tip in English>",
    "- <one short, actionable tip in English>",
    "- <one short, actionable tip in English>",
  ].join("\n")
}

/**
 * Parses the scorecard reply. Tolerant of formatting drift: missing scores are
 * dropped, and any bullet style (-, •, *, or 1.) is accepted for the advice.
 */
export function parseEvaluation(raw: string): InterviewEvaluation {
  const text = (raw ?? "").trim()

  const scoresBlock = extractSection(text, SCORES_TAG, [SUMMARY_TAG, ADVICE_TAG])
  const summary = extractSection(text, SUMMARY_TAG, [ADVICE_TAG])
  const adviceBlock = extractSection(text, ADVICE_TAG, [])

  const scores: EvaluationScore[] = []
  for (const line of scoresBlock.split("\n")) {
    // Match "Label: 4" or "Label: 4/5" (the "/5" is optional).
    const match = line.match(/^\s*(.+?)\s*[:：]\s*(\d+)\s*(?:\/\s*(\d+))?/)
    if (!match) continue
    const max = match[3] ? Number(match[3]) : 5
    const score = Math.max(0, Math.min(max, Number(match[2])))
    scores.push({ label: match[1].trim(), score, max })
  }

  const advice = adviceBlock
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)

  return { scores, summary, advice }
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
