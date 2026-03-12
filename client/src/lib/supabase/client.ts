import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/**
 * Browser Supabase client. Uses @supabase/ssr so the session is stored in cookies,
 * which persist on the production domain and are sent with same-origin API requests.
 */
export function createClient(): SupabaseClient | null {
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return client
}
