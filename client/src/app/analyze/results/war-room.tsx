"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
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
  Package,
  Activity,
  ChevronRight,
  Flame,
  Save,
} from "lucide-react"
import { getAnalysisResult, setAnalysisResult } from "@/lib/analysis-store"
import { normalizeAnalysisResponse } from "@/lib/analysisApi"
import { createClient } from "@/lib/supabase/client"
import { AnalysisProfitCards } from "@/components/analysis-profit-cards"
import { cn } from "@/lib/utils"



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
          <SkeletonBar className="mt-8 h-60 w-full" />
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            <SkeletonBar className="h-44" />
            <SkeletonBar className="h-44" />
            <SkeletonBar className="h-44" />
          </div>
          <SkeletonBar className="mt-8 h-72 w-full" />
        </div>
      </main>
      <Footer />
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
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
            <Link href="/analyze">
              <Button variant="outline">New Analysis</Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

/* ── Help Tooltip ──────────────────────────────────────── */
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

/* ── Section Header ───────────────────────────────────── */
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

/* ── Insight Card ─────────────────────────────────────── */
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
      {(items || []).length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {(items || []).slice(0, 10).map((item, i) => (
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

/* ── Stat Card ────────────────────────────────────────── */
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

/* ── Parse formattedReport ────────���───────────────────── */
interface ReportSection { title: string; lines: string[] }

function parseFormattedReport(text: string): ReportSection[] {
  if (!text || typeof text !== "string") return []
  const sections: ReportSection[] = []
  let currentTitle = ""
  let currentLines: string[] = []

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim()
    const headingMatch = line.match(/^#{1,3}\s+(.+)/) || line.match(/^\*\*(.+?)\*\*$/)
    if (headingMatch) {
      if (currentTitle && currentLines.length > 0) {
        sections.push({ title: currentTitle, lines: [...currentLines] })
      }
      currentTitle = headingMatch[1].replace(/\*\*/g, "").trim()
      currentLines = []
    } else if (line.length > 0) {
      const cleaned = line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "").trim()
      if (cleaned) currentLines.push(cleaned)
    }
  }
  if (currentTitle && currentLines.length > 0) {
    sections.push({ title: currentTitle, lines: [...currentLines] })
  }
  if (sections.length === 0 && text.trim()) {
    sections.push({ title: "Analysis", lines: text.split("\n").map(l => l.trim()).filter(Boolean) })
  }
  return sections
}

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
        if (o.step || o.action || o.task) {
          const parts = [o.timeframe || o.timeline || o.month, o.step || o.action || o.task, o.detail || o.description || o.note].filter(Boolean)
          return parts.length > 0 ? [parts.join(" \u2014 ")] : []
        }
        const t = o.text ?? o.title ?? o.name ?? o.label ?? o.description ?? o.message
        return typeof t === "string" && t.trim() ? [t.trim()] : [JSON.stringify(v)]
      }
      return []
    })
  }
  if (typeof val === "object") {
    return Object.entries(val as Record<string, unknown>).map(([k, v]) =>
      `${k}: ${typeof v === "string" || typeof v === "number" || typeof v === "boolean" ? String(v) : JSON.stringify(v)}`
    )
  }
  return [String(val)]
}

function safeStr(val: unknown, fallback = ""): string {
  if (val == null) return fallback
  if (typeof val === "string") return val
  return String(val)
}

/* Advisor implication line: distinct style, no label */
function AdvisorImplication({ text }: { text?: string | null }) {
  if (!text || !String(text).trim()) return null
  return (
    <p className="text-[13px] text-muted-foreground border-l-2 border-orange-500 pl-2 mt-1">
      {String(text).trim()}
    </p>
  )
}

function matchSection(sections: ReportSection[], keywords: string[]): string[] {
  for (const section of sections) {
    const lower = section.title.toLowerCase()
    if (keywords.some(kw => lower.includes(kw))) return section.lines
  }
  return []
}

/* ══════════════════════════════════════════════════════════
   PREMIUM WAR ROOM DASHBOARD
   ══════════════════════════════════════════════════════════ */
export default function WarRoom() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const analysisId = searchParams.get("id")
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "deep-dive" | "execution">("overview")

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (analysisId) {
        const supabase = createClient()
        if (supabase) {
          const { data: row, error: fetchError } = await supabase
            .from("analyses")
            .select("analysis_data")
            .eq("id", analysisId)
            .single()
          if (cancelled) return
          if (!fetchError && row?.analysis_data && typeof row.analysis_data === "object") {
            const raw = row.analysis_data as Record<string, unknown>
            const normalized = normalizeAnalysisResponse(raw)
            setData(normalized ? (normalized as Record<string, unknown>) : raw)
            setAnalysisResult(normalized ?? raw)
            setLoading(false)
            return
          }
          if (fetchError || !row) {
            setError("Report not found or you don't have access to it.")
            setLoading(false)
            return
          }
        }
      }

      try {
        const raw = getAnalysisResult()
        if (raw) {
          if (raw.ok === false) {
            setError(typeof raw.error === "string" ? raw.error : "The analysis engine returned an error.")
          } else {
            const normalized = normalizeAnalysisResponse(raw)
            setData(normalized ? (normalized as unknown as Record<string, unknown>) : raw)
          }
        }
      } catch (e) {
        console.error("[v0] Failed to load analysis data:", e)
        setError("Failed to load analysis data.")
      }
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [router, analysisId])

  if (loading) return <LoadingSkeleton />
  if (error) return <ErrorState message={error} onRetry={() => router.replace("/analyze")} />
  if (!data) return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex flex-1 items-center justify-center">
        <div className="mx-auto max-w-md text-center px-6">
          <Activity className="mx-auto h-10 w-10 text-muted-foreground animate-pulse" />
          <h1 className="mt-5 text-xl font-bold text-foreground">Waiting for analysis...</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">Run an analysis first to see your results here.</p>
          <Link href="/analyze">
            <Button className="mt-6 rounded-xl">Start Analysis</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )

  /* ── Data extraction ────────────────────────────────── */
  const analysisData = data as Record<string, unknown>
  const R = (typeof analysisData?.report === "object" && analysisData.report != null
    ? analysisData.report : analysisData) as Record<string, unknown>

  // Section help
  const sectionHelp = (typeof R?.sectionHelp === "object" && R.sectionHelp != null
    ? R.sectionHelp
    : typeof analysisData?.sectionHelp === "object" && analysisData.sectionHelp != null
      ? analysisData.sectionHelp
      : {}) as Record<string, unknown>
  const help = (key: string) => safeStr(sectionHelp[key]) || undefined

  // ── Verdict ────────────────────────────────────────── 
  const rawVerdict = String(R?.verdict ?? analysisData?.verdict ?? "").toUpperCase().replace(/_/g, "-")
  const isGoBut = rawVerdict.includes("GO") && rawVerdict.includes("BUT")
  const isGo = !isGoBut && rawVerdict.includes("GO") && !rawVerdict.includes("NO")
  const verdict = isGoBut ? "GO-BUT" : isGo ? "GO" : rawVerdict ? "NO-GO" : "PENDING"

  // ── Scalars ────────────────────────────────────────── 
  const score = R?.score != null ? Number(R.score) : (analysisData?.score != null ? Number(analysisData.score) : null)
  const confidence = R?.confidence != null ? Number(R.confidence) : (analysisData?.confidence != null ? Number(analysisData.confidence) : score)
  const estimatedMargin = safeStr(R?.estimatedMargin ?? analysisData?.estimatedMargin ?? R?.estimated_margin ?? analysisData?.estimated_margin)

  // ── Market Reality (string or list) ────────────────── 
  const marketRealityRaw = R?.marketReality ?? analysisData?.marketReality ?? R?.market_reality ?? analysisData?.market_reality
  const marketRealityStr = typeof marketRealityRaw === "string" ? marketRealityRaw : ""
  const marketRealityList = typeof marketRealityRaw !== "string" ? safeList(marketRealityRaw) : []

  // ── Strategic Intelligence (string or list) ────────── 
  const stratIntelRaw = R?.strategicIntelligence ?? analysisData?.strategicIntelligence ?? R?.strategic_intelligence ?? analysisData?.strategic_intelligence
  const stratIntelStr = typeof stratIntelRaw === "string" ? stratIntelRaw : ""
  const stratIntelList = typeof stratIntelRaw !== "string" ? safeList(stratIntelRaw) : []

  // ── Profit Breakdown ───────────────────────────────── 
  const pb = (typeof R?.profitBreakdown === "object" && R.profitBreakdown != null
    ? R.profitBreakdown
    : typeof analysisData?.profitBreakdown === "object" && analysisData.profitBreakdown != null
      ? analysisData.profitBreakdown
      : null) as Record<string, unknown> | null

  const profitAfterAds = pb?.profitAfterAds != null ? Number(pb.profitAfterAds)
    : R?.profitAfterAds != null ? Number(R.profitAfterAds)
      : analysisData?.profitAfterAds != null ? Number(analysisData.profitAfterAds)
        : null
  const profitExplanation = safeStr(R?.profitExplanation ?? analysisData?.profitExplanation)

  // ── Category arrays ────────────────────────────────── 
  const whyFallback = safeList(R?.whyThisDecision ?? analysisData?.whyThisDecision ?? R?.why_this_decision)
  const reviewIntel = safeList(R?.reviewIntelligence ?? analysisData?.reviewIntelligence ?? R?.review_intelligence)
  const marketTrends = safeList(R?.marketTrends ?? analysisData?.marketTrends ?? R?.market_trends)
  const competitionData = safeList(R?.competition ?? analysisData?.competition)
  const profitReality = safeList(R?.profitabilityReality ?? analysisData?.profitabilityReality ?? R?.profitability)
  const adReality = safeList(R?.advertisingReality ?? analysisData?.advertisingReality ?? R?.advertising)
  const risksData = safeList(R?.risks ?? analysisData?.risks)
  const opportunitiesData = safeList(R?.opportunities ?? analysisData?.opportunities)
  const diffIdeas = safeList(R?.differentiationIdeas ?? analysisData?.differentiationIdeas ?? R?.differentiation)
  const executionPlan = safeList(R?.executionPlan ?? analysisData?.executionPlan ?? R?.execution_plan)

  // ── Fallback: parse formattedReport ────────────────── 
  const fallbackText = safeStr(R?.formattedReport ?? analysisData?.formattedReport)
  const allEmpty = [whyFallback, reviewIntel, marketTrends, competitionData, profitReality, adReality, risksData, opportunitiesData, diffIdeas, executionPlan].every(a => a.length === 0)
    && !marketRealityStr && marketRealityList.length === 0 && !stratIntelStr && stratIntelList.length === 0
  const sections = allEmpty ? parseFormattedReport(fallbackText) : []

  const fReviewIntel = reviewIntel.length > 0 ? reviewIntel : matchSection(sections, ["review", "customer", "complaint", "sentiment", "feedback"])
  const fMarketTrends = marketTrends.length > 0 ? marketTrends : matchSection(sections, ["market", "trend", "demand", "volume", "niche"])
  const fCompetition = competitionData.length > 0 ? competitionData : matchSection(sections, ["compet", "rival", "player", "brand", "leader", "dominant"])
  const fProfitReality = profitReality.length > 0 ? profitReality : matchSection(sections, ["profit", "margin", "economic", "unit cost", "revenue", "pricing"])
  const fAdReality = adReality.length > 0 ? adReality : matchSection(sections, ["advertis", "ppc", "ad cost", "acos", "sponsored"])
  const fRisks = risksData.length > 0 ? risksData : matchSection(sections, ["risk", "threat", "warning", "danger", "concern"])
  const fOpportunities = opportunitiesData.length > 0 ? opportunitiesData : matchSection(sections, ["opportun", "advantage", "strength", "upside", "potential"])
  const fDiffIdeas = diffIdeas.length > 0 ? diffIdeas : matchSection(sections, ["differenti", "unique", "angle", "positioning", "strategy"])
  const fActionPlan = executionPlan.length > 0 ? executionPlan : matchSection(sections, ["action", "next step", "recommendation", "plan", "todo", "do this", "execution", "month", "timeline", "roadmap"])
  const fWhy = whyFallback.length > 0 ? whyFallback : [
    ...fRisks.slice(0, 2), ...fCompetition.slice(0, 1), ...fProfitReality.slice(0, 1), ...fReviewIntel.slice(0, 1)
  ].filter(Boolean).slice(0, 5)

  // Market Reality fallback from parsed sections
  const fMarketReality = marketRealityStr || (marketRealityList.length > 0 ? marketRealityList : matchSection(sections, ["market reality", "market overview", "landscape"]))
  const fStratIntel = stratIntelStr || (stratIntelList.length > 0 ? stratIntelList : matchSection(sections, ["strategic", "intelligence", "positioning", "moat"]))

  // ── Alternative keywords ───────────────────────────── 
  const altKwRaw = R?.alternativeKeywordsWithCost ?? analysisData?.alternativeKeywordsWithCost ?? R?.alternativeKeywords ?? analysisData?.alternativeKeywords
  const altKeywords: { keyword: string; cpc?: string }[] = Array.isArray(altKwRaw)
    ? altKwRaw.map(v => {
      if (typeof v === "string") return { keyword: v }
      if (v && typeof v === "object") {
        const o = v as Record<string, unknown>
        // Prefer estimatedCpcDisplay (e.g. "$1.35") from normalized data, fallback to raw estimatedCpc number
        const display = o.estimatedCpcDisplay ?? o.estimated_cpc_display
        const rawCpc = o.estimatedCpc ?? o.estimated_cpc
        const cpc = typeof display === "string" && display.trim()
          ? display.trim()
          : rawCpc != null && !isNaN(Number(rawCpc))
            ? `$${Number(rawCpc).toFixed(2)}`
            : undefined
        return {
          keyword: safeStr(o.keyword ?? o.name ?? o.text, "Unknown"),
          cpc,
        }
      }
      return { keyword: String(v) }
    })
    : []

  // ── What Would Make GO ─────────────────────────────── 
  const whatWouldMakeGo = safeList(R?.whatWouldMakeGo ?? analysisData?.whatWouldMakeGo ?? R?.what_would_make_go)

  // ── Golden Intelligence Fields ────────────────────── 
  const consultantSecret = safeStr(R?.consultantSecret ?? analysisData?.consultantSecret ?? R?.consultant_secret)
  const honeymoonRoadmap = safeList(R?.honeymoonRoadmap ?? analysisData?.honeymoonRoadmap ?? R?.honeymoon_roadmap)
  const differentiationGapTip = safeStr(R?.differentiationGapTip ?? analysisData?.differentiationGapTip ?? R?.differentiation_gap_tip)
  const differentiationScore = safeStr(R?.differentiationScore ?? analysisData?.differentiationScore ?? R?.differentiation_score)
  const launchCapitalRequired = R?.launchCapitalRequired ?? analysisData?.launchCapitalRequired ?? R?.launch_capital_required
  const launchCapitalBreakdown = (R?.launchCapitalBreakdown ?? analysisData?.launchCapitalBreakdown ?? R?.launch_capital_breakdown) as Record<string, unknown> | null
  const financialStressTest = safeStr(R?.financialStressTest ?? analysisData?.financialStressTest ?? R?.financial_stress_test)
  const whatMostSellersMiss = safeStr(R?.whatMostSellersMiss ?? analysisData?.whatMostSellersMiss ?? R?.what_most_sellers_miss)
  const marketDominationAnalysis = safeStr(R?.marketDominationAnalysis ?? analysisData?.marketDominationAnalysis ?? R?.market_domination_analysis)
  const difficultyScoreDisplay = safeStr(R?.difficultyScoreDisplay ?? analysisData?.difficultyScoreDisplay ?? R?.difficulty_score_display)
  const difficultyLevel = safeStr(R?.difficultyLevel ?? analysisData?.difficultyLevel ?? R?.difficulty_level)
  const earlyStrategyGuidance = safeStr(R?.earlyStrategyGuidance ?? analysisData?.earlyStrategyGuidance ?? R?.early_strategy_guidance)
  const premiumRiskWarning = safeStr(R?.premiumRiskWarning ?? analysisData?.premiumRiskWarning ?? R?.premium_risk_warning)
  const opportunity = safeStr(R?.opportunity ?? analysisData?.opportunity)
  const advisorImplicationWhyThisDecision = safeStr(R?.why_this_decision_insight ?? analysisData?.why_this_decision_insight) || safeStr(R?.advisorImplicationWhyThisDecision ?? analysisData?.advisorImplicationWhyThisDecision ?? R?.advisor_implication_why_this_decision)
  const advisorImplicationExpertInsight = safeStr(R?.expert_insight ?? analysisData?.expert_insight) || safeStr(R?.advisorImplicationExpertInsight ?? analysisData?.advisorImplicationExpertInsight ?? R?.advisor_implication_expert_insight)
  const advisorImplicationWhatMostSellersMiss = safeStr(R?.what_most_sellers_miss_insight ?? analysisData?.what_most_sellers_miss_insight) || safeStr(R?.advisorImplicationWhatMostSellersMiss ?? analysisData?.advisorImplicationWhatMostSellersMiss ?? R?.advisor_implication_what_most_sellers_miss)
  const advisorImplicationMarketSignals = safeStr(R?.advisorImplicationMarketSignals ?? analysisData?.advisorImplicationMarketSignals ?? R?.advisor_implication_market_signals)
  const advisorImplicationEntryReality = safeStr(R?.advisorImplicationEntryReality ?? analysisData?.advisorImplicationEntryReality ?? R?.advisor_implication_entry_reality)
  const advisorImplicationMarketDominationAnalysis = safeStr(R?.advisorImplicationMarketDominationAnalysis ?? analysisData?.advisorImplicationMarketDominationAnalysis ?? R?.advisor_implication_market_domination_analysis)
  const advisorImplicationCompetitionReality = safeStr(R?.competition_insight ?? analysisData?.competition_insight) || safeStr(R?.advisorImplicationCompetitionReality ?? analysisData?.advisorImplicationCompetitionReality ?? R?.advisor_implication_competition_reality)
  const advisorImplicationOpportunity = safeStr(R?.opportunity_insight ?? analysisData?.opportunity_insight) || safeStr(R?.advisorImplicationOpportunity ?? analysisData?.advisorImplicationOpportunity ?? R?.advisor_implication_opportunity)
  const advisorImplicationEarlyStrategyGuidance = safeStr(R?.advisorImplicationEarlyStrategyGuidance ?? analysisData?.advisorImplicationEarlyStrategyGuidance ?? R?.advisor_implication_early_strategy_guidance)
  const reviewStructureSummary = safeStr(R?.review_structure_summary ?? analysisData?.review_structure_summary)
  const newSellerPresence = safeStr(R?.new_seller_presence ?? analysisData?.new_seller_presence)
  const keywordSaturationRatio = safeStr(R?.keyword_saturation_ratio ?? analysisData?.keyword_saturation_ratio)
  const priceCompression = safeStr(R?.price_compression ?? analysisData?.price_compression)
  const brandDistributionSummary = safeStr(R?.brand_distribution_summary ?? analysisData?.brand_distribution_summary)
  const marketMaturitySignal = safeStr(R?.market_maturity_signal ?? analysisData?.market_maturity_signal)
  const sponsoredTop10Count = R?.sponsored_top10_count ?? analysisData?.sponsored_top10_count
  const sponsoredTotalCount = R?.sponsored_total_count ?? analysisData?.sponsored_total_count
  const estimatedAcosForMarket =
    R?.estimatedAcosForMarket ?? analysisData?.estimatedAcosForMarket ?? R?.estimated_acos_for_market ?? analysisData?.estimated_acos_for_market
  const estimatedAcosPercent =
    estimatedAcosForMarket != null && Number.isFinite(Number(estimatedAcosForMarket))
      ? Math.round(Number(estimatedAcosForMarket) * 100)
      : null
  const validatedDifferentiatorsRaw =
    R?.validatedDifferentiators ?? analysisData?.validatedDifferentiators ?? R?.validated_differentiators ?? analysisData?.validated_differentiators
  const validatedDifferentiators = Array.isArray(validatedDifferentiatorsRaw) ? validatedDifferentiatorsRaw : []
  const marginThresholdPct =
    R?.marginThresholdPct ?? analysisData?.marginThresholdPct ?? R?.margin_threshold_pct ?? analysisData?.margin_threshold_pct

  // ── Verdict styling ────────────────────────────────── 
  const verdictConfig = {
    "GO": { bg: "bg-emerald-600", text: "text-white", border: "border-emerald-500", glow: "shadow-emerald-500/20", icon: <Check className="h-6 w-6" /> },
    "GO-BUT": { bg: "bg-amber-500", text: "text-white", border: "border-amber-400", glow: "shadow-amber-500/20", icon: <AlertTriangle className="h-6 w-6" /> },
    "NO-GO": { bg: "bg-red-600", text: "text-white", border: "border-red-500", glow: "shadow-red-500/20", icon: <XCircle className="h-6 w-6" /> },
    "PENDING": { bg: "bg-muted", text: "text-foreground", border: "border-border", glow: "", icon: <Activity className="h-6 w-6" /> },
  }
  const vc = verdictConfig[verdict as keyof typeof verdictConfig] || verdictConfig.PENDING

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const handleSaveToMyReports = async () => {
    if (!data) return
    const supabase = createClient()
    if (!supabase) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      router.push("/login?redirect=/analyze/results")
      return
    }
    const R = (typeof data?.report === "object" && data.report != null ? data.report : data) as Record<string, unknown>
    const productName = safeStr(data?.keyword ?? R?.keyword ?? data?.name ?? R?.name, "Product analysis").trim() || "Product analysis"
    setSaving(true)
    setSaveSuccess(false)
    const { error: insertError } = await supabase.from("analyses").insert({
      user_id: session.user.id,
      product_name: productName,
      analysis_data: data,
      created_at: new Date().toISOString(),
    })
    setSaving(false)
    if (insertError) {
      toast({ title: "Save failed", description: insertError.message, variant: "destructive" })
      return
    }
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
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
                <button
                  onClick={handleSaveToMyReports}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors disabled:opacity-50"
                >
                  {saveSuccess ? <Check className="h-3 w-3 text-emerald-500" /> : <Save className="h-3 w-3" />}
                  {saveSuccess ? "Saved" : saving ? "Saving…" : "Save to My Reports"}
                </button>
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
                  <span className="text-4xl font-black tracking-wider">{verdict}</span>
                </div>
              </div>

              {/* Key Metrics Row */}
              <div className="mt-8 flex items-center justify-center gap-8 flex-wrap">
                {score != null && !isNaN(score) && (
                  <div className="text-center">
                    <p className="text-3xl font-black text-foreground">{Math.round(Number(score))}<span className="text-base font-normal text-muted-foreground">/100</span></p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Viability Score</p>
                  </div>
                )}
                {confidence != null && !isNaN(confidence) && score !== confidence && (
                  <div className="text-center">
                    <p className="text-3xl font-black text-foreground">{Number(confidence).toFixed(1)}<span className="text-base font-normal text-muted-foreground">%</span></p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Confidence</p>
                  </div>
                )}
                {profitAfterAds != null && !isNaN(profitAfterAds) && (
                  <div className="text-center">
                    <p className={cn("text-3xl font-black", profitAfterAds >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
                      ${profitAfterAds.toFixed(2)}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Net Profit</p>
                  </div>
                )}
                {(() => {
                  const pbObj = pb as Record<string, unknown> | null
                  if (!pbObj) return null
                  const _cogs = Number(pbObj?.cogs) || 0
                  const _fbaFee = Number(pbObj?.fbaFee) || 0
                  const _referralFee = Number(pbObj?.referralFee) || 0
                  const _ppcCost = Number(pbObj?.ppcCostPerUnit) || 0
                  const _profit = profitAfterAds ?? (Number(pbObj?.profitAfterAds) || 0)
                  const totalCost = _cogs + _fbaFee + _referralFee + _ppcCost
                  const roiValue = totalCost > 0 ? (_profit / totalCost) * 100 : 0
                  const amazonFeesSum = _fbaFee + _referralFee
                  return (
                    <>
                      <div className="text-center">
                        <p className={cn("text-3xl font-black", roiValue >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
                          {roiValue.toFixed(1)}%
                        </p>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">ROI</p>
                      </div>
                      {amazonFeesSum > 0 && (
                        <div className="text-center">
                          <p className="text-3xl font-black text-foreground">${amazonFeesSum.toFixed(2)}</p>
                          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Amazon Fees</p>
                        </div>
                      )}
                    </>
                  )
                })()}
                {estimatedMargin && (
                  <div className="text-center">
                    <p className="text-3xl font-black text-foreground">{estimatedMargin}</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Est. Margin</p>
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
                <Link href="/analyze">
                  <Button size="sm" variant="outline" className="rounded-xl text-xs">New Analysis</Button>
                </Link>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════
              SECTION 1 — OVERVIEW (Decision Layer)
              Verdict + Primary Reason + Core Metrics + Why This Decision + Expert + What Most Miss + What Would Flip
              ═══════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <div className="mt-10 flex flex-col gap-8 animate-in fade-in duration-300">

              {/* Primary Reason — consultant conclusion, at least 1.5 lines */}
              {(advisorImplicationWhyThisDecision || fWhy?.[0] || consultantSecret) && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Primary Reason</h3>
                  <p className="text-sm font-medium text-foreground leading-relaxed min-h-[2.5em]">
                    {advisorImplicationWhyThisDecision
                      ? advisorImplicationWhyThisDecision
                      : (() => {
                          const fallback = String(fWhy?.[0] ?? consultantSecret)
                          const sentences = fallback.split(/(?<=[.!?])\s+/).filter(Boolean)
                          const atLeastTwoLines = sentences.slice(0, 3).join(" ").trim()
                          return atLeastTwoLines || fallback
                        })()}
                  </p>
                </section>
              )}

              {/* Core Metrics Snapshot — profit breakdown table + cards */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Core Metrics Snapshot</h3>
                {pb && typeof pb === "object" && (
                  <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b border-border">
                          <td className="py-3 pl-4 font-medium text-foreground">Selling price</td>
                          <td className="py-3 pr-4 text-right tabular-nums text-foreground">${(Number(pb.sellingPrice) || 0).toFixed(2)}</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 pl-4 text-muted-foreground">− Referral fee (15%)</td>
                          <td className="py-2 pr-4 text-right tabular-nums text-muted-foreground">−${(Number(pb.referralFee) || 0).toFixed(2)}</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 pl-4 text-muted-foreground">− FBA fee</td>
                          <td className="py-2 pr-4 text-right tabular-nums text-muted-foreground">−${(Number(pb.fbaFee) || 0).toFixed(2)}</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 pl-4 text-muted-foreground">− COGS</td>
                          <td className="py-2 pr-4 text-right tabular-nums text-muted-foreground">−${(Number(pb.cogs) || 0).toFixed(2)}</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 pl-4 text-muted-foreground">− PPC cost ({Number(pb.assumedAcosPercent) || 0}% ACoS)</td>
                          <td className="py-2 pr-4 text-right tabular-nums text-muted-foreground">−${(Number(pb.ppcCostPerUnit) || 0).toFixed(2)}</td>
                        </tr>
                        <tr className="bg-muted/30">
                          <td className="py-3 pl-4 font-semibold text-foreground">Net profit after ads</td>
                          <td className="py-3 pr-4 text-right tabular-nums font-bold text-foreground">${(Number(pb.profitAfterAds) ?? profitAfterAds ?? 0).toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                <AnalysisProfitCards
                  netProfit={profitAfterAds}
                  profitBreakdown={pb ? {
                    sellingPrice: Number(pb.sellingPrice) || 0,
                    referralFee: Number(pb.referralFee) || 0,
                    fbaFee: Number(pb.fbaFee) || 0,
                    cogs: Number(pb.cogs) || 0,
                    ppcCostPerUnit: Number(pb.ppcCostPerUnit) || 0,
                    assumedAcosPercent: Number(pb.assumedAcosPercent) || 0,
                    profitAfterAds: Number(pb.profitAfterAds) || 0,
                  } : undefined}
                  profitAfterAds={profitAfterAds}
                />
                <div className="mt-3 flex flex-wrap gap-4">
                  {score != null && !isNaN(score) && (
                    <span className="text-xs text-muted-foreground">Viability Score: <strong className="text-foreground">{Math.round(Number(score))}/100</strong></span>
                  )}
                  {confidence != null && !isNaN(confidence) && (
                    <span className="text-xs text-muted-foreground">Confidence: <strong className="text-foreground">{Number(confidence).toFixed(1)}%</strong></span>
                  )}
                  {estimatedMargin && (
                    <span className="text-xs text-muted-foreground">Estimated Margin: <strong className="text-foreground">{estimatedMargin}</strong></span>
                  )}
                </div>
              </section>

              {/* Why This Decision — advisor implication only */}
              {advisorImplicationWhyThisDecision && (
                <section>
                  <SectionHeader
                    icon={<Shield className="h-5 w-5 text-primary" />}
                    title="Why This Decision"
                    sub="Observation → implication"
                    helpText={help("whyThisDecision")}
                  />
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <p className="text-sm font-medium text-foreground leading-relaxed" style={{ lineHeight: '1.5' }}>
                      {advisorImplicationWhyThisDecision}
                    </p>
                  </div>
                </section>
              )}

              {/* Differentiation Verdict — only when at least one non-PENDING verdict */}
              {validatedDifferentiators.length > 0 &&
                validatedDifferentiators.some((d: { verdict?: string }) => (d.verdict ?? "PENDING") !== "PENDING") && (
                <section>
                  <SectionHeader
                    icon={<Lightbulb className="h-5 w-5 text-emerald-600" />}
                    title="Differentiation Verdict"
                    sub="Your differentiators validated against real competitor data"
                  />
                  <div className="rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-950/20 p-6">
                    {validatedDifferentiators.length > 0 ? (
                    <>
                      <ul className="flex flex-col gap-3.5">
                        {validatedDifferentiators.map((d: { differentiator?: string; appearsInTitles?: number; verdict?: string }, i: number) => {
                          const name = d.differentiator ?? ""
                          const n = d.appearsInTitles ?? 0
                          const verdict = d.verdict ?? "TABLE_STAKES"
                          const verdictText =
                            verdict === "STRONG"
                              ? "STRONG: Put this in your title and image 1."
                              : verdict === "WEAK"
                                ? "WEAK: Use in bullet 2, not your title."
                                : verdict === "PENDING"
                                  ? "PENDING: Awaiting analysis."
                                  : "TABLE_STAKES: Remove from your main message."
                          return (
                            <li key={i} className="flex items-start gap-3 text-sm text-foreground leading-relaxed">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              {`${name} — found in ${n} of 15 competitor titles. ${verdictText}`}
                            </li>
                          )
                        })}
                      </ul>
                      {marginThresholdPct != null && Number.isFinite(Number(marginThresholdPct)) && (
                        <p className="text-xs text-muted-foreground mt-4">
                          Margin threshold adjusted to {Number(marginThresholdPct)}% based on your differentiators.
                        </p>
                      )}
                    </>
                    ) : (
                      <p className="text-sm text-muted-foreground/60 italic">No differentiation data validated against competitors.</p>
                    )}
                  </div>
                </section>
              )}

              {/* Expert Insight — new expert insight only */}
              {advisorImplicationExpertInsight && (
                <section>
                  <SectionHeader
                    icon={<Brain className="h-5 w-5 text-amber-600" />}
                    title="Expert Insight"
                    sub="Summary of the market situation"
                    badge="Expert"
                  />
                  <div className="rounded-2xl border-2 border-amber-300/60 dark:border-amber-700/40 bg-amber-50/50 dark:bg-amber-950/20 p-6 shadow-sm">
                    <p className="text-sm font-medium text-foreground leading-relaxed" style={{ lineHeight: '1.5' }}>
                      {advisorImplicationExpertInsight}
                    </p>
                  </div>
                </section>
              )}

              {/* What Most Sellers Miss — one short insight */}
              {whatMostSellersMiss && (
                <section>
                  <SectionHeader
                    icon={<Eye className="h-5 w-5 text-primary" />}
                    title="What Most Sellers Miss"
                    sub="Hidden dynamic in the niche"
                  />
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <p className="text-sm text-foreground leading-relaxed">{whatMostSellersMiss}</p>
                    {advisorImplicationWhatMostSellersMiss && (
                      <p style={{
                        fontSize: '13px',
                        color: 'var(--color-text-secondary)',
                        borderLeft: '2px solid #f97316',
                        paddingLeft: '10px',
                        marginTop: '8px',
                        lineHeight: '1.5'
                      }}>
                        {advisorImplicationWhatMostSellersMiss}
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* What Would Flip This Decision — three conditions (NO-GO → GO) */}
              {(whatWouldMakeGo?.length ?? 0) > 0 && (
                <section>
                  <SectionHeader
                    icon={<Lightbulb className="h-5 w-5 text-primary" />}
                    title="What Would Flip This Decision"
                    sub="Conditions that could change a NO-GO into a GO"
                    helpText={help("whatWouldMakeGo")}
                  />
                  <div className="rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-950/10 p-6">
                    <ul className="flex flex-col gap-3.5">
                      {whatWouldMakeGo.slice(0, 3).map((item, i) => (
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
              SECTION 2 — DEEP DIVE (Market Intelligence Layer)
              Market Signals, Entry Reality, Market Domination, Competition, Opportunity, Profit Reality, Launch Capital
              ═══════════════════════════════════════════════ */}
          {activeTab === "deep-dive" && (
            <div className="mt-10 flex flex-col gap-8 animate-in fade-in duration-300">

              {/* Market Signals — full first page (30): avg price, reviews, review structure, new seller presence, keyword saturation, price compression, brand distribution, maturity, sponsored density */}
              <section>
                <SectionHeader
                  icon={<BarChart3 className="h-5 w-5 text-primary" />}
                  title="Market Signals"
                  sub="Full first page (up to 30 listings) — price, reviews, brand distribution, ad presence"
                />
                <div className="rounded-2xl border border-border bg-card p-6">
                  {(() => {
                    const snap = (R?.marketSnapshot ?? analysisData?.marketSnapshot ?? R?.liveMarketComparison ?? analysisData?.liveMarketComparison) as Record<string, unknown> | undefined
                    const hasNewSignals = reviewStructureSummary || newSellerPresence || keywordSaturationRatio || priceCompression || brandDistributionSummary || marketMaturitySignal || (sponsoredTop10Count != null) || (sponsoredTotalCount != null)
                    if (!snap && !hasNewSignals) {
                      const str = typeof fMarketReality === "string" ? fMarketReality : (fMarketReality as string[])?.[0]
                      if (str) return <p className="text-sm text-foreground leading-relaxed">{str}</p>
                      return <p className="text-sm text-muted-foreground/60 italic">No market snapshot available.</p>
                    }
                    const avgPrice = snap?.avgPrice != null ? Number(snap.avgPrice) : null
                    const avgReviews = snap?.avgReviews != null ? Number(snap.avgReviews) : null
                    const avgRating = snap?.avgRating != null ? Number(snap.avgRating) : null
                    const dominantBrand = snap?.dominantBrand === true
                    return (
                      <div className="flex flex-col gap-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          {avgPrice != null && <div><span className="text-xs text-muted-foreground">Avg price</span><p className="font-semibold text-foreground">${avgPrice.toFixed(2)}</p></div>}
                          {avgReviews != null && <div><span className="text-xs text-muted-foreground">Avg reviews</span><p className="font-semibold text-foreground">{avgReviews.toLocaleString()}</p></div>}
                          {avgRating != null && <div><span className="text-xs text-muted-foreground">Avg rating</span><p className="font-semibold text-foreground">{Number(avgRating).toFixed(1)}</p></div>}
                          <div><span className="text-xs text-muted-foreground">Brand distribution</span><p className="font-semibold text-foreground">{dominantBrand ? "Dominant brand(s) in top results" : "Fragmented / many brands"}</p></div>
                          {fAdReality.length > 0 && <div className="sm:col-span-2"><span className="text-xs text-muted-foreground">Ad presence</span><p className="text-sm text-foreground mt-1">{fAdReality[0]}</p></div>}
                          {estimatedAcosPercent != null && (
                            <div className="sm:col-span-2">
                              <span className="text-xs text-muted-foreground">Estimated ACoS for this market</span>
                              <p className="text-sm text-foreground mt-1">Estimated ACoS for this market: {estimatedAcosPercent}%</p>
                              <p className="text-xs text-muted-foreground mt-0.5">(Based on competition level, review barrier, and keyword opportunity)</p>
                            </div>
                          )}
                        </div>
                        {hasNewSignals && (
                          <div className="border-t border-border pt-4 flex flex-col gap-2">
                            <span className="text-xs font-medium text-muted-foreground">First-page intelligence (top 30)</span>
                            {reviewStructureSummary && <p className="text-sm text-foreground"><span className="text-muted-foreground">Review structure: </span>{reviewStructureSummary}</p>}
                            {newSellerPresence && <p className="text-sm text-foreground"><span className="text-muted-foreground">New seller presence: </span>{newSellerPresence}</p>}
                            {keywordSaturationRatio && <p className="text-sm text-foreground"><span className="text-muted-foreground">Keyword saturation: </span>{keywordSaturationRatio}</p>}
                            {priceCompression && <p className="text-sm text-foreground"><span className="text-muted-foreground">Price compression: </span>{priceCompression}</p>}
                            {brandDistributionSummary && <p className="text-sm text-foreground"><span className="text-muted-foreground">Brand distribution: </span>{brandDistributionSummary}</p>}
                            {marketMaturitySignal && <p className="text-sm text-foreground"><span className="text-muted-foreground">Market maturity: </span>{marketMaturitySignal}</p>}
                            {(sponsoredTop10Count != null || sponsoredTotalCount != null) && (
                              <p className="text-sm text-foreground">
                                <span className="text-muted-foreground">Sponsored: </span>
                                {sponsoredTop10Count != null && `Top 10: ${sponsoredTop10Count}`}
                                {sponsoredTop10Count != null && sponsoredTotalCount != null && " · "}
                                {sponsoredTotalCount != null && `First page total: ${sponsoredTotalCount}`}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })()}
                  {advisorImplicationMarketSignals && (
                    <p style={{
                      fontSize: '13px',
                      color: 'var(--color-text-secondary)',
                      borderLeft: '2px solid #f97316',
                      paddingLeft: '10px',
                      marginTop: '8px',
                      lineHeight: '1.5'
                    }}>
                      {advisorImplicationMarketSignals}
                    </p>
                  )}
                </div>
              </section>

              {/* Entry Reality — how difficult entering is (reasoning, avoid HIGH/LOW labels) */}
              <section>
                <SectionHeader
                  icon={<Target className="h-5 w-5 text-primary" />}
                  title="Entry Reality"
                  sub="How difficult it is to enter this niche"
                />
                <div className="rounded-2xl border border-border bg-card p-6">
                  {(() => {
                    const reasoning = typeof fMarketReality === "string" ? fMarketReality : (fMarketReality as string[])?.join(" ") || difficultyScoreDisplay || difficultyLevel
                    if (reasoning) {
                      return <p className="text-sm text-foreground leading-relaxed">{reasoning}</p>
                    }
                    if (fReviewIntel[0] || fMarketTrends[0]) {
                      return <p className="text-sm text-foreground leading-relaxed">{fReviewIntel[0] || fMarketTrends[0]}</p>
                    }
                    return <p className="text-sm text-muted-foreground/60 italic">No entry analysis available.</p>
                  })()}
                  {advisorImplicationEntryReality && (
                    <p style={{
                      fontSize: '13px',
                      color: 'var(--color-text-secondary)',
                      borderLeft: '2px solid #f97316',
                      paddingLeft: '10px',
                      marginTop: '8px',
                      lineHeight: '1.5'
                    }}>
                      {advisorImplicationEntryReality}
                    </p>
                  )}
                </div>
              </section>

              {/* Market Domination — one brand vs many */}
              {marketDominationAnalysis && (
                <section>
                  <SectionHeader
                    icon={<Users className="h-5 w-5 text-primary" />}
                    title="Market Domination"
                    sub="Whether the niche is controlled by one brand or many"
                  />
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <p className="text-sm text-foreground leading-relaxed">{marketDominationAnalysis}</p>
                    {advisorImplicationMarketDominationAnalysis && (
                      <p style={{
                        fontSize: '13px',
                        color: 'var(--color-text-secondary)',
                        borderLeft: '2px solid #f97316',
                        paddingLeft: '10px',
                        marginTop: '8px',
                        lineHeight: '1.5'
                      }}>
                        {advisorImplicationMarketDominationAnalysis}
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* Competition Reality — how listings compete (reviews, pricing, positioning) */}
              {(fCompetition?.length ?? 0) > 0 && (
                <section>
                  <SectionHeader
                    icon={<Users className="h-5 w-5 text-primary" />}
                    title="Competition Reality"
                    sub="How listings compete in this niche"
                    helpText={help("competition")}
                  />
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <ul className="flex flex-col gap-2.5">
                      {fCompetition.slice(0, 6).map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-foreground leading-relaxed">
                          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    {advisorImplicationCompetitionReality && (
                      <p style={{
                        fontSize: '13px',
                        color: 'var(--color-text-secondary)',
                        borderLeft: '2px solid #f97316',
                        paddingLeft: '10px',
                        marginTop: '8px',
                        lineHeight: '1.5'
                      }}>
                        {advisorImplicationCompetitionReality}
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* Opportunity — one realistic differentiation opportunity */}
              <section>
                <SectionHeader
                  icon={<Lightbulb className="h-5 w-5 text-emerald-600" />}
                  title="Opportunity"
                  sub="One realistic differentiation opportunity"
                />
                <div className="rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-950/20 p-6">
                  {opportunity ? (
                    <p className="text-sm text-foreground leading-relaxed">{opportunity}</p>
                  ) : fDiffIdeas[0] ? (
                    <p className="text-sm text-foreground leading-relaxed">{fDiffIdeas[0]}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground/60 italic">No opportunity identified.</p>
                  )}
                  {advisorImplicationOpportunity && (
                    <p style={{
                      fontSize: '13px',
                      color: 'var(--color-text-secondary)',
                      borderLeft: '2px solid #f97316',
                      paddingLeft: '10px',
                      marginTop: '8px',
                      lineHeight: '1.5'
                    }}>
                      {advisorImplicationOpportunity}
                    </p>
                  )}
                </div>
              </section>

              {/* Profit Reality — 4 bullets: referral, FBA, COGS, PPC (same wording as before) */}
              <section>
                <SectionHeader
                  icon={<DollarSign className="h-5 w-5 text-primary" />}
                  title="Profit Reality"
                  sub="Real profitability based on margin and PPC assumptions"
                />
                <div className="rounded-2xl border border-border bg-card p-6">
                  {(() => {
                    if (profitExplanation) {
                      const parts = profitExplanation.split(/\s*\(\d\)\s+/).map(s => s.trim()).filter(Boolean)
                      const bullets = parts[0]?.includes("subtract") || parts[0]?.includes("selling price") ? parts.slice(1, 5) : parts.slice(0, 4)
                      const hasNumbered = profitExplanation.includes("(1)") && bullets.length >= 1
                      if (hasNumbered && bullets.length >= 1) {
                        return (
                          <ul className="flex flex-col gap-2.5">
                            {bullets.slice(0, 4).map((item, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground leading-relaxed">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        )
                      }
                      return <p className="text-sm text-foreground leading-relaxed">{profitExplanation}</p>
                    }
                    if (fProfitReality[0]) {
                      return (
                        <ul className="flex flex-col gap-2.5">
                          {fProfitReality.slice(0, 4).map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-foreground leading-relaxed">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )
                    }
                    if (pb) {
                      return (
                        <p className="text-sm text-foreground leading-relaxed">
                          Net profit after ads: {fmt(pb.profitAfterAds)} per unit. ROI and margin depend on your COGS, FBA/referral fees, and assumed ACoS.
                        </p>
                      )
                    }
                    return <p className="text-sm text-muted-foreground/60 italic">No profit analysis available.</p>
                  })()}
                </div>
              </section>

              {/* Launch Capital — inventory, PPC, misc */}
              <section>
                <SectionHeader
                  icon={<DollarSign className="h-5 w-5 text-primary" />}
                  title="Launch Capital"
                  sub="Estimated inventory, PPC, and misc"
                  badge="Investment"
                />
                <div className="rounded-2xl border border-border bg-card p-6">
                  {launchCapitalRequired != null && Number(launchCapitalRequired) > 0 ? (
                    <>
                      <p className="text-2xl font-black text-foreground">${Number(launchCapitalRequired).toLocaleString()}</p>
                      {launchCapitalBreakdown && (
                        <div className="mt-4 flex flex-col gap-2">
                          {launchCapitalBreakdown.inventory != null && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Inventory</span>
                              <span className="font-semibold text-foreground">${Number(launchCapitalBreakdown.inventory).toLocaleString()}</span>
                            </div>
                          )}
                          {launchCapitalBreakdown.ppcMarketing != null && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">PPC</span>
                              <span className="font-semibold text-foreground">${Number(launchCapitalBreakdown.ppcMarketing).toLocaleString()}</span>
                            </div>
                          )}
                          {launchCapitalBreakdown.vineAndMisc != null && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Misc (Vine, etc.)</span>
                              <span className="font-semibold text-foreground">${Number(launchCapitalBreakdown.vineAndMisc).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground/60 italic">No launch capital estimate available.</p>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              SECTION 3 — EXECUTION PLAN (Action Layer)
              30-Day Launch Plan (Week 1, Week 2, Week 3–4), Alternative Keywords (max 3), Early Strategy Guidance
              ═══════════════════════════════════════════════ */}
          {activeTab === "execution" && (
            <div className="mt-10 flex flex-col gap-8 animate-in fade-in duration-300">

              {/* 30-Day Launch Plan — three phases: Week 1, Week 2, Week 3–4 */}
              <section>
                <SectionHeader
                  icon={<Calendar className="h-5 w-5 text-primary" />}
                  title="30-Day Launch Plan"
                  sub="Week 1 · Week 2 · Week 3–4"
                  helpText={help("executionPlan")}
                />
                {(() => {
                  const steps = honeymoonRoadmap?.length ? honeymoonRoadmap : fActionPlan
                  if (!steps?.length) {
                    return (
                      <div className="rounded-2xl border border-border bg-card p-6">
                        <p className="text-sm text-muted-foreground/60 italic">No 30-day plan available.</p>
                      </div>
                    )
                  }
                  const n = steps.length
                  const week1 = steps.slice(0, Math.ceil(n / 3))
                  const week2 = steps.slice(week1.length, week1.length + Math.ceil(n / 3))
                  const week34 = steps.slice(week1.length + week2.length)
                  const phases = [
                    { label: "Week 1", items: week1 },
                    { label: "Week 2", items: week2 },
                    { label: "Week 3–4", items: week34 },
                  ].filter(p => p.items.length > 0)
                  return (
                    <div className="flex flex-col gap-6">
                      {phases.map((phase, pi) => (
                        <div key={pi} className="rounded-2xl border border-border bg-card p-5">
                          <span className="inline-block rounded-lg bg-primary/10 border border-primary/20 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-primary mb-3">
                            {phase.label}
                          </span>
                          <ol className="flex flex-col gap-2.5">
                            {phase.items.map((step, si) => (
                              <li key={si} className="flex items-start gap-3 text-sm text-foreground leading-relaxed">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-muted-foreground">{si + 1}</span>
                                {String(step).replace(/\bkeywords:\s*:\s*/gi, "keywords: ")}
                              </li>
                            ))}
                          </ol>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </section>

              {/* Alternative Keywords — maximum 3 */}
              {altKeywords.length > 0 && (
                <section>
                  <SectionHeader
                    icon={<Target className="h-5 w-5 text-primary" />}
                    title="Alternative Keywords"
                    sub="Up to 3 keyword angles"
                    helpText={help("alternativeKeywords")}
                  />
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex flex-wrap gap-2.5">
                      {altKeywords.slice(0, 3).map((kw, i) => (
                        <button
                          key={i}
                          className="inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 hover:border-primary/40"
                          onClick={() => navigator.clipboard.writeText(kw.keyword)}
                          title={`Copy: ${kw.keyword}`}
                        >
                          <span>{kw.keyword}</span>
                          {kw.cpc && (
                            <span className="text-[11px] font-bold text-primary/80">{kw.cpc}</span>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground/60">Click to copy.</p>
                  </div>
                </section>
              )}

              {/* Early Strategy Guidance — one short recommendation (no price warning here) */}
              <section>
                <SectionHeader
                  icon={<Zap className="h-5 w-5 text-primary" />}
                  title="Early Strategy Guidance"
                  sub="How to approach this niche"
                />
                <div className="rounded-2xl border border-border bg-card p-6">
                  {(() => {
                    const guidance = earlyStrategyGuidance
                      || (typeof fStratIntel === "string" ? fStratIntel : (fStratIntel as string[])?.[0])
                      || consultantSecret
                      || fActionPlan[0]
                      || (fOpportunities[0] ? `Focus on: ${fOpportunities[0]}` : null)
                    if (guidance) {
                      const short = String(guidance).split(/[.!?]/).slice(0, 3).join(". ").trim()
                      return <p className="text-sm text-foreground leading-relaxed">{short}{!short.endsWith(".") ? "." : ""}</p>
                    }
                    return <p className="text-sm text-muted-foreground/60 italic">No early strategy guidance available.</p>
                  })()}
                  {advisorImplicationEarlyStrategyGuidance && (
                    <p style={{
                      fontSize: '13px',
                      color: 'var(--color-text-secondary)',
                      borderLeft: '2px solid #f97316',
                      paddingLeft: '10px',
                      marginTop: '8px',
                      lineHeight: '1.5'
                    }}>
                      {advisorImplicationEarlyStrategyGuidance}
                    </p>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* ── Bottom CTA ────────────────────────────── */}
          <div className="mt-14 flex items-center justify-center gap-4">
            <Link href="/analyze">
              <Button size="lg" className="rounded-xl gap-2">
                Run Another Analysis <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
