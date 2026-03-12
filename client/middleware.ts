import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = ['/', '/login', '/signup', '/about', '/pricing', '/terms', '/privacy']
const AUTH_PATHS = ['/login', '/signup']
/** After a successful analysis we push here; allow without session so middleware doesn't redirect to login. Data comes from client store. */
const RESULTS_PATH = '/analyze/results'

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => p === pathname || pathname.startsWith(p + '/'))
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname.startsWith(p))
}

function isResultsPath(pathname: string): boolean {
  return pathname === RESULTS_PATH || pathname.startsWith(RESULTS_PATH + '/')
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  response.headers.set('Cache-Control', 'private, no-store')

  const pathname = request.nextUrl.pathname

  try {
    const supabase = createMiddlewareClient(request, response)
    const { data: { session } } = await supabase.auth.getSession()

    if (isAuthPath(pathname)) {
      if (session) {
        const redirectTo = request.nextUrl.searchParams.get('redirect') || '/analyze'
        return NextResponse.redirect(new URL(redirectTo, request.url))
      }
      return response
    }

    if (isPublicPath(pathname) || isResultsPath(pathname)) {
      return response
    }

    if (!session) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return response
  } catch {
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
