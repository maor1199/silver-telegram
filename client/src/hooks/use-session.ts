"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Session } from "@supabase/supabase-js"

/**
 * Returns the current Supabase session (and token) for use in API calls.
 * Use this so the analyze page and other auth-dependent code share the same session.
 */
export function useSession(): { session: Session | null; loading: boolean; hasSupabase: boolean } {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const hasSupabase = !!supabase

  useEffect(() => {
    if (!supabase) {
      setSession(null)
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  return { session, loading, hasSupabase }
}
