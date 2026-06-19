import { api } from "./client"
import type { LearnTrack } from "@/lib/types"

// Foundations module — beginner basics (Hangul) and grammar. The lesson CONTENT
// (cards + exercises) lives in the frontend seed (lib/foundations-data.ts) and
// is graded client-side. The backend owns only per-user PROGRESS so completion
// syncs across devices. See the `foundation` domain in the Spring Boot backend.

// One lesson's saved progress for the current user. `progress` is the best
// accuracy (0–100) achieved on that lesson.
export interface FoundationProgress {
  lessonId: string
  track: LearnTrack
  completed: boolean
  progress: number
  attempts: number
}

export const foundationsApi = {
  // The user's progress across every lesson/track (the list page overlays this
  // onto the seed lessons).
  getProgress: () =>
    api.get("/foundations/progress").then((r) => r.data.data) as Promise<FoundationProgress[]>,

  // Persist a locally-graded attempt. The backend keeps the best accuracy and
  // makes completion sticky, then returns the merged progress row.
  saveProgress: (
    lessonId: string,
    body: { track: LearnTrack; accuracy: number; completed: boolean }
  ) =>
    api
      .post(`/foundations/lessons/${encodeURIComponent(lessonId)}/complete`, body)
      .then((r) => r.data.data) as Promise<FoundationProgress>,
}
