"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { Loader2, ArrowLeft } from "lucide-react"

export default function SignupPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSignup = async () => {
    setError(null)
    if (!form.email || !form.password) {
      setError("Please fill in all required fields.")
      return
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (!form.acceptTerms) {
      setError("You must accept the Terms of Service.")
      return
    }
    setLoading(true)
    const supabase = createClient()
    if (!supabase) { setError("Authentication service unavailable."); setLoading(false); return }
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${window.location.origin}/analyze`,
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
        },
      },
    })

    if (signUpError) {
      setLoading(false)
      setError(signUpError.message)
      return
    }

    // Auto-login immediately after signup
    const { error: signInError } = await supabase!.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    setLoading(false)

    if (signInError) {
      // Signup succeeded but auto-login failed — still show success
      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
        router.refresh()
      }, 1000)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push("/analyze")
      router.refresh()
    }, 1000)
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#fef3c7]/40 via-background to-[#dbeafe]/20" style={{ top: "4rem" }} />
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12">
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
            <h1 className="text-xl font-bold text-card-foreground">Create your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Start validating products in minutes.</p>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={form.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
              />
              {form.password.length > 0 && form.password.length < 8 && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  {8 - form.password.length} more character{8 - form.password.length !== 1 ? "s" : ""} needed
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
              />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={form.acceptTerms}
                onCheckedChange={(checked) => updateField("acceptTerms", checked as boolean)}
                className="mt-0.5"
              />
              <Label htmlFor="terms" className="text-sm text-muted-foreground font-normal cursor-pointer leading-relaxed">
                {"I agree to the "}
                <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                {" and "}
                <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </Label>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
                Account created successfully
              </div>
            )}

            <Button
              className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              onClick={handleSignup}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </div>


        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </p>
        </div>
      </div>
    </div>
  )
}
