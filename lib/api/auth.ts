import { api } from "./client"

export const authApi = {
  register: (data: {
    email: string
    password: string
    displayName: string
    koreanLevel: string
    country?: string
    nativeLanguage?: string
    occupation?: string
    yearsOfExperience?: number
    learningGoal?: string
  }) => api.post("/auth/register", data).then((r) => r.data.data),

  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data).then((r) => r.data.data),

  loginWithGoogle: (idToken: string) =>
    api.post("/auth/google", { idToken }).then((r) => r.data.data),

  // Revoke the refresh token server-side so it can't be reused after logout.
  logout: (refreshToken: string) =>
    api.post("/auth/logout", { refreshToken }).then((r) => r.data.data),
}
