import { api } from "./client"

// Push notifications (browser Web Push + Telegram). Backend domain/push is already
// wired into the notification dispatcher; these are the client endpoints.
export interface TelegramLink {
  deepLink: string | null
  code: string
  botUsername: string | null
}

// Browser PushSubscription.toJSON() shape — POSTed verbatim to the backend.
export interface WebPushSubscriptionJSON {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export const pushApi = {
  // ── Telegram ──
  telegramLink: () =>
    api.post("/push/telegram/link").then((r) => r.data.data) as Promise<TelegramLink>,
  telegramStatus: () =>
    api.get("/push/telegram/status").then((r) => r.data.data) as Promise<{ linked: boolean }>,
  telegramUnlink: () => api.delete("/push/telegram").then((r) => r.data.data),

  // ── Web Push ──
  vapidPublicKey: () =>
    api.get("/push/web/vapid-public-key").then((r) => r.data.data) as Promise<{ publicKey: string }>,
  webSubscribe: (sub: WebPushSubscriptionJSON) =>
    api.post("/push/web/subscribe", sub).then((r) => r.data.data),
  webUnsubscribe: (endpoint: string) =>
    api.post("/push/web/unsubscribe", { endpoint }).then((r) => r.data.data),
}
