"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Minus,
  DollarSign,
  AlertCircle,
} from "lucide-react"
import { useSkus } from "@/lib/intelligence/store"
import { getProfitSnapshots } from "@/lib/intelligence/risk-engine"
import type { ProfitSnapshot, ProfitStatus } from "@/lib/intelligence/types"
import { cn } from "@/lib/utils"
import Link from "next/link"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusConfig(s: ProfitStatus) {
  switch (s) {
    case "unprofitable": return { color: "text-red-700",    bg: "bg-red-100 border-red-200",       dot: "bg-red-500 animate-pulse",  label: "Losing Money" }
    case "at_risk":      return { color: "text-orange-700", bg: "bg-orange-100 border-orange-200", dot: "bg-orange-500",             label: "At Risk" }
    case "watch":        return { color: "text-yellow-700", bg: "bg-yellow-100 border-yellow-200", dot: "bg-yellow-500",             label: "Declining" }
    default:             return { color: "text-green-700",  bg: "bg-green-100 border-green-200",   dot: "bg-green-500",              label: "Healthy" }
  }
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-green-500" />
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-red-500" />
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
}

function MarginBar({ margin }: { margin: number }) {
  const clamp = Math.min(Math.max(margin, -20), 50)
  const pct = ((clamp + 20) / 70) * 100
  const color = margin < 0 ? "bg-red-500" : margin < 12 ? "bg-orange-400" : margin < 18 ? "bg-yellow-400" : "bg-green-400"
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-xs tabular-nums font-semibold w-12", margin < 0 ? "text-red-600" : margin < 12 ? "text-orange-600" : margin < 18 ? "text-yellow-600" : "text-green-600")}>
        {margin.toFixed(1)}%
      </span>
    </div>
  )
}

function AcosBar({ acos }: { acos: number }) {
  const pct = Math.min(acos, 80) / 80 * 100
  const color = acos >= 50 ? "bg-red-500" : acos >= 35 ? "bg-orange-400" : acos >= 25 ? "bg-yellow-400" : "bg-green-400"
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-xs tabular-nums font-semibold w-10", acos >= 50 ? "text-red-600" : acos >= 35 ? "text-orange-600" : acos >= 25 ? "text-yellow-600" : "text-green-600")}>
        {acos.toFixed(0)}%
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfitPage() {
  const { skus, meta, hydrated } = useSkus()
  const snapshots = hydrated ? getProfitSnapshots(skus) : []

  const totalRevenue = snapshots.reduce((s, p) => s + p.monthlyRevenue, 0)
  const totalProfit = snapshots.reduce((s, p) => s + p.netProfitMonthly, 0)
  const totalAdSpend = snapshots.reduce((s, p) => s + p.adSpend, 0)
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
  const overallAcos = totalRevenue > 0 ? (totalAdSpend / totalRevenue) * 100 : 0

  const unprofitable = snapshots.filter(s => s.status === "unprofitable")
  const healthy = snapshots.filter(s => s.status === "healthy")

  const sortedByProfit = [...snapshots].sort((a, b) => a.netProfitMonthly - b.netProfitMonthly)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Demo banner */}
        {hydrated && meta.source === "demo" && (
          <div className="border-b border-yellow-200 bg-yellow-50 px-6 py-2.5">
            <div className="mx-auto max-w-[1200px] flex items-center justify-between">
              <p className="text-xs text-yellow-800">
                <span className="font-semibold">Demo data</span> — Showing sample SKUs. Upload your CSV to see real profitability.
              </p>
              <Link href="/data" className="text-xs font-semibold text-yellow-900 underline underline-offset-2 hover:text-yellow-700">
                Import my data →
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

        <div className="mx-auto max-w-[1200px] px-6 py-8">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Profit & Margin Intelligence</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              True profitability per SKU after all costs — fees, PPC, returns, storage. Identify margin erosion before it becomes a loss.
            </p>
          </div>

          {/* ── Portfolio KPIs ──────────────────────────────────────────────── */}
          {!hydrated ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-muted/40 h-20" />
              ))}
            </div>
          ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Revenue</p>
              <p className="text-xl font-bold text-foreground">${totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">combined monthly</p>
            </div>
            <div className={cn("rounded-2xl border p-4", totalProfit >= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50")}>
              <p className={cn("text-xs font-semibold uppercase tracking-wider mb-2", totalProfit >= 0 ? "text-green-700" : "text-red-700")}>Net Profit</p>
              <p className={cn("text-xl font-bold", totalProfit >= 0 ? "text-green-700" : "text-red-700")}>
                {totalProfit >= 0 ? "$" : "-$"}{Math.abs(Math.round(totalProfit)).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{overallMargin.toFixed(1)}% margin</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ad Spend</p>
              <p className="text-xl font-bold text-foreground">${totalAdSpend.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">ACoS: {overallAcos.toFixed(0)}%</p>
            </div>
            <div className={cn("rounded-2xl border p-4", unprofitable.length > 0 ? "border-red-200 bg-red-50" : "border-border bg-card")}>
              <p className={cn("text-xs font-semibold uppercase tracking-wider mb-2", unprofitable.length > 0 ? "text-red-700" : "text-muted-foreground")}>Unprofitable</p>
              <p className={cn("text-xl font-bold", unprofitable.length > 0 ? "text-red-700" : "text-foreground")}>{unprofitable.length}</p>
              <p className="text-xs text-muted-foreground mt-1">SKUs losing money</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Healthy</p>
              <p className="text-xl font-bold text-green-600">{healthy.length}</p>
              <p className="text-xs text-muted-foreground mt-1">margin ≥ 18%</p>
            </div>
          </div>
          )}

          {/* ── Profit Table ────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">SKU Profitability Breakdown</h2>
              <span className="text-xs text-muted-foreground">Sorted by risk level</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">SKU</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Revenue</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">COGS</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Fees</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ad Spend</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Returns</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Net Profit</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Margin</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">ACoS</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedByProfit.map((snap) => {
                    const cfg = statusConfig(snap.status)
                    const profitColor = snap.netProfitMonthly < 0 ? "text-red-600 font-bold" : snap.netProfitMonthly < 500 ? "text-orange-600 font-semibold" : "text-green-600 font-semibold"
                    return (
                      <tr key={snap.skuId} className={cn(
                        "transition-colors hover:bg-muted/20",
                        snap.status === "unprofitable" ? "bg-red-50/30" : ""
                      )}>
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-sm font-semibold text-foreground max-w-[180px] truncate leading-tight">{snap.skuName}</p>
                            <span className="text-[10px] text-muted-foreground capitalize">{snap.channel}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right text-sm tabular-nums text-foreground">${snap.monthlyRevenue.toLocaleString()}</td>
                        <td className="px-4 py-4 text-right text-sm tabular-nums text-muted-foreground">-${snap.cogs.toLocaleString()}</td>
                        <td className="px-4 py-4 text-right text-sm tabular-nums text-muted-foreground">-${snap.platformFees.toLocaleString()}</td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <TrendIcon trend={snap.adSpendTrend} />
                            <span className="text-sm tabular-nums text-muted-foreground">-${snap.adSpend.toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right text-sm tabular-nums text-muted-foreground">-${snap.returnCost.toLocaleString()}</td>
                        <td className="px-4 py-4 text-right">
                          <span className={cn("text-sm tabular-nums", profitColor)}>
                            {snap.netProfitMonthly < 0 ? "-$" : "$"}{Math.abs(Math.round(snap.netProfitMonthly)).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <TrendIcon trend={snap.marginTrend} />
                            <MarginBar margin={snap.marginPercent} />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center">
                            <AcosBar acos={snap.acos} />
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap", cfg.bg, cfg.color)}>
                            <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", cfg.dot)} />
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/30">
                    <td className="px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider">Total Portfolio</td>
                    <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-foreground">${totalRevenue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums text-muted-foreground">
                      -${snapshots.reduce((s, p) => s + p.cogs, 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums text-muted-foreground">
                      -${snapshots.reduce((s, p) => s + p.platformFees, 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums text-muted-foreground">-${totalAdSpend.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums text-muted-foreground">
                      -${snapshots.reduce((s, p) => s + p.returnCost, 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("text-sm font-bold tabular-nums", totalProfit < 0 ? "text-red-600" : "text-green-600")}>
                        {totalProfit < 0 ? "-$" : "$"}{Math.abs(Math.round(totalProfit)).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("text-xs font-bold", overallMargin < 0 ? "text-red-600" : overallMargin < 12 ? "text-orange-600" : "text-green-600")}>
                        {overallMargin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("text-xs font-bold", overallAcos >= 40 ? "text-red-600" : overallAcos >= 30 ? "text-orange-600" : "text-green-600")}>
                        {overallAcos.toFixed(0)}%
                      </span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ── Margin Thresholds ────────────────────────────────────────────── */}
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { label: "< 0%", desc: "Losing money — pause or restructure immediately", color: "border-red-200 bg-red-50 text-red-700" },
              { label: "0–12%", desc: "Below survival threshold — one bad week can flip to loss", color: "border-orange-200 bg-orange-50 text-orange-700" },
              { label: "12–18%", desc: "Thin but viable — monitor closely, no room for variance", color: "border-yellow-200 bg-yellow-50 text-yellow-700" },
              { label: "18%+", desc: "Healthy margin — absorbs returns, storage, PPC variance", color: "border-green-200 bg-green-50 text-green-700" },
            ].map(t => (
              <div key={t.label} className={cn("rounded-xl border p-4", t.color.split(" ").slice(0, 2).join(" "))}>
                <p className={cn("text-sm font-bold mb-1", t.color.split(" ").slice(2).join(" "))}>{t.label} margin</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
