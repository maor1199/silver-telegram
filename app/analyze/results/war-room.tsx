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
  Package,
  Activity,
  ChevronRight,
  Flame,
} from "lucide-react"
import { getAnalysisResult } from "@/lib/analysis-store"
import { cn } from "@/lib/utils"

/* ══════════════════════════════════════════════════════════
   MOCK DATA — used in v0 preview when no real analysis exists
   ══════════════════════════════════════════════════════════ */
const MOCK_RESULT: Record<string, unknown> = {
  ok: true,
  verdict: "NO-GO",
  score: 38,
  confidence: 72,
  estimatedMargin: "-31.7%",
  profitBreakdown: {
    sellingPrice: 32.99,
    referralFee: 4.95,
    fbaFee: 5.87,
    cogs: 14.50,
    assumedAcosPercent: 35,
    ppcCostPerUnit: 11.55,
    profitAfterAds: -3.88,
  },
  profitExplanation: "With an estimated ACoS of 35% in a hyper-competitive yoga mat niche, PPC alone erases all margin. At $32.99 price point, FBA fees and referral fees consume ~33% before advertising. The -$3.88 loss per unit means every sale costs you money until organic rank stabilizes, which could take 6-12 months given the 36,632 review average among top competitors.",
  whyThisDecision: [
    "Top 10 competitors average 36,632 reviews — a massive social proof moat that takes years to overcome",
    "Price point of $32.99 leaves a -31.7% margin after PPC costs at 35% ACoS",
    "Market dominated by established brands (Liforme, Manduka, Lululemon) with deep loyalty and high repeat purchase rates",
    "Estimated 18-24 months to reach page 1 organic rank with sustained $3,000+/month ad spend",
    "Product category shows signs of commoditization with increasing race-to-bottom pricing",
  ],
  marketReality: "The yoga mat market on Amazon is a mature, hyper-saturated category generating $450M+ annually. The top 20 listings control 68% of total category revenue. Average BSR for page-1 products is under 500, indicating extremely high velocity. New entrants face a brutal chicken-and-egg problem: you need sales velocity to rank, but you can't get sales velocity without ranking. Price compression is accelerating, with average selling prices dropping 12% YoY as Chinese manufacturers flood the market with sub-$20 alternatives.",
  strategicIntelligence: "The only viable entry strategy would be a premium differentiation play ($50+ price point) targeting an underserved micro-niche like 'hot yoga' or 'travel yoga mats.' However, even these sub-niches are seeing increased competition. The key moat would be building a brand outside Amazon (Instagram, YouTube) to drive external traffic and reduce PPC dependency. Without at least $50K in launch capital and a 12-month runway to profitability, this product is not viable.",
  reviewIntelligence: [
    "Top complaint: mats losing grip when wet (23% of 1-star reviews)",
    "Durability concerns appear after 6+ months of use in 18% of reviews",
    "Customers willing to pay premium for non-toxic, eco-friendly materials",
    "Thickness (6mm vs 4mm) is the #1 decision factor mentioned in reviews",
    "Alignment lines/markings highly valued by intermediate practitioners",
  ],
  marketTrends: [
    "Yoga mat market growing 4.2% CAGR but new seller entries growing 15% YoY",
    "Cork and natural rubber mats trending upward (+28% search volume YoY)",
    "Travel/foldable mats emerging as fastest-growing sub-category",
    "Subscription/replacement mat models gaining traction on DTC sites",
    "Post-pandemic home fitness boom stabilizing — growth rate normalizing",
  ],
  competition: [
    "Liforme: 28,000+ reviews, $120 price point, strong brand loyalty",
    "Manduka PRO: 42,000+ reviews, $80-120 range, professional endorsements",
    "Gaiam: 55,000+ reviews, $20-35 budget segment, massive market share",
    "Alo Yoga: Growing rapidly via influencer partnerships, $70-100 range",
    "Chinese white-label mats: Sub-$15 price point flooding bottom of market",
  ],
  profitabilityReality: [
    "Average selling price in category: $29.99 (declining 12% YoY)",
    "FBA fees consume 18% of revenue at this price point",
    "Minimum viable ad spend: $2,500-3,500/month for launch phase",
    "Break-even requires 45+ units/day organic sales (unlikely in first year)",
    "Seasonal demand spike in January (New Year resolutions) and September (back to routine)",
  ],
  advertisingReality: [
    "Average CPC for 'yoga mat': $1.85 (up 22% from last year)",
    "'Yoga mat' exact match: $2.10 CPC, 450K monthly searches",
    "Long-tail keywords ('thick yoga mat for bad knees') CPC: $0.95-1.20",
    "Estimated ACoS for new listing: 35-45% (industry average for first 90 days)",
    "Sponsored Brand video ads showing 2.5x ROAS vs standard Sponsored Products",
  ],
  risks: [
    "Massive review gap — top 10 average 36,632 reviews vs your 0",
    "Price war risk as Chinese manufacturers continue to undercut",
    "Amazon private label expansion in fitness category",
    "Rising FBA fees reducing already thin margins",
    "Seasonal demand volatility makes inventory planning difficult",
  ],
  opportunities: [
    "Eco-friendly/sustainable materials niche is underserved at premium tier",
    "Travel yoga mat sub-niche has less competition and higher margins",
    "Video content and social proof can accelerate organic ranking",
    "Bundling strategy (mat + strap + bag) increases AOV and differentiation",
    "Corporate wellness programs offer B2B sales channel opportunity",
  ],
  differentiationIdeas: [
    "Patented alignment system with laser-etched guides (utility patent possible)",
    "Built-in antimicrobial layer for hot yoga practitioners",
    "Modular mat system with interchangeable thickness inserts",
    "Companion app with AR yoga poses that map to mat alignment marks",
    "Subscription model: mat + quarterly grip-refresher spray refills",
  ],
  executionPlan: [
    "Month 1-2: Deep competitive analysis and product development — source 3-5 manufacturer samples focusing on wet-grip performance and eco-friendly materials",
    "Month 3: Brand identity creation — logo, packaging, insert cards, lifestyle photography with yoga influencers",
    "Month 4: Pre-launch audience building — Instagram/TikTok content, email list via landing page, 500+ target emails before launch",
    "Month 5-6: Soft launch with 200 units — Vine reviews program, aggressive PPC on long-tail keywords only, target 30% ACoS",
    "Month 7-8: Scale to 500 units/month — expand to Sponsored Brand ads, A+ Content optimization, begin Lightning Deal strategy",
    "Month 9-10: Expand keyword portfolio — target competitor ASINs with Sponsored Display, launch YouTube partnership program",
    "Month 11-12: Evaluate profitability — if ACoS below 25% and organic rank top 20, scale to 1,000 units/month. If not, consider pivot or exit.",
    "Quarter 5+: International expansion to UK/EU Amazon if US metrics are positive, wholesale/B2B channel development",
  ],
  alternativeKeywordsWithCost: [
    { keyword: "travel yoga mat foldable", estimatedCpc: 0.92 },
    { keyword: "hot yoga mat non slip", estimatedCpc: 1.35 },
    { keyword: "cork yoga mat eco friendly", estimatedCpc: 1.10 },
    { keyword: "thick exercise mat home gym", estimatedCpc: 0.88 },
    { keyword: "yoga mat alignment lines", estimatedCpc: 0.75 },
    { keyword: "antimicrobial yoga mat", estimatedCpc: 0.65 },
  ],
  whatWouldMakeGo: [
    "Find a micro-niche with less than 5,000 average reviews in top 10 (e.g., 'yoga mat for bad knees' or 'yoga mat with carrying system')",
    "Secure a manufacturing cost under $8/unit to achieve 20%+ margin after PPC",
    "Build a pre-launch audience of 2,000+ engaged followers to drive day-1 sales velocity",
    "Develop a genuine product differentiation (patent-pending feature) that justifies $50+ price point",
    "Commit minimum $50K launch budget with 12-month runway before expecting profitability",
  ],
}

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

/* ── Parse formattedReport ────────────────────────────── */
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
        // No real data — use mock data for v0 preview / direct navigation
        setData(MOCK_RESULT)
      }
    } catch {
      // Fallback to mock data if anything goes wrong
      setData(MOCK_RESULT)
    }
    setLoading(false)
  }, [router])

  if (loading) return <LoadingSkeleton />
  if (error) return <ErrorState message={error} onRetry={() => router.replace("/analyze")} />
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
          // Support { step, timeframe, detail } objects from execution plan
          if (o.step || o.action || o.task) {
            const parts = [o.timeframe || o.timeline || o.month, o.step || o.action || o.task, o.detail || o.description || o.note].filter(Boolean)
            return parts.length > 0 ? [parts.join(" — ")] : []
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
        return {
          keyword: safeStr(o.keyword ?? o.name ?? o.text, "Unknown"),
          cpc: o.estimatedCpc != null && !isNaN(Number(o.estimatedCpc)) ? `$${Number(o.estimatedCpc).toFixed(2)}` : undefined,
        }
      }
      return { keyword: String(v) }
    })
    : []

  // ── What Would Make GO ─────────────────────────────── 
  const whatWouldMakeGo = safeList(R?.whatWouldMakeGo ?? analysisData?.whatWouldMakeGo ?? R?.what_would_make_go)

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

  const fmt = (val: unknown) => {
    if (val == null) return "N/A"
    const n = Number(val)
    return isNaN(n) ? String(val) : `$${n.toFixed(2)}`
  }

  const ic = "h-4 w-4 text-primary shrink-0"

  /* ── Execution Plan: group into phases ──────────────── */
  const executionPhases: { phase: string; steps: string[] }[] = []
  if (fActionPlan.length > 0) {
    const monthPattern = /^(month\s*\d+|week\s*\d+|phase\s*\d+|q[1-4])\s*[:\-–]/i
    let currentPhase = "Launch Phase"
    let currentSteps: string[] = []

    for (const step of fActionPlan) {
      const match = step.match(monthPattern)
      if (match) {
        if (currentSteps.length > 0) {
          executionPhases.push({ phase: currentPhase, steps: [...currentSteps] })
        }
        currentPhase = match[1].trim()
        currentSteps = [step.replace(monthPattern, "").replace(/^\s*[:\-–]\s*/, "").trim() || step]
      } else {
        currentSteps.push(step)
      }
    }
    if (currentSteps.length > 0) {
      executionPhases.push({ phase: currentPhase, steps: currentSteps })
    }
  }

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
                    <p className="text-3xl font-black text-foreground">{score}<span className="text-base font-normal text-muted-foreground">/100</span></p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Viability Score</p>
                  </div>
                )}
                {confidence != null && !isNaN(confidence) && score !== confidence && (
                  <div className="text-center">
                    <p className="text-3xl font-black text-foreground">{confidence}<span className="text-base font-normal text-muted-foreground">%</span></p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Confidence</p>
                  </div>
                )}
                {profitAfterAds != null && !isNaN(profitAfterAds) && (
                  <div className="text-center">
                    <p className={cn("text-3xl font-black", profitAfterAds >= 0 ? "text-emerald-600" : "text-red-600")}>
                      ${profitAfterAds.toFixed(2)}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Profit After Ads</p>
                  </div>
                )}
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
              TAB: OVERVIEW
              ═══════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <div className="mt-10 flex flex-col gap-10 animate-in fade-in duration-300">

              {/* Why This Decision */}
              <section>
                <SectionHeader
                  icon={<Shield className="h-5 w-5 text-primary" />}
                  title="Why This Decision"
                  sub="Key factors that influenced the AI verdict"
                  helpText={help("whyThisDecision")}
                />
                <div className="rounded-2xl border border-border bg-card p-6">
                  {fWhy.length > 0 ? (
                    <ul className="flex flex-col gap-3.5">
                      {fWhy.map((reason, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-foreground leading-relaxed">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                          {String(reason)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground/60 italic">The advisor did not provide explicit reasoning for this verdict.</p>
                  )}
                </div>
              </section>

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
                          <span className="text-muted-foreground">{row.negative ? `\u2212 ${row.label}` : row.label}</span>
                          <span className={cn("font-semibold", row.negative ? "text-red-500" : "text-foreground")}>
                            {row.negative ? `-${row.value}` : row.value}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {`\u2212 PPC Cost`}
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

              {/* Market Reality Summary */}
              {(typeof fMarketReality === "string" ? fMarketReality : (fMarketReality as string[]).length > 0) && (
                <section>
                  <SectionHeader
                    icon={<Eye className="h-5 w-5 text-primary" />}
                    title="Market Reality"
                    sub="Current competitive landscape analysis"
                    badge="Intelligence"
                  />
                  <div className="rounded-2xl border border-border bg-card p-6">
                    {typeof fMarketReality === "string" ? (
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{fMarketReality}</p>
                    ) : (
                      <ul className="flex flex-col gap-3">
                        {(fMarketReality as string[]).map((item, i) => (
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

              {/* Strategic Intelligence Summary */}
              {(typeof fStratIntel === "string" ? fStratIntel : (fStratIntel as string[]).length > 0) && (
                <section>
                  <SectionHeader
                    icon={<Crosshair className="h-5 w-5 text-primary" />}
                    title="Strategic Intelligence"
                    sub="Deep market positioning and moat analysis"
                  />
                  <div className="rounded-2xl border border-border bg-card p-6">
                    {typeof fStratIntel === "string" ? (
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{fStratIntel}</p>
                    ) : (
                      <ul className="flex flex-col gap-3">
                        {(fStratIntel as string[]).map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-foreground leading-relaxed">
                            <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              )}

              {/* Risks & Opportunities Side-by-Side */}
              {(fRisks.length > 0 || fOpportunities.length > 0) && (
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
                      items={fRisks}
                      accent="red"
                      helpText={help("risks")}
                    />
                    <InsightBlock
                      icon={<TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />}
                      title="Opportunities"
                      items={fOpportunities}
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
                  <InsightBlock icon={<Star className={ic} />} title="Review Intelligence" items={fReviewIntel} accent="blue" helpText={help("reviewIntelligence")} />
                  <InsightBlock icon={<TrendingUp className={ic} />} title="Market Trends" items={fMarketTrends} accent="green" helpText={help("marketTrends")} />
                  <InsightBlock icon={<Users className={ic} />} title="Competition Analysis" items={fCompetition} accent="amber" helpText={help("competition")} />
                </div>
              </section>

              {/* Profit & Advertising Reality */}
              <section>
                <SectionHeader
                  icon={<DollarSign className="h-5 w-5 text-primary" />}
                  title="Profit & Advertising Reality"
                  sub="Unit economics, margins, and advertising cost analysis"
                  badge="Financials"
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <InsightBlock icon={<DollarSign className={ic} />} title="Profitability Analysis" items={fProfitReality} accent="green" helpText={help("profitability")} />
                  <InsightBlock icon={<Megaphone className={ic} />} title="Advertising Pressure" items={fAdReality} accent="red" helpText={help("advertising")} />
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
                  <InsightBlock icon={<AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />} title="Risk Vectors" items={fRisks} accent="red" helpText={help("risks")} />
                  <InsightBlock icon={<Target className="h-4 w-4 text-emerald-500 shrink-0" />} title="Opportunity Map" items={fOpportunities} accent="green" helpText={help("opportunities")} />
                  <InsightBlock icon={<Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />} title="Differentiation Angles" items={fDiffIdeas} accent="amber" helpText={help("differentiationIdeas")} />
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

              {/* What Would Make GO (NO-GO only) */}
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
              TAB: EXECUTION PLAN (12-Month Roadmap)
              ═══════════════════════════════════════════════ */}
          {activeTab === "execution" && (
            <div className="mt-10 flex flex-col gap-10 animate-in fade-in duration-300">

              <section>
                <SectionHeader
                  icon={<ClipboardList className="h-5 w-5 text-primary" />}
                  title="Execution Roadmap"
                  sub="Step-by-step tactical action items with phased timeframes"
                  badge="12-Month Plan"
                  helpText={help("executionPlan")}
                />

                {/* Timeline Roadmap */}
                {executionPhases.length > 1 ? (
                  <div className="flex flex-col gap-0">
                    {executionPhases.map((phase, pi) => (
                      <div key={pi} className="relative flex gap-5">
                        {/* Timeline Connector */}
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 z-10",
                            pi === 0 ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"
                          )}>
                            <Calendar className="h-4 w-4" />
                          </div>
                          {pi < executionPhases.length - 1 && (
                            <div className="w-px flex-1 bg-border" />
                          )}
                        </div>

                        {/* Phase Content */}
                        <div className="flex-1 pb-8">
                          <span className="inline-block rounded-lg bg-primary/10 border border-primary/20 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-primary mb-3">
                            {phase.phase}
                          </span>
                          <div className="rounded-2xl border border-border bg-card p-5">
                            <ol className="flex flex-col gap-3">
                              {phase.steps.map((step, si) => (
                                <li key={si} className="flex items-start gap-3">
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-muted-foreground">
                                    {si + 1}
                                  </span>
                                  <p className="text-sm text-foreground leading-relaxed pt-0.5">{step}</p>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Flat numbered list fallback */
                  <div className="rounded-2xl border border-border bg-card p-6">
                    {fActionPlan.length > 0 ? (
                      <ol className="flex flex-col gap-4">
                        {fActionPlan.map((step, i) => (
                          <li key={i} className="flex items-start gap-4">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                              {i + 1}
                            </span>
                            <p className="text-sm text-foreground leading-relaxed pt-1.5">{String(step)}</p>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-sm text-muted-foreground/60 italic">The advisor did not generate specific action steps for this product.</p>
                    )}
                  </div>
                )}
              </section>

              {/* Quick Stats Recap */}
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
                  {score != null && !isNaN(score) && (
                    <StatCard
                      label="Score"
                      value={`${score}/100`}
                      icon={<Target className="h-4 w-4" />}
                      color={score >= 70 ? "green" : score >= 40 ? "amber" : "red"}
                    />
                  )}
                  {profitAfterAds != null && !isNaN(profitAfterAds) && (
                    <StatCard
                      label="Profit/Unit"
                      value={`$${profitAfterAds.toFixed(2)}`}
                      icon={<DollarSign className="h-4 w-4" />}
                      color={profitAfterAds >= 0 ? "green" : "red"}
                    />
                  )}
                  <StatCard
                    label="Action Items"
                    value={`${fActionPlan.length}`}
                    sub="steps in execution plan"
                    icon={<ClipboardList className="h-4 w-4" />}
                    color="blue"
                  />
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
