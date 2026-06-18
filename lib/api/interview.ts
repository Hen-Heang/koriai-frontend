import { api } from "./client"

// Mock Interview / Exam Prep
// The examiner Q&A itself runs over the chat backend (chatApi). These helpers
// keep interview-specific persistence — the written script the candidate
// submits before the exam — in one place per the api-layer convention.
export interface InterviewScript {
  topicId: string
  sections: Record<string, string>
  updatedAt: string
}

export const interviewApi = {
  getScript: (topicId: string) =>
    api
      .get(`/interview/scripts/${encodeURIComponent(topicId)}`)
      .then((r) => r.data.data) as Promise<InterviewScript | null>,
  saveScript: (topicId: string, sections: Record<string, string>) =>
    api
      .put(`/interview/scripts/${encodeURIComponent(topicId)}`, { sections })
      .then((r) => r.data.data) as Promise<InterviewScript>,
}
