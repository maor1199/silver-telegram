"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/**
 * Redirects to /login with ?redirect=<current path> if user is not signed in.
 * Use on pages that require authentication (e.g. Analyze, Listing Builder).
 * @returns loading - true while checking auth; when false, either redirect happened or user is signed in
 */
export function useRequireAuth() {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || "/")}`)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname || "/")}`)
        return
      }
      setLoading(false)
    })
  }, [router, pathname])

  return { loading }
}
