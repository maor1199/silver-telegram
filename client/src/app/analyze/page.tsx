"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ArrowRight, AlertCircle, Loader2 } from "lucide-react"
import { setAnalysisResult } from "@/lib/analysis-store"
import { runAnalysis, UsageLimitError, AuthRequiredError } from "@/lib/analysisApi"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useSession } from "@/hooks/use-session"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export const dynamic = 'force-dynamic';
const TOTAL_STEPS = 6   // was 7 — manufacturing + shipping merged into one step

const GENERIC_DIFF_WORDS = ["quality", "premium", "best", "good", "better", "unique", "great", "special", "excellent", "high quality", "top", "superior", "amazing", "nice", "perfect"]

function getDiffQuality(text: string): { level: "empty" | "weak" | "vague" | "ok" | "strong"; message: string } {
  const t = text.trim()
  if (!t) return { level: "empty", message: "" }
  if (t.length < 20) return { level: "weak", message: "⚠ Too short — add the specific problem your product solves" }
  const lower = t.toLowerCase()
  const wordCount = t.split(/\s+/).length
  const hasGeneric = GENERIC_DIFF_WORDS.some((w) => lower.includes(w))
  if (wordCount <= 3 && hasGeneric) return { level: "vague", message: "⚠ Too generic — 'premium/quality/best' don't help. What specific problem do you solve?" }
  if (t.length >= 60) return { level: "strong", message: "✓ Specific — the system can use this for a real differentiation analysis" }
  if (t.length >= 35) return { level: "ok", message: "→ Good start — add what complaint you fix for an even stronger analysis" }
  return { level: "ok", message: "→ A bit more detail will give you the best advice" }
}

export default function AnalyzePage() {
  // No auth gate on the form itself — anyone can fill it out.
  // We gate only the results (after submit) to drive sign-ups.
  const { session, hasSupabase } = useSession()
  const authLoading = false  // no longer blocking the form
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    product: "",
    asin: "",
    manufacturingCost: "",
    shippingCost: "",
    sellingPrice: "",
    advantage: "",
    complexity: "",
    moq: "",
    leadTimeWeeks: "",
    sampleCost: "",
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState(0)
  const [progressWidth, setProgressWidth] = useState(0)
  const [apiError, setApiError] = useState<string | null>(null)
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [showSignupGate, setShowSignupGate] = useState(false)

  // Show welcome hint only on first visit (after signup redirect)
  useEffect(() => {
    if (typeof window === "undefined") return
    const seen = sessionStorage.getItem("welcome-seen")
    if (!seen) {
      setShowWelcome(true)
      sessionStorage.setItem("welcome-seen", "1")
    }
  }, [])
  const router = useRouter()

  const analysisMessages = [
    "Scanning competitive landscape...",
    "Modeling unit economics...",
    "Estimating PPC pressure...",
    "Evaluating risk signals...",
    "Analyzing customer sentiment...",
    "Scoring differentiation angles...",
    "Generating advisor memo...",
    "Finalizing GO / NO-GO verdict...",
  ]

  /* ─── Analyzing animation ────────────────────────────── */
  useEffect(() => {
    if (isAnalyzing) {
      const progressInterval = setInterval(() => {
        setProgressWidth((prev) => {
          if (prev >= 90) { clearInterval(progressInterval); return 90 }
          return prev + 0.3
        })
      }, 100)

      const messageInterval = setInterval(() => {
        setAnalysisStep((prev) => (prev + 1) % analysisMessages.length)
      }, 2800)

      return () => {
        clearInterval(progressInterval)
        clearInterval(messageInterval)
      }
    }
  }, [isAnalyzing, analysisMessages.length])

  /* ─── Enter key to advance ────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey || isAnalyzing) return
      // Don't auto-submit on textarea (step 5)
      if (document.activeElement?.tagName === "TEXTAREA") return
      if (isStepValid()) handleContinue()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  /* ─── Step validation ─────────────────────────────────── */
  const isStepValid = () => {
    switch (step) {
      case 1: return formData.product.trim().length > 0
      case 2: return formData.manufacturingCost.trim().length > 0   // shipping can be 0
      case 3: return formData.sellingPrice.trim().length > 0
      case 4: return true  // advantage is optional
      case 5: return formData.complexity.length > 0
      case 6: return true  // supplier fields are optional
      default: return false
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  /* ─── Submit handler ──────────────────────────────────── */
  const handleContinue = async () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1)
      return
    }

    // Final step — check login first, gate if not logged in
    if (!session) {
      // Save form so it survives the signup redirect
      try { sessionStorage.setItem("analyze-form-draft", JSON.stringify(formData)) } catch { /* ignore */ }
      setShowSignupGate(true)
      return
    }

    setIsAnalyzing(true)
    setApiError(null)
    setProgressWidth(0)
    setAnalysisStep(0)

    if (!hasSupabase) {
      setApiError("Sign-in is not available. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY and redeploy.")
      setIsAnalyzing(false)
      setProgressWidth(0)
      return
    }
    const supabase = createClient()
    let token = session?.access_token?.trim() || undefined
    if (!token && supabase) {
      const { data: { session: s1 } } = await supabase.auth.getSession()
      token = s1?.access_token?.trim() || undefined
    }
    if (!token && supabase) {
      await supabase.auth.refreshSession()
      const { data: { session: s2 } } = await supabase.auth.getSession()
      token = s2?.access_token?.trim() || undefined
    }

    const runRequest = (accessToken?: string | null) =>
      runAnalysis(
        {
          keyword:         formData.product,
          sellingPrice:    Number(formData.sellingPrice)      || 0,
          unitCost:        Number(formData.manufacturingCost) || 0,
          shippingCost:    Number(formData.shippingCost)      || 0,
          differentiation: formData.advantage    || undefined,
          complexity:      formData.complexity   || undefined,
          asin:            formData.asin         || undefined,
          moq:             formData.moq          ? Number(formData.moq)          : undefined,
          leadTimeWeeks:   formData.leadTimeWeeks? Number(formData.leadTimeWeeks): undefined,
          sampleCost:      formData.sampleCost   ? Number(formData.sampleCost)   : undefined,
        },
        { accessToken: accessToken || undefined }
      )

    try {
      let result: Record<string, unknown>
      try {
        result = await runRequest(token) as Record<string, unknown>
      } catch (firstErr) {
        if (!(firstErr instanceof AuthRequiredError) || !supabase) throw firstErr
        await supabase.auth.refreshSession()
        const { data: { session: refreshed } } = await supabase.auth.getSession()
        result = await runRequest(refreshed?.access_token) as Record<string, unknown>
      }

      setAnalysisResult(result)
      setProgressWidth(100)
      await new Promise((resolve) => setTimeout(resolve, 600))
      router.push("/analyze/results")
    } catch (err) {
      setIsAnalyzing(false)
      setProgressWidth(0)
      if (err instanceof UsageLimitError) {
        setShowUsageLimitModal(true)
      } else if (err instanceof AuthRequiredError) {
        setApiError(err.message + " Click 'Sign in again' below to re-authenticate.")
        // Don't auto-redirect; let user click so they see the message and can retry after signing in
        try {
          sessionStorage.setItem("analyze-form-draft", JSON.stringify(formData))
        } catch {
          /* ignore */
        }
      } else {
        setApiError(err instanceof Error ? err.message : "Analysis failed — unable to reach engine")
      }
    }
  }

  /* Restore form draft after login redirect (no data loss) */
  useEffect(() => {
    if (authLoading || !session) return
    try {
      const raw = sessionStorage.getItem("analyze-form-draft")
      if (raw) {
        const draft = JSON.parse(raw) as typeof formData
        if (draft && typeof draft === "object") {
          setFormData((prev) => ({ ...prev, ...draft }))
        }
        sessionStorage.removeItem("analyze-form-draft")
      }
    } catch {
      sessionStorage.removeItem("analyze-form-draft")
    }
  }, [authLoading, session])

  /* ─── Signup Gate — shown after completing the form without a session ─── */
  if (showSignupGate) {
    return (
      <div className="relative flex min-h-screen flex-col">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#fef3c7]/60 via-background to-[#dbeafe]/30" />
        <Navbar />
        <main className="relative flex-1 flex items-center justify-center">
          <div className="mx-auto w-full max-w-md px-6 py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Icon */}
            <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              Your analysis is ready to run
            </h2>
            <p className="mt-3 text-base text-muted-foreground leading-relaxed">
              Create a free account to see your <span className="font-semibold text-foreground">GO / NO-GO verdict</span> with full profit math, competition score, and advisor memo.
            </p>

            {/* Summary pill */}
            <div className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-foreground">
                Analyzing: <span className="text-primary">{formData.product || "your product"}</span>
              </span>
            </div>

            {/* What they get */}
            <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Your free report includes</p>
              <ul className="flex flex-col gap-2.5">
                {[
                  "GO / NO-GO verdict with the math behind it",
                  "Full unit economics (FBA fees, PPC, net profit per unit)",
                  "Competition depth + market entry difficulty",
                  "Fix-It Calculator if verdict is NO-GO",
                  "Advisor memo with your next 3 action steps",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-foreground">
                    <span className="text-primary font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <Button
                className="h-12 w-full rounded-xl text-base font-semibold"
                onClick={() => router.push(`/signup?redirect=${encodeURIComponent("/analyze")}`)}
              >
                Create free account — see my results
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => router.push(`/login?redirect=${encodeURIComponent("/analyze")}`)}
              >
                Already have an account? Log in
              </Button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground/60">
              No credit card required · 5 free analyses · Takes 10 seconds to sign up
            </p>
          </div>
        </main>
      </div>
    )
  }

  /* ─── Analysis Loading State ────────────────────────────── */
  if (isAnalyzing) {
    return (
      <div className="relative flex min-h-screen flex-col">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#fef3c7]/60 via-background to-[#dbeafe]/30" />
        <Navbar />
        <main className="relative flex-1 flex items-center justify-center">
          <div className="mx-auto w-full max-w-lg px-6 py-20 text-center animate-in fade-in duration-500">
            {/* Pulsing icon */}
            <div className="relative mx-auto mb-10 w-fit">
              <div className="absolute -inset-4 animate-pulse rounded-full bg-primary/5" />
              <div className="absolute -inset-2 animate-pulse rounded-full bg-primary/8 [animation-delay:400ms]" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-card shadow-sm">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Running full analysis...
            </h2>
            <p className="mt-3 text-base text-muted-foreground leading-relaxed">
              The advisor is evaluating profitability, competition, PPC pressure, and risks.
            </p>

            {/* Progress bar */}
            <div className="mt-10 w-full">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-200 ease-linear"
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
            </div>

            {/* Rotating message */}
            <div className="mt-8 flex h-12 items-center justify-center">
              <p
                key={analysisStep}
                className="text-sm font-medium text-foreground/70 animate-in fade-in slide-in-from-bottom-2 duration-500"
              >
                {analysisMessages[analysisStep]}
              </p>
            </div>

            {/* Checklist */}
            <div className="mt-10 mx-auto w-full max-w-xs">
              <div className="rounded-2xl border border-border bg-card/60 p-5">
                <div className="flex flex-col gap-3.5">
                  {[
                    { label: "Calculating profitability", threshold: 15 },
                    { label: "Estimating advertising pressure", threshold: 35 },
                    { label: "Evaluating market difficulty", threshold: 60 },
                    { label: "Generating advisor memo", threshold: 85 },
                  ].map((item) => {
                    const isDone = progressWidth >= item.threshold
                    const isActive = !isDone && progressWidth >= item.threshold - 15
                    return (
                      <div key={item.label} className="flex items-center gap-3">
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
                            isDone
                              ? "bg-primary/10"
                              : isActive
                                ? "border border-primary/40"
                                : "border border-border"
                          }`}
                        >
                          {isDone ? (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-primary">
                              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : isActive ? (
                            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                          ) : null}
                        </div>
                        <span
                          className={`text-sm transition-colors duration-300 ${
                            isDone
                              ? "font-medium text-foreground"
                              : isActive
                                ? "text-foreground/70"
                                : "text-muted-foreground/50"
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <p className="mt-8 text-xs text-muted-foreground/60">
              This usually takes under 30 seconds
            </p>
          </div>
        </main>
      </div>
    )
  }

  /* ─── Multi-step Wizard ─────────────────────────────────── */
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Usage limit modal (403) */}
      <Dialog open={showUsageLimitModal} onOpenChange={setShowUsageLimitModal}>
        <DialogContent className="sm:max-w-md" showCloseButton={true}>
          <DialogHeader>
            <DialogTitle className="text-xl">
              You&apos;ve used all 5 free analyses
            </DialogTitle>
            <DialogDescription className="mt-3 text-left leading-relaxed">
              You&apos;ve seen how the system works — now you know whether this product is worth your money before spending it. That&apos;s exactly what it&apos;s built for.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 rounded-xl border border-border bg-muted/40 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">PRO gives you</p>
            <ul className="flex flex-col gap-1.5 text-sm text-foreground">
              <li className="flex items-center gap-2"><span className="text-primary font-bold">→</span> Unlimited analyses</li>
              <li className="flex items-center gap-2"><span className="text-primary font-bold">→</span> 12-month market history (Keepa) per ASIN</li>
              <li className="flex items-center gap-2"><span className="text-primary font-bold">→</span> Save & compare analyses over time</li>
              <li className="flex items-center gap-2"><span className="text-primary font-bold">→</span> Real FBA fee from actual product dimensions</li>
            </ul>
          </div>
          <DialogFooter className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              onClick={() => setShowUsageLimitModal(false)}
              className="rounded-xl text-muted-foreground"
            >
              Not now
            </Button>
            <Button
              className="rounded-xl font-semibold"
              onClick={() => {
                setShowUsageLimitModal(false)
                router.push("/pricing")
              }}
            >
              See PRO pricing →
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#fef3c7]/60 via-background to-[#dbeafe]/30" />
      <Navbar />
      <main className="relative flex-1 flex items-center justify-center">
        <div className="mx-auto w-full max-w-xl px-6 py-20">

          {/* Welcome banner — shown once after signup */}
          {showWelcome && (
            <div className="mb-8 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5 animate-in fade-in slide-in-from-top-2 duration-500">
              <span className="text-lg">👋</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Welcome to SellerMentor!</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  You have <strong>5 free analyses</strong>. Answer 6 quick questions and get a GO / NO-GO verdict with full profit math in ~45 seconds.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWelcome(false)}
                className="text-muted-foreground/50 hover:text-muted-foreground text-lg leading-none mt-0.5"
                aria-label="Dismiss"
              >×</button>
            </div>
          )}

          {/* Step counter */}
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Question {step} of {TOTAL_STEPS}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {Math.round((step / TOTAL_STEPS) * 100)}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-10 h-1 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>

          {/* Error message */}
          {apiError && (
            <div className="mb-8 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Analysis failed</p>
                <p className="mt-1 text-sm text-muted-foreground">{apiError}</p>
                {(apiError.includes("Sign in") || apiError.includes("session") || apiError.includes("Authentication")) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => router.replace(`/login?redirect=${encodeURIComponent("/analyze")}`)}
                  >
                    Sign in again
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Question area */}
          <div className="min-h-[240px]">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  What product are you considering?
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Enter the product keyword you want to sell on Amazon. Optionally, add a specific ASIN to get Keepa data for that exact product.
                </p>
                <div className="flex flex-col gap-3">
                  <Input
                    placeholder="e.g. stainless steel water bottle"
                    value={formData.product}
                    onChange={(e) => updateField("product", e.target.value)}
                    className="h-12 rounded-xl border-border bg-card text-base placeholder:text-muted-foreground/50 focus-visible:ring-primary/30"
                    autoFocus
                  />
                  <div className="flex flex-col gap-1">
                    <Input
                      placeholder="Competitor ASIN (optional) — e.g. B08N5WRWNW"
                      value={formData.asin}
                      onChange={(e) => updateField("asin", e.target.value.trim().toUpperCase())}
                      className="h-10 rounded-xl border-border bg-card text-sm placeholder:text-muted-foreground/40 focus-visible:ring-primary/30 font-mono tracking-wider"
                      maxLength={10}
                    />
                    <p className="text-[11px] text-muted-foreground/60 pl-1">
                      Unlocks Market History — 12 months of BSR, price & review data for that competitor. Find the ASIN in the Amazon URL: amazon.com/dp/<strong>B08N5WRWNW</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Costs (manufacturing + shipping merged) ── */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  What are your costs per unit?
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Manufacturing cost from your supplier + shipping per unit to Amazon. Not sure yet? Use rough estimates — you can update them.
                </p>
                <div className="flex flex-col gap-5 max-w-xs">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Manufacturing / sourcing cost
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        placeholder="e.g. 4.00"
                        value={formData.manufacturingCost}
                        onChange={(e) => updateField("manufacturingCost", e.target.value)}
                        className="h-12 rounded-xl border-border bg-card pl-7 text-base placeholder:text-muted-foreground/50 focus-visible:ring-primary/30"
                        autoFocus
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground/60">Cost per unit from supplier (Alibaba quote, factory price, etc.)</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Shipping to Amazon (per unit)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        placeholder="e.g. 1.50"
                        value={formData.shippingCost}
                        onChange={(e) => updateField("shippingCost", e.target.value)}
                        className="h-12 rounded-xl border-border bg-card pl-7 text-base placeholder:text-muted-foreground/50 focus-visible:ring-primary/30"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground/60">Sea freight + customs + prep. Don{"'"}t know yet? Use $1–$2 as a starting point.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3: Selling price ── */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  What price will you sell it for?
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Your target retail price on Amazon. We{"'"}ll calculate FBA fees automatically.
                </p>
                <div className="relative max-w-xs">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.sellingPrice}
                    onChange={(e) => updateField("sellingPrice", e.target.value)}
                    className="h-12 rounded-xl border-border bg-card pl-7 text-base placeholder:text-muted-foreground/50 focus-visible:ring-primary/30"
                    autoFocus
                  />
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground/60">
                  Not sure? Look at page 1 of Amazon for your keyword — price to the mid-range, not the cheapest.
                </p>
              </div>
            )}

            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  What makes your product different?
                </h2>
                <p className="text-muted-foreground mb-5 leading-relaxed">
                  This directly affects your Score and Verdict. The more specific you are, the better the advice.
                </p>

                {/* Strong vs Weak hint */}
                <div className="mb-5 rounded-xl border border-border bg-muted/40 px-4 py-3">
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                      <span className="text-muted-foreground leading-relaxed">
                        <strong className="text-foreground/70">Strong:</strong> "Machine-washable liner — fixes the smell complaint in 1★ reviews. Comes in 3 sizes, no competitor under $40 offers both"
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-500 font-bold shrink-0 mt-0.5">✗</span>
                      <span className="text-muted-foreground">
                        <strong className="text-foreground/70">Weak:</strong> "premium quality", "unique design", "best on the market"
                      </span>
                    </div>
                  </div>
                </div>

                <Textarea
                  placeholder={`e.g. My product solves the "#1 complaint" in competitor reviews — it [specific fix]. Also [unique feature] that no competitor at this price point includes.`}
                  value={formData.advantage}
                  onChange={(e) => updateField("advantage", e.target.value)}
                  rows={4}
                  className="resize-none rounded-xl border-border bg-card text-base leading-relaxed placeholder:text-muted-foreground/40 focus-visible:ring-primary/30 p-4"
                  autoFocus
                />

                {/* Live quality indicator */}
                {(() => {
                  const q = getDiffQuality(formData.advantage)
                  if (q.level === "empty") return null
                  const color =
                    q.level === "strong" ? "text-emerald-600 dark:text-emerald-400" :
                    q.level === "ok" ? "text-muted-foreground" :
                    "text-amber-600 dark:text-amber-400"
                  return (
                    <p className={`mt-2 text-xs font-medium ${color}`}>{q.message}</p>
                  )
                })()}

                <p className="mt-4 text-[11px] text-muted-foreground/60 leading-relaxed">
                  Skip if you don&apos;t have a differentiator yet — but the verdict and score will reflect the gap.
                </p>
              </div>
            )}

            {step === 5 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  How complex is the product?
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  More complex products tend to have higher return rates and more customer complaints.
                </p>
                <div className="flex flex-col gap-3">
                  {[
                    { value: "simple", label: "Simple", desc: "Ready to use out of the box" },
                    { value: "moderate", label: "Moderate", desc: "Minor setup or assembly required" },
                    { value: "complex", label: "Complex", desc: "Technical product / installation needed" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateField("complexity", opt.value)}
                      className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                        formData.complexity === opt.value
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/30"
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                          formData.complexity === opt.value ? "border-primary" : "border-border"
                        }`}
                      >
                        {formData.complexity === opt.value && (
                          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                        <span className="ml-2 text-sm text-muted-foreground">{"— "}{opt.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Supplier details{" "}
                  <span className="text-lg font-normal text-muted-foreground">(optional)</span>
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Adds accuracy to your launch capital calculation. Skip if you don{"'"}t have quotes yet.
                </p>
                <div className="flex flex-col gap-5 max-w-xs">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      MOQ — Minimum Order Quantity
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 500"
                      value={formData.moq}
                      onChange={(e) => updateField("moq", e.target.value)}
                      className="h-12 rounded-xl border-border bg-card text-base placeholder:text-muted-foreground/50 focus-visible:ring-primary/30"
                      autoFocus
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground/60">Units required per order</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Lead time (weeks)
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 5"
                      value={formData.leadTimeWeeks}
                      onChange={(e) => updateField("leadTimeWeeks", e.target.value)}
                      className="h-12 rounded-xl border-border bg-card text-base placeholder:text-muted-foreground/50 focus-visible:ring-primary/30"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground/60">Production + shipping to Amazon</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Sample cost ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        placeholder="e.g. 50"
                        value={formData.sampleCost}
                        onChange={(e) => updateField("sampleCost", e.target.value)}
                        className="h-12 rounded-xl border-border bg-card pl-7 text-base placeholder:text-muted-foreground/50 focus-visible:ring-primary/30"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground/60">One-time cost to order samples before committing</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleContinue}
                disabled={!isStepValid()}
                className="gap-2 rounded-xl px-8 h-11"
                title={!isStepValid() ? "Complete all fields to continue" : undefined}
              >
                {step === TOTAL_STEPS ? "Analyze" : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
      <div className="relative z-10 bg-background">
        <Footer />
      </div>
    </div>
  )
}
