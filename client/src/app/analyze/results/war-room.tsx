"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  XCircle,
  RefreshCw,
  Copy,
  Check,
  Shield,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Brain,
  ClipboardList,
  AlertTriangle,
  Target,
  Lightbulb,
  Users,
  Megaphone,
  Star,
  HelpCircle,
  BarChart3,
  Calendar,
  Zap,
  Eye,
  Crosshair,
  Activity,
  ChevronRight,
  Flame,
  Rocket,
  TrendingUp as TrendUp,
  Loader2,
} from "lucide-react"
import { getAnalysisResult } from "@/lib/supabase/analysis-store"
import { cn } from "@/lib/utils"
import { useRequireAuth } from "@/hooks/use-require-auth"

/* ══════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ══════════════════════════════════════════════════════════ */

function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-muted ${className}`} />
}

function LoadingSkeleton() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-[1100px] px-6 py-16">
          <SkeletonBar className="mx-auto mb-6 h-28 w-full max-w-lg" />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <SkeletonBar className="h-28" />
            <SkeletonBar className="h-28" />
            <SkeletonBar className="h-28" />
          </div>
          <SkeletonBar className="mt-8 h-44 w-full" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <SkeletonBar className="h-52" />
            <SkeletonBar className="h-52" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function ErrorState({ message, onRetry, onNewAnalysis }: { message: string; onRetry: () => void; onNewAnalysis: () => void }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex flex-1 items-center justify-center">
        <div className="mx-auto max-w-md text-center px-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="mt-5 text-xl font-bold text-foreground">{"Couldn't load analysis"}</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{message}</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
            <Button variant="outline" onClick={onNewAnalysis} type="button">
              New Analysis
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function HelpTip({ text }: { text?: string }) {
  if (!text) return null
  return (
    <span className="relative group inline-flex items-center">
      <HelpCircle className="h-4 w-4 text-muted-foreground/50 cursor-help" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-xl border border-border bg-popover px-4 py-3 text-xs text-popover-foreground leading-relaxed shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
        {text}
      </span>
    </span>
  )
}

function SectionHeader({ icon, title, sub, helpText, badge }: {
  icon: React.ReactNode; title: string; sub: string; helpText?: string; badge?: string
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        {icon}
        <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
        {badge && (
          <span className="rounded-md bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary">
            {badge}
          </span>
        )}
        <HelpTip text={helpText} />
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{sub}</p>
    </div>
  )
}

function InsightBlock({ icon, title, items, helpText, accent }: {
  icon: React.ReactNode; title: string; items: string[]; helpText?: string
  accent?: "red" | "green" | "amber" | "blue"
}) {
  const borderMap = {
    red: "border-red-200/50 dark:border-red-800/30",
    green: "border-emerald-200/50 dark:border-emerald-800/30",
    amber: "border-amber-200/50 dark:border-amber-800/30",
    blue: "border-blue-200/50 dark:border-blue-800/30",
  }
  const bgMap = {
    red: "bg-red-50/30 dark:bg-red-950/10",
    green: "bg-emerald-50/30 dark:bg-emerald-950/10",
    amber: "bg-amber-50/30 dark:bg-amber-950/10",
    blue: "bg-blue-50/30 dark:bg-blue-950/10",
  }
  return (
    <div className={cn(
      "rounded-2xl border p-5 flex flex-col gap-4",
      accent ? `${borderMap[accent]} ${bgMap[accent]}` : "border-border bg-card"
    )}>
      <div className="flex items-center gap-2.5">
        {icon}
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <HelpTip text={helpText} />
      </div>
      {items.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {items.slice(0, 10).map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13px] text-foreground/80 leading-relaxed">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              {String(item)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-muted-foreground/60 italic">No data available for this section.</p>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string; sub?: string; icon: React.ReactNode
  color?: "green" | "red" | "amber" | "blue"
}) {
  const colorMap = {
    green: "text-emerald-600 dark:text-emerald-400",
    red: "text-red-600 dark:text-red-400",
    amber: "text-amber-600 dark:text-amber-400",
    blue: "text-blue-600 dark:text-blue-400",
  }
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn("text-2xl font-black", color ? colorMap[color] : "text-foreground")}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN WAR ROOM COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function WarRoom() {
  const router = useRouter()
  const { loading: authLoading } = useRequireAuth()
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "deep-dive" | "execution">("overview")

  useEffect(() => {
    try {
      const result = getAnalysisResult()
      if (result) {
        if (result.ok === false) {
          setError(typeof result.error === "string" ? result.error : "The analysis engine returned an error.")
        }
        setData(result)
      } else {
        // No data — force redirect to analyze page (full navigation so no error screen flashes)
        if (typeof window !== "undefined") {
          window.location.replace("/analyze")
        }
        return
      }
    } catch {
      setError("Failed to load analysis data.")
    }
    setLoading(false)
  }, [router])

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
  if (loading) return <LoadingSkeleton />
  if (error && !data) return (
    <ErrorState
      message={error}
      onRetry={() => router.replace("/analyze")}
      onNewAnalysis={() => router.push("/analyze")}
    />
  )
  if (!data) return <LoadingSkeleton />

  /* ── Safe extraction helpers ─────────────────────────── */
  function safeList(val: unknown): string[] {
    if (val == null) return []
    if (typeof val === "string") return val.trim() ? val.split("\n").map(s => s.replace(/^[-*]\s+/, "").trim()).filter(Boolean) : []
    if (typeof val === "number" || typeof val === "boolean") return [String(val)]
    if (Array.isArray(val)) {
      return val.flatMap(v => {
        if (typeof v === "string") return v.trim() ? [v.trim()] : []
        if (typeof v === "number" || typeof v === "boolean") return [String(v)]
        if (v && typeof v === "object") {
          const o = v as Record<string, unknown>
          const t = o.text ?? o.title ?? o.name ?? o.label ?? o.description ?? o.message
          return typeof t === "string" && t.trim() ? [t.trim()] : [JSON.stringify(v)]
        }
        return []
      })
    }
    return [String(val)]
  }

  function safeStr(val: unknown, fallback = ""): string {
    if (val == null) return fallback
    if (typeof val === "string") return val
    return String(val)
  }

  function safeNum(val: unknown): number | null {
    if (val == null) return null
    const n = Number(val)
    return isNaN(n) ? null : n
  }

  /* ── Data extraction — supports both camelCase and snake_case ── */
  const D = data as Record<string, unknown>

  // Helper: pick first non-null value from multiple keys
  function pick(...keys: string[]): unknown {
    for (const key of keys) {
      if (D[key] != null) return D[key]
    }
    return null
  }

  // ── Verdict ────────────────────────────────────────────
  const rawVerdict = String(pick("verdict") ?? "").toUpperCase().replace(/_/g, "-")
  const isGoBut = rawVerdict.includes("GO") && rawVerdict.includes("BUT")
  const isGo = !isGoBut && rawVerdict.includes("GO") && !rawVerdict.includes("NO")
  const verdict = isGoBut ? "GO-BUT" : isGo ? "GO" : rawVerdict ? "NO-GO" : "PENDING"

  // ── Scalars ────────────────────────────────────────────
  const score = safeNum(pick("score"))
  const confidence = safeNum(pick("confidence"))
  const estimatedMargin = safeStr(pick("estimatedMargin", "estimated_margin"))
  const financialStressTest = safeStr(pick("financialStressTest", "financial_stress_test"))
  const consultantSecret = safeStr(pick("consultantSecret", "consultant_secret"))
  const differentiationScore = safeStr(pick("differentiationScore", "differentiation_score"))

  // ── Launch Capital ─────────────────────────────────────
  const launchCapital = safeNum(pick("launchCapitalRequired", "launch_capital_required"))
  const launchCapitalInsight = safeStr(pick("launchCapitalConsultantInsight", "launch_capital_consultant_insight"))
  const launchCapitalBreakdownRaw = (pick("launchCapitalBreakdown", "launch_capital_breakdown") ?? {}) as Record<string, unknown>

  // ── Profit ─────────────────────────────────────────────
  const profitAfterAds = safeNum(pick("profitAfterAds", "profit_after_ads"))
  const profitExplanation = safeStr(pick("profitExplanation", "profit_explanation"))

  const pbRaw = pick("profitBreakdown", "profit_breakdown")
  const pb = (typeof pbRaw === "object" && pbRaw != null ? pbRaw : null) as Record<string, unknown> | null

  // ── Strategic Intelligence ─────────────────────────────
  const stratIntel = safeStr(pick("strategicIntelligence", "strategic_intelligence"))

  // ── Lists ──────────────────────────────────────────────
  const whyThisDecision = safeList(pick("whyThisDecision", "why_this_decision"))
  const reviewIntelligence = safeList(pick("reviewIntelligence", "review_intelligence"))
  const marketTrends = safeList(pick("marketTrends", "market_trends"))
  const competition = safeList(pick("competition"))
  const beginnerFit = safeList(pick("beginnerFit", "beginner_fit"))
  const profitabilityReality = safeList(pick("profitabilityReality", "profitability"))
  const advertisingReality = safeList(pick("advertisingReality", "advertising"))
  const risks = safeList(pick("risks"))
  const opportunities = safeList(pick("opportunities"))
  const differentiationIdeas = safeList(pick("differentiationIdeas", "differentiationIdeas", "differentiation"))
  const executionPlan = safeList(pick("executionPlan", "execution_plan", "honeymoonRoadmap", "honeymoon_roadmap"))
  const whatWouldMakeGo = safeList(pick("whatWouldMakeGo", "what_would_make_go"))

  // ── Alternative Keywords ───────────────────────────────
  const altKwRaw = pick("alternativeKeywordsWithCost", "alternative_keywords_with_cost") ?? pick("alternativeKeywords", "alternative_keywords")
  const altKeywords: { keyword: string; cpc?: string }[] = Array.isArray(altKwRaw)
    ? altKwRaw.map(v => {
      if (typeof v === "string") return { keyword: v }
      if (v && typeof v === "object") {
        const o = v as Record<string, unknown>
        return {
          keyword: safeStr(o.keyword ?? o.name ?? o.text, "Unknown"),
          cpc: o.estimatedCpcDisplay
            ? safeStr(o.estimatedCpcDisplay)
            : o.estimatedCpc != null
              ? typeof o.estimatedCpc === "number"
                ? `$${Number(o.estimatedCpc).toFixed(2)}`
                : safeStr(o.estimatedCpc)
              : undefined,
        }
      }
      return { keyword: String(v) }
    })
    : []

  // ── Section Help ───────────────────────────────────────
  const sectionHelpRaw = (pick("sectionHelp", "section_help") ?? {}) as Record<string, unknown>
  const help = (key: string) => safeStr(sectionHelpRaw[key]) || undefined

  // ── Verdict styling ────────────────────────────────────
  const verdictConfig = {
    "GO": { bg: "bg-emerald-600", text: "text-white", border: "border-emerald-500", glow: "shadow-emerald-500/20", icon: <Check className="h-6 w-6" />, label: "GO" },
    "GO-BUT": { bg: "bg-amber-500", text: "text-white", border: "border-amber-400", glow: "shadow-amber-500/20", icon: <AlertTriangle className="h-6 w-6" />, label: "GO — WITH CAUTION" },
    "NO-GO": { bg: "bg-red-600", text: "text-white", border: "border-red-500", glow: "shadow-red-500/20", icon: <XCircle className="h-6 w-6" />, label: "NO-GO" },
    "PENDING": { bg: "bg-muted", text: "text-foreground", border: "border-border", glow: "", icon: <Activity className="h-6 w-6" />, label: "PENDING" },
  }
  const vc = verdictConfig[verdict as keyof typeof verdictConfig] || verdictConfig.PENDING

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const fmt = (val: unknown) => {
    if (val == null) return "N/A"
    const n = Number(val)
    return isNaN(n) ? String(val) : `$${n.toFixed(2)}`
  }

  const ic = "h-4 w-4 text-primary shrink-0"

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-[1100px] px-6 py-12">

          {/* ═══════════════════════════════════════════════
              SECTION 1 — WAR ROOM COMMAND CENTER
              ═══════════════════════════════════════════════ */}
          <section className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-border px-6 py-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">War Room</span>
                <span className="text-[10px] text-muted-foreground/50">AI Investment Decision Engine</span>
              </div>
              <div className="flex items-center gap-2">
                {differentiationScore && (
                  <span className={cn(
                    "rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border",
                    differentiationScore === "Weak"
                      ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/30"
                      : differentiationScore === "Strong"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400"
                        : "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400"
                  )}>
                    Differentiation: {differentiationScore}
                  </span>
                )}
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Export JSON"}
                </button>
              </div>
            </div>

            {/* Verdict Banner */}
            <div className="relative px-8 py-10 text-center">
              <div className="flex items-center justify-center gap-5 flex-wrap">
                <div className={cn(
                  "inline-flex items-center gap-3 rounded-2xl border-2 px-8 py-5 shadow-xl",
                  vc.bg, vc.text, vc.border, vc.glow
                )}>
                  {vc.icon}
                  <span className="text-4xl font-black tracking-wider">{vc.label}</span>
                </div>
              </div>

              {/* Key Metrics Row */}
              <div className="mt-8 flex items-center justify-center gap-8 flex-wrap">
                {score != null && (
                  <div className="text-center">
                    <p className="text-3xl font-black text-foreground">{score}<span className="text-base font-normal text-muted-foreground">/100</span></p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Viability Score</p>
                  </div>
                )}
                {confidence != null && score !== confidence && (
                  <div className="text-center">
                    <p className="text-3xl font-black text-foreground">{confidence}<span className="text-base font-normal text-muted-foreground">%</span></p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Confidence</p>
                  </div>
                )}
                {profitAfterAds != null && (
                  <div className="text-center">
                    <p className={cn("text-3xl font-black", profitAfterAds >= 0 ? "text-emerald-600" : "text-red-600")}>
                      {profitAfterAds >= 0 ? "+" : ""}{fmt(profitAfterAds)}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Profit After Ads</p>
                  </div>
                )}
                {estimatedMargin && (
                  <div className="text-center">
                    <p className={cn("text-3xl font-black", estimatedMargin.startsWith("-") ? "text-red-600" : "text-emerald-600")}>
                      {estimatedMargin}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Est. Margin</p>
                  </div>
                )}
                {launchCapital != null && (
                  <div className="text-center">
                    <p className="text-3xl font-black text-amber-600">${launchCapital.toLocaleString()}</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Launch Capital</p>
                  </div>
                )}
              </div>

              {/* Navigation Tabs */}
              <div className="mt-8 flex items-center justify-center gap-1 rounded-xl bg-secondary/50 p-1 w-fit mx-auto">
                {(["overview", "deep-dive", "execution"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "rounded-lg px-5 py-2 text-xs font-bold transition-all capitalize",
                      activeTab === tab
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab === "deep-dive" ? "Deep Dive" : tab === "execution" ? "Execution Plan" : "Overview"}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-center gap-3">
                <Button size="sm" variant="outline" className="rounded-xl text-xs" asChild>
                  <Link href="/analyze">New Analysis</Link>
                </Button>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════
              TAB: OVERVIEW
              ═══════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <div className="mt-10 flex flex-col gap-10 animate-in fade-in duration-300">

              {/* Why This Decision */}
              {whyThisDecision.length > 0 && (
                <section>
                  <SectionHeader
                    icon={<Shield className="h-5 w-5 text-primary" />}
                    title="Why This Decision"
                    sub="Key factors that influenced the AI verdict"
                    helpText={help("whyThisDecision")}
                  />
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <ul className="flex flex-col gap-3.5">
                      {whyThisDecision.map((reason, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-foreground leading-relaxed">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                          {String(reason)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}

              {/* Financial Stress Test */}
              {financialStressTest && (
                <section>
                  <SectionHeader
                    icon={<Activity className="h-5 w-5 text-primary" />}
                    title="Financial Stress Test"
                    sub="Aggregator 15% rule — margin threshold check"
                    helpText={help("financialStressTest")}
                  />
                  <div className={cn(
                    "rounded-2xl border p-6",
                    financialStressTest.includes("FAIL") || financialStressTest.includes("NO-GO")
                      ? "border-red-200/50 bg-red-50/30 dark:border-red-800/30 dark:bg-red-950/10"
                      : "border-emerald-200/50 bg-emerald-50/30 dark:border-emerald-800/30 dark:bg-emerald-950/10"
                  )}>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{financialStressTest}</p>
                  </div>
                </section>
              )}

              {/* Profit Breakdown */}
              {pb && (
                <section>
                  <SectionHeader
                    icon={<DollarSign className="h-5 w-5 text-primary" />}
                    title="Profit Breakdown"
                    sub="Full unit economics with PPC-adjusted margins"
                    badge="Unit Economics"
                    helpText={help("profitBreakdown")}
                  />
                  <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                    <div className="grid gap-3">
                      {[
                        { label: "Selling Price", value: fmt(pb.sellingPrice), negative: false },
                        { label: "Referral Fee (15%)", value: fmt(pb.referralFee), negative: true },
                        { label: "FBA Fee", value: fmt(pb.fbaFee), negative: true },
                        { label: "COGS (Unit + Shipping)", value: fmt(pb.cogs), negative: true },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{row.negative ? `− ${row.label}` : row.label}</span>
                          <span className={cn("font-semibold", row.negative ? "text-red-500" : "text-foreground")}>
                            {row.negative ? `-${row.value}` : row.value}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {`− PPC Cost`}
                          {pb.assumedAcosPercent != null && (
                            <span className="ml-1 text-xs text-muted-foreground/60">(ACoS {Number(pb.assumedAcosPercent)}%)</span>
                          )}
                        </span>
                        <span className="font-semibold text-red-500">-{fmt(pb.ppcCostPerUnit)}</span>
                      </div>
                      <div className="my-2 border-t border-border" />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">= Profit After Ads</span>
                        <span className={cn("text-xl font-black", (Number(pb.profitAfterAds) ?? 0) >= 0 ? "text-emerald-600" : "text-red-600")}>
                          {fmt(pb.profitAfterAds)}
                        </span>
                      </div>
                    </div>
                    {profitExplanation && (
                      <p className="mt-6 text-[13px] text-muted-foreground leading-relaxed border-t border-border pt-5">{profitExplanation}</p>
                    )}
                  </div>
                </section>
              )}

              {/* Strategic Intelligence */}
              {stratIntel && (
                <section>
                  <SectionHeader
                    icon={<Crosshair className="h-5 w-5 text-primary" />}
                    title="Strategic Intelligence"
                    sub="Deep market positioning and moat analysis"
                    helpText={help("strategicIntelligence")}
                  />
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{stratIntel}</p>
                  </div>
                </section>
              )}

              {/* Launch Capital */}
              {launchCapital != null && (
                <section>
                  <SectionHeader
                    icon={<Rocket className="h-5 w-5 text-primary" />}
                    title="Launch Capital Required"
                    sub="Estimated budget needed to reach page 1"
                    badge="Budget"
                  />
                  <div className="rounded-2xl border border-amber-200/50 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/10 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <p className="text-4xl font-black text-amber-600">${launchCapital.toLocaleString()}</p>
                    </div>
                    {Object.keys(launchCapitalBreakdownRaw).length > 0 && (
                      <div className="grid gap-2 mb-4">
                        {Object.entries(launchCapitalBreakdownRaw)
                          .filter(([k]) => k !== "total")
                          .map(([key, val]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span className="font-semibold">${Number(val).toLocaleString()}</span>
                            </div>
                          ))}
                      </div>
                    )}
                    {launchCapitalInsight && (
                      <p className="text-sm text-foreground leading-relaxed border-t border-amber-200/50 pt-4">{launchCapitalInsight}</p>
                    )}
                  </div>
                </section>
              )}

              {/* Consultant Secret */}
              {consultantSecret && (
                <section>
                  <SectionHeader
                    icon={<Brain className="h-5 w-5 text-primary" />}
                    title="Consultant's Secret"
                    sub="Insider insight for this specific niche"
                    badge="Insider"
                  />
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                    <p className="text-sm text-foreground leading-relaxed">{consultantSecret}</p>
                  </div>
                </section>
              )}

              {/* Risks & Opportunities */}
              {(risks.length > 0 || opportunities.length > 0) && (
                <section>
                  <SectionHeader
                    icon={<Activity className="h-5 w-5 text-primary" />}
                    title="Risk / Opportunity Matrix"
                    sub="Threats to monitor and advantages to exploit"
                  />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <InsightBlock
                      icon={<TrendingDown className="h-4 w-4 text-red-500 shrink-0" />}
                      title="Risks"
                      items={risks}
                      accent="red"
                      helpText={help("risks")}
                    />
                    <InsightBlock
                      icon={<TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />}
                      title="Opportunities"
                      items={opportunities}
                      accent="green"
                      helpText={help("opportunities")}
                    />
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              TAB: DEEP DIVE
              ═══════════════════════════════════════════════ */}
          {activeTab === "deep-dive" && (
            <div className="mt-10 flex flex-col gap-10 animate-in fade-in duration-300">

              {/* Market Reality Deep Dive */}
              <section>
                <SectionHeader
                  icon={<TrendingUp className="h-5 w-5 text-primary" />}
                  title="Market Reality Deep Dive"
                  sub="Review intelligence, demand trends, and competitive landscape"
                  badge="Research"
                />
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <InsightBlock icon={<Star className={ic} />} title="Review Intelligence" items={reviewIntelligence} accent="blue" helpText={help("reviewIntelligence")} />
                  <InsightBlock icon={<TrendingUp className={ic} />} title="Market Trends" items={marketTrends} accent="green" helpText={help("marketTrends")} />
                  <InsightBlock icon={<Users className={ic} />} title="Competition Analysis" items={competition} accent="amber" helpText={help("competition")} />
                </div>
              </section>

              {/* Beginner Fit */}
              {beginnerFit.length > 0 && (
                <section>
                  <SectionHeader
                    icon={<Target className="h-5 w-5 text-primary" />}
                    title="Beginner Fit"
                    sub="Is this niche suitable for a new Amazon seller?"
                    helpText={help("beginnerFit")}
                  />
                  <InsightBlock icon={<Target className={ic} />} title="Beginner Assessment" items={beginnerFit} accent="amber" />
                </section>
              )}

              {/* Profit & Advertising Reality */}
              <section>
                <SectionHeader
                  icon={<DollarSign className="h-5 w-5 text-primary" />}
                  title="Profit & Advertising Reality"
                  sub="Unit economics, margins, and advertising cost analysis"
                  badge="Financials"
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <InsightBlock icon={<DollarSign className={ic} />} title="Profitability Analysis" items={profitabilityReality} accent="green" helpText={help("profitability")} />
                  <InsightBlock icon={<Megaphone className={ic} />} title="Advertising Pressure" items={advertisingReality} accent="red" helpText={help("advertising")} />
                </div>
              </section>

              {/* Strategic Intelligence Grid */}
              <section>
                <SectionHeader
                  icon={<Brain className="h-5 w-5 text-primary" />}
                  title="Strategic Intelligence Grid"
                  sub="Differentiation angles, risk vectors, and opportunity mapping"
                  badge="Strategy"
                />
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <InsightBlock icon={<AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />} title="Risk Vectors" items={risks} accent="red" helpText={help("risks")} />
                  <InsightBlock icon={<Target className="h-4 w-4 text-emerald-500 shrink-0" />} title="Opportunity Map" items={opportunities} accent="green" helpText={help("opportunities")} />
                  <InsightBlock icon={<Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />} title="Differentiation Angles" items={differentiationIdeas} accent="amber" helpText={help("differentiationIdeas")} />
                </div>
              </section>

              {/* Alternative Keywords */}
              {altKeywords.length > 0 && (
                <section>
                  <SectionHeader
                    icon={<Target className="h-5 w-5 text-primary" />}
                    title="Alternative Keywords"
                    sub="Related product ideas with estimated CPC"
                    helpText={help("alternativeKeywords")}
                  />
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex flex-wrap gap-2.5">
                      {altKeywords.map((kw, i) => (
                        <button
                          key={i}
                          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 hover:border-primary/40"
                          onClick={() => navigator.clipboard.writeText(kw.keyword)}
                          title={`Click to copy: ${kw.keyword}`}
                        >
                          {kw.keyword}
                          {kw.cpc && (
                            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold">{kw.cpc}</span>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground/60">Click a keyword to copy it to your clipboard.</p>
                  </div>
                </section>
              )}

              {/* What Would Make GO */}
              {verdict === "NO-GO" && whatWouldMakeGo.length > 0 && (
                <section>
                  <SectionHeader
                    icon={<Lightbulb className="h-5 w-5 text-primary" />}
                    title="What Would Make This a GO"
                    sub="Changes that could flip this verdict"
                    helpText={help("whatWouldMakeGo")}
                  />
                  <div className="rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-950/10 p-6">
                    <ul className="flex flex-col gap-3.5">
                      {whatWouldMakeGo.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-foreground leading-relaxed">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-xs font-bold text-emerald-700 dark:text-emerald-400">{i + 1}</span>
                          {String(item)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              TAB: EXECUTION PLAN
              ═══════════════════════════════════════════════ */}
          {activeTab === "execution" && (
            <div className="mt-10 flex flex-col gap-10 animate-in fade-in duration-300">

              <section>
                <SectionHeader
                  icon={<ClipboardList className="h-5 w-5 text-primary" />}
                  title="Execution Roadmap"
                  sub="Step-by-step tactical action items"
                  badge="Action Plan"
                  helpText={help("executionPlan")}
                />
                <div className="rounded-2xl border border-border bg-card p-6">
                  {executionPlan.length > 0 ? (
                    <ol className="flex flex-col gap-4">
                      {executionPlan.map((step, i) => (
                        <li key={i} className="flex items-start gap-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                            {i + 1}
                          </span>
                          <p className="text-sm text-foreground leading-relaxed pt-1.5">{String(step)}</p>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted-foreground/60 italic">No execution plan available for this analysis.</p>
                  )}
                </div>
              </section>

              {/* Key Metrics Recap */}
              <section>
                <SectionHeader
                  icon={<BarChart3 className="h-5 w-5 text-primary" />}
                  title="Key Metrics Recap"
                  sub="At-a-glance numbers to inform your launch decision"
                />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    label="Verdict"
                    value={verdict}
                    icon={<Shield className="h-4 w-4" />}
                    color={verdict === "GO" ? "green" : verdict === "GO-BUT" ? "amber" : verdict === "NO-GO" ? "red" : undefined}
                  />
                  {score != null && (
                    <StatCard
                      label="Score"
                      value={`${score}/100`}
                      icon={<Target className="h-4 w-4" />}
                      color={score >= 70 ? "green" : score >= 40 ? "amber" : "red"}
                    />
                  )}
                  {profitAfterAds != null && (
                    <StatCard
                      label="Profit/Unit"
                      value={`${profitAfterAds >= 0 ? "+" : ""}${fmt(profitAfterAds)}`}
                      icon={<DollarSign className="h-4 w-4" />}
                      color={profitAfterAds >= 0 ? "green" : "red"}
                    />
                  )}
                  {launchCapital != null && (
                    <StatCard
                      label="Launch Budget"
                      value={`$${launchCapital.toLocaleString()}`}
                      sub="estimated 30-day capital"
                      icon={<Rocket className="h-4 w-4" />}
                      color="amber"
                    />
                  )}
                </div>
              </section>
            </div>
          )}

          {/* Bottom CTA */}
          <div className="mt-14 flex items-center justify-center gap-4">
            <Button size="lg" className="rounded-xl gap-2" asChild>
              <Link href="/analyze">
                Run Another Analysis <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
