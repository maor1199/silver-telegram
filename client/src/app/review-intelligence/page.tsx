"use client"

import { useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRequireAuth } from "@/hooks/use-require-auth"
import {
  Loader2,
  Star,
  AlertTriangle,
  X,
  ArrowRight,
  TrendingUp,
  ThumbsUp,
  Lightbulb,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Types ──────────────────────────────────────────────────── */

interface PainPoint {
  theme: string
  severity: "high" | "medium" | "low"
  complaints: string[]
  copyAngle: string
}

interface ReviewAnalysisResult {
  sentiment: { positive: number; neutral: number; negative: number }
  painPoints: PainPoint[]
  positives: string[]
  copyAngles: string[]
}

type Status = "idle" | "loading" | "done" | "error"

/* ── Helpers ─────────────────────────────────────────────── */

function estimateReviewCount(text: string): number {
  if (!text.trim()) return 0
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
  let count = 0
  for (const line of lines) {
    // Lines starting with a star rating, number+star, "Reviewed by", "★", digit followed by "."/")"/star, or short title-like lines
    if (
      /^[1-5](\s*star|★|\*|\/5)/i.test(line) ||
      /^★/.test(line) ||
      /^\d+[\.\)]\s/.test(line) ||
      /^Reviewed (in|by)/i.test(line) ||
      /^Verified Purchase/i.test(line) ||
      /^\d+\s+out\s+of\s+5/i.test(line)
    ) {
      count++
    }
  }
  // Fallback: estimate by paragraph breaks if no explicit markers
  if (count === 0) {
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 20)
    return Math.max(1, Math.min(paragraphs.length, 50))
  }
  return Math.min(count, 50)
}

function SeverityBadge({ severity }: { severity: PainPoint["severity"] }) {
  const map = {
    high: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/40",
    medium:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40",
    low: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800/40",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        map[severity]
      )}
    >
      {severity}
    </span>
  )
}

/* ── Page ─────────────────────────────────────────────────── */

export default function ReviewIntelligencePage() {
  const { loading: authLoading } = useRequireAuth()

  const [reviewText, setReviewText] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [result, setResult] = useState<ReviewAnalysisResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const charCount = reviewText.length
  const reviewEstimate = estimateReviewCount(reviewText)
  const canAnalyze = reviewText.trim().length >= 50

  const handleAnalyze = async () => {
    if (!canAnalyze) return
    setStatus("loading")
    setErrorMsg(null)
    setResult(null)

    try {
      const res = await fetch("/api/review-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews: reviewText }),
      })
      const data = (await res.json()) as ReviewAnalysisResult & { error?: string }
      if (!res.ok || data.error) {
        throw new Error(data.error ?? `Server error ${res.status}`)
      }
      setResult(data)
      setStatus("done")
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Analysis failed. Please try again."
      )
      setStatus("error")
    }
  }

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

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#fef3c7]/50 via-background to-[#dbeafe]/20" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      <Navbar />

      <main className="relative flex-1">
        {/* ── Hero ── */}
        <section className="mx-auto max-w-[860px] px-6 pb-10 pt-16 md:pt-20">
          <div className="text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Star className="h-3.5 w-3.5" />
              AI-Powered &bull; Review Analysis
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl text-balance leading-[1.1]">
              Turn competitor reviews into your competitive advantage
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground leading-relaxed">
              Paste raw reviews from any Amazon competitor. Get a breakdown of pain points, themes, and copy angles.
            </p>
          </div>
        </section>

        {/* ── Input Form ── */}
        <section className="mx-auto max-w-[860px] px-6 pb-12">
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border px-6 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Competitor Reviews</h2>
                <span className="text-xs text-muted-foreground">
                  Paste 5–50 reviews directly from any Amazon product page
                </span>
              </div>
            </div>

            <div className="p-6">
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Paste 5-50 Amazon reviews here. Copy them directly from Amazon product pages — no special formatting needed."
                className="min-h-[240px] resize-y rounded-xl border-border bg-secondary/20 text-sm leading-relaxed focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/40 transition-all"
              />
              {/* Counter */}
              <p className="mt-2 text-xs text-muted-foreground/70">
                <span className="tabular-nums font-medium text-foreground">{charCount.toLocaleString()}</span>
                {" "}characters &bull;{" "}
                ~<span className="tabular-nums font-medium text-foreground">{reviewEstimate}</span>
                {" "}reviews detected
              </p>
            </div>

            {/* Error */}
            {status === "error" && errorMsg && (
              <div className="mx-6 mb-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
                <span className="flex-1 text-sm font-medium text-destructive">{errorMsg}</span>
                <button
                  onClick={() => { setStatus("idle"); setErrorMsg(null) }}
                  className="shrink-0 text-destructive/60 hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* CTA */}
            <div className="border-t border-border p-6">
              {!canAnalyze && (
                <p className="mb-3 text-center text-xs text-muted-foreground">
                  Paste at least a few reviews to enable analysis
                </p>
              )}
              <Button
                onClick={handleAnalyze}
                disabled={!canAnalyze || status === "loading"}
                className={cn(
                  "relative w-full rounded-xl px-6 py-5 text-sm font-bold shadow-lg transition-all overflow-hidden",
                  canAnalyze && status !== "loading"
                    ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-primary/30 hover:shadow-primary/40 hover:brightness-110"
                    : "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
                )}
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing reviews...
                  </>
                ) : (
                  <>
                    <Star className="mr-2 h-4 w-4" />
                    Analyze Reviews →
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* ── Results ── */}
        {status === "done" && result && (
          <section className="mx-auto max-w-[860px] px-6 pb-24 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Overall Sentiment */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-border px-6 py-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Overall Sentiment</h2>
                  <span className="text-xs text-muted-foreground">Breakdown across all pasted reviews</span>
                </div>
              </div>
              <div className="px-6 py-5">
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 dark:border-green-800/40 dark:bg-green-950/30">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                      Positive {result.sentiment.positive}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-400" />
                    <span className="text-sm font-semibold text-muted-foreground">
                      Neutral {result.sentiment.neutral}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 dark:border-red-800/40 dark:bg-red-950/30">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                      Negative {result.sentiment.negative}%
                    </span>
                  </div>
                </div>
                {/* Visual bar */}
                <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-green-500 transition-all duration-700"
                    style={{ width: `${result.sentiment.positive}%` }}
                  />
                  <div
                    className="bg-gray-300 dark:bg-gray-600 transition-all duration-700"
                    style={{ width: `${result.sentiment.neutral}%` }}
                  />
                  <div
                    className="bg-red-500 transition-all duration-700"
                    style={{ width: `${result.sentiment.negative}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Pain Points */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-border px-6 py-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/30">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Pain Points</h2>
                  <span className="text-xs text-muted-foreground">Recurring complaints you can solve in your listing</span>
                </div>
              </div>
              <div className="flex flex-col divide-y divide-border/60">
                {result.painPoints.map((pp, i) => (
                  <div key={i} className="px-6 py-5 hover:bg-secondary/20 transition-colors">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-sm font-bold text-foreground">{pp.theme}</h3>
                      <SeverityBadge severity={pp.severity} />
                    </div>
                    <ul className="mb-3 flex flex-col gap-1.5">
                      {pp.complaints.map((c, ci) => (
                        <li key={ci} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                          {c}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <p className="text-xs italic text-primary leading-relaxed">
                        {pp.copyAngle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What Customers Love */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-border px-6 py-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 dark:bg-green-950/30">
                  <ThumbsUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">What Customers Love</h2>
                  <span className="text-xs text-muted-foreground">Positive themes — reinforce these in your listing</span>
                </div>
              </div>
              <div className="px-6 py-5">
                <div className="flex flex-wrap gap-2">
                  {result.positives.map((pos, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-sm font-medium text-green-700 dark:border-green-800/40 dark:bg-green-950/30 dark:text-green-400"
                    >
                      <ThumbsUp className="h-3 w-3" />
                      {pos}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Listing Copy Angles */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-border px-6 py-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Listing Copy Angles</h2>
                  <span className="text-xs text-muted-foreground">5 specific improvements to outrank this competitor</span>
                </div>
              </div>
              <div className="px-6 py-6">
                <ol className="flex flex-col gap-4">
                  {result.copyAngles.map((angle, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                        <span className="text-xs font-bold text-primary">{i + 1}</span>
                      </div>
                      <p className="pt-0.5 text-sm text-foreground leading-relaxed">{angle}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* CTAs */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <h3 className="mb-1 text-sm font-bold text-foreground">Ready to act on these insights?</h3>
              <p className="mb-5 text-sm text-muted-foreground">Use this analysis to build a listing that fixes every pain point the competition ignores.</p>
              <div className="flex flex-wrap gap-3">
                <Button
                  className="h-10 rounded-xl bg-[#FF9900] px-5 text-sm font-semibold text-white hover:bg-[#FF9900]/90 shadow-sm"
                  asChild
                >
                  <Link href="/listing-builder">
                    Apply to Listing Builder
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-10 rounded-xl px-5 text-sm font-semibold border-primary/20 text-primary hover:bg-primary/5"
                  asChild
                >
                  <Link href="/analyze">
                    Run Full Analysis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

          </section>
        )}
      </main>

      <div className="relative z-10 bg-background">
        <Footer />
      </div>
    </div>
  )
}
