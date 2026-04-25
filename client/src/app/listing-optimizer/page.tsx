"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Loader2,
  Search,
  AlertTriangle,
  X,
  Copy,
  Check,
  ArrowRight,
  Info,
  AlertCircle,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { cn } from "@/lib/utils"
import { useRequireAuth } from "@/hooks/use-require-auth"

/* ── Types ────────────────────────────────────────────────── */

interface Issue {
  severity: "high" | "medium" | "low"
  field: string
  issue: string
  suggestion: string
}

interface Scores {
  title: number
  keywords: number
  clarity: number
  completeness: number
}

interface Rewrites {
  title: string
  bullets: string[]
  description: string
}

interface OptimizeResult {
  overallScore: number
  scores: Scores
  issues: Issue[]
  rewrites: Rewrites
  missingKeywords: string[]
}

type Status = "idle" | "loading" | "done" | "error"

/* ── CopyButton ───────────────────────────────────────────── */

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      {copied ? "Copied!" : label}
    </button>
  )
}

/* ── ScoreRing ────────────────────────────────────────────── */

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 75
      ? "text-emerald-500"
      : score >= 50
        ? "text-amber-500"
        : "text-red-500"
  const bgColor =
    score >= 75
      ? "bg-emerald-500/10 border-emerald-500/30"
      : score >= 50
        ? "bg-amber-500/10 border-amber-500/30"
        : "bg-red-500/10 border-red-500/30"

  return (
    <div
      className={cn(
        "flex h-28 w-28 flex-col items-center justify-center rounded-full border-4",
        bgColor
      )}
    >
      <span className={cn("text-4xl font-extrabold tabular-nums", color)}>
        {score}
      </span>
      <span className="text-xs font-semibold text-muted-foreground">/100</span>
    </div>
  )
}

/* ── SubScoreBar ──────────────────────────────────────────── */

function SubScoreBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 75
      ? "bg-emerald-500"
      : score >= 50
        ? "bg-amber-500"
        : "bg-red-500"
  const textColor =
    score >= 75
      ? "text-emerald-600 dark:text-emerald-400"
      : score >= 50
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400"

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">{label}</span>
        <span className={cn("text-xs font-bold tabular-nums", textColor)}>
          {score}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

/* ── IssueCard ────────────────────────────────────────────── */

function IssueCard({ issue }: { issue: Issue }) {
  const isHigh = issue.severity === "high"
  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all",
        isHigh
          ? "border-red-500/20 bg-red-500/5"
          : "border-amber-500/20 bg-amber-500/5"
      )}
    >
      <div className="flex items-start gap-3">
        {isHigh ? (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
        ) : (
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">
              {issue.field}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                isHigh
                  ? "bg-red-500/15 text-red-600 dark:text-red-400"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              )}
            >
              {issue.severity}
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {issue.issue}
          </p>
          <p className="mt-1.5 text-sm font-medium text-foreground leading-relaxed">
            Fix: {issue.suggestion}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── RewriteCard ──────────────────────────────────────────── */

function RewriteCard({
  label,
  content,
}: {
  label: string
  content: string
}) {
  if (!content) return null
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <span className="text-sm font-bold text-foreground">{label}</span>
        <CopyButton text={content} label="Copy" />
      </div>
      <div className="px-5 py-4">
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
          {content}
        </p>
      </div>
    </div>
  )
}

/* ── Results ──────────────────────────────────────────────── */

function ResultsView({
  result,
  onReset,
}: {
  result: OptimizeResult
  onReset: () => void
}) {
  const bulletsText = result.rewrites.bullets.join("\n")

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-primary/20 bg-primary/5 p-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Listing Audit Complete</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.issues.length} issues found •{" "}
            {result.missingKeywords.length} missing keywords
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="rounded-xl text-xs font-semibold shrink-0"
        >
          Analyze Another Listing
        </Button>
      </div>

      {/* Score card */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
        <h3 className="text-sm font-bold text-foreground mb-5 uppercase tracking-wider">
          Overall Score
        </h3>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
          <div className="flex justify-center sm:justify-start">
            <ScoreRing score={result.overallScore} />
          </div>
          <div className="flex-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SubScoreBar label="Title" score={result.scores.title} />
            <SubScoreBar label="Keywords" score={result.scores.keywords} />
            <SubScoreBar label="Clarity" score={result.scores.clarity} />
            <SubScoreBar
              label="Completeness"
              score={result.scores.completeness}
            />
          </div>
        </div>
      </div>

      {/* Issues */}
      {result.issues.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Issues Found ({result.issues.length})
          </h3>
          {result.issues.map((issue, i) => (
            <IssueCard key={i} issue={issue} />
          ))}
        </div>
      )}

      {/* Missing keywords */}
      {result.missingKeywords.length > 0 && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">
            Missing Keywords ({result.missingKeywords.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.missingKeywords.map((kw, i) => (
              <span
                key={i}
                className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Suggested rewrites */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
          Suggested Rewrites
        </h3>
        <RewriteCard label="Improved Title" content={result.rewrites.title} />
        {result.rewrites.bullets.length > 0 && (
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="text-sm font-bold text-foreground">
                Improved Bullets
              </span>
              <CopyButton text={bulletsText} label="Copy All" />
            </div>
            <div className="flex flex-col divide-y divide-border/50">
              {result.rewrites.bullets.map((bullet, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 px-5 py-4 group hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 mt-0.5">
                    <span className="text-[10px] font-bold text-primary">
                      {i + 1}
                    </span>
                  </div>
                  <p className="flex-1 text-sm text-foreground leading-relaxed">
                    {bullet}
                  </p>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <CopyButton text={bullet} label="Copy" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {result.rewrites.description && (
          <RewriteCard
            label="Improved Description"
            content={result.rewrites.description}
          />
        )}
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-foreground">
              Ready to rewrite from scratch?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the Listing Builder to generate a fully optimized listing with
              AI.
            </p>
          </div>
          <Button
            className="h-10 shrink-0 rounded-xl bg-[#FF9900] px-5 text-sm font-semibold text-white hover:bg-[#FF9900]/90 shadow-sm"
            asChild
          >
            <Link href="/listing-builder">
              Rewrite with Listing Builder
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────── */

export default function ListingOptimizerPage() {
  const { loading: authLoading } = useRequireAuth()

  const [title, setTitle] = useState("")
  const [bullets, setBullets] = useState<string[]>(["", "", "", "", ""])
  const [description, setDescription] = useState("")
  const [keywords, setKeywords] = useState("")

  const [status, setStatus] = useState<Status>("idle")
  const [result, setResult] = useState<OptimizeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const handleBulletChange = (index: number, value: string) => {
    setBullets((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const canSubmit =
    title.trim().length > 0 && bullets.some((b) => b.trim().length > 0)

  const handleSubmit = async () => {
    if (!canSubmit) return

    setStatus("loading")
    setError(null)
    setResult(null)

    // Parse keywords: split by newline or comma
    const parsedKeywords = keywords
      .split(/[\n,]+/)
      .map((k) => k.trim())
      .filter(Boolean)

    try {
      const res = await fetch("/api/listing-optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          bullets: bullets.map((b) => b.trim()).filter(Boolean),
          description: description.trim(),
          keywords: parsedKeywords,
        }),
      })

      const data = (await res.json()) as OptimizeResult & { error?: string }

      if (!res.ok || data.error) {
        throw new Error(data.error ?? `Server error ${res.status}`)
      }

      setResult(data)
      setStatus("done")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Optimization failed. Please try again."
      )
      setStatus("error")
    }
  }

  const handleReset = () => {
    setStatus("idle")
    setResult(null)
    setError(null)
    setTitle("")
    setBullets(["", "", "", "", ""])
    setDescription("")
    setKeywords("")
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#fef3c7]/40 via-background to-background" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      <Navbar />

      <main className="relative flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-[900px] px-6 pb-10 pt-16 md:pt-20">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Zap className="h-3.5 w-3.5" />
              AI-Powered • Listing Audit
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl text-balance leading-[1.1]">
              Know exactly what&apos;s wrong with your listing
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground leading-relaxed">
              Paste your current title, bullets, and description. Get a score
              and specific fixes — no guesswork.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-[900px] px-6 pb-24">
          {status === "done" && result ? (
            <ResultsView result={result} onReset={handleReset} />
          ) : (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Two-column form */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Left column */}
                <div className="flex flex-col gap-5">
                  {/* Title */}
                  <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="border-b border-border px-5 py-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-foreground">
                          Current Title{" "}
                          <span className="text-destructive">*</span>
                        </label>
                        <span
                          className={cn(
                            "text-[10px] font-semibold tabular-nums",
                            title.length > 200
                              ? "text-red-500"
                              : "text-muted-foreground"
                          )}
                        >
                          {title.length}/200
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={200}
                        placeholder="e.g. Bamboo Cutting Board with Juice Groove — Large Kitchen Board..."
                        className="w-full rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/40 transition-all"
                      />
                    </div>
                  </div>

                  {/* Bullets */}
                  <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="border-b border-border px-5 py-4">
                      <label className="text-sm font-bold text-foreground">
                        Bullet Points{" "}
                        <span className="text-destructive">*</span>
                      </label>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        At least one bullet required
                      </p>
                    </div>
                    <div className="flex flex-col gap-4 p-5">
                      {bullets.map((bullet, i) => (
                        <div key={i}>
                          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                            Bullet {i + 1}
                          </label>
                          <textarea
                            value={bullet}
                            onChange={(e) =>
                              handleBulletChange(i, e.target.value)
                            }
                            rows={3}
                            placeholder={`e.g. BENEFIT HEADER: Specific feature that solves a customer pain point...`}
                            className="w-full resize-none rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm text-foreground leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/40 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-5">
                  {/* Description */}
                  <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="border-b border-border px-5 py-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-bold text-foreground">
                          Product Description
                        </label>
                        <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
                          Optional
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={7}
                        placeholder="Paste your current product description here..."
                        className="w-full min-h-[160px] resize-none rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm text-foreground leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/40 transition-all"
                      />
                    </div>
                  </div>

                  {/* Keywords */}
                  <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="border-b border-border px-5 py-4">
                      <label className="text-sm font-bold text-foreground">
                        Target Keywords
                      </label>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        We will check how many appear in your listing
                      </p>
                    </div>
                    <div className="p-5">
                      <textarea
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        rows={5}
                        placeholder="One keyword per line or comma-separated"
                        className="w-full min-h-[100px] resize-none rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm text-foreground leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/40 transition-all"
                      />
                    </div>
                  </div>

                  {/* What you get */}
                  <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-4">
                    <Search className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-semibold text-foreground">
                        What you get
                      </p>
                      <ul className="text-xs text-muted-foreground leading-relaxed list-disc list-inside space-y-0.5">
                        <li>Overall score + 4 sub-scores</li>
                        <li>Specific issues with actionable fixes</li>
                        <li>Suggested rewrites for title, bullets, description</li>
                        <li>Missing keywords highlighted</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error */}
              {status === "error" && error && (
                <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
                  <span className="flex-1 text-sm font-medium text-destructive">
                    {error}
                  </span>
                  <button
                    onClick={() => setError(null)}
                    className="shrink-0 text-destructive/60 hover:text-destructive transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Submit */}
              <div className="rounded-2xl border border-border bg-card p-5">
                {!canSubmit && (
                  <p className="mb-3 text-center text-xs text-muted-foreground">
                    Enter a title and at least one bullet point to analyze
                  </p>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || status === "loading"}
                  className={cn(
                    "relative w-full rounded-xl px-6 py-5 text-sm font-bold shadow-lg transition-all overflow-hidden",
                    canSubmit
                      ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-primary/30 hover:shadow-primary/40 hover:brightness-110"
                      : "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
                  )}
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing your listing...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Analyze My Listing &rarr;
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>

      <div className="relative z-10 bg-background">
        <Footer />
      </div>
    </div>
  )
}
