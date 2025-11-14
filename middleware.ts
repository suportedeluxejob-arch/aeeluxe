import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { rateLimiters } from "./lib/rate-limit"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get client identifier (IP or user ID from cookie)
  const identifier = request.ip || request.headers.get("x-forwarded-for") || "anonymous"

  if (pathname.startsWith("/admin")) {
    // Allow access to login page
    if (pathname === "/admin/login") {
      // If already has session, redirect to dashboard
      const adminSession = request.cookies.get("admin_session")
      if (adminSession?.value) {
        try {
          const session = JSON.parse(adminSession.value)
          const isExpired = Date.now() - session.timestamp > 24 * 60 * 60 * 1000 // 24 hours

          if (!isExpired && session.authenticated) {
            return NextResponse.redirect(new URL("/admin", request.url))
          }
        } catch {
          // Invalid session, allow access to login
        }
      }
      return NextResponse.next()
    }

    // For all other admin routes, verify session
    const adminSession = request.cookies.get("admin_session")

    if (!adminSession?.value) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    try {
      const session = JSON.parse(adminSession.value)
      const isExpired = Date.now() - session.timestamp > 24 * 60 * 60 * 1000 // 24 hours

      if (isExpired || !session.authenticated) {
        const response = NextResponse.redirect(new URL("/admin/login", request.url))
        response.cookies.delete("admin_session")
        return response
      }

      // Session is valid, allow access
      return NextResponse.next()
    } catch {
      // Invalid session format, redirect to login
      const response = NextResponse.redirect(new URL("/admin/login", request.url))
      response.cookies.delete("admin_session")
      return response
    }
  }

  // Apply rate limiting to API routes
  if (pathname.startsWith("/api/")) {
    const rateLimitResult = await rateLimiters.apiGeneral.check(identifier, "api")

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
          resetAt: rateLimitResult.resetAt,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(rateLimiters.apiGeneral["config"].limit),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": String(rateLimitResult.resetAt),
            "Retry-After": String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
          },
        },
      )
    }

    // Add rate limit headers to response
    const response = NextResponse.next()
    response.headers.set("X-RateLimit-Limit", String(rateLimiters.apiGeneral["config"].limit))
    response.headers.set("X-RateLimit-Remaining", String(rateLimitResult.remaining))
    response.headers.set("X-RateLimit-Reset", String(rateLimitResult.resetAt))

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
}
