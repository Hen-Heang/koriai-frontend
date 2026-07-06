import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"

// Mock Interview / Exam Prep
// The examiner Q&A itself runs over the chat layer (chatApi). These helpers
// keep interview-specific persistence — the written script the candidate
// submits before the exam — in kori_interview_scripts.
export interface InterviewScript {
  topicId: string
  sections: Record<string, string>
  updatedAt: string
}

export const interviewApi = {
  getScript: async (topicId: string): Promise<InterviewScript | null> => {
    const { data, error } = await supabase
      .from("kori_interview_scripts")
      .select("topic_id, sections, updated_at")
      .eq("topic_id", topicId)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return { topicId: data.topic_id, sections: data.sections, updatedAt: data.updated_at }
  },

  saveScript: async (topicId: string, sections: Record<string, string>): Promise<InterviewScript> => {
    const userId = requireUserId()
    const { data, error } = await supabase
      .from("kori_interview_scripts")
      .upsert({ user_id: userId, topic_id: topicId, sections })
      .select("topic_id, sections, updated_at")
      .single()
    if (error) throw error
    return { topicId: data.topic_id, sections: data.sections, updatedAt: data.updated_at }
  },
}
