import { createClient } from "@supabase/supabase-js"

// Single Supabase client for the whole app (browser-side). KoriAI shares the
// Supabase project with Orbit/DailyGoalMap — KoriAI-owned tables are prefixed
// `kori_`; the goals/tasks domain reuses Orbit's original tables and RPCs.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""

// Fixed storage key so lib/auth-store.ts can read the session synchronously.
export const SUPABASE_STORAGE_KEY = "koriai-auth"

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storageKey: SUPABASE_STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
