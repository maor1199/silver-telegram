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
const TOTAL_STEPS = 6

export default function AnalyzePage() {
  const { loading: authLoading } = useRequireAuth()
  const { session, hasSupabase } = useSession()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    product: "",
    manufacturingCost: "",
    shippingCost: "",
    sellingPrice: "",
    advantage: "",
    complexity: "",
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState(0)
  const [progressWidth, setProgressWidth] = useState(0)
  const [apiError, setApiError] = useState<string | null>(null)
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false)
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

  /* ─── Step validation ─────────────────────────────────── */
  const isStepValid = () => {
    switch (step) {
      case 1: return formData.product.trim().length > 0
      case 2: return formData.manufacturingCost.trim().length > 0
      case 3: return formData.shippingCost.trim().length > 0
      case 4: return formData.sellingPrice.trim().length > 0
      case 5: return true // advantage is optional
      case 6: return formData.complexity.length > 0
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

    // Final step — send to backend
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
          keyword: formData.product,
          sellingPrice: Number(formData.sellingPrice) || 0,
          unitCost: Number(formData.manufacturingCost) || 0,
          shippingCost: Number(formData.shippingCost) || 0,
          differentiation: formData.advantage || undefined,
          complexity: formData.complexity || undefined,
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

  /* ─── Auth gate (same as Listing Copywriter) ─────────────── */
  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking sign-in...</p>
        </div>
      </div>
    )
  }

  /* ─── Loading State ─────────────────────────────────────── */
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
        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    )
  }

  /* ─── Multi-step Wizard ─────────────────────────────────── */
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Usage limit modal (403) */}
      <Dialog open={showUsageLimitModal} onOpenChange={setShowUsageLimitModal}>
        <DialogContent className="sm:max-w-md text-center" showCloseButton={true}>
          <DialogHeader>
            <DialogTitle className="text-xl">
              Analysis limit reached
            </DialogTitle>
            <DialogDescription className="mt-2 text-left">
              You have reached the free tier limit of 5 analyses. Upgrade to PRO for unlimited analyses and more features.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
            <Button
              variant="secondary"
              onClick={() => setShowUsageLimitModal(false)}
              className="rounded-xl"
            >
              Close
            </Button>
            <Button
              className="rounded-xl"
              onClick={() => {
                setShowUsageLimitModal(false)
                router.push("/pricing")
              }}
            >
              Upgrade to PRO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#fef3c7]/60 via-background to-[#dbeafe]/30" />
      <Navbar />
      <main className="relative flex-1 flex items-center justify-center">
        <div className="mx-auto w-full max-w-xl px-6 py-20">
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
                  What product are you thinking about?
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Enter the product keyword or name you{"'"}re considering selling on Amazon.
                </p>
                <Input
                  placeholder="e.g. stainless steel water bottle"
                  value={formData.product}
                  onChange={(e) => updateField("product", e.target.value)}
                  className="h-12 rounded-xl border-border bg-card text-base placeholder:text-muted-foreground/50 focus-visible:ring-primary/30"
                  autoFocus
                />
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  How much does it cost to manufacture?
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Your per-unit manufacturing or sourcing cost, including any MOQ considerations.
                </p>
                <div className="relative max-w-xs">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.manufacturingCost}
                    onChange={(e) => updateField("manufacturingCost", e.target.value)}
                    className="h-12 rounded-xl border-border bg-card pl-7 text-base placeholder:text-muted-foreground/50 focus-visible:ring-primary/30"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  What about shipping to Amazon?
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Per-unit cost to ship from your manufacturer to Amazon{"'"}s fulfillment centers.
                </p>
                <div className="relative max-w-xs">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.shippingCost}
                    onChange={(e) => updateField("shippingCost", e.target.value)}
                    className="h-12 rounded-xl border-border bg-card pl-7 text-base placeholder:text-muted-foreground/50 focus-visible:ring-primary/30"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {step === 4 && (
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
              </div>
            )}

            {step === 5 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Do you have a competitive advantage?
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Optional. Describe anything that makes your product better — bundling, materials, design, branding.
                </p>
                <Textarea
                  placeholder="e.g. Double-wall insulation, unique color options, includes straw set..."
                  value={formData.advantage}
                  onChange={(e) => updateField("advantage", e.target.value)}
                  rows={4}
                  className="resize-none rounded-xl border-border bg-card text-base leading-relaxed placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 p-4"
                  autoFocus
                />
              </div>
            )}

            {step === 6 && (
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
      <Footer />
    </div>
  )
}
