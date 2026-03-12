import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { createServerClient as createSSRClient } from '@supabase/ssr'

/** Cookie options: production-ready (httpOnly, secure on HTTPS, sameSite). In dev (localhost) secure is false so cookies work over HTTP. */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

type CookieStore = Awaited<ReturnType<typeof import('next/headers').cookies>>

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> }

/**
 * Create a Supabase client for the server.
 * - When cookieStore is provided (e.g. from next/headers cookies()), uses @supabase/ssr
 *   with cookie storage and production-safe options: httpOnly, secure, sameSite: 'lax'.
 * - When called with no args, returns a plain client (e.g. for API routes that use Bearer token).
 */
export async function createClient(cookieStore?: CookieStore | null): Promise<SupabaseClient> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    )
  }

  if (cookieStore) {
    return createSSRClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...COOKIE_OPTIONS, ...options })
            )
          } catch {
            // Ignore in Server Components / middleware where set is not allowed
          }
        },
      },
    })
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

/** Creates a Supabase client with the user's JWT so RLS sees auth.uid(). Use in API routes when you have a Bearer token. */
export function createClientWithToken(accessToken: string): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase env vars.')
  }
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}
