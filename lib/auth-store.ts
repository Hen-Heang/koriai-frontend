const TOKEN_KEY = "token"
const REFRESH_TOKEN_KEY = "refreshToken"
const USER_ID_KEY = "userId"
const EMAIL_KEY = "userEmail"

export function setAuth(token: string, refreshToken: string, userId: number, email: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  localStorage.setItem(USER_ID_KEY, String(userId))
  localStorage.setItem(EMAIL_KEY, email)
}

/**
 * Updates just the tokens after a silent refresh. The backend rotates the refresh
 * token on every refresh, so we always overwrite the stored one — keeping the old
 * value would make the next refresh fail.
 */
export function setTokens(token: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem(EMAIL_KEY)
}

export function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null
}

export function getRefreshToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(REFRESH_TOKEN_KEY) : null
}

export function getUserId(): number | null {
  const id = typeof window !== "undefined" ? localStorage.getItem(USER_ID_KEY) : null
  return id ? Number(id) : null
}

export function isAuthenticated(): boolean {
  return Boolean(getToken())
}
