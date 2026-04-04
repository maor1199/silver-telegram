"use client"

import { useState, useEffect, useCallback } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useSession } from "@/hooks/use-session"
import {
  Plus, Trash2, TrendingUp, TrendingDown, Star,
  MessageSquare, BarChart2, Loader2, ExternalLink,
  RefreshCw, ThumbsUp, ThumbsDown, Lightbulb,
  Activity, Package, AlertCircle, Bell, X,
  Target, FileText, Zap, CheckCircle2, ArrowUpRight,
  ArrowDownRight, Minus, Search, ChevronRight,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────
type Snapshot = {
  id: string; price: number | null; rating: number | null
  reviews_total: number | null; rank: number | null; created_at: string
}
type Alert = {
  id: string; change_type: string; old_value: string; new_value: string; created_at: string
}
type ReviewAnalysis = {
  complaints: string[]; positives: string[]
  recommendation: string; reviews_analyzed: number
}
type KeywordData = {
  exact: string[]; phrase: string[]; broad: string[]
  competitor_targets: string[]; negative: string[]; tip: string
}
type WeeklyReport = {
  headline: string; headline_type: "positive" | "negative" | "neutral"
  summary: string; highlights: string[]; concerns: string[]
  action_items: string[]; outlook: string
}
type Monitor = {
  id: string; asin: string; product_name: string; image_url: string | null
  last_checked_at: string | null; created_at: string
  latest_snapshot: Snapshot | null; previous_snapshot: Snapshot | null
  snapshots: Snapshot[]; unread_alerts: Alert[]
}

type TabId = "overview" | "reviews" | "keywords" | "report"
const FREE_LIMIT = 5

// ─── Sparkline ────────────────────────────────────────────────────────
function Sparkline({ values, positive }: { values: number[]; positive: boolean }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const W = 72; const H = 28
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * W,
    H - 2 - ((v - min) / range) * (H - 4),
  ])
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const color = positive ? "#10b981" : "#ef4444"
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Metric Card ──────────────────────────────────────────────────────
function MetricCard({
  label, value, delta, deltaLabel, deltaPositive, icon, accent, sparkValues,
}: {
  label: string; value: string; delta?: number | null
  deltaLabel?: string; deltaPositive?: boolean | null
  icon: React.ReactNode; accent: string; sparkValues?: number[]
}) {
  const hasDelta = delta != null && delta !== 0

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-card p-5 flex flex-col gap-3 ${accent.border}`}>
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-[0.07] ${accent.blob}`} />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${accent.icon}`}>{icon}</div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-[28px] font-bold tracking-tight text-foreground leading-none">{value}</span>
        {sparkValues && sparkValues.length >= 2 && (
          <Sparkline values={sparkValues} positive={deltaPositive !== false} />
        )}
      </div>
      {hasDelta ? (
        <div className={`flex items-center gap-1.5 text-[12px] font-semibold ${deltaPositive ? "text-emerald-600" : "text-red-500"}`}>
          {deltaPositive
            ? <ArrowUpRight className="h-3.5 w-3.5" />
            : <ArrowDownRight className="h-3.5 w-3.5" />}
          <span>{deltaLabel}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground/50">
          <Minus className="h-3 w-3" />
          <span>No change</span>
        </div>
      )}
    </div>
  )
}

// ─── Alert Badge ──────────────────────────────────────────────────────
function alertStyle(type: string) {
  switch (type) {
    case "price_drop":     return { label: "Price dropped",        bg: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-500" }
    case "price_increase": return { label: "Price increased",      bg: "bg-red-50 border-red-200 text-red-700",             dot: "bg-red-500" }
    case "reviews_change": return { label: "Review count changed", bg: "bg-blue-50 border-blue-200 text-blue-700",          dot: "bg-blue-500" }
    case "rating_change":  return { label: "Rating changed",       bg: "bg-amber-50 border-amber-200 text-amber-700",       dot: "bg-amber-500" }
    default:               return { label: type,                   bg: "bg-secondary border-border text-muted-foreground",  dot: "bg-muted-foreground" }
  }
}

// ─── Keyword Pill ─────────────────────────────────────────────────────
function KwPill({ text, color }: { text: string; color: string }) {
  return (
    <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[12px] font-medium ${color}`}>
      {text}
    </span>
  )
}

// ─── Tab Content: Overview ────────────────────────────────────────────
function TabOverview({ monitor }: { monitor: Monitor }) {
  const snap = monitor.latest_snapshot
  const prev = monitor.previous_snapshot
  const snaps = monitor.snapshots ?? []

  const priceDelta = snap?.price != null && prev?.price != null ? snap.price - prev.price : null
  const ratingDelta = snap?.rating != null && prev?.rating != null ? snap.rating - prev.rating : null
  const reviewDelta = snap?.reviews_total != null && prev?.reviews_total != null ? snap.reviews_total - prev.reviews_total : null
  const rankDelta = snap?.rank != null && prev?.rank != null ? snap.rank - prev.rank : null

  const priceHistory = snaps.map(s => s.price).filter((v): v is number => v != null)
  const ratingHistory = snaps.map(s => s.rating).filter((v): v is number => v != null)
  const reviewHistory = snaps.map(s => s.reviews_total).filter((v): v is number => v != null)
  const rankHistory = snaps.map(s => s.rank).filter((v): v is number => v != null)

  const ACCENT = {
    price:   { border: "border-orange-100",  blob: "bg-orange-400",  icon: "bg-orange-50 text-orange-500" },
    rating:  { border: "border-yellow-100",  blob: "bg-yellow-400",  icon: "bg-yellow-50 text-yellow-600" },
    reviews: { border: "border-blue-100",    blob: "bg-blue-400",    icon: "bg-blue-50 text-blue-500" },
    rank:    { border: "border-violet-100",  blob: "bg-violet-400",  icon: "bg-violet-50 text-violet-600" },
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Metrics */}
      {snap ? (
        <section>
          <SectionLabel>Live Market Metrics</SectionLabel>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {snap.price != null && (
              <MetricCard
                label="Price" value={`$${snap.price.toFixed(2)}`}
                delta={priceDelta}
                deltaLabel={priceDelta != null ? `$${Math.abs(priceDelta).toFixed(2)} ${priceDelta < 0 ? "drop" : "rise"}` : undefined}
                deltaPositive={priceDelta != null ? priceDelta > 0 : null}
                icon={<BarChart2 className="h-4 w-4" />}
                accent={ACCENT.price}
                sparkValues={priceHistory}
              />
            )}
            {snap.rating != null && (
              <MetricCard
                label="Rating" value={`${snap.rating}★`}
                delta={ratingDelta}
                deltaLabel={ratingDelta != null ? `Was ${prev!.rating}★` : undefined}
                deltaPositive={ratingDelta != null ? ratingDelta > 0 : null}
                icon={<Star className="h-4 w-4" />}
                accent={ACCENT.rating}
                sparkValues={ratingHistory}
              />
            )}
            {snap.reviews_total != null && (
              <MetricCard
                label="Reviews" value={snap.reviews_total.toLocaleString()}
                delta={reviewDelta}
                deltaLabel={reviewDelta != null ? `+${reviewDelta} new` : undefined}
                deltaPositive={reviewDelta != null ? reviewDelta > 0 : null}
                icon={<MessageSquare className="h-4 w-4" />}
                accent={ACCENT.reviews}
                sparkValues={reviewHistory}
              />
            )}
            {snap.rank != null && (
              <MetricCard
                label="BSR Rank" value={`#${snap.rank.toLocaleString()}`}
                delta={rankDelta}
                deltaLabel={rankDelta != null ? (rankDelta < 0 ? `↑ ${Math.abs(rankDelta)} spots` : `↓ ${rankDelta} spots`) : undefined}
                deltaPositive={rankDelta != null ? rankDelta < 0 : null}
                icon={<TrendingUp className="h-4 w-4" />}
                accent={ACCENT.rank}
                sparkValues={rankHistory}
              />
            )}
          </div>
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 py-16 flex flex-col items-center gap-3 text-center">
          <RefreshCw className="h-6 w-6 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-foreground">First scan in progress</p>
          <p className="text-xs text-muted-foreground">Your VA is fetching live Amazon data. Check back shortly.</p>
        </div>
      )}

      {/* Alerts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Change Alerts</SectionLabel>
          {monitor.unread_alerts.length > 0 && (
            <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
              {monitor.unread_alerts.length} NEW
            </span>
          )}
        </div>
        {monitor.unread_alerts.length > 0 ? (
          <div className="flex flex-col gap-2">
            {monitor.unread_alerts.map(a => {
              const s = alertStyle(a.change_type)
              return (
                <div key={a.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${s.bg}`}>
                  <div className={`h-2 w-2 rounded-full shrink-0 ${s.dot}`} />
                  <span className="text-sm font-medium flex-1">
                    {s.label}: <span className="font-normal opacity-80">{a.old_value} → {a.new_value}</span>
                  </span>
                  <span className="text-xs opacity-50 shrink-0">
                    {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card px-5 py-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Bell className="h-4 w-4 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">No changes detected yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                We&apos;ll alert you the moment a price, rating, or review count moves.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

// ─── Tab Content: Review Intelligence ────────────────────────────────
function TabReviews({ monitor, token }: { monitor: Monitor; token: string | null }) {
  const [analysis, setAnalysis] = useState<ReviewAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    if (!token) return
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/monitor/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ asin: monitor.asin }),
      })
      const data = await res.json()
      if (data.ok) setAnalysis(data)
      else setError(data.error ?? "Analysis failed.")
    } catch { setError("Network error.") }
    finally { setLoading(false) }
  }

  if (!analysis && !loading && !error) return (
    <AiFeatureGate
      icon={<MessageSquare className="h-5 w-5 text-primary" />}
      title="AI Review Analysis"
      description="Reads up to 20 customer reviews and extracts what buyers love, what they complain about, and one specific action you can take."
      buttonLabel="Analyze Reviews"
      onRun={run}
    />
  )

  if (loading) return <AiLoading text="Reading reviews and identifying patterns..." />
  if (error) return <AiError error={error} onRetry={run} />

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Based on {analysis!.reviews_analyzed} customer reviews</p>
        <button onClick={() => { setAnalysis(null); run() }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="h-3 w-3" /> Re-analyze
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-red-100 bg-red-50/40 p-5">
          <div className="flex items-center gap-2 mb-4">
            <ThumbsDown className="h-4 w-4 text-red-500" />
            <span className="text-sm font-bold text-foreground">Top Complaints</span>
          </div>
          <ol className="flex flex-col gap-3">
            {analysis!.complaints.map((c, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-500">{i + 1}</span>
                <p className="text-sm text-foreground leading-snug">{c}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
          <div className="flex items-center gap-2 mb-4">
            <ThumbsUp className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-bold text-foreground">What Customers Love</span>
          </div>
          <ol className="flex flex-col gap-3">
            {analysis!.positives.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-600">{i + 1}</span>
                <p className="text-sm text-foreground leading-snug">{p}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {analysis!.recommendation && (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent p-5 flex items-start gap-4">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lightbulb className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1.5">VA Recommendation</p>
            <p className="text-sm text-foreground leading-relaxed">{analysis!.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab Content: PPC Keywords ────────────────────────────────────────
function TabKeywords({ monitor, token }: { monitor: Monitor; token: string | null }) {
  const [data, setData] = useState<KeywordData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    if (!token) return
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/monitor/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ asin: monitor.asin }),
      })
      const d = await res.json()
      if (d.ok) setData(d)
      else setError(d.error ?? "Failed to generate keywords.")
    } catch { setError("Network error.") }
    finally { setLoading(false) }
  }

  if (!data && !loading && !error) return (
    <AiFeatureGate
      icon={<Search className="h-5 w-5 text-primary" />}
      title="PPC Keyword Intelligence"
      description="Analyzes your listing and generates high-converting keyword suggestions for Exact, Phrase, and Broad match campaigns — plus competitor targeting."
      buttonLabel="Generate Keywords"
      onRun={run}
    />
  )

  if (loading) return <AiLoading text="Analyzing listing and generating keyword strategy..." />
  if (error) return <AiError error={error} onRetry={run} />

  const groups = [
    { key: "exact" as const,             label: "Exact Match",          color: "bg-blue-50 text-blue-700 border-blue-100",       note: "Highest precision" },
    { key: "phrase" as const,            label: "Phrase Match",         color: "bg-violet-50 text-violet-700 border-violet-100", note: "Good balance" },
    { key: "broad" as const,             label: "Broad Match",          color: "bg-slate-50 text-slate-600 border-slate-200",    note: "Max discovery" },
    { key: "competitor_targets" as const,label: "Competitor Targets",   color: "bg-orange-50 text-orange-700 border-orange-100", note: "Steal traffic" },
    { key: "negative" as const,          label: "Negative Keywords",    color: "bg-red-50 text-red-600 border-red-100",          note: "Block waste" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Generated from live product data</p>
        <button onClick={() => { setData(null); run() }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="h-3 w-3" /> Regenerate
        </button>
      </div>

      <div className="flex flex-col gap-5">
        {groups.map(g => (
          data![g.key]?.length > 0 && (
            <div key={g.key}>
              <div className="flex items-center gap-2 mb-2.5">
                <span className={`text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${g.color}`}>{g.label}</span>
                <span className="text-[11px] text-muted-foreground/60">{g.note}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data![g.key]!.map((kw: string, i: number) => (
                  <KwPill key={i} text={kw} color={g.color} />
                ))}
              </div>
            </div>
          )
        ))}
      </div>

      {data!.tip && (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent p-5 flex items-start gap-4">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1.5">PPC Pro Tip</p>
            <p className="text-sm text-foreground leading-relaxed">{data!.tip}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab Content: Weekly Report ───────────────────────────────────────
function TabReport({ monitor, token }: { monitor: Monitor; token: string | null }) {
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    if (!token) return
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/monitor/weekly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ asin: monitor.asin }),
      })
      const d = await res.json()
      if (d.ok) setReport(d)
      else setError(d.error ?? "Failed to generate report.")
    } catch { setError("Network error.") }
    finally { setLoading(false) }
  }

  if (!report && !loading && !error) return (
    <AiFeatureGate
      icon={<FileText className="h-5 w-5 text-primary" />}
      title="AI Performance Brief"
      description="Analyzes your product's recent performance data and generates an executive summary with highlights, concerns, and specific action items."
      buttonLabel="Generate Report"
      onRun={run}
    />
  )

  if (loading) return <AiLoading text="Analyzing performance data and generating brief..." />
  if (error) return <AiError error={error} onRetry={run} />

  const headlineColor = report!.headline_type === "positive"
    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : report!.headline_type === "negative"
      ? "text-red-700 bg-red-50 border-red-200"
      : "text-blue-700 bg-blue-50 border-blue-200"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-bold px-3 py-1 rounded-xl border ${headlineColor}`}>
          {report!.headline}
        </span>
        <button onClick={() => { setReport(null); run() }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-foreground leading-relaxed">{report!.summary}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {report!.highlights?.length > 0 && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-3">Highlights</p>
            <ul className="flex flex-col gap-2.5">
              {report!.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground leading-snug">{h}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {report!.concerns?.length > 0 && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-3">Watch Closely</p>
            <ul className="flex flex-col gap-2.5">
              {report!.concerns.map((c, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground leading-snug">{c}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {report!.action_items?.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Action Items</p>
          <ol className="flex flex-col gap-3">
            {report!.action_items.map((a, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</span>
                <p className="text-sm text-foreground leading-snug">{a}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {report!.outlook && (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent p-5 flex items-start gap-4">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
            <ChevronRight className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1.5">Outlook</p>
            <p className="text-sm text-foreground leading-relaxed">{report!.outlook}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Shared UI Helpers ────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">{children}</p>
  )
}

function AiFeatureGate({ icon, title, description, buttonLabel, onRun }: {
  icon: React.ReactNode; title: string; description: string
  buttonLabel: string; onRun: () => void
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card overflow-hidden">
      <div className="px-6 py-8 flex items-start gap-5">
        <div className="h-12 w-12 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center">{icon}</div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-md">{description}</p>
          <Button size="sm" className="mt-4 rounded-xl px-5 gap-1.5" onClick={onRun}>
            <Zap className="h-3.5 w-3.5" /> {buttonLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

function AiLoading({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-12 flex flex-col items-center gap-3">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

function AiError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4">
      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-destructive">{error}</p>
        <button onClick={onRetry} className="mt-1.5 text-xs text-destructive/70 hover:text-destructive underline underline-offset-2 transition-colors">
          Try again
        </button>
      </div>
    </div>
  )
}

// ─── Product Panel ────────────────────────────────────────────────────
function ProductPanel({ monitor, token }: { monitor: Monitor; token: string | null }) {
  const [activeTab, setActiveTab] = useState<TabId>("overview")

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "overview",  label: "Overview",      icon: <Activity className="h-3.5 w-3.5" /> },
    { id: "reviews",   label: "Review AI",     icon: <MessageSquare className="h-3.5 w-3.5" /> },
    { id: "keywords",  label: "PPC Keywords",  icon: <Target className="h-3.5 w-3.5" /> },
    { id: "report",    label: "Performance Brief", icon: <FileText className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="flex flex-col">

      {/* Product Hero */}
      <div className="px-7 py-6 border-b border-border bg-gradient-to-r from-primary/[0.025] via-transparent to-transparent">
        <div className="flex items-start gap-5">
          {monitor.image_url ? (
            <img src={monitor.image_url} alt={monitor.product_name}
              className="h-[72px] w-[72px] rounded-2xl object-contain border border-border bg-white shadow-sm shrink-0" />
          ) : (
            <div className="h-[72px] w-[72px] rounded-2xl border border-border bg-muted flex items-center justify-center shrink-0">
              <Package className="h-7 w-7 text-muted-foreground/25" />
            </div>
          )}
          <div className="flex-1 min-w-0 pt-0.5">
            <h2 className="text-lg font-bold text-foreground leading-snug line-clamp-2">{monitor.product_name}</h2>
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              <span className="font-mono text-[11px] text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-lg">
                {monitor.asin}
              </span>
              <a href={`https://www.amazon.com/dp/${monitor.asin}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:opacity-75 transition-opacity">
                View on Amazon <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground/50 flex items-center gap-1.5">
              <RefreshCw className="h-2.5 w-2.5" />
              {monitor.last_checked_at
                ? `Updated ${new Date(monitor.last_checked_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                : "Pending first scan..."}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex border-b border-border overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-1.5 px-5 py-3.5 text-[13px] font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}>
            <span className={activeTab === tab.id ? "text-primary" : ""}>{tab.icon}</span>
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-7 py-7">
        {activeTab === "overview"  && <TabOverview monitor={monitor} />}
        {activeTab === "reviews"   && <TabReviews monitor={monitor} token={token} />}
        {activeTab === "keywords"  && <TabKeywords monitor={monitor} token={token} />}
        {activeTab === "report"    && <TabReport monitor={monitor} token={token} />}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────
export default function MonitorPage() {
  const { loading: authLoading } = useRequireAuth()
  const { session } = useSession()
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Monitor | null>(null)
  const [asinInput, setAsinInput] = useState("")
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const token = session?.access_token ?? null

  const fetchMonitors = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch("/api/monitor/list", { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.ok) {
        const list: Monitor[] = data.monitors ?? []
        setMonitors(list)
        setUnreadCount(data.unread_count ?? 0)
        setSelected(prev => prev ? (list.find(m => m.id === prev.id) ?? list[0] ?? null) : (list[0] ?? null))
      }
    } catch {}
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { if (!authLoading && session) fetchMonitors() }, [authLoading, session, fetchMonitors])

  const handleAdd = async () => {
    const asin = asinInput.trim().toUpperCase()
    if (!asin) return
    setAdding(true); setAddError(null)
    try {
      const res = await fetch("/api/monitor/add", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ asin }),
      })
      const data = await res.json()
      if (!data.ok) setAddError(data.error ?? "Failed to add.")
      else { setAsinInput(""); setShowAdd(false); await fetchMonitors() }
    } catch { setAddError("Network error.") }
    finally { setAdding(false) }
  }

  const handleRemove = async (id: string) => {
    setRemoving(id)
    try {
      await fetch("/api/monitor/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      })
      await fetchMonitors()
    } catch {}
    finally { setRemoving(null) }
  }

  if (authLoading) return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-[1360px] px-6 py-8">

          {/* ── Page Header ────────────────────── */}
          <div className="flex items-start justify-between mb-7">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Amazon VA Dashboard</h1>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                    {unreadCount} alerts
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground max-w-lg">
                Tracks every metric that matters — price, reviews, BSR — and gives you AI-powered insights to stay ahead.
              </p>
            </div>
            {!loading && monitors.length < FREE_LIMIT && (
              <Button size="sm" className="rounded-xl h-9 gap-1.5 shadow-sm shrink-0" onClick={() => setShowAdd(!showAdd)}>
                <Plus className="h-4 w-4" /> Track Product
              </Button>
            )}
          </div>

          {/* ── Add Product Panel ───────────────── */}
          {showAdd && (
            <div className="mb-6 rounded-2xl border border-border bg-card shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-foreground">Track a new product</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Find the ASIN in the product URL: amazon.com/dp/<strong>ASIN</strong>
                  </p>
                </div>
                <button onClick={() => { setShowAdd(false); setAddError(null); setAsinInput("") }}
                  className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex gap-2.5 max-w-sm">
                <Input placeholder="e.g. B08N5WRWNW" value={asinInput}
                  onChange={e => { setAsinInput(e.target.value); setAddError(null) }}
                  onKeyDown={e => e.key === "Enter" && handleAdd()}
                  className="h-10 rounded-xl font-mono" maxLength={10} autoFocus />
                <Button onClick={handleAdd} disabled={adding || !asinInput.trim()} className="h-10 rounded-xl px-5 shrink-0">
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Track"}
                </Button>
              </div>
              {addError && <p className="mt-2 text-sm text-destructive">{addError}</p>}
              {adding && (
                <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" /> Fetching product data from Amazon...
                </p>
              )}
            </div>
          )}

          {/* ── Loading ─────────────────────────── */}
          {loading && (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* ── Empty State ──────────────────────── */}
          {!loading && monitors.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-28 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-5">
                <Activity className="h-7 w-7 text-muted-foreground/30" />
              </div>
              <h3 className="text-base font-bold text-foreground">Your Amazon VA is ready</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs leading-relaxed">
                Add any product ASIN to track price changes, reviews, BSR, and unlock AI-powered insights.
              </p>
              <Button className="mt-6 rounded-xl gap-1.5 shadow-sm" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4" /> Add your first product
              </Button>
            </div>
          )}

          {/* ── Dashboard ────────────────────────── */}
          {!loading && monitors.length > 0 && (
            <div className="flex gap-5 items-start">

              {/* Sidebar */}
              <div className="w-64 shrink-0 flex flex-col gap-1 sticky top-[76px]">
                <div className="flex items-center justify-between px-1 mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Tracked ({monitors.length}/{FREE_LIMIT})
                  </p>
                </div>

                {monitors.map(m => (
                  <button key={m.id} onClick={() => setSelected(m)}
                    className={`group w-full text-left rounded-xl px-3 py-3 transition-all border ${
                      selected?.id === m.id
                        ? "border-primary/25 bg-primary/[0.04] shadow-sm"
                        : "border-transparent hover:border-border hover:bg-muted/40"
                    }`}>
                    <div className="flex items-center gap-2.5">
                      {m.image_url ? (
                        <img src={m.image_url} alt="" className="h-10 w-10 rounded-xl object-contain border border-border bg-white shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-xl border border-border bg-muted flex items-center justify-center shrink-0">
                          <Package className="h-4 w-4 text-muted-foreground/25" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate leading-tight ${
                          selected?.id === m.id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                        }`}>
                          {m.product_name !== m.asin ? m.product_name : m.asin}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {m.latest_snapshot?.price != null && (
                            <span className="text-xs font-bold text-foreground">${m.latest_snapshot.price.toFixed(2)}</span>
                          )}
                          {m.latest_snapshot?.rating != null && (
                            <span className="text-[11px] text-muted-foreground">{m.latest_snapshot.rating}★</span>
                          )}
                        </div>
                      </div>
                      {m.unread_alerts.length > 0 && (
                        <span className="h-4.5 w-4.5 min-w-[18px] min-h-[18px] rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center shrink-0">
                          {m.unread_alerts.length}
                        </span>
                      )}
                    </div>
                  </button>
                ))}

                {monitors.length < FREE_LIMIT && (
                  <button onClick={() => setShowAdd(true)}
                    className="w-full mt-1 text-left rounded-xl border border-dashed border-border px-3 py-2.5 flex items-center gap-2 text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all">
                    <Plus className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Track a product</span>
                  </button>
                )}

                {selected && (
                  <button onClick={() => handleRemove(selected.id)} disabled={removing === selected.id}
                    className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground/40 hover:text-destructive transition-colors rounded-xl">
                    {removing === selected.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />}
                    Remove from tracking
                  </button>
                )}

                <div className="mt-6 rounded-xl border border-border bg-muted/30 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Free Plan</p>
                  <div className="flex items-center gap-1.5 mb-2">
                    {Array.from({ length: FREE_LIMIT }).map((_, i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full ${i < monitors.length ? "bg-primary" : "bg-border"}`} />
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{monitors.length} of {FREE_LIMIT} products used</p>
                </div>
              </div>

              {/* Main Panel */}
              <div className="flex-1 min-w-0 rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                {selected
                  ? <ProductPanel key={selected.id} monitor={selected} token={token} />
                  : <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">Select a product from the sidebar</div>
                }
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
