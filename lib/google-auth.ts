import { authApi } from "@/lib/api"
import { setAuth } from "@/lib/auth-store"

const GIS_SRC = "https://accounts.google.com/gsi/client"

let scriptPromise: Promise<void> | null = null

/** Loads the Google Identity Services script once and resolves when ready. */
export function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }
    const script = document.createElement("script")
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"))
    document.head.appendChild(script)
  })
  return scriptPromise
}

/**
 * Produces a nonce pair for the Google One Tap flow. Google is initialized with the
 * SHA-256 hash; the raw value can be forwarded to the backend to confirm they match
 * (replay protection).
 */
export async function makeNonce(): Promise<{ nonce: string; hashedNonce: string }> {
  const random = crypto.getRandomValues(new Uint8Array(32))
  const nonce = btoa(String.fromCharCode(...random)).replace(/[+/=]/g, "")
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(nonce))
  const hashedNonce = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  return { nonce, hashedNonce }
}

export interface GoogleSessionResult {
  accessToken: string
  userId: number
  email: string
}

/**
 * Establishes a Spring-JWT session from a Google credential (ID token): the kori
 * backend verifies the token, finds-or-creates the user by email, and returns the
 * same JWT the email/password flow issues. One backend, one identity.
 *
 * `rawNonce` is accepted so the backend can verify it against the hashed nonce
 * Google was initialized with (replay protection) once that check is wired.
 */
export async function handleGoogleCredential(
  credential: string,
  _rawNonce: string,
): Promise<GoogleSessionResult> {
  const data = (await authApi.loginWithGoogle(credential)) as GoogleSessionResult
  setAuth(data.accessToken, data.userId, data.email)
  return data
}
