"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  ArrowRight,
  Zap,
  Activity,
  ShoppingCart,
  BarChart3,
  RotateCcw,
  Archive,
  Upload,
} from "lucide-react"
import { useSkus } from "@/lib/intelligence/store"
import { generateRiskAlerts } from "@/lib/intelligence/risk-engine"
import { getBusinessHealthScore } from "@/lib/intelligence/health-score"
import type { BusinessHealthScore } from "@/lib/intelligence/health-score"
import { computeDeltas } from "@/lib/intelligence/delta-engine"
import type { DeltaChange } from "@/lib/intelligence/delta-engine"
import { getPriorityFeed } from "@/lib/intelligence/priority-feed"
import type { PriorityItem } from "@/lib/intelligence/priority-feed"
import { cn } from "@/lib/utils"

// ─── Severity config ──────────────────────────────────────────────────────────

function severityConfig(s: "critical" | "high" | "medium") {
  switch (s) {
    case "critical": return {
      pill: "bg-red-100 text-red-700 border-red-200",
      dot: "bg-red-500 animate-pulse",
      bar: "border-red-200 bg-red-50/40",
      label: "CRITICAL",
    }
    case "high": return {
      pill: "bg-orange-100 text-orange-700 border-orange-200",
      dot: "bg-orange-500",
      bar: "border-orange-200 bg-orange-50/20",
      label: "HIGH",
    }
    default: return {
      pill: "bg-yellow-100 text-yellow-700 border-yellow-200",
      dot: "bg-yellow-500",
      bar: "border-yellow-200 bg-yellow-50/20",
      label: "MEDIUM",
    }
  }
}

function categoryIcon(cat: PriorityItem["category"]) {
  switch (cat) {
    case "stockout": return <ShoppingCart className="h-3.5 w-3.5" />
    case "margin":   return <BarChart3    className="h-3.5 w-3.5" />
    case "ppc":      return <Activity     className="h-3.5 w-3.5" />
    case "returns":  return <RotateCcw    className="h-3.5 w-3.5" />
    case "overstock":return <Archive      className="h-3.5 w-3.5" />
  }
}

// ─── Business Health Card ─────────────────────────────────────────────────────

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color =
    score >= 68 ? "bg-green-500" :
    score >= 52 ? "bg-yellow-400" :
    score >= 38 ? "bg-orange-400" : "bg-red-500"
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs tabular-nums font-semibold text-foreground w-7 text-right">{score}</span>
    </div>
  )
}

function HealthCard({ health }: { health: BusinessHealthScore }) {
  const gradeColor =
    health.grade === "A" ? "text-green-600" :
    health.grade === "B" ? "text-blue-600" :
    health.grade === "C" ? "text-yellow-600" :
    health.grade === "D" ? "text-orange-600" : "text-red-600"

  const labelColor =
    health.overall >= 68 ? "text-green-700 bg-green-100 border-green-200" :
    health.overall >= 52 ? "text-yellow-700 bg-yellow-100 border-yellow-200" :
    health.overall >= 38 ? "text-orange-700 bg-orange-100 border-orange-200" :
                           "text-red-700 bg-red-100 border-red-200"

  const dims = [health.inventory, health.profit, health.cashflow, health.operations]
  const worstDim = dims.reduce((a, b) => a.score < b.score ? a : b)

  return (
    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Business Health</p>
          <div className="flex items-baseline gap-3">
            <span className={cn("text-5xl font-black leading-none", gradeColor)}>{health.grade}</span>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">{health.overall}</span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
            </div>
          </div>
        </div>
        <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold mt-1", labelColor)}>
          {health.label}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <ScoreBar score={health.inventory.score}  label="Inventory"  />
        <ScoreBar score={health.profit.score}     label="Profit"     />
        <ScoreBar score={health.cashflow.score}   label="Cashflow"   />
        <ScoreBar score={health.operations.score} label="Operations" />
      </div>

      {worstDim.score < 68 && (
        <p className="text-xs text-muted-foreground border-t border-border/60 pt-3 leading-relaxed">
          <span className="font-semibold text-foreground">{worstDim.label}: </span>
          {worstDim.detail}
        </p>
      )}
    </div>
  )
}

// ─── Since Yesterday Card ─────────────────────────────────────────────────────

function DeltaRow({ change }: { change: DeltaChange }) {
  const isWorse = change.delta < 0 || change.type === "acos_spike" || change.type === "return_spike"
  const arrowColor =
    change.severity === "critical" ? "text-red-500" :
    change.severity === "high"     ? "text-orange-500" : "text-yellow-500"

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <span className={cn("text-sm font-bold leading-tight mt-0.5 shrink-0", arrowColor)}>
        {isWorse ? "↓" : "↑"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground leading-snug">{change.headline}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{change.detail}</p>
      </div>
    </div>
  )
}

function SinceYesterdayCard({ deltas }: { deltas: DeltaChange[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Since Yesterday</p>
        {deltas.length > 0 ? (
          <span className="rounded-full bg-orange-100 text-orange-700 border border-orange-200 text-xs font-semibold px-2 py-0.5">
            {deltas.length} change{deltas.length !== 1 ? "s" : ""}
          </span>
        ) : (
          <span className="rounded-full bg-green-100 text-green-700 border border-green-200 text-xs font-semibold px-2 py-0.5">
            Stable
          </span>
        )}
      </div>

      {deltas.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center gap-2 text-center py-8">
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-base">✓</div>
          <p className="text-sm font-semibold text-foreground">No significant changes</p>
          <p className="text-xs text-muted-foreground max-w-[240px]">Your key metrics are stable since the last session.</p>
        </div>
      ) : (
        <div className="mt-1">
          {deltas.map(d => <DeltaRow key={`${d.skuId}-${d.type}`} change={d} />)}
        </div>
      )}
    </div>
  )
}

// ─── Priority Feed ────────────────────────────────────────────────────────────

function PriorityItemCard({ item }: { item: PriorityItem }) {
  const cfg = severityConfig(item.severity)
  const router = useRouter()

  return (
    <div className={cn("rounded-2xl border p-5 transition-colors hover:shadow-sm", cfg.bar)}>
      <div className="flex items-start gap-4">
        {/* Rank number */}
        <span className="text-xl font-black text-muted-foreground/25 leading-none pt-1 w-6 text-center shrink-0">
          {item.rank}
        </span>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold tracking-wide", cfg.pill)}>
              <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
              {cfg.label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground capitalize">
              {categoryIcon(item.category)}
              {item.category}
            </span>
          </div>

          {/* Headline */}
          <p className="text-[15px] font-bold text-foreground leading-snug mb-1.5">{item.headline}</p>

          {/* Context */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{item.context}</p>

          {/* Action + CTA */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <div className="flex items-start gap-2">
                <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm font-semibold text-foreground leading-snug">{item.action}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 pl-5">{item.impact}</p>
            </div>

            <button
              onClick={() => router.push(`/advisor?q=${encodeURIComponent(item.advisorQ)}`)}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-primary/25 bg-primary/8 hover:bg-primary/15 px-3 py-2 text-xs font-semibold text-primary transition-colors"
            >
              <Zap className="h-3.5 w-3.5" />
              Ask AI
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PriorityFeed({ items }: { items: PriorityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl">✓</div>
        <p className="text-base font-semibold text-foreground">No actions required</p>
        <p className="text-sm text-muted-foreground mt-1">All SKUs are operating within healthy parameters.</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      {items.map(item => <PriorityItemCard key={item.id} item={item} />)}
    </div>
  )
}

// ─── KPI Strip ────────────────────────────────────────────────────────────────

function KpiStrip({ revenue, profit, adSpend }: { revenue: number; profit: number; adSpend: number }) {
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0
  return (
    <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-border/50">
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Monthly Revenue</p>
        <p className="text-xl font-bold text-foreground">${revenue.toLocaleString()}</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Net Profit</p>
        <p className={cn("text-xl font-bold", profit >= 0 ? "text-green-600" : "text-red-600")}>
          {profit >= 0 ? "$" : "-$"}{Math.abs(Math.round(profit)).toLocaleString()}
        </p>
        <p className={cn("text-xs mt-0.5", profit >= 0 ? "text-green-600" : "text-red-500")}>{margin.toFixed(1)}% margin</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Ad Spend</p>
        <p className="text-xl font-bold text-foreground">${adSpend.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{revenue > 0 ? ((adSpend / revenue) * 100).toFixed(0) : 0}% of revenue</p>
      </div>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-muted/40 h-56" />
        <div className="rounded-2xl bg-muted/40 h-56" />
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-2xl bg-muted/40 h-28" />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { skus, meta, hydrated } = useSkus()

  const alerts = hydrated ? generateRiskAlerts(skus)                       : []
  const health = hydrated ? getBusinessHealthScore(skus, alerts)            : null
  const deltas = hydrated ? computeDeltas(skus, meta.source === "demo")    : []
  const feed   = hydrated ? getPriorityFeed(skus, alerts)                  : []

  const activeSkus   = skus.filter(s => s.status === "active")
  const totalRevenue = activeSkus.reduce((s, k) => s + k.monthlyRevenue,   0)
  const totalProfit  = activeSkus.reduce((s, k) => s + k.netProfitMonthly, 0)
  const totalAdSpend = activeSkus.reduce((s, k) => s + k.monthlyAdSpend,   0)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* Data banners */}
      {hydrated && meta.source === "demo" && (
        <div className="border-b border-yellow-200 bg-yellow-50 px-6 py-2.5">
          <div className="mx-auto max-w-[1200px] flex items-center justify-between">
            <p className="text-xs text-yellow-800">
              <span className="font-semibold">Demo data</span> — Upload your CSV to run the risk engine on your real SKUs
            </p>
            <Link href="/data" className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-900 underline underline-offset-2 hover:text-yellow-700">
              <Upload className="h-3 w-3" />
              Import my data
            </Link>
          </div>
        </div>
      )}
      {hydrated && meta.source === "live" && (
        <div className="border-b border-green-200 bg-green-50 px-6 py-2.5">
          <div className="mx-auto max-w-[1200px]">
            <p className="text-xs text-green-800">
              <span className="font-semibold">Live data</span>
              {meta.filename && ` — ${meta.filename}`}
              {meta.rowCount && ` · ${meta.rowCount} SKUs`}
            </p>
          </div>
        </div>
      )}

      <main className="flex-1">
        <div className="mx-auto max-w-[1200px] px-6 py-8">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {!hydrated
                  ? "Loading your business state..."
                  : meta.source === "demo"
                  ? `Demo portfolio · ${activeSkus.length} SKUs`
                  : `${activeSkus.length} active SKU${activeSkus.length !== 1 ? "s" : ""}${meta.filename ? ` · ${meta.filename}` : ""}`
                }
              </p>
            </div>
            <Link
              href="/advisor"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Zap className="h-4 w-4" />
              Ask AI Advisor
            </Link>
          </div>

          {!hydrated && <LoadingSkeleton />}

          {hydrated && (
            <>
              {/* Row 1: Health Score + Since Yesterday */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {health && <HealthCard health={health} />}
                <SinceYesterdayCard deltas={deltas} />
              </div>

              {/* Priority Feed */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-bold text-foreground uppercase tracking-widest">
                    What needs attention now
                  </h2>
                  {feed.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {feed.length} action{feed.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <PriorityFeed items={feed} />
              </div>

              {/* KPI strip */}
              <KpiStrip revenue={totalRevenue} profit={totalProfit} adSpend={totalAdSpend} />
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
