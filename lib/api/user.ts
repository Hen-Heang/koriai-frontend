import { supabase } from "@/lib/supabase"
import { getUserEmail } from "@/lib/auth-store"

// User profile over kori_profiles (snake_case columns mapped to the camelCase
// shapes the pages already consume). Avatars live in the public `kori-avatars`
// storage bucket under <user_id>/avatar.

export interface SearchUser {
  id: string
  displayName: string | null
  email: string | null
  avatarUrl: string | null
}

type ProfileRow = {
  id: string
  display_name: string | null
  korean_level: string | null
  country: string | null
  native_language: string | null
  occupation: string | null
  years_of_experience: number | null
  learning_goal: string | null
  preferred_model: string | null
  study_reminders_enabled: boolean
  study_reminder_hour: number | null
  avatar_url: string | null
}

function toCamel(row: ProfileRow | null) {
  return {
    id: row?.id ?? null,
    displayName: row?.display_name ?? null,
    email: getUserEmail(),
    koreanLevel: row?.korean_level ?? "BEGINNER",
    country: row?.country ?? null,
    nativeLanguage: row?.native_language ?? null,
    occupation: row?.occupation ?? null,
    yearsOfExperience: row?.years_of_experience ?? null,
    learningGoal: row?.learning_goal ?? null,
    preferredModel: row?.preferred_model ?? null,
    studyRemindersEnabled: row?.study_reminders_enabled ?? false,
    studyReminderHour: row?.study_reminder_hour ?? 20,
    hasProfileImage: Boolean(row?.avatar_url),
    avatarUrl: row?.avatar_url ?? null,
  }
}

export const userApi = {
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("kori_profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) throw error
    return toCamel(data as ProfileRow | null)
  },

  // Goal-sharing user lookup — reuses Orbit's search_users_profile RPC (matches
  // display names in the shared user_profiles table, excludes the caller).
  search: async (query: string): Promise<SearchUser[]> => {
    const { data, error } = await supabase.rpc("search_users_profile", {
      p_query: query,
      p_limit: 10,
    })
    if (error) throw error
    type Row = { id: string; display_name?: string | null; email?: string | null; avatar_url?: string | null }
    return ((data ?? []) as Row[]).map((u) => ({
      id: u.id,
      displayName: u.display_name ?? null,
      email: u.email ?? null,
      avatarUrl: u.avatar_url ?? null,
    }))
  },

  updateProfile: async (
    id: string,
    data: {
      displayName: string
      koreanLevel: string
      country?: string
      nativeLanguage?: string
      occupation?: string
      yearsOfExperience?: number
      learningGoal?: string
    }
  ) => {
    const { error } = await supabase.from("kori_profiles").upsert({
      id,
      display_name: data.displayName,
      korean_level: data.koreanLevel,
      country: data.country ?? null,
      native_language: data.nativeLanguage ?? null,
      occupation: data.occupation ?? null,
      years_of_experience: data.yearsOfExperience ?? null,
      learning_goal: data.learningGoal ?? null,
    })
    if (error) throw error
  },

  // Partial upsert (only these two columns) so it's safe to call for a
  // brand-new profile row without clobbering fields the full-form
  // updateProfile() above would otherwise null out.
  completeOnboarding: async (id: string, data: { koreanLevel: string; learningGoal: string }) => {
    const { error } = await supabase.from("kori_profiles").upsert({
      id,
      korean_level: data.koreanLevel,
      learning_goal: data.learningGoal,
    })
    if (error) throw error
  },

  updatePreferredModel: async (id: string, preferredModel: string) => {
    const { error } = await supabase
      .from("kori_profiles")
      .update({ preferred_model: preferredModel })
      .eq("id", id)
    if (error) throw error
  },

  updateStudyReminders: async (id: string, enabled: boolean, hour: number) => {
    const { error } = await supabase
      .from("kori_profiles")
      .update({ study_reminders_enabled: enabled, study_reminder_hour: hour })
      .eq("id", id)
    if (error) throw error
  },

  uploadProfileImage: async (id: string, file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const path = `${id}/avatar.${ext}`
    const { error } = await supabase.storage
      .from("kori-avatars")
      .upload(path, file, { upsert: true, contentType: file.type })
    if (error) throw error
    const { data } = supabase.storage.from("kori-avatars").getPublicUrl(path)
    // Cache-bust so the <img> refreshes after re-upload of the same path.
    const url = `${data.publicUrl}?v=${Date.now()}`
    const { error: profileError } = await supabase
      .from("kori_profiles")
      .upsert({ id, avatar_url: url })
    if (profileError) throw profileError
    return url
  },

  getProfileImageUrl: async (id: string): Promise<string> => {
    const { data, error } = await supabase
      .from("kori_profiles")
      .select("avatar_url")
      .eq("id", id)
      .maybeSingle()
    if (error) throw error
    if (!data?.avatar_url) throw new Error("No profile image")
    return data.avatar_url
  },
}

export interface LevelSuggestion {
  currentLevel: string
  suggestedLevel: string | null
  upgradeAvailable: boolean
  reason: string
  streakDays: number
  wordsSaved: number
  avgVocabMastery: number
  avgCorrectionRating: number
}

const LEVEL_ORDER = ["BEGINNER", "INTERMEDIATE", "ADVANCED"]

// Suggests leveling BEGINNER -> INTERMEDIATE -> ADVANCED from real vocab-mastery
// data. Computed client-side from Supabase now (the Spring version also folded in
// grammar accuracy); never downgrades.
export const levelApi = {
  getSuggestion: async (): Promise<LevelSuggestion> => {
    const [{ data: profile }, { data: vocab }] = await Promise.all([
      supabase.from("kori_profiles").select("korean_level").maybeSingle(),
      supabase.from("kori_vocab_cards").select("mastery"),
    ])
    const currentLevel = profile?.korean_level ?? "BEGINNER"
    const words = vocab ?? []
    const avgMastery = words.length
      ? words.reduce((s, w) => s + (w.mastery ?? 0), 0) / words.length
      : 0
    const idx = LEVEL_ORDER.indexOf(currentLevel)
    const canUpgrade = idx >= 0 && idx < LEVEL_ORDER.length - 1
    const qualified = words.length >= 50 && avgMastery >= 60
    return {
      currentLevel,
      suggestedLevel: canUpgrade && qualified ? LEVEL_ORDER[idx + 1] : null,
      upgradeAvailable: canUpgrade && qualified,
      reason: qualified
        ? "Strong vocabulary mastery — ready for the next level."
        : "Keep building vocabulary mastery to unlock the next level.",
      streakDays: 0,
      wordsSaved: words.length,
      avgVocabMastery: Math.round(avgMastery),
      avgCorrectionRating: 0,
    }
  },
  apply: async (level: string) => {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) throw new Error("Not signed in")
    const { error } = await supabase
      .from("kori_profiles")
      .upsert({ id: auth.user.id, korean_level: level })
    if (error) throw error
  },
}

/* ── Spring backend implementation (kept for later restore) ──────────────────
import { api } from "./client"

export const userApi = {
  getById: (id: number) =>
    api.get(`/users/${id}`).then((r) => r.data.data),
  search: (query: string) =>
    api.get("/users/search", { params: { q: query } }).then((r) => r.data.data),
  updateProfile: (id: number, data: { displayName: string; koreanLevel: string; country?: string; nativeLanguage?: string; occupation?: string; yearsOfExperience?: number; learningGoal?: string }) =>
    api.put(`/users/${id}/profile`, data).then((r) => r.data.data),
  updatePreferredModel: (id: number, preferredModel: string) =>
    api.put(`/users/${id}/preferred-model`, { preferredModel }).then((r) => r.data.data),
  updateStudyReminders: (id: number, enabled: boolean, hour: number) =>
    api.put(`/users/${id}/study-reminders`, { enabled, hour }).then((r) => r.data.data),
  uploadProfileImage: (id: number, file: File) => {
    const form = new FormData()
    form.append("file", file)
    return api.post(`/users/${id}/profile-image`, form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data.data)
  },
  getProfileImageUrl: async (id: number): Promise<string> => {
    const response = await api.get(`/users/${id}/profile-image`, { responseType: "blob" })
    return URL.createObjectURL(response.data)
  },
}

export const levelApi = {
  getSuggestion: () =>
    api.get("/users/level/suggestion").then((r) => r.data.data) as Promise<LevelSuggestion>,
  apply: (level: string) =>
    api.post("/users/level/apply", { level }).then((r) => r.data.data),
}
────────────────────────────────────────────────────────────────────────────── */
