import { ReviewSession } from "@/components/vocab/ReviewSession"
import { VocabCard } from "@/components/vocab/VocabCard"

const savedWords = [
  {
    id: "saved-1",
    term: "배달",
    meaning: "delivery",
    example: "저녁은 배달 음식으로 먹었어요.",
    mastery: 63,
    nextReview: "Tomorrow",
    tags: ["food", "daily-life"],
  },
  {
    id: "saved-2",
    term: "연습하다",
    meaning: "to practice",
    example: "매일 말하기를 연습하려고 해요.",
    mastery: 81,
    nextReview: "In 2 days",
    tags: ["study", "verb"],
  },
]

export default function VocabPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Vocabulary
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Build your review deck
        </h1>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          {savedWords.map((item) => (
            <VocabCard key={item.id} item={item} />
          ))}
        </div>
        <ReviewSession />
      </div>
    </div>
  )
}
