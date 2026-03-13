const TOKEN_KEY = "token"
const USER_ID_KEY = "userId"
const EMAIL_KEY = "userEmail"

export function setAuth(token: string, userId: number, email: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_ID_KEY, String(userId))
  localStorage.setItem(EMAIL_KEY, email)
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem(EMAIL_KEY)
}

export function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null
}

export function getUserId(): number | null {
  const id = typeof window !== "undefined" ? localStorage.getItem(USER_ID_KEY) : null
  return id ? Number(id) : null
}

export function isAuthenticated(): boolean {
  return Boolean(getToken())
}