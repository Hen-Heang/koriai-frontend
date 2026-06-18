import axios from "axios"
import { clearAuth, getRefreshToken, setTokens } from "@/lib/auth-store"

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api"

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  const serverMessage = error.response?.data?.data?.message
  if (typeof serverMessage === "string" && serverMessage.trim()) {
    return serverMessage
  }

  if (!error.response) {
    return `Cannot connect to the backend at ${API_BASE_URL}. Make sure the backend is running and CORS is configured for this frontend origin.`
  }

  return error.message || fallback
}

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("token") : null

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Single-flight refresh: if several requests 401 at once, they all await the same
// refresh call instead of firing N parallel refreshes (which would fail after the
// first because the backend rotates/revokes the refresh token on use).
let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error("No refresh token")
  // Use a bare axios call (not `api`) so this request skips the interceptors and
  // can't recurse into another refresh.
  const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
  const data = res.data.data
  setTokens(data.accessToken, data.refreshToken)
  return data.accessToken as string
}

function forceLogout() {
  clearAuth()
  if (typeof window !== "undefined") {
    window.location.href = "/login"
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const isRefreshCall = typeof original?.url === "string" && original.url.includes("/auth/refresh")

    // On an expired access token, try to silently refresh once, then retry the
    // original request. Only log out if the refresh itself fails.
    if (status === 401 && original && !original._retry && !isRefreshCall) {
      original._retry = true
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null
          })
        }
        const newToken = await refreshPromise
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        forceLogout()
        return Promise.reject(error)
      }
    }

    // Refresh endpoint itself 401'd, or we already retried → session is truly dead.
    if (status === 401) {
      forceLogout()
    }
    return Promise.reject(error)
  }
)

export default api
