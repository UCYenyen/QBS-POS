import { NextRequest, NextResponse } from "next/server"

const AUTH_ROUTES = new Set(["/signin", "/signup"])

function hasAuthCookie(request: NextRequest) {
  return (
    request.cookies.has("better-auth.session_token") ||
    request.cookies.has("__Secure-better-auth.session_token") ||
    request.cookies.has("better-auth-session_token") ||
    request.cookies.has("__Secure-better-auth-session_token")
  )
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const isAuthenticated = hasAuthCookie(request)

  const isAuthRoute = AUTH_ROUTES.has(pathname)

  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (!isAuthenticated && !isAuthRoute) {
    const signInUrl = new URL("/signin", request.url)
    const nextPath = `${pathname}${search}`

    if (nextPath !== "/") {
      signInUrl.searchParams.set("next", nextPath)
    }

    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
