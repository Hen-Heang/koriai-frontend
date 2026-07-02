// Push notifications (browser Web Push). KoriAI's own dedicated pipeline —
// separate from Orbit/dailygoalmap's: subscriptions live in
// `public.kori_push_subscriptions` (RLS: owner-only), keyed to KoriAI's own
// VAPID identity, and delivery goes through the `kori-send-push` Edge
// Function. Telegram linking is a separate Orbit feature (send-telegram /
// telegram-webhook) not yet wired into KoriAI's UI — left as "not configured".
import { supabase } from "@/lib/supabase"
import { getUserId } from "@/lib/auth-store"

export interface TelegramLink {
  deepLink: string | null
  code: string
  botUsername: string | null
}

// Browser PushSubscription.toJSON() shape.
export interface WebPushSubscriptionJSON {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

const TELEGRAM_UNAVAILABLE = "Telegram linking is not available yet in KoriAI."

export const pushApi = {
  // ── Telegram (deferred — Orbit's send-telegram/telegram-webhook aren't
  // wired into KoriAI's account-linking UI yet) ──
  telegramLink: async (): Promise<TelegramLink> => {
    throw new Error(TELEGRAM_UNAVAILABLE)
  },
  telegramStatus: async (): Promise<{ linked: boolean }> => ({ linked: false }),
  telegramUnlink: async () => undefined,

  // ── Web Push ──
  vapidPublicKey: async (): Promise<{ publicKey: string }> => {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_KEY ?? ""
    if (!publicKey) throw new Error("Web Push is not configured (missing VAPID key).")
    return { publicKey }
  },

  webSubscribe: async (sub: WebPushSubscriptionJSON) => {
    const userId = getUserId()
    if (!userId) throw new Error("Not signed in")
    const { error } = await supabase.from("kori_push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth_key: sub.keys.auth,
      },
      { onConflict: "endpoint" },
    )
    if (error) throw error
  },

  webUnsubscribe: async (endpoint: string) => {
    const userId = getUserId()
    if (!userId) return
    await supabase.from("kori_push_subscriptions").delete().eq("user_id", userId).eq("endpoint", endpoint)
  },

  // Sends a real push to the current user via KoriAI's own `kori-send-push`
  // function — used by the Settings page's "send test notification" action.
  sendTest: async () => {
    const userId = getUserId()
    if (!userId) throw new Error("Not signed in")
    const { data, error } = await supabase.functions.invoke("kori-send-push", {
      body: {
        userId,
        title: "KoriAI",
        body: "Push notifications are working 🎉",
        url: "/settings",
        tag: "koriai-test",
      },
    })
    if (error) throw error
    return data as { sent: number; total: number; removedStale: number }
  },
}

/* ── Spring backend implementation (kept for later restore) ──────────────────
import { api } from "./client"

export const pushApi = {
  telegramLink: () => api.post("/push/telegram/link").then((r) => r.data.data),
  telegramStatus: () => api.get("/push/telegram/status").then((r) => r.data.data),
  telegramUnlink: () => api.delete("/push/telegram").then((r) => r.data.data),
  vapidPublicKey: () => api.get("/push/web/vapid-public-key").then((r) => r.data.data),
  webSubscribe: (sub: WebPushSubscriptionJSON) => api.post("/push/web/subscribe", sub).then((r) => r.data.data),
  webUnsubscribe: (endpoint: string) => api.post("/push/web/unsubscribe", { endpoint }).then((r) => r.data.data),
}
────────────────────────────────────────────────────────────────────────────── */
