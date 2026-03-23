"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, LogOut, ChevronDown, Sparkles, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { Session } from "@supabase/supabase-js"

const TOOLS_MENU_ITEMS = [
  {
    name: "Listing Copywriter",
    href: "/listing-builder",
    description: "Generate optimized titles, bullets & descriptions for Amazon",
    icon: Sparkles,
  },
  {
    name: "Amazon Starter Guide",
    href: "/guide",
    description: "9-chapter free course for new Amazon FBA sellers — 2026 edition",
    icon: BookOpen,
  },
]

const navigation = [
  { name: "Home", href: "/" },
  { name: "Analyze", href: "/analyze" },
  { name: "Pricing", href: "/pricing" },
  { name: "About", href: "/about" },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    let isMounted = true
    const supabase = createClient()
    if (!supabase) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) setSession(session)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    if (!supabase) return
    await supabase.auth.signOut()
    setMobileOpen(false)
    router.push("/")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">S</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground leading-none">SellerMentor</span>
              <span className="text-[10px] text-muted-foreground leading-none mt-0.5">Expert product analysis</span>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {/* Home */}
          <Link
            href="/"
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/" ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            Home
          </Link>
          {/* Analyze */}
          <Link
            href="/analyze"
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/analyze") ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            Analyze
          </Link>
          {/* TOOLS dropdown */}
          <ToolsDropdown pathname={pathname} />
          {/* Pricing */}
          <Link
            href="/pricing"
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/pricing" ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            Pricing
          </Link>
          {/* About */}
          <Link
            href="/about"
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/about" ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            About
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/account">My Account</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg" asChild>
                <Link href="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="flex items-center justify-center md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden">
          <div className="mx-auto max-w-[1200px] px-6 py-4">
            <nav className="flex flex-col gap-1">
              {navigation.slice(0, 2).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                      ? "text-foreground bg-secondary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.name}
                </Link>
              ))}
              {/* Mobile Tools section */}
              <div className="px-3 pt-2 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Tools</span>
              </div>
              {TOOLS_MENU_ITEMS.map((tool) => (
                <Link
                  key={tool.name}
                  href={tool.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname === tool.href
                      ? "text-foreground bg-secondary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tool.icon className="h-4 w-4 text-primary" />
                  {tool.name}
                </Link>
              ))}
              {navigation.slice(2).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "text-foreground bg-secondary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2 border-t border-border/50 pt-4">
              {session ? (
                <>
                  <Button variant="ghost" size="sm" asChild className="justify-start" onClick={() => setMobileOpen(false)}>
                    <Link href="/account">My Account</Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="justify-start text-muted-foreground hover:text-foreground">
                    <LogOut className="mr-1.5 h-3.5 w-3.5" />
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild className="justify-start" onClick={() => setMobileOpen(false)}>
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg" asChild onClick={() => setMobileOpen(false)}>
                    <Link href="/signup">Get started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

/* ── TOOLS dropdown with glassmorphism ────────────────── */
function ToolsDropdown({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false)
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isActive = TOOLS_MENU_ITEMS.some((t) => pathname.startsWith(t.href))

  const handleEnter = () => {
    if (timeout.current) clearTimeout(timeout.current)
    setOpen(true)
  }
  const handleLeave = () => {
    timeout.current = setTimeout(() => setOpen(false), 150)
  }

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        className={cn(
          "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "text-foreground bg-secondary"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        )}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        Tools
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[100] mt-1.5 w-64 rounded-xl border border-border bg-background/95 p-2 opacity-100 shadow-2xl backdrop-blur-md">
          {TOOLS_MENU_ITEMS.map((tool) => (
            <Link
              key={tool.name}
              href={tool.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors opacity-100",
                pathname === tool.href
                  ? "bg-secondary text-foreground"
                  : "hover:bg-secondary/50 text-foreground"
              )}
            >
              <tool.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-tight">{tool.name}</span>
                <span className="mt-0.5 text-xs text-muted-foreground leading-snug">{tool.description}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
