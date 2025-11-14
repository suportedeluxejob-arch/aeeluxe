"use client"

const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

interface AdminSession {
  authenticated: boolean
  timestamp: number
}

export function setAdminSession() {
  const session: AdminSession = {
    authenticated: true,
    timestamp: Date.now(),
  }

  // Set cookie with secure options
  document.cookie = `admin_session=${JSON.stringify(session)}; path=/; max-age=${SESSION_DURATION / 1000}; SameSite=Strict${
    window.location.protocol === "https:" ? "; Secure" : ""
  }`
}

export function getAdminSession(): boolean {
  if (typeof window === "undefined") return false

  const cookies = document.cookie.split("; ")
  const sessionCookie = cookies.find((cookie) => cookie.startsWith("admin_session="))

  if (!sessionCookie) return false

  try {
    const sessionStr = sessionCookie.split("=")[1]
    const session: AdminSession = JSON.parse(decodeURIComponent(sessionStr))
    const isExpired = Date.now() - session.timestamp > SESSION_DURATION

    if (isExpired) {
      clearAdminSession()
      return false
    }

    return session.authenticated
  } catch {
    return false
  }
}

export function clearAdminSession() {
  document.cookie = "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
}
