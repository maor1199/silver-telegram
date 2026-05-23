"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Menu, X, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { Session } from "@supabase/supabase-js"

// ─── Navbar ────────────────────────────────────────────────────────────────────
// Intentionally minimal. The nav does one thing: orient the user and authenticate.
// Product navigation happens inside the app, not from a mega-menu.

const NAV_LINKS = [
  { label: "Command Center", href: "/dashboard" },
  { label: "Pricing",        href: "/pricing"   },
]

export function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [session,    setSession]    = useState<Session | null>(null)

  useEffect(() => {
    let mounted = true
    const supabase = createClient()
    if (!supabase) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (mounted) setSession(s)
    })

    return () => { mounted = false; subscription.unsubscribe() }
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    if (!supabase) return
    await supabase.auth.signOut()
    setMobileOpen(false)
    router.push("/")
    router.refresh()
  }

  const isInsideApp = pathname.startsWith("/dashboard") ||
    pathname.startsWith("/inventory") || pathname.startsWith("/profit") ||
    pathname.startsWith("/advisor")   || pathname.startsWith("/data")   ||
    pathname.startsWith("/account")   || pathname.startsWith("/analyze") ||
    pathname.startsWith("/listing-builder")

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <span className="text-xs font-bold text-primary-foreground">S</span>
          </div>
          <span className="text-sm font-semibold text-foreground">SellerMentor</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                  ? "text-foreground bg-secondary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop auth */}
        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <>
              {!isInsideApp && (
                <Link
                  href="/dashboard"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="flex items-center justify-center md:hidden text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden">
          <div className="mx-auto max-w-[1200px] px-6 py-4 flex flex-col gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname.startsWith(link.href)
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-3 pt-3 border-t border-border/50 flex flex-col gap-1">
              {session ? (
                <>
                  <Link href="/account" onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    My Account
                  </Link>
                  <button onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors text-left">
                    <LogOut className="h-3.5 w-3.5" /> Log out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Log in
                  </Link>
                  <Link href="/signup" onClick={() => setMobileOpen(false)}
                    className="rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors text-center">
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
