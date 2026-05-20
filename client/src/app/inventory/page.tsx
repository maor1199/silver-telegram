"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import {
  Package,
  AlertCircle,
  AlertTriangle,
  Info,
  TrendingDown,
  TrendingUp,
  Minus,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react"
import { MOCK_SKUS } from "@/lib/intelligence/mock-data"
import { getInventorySnapshots, assessStockoutRisk, assessOverstockRisk } from "@/lib/intelligence/risk-engine"
import type { InventorySnapshot, InventoryStatus } from "@/lib/intelligence/types"
import { cn } from "@/lib/utils"

// ─── Status config ────────────────────────────────────────────────────────────

function statusConfig(s: InventoryStatus) {
  switch (s) {
    case "order_now":    return { color: "text-red-700",    bg: "bg-red-100 border-red-200",    dot: "bg-red-500 animate-pulse",  label: "Order Now" }
    case "reorder_soon": return { color: "text-orange-700", bg: "bg-orange-100 border-orange-200", dot: "bg-orange-500", label: "Reorder Soon" }
    case "watch":        return { color: "text-yellow-700", bg: "bg-yellow-100 border-yellow-200", dot: "bg-yellow-500", label: "Watch" }
    case "overstock":    return { color: "text-blue-700",   bg: "bg-blue-100 border-blue-200",   dot: "bg-blue-400",   label: "Overstock" }
    case "dead":         return { color: "text-purple-700", bg: "bg-purple-100 border-purple-200", dot: "bg-purple-500", label: "Dead Stock" }
    default:             return { color: "text-green-700",  bg: "bg-green-100 border-green-200",  dot: "bg-green-500",  label: "On Track" }
  }
}

function daysColor(days: number, leadTime: number): string {
  if (days <= 0) return "text-red-600 font-bold"
  if (days < leadTime) return "text-red-600 font-bold"
  if (days < leadTime + 14) return "text-orange-600 font-semibold"
  if (days < leadTime + 30) return "text-yellow-600 font-semibold"
  if (days > 180) return "text-purple-600 font-semibold"
  if (days > 90) return "text-blue-600"
  return "text-green-600"
}

function VelocityBadge({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-green-500" />
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-red-500" />
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
}

// ─── Days bar visual ──────────────────────────────────────────────────────────

function DaysBar({ days, leadTime }: { days: number; leadTime: number }) {
  const max = 120
  const clampedDays = Math.min(days, max)
  const pct = Math.max(0, (clampedDays / max) * 100)
  const barColor =
    days <= 0 ? "bg-red-500" :
    days < leadTime ? "bg-red-400" :
    days < leadTime + 14 ? "bg-orange-400" :
    days < leadTime + 30 ? "bg-yellow-400" :
    days > 90 ? "bg-blue-400" : "bg-green-400"

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-xs tabular-nums w-12 text-right", daysColor(days, leadTime))}>
        {days <= 0 ? "OOS" : `${days}d`}
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const snapshots = getInventorySnapshots(MOCK_SKUS)

  const orderNow = snapshots.filter(s => s.status === "order_now")
  const reorderSoon = snapshots.filter(s => s.status === "reorder_soon")
  const watch = snapshots.filter(s => s.status === "watch")
  const healthy = snapshots.filter(s => s.status === "ok")
  const risky = snapshots.filter(s => s.status === "overstock" || s.status === "dead")

  const totalUnits = MOCK_SKUS.filter(s => s.status === "active").reduce((sum, s) => sum + s.currentInventory, 0)
  const avgDailySales = MOCK_SKUS.filter(s => s.status === "active").reduce((sum, s) => sum + s.avgDailySales, 0)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-[1200px] px-6 py-8">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Inventory Risk</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Real-time stockout and overstock tracking across all SKUs. Reorder signals based on velocity and lead time.
            </p>
          </div>

          {/* ── KPI Row ────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">Order Now</p>
              <p className="text-3xl font-bold text-red-700">{orderNow.length}</p>
              <p className="text-xs text-red-600 mt-1">SKUs past reorder point</p>
            </div>
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider mb-2">Reorder Soon</p>
              <p className="text-3xl font-bold text-orange-700">{reorderSoon.length}</p>
              <p className="text-xs text-orange-600 mt-1">Within 14-day buffer</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Units</p>
              <p className="text-3xl font-bold text-foreground">{totalUnits.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Across all active SKUs</p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">Overstock Risk</p>
              <p className="text-3xl font-bold text-blue-700">{risky.length}</p>
              <p className="text-xs text-blue-600 mt-1">SKUs with 90+ days stock</p>
            </div>
          </div>

          {/* ── Inventory Table ─────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">All SKUs — Inventory Status</h2>
              <span className="text-xs text-muted-foreground">{snapshots.length} SKUs tracked</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">SKU</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">In Stock</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Daily Sales</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground w-48">Days Remaining</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Lead Time</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Velocity</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Reorder Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {snapshots.map((snap) => {
                    const cfg = statusConfig(snap.status)
                    return (
                      <tr key={snap.skuId} className={cn(
                        "transition-colors hover:bg-muted/30",
                        snap.status === "order_now" ? "bg-red-50/40" : ""
                      )}>
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-sm font-semibold text-foreground leading-tight max-w-[200px] truncate">{snap.skuName}</p>
                            <span className="inline-block mt-0.5 rounded-full border border-border/50 bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground capitalize">{snap.channel}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-semibold tabular-nums text-foreground">{snap.currentInventory.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground ml-1">units</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm tabular-nums text-foreground">{snap.avgDailySales}</span>
                          <span className="text-xs text-muted-foreground ml-1">/day</span>
                        </td>
                        <td className="px-4 py-4">
                          <DaysBar days={snap.daysUntilStockout} leadTime={snap.reorderLeadTimeDays} />
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm tabular-nums text-foreground">{snap.reorderLeadTimeDays}d</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <VelocityBadge trend={snap.salesVelocityTrend} />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold", cfg.bg, cfg.color)}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-semibold tabular-nums text-foreground">{snap.reorderQuantity.toLocaleString()}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── How It Works ───────────────────────────────────────────────── */}
          <div className="mt-8 rounded-2xl border border-border bg-muted/30 p-6">
            <h3 className="text-sm font-bold text-foreground mb-4">How risk is calculated</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Days Until Stockout", formula: "current_inventory ÷ avg_daily_sales", note: "Compared against supplier lead time + 14-day buffer" },
                { label: "Reorder Trigger", formula: "days_remaining < lead_time + 14", note: "Order Now = already past reorder point; Reorder Soon = within buffer" },
                { label: "Overstock / Dead", formula: "days_remaining > 90 / 180", note: "Flagged when excess storage fees will erode margin" },
              ].map(item => (
                <div key={item.label} className="rounded-xl bg-background border border-border p-4">
                  <p className="text-xs font-semibold text-foreground mb-1">{item.label}</p>
                  <code className="text-[11px] text-primary bg-primary/5 rounded px-1.5 py-0.5 font-mono">{item.formula}</code>
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
