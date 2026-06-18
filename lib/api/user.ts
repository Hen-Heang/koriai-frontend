import { api } from "./client"

export interface SearchUser {
  id: number
  displayName: string | null
  email: string | null
  avatarUrl: string | null
}

export const userApi = {
  getById: (id: number) =>
    api.get(`/users/${id}`).then((r) => r.data.data),

  // Goal-sharing user lookup — backend excludes the current user. Used by the
  // invite-member flow on the goal detail page.
  search: (query: string) =>
    api
      .get("/users/search", { params: { q: query } })
      .then((r) => r.data.data) as Promise<SearchUser[]>,

  updateProfile: (
    id: number,
    data: {
      displayName: string
      koreanLevel: string
      country?: string
      nativeLanguage?: string
      occupation?: string
      yearsOfExperience?: number
      learningGoal?: string
    }
  ) => api.put(`/users/${id}/profile`, data).then((r) => r.data.data),

  updatePreferredModel: (id: number, preferredModel: string) =>
    api.put(`/users/${id}/preferred-model`, { preferredModel }).then((r) => r.data.data),

  // Daily study-reminder prefs (reviews-due + streak-saver). `hour` is the local
  // (Seoul) hour-of-day for the reviews-due nudge; backend StudyReminderScheduler reads these.
  updateStudyReminders: (id: number, enabled: boolean, hour: number) =>
    api.put(`/users/${id}/study-reminders`, { enabled, hour }).then((r) => r.data.data),

  uploadProfileImage: (id: number, file: File) => {
    const form = new FormData()
    form.append("file", file)
    return api
      .post(`/users/${id}/profile-image`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data)
  },

  // The image endpoint is auth-protected, so fetch it as a blob (token attached
  // by the interceptor) and return an object URL the <img> tag can render.
  getProfileImageUrl: async (id: number): Promise<string> => {
    const response = await api.get(`/users/${id}/profile-image`, { responseType: "blob" })
    return URL.createObjectURL(response.data)
  },
}
