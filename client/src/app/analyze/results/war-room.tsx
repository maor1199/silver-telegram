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
  CalendarDays,
  Zap,
  Eye,
  Crosshair,
  Package,
  Activity,
  ChevronRight,
  Flame,
  Save,
  TrendingUp as TrendUp,
  Search,
  Info,
  FileText,
} from "lucide-react"
import {
  LineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts"
import type { KeepaProductData } from "@/lib/keepa/keepaService"
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
  const [shared, setShared] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "deep-dive" | "execution" | "market-history">("overview")
  const [asinInput, setAsinInput] = useState("")
  const [asinLoading, setAsinLoading] = useState(false)
  const [asinError, setAsinError] = useState<string | null>(null)
  const [keepaData, setKeepaData] = useState<KeepaProductData | null>(null)

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
            const finalData = normalized ? (normalized as unknown as Record<string, unknown>) : raw
            setData(finalData)
            // Extract keepaData if present
            if (finalData?.keepaData && typeof finalData.keepaData === "object") {
              setKeepaData(finalData.keepaData as KeepaProductData)
            }
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
  const verdict =
    isGoBut
      ? "GO-BUT"
      : isGo
        ? "GO"
        : rawVerdict.includes("IMPROVE")
          ? "GO-BUT"
          : rawVerdict.includes("NO-GO")
            ? "NO-GO"
            : "PENDING"

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
  const whyFromReport = safeList(R?.why_this_decision)
  const whyFallback = safeList(R?.whyThisDecision ?? analysisData?.whyThisDecision)
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
  const allEmpty = [whyFromReport, whyFallback, reviewIntel, marketTrends, competitionData, profitReality, adReality, risksData, opportunitiesData, diffIdeas, executionPlan].every(a => a.length === 0)
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
  const finalWhy = whyFromReport.length > 0 ? whyFromReport : whyFallback
  const cleanedWhy = Array.from(new Set(finalWhy))
    .filter((b) => b && String(b).trim().length > 20)
    .slice(0, 3)

  // Market Reality (single source only for Overview)
  const marketRealityOverview =
    safeStr(R?.market_reality ?? analysisData?.market_reality) ||
    safeStr(R?.advisor_implication_expert_insight ?? analysisData?.advisor_implication_expert_insight)
  const marketRealityText = marketRealityOverview ||
    safeStr(R?.expert_insight ?? analysisData?.expert_insight) ||
    safeStr(R?.advisorImplicationExpertInsight ?? analysisData?.advisorImplicationExpertInsight ?? R?.advisor_implication_expert_insight)
  const sentences = marketRealityText
    ?.split(/[.?!]/)
    .map((s) => s.trim())
    .filter(Boolean)
  const uniqueSentences = Array.from(new Set(sentences))
  const cleanedMarket = uniqueSentences
    .filter((s) => s.length > 30)
    .slice(0, 2)
  const finalMarket = cleanedMarket.join(". ") + (cleanedMarket.length ? "." : "")
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
  const supplierMoq = R?.supplierMoq ?? analysisData?.supplierMoq
  const supplierLeadTimeWeeks = R?.supplierLeadTimeWeeks ?? analysisData?.supplierLeadTimeWeeks
  const supplierSampleCost = R?.supplierSampleCost ?? analysisData?.supplierSampleCost

  // ── Verdict Quality ──────────────────────────────────────────────────────
  const confidenceBand = safeStr(R?.confidenceBand ?? analysisData?.confidenceBand) as "STRONG" | "MODERATE" | "BORDERLINE" | ""
  const verdictConfidencePct = R?.verdictConfidencePct ?? analysisData?.verdictConfidencePct
  // ── Break-even ───────────────────────────────────────────────────────────
  const breakEvenUnitsForCapital = R?.breakEvenUnitsForCapital ?? analysisData?.breakEvenUnitsForCapital
  const breakEvenMonths = R?.breakEvenMonths ?? analysisData?.breakEvenMonths
  // ── Return Rate ──────────────────────────────────────────────────────────
  const returnRatePct = safeStr(R?.returnRatePct ?? analysisData?.returnRatePct)
  const returnRateLevel = safeStr(R?.returnRateLevel ?? analysisData?.returnRateLevel) as "low" | "moderate" | "high" | ""
  // ── Price Alert ──────────────────────────────────────────────────────────
  const pricePositionAlertRaw = R?.pricePositionAlert ?? analysisData?.pricePositionAlert
  const pricePositionAlert = (pricePositionAlertRaw && typeof pricePositionAlertRaw === "object")
    ? pricePositionAlertRaw as { type: "TOO_LOW" | "TOO_HIGH"; msg: string }
    : null
  // ── Niche Saturation ─────────────────────────────────────────────────────
  const nicheSaturationLabel = safeStr(R?.nicheSaturationLabel ?? analysisData?.nicheSaturationLabel)
  const nicheSaturationDesc = safeStr(R?.nicheSaturationDesc ?? analysisData?.nicheSaturationDesc)
  // ── DataForSEO ───────────────────────────────────────────────────────────
  const searchVolume = (R?.searchVolume ?? analysisData?.searchVolume) as number | null | undefined
  const searchTrend  = safeStr(R?.searchTrend ?? analysisData?.searchTrend) as "growing" | "declining" | "stable" | ""
  const realCpcUsd   = (R?.realCpcUsd ?? analysisData?.realCpcUsd) as number | null | undefined
  const keywordCompetitionLevel = safeStr(R?.keywordCompetitionLevel ?? analysisData?.keywordCompetitionLevel) as "LOW" | "MEDIUM" | "HIGH" | ""
  // Related keywords from DataForSEO Amazon
  type RelatedKw = { keyword: string; searchVolume: number | null; rank: number }
  const relatedKeywordsRaw = R?.relatedKeywords ?? analysisData?.relatedKeywords
  const relatedKeywords: RelatedKw[] = Array.isArray(relatedKeywordsRaw)
    ? (relatedKeywordsRaw as RelatedKw[]).filter((k) => k?.keyword)
    : []
  // Source of search volume — "amazon" = Helium-10-equivalent real data, "google_ads" = proxy
  const searchVolumeSource = safeStr(
    R?.searchVolumeSource ?? analysisData?.searchVolumeSource
    ?? (R?.dataForSEOData as Record<string,unknown>)?.searchVolumeSource
    ?? (analysisData?.dataForSEOData as Record<string,unknown>)?.searchVolumeSource
  ) as "amazon" | "google_ads" | ""
  // ── Score Breakdown ──────────────────────────────────────────────────────
  const scoreBreakdownRaw = R?.scoreBreakdown ?? analysisData?.scoreBreakdown ?? R?.score_breakdown ?? analysisData?.score_breakdown
  const scoreBreakdown: Record<string, string> = (scoreBreakdownRaw && typeof scoreBreakdownRaw === "object" && !Array.isArray(scoreBreakdownRaw))
    ? scoreBreakdownRaw as Record<string, string>
    : {}
  const financialStressTest = safeStr(R?.financialStressTest ?? analysisData?.financialStressTest ?? R?.financial_stress_test)
  const missSource = safeStr(R?.what_most_sellers_miss)
  const whatMostSellersMiss = missSource ? missSource.split(/[.!?](?:\s|$)/)[0].trim() : ""
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
  const recommendedAction = safeStr(R?.recommendedAction ?? analysisData?.recommendedAction ?? R?.recommended_action)
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

  // ── Advisor Brief ─────────────────────────────────────────────────
  const advisorBrief = safeStr(R?.advisorBrief ?? analysisData?.advisorBrief ?? R?.advisor_brief ?? analysisData?.advisor_brief)

  // ── Differentiation status & warning ──────────────────────────────
  const differentiationWarning = safeStr(R?.differentiationWarning ?? analysisData?.differentiationWarning)
  const differentiationStatus = safeStr(R?.differentiationStatus ?? analysisData?.differentiationStatus) as "none" | "vague" | "unverified" | "weak" | "strong" | ""
  const differentiationSuggestions = safeList(R?.differentiationSuggestions ?? analysisData?.differentiationSuggestions)

  // ── Fix-It Scenarios ────────────────────────────────────────────────
  type FixItScenarios = {
    minPrice?: number | null
    maxCogs?: number | null
    bothPrice?: number | null
    bothCogs?: number | null
    profitAtMinPrice?: number | null
    targetMarginPct?: number
    priceIncreaseNeeded?: number | null
    cogsReductionNeeded?: number | null
  }
  const fixItScenarios = (
    R?.fixItScenarios ?? analysisData?.fixItScenarios ??
    R?.fix_it_scenarios ?? analysisData?.fix_it_scenarios
  ) as FixItScenarios | null | undefined

  // ── Critical Intelligence fields (new — always visible) ───────────
  const tableStakes = safeList(R?.table_stakes ?? analysisData?.table_stakes)
  const whatWinsHere = safeStr(R?.what_wins_here ?? analysisData?.what_wins_here)
  const minimumEntry = safeList(R?.minimum_entry_requirements ?? analysisData?.minimum_entry_requirements)
  const priceBandRaw = R?.price_band ?? analysisData?.price_band
  const priceBand = (priceBandRaw && typeof priceBandRaw === "object")
    ? priceBandRaw as { budget?: number; sweet_spot?: string; premium?: number }
    : null

  // ── Market Intelligence (CPR, Opportunity Score, sales, 5★ price) ─
  const cpr = R?.cpr ?? analysisData?.cpr
  const opportunityScore = R?.opportunityScore ?? analysisData?.opportunityScore ?? R?.opportunity_score ?? analysisData?.opportunity_score
  const demandScore = R?.demandScore ?? analysisData?.demandScore ?? R?.demand_score ?? analysisData?.demand_score
  const topCompetitorMonthlySales = R?.topCompetitorMonthlySales ?? analysisData?.topCompetitorMonthlySales ?? R?.top_competitor_monthly_sales ?? analysisData?.top_competitor_monthly_sales
  const topCompetitorRevenue = R?.topCompetitorRevenue ?? analysisData?.topCompetitorRevenue ?? R?.top_competitor_revenue ?? analysisData?.top_competitor_revenue
  const nicheMonthlyRevenue = R?.nicheMonthlyRevenue ?? analysisData?.nicheMonthlyRevenue ?? R?.niche_monthly_revenue ?? analysisData?.niche_monthly_revenue
  const nicheMonthlyUnits = R?.nicheMonthlyUnits ?? analysisData?.nicheMonthlyUnits ?? R?.niche_monthly_units ?? analysisData?.niche_monthly_units
  const fiveStarPriceRange = safeStr(R?.fiveStarPriceRange ?? analysisData?.fiveStarPriceRange ?? R?.five_star_price_range ?? analysisData?.five_star_price_range)
  const complianceFlags = safeList(R?.complianceFlags ?? analysisData?.complianceFlags ?? R?.compliance_flags ?? analysisData?.compliance_flags)
  const ipRisk = safeStr(R?.ipRisk ?? analysisData?.ipRisk ?? R?.ip_risk ?? analysisData?.ip_risk)
  const painPointsList = safeList(R?.painPointsList ?? analysisData?.painPointsList ?? R?.pain_points_list ?? analysisData?.pain_points_list)
  const launchKeywordsRaw = R?.launchKeywords ?? analysisData?.launchKeywords ?? R?.launch_keywords ?? analysisData?.launch_keywords
  const launchKeywords: { keyword: string; match_type: string; priority: string; bid_note?: string }[] = Array.isArray(launchKeywordsRaw)
    ? launchKeywordsRaw.map((k: unknown) => {
        if (typeof k === "string") return { keyword: k, match_type: "EXACT", priority: "MEDIUM" }
        const o = k as Record<string, unknown>
        return {
          keyword: safeStr(o.keyword ?? o.keyword_text, ""),
          match_type: safeStr(o.match_type, "EXACT"),
          priority: safeStr(o.priority, "MEDIUM"),
          bid_note: safeStr(o.bid_note ?? o.bidNote, ""),
        }
      }).filter(k => k.keyword.length > 0)
    : []
  const topCompetitorsList = (() => {
    const raw = R?.topCompetitorsList ?? analysisData?.topCompetitorsList ?? R?.top_competitors ?? analysisData?.top_competitors ?? (R?.marketSnapshot as Record<string,unknown> | undefined)?.topCompetitors ?? (analysisData?.marketSnapshot as Record<string,unknown> | undefined)?.topCompetitors
    if (!Array.isArray(raw)) return []
    return raw as { position?: number; title?: string; price?: number; ratingsTotal?: number; rating?: number; brand?: string; sponsored?: boolean }[]
  })()

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

  const handleShare = () => {
    if (!data) return
    try {
      const payload = {
        product: safeStr((data as Record<string,unknown>)?.keyword ?? (data as Record<string,unknown>)?.product ?? (data as Record<string,unknown>)?.report && typeof (data as Record<string,unknown>).report === "object" ? ((data as Record<string,unknown>).report as Record<string,unknown>)?.keyword : ""),
        verdict,
        score: score ?? null,
        margin: safeStr((data as Record<string,unknown>)?.estimatedMargin ?? ((data as Record<string,unknown>)?.report as Record<string,unknown>)?.estimatedMargin ?? ""),
        date: new Date().toISOString().slice(0, 10),
      }
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
      const url = `${window.location.origin}/share?d=${encoded}`
      navigator.clipboard.writeText(url).then(() => {
        setShared(true)
        setTimeout(() => setShared(false), 3000)
      })
    } catch {
      // fallback: copy current page URL
      navigator.clipboard.writeText(window.location.href)
      setShared(true)
      setTimeout(() => setShared(false), 3000)
    }
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
                  onClick={handleShare}
                  className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1 text-[10px] font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  {shared ? <Check className="h-3 w-3 text-emerald-500" /> : <ArrowRight className="h-3 w-3" />}
                  {shared ? "Link copied!" : "Share result"}
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

              {/* Confidence Band pill */}
              {confidenceBand && (
                <div className="mt-4 flex justify-center">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
                    confidenceBand === "STRONG"
                      ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                      : confidenceBand === "MODERATE"
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                  )}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {confidenceBand === "STRONG" ? "High confidence" : confidenceBand === "MODERATE" ? "Moderate confidence" : "Borderline — verify inputs"}
                    {verdictConfidencePct != null && (
                      <span className="ml-1 opacity-70">({Number(verdictConfidencePct)}%)</span>
                    )}
                  </span>
                </div>
              )}

              {/* GO-BUT explanation */}
              {verdict === "GO-BUT" && (
                <p className="mt-4 text-sm text-amber-700 dark:text-amber-400 font-medium max-w-md mx-auto">
                  Viable — but margin is tight. Fix at least one of: raise price, cut COGS, or sharpen differentiation before investing.
                </p>
              )}

              {/* Price Position Alert */}
              {pricePositionAlert && (
                <div className={cn(
                  "mt-5 mx-auto max-w-md rounded-xl border px-4 py-3 text-sm text-left",
                  pricePositionAlert.type === "TOO_LOW"
                    ? "border-amber-200/60 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300"
                    : "border-orange-200/60 bg-orange-50/60 dark:border-orange-800/40 dark:bg-orange-950/20 text-orange-800 dark:text-orange-300"
                )}>
                  <span className="font-semibold">{pricePositionAlert.type === "TOO_LOW" ? "⚠ Price too low" : "⚠ Price above market"}</span>
                  <span className="ml-1">{pricePositionAlert.msg}</span>
                </div>
              )}

              {/* No-ASIN data quality warning */}
              {!keepaData && (
                <div className="mt-5 mx-auto max-w-md rounded-xl border border-blue-200/60 bg-blue-50/40 dark:border-blue-800/40 dark:bg-blue-950/20 px-4 py-3 text-xs text-blue-800 dark:text-blue-300">
                  <span className="font-semibold">Estimates only</span> — no ASIN was provided so market data is based on averages.{" "}
                  <Link href="/analyze" className="underline underline-offset-2 font-semibold hover:opacity-80">Re-run with a competitor ASIN</Link> for Keepa-verified numbers.
                </div>
              )}


              {/* ── Advisor Brief ─────────────────────────────────── */}
              {advisorBrief && (
                <div className="mt-6 mx-auto max-w-2xl rounded-2xl border-2 border-primary/20 bg-primary/5 dark:bg-primary/10 px-6 py-5 text-left shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
                      <Brain className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.15em] text-primary/70">Advisor Summary</p>
                      <p className="text-sm text-foreground leading-relaxed font-medium">{advisorBrief}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Metrics Row */}
              <div className="mt-8 flex items-center justify-center gap-8 flex-wrap">
                {score != null && !isNaN(score) && (
                  <div className="text-center relative group">
                    <p className="text-3xl font-black text-foreground">{Math.round(Number(score))}<span className="text-base font-normal text-muted-foreground">/100</span></p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1">
                      Market Score
                      <HelpCircle className="h-3 w-3 text-muted-foreground/40 cursor-help" />
                    </p>
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-xl border border-border bg-popover px-4 py-3 text-left text-xs text-popover-foreground leading-relaxed shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="font-bold mb-1">Market Score vs Verdict</p>
                      <p><strong>Market Score</strong> = how attractive this niche is (demand, competition, growth).</p>
                      <p className="mt-1"><strong>Verdict</strong> = whether <em>your specific numbers</em> (price − COGS − fees − PPC) leave enough profit.</p>
                      <p className="mt-1 text-muted-foreground">A high score with NO-GO means: great market, but your margins need work.</p>
                    </div>
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

              {/* ── Score Breakdown ────────────────────────────── */}
              {Object.keys(scoreBreakdown).filter(k => k !== "base").length > 0 && (
                <div className="mt-6 mx-auto max-w-lg">
                  <details className="group">
                    <summary className="cursor-pointer list-none flex items-center justify-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors select-none">
                      <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                      Score breakdown ({Object.keys(scoreBreakdown).filter(k => k !== "base").length} signals)
                    </summary>
                    <div className="mt-3 flex flex-col gap-1.5 rounded-xl border border-border bg-card/60 p-4">
                      {Object.entries(scoreBreakdown)
                        .filter(([k]) => k !== "base")
                        .map(([, v]) => {
                          const isPos = String(v).startsWith("+")
                          const isNeg = String(v).startsWith("-")
                          return (
                            <div key={v} className="flex items-start gap-2 text-xs">
                              <span className={cn(
                                "mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-bold tabular-nums text-[10px]",
                                isPos ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                                  : isNeg ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                    : "bg-muted text-muted-foreground"
                              )}>
                                {String(v).split(" ")[0]}
                              </span>
                              <span className="text-muted-foreground leading-relaxed">
                                {String(v).split("(")[1]?.replace(")", "") ?? String(v).split(" ").slice(1).join(" ")}
                              </span>
                            </div>
                          )
                        })}
                    </div>
                  </details>
                </div>
              )}

              {/* ── Market Intel Strip ─────────────────────────── */}
              {(cpr != null || opportunityScore != null || demandScore != null || nicheMonthlyRevenue != null || topCompetitorMonthlySales != null || fiveStarPriceRange || searchVolume != null || realCpcUsd != null) && (
                <div className="mt-8 mx-auto max-w-2xl grid grid-cols-3 sm:grid-cols-6 gap-2">

                  {/* 0a — Search Volume (DataForSEO) */}
                  {searchVolume != null && (() => {
                    const trendColor = searchTrend === "growing" ? "text-emerald-600 dark:text-emerald-400"
                      : searchTrend === "declining" ? "text-red-500 dark:text-red-400"
                      : "text-foreground"
                    const trendBorder = searchTrend === "growing" ? "border-emerald-200/60 dark:border-emerald-800/30"
                      : searchTrend === "declining" ? "border-red-200/60 dark:border-red-800/30"
                      : "border-border"
                    const trendIcon = searchTrend === "growing" ? "↑" : searchTrend === "declining" ? "↓" : "→"
                    const volDisplay = searchVolume >= 1000
                      ? `${(searchVolume / 1000).toFixed(searchVolume >= 10000 ? 0 : 1)}K`
                      : String(searchVolume)
                    return (
                      <div className={cn("rounded-xl border p-2.5 text-center bg-card", trendBorder)}>
                        <p className={cn("text-xl font-black tabular-nums", trendColor)}>
                          {volDisplay}
                          <span className="text-xs ml-0.5">{trendIcon}</span>
                        </p>
                        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Searches/mo</p>
                        <p className="text-[8px] text-muted-foreground/50 leading-tight">
                          {searchVolumeSource === "amazon" ? "Amazon data" : searchVolumeSource === "google_ads" ? "Google proxy" : "real data"}
                        </p>
                      </div>
                    )
                  })()}

                  {/* 0b — Real CPC (DataForSEO) */}
                  {realCpcUsd != null && (() => {
                    const cpcColor = realCpcUsd >= 2 ? "text-red-500 dark:text-red-400"
                      : realCpcUsd >= 0.8 ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                    return (
                      <div className="rounded-xl border border-border p-2.5 text-center bg-card">
                        <p className={cn("text-xl font-black tabular-nums", cpcColor)}>
                          ${realCpcUsd.toFixed(2)}
                        </p>
                        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">CPC</p>
                        <p className="text-[8px] text-muted-foreground/50 leading-tight">real data</p>
                      </div>
                    )
                  })()}

                  {/* 1 — Opportunity Score */}
                  {opportunityScore != null && (() => {
                    const os = Number(opportunityScore)
                    const osColor = os >= 65 ? "text-emerald-600 dark:text-emerald-400" : os >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                    const osBorder = os >= 65 ? "border-emerald-200/60 dark:border-emerald-800/30" : os >= 40 ? "border-amber-200/60 dark:border-amber-800/30" : "border-red-200/60 dark:border-red-800/30"
                    return (
                      <div className={cn("rounded-xl border p-2.5 text-center bg-card", osBorder)}>
                        <p className={cn("text-xl font-black tabular-nums", osColor)}>{os}</p>
                        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Opp. Score</p>
                        <p className="text-[8px] text-muted-foreground/50 leading-tight">demand vs comp.</p>
                      </div>
                    )
                  })()}
                  {/* 2 — Demand Score */}
                  {demandScore != null && (() => {
                    const ds = Number(demandScore)
                    const dsColor = ds >= 65 ? "text-emerald-600 dark:text-emerald-400" : ds >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                    const dsBorder = ds >= 65 ? "border-emerald-200/60 dark:border-emerald-800/30" : ds >= 40 ? "border-amber-200/60 dark:border-amber-800/30" : "border-red-200/60 dark:border-red-800/30"
                    return (
                      <div className={cn("rounded-xl border p-2.5 text-center bg-card", dsBorder)}>
                        <p className={cn("text-xl font-black tabular-nums", dsColor)}>{ds}</p>
                        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Demand</p>
                        <p className="text-[8px] text-muted-foreground/50 leading-tight">buyer appetite</p>
                      </div>
                    )
                  })()}
                  {/* 3 — CPR */}
                  {cpr != null && (
                    <div className="rounded-xl border border-border bg-card p-2.5 text-center">
                      <p className="text-xl font-black tabular-nums text-foreground">~{Number(cpr)}</p>
                      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">CPR</p>
                      <p className="text-[8px] text-muted-foreground/50 leading-tight">units → pg 1</p>
                    </div>
                  )}
                  {/* 4 — Niche Monthly Revenue */}
                  {nicheMonthlyRevenue != null && (
                    <div className="rounded-xl border border-border bg-card p-2.5 text-center">
                      <p className="text-xl font-black tabular-nums text-foreground">
                        ${Number(nicheMonthlyRevenue) >= 1000000
                          ? `${(Number(nicheMonthlyRevenue) / 1000000).toFixed(1)}M`
                          : `${(Number(nicheMonthlyRevenue) / 1000).toFixed(0)}k`}
                      </p>
                      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Niche / mo</p>
                      <p className="text-[8px] text-muted-foreground/50 leading-tight">total top-10 rev.</p>
                    </div>
                  )}
                  {/* 5 — Top Seller units */}
                  {topCompetitorMonthlySales != null && (
                    <div className="rounded-xl border border-border bg-card p-2.5 text-center">
                      <p className="text-xl font-black tabular-nums text-foreground">~{Number(topCompetitorMonthlySales).toLocaleString()}</p>
                      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">#1 Units</p>
                      <p className="text-[8px] text-muted-foreground/50 leading-tight">top seller / mo</p>
                    </div>
                  )}
                  {/* 6 — 5★ Price Zone */}
                  {fiveStarPriceRange && (
                    <div className="rounded-xl border border-border bg-card p-2.5 text-center">
                      <p className="text-base font-black text-foreground leading-tight">{fiveStarPriceRange}</p>
                      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">5★ Zone</p>
                      <p className="text-[8px] text-muted-foreground/50 leading-tight">4.5★+ price range</p>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="mt-8 flex items-center justify-center gap-1 rounded-xl bg-secondary/50 p-1 w-fit mx-auto flex-wrap">
                {([
                  { id: "overview",        label: "Overview" },
                  { id: "deep-dive",       label: "Market Data" },
                  { id: "execution",       label: "Launch Plan" },
                  { id: "market-history",  label: keepaData ? "12-Month History ✓" : "12-Month History" },
                ] as const).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "rounded-lg px-4 py-2 text-xs font-bold transition-all",
                      activeTab === tab.id
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab.label}
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
              CRITICAL INTELLIGENCE — always visible, above tabs
              Table Stakes · Price Band · What Wins · Entry Requirements
              ═══════════════════════════════════════════════ */}
          {(tableStakes.length > 0 || whatWinsHere || minimumEntry.length > 0 || priceBand) && (
            <section className="mt-8">
              <div className="mb-3 flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-[0.12em] text-foreground">Before You Decide</h2>
                <span className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary">Must Read</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                {/* Price Band */}
                {priceBand && (
                  <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Price Band</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {priceBand.budget != null && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">Floor</span>
                          <span className="text-sm font-bold text-foreground">${Number(priceBand.budget).toFixed(2)}</span>
                        </div>
                      )}
                      {priceBand.sweet_spot && (
                        <div className="flex items-center justify-between rounded-lg bg-primary/8 px-2 py-1">
                          <span className="text-[11px] font-semibold text-primary">Sweet Spot</span>
                          <span className="text-sm font-black text-primary">{priceBand.sweet_spot}</span>
                        </div>
                      )}
                      {priceBand.premium != null && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">Premium</span>
                          <span className="text-sm font-bold text-foreground">${Number(priceBand.premium).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Table Stakes */}
                {tableStakes.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">What Every Top Seller Has</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 -mt-1">You must match all of these just to compete</p>
                    <ul className="flex flex-col gap-2">
                      {tableStakes.slice(0, 5).map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-foreground/85 leading-snug">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/70" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* What Wins Here */}
                {whatWinsHere && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Why the Top 3 Are Winning</span>
                    </div>
                    <p className="text-[13px] text-foreground leading-relaxed font-medium">{whatWinsHere}</p>
                  </div>
                )}

                {/* Minimum Entry Requirements */}
                {minimumEntry.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Before You Launch</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 -mt-1">Non-negotiable for this market</p>
                    <ul className="flex flex-col gap-2">
                      {minimumEntry.slice(0, 5).map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-foreground/85 leading-snug">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500/60" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>
            </section>
          )}

          {/* ═══════════════════════════════════════════════
              SECTION 1 — OVERVIEW (Decision Layer)
              Verdict + Why This Decision + Market Reality + What Most Miss + Recommended Action + Core Metrics + What Would Flip
              ═══════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <div className="mt-10 flex flex-col gap-8 animate-in fade-in duration-300">

              {/* ── Fix-It: Calculated paths to GO ──────────────────── */}
              {verdict !== "GO" && fixItScenarios && (fixItScenarios.minPrice || fixItScenarios.maxCogs) && (
                <div className="rounded-2xl border-2 border-emerald-300/60 dark:border-emerald-700/40 bg-emerald-50/50 dark:bg-emerald-950/20 px-5 py-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                      <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="w-full">
                      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-700/70 dark:text-emerald-400/70">
                        What it takes to reach GO
                      </p>
                      <div className="flex flex-col gap-3">
                        {fixItScenarios.minPrice != null && fixItScenarios.minPrice > 0 && (
                          <div className="flex items-start gap-2.5">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm mt-0.5 shrink-0">→</span>
                            <p className="text-sm text-foreground leading-relaxed">
                              <strong>Raise price to ${fixItScenarios.minPrice.toFixed(2)}</strong>
                              {fixItScenarios.priceIncreaseNeeded != null && (
                                <span className="text-muted-foreground"> (+${fixItScenarios.priceIncreaseNeeded.toFixed(2)} from current)</span>
                              )}
                              {fixItScenarios.profitAtMinPrice != null && (
                                <span className="text-emerald-700 dark:text-emerald-400"> → profit becomes ${fixItScenarios.profitAtMinPrice.toFixed(2)}/unit</span>
                              )}
                            </p>
                          </div>
                        )}
                        {fixItScenarios.maxCogs != null && fixItScenarios.maxCogs > 0 && (
                          <div className="flex items-start gap-2.5">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm mt-0.5 shrink-0">→</span>
                            <p className="text-sm text-foreground leading-relaxed">
                              <strong>Cut your landed cost to ${fixItScenarios.maxCogs.toFixed(2)}</strong>
                              {fixItScenarios.cogsReductionNeeded != null && (
                                <span className="text-muted-foreground"> (reduce by ${fixItScenarios.cogsReductionNeeded.toFixed(2)})</span>
                              )}
                              <span className="text-muted-foreground"> — at your current price</span>
                            </p>
                          </div>
                        )}
                        {fixItScenarios.bothPrice != null && fixItScenarios.bothCogs != null && (
                          <div className="flex items-start gap-2.5">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm mt-0.5 shrink-0">→</span>
                            <p className="text-sm text-foreground leading-relaxed">
                              <strong>Split the difference:</strong> price to ${fixItScenarios.bothPrice.toFixed(2)} <span className="text-muted-foreground">+</span> landed cost to ${fixItScenarios.bothCogs.toFixed(2)}<span className="text-muted-foreground"> — a smaller change on each side</span>
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed border-t border-emerald-200/60 dark:border-emerald-700/30 pt-3">
                        Target: {fixItScenarios.targetMarginPct ?? 15}% net margin after all fees and estimated ad spend.
                        Update your numbers and re-run to confirm.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Differentiation Warning ──────────────────────────── */}
              {(differentiationStatus === "none" || differentiationStatus === "vague" || differentiationStatus === "unverified") && differentiationWarning && (
                <div className="rounded-2xl border-2 border-amber-300/70 dark:border-amber-700/50 bg-amber-50/60 dark:bg-amber-950/30 px-5 py-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="w-full">
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">
                      {differentiationStatus === "none"
                        ? "No competitive advantage entered"
                        : differentiationStatus === "vague"
                          ? "Your differentiator is too generic"
                          : "Advantage can't be verified without market data"}
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">{differentiationWarning}</p>
                    {differentiationSuggestions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-amber-300/40 dark:border-amber-700/30">
                        <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-2 uppercase tracking-wider">
                          Based on what buyers complain about in this market:
                        </p>
                        <ul className="flex flex-col gap-1.5">
                          {differentiationSuggestions.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
                              <span className="font-bold mt-0.5 shrink-0">→</span>
                              <span>Address <strong>"{s}"</strong> — this appears in 1–2★ competitor reviews. Lead with your solution for this in bullet 1 and image 2.</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Why This Decision — 3 bullets (DATA → IMPLICATION) */}
              {cleanedWhy.length > 0 && (
                <section>
                  <SectionHeader
                    icon={<Shield className="h-5 w-5 text-primary" />}
                    title="Why This Verdict"
                    sub="The key signals behind the decision"
                  />
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <ul className="flex flex-col gap-2.5">
                      {cleanedWhy.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-foreground leading-relaxed">
                          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
                          {String(item)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}

              {/* Differentiation Verdict — only when at least one non-PENDING verdict */}
              {validatedDifferentiators.length > 0 &&
                validatedDifferentiators.some((d: { verdict?: string }) => (d.verdict ?? "PENDING") !== "PENDING") && (
                <section>
                  <SectionHeader
                    icon={<Lightbulb className="h-5 w-5 text-emerald-600" />}
                    title="Your Competitive Edge"
                    sub="Which of your advantages actually matters in this market"
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
                              ? "Strong differentiator — lead with this in your title and image 1."
                              : verdict === "WEAK"
                                ? "Weak angle — mention in bullet 2, not your title."
                                : verdict === "PENDING"
                                  ? "Awaiting analysis."
                                  : "Already standard in this market — every top seller has it. Don't lead with it."
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

              {/* Market Reality — how this market behaves */}
              {finalMarket && (
                <section>
                  <SectionHeader
                    icon={<Brain className="h-5 w-5 text-amber-600" />}
                    title="How This Market Works"
                    sub="What actually drives sales — and costs — in this niche"
                    badge="Expert"
                  />
                  <div className="rounded-2xl border-2 border-amber-300/60 dark:border-amber-700/40 bg-amber-50/50 dark:bg-amber-950/20 p-6 shadow-sm">
                    <p className="text-sm font-medium text-foreground leading-relaxed" style={{ lineHeight: '1.5' }}>
                      {finalMarket}
                    </p>
                  </div>
                </section>
              )}

              {/* What Most Sellers Miss — one short insight */}
              {whatMostSellersMiss && (
                <section>
                  <SectionHeader
                    icon={<Eye className="h-5 w-5 text-primary" />}
                    title="The Trap Most Sellers Fall Into"
                    sub="The hidden pattern that kills most new launches in this niche"
                  />
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <p className="text-sm text-foreground leading-relaxed">{whatMostSellersMiss}</p>
                  </div>
                </section>
              )}

              {/* Recommended Action — one sentence, verdict-dependent */}
              {recommendedAction && (
                <section>
                  <SectionHeader
                    icon={<Target className="h-5 w-5 text-primary" />}
                    title="What to Do Next"
                    sub="One clear action based on this verdict"
                  />
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <p className="text-sm text-foreground leading-relaxed">
                      {recommendedAction}
                    </p>
                  </div>
                </section>
              )}

              {/* Your Numbers — profit breakdown table + cards */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Your Numbers</h3>
                {pb && typeof pb === "object" && (
                  <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b border-border">
                          <td className="py-3 pl-4 font-medium text-foreground">Selling price</td>
                          <td className="py-3 pr-4 text-right tabular-nums text-foreground">${(Number(pb.sellingPrice) || 0).toFixed(2)}</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 pl-4 text-muted-foreground">
                            − Referral fee ({(Number(pb.sellingPrice) || 0) > 0
                              ? Math.round(((Number(pb.referralFee) || 0) / (Number(pb.sellingPrice) || 1)) * 100)
                              : 15}%)
                          </td>
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
                          <td className="py-2 pl-4 text-muted-foreground">
                            − Ad spend
                            <span className="ml-1 text-xs opacity-70">(modeled est.)</span>
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums text-muted-foreground">−${(Number(pb.ppcCostPerUnit) || 0).toFixed(2)}</td>
                        </tr>
                        <tr className="bg-muted/30">
                          <td className="py-3 pl-4 font-semibold text-foreground">Net profit after ads</td>
                          <td className="py-3 pr-4 text-right tabular-nums font-bold text-foreground">${(Number(pb.profitAfterAds) ?? profitAfterAds ?? 0).toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                    <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed px-1">
                      ⚠ Ad spend above is a model estimate — your real cost per click can only be found from a live campaign. Run a $50 auto campaign for 72 hours, then check your Search Term Report.
                    </p>
                    {/* Break-even + Return Rate row */}
                    <div className="mt-3 flex flex-wrap gap-2 px-1">
                      {breakEvenUnitsForCapital != null && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
                          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Break-even</span>
                          <span className="font-semibold text-foreground">
                            {Number(breakEvenUnitsForCapital).toLocaleString()} units
                            {breakEvenMonths != null && <span className="text-muted-foreground"> (~{Number(breakEvenMonths).toFixed(1)} mo)</span>}
                          </span>
                        </div>
                      )}
                      {returnRatePct && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
                          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Est. returns</span>
                          <span className={cn(
                            "font-semibold",
                            returnRateLevel === "high" ? "text-red-600 dark:text-red-400"
                              : returnRateLevel === "moderate" ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          )}>{returnRatePct}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* ── What Would Flip This Decision ─────────────────── */}
              {(verdict === "NO-GO" || verdict === "GO-BUT") && whatWouldMakeGo.length > 0 && (
                <section>
                  <SectionHeader
                    icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
                    title="How to Turn This Into a GO"
                    sub="Fix these specific things, then re-run the analysis"
                  />
                  <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/30 dark:border-emerald-800/40 dark:bg-emerald-950/20 p-6">
                    <ul className="flex flex-col gap-3">
                      {whatWouldMakeGo.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-foreground/90">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            {i + 1}
                          </span>
                          <span>{String(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}

              {/* ── What's Next — clear post-verdict CTA ─── */}
              <section className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-4 w-4 text-primary" />
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">What to do next</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {/* CTA 1 — Listing Builder */}
                  <a
                    href={`/listing-builder`}
                    className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm group"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Write your listing</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Turn your keyword into an A9-optimized title, 5 bullets & description — ready to paste into Seller Central.
                    </p>
                  </a>
                  {/* CTA 2 — PPC Wizard */}
                  <a
                    href="/ppc-wizard"
                    className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm group"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                      <Target className="h-4 w-4 text-amber-600" />
                    </div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Build your PPC campaign</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Calculate exact launch bids, daily budget, and break-even ACoS for your first campaign — before you go live.
                    </p>
                  </a>
                  {/* CTA 3 — New analysis */}
                  <a
                    href="/analyze"
                    className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm group"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                      <RefreshCw className="h-4 w-4 text-emerald-600" />
                    </div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Analyze another product</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Compare options before committing capital. Most sellers check 3–5 ideas before picking one to source.
                    </p>
                  </a>
                </div>
              </section>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              SECTION 2 — DEEP DIVE (Market Intelligence Layer)
              Market Signals, Entry Reality, Market Domination, Competition, Opportunity, Profit Reality, Launch Capital
              ═══════════════════════════════════════════════ */}
          {activeTab === "deep-dive" && (
            <div className="mt-10 flex flex-col gap-8 animate-in fade-in duration-300">

              {/* ── Niche Size ─────────────────────────────────────── */}
              {(nicheMonthlyRevenue != null || nicheMonthlyUnits != null) && (
                <section>
                  <SectionHeader
                    icon={<BarChart3 className="h-5 w-5 text-primary" />}
                    title="How Big Is This Market?"
                    sub="Total sales happening in the top 10 results every month"
                    badge="Market Size"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {nicheMonthlyRevenue != null && (
                      <div className="rounded-2xl border border-border bg-card p-5 text-center">
                        <p className="text-3xl font-black text-foreground">
                          ${Number(nicheMonthlyRevenue) >= 1000000
                            ? `${(Number(nicheMonthlyRevenue) / 1000000).toFixed(1)}M`
                            : `${(Number(nicheMonthlyRevenue) / 1000).toFixed(0)}k`}
                        </p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Revenue / month</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/60">top 10 organic listings</p>
                      </div>
                    )}
                    {nicheMonthlyUnits != null && (
                      <div className="rounded-2xl border border-border bg-card p-5 text-center">
                        <p className="text-3xl font-black text-foreground">
                          {Number(nicheMonthlyUnits) >= 10000
                            ? `${(Number(nicheMonthlyUnits) / 1000).toFixed(0)}k`
                            : Number(nicheMonthlyUnits).toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Units / month</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/60">combined niche volume</p>
                      </div>
                    )}
                    {nicheMonthlyRevenue != null && nicheMonthlyUnits != null && Number(nicheMonthlyUnits) > 0 && (
                      <div className="rounded-2xl border border-border bg-card p-5 text-center">
                        <p className="text-3xl font-black text-foreground">
                          ${(Number(nicheMonthlyRevenue) / Number(nicheMonthlyUnits)).toFixed(0)}
                        </p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg Rev / Unit</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/60">avg selling price in niche</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* ── Competitor X-Ray Table ─────────────────────────── */}
              {topCompetitorsList.length > 0 && (
                <section>
                  <SectionHeader
                    icon={<BarChart3 className="h-5 w-5 text-primary" />}
                    title="What's Already Selling"
                    sub={`${topCompetitorsList.length} products on page 1 right now — their prices, reviews, and whether they're running ads`}
                    badge="Live Data"
                  />
                  <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="py-2.5 pl-4 text-left font-semibold text-muted-foreground w-8">#</th>
                          <th className="py-2.5 pl-3 text-left font-semibold text-muted-foreground">Product</th>
                          <th className="py-2.5 pl-3 text-right font-semibold text-muted-foreground">Price</th>
                          <th className="py-2.5 pl-3 text-right font-semibold text-muted-foreground">Rating</th>
                          <th className="py-2.5 pl-3 text-right font-semibold text-muted-foreground">Reviews</th>
                          <th className="py-2.5 pl-3 pr-4 text-center font-semibold text-muted-foreground">PPC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topCompetitorsList.slice(0, 20).map((comp, i) => {
                          const isWeak = (comp.ratingsTotal ?? 0) < 200
                          const isStrong = (comp.ratingsTotal ?? 0) >= 2000
                          return (
                            <tr key={i} className={cn(
                              "border-b border-border/40 transition-colors hover:bg-muted/20",
                              comp.sponsored && "bg-amber-50/20 dark:bg-amber-950/10",
                              isWeak && "bg-emerald-50/15 dark:bg-emerald-950/10"
                            )}>
                              <td className="py-2 pl-4 tabular-nums text-muted-foreground">{comp.position ?? i + 1}</td>
                              <td className="py-2 pl-3 max-w-[240px]">
                                <p className="truncate text-foreground leading-snug">{comp.title ?? "—"}</p>
                                {comp.brand && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{comp.brand}</p>}
                                {isWeak && <span className="inline-block mt-0.5 rounded px-1 py-px text-[9px] font-bold bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">Weak — Target</span>}
                              </td>
                              <td className="py-2 pl-3 text-right tabular-nums font-semibold text-foreground">
                                {comp.price != null ? `$${comp.price.toFixed(2)}` : "—"}
                              </td>
                              <td className="py-2 pl-3 text-right tabular-nums">
                                <span className={cn("font-semibold", (comp.rating ?? 0) >= 4.5 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
                                  {comp.rating != null ? `${comp.rating.toFixed(1)}★` : "—"}
                                </span>
                              </td>
                              <td className={cn("py-2 pl-3 text-right tabular-nums", isStrong ? "text-red-500 dark:text-red-400 font-semibold" : "text-foreground")}>
                                {comp.ratingsTotal != null ? comp.ratingsTotal.toLocaleString() : "—"}
                              </td>
                              <td className="py-2 pl-3 pr-4 text-center">
                                {comp.sponsored ? (
                                  <span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-amber-100/70 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">PPC</span>
                                ) : (
                                  <span className="text-muted-foreground/30 text-[10px]">org</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    <div className="px-4 py-2 border-t border-border/40 flex items-center gap-4 text-[10px] text-muted-foreground/60">
                      <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-100/80 dark:bg-emerald-900/40 border border-emerald-200/60" /> Weak listing — realistic PPC target</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-100/70 dark:bg-amber-900/30 border border-amber-200/60" /> Sponsored (PPC slot)</span>
                    </div>
                  </div>
                </section>
              )}

              {/* ── Review Mining — top pain points from competitor reviews ── */}
              {painPointsList.length > 0 && (
                <section>
                  <SectionHeader
                    icon={<Star className="h-5 w-5 text-amber-500" />}
                    title="What Buyers Complain About"
                    sub="Real problems buyers mention in competitor reviews — fix these and you win"
                    badge="Voice of Customer"
                  />
                  <div className="rounded-2xl border border-amber-200/40 dark:border-amber-800/20 bg-amber-50/20 dark:bg-amber-950/10 p-5">
                    <div className="flex flex-wrap gap-2">
                      {painPointsList.slice(0, 12).map((pain, i) => (
                        <span key={i} className="rounded-full border border-amber-300/50 dark:border-amber-700/30 bg-background px-3 py-1 text-xs font-medium text-foreground">
                          {pain}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-[11px] text-muted-foreground/70">
                      Lead with a solution to the top pain point in your main image and bullet 1 — this is where conversion is won or lost.
                    </p>
                  </div>
                </section>
              )}

              {/* ── Compliance & IP Risk ──────────────────────────── */}
              {(complianceFlags.length > 0 || ipRisk) && (
                <section>
                  <SectionHeader
                    icon={<Shield className="h-5 w-5 text-red-500" />}
                    title="Legal Requirements"
                    sub="What you must check before ordering samples — certifications, patents, regulations"
                    badge="Must Check"
                  />
                  <div className="rounded-2xl border border-red-200/40 dark:border-red-800/20 bg-red-50/15 dark:bg-red-950/10 p-5 flex flex-col gap-4">
                    {complianceFlags.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">Compliance Requirements</p>
                        <ul className="flex flex-col gap-2.5">
                          {complianceFlags.map((flag, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-[13px] text-foreground/85 leading-relaxed">
                              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                              {flag}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {ipRisk && (
                      <div className={cn(complianceFlags.length > 0 && "border-t border-red-200/30 dark:border-red-800/20 pt-3")}>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">IP Risk Assessment</p>
                        <p className="text-[13px] text-foreground/85 leading-relaxed">{ipRisk}</p>
                      </div>
                    )}
                    {/* Google Patents validation link */}
                    {(() => {
                      const kw = safeStr(R?.keyword ?? analysisData?.keyword ?? R?.product_name ?? analysisData?.product_name)
                      if (!kw) return null
                      const url = `https://patents.google.com/?q=${encodeURIComponent(kw)}&assignee=&country=US`
                      return (
                        <div className="border-t border-red-200/30 dark:border-red-800/20 pt-3">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                          >
                            <Search className="h-3 w-3" />
                            Verify on Google Patents →
                          </a>
                          <p className="mt-0.5 text-[10px] text-muted-foreground/50">Search US patents for "{kw}" before ordering samples</p>
                        </div>
                      )
                    })()}
                  </div>
                </section>
              )}

              {/* Market Signals — full first page (30): avg price, reviews, review structure, new seller presence, keyword saturation, price compression, brand distribution, maturity, sponsored density */}
              <section>
                <SectionHeader
                  icon={<BarChart3 className="h-5 w-5 text-primary" />}
                  title="Page 1 Snapshot"
                  sub="What Amazon's first page looks like — prices, reviews, brand spread, and ad saturation"
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
                        {/* Niche saturation badge */}
                        {nicheSaturationLabel && (
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
                              nicheSaturationLabel === "Open"
                                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                                : nicheSaturationLabel === "Moderate"
                                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                            )}>
                              {nicheSaturationLabel === "Open" ? "🟢" : nicheSaturationLabel === "Moderate" ? "🟡" : "🔴"} {nicheSaturationLabel} Market
                            </span>
                            {nicheSaturationDesc && (
                              <span className="text-xs text-muted-foreground">{nicheSaturationDesc}</span>
                            )}
                          </div>
                        )}
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
                </div>
              </section>

              {/* Competition — brand landscape + how listings actually compete */}
              {(fCompetition.length > 0 || marketDominationAnalysis) && (
                <section>
                  <SectionHeader
                    icon={<Users className="h-5 w-5 text-primary" />}
                    title="Who You're Up Against"
                    sub="Which brands dominate, how they win, and where a new seller can break in"
                  />
                  <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4">
                    {marketDominationAnalysis && (
                      <p className="text-sm text-foreground leading-relaxed">{marketDominationAnalysis}</p>
                    )}
                    {fCompetition.length > 0 && (
                      <ul className={cn("flex flex-col gap-2.5", marketDominationAnalysis && "border-t border-border/50 pt-4")}>
                        {fCompetition.slice(0, 5).map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-foreground leading-relaxed">
                            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              )}

              {/* Opportunity — one realistic differentiation opportunity */}
              {(opportunity || fDiffIdeas[0]) && (
                <section>
                  <SectionHeader
                    icon={<Lightbulb className="h-5 w-5 text-emerald-600" />}
                    title="Your Best Opening"
                    sub="The most realistic way to differentiate and stand out in this niche"
                  />
                  <div className="rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-950/20 p-6">
                    <p className="text-sm text-foreground leading-relaxed">
                      {opportunity || fDiffIdeas[0]}
                    </p>
                  </div>
                </section>
              )}

              {/* Launch Capital — inventory, PPC, misc */}
              <section>
                <SectionHeader
                  icon={<DollarSign className="h-5 w-5 text-primary" />}
                  title="How Much Money You Need"
                  sub="Total investment to get to page 1 — inventory, ads, and setup costs"
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
                          {launchCapitalBreakdown.sample != null && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Samples</span>
                              <span className="font-semibold text-foreground">${Number(launchCapitalBreakdown.sample).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Supplier meta — MOQ + lead time if provided */}
                      {(supplierMoq != null || supplierLeadTimeWeeks != null) && (
                        <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4">
                          {supplierMoq != null && (
                            <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
                              <Package className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">MOQ</span>
                              <span className="font-semibold text-foreground">{Number(supplierMoq).toLocaleString()} units</span>
                            </div>
                          )}
                          {supplierLeadTimeWeeks != null && (
                            <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">Lead time</span>
                              <span className="font-semibold text-foreground">{Number(supplierLeadTimeWeeks)} wks</span>
                            </div>
                          )}
                          {supplierSampleCost != null && (
                            <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
                              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">Samples</span>
                              <span className="font-semibold text-foreground">${Number(supplierSampleCost).toLocaleString()}</span>
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

              {/* ── Related Keywords (DataForSEO Amazon) ───────────────────── */}
              {relatedKeywords.length > 0 && (
                <section>
                  <SectionHeader
                    icon={<Search className="h-5 w-5 text-primary" />}
                    title="Related Amazon Keywords"
                    sub={`${relatedKeywords.length} related searches with real Amazon volume — expand your keyword strategy`}
                  />
                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {relatedKeywords.map((kw) => {
                      const vol = kw.searchVolume
                      const volStr = vol == null ? "—"
                        : vol >= 10000 ? `${(vol / 1000).toFixed(0)}K/mo`
                        : vol >= 1000  ? `${(vol / 1000).toFixed(1)}K/mo`
                        : `${vol}/mo`
                      const volColor = vol == null ? "text-muted-foreground"
                        : vol >= 10000 ? "text-emerald-600 dark:text-emerald-400"
                        : vol >= 3000  ? "text-primary"
                        : vol >= 500   ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                      return (
                        <div
                          key={kw.keyword}
                          className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-secondary text-[10px] font-bold text-muted-foreground">
                              {kw.rank}
                            </span>
                            <span className="truncate text-sm font-medium text-foreground">{kw.keyword}</span>
                          </div>
                          <span className={cn("shrink-0 text-xs font-bold tabular-nums", volColor)}>
                            {volStr}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <p className="mt-3 text-[11px] text-muted-foreground/60">
                    Source: DataForSEO Amazon search volume (US). Use these as Exact Match targets in your PPC campaign after launch.
                  </p>
                </section>
              )}
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
                  title="Your First 30 Days"
                  sub="Exactly what to do — week by week — from day one to your first sales"
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

              {/* ── PPC Launch Keywords ─────────────────────────── */}
              {launchKeywords.length > 0 && (
                <section>
                  <SectionHeader
                    icon={<Crosshair className="h-5 w-5 text-primary" />}
                    title="Ad Keywords to Bid on Day 1"
                    sub={`${launchKeywords.length} ready-to-use search terms — copy directly into your Amazon ad campaign`}
                    badge="Launch Ready"
                  />
                  <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="py-2 pl-4 text-left font-semibold text-muted-foreground">Keyword</th>
                          <th className="py-2 px-3 text-left font-semibold text-muted-foreground w-20">Match</th>
                          <th className="py-2 px-3 text-left font-semibold text-muted-foreground w-20">Priority</th>
                          <th className="py-2 pr-4 text-left font-semibold text-muted-foreground hidden sm:table-cell">Bid Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {launchKeywords.map((kw, i) => {
                          const priorityStyle =
                            kw.priority === "HIGH"
                              ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                              : kw.priority === "MEDIUM"
                                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                                : "bg-muted text-muted-foreground"
                          const matchStyle =
                            kw.match_type === "EXACT"
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary text-muted-foreground"
                          return (
                            <tr
                              key={i}
                              className={cn(
                                "border-b border-border last:border-0 transition-colors hover:bg-muted/20 cursor-pointer group"
                              )}
                              onClick={() => navigator.clipboard.writeText(kw.keyword)}
                              title={`Copy: ${kw.keyword}`}
                            >
                              <td className="py-2.5 pl-4 font-medium text-foreground group-hover:text-primary transition-colors">
                                {kw.keyword}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", matchStyle)}>
                                  {kw.match_type}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", priorityStyle)}>
                                  {kw.priority}
                                </span>
                              </td>
                              <td className="py-2.5 pr-4 text-muted-foreground/70 hidden sm:table-cell max-w-[200px] truncate">
                                {kw.bid_note}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    <p className="px-4 py-2 text-[10px] text-muted-foreground/50 border-t border-border">Click any row to copy keyword.</p>
                  </div>
                </section>
              )}

              {/* Alternative Keywords — maximum 3 */}
              {altKeywords.length > 0 && (
                <section>
                  <SectionHeader
                    icon={<Target className="h-5 w-5 text-primary" />}
                    title="Other Keywords to Test"
                    sub="Related search terms — click to copy"
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
                  title="How to Approach This Niche"
                  sub="The one strategic move that matters most at the start"
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
                </div>
              </section>

              {/* ── Trend & Seasonality Check ────────────────── */}
              {(() => {
                const kw = safeStr(R?.keyword ?? analysisData?.keyword ?? R?.product_name ?? analysisData?.product_name)
                const trendsUrl = kw ? `https://trends.google.com/trends/explore?q=${encodeURIComponent(kw)}&geo=US&date=today%2012-m` : null
                const isSeasonal = keepaData?.isSeasonalWarning
                const seasonNote = keepaData?.seasonalityNote
                return (
                  <section>
                    <SectionHeader
                      icon={<Activity className="h-5 w-5 text-primary" />}
                      title="Is Demand Going Up or Down?"
                      sub="Check before you order — one click opens the trend data"
                    />
                    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3">
                      {isSeasonal && seasonNote && (
                        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200/60 bg-amber-50/40 dark:border-amber-800/40 dark:bg-amber-950/20 p-3">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                          <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{String(seasonNote)}</p>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Check Google Trends before ordering inventory — confirms whether demand is rising, falling, or seasonal.
                        {keepaData && !isSeasonal && " Keepa shows no strong seasonality signal for this ASIN, but verify with Trends."}
                      </p>
                      {trendsUrl && (
                        <a
                          href={trendsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-fit items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                        >
                          <TrendingUp className="h-4 w-4" />
                          Open Google Trends →
                        </a>
                      )}
                    </div>
                  </section>
                )
              })()}
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              SECTION 4 — MARKET HISTORY (Keepa Data)
              BSR 12 months, Price History, Review Growth, Risk Flags
              ═══════════════════════════════════════════════ */}
          {activeTab === "market-history" && (
            <div className="mt-10 flex flex-col gap-8 animate-in fade-in duration-300">

              {/* If no keepa data — show ASIN search */}
              {!keepaData ? (
                <section>
                  {/* What you unlock */}
                  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { icon: <BarChart3 className="h-4 w-4 text-primary" />, label: "BSR Trend", desc: "12-month demand direction" },
                      { icon: <DollarSign className="h-4 w-4 text-primary" />, label: "Price History", desc: "Price war detection" },
                      { icon: <Star className="h-4 w-4 text-primary" />, label: "Review Velocity", desc: "How fast the moat grows" },
                      { icon: <Users className="h-4 w-4 text-primary" />, label: "FBA Competition", desc: "Real FBA seller count" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl border border-dashed border-border bg-card/50 p-3 text-center opacity-60">
                        <div className="flex justify-center mb-1.5">{item.icon}</div>
                        <p className="text-xs font-semibold text-foreground">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-foreground">Enter a competitor ASIN to unlock Market History</h3>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          Find it in any Amazon product URL: <span className="font-mono text-foreground/70">amazon.com/dp/<strong>B08N5WRWNW</strong></span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="text"
                          value={asinInput}
                          onChange={e => setAsinInput(e.target.value.toUpperCase())}
                          placeholder="e.g. B08N5WRWNW"
                          maxLength={10}
                          className="w-40 h-10 rounded-xl border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <button
                          disabled={asinInput.length !== 10 || asinLoading}
                          onClick={async () => {
                            setAsinLoading(true)
                            setAsinError(null)
                            try {
                              const res = await fetch(`/api/keepa/product?asin=${asinInput}`)
                              const json = await res.json()
                              if (!res.ok) throw new Error(json.error ?? "Failed")
                              setKeepaData(json as KeepaProductData)
                            } catch (e) {
                              setAsinError(e instanceof Error ? e.message : "Failed to fetch data")
                            } finally {
                              setAsinLoading(false)
                            }
                          }}
                          className="h-10 px-5 rounded-xl bg-primary text-xs font-bold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors whitespace-nowrap"
                        >
                          {asinLoading ? "Loading..." : "Fetch Data →"}
                        </button>
                      </div>
                    </div>
                    {asinError && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                        <p className="text-xs text-destructive">{asinError}</p>
                      </div>
                    )}
                    <p className="mt-3 text-[11px] text-muted-foreground/60">
                      Tip: enter the ASIN in Step 1 of the analysis form next time to automatically include Market History in your results.
                    </p>
                  </div>
                </section>
              ) : (
                <>
                  {/* Risk & Opportunity Flags */}
                  {(keepaData.amazonIsSelling || keepaData.isSeasonalWarning || keepaData.isPriceWarWarning || keepaData.sellerCountTrend === "growing" || (keepaData.outOfStockPct30 != null && keepaData.outOfStockPct30 > 25)) && (
                    <section>
                      <div className="flex flex-col gap-3">
                        {keepaData.amazonIsSelling && (
                          <div className="flex items-start gap-3 rounded-2xl border border-red-400/60 dark:border-red-700/40 bg-red-50/60 dark:bg-red-950/25 p-4">
                            <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-bold text-red-700 dark:text-red-400">Amazon Sells This Product Directly</p>
                              <p className="mt-0.5 text-sm text-red-600/80 dark:text-red-400/80">Amazon.com holds the Buy Box. As a 3P seller you will almost never win it — you need a true private-label differentiation to justify entering this market.</p>
                            </div>
                          </div>
                        )}
                        {keepaData.outOfStockPct30 != null && keepaData.outOfStockPct30 > 25 && (
                          <div className="flex items-start gap-3 rounded-2xl border border-emerald-300/60 dark:border-emerald-700/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
                            <Package className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Supply Shortage — Unmet Demand</p>
                              <p className="mt-0.5 text-sm text-emerald-600/80 dark:text-emerald-400/80">Top competitor was out of stock <strong>{keepaData.outOfStockPct30.toFixed(0)}%</strong> of the last 30 days. Demand exceeds supply — a well-stocked new seller can capture ranking quickly.</p>
                            </div>
                          </div>
                        )}
                        {keepaData.sellerCountTrend === "growing" && (
                          <div className="flex items-start gap-3 rounded-2xl border border-amber-300/60 dark:border-amber-700/40 bg-amber-50/50 dark:bg-amber-950/20 p-4">
                            <Users className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Rising Seller Count — Commoditization Risk</p>
                              <p className="mt-0.5 text-sm text-amber-700/80 dark:text-amber-400/80">The number of sellers listing this product is trending up. Price pressure will increase — differentiation is mandatory to avoid a race to the bottom.</p>
                            </div>
                          </div>
                        )}
                        {keepaData.isSeasonalWarning && (
                          <div className="flex items-start gap-3 rounded-2xl border border-amber-300/60 dark:border-amber-700/40 bg-amber-50/50 dark:bg-amber-950/20 p-4">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Seasonal Product Warning</p>
                              <p className="mt-0.5 text-sm text-amber-700/80 dark:text-amber-400/80">{keepaData.seasonalityNote}</p>
                            </div>
                          </div>
                        )}
                        {keepaData.isPriceWarWarning && (
                          <div className="flex items-start gap-3 rounded-2xl border border-red-300/60 dark:border-red-700/40 bg-red-50/50 dark:bg-red-950/20 p-4">
                            <TrendingDown className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-bold text-red-700 dark:text-red-400">Price War Detected</p>
                              <p className="mt-0.5 text-sm text-red-600/80 dark:text-red-400/80">{keepaData.priceWarNote}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Key Metrics Strip */}
                  <section>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {keepaData.currentBsr != null && (
                        <div className="rounded-2xl border border-border bg-card p-4 text-center">
                          <p className="text-xl font-black text-foreground">#{keepaData.currentBsr.toLocaleString()}</p>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">BSR</p>
                          <p className={cn("text-[10px] mt-0.5 font-medium",
                            keepaData.bsrTrend === "improving" ? "text-emerald-600 dark:text-emerald-400" :
                            keepaData.bsrTrend === "declining" ? "text-red-500" : "text-muted-foreground"
                          )}>
                            {keepaData.bsrTrend === "improving" ? "↑ growing" : keepaData.bsrTrend === "declining" ? "↓ declining" : "→ stable"}
                          </p>
                        </div>
                      )}
                      {keepaData.estimatedMonthlySales != null && (
                        <div className="rounded-2xl border border-border bg-card p-4 text-center">
                          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">~{keepaData.estimatedMonthlySales.toLocaleString()}</p>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">Est. Sales/Mo</p>
                          {keepaData.salesDrops30 != null && (
                            <p className="text-[10px] mt-0.5 text-muted-foreground">{keepaData.salesDrops30} rank drops/30d</p>
                          )}
                        </div>
                      )}
                      {keepaData.currentPrice != null && (
                        <div className="rounded-2xl border border-border bg-card p-4 text-center">
                          <p className="text-xl font-black text-foreground">${keepaData.currentPrice.toFixed(2)}</p>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">Current Price</p>
                          {keepaData.realFbaFee != null && (
                            <p className="text-[10px] mt-0.5 text-muted-foreground">FBA fee: ${keepaData.realFbaFee.toFixed(2)}</p>
                          )}
                        </div>
                      )}
                      {keepaData.currentReviewCount != null && (
                        <div className="rounded-2xl border border-border bg-card p-4 text-center">
                          <p className="text-xl font-black text-foreground">{keepaData.currentReviewCount.toLocaleString()}</p>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">Total Reviews</p>
                          {keepaData.reviewVelocityMonthly > 0 && (
                            <p className="text-[10px] mt-0.5 text-muted-foreground">+{keepaData.reviewVelocityMonthly}/mo</p>
                          )}
                        </div>
                      )}
                      {keepaData.currentSellerCount != null && (
                        <div className="rounded-2xl border border-border bg-card p-4 text-center">
                          <p className="text-xl font-black text-foreground">{keepaData.currentSellerCount}</p>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">Competing Sellers</p>
                          <p className={cn("text-[10px] mt-0.5 font-medium",
                            keepaData.sellerCountTrend === "growing" ? "text-amber-500" :
                            keepaData.sellerCountTrend === "shrinking" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                          )}>
                            {keepaData.sellerCountTrend === "growing" ? "↑ commoditizing" : keepaData.sellerCountTrend === "shrinking" ? "↓ consolidating" : "→ stable"}
                          </p>
                        </div>
                      )}
                      {keepaData.fbaSellerCount != null && (
                        <div className={cn("rounded-2xl border bg-card p-4 text-center",
                          keepaData.fbaSellerCount >= 8 ? "border-amber-400/60 bg-amber-50/50 dark:bg-amber-950/20" : "border-border"
                        )}>
                          <p className={cn("text-xl font-black",
                            keepaData.fbaSellerCount >= 8 ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                          )}>{keepaData.fbaSellerCount}</p>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">FBA Sellers</p>
                          <p className={cn("text-[10px] mt-0.5 font-medium",
                            keepaData.fbaSellerCount >= 8 ? "text-amber-600 dark:text-amber-400" :
                            keepaData.fbaSellerCount <= 3 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                          )}>
                            {keepaData.fbaSellerCount >= 8 ? "⚠ heavy FBA competition" : keepaData.fbaSellerCount <= 3 ? "✓ low FBA density" : "moderate"}
                          </p>
                        </div>
                      )}
                      {keepaData.estimatedMonthlyStoragePerUnit != null && (
                        <div className="rounded-2xl border border-border bg-card p-4 text-center">
                          <p className="text-xl font-black text-foreground">${keepaData.estimatedMonthlyStoragePerUnit.toFixed(3)}</p>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">Storage/Unit/Mo</p>
                          <p className="text-[10px] mt-0.5 text-muted-foreground">
                            {keepaData.sizeTier ?? "standard"} tier
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* BSR History Chart */}
                  {keepaData.monthlyHistory.some(p => p.bsr != null) && (
                    <section>
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            Sales Rank (BSR) — 12 Months
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Lower = more sales.{" "}
                            <span className={cn(
                              "font-semibold",
                              keepaData.bsrTrend === "improving" ? "text-emerald-600" :
                              keepaData.bsrTrend === "declining" ? "text-red-500" : "text-muted-foreground"
                            )}>
                              Trend: {keepaData.bsrTrend === "improving" ? "📈 Improving (demand growing)" :
                                       keepaData.bsrTrend === "declining" ? "📉 Declining (demand falling)" :
                                       "➡️ Stable"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-border bg-card p-4">
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart data={keepaData.monthlyHistory.filter(p => p.bsr != null)} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
                            <YAxis reversed tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={55}
                              tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
                            <Tooltip
                              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                              formatter={(v: number) => [`#${v.toLocaleString()}`, "BSR"]}
                            />
                            <Line type="monotone" dataKey="bsr" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                        <p className="text-[11px] text-muted-foreground mt-2 text-center">Y-axis inverted: higher on chart = lower BSR = more sales</p>
                      </div>
                    </section>
                  )}

                  {/* Price History Chart */}
                  {keepaData.monthlyHistory.some(p => p.price != null) && (
                    <section>
                      <div className="mb-4">
                        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-primary" />
                          Price History — 12 Months
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{keepaData.priceWarNote}</p>
                      </div>
                      <div className="rounded-2xl border border-border bg-card p-4">
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={keepaData.monthlyHistory.filter(p => p.price != null)} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={45}
                              tickFormatter={v => `$${v}`} />
                            <Tooltip
                              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                              formatter={(v: number) => [`$${v.toFixed(2)}`, "Price"]}
                            />
                            <Line type="monotone" dataKey="price"
                              stroke={keepaData.isPriceWarWarning ? "#ef4444" : "#10b981"}
                              strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </section>
                  )}

                  {/* Review Growth */}
                  {keepaData.monthlyHistory.some(p => p.reviews != null) && (
                    <section>
                      <div className="mb-4">
                        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                          <Star className="h-4 w-4 text-amber-500" />
                          Review Count Growth — 12 Months
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Avg new reviews/month: <strong className="text-foreground">~{keepaData.reviewVelocityMonthly.toLocaleString()}/mo</strong>
                          {keepaData.reviewVelocityMonthly > 0 && keepaData.currentReviewCount && (
                            <span> — to reach this level starting at 0: ~{Math.ceil(keepaData.currentReviewCount / Math.max(keepaData.reviewVelocityMonthly, 1))} months</span>
                          )}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border bg-card p-4">
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={keepaData.monthlyHistory.filter(p => p.reviews != null)} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={50}
                              tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : String(v)} />
                            <Tooltip
                              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                              formatter={(v: number) => [v.toLocaleString(), "Reviews"]}
                            />
                            <Line type="monotone" dataKey="reviews" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </section>
                  )}

                  {/* Seller Count Chart */}
                  {keepaData.monthlyHistory.some(p => p.sellerCount != null) && (
                    <section>
                      <div className="mb-4">
                        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          Competing Sellers — 12 Months
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Current: <strong className="text-foreground">{keepaData.currentSellerCount ?? "—"} sellers</strong>
                          {keepaData.sellerCountTrend === "growing" && <span className="ml-2 text-amber-500 font-semibold">↑ Commoditizing — price war risk</span>}
                          {keepaData.sellerCountTrend === "shrinking" && <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-semibold">↓ Consolidating</span>}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border bg-card p-4">
                        <ResponsiveContainer width="100%" height={140}>
                          <LineChart data={keepaData.monthlyHistory.filter(p => p.sellerCount != null)} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={30} />
                            <Tooltip
                              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                              formatter={(v: number) => [v, "Sellers"]}
                            />
                            <Line type="monotone" dataKey="sellerCount"
                              stroke={keepaData.sellerCountTrend === "growing" ? "#f59e0b" : "#6366f1"}
                              strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </section>
                  )}

                  {/* Seasonal Demand Calendar */}
                  {keepaData.seasonalCalendar && keepaData.seasonalCalendar.length > 0 && (
                    <section>
                      <div className="mb-4">
                        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-primary" />
                          Seasonal Demand Calendar
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Relative demand by month (1.0 = average).
                          {keepaData.peakSalesMonths && keepaData.peakSalesMonths.length > 0 && (
                            <span className="ml-1 font-semibold text-emerald-600 dark:text-emerald-400">
                              🔥 Peak: {keepaData.peakSalesMonths.join(", ")}
                            </span>
                          )}
                          {keepaData.troughSalesMonths && keepaData.troughSalesMonths.length > 0 && (
                            <span className="ml-2 font-semibold text-muted-foreground">
                              ❄️ Slow: {keepaData.troughSalesMonths.join(", ")}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border bg-card p-4">
                        <ResponsiveContainer width="100%" height={160}>
                          <BarChart data={keepaData.seasonalCalendar} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={30}
                              tickFormatter={(v: number) => v.toFixed(1)} domain={[0, "auto"]} />
                            <Tooltip
                              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                              formatter={(v: number) => [`${v.toFixed(2)}×`, "Demand Index"]}
                            />
                            <ReferenceLine y={1} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
                            <Bar dataKey="relativeVolume" radius={[4, 4, 0, 0]}>
                              {keepaData.seasonalCalendar.map((entry) => (
                                <Cell
                                  key={entry.month}
                                  fill={entry.relativeVolume >= 1.2 ? "#10b981" : entry.relativeVolume <= 0.8 ? "#94a3b8" : "#6366f1"}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        <p className="text-[11px] text-muted-foreground mt-2 text-center">
                          Green = peak months (≥1.2×) · Purple = average · Grey = slow months (≤0.8×). Source inventory 10–12 weeks before green bars.
                        </p>
                      </div>
                    </section>
                  )}

                  {/* Manual ASIN override */}
                  <section>
                    <div className="rounded-2xl border border-border bg-card/50 p-4 flex items-center gap-3">
                      <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground flex-1">Showing data for ASIN: <strong className="font-mono text-foreground">{keepaData.asin}</strong>. Want to check a different competitor?</p>
                      <button
                        onClick={() => setKeepaData(null)}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Change ASIN
                      </button>
                    </div>
                  </section>
                </>
              )}
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

          {/* ── Disclaimer ────────────────────────────── */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            The goal isn&apos;t to be 100% right — it&apos;s to help you avoid obvious bad decisions. Always do your own research.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
