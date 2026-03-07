"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { Loader2, ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/analyze"

  const handleLogin = async () => {
    setError(null)
    if (!email || !password) {
      setError("Please enter your email and password.")
      return
    }
    setLoading(true)
    const supabase = createClient()
    if (!supabase) { setError("Authentication service unavailable."); setLoading(false); return }
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)
    if (authError) {
      setError(authError.message)
    } else {
      router.push(redirectTo)
      router.refresh()
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#fef3c7]/40 via-background to-[#dbeafe]/20" style={{ top: "4rem" }} />
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-8">
        <div className="absolute left-6 top-6 flex items-center">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
        <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <span className="text-base font-bold text-primary-foreground">S</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold text-foreground leading-none">SellerMentor</span>
              <span className="text-[11px] text-muted-foreground leading-none mt-0.5">Expert product analysis</span>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="text-center">
            <h1 className="text-xl font-bold text-card-foreground">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Log in to your account to continue.</p>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked as boolean)}
              />
              <Label htmlFor="remember" className="text-sm text-muted-foreground font-normal cursor-pointer">
                Remember me
              </Label>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? "Logging in..." : "Log in"}
            </Button>
          </div>


        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {"Don't have an account? "}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </p>
        </div>
      </div>
    </div>
  )
}
