"use client"

import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  AlertCircle, AlertTriangle, Info, TrendingDown, TrendingUp,
  Package, DollarSign, Activity, ChevronRight, CheckCircle2,
  BarChart3, Zap, Database, Upload,
} from "lucide-react"
import { useSkus } from "@/lib/intelligence/store"
import { generateRiskAlerts, getBusinessHealthSummary } from "@/lib/intelligence/risk-engine"
import type { RiskAlert, RiskSeverity, BusinessHealthSummary } from "@/lib/intelligence/types"
import { cn } from "@/lib/utils"

// ─── Severity config ──────────────────────────────────────────────────────────

function severityConfig(s: RiskSeverity) {
  switch (s) {
    case "critical": return { bg: "bg-red-50 border-red-200",    badge: "bg-red-100 text-red-700 border-red-200",    icon: AlertCircle,   iconColor: "text-red-500",    iconBg: "bg-red-100",    dot: "bg-red-500 animate-pulse", label: "Critical" }
    case "high":     return { bg: "bg-orange-50 border-orange-200", badge: "bg-orange-100 text-orange-700 border-orange-200", icon: AlertTriangle, iconColor: "text-orange-500", iconBg: "bg-orange-100", dot: "bg-orange-500",            label: "High" }
    case "medium":   return { bg: "bg-yellow-50 border-yellow-200", badge: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Info,          iconColor: "text-yellow-600", iconBg: "bg-yellow-100", dot: "bg-yellow-500",            label: "Medium" }
    default:         return { bg: "bg-blue-50 border-blue-200",   badge: "bg-blue-100 text-blue-700 border-blue-200",   icon: Info,          iconColor: "text-blue-500",   iconBg: "bg-blue-100",   dot: "bg-blue-400",              label: "Info" }
  }
}

function healthConfig(status: BusinessHealthSummary["healthStatus"]) {
  switch (status) {
    case "critical": return { color: "text-red-600",    bg: "bg-red-50 border-red-200",       dot: "bg-red-500 animate-pulse" }
    case "at_risk":  return { color: "text-orange-600", bg: "bg-orange-50 border-orange-200", dot: "bg-orange-500" }
    case "watch":    return { color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", dot: "bg-yellow-500" }
    default:         return { color: "text-green-600",  bg: "bg-green-50 border-green-200",   dot: "bg-green-500" }
  }
}

// ─── Risk Card ────────────────────────────────────────────────────────────────

function RiskCard({ alert }: { alert: RiskAlert }) {
  const cfg = severityConfig(alert.severity)
  const Icon = cfg.icon

  return (
    <div className={cn("rounded-2xl border p-5 transition-shadow hover:shadow-md", cfg.bg)}>
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 rounded-lg p-1.5 flex-shrink-0", cfg.iconBg)}>
          <Icon className={cn("h-4 w-4", cfg.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", cfg.badge)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
              {cfg.label}
            </span>
            <span className="rounded-full bg-background/80 border border-border px-2 py-0.5 text-[10px] text-muted-foreground font-medium truncate max-w-[200px]">
              {alert.skuName}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-foreground leading-snug">{alert.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{alert.description}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-background/70 border border-border/60 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Why it matters</p>
          <p className="text-xs text-foreground leading-relaxed">{alert.whyItMatters}</p>
        </div>
        <div className="rounded-xl bg-background/70 border border-border/60 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Recommended action</p>
          <p className="text-xs text-foreground leading-relaxed">{alert.recommendedAction}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-semibold text-foreground">{alert.estimatedImpact}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">Confidence: {alert.confidence}%</span>
          {alert.dataUsed.slice(0, 2).map((d, i) => (
            <span key={i} className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] text-muted-foreground hidden sm:inline">{d}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Demo banner ──────────────────────────────────────────────────────────────

function DemoBanner() {
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] px-5 py-4 flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <Database className="h-4 w-4 text-primary flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">You&apos;re viewing sample data</p>
          <p className="text-xs text-muted-foreground">Upload your SKU data to run the risk engine on your real business.</p>
        </div>
      </div>
      <Link href="/data"
        className="flex-shrink-0 flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
        <Upload className="h-3.5 w-3.5" />
        Import CSV
      </Link>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommandCenterPage() {
  const { skus, meta, hydrated } = useSkus()

  const alerts = hydrated ? generateRiskAlerts(skus) : []
  const health = hydrated ? getBusinessHealthSummary(skus, alerts) : null

  const criticalAlerts = alerts.filter(a => a.severity === "critical")
  const highAlerts = alerts.filter(a => a.severity === "high")
  const mediumAlerts = alerts.filter(a => a.severity === "medium")
  const urgentActions = alerts.filter(a => a.severity === "critical" || a.severity === "high").slice(0, 4)

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
  const hcfg = health ? healthConfig(health.healthStatus) : healthConfig("healthy")

  // Skeleton while hydrating
  if (!hydrated) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1">
          <div className="mx-auto max-w-[1200px] px-6 py-8">
            <div className="h-8 w-48 rounded-xl bg-muted animate-pulse mb-4" />
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />)}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-[1200px] px-6 py-8">

          {/* ── Demo banner ────────────────────────────────────────────────── */}
          {meta.source === "demo" && <DemoBanner />}

          {/* ── Live data banner ───────────────────────────────────────────── */}
          {meta.source === "live" && (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-3 flex items-center gap-3 mb-6">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">
                <span className="font-semibold">Live data active</span>
                {meta.filename ? ` — ${meta.filename}` : ""}
                {meta.uploadedAt ? ` · Uploaded ${new Date(meta.uploadedAt).toLocaleDateString()}` : ""}
              </p>
              <Link href="/data" className="ml-auto text-xs text-green-600 hover:text-green-700 underline-offset-2 hover:underline flex-shrink-0">Update</Link>
            </div>
          )}

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">{today}</p>
              <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {alerts.length === 0
                  ? "All systems healthy — no active risks detected."
                  : `${alerts.length} active risk${alerts.length !== 1 ? "s" : ""} across ${skus.filter(s => s.status === "active").length} SKUs need attention.`}
              </p>
            </div>
            {health && (
              <div className={cn("flex items-center gap-2 rounded-xl border px-4 py-2.5 self-start sm:self-auto", hcfg.bg)}>
                <span className={cn("h-2 w-2 rounded-full", hcfg.dot)} />
                <span className={cn("text-sm font-semibold", hcfg.color)}>Business Status: {health.healthStatusLabel}</span>
              </div>
            )}
          </div>

          {/* ── KPI Row ────────────────────────────────────────────────────── */}
          {health && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="rounded-lg bg-primary/10 p-1.5"><DollarSign className="h-4 w-4 text-primary" /></div>
                  <span className="text-xs font-medium text-muted-foreground">Monthly Revenue</span>
                </div>
                <p className="text-2xl font-bold text-foreground">${health.totalMonthlyRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{health.activeSkus} active SKUs</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn("rounded-lg p-1.5", health.totalNetProfitMonthly >= 0 ? "bg-green-50" : "bg-red-50")}>
                    <TrendingUp className={cn("h-4 w-4", health.totalNetProfitMonthly >= 0 ? "text-green-600" : "text-red-500")} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">Net Profit</span>
                </div>
                <p className={cn("text-2xl font-bold", health.totalNetProfitMonthly >= 0 ? "text-foreground" : "text-red-600")}>
                  {health.totalNetProfitMonthly >= 0 ? "$" : "-$"}{Math.abs(health.totalNetProfitMonthly).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{health.overallMarginPercent}% margin</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="rounded-lg bg-orange-50 p-1.5"><Activity className="h-4 w-4 text-orange-500" /></div>
                  <span className="text-xs font-medium text-muted-foreground">Active Risks</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{health.totalAlerts}</p>
                <div className="flex items-center gap-2 mt-1">
                  {health.criticalAlerts > 0 && <span className="text-xs font-semibold text-red-600">{health.criticalAlerts} critical</span>}
                  {health.highAlerts > 0 && <span className="text-xs font-semibold text-orange-600">{health.highAlerts} high</span>}
                  {health.criticalAlerts === 0 && health.highAlerts === 0 && <span className="text-xs text-muted-foreground">none critical</span>}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="rounded-lg bg-red-50 p-1.5"><TrendingDown className="h-4 w-4 text-red-500" /></div>
                  <span className="text-xs font-medium text-muted-foreground">At-Risk Profit</span>
                </div>
                <p className="text-2xl font-bold text-red-600">-${health.projectedImpactIfUnaddressed.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">if risks unaddressed</p>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">

            {/* ── Risk Feed ──────────────────────────────────────────────────── */}
            <div className="lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground">Risk Alerts</h2>
                <div className="flex items-center gap-2">
                  {criticalAlerts.length > 0 && <span className="rounded-full bg-red-100 text-red-700 border border-red-200 px-2.5 py-0.5 text-xs font-bold">{criticalAlerts.length} Critical</span>}
                  {highAlerts.length > 0 && <span className="rounded-full bg-orange-100 text-orange-700 border border-orange-200 px-2.5 py-0.5 text-xs font-bold">{highAlerts.length} High</span>}
                  {mediumAlerts.length > 0 && <span className="rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200 px-2.5 py-0.5 text-xs font-bold">{mediumAlerts.length} Medium</span>}
                </div>
              </div>

              {alerts.length === 0 ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-10 text-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                  <p className="font-semibold text-green-700">All clear</p>
                  <p className="text-sm text-green-600 mt-1">No active risks detected across your SKUs.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map(alert => <RiskCard key={alert.id} alert={alert} />)}
                </div>
              )}
            </div>

            {/* ── Sidebar ────────────────────────────────────────────────────── */}
            <div className="space-y-4">

              {/* Urgent Actions */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Urgent Actions</h3>
                </div>
                {urgentActions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No urgent actions required.</p>
                ) : (
                  <div className="space-y-3">
                    {urgentActions.map((alert, i) => (
                      <div key={alert.id} className="flex items-start gap-3">
                        <span className={cn("mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white", alert.severity === "critical" ? "bg-red-500" : "bg-orange-500")}>
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-foreground leading-snug">{alert.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{alert.recommendedAction}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation shortcuts */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="text-sm font-bold text-foreground mb-4">Intelligence Modules</h3>
                <div className="space-y-2">
                  {[
                    { href: "/inventory", icon: Package,  label: "Inventory Risk",   desc: "Stockout & overstock tracking" },
                    { href: "/profit",    icon: BarChart3, label: "Profit & Margin",  desc: "Per-SKU profitability" },
                    { href: "/advisor",   icon: Zap,       label: "AI Advisor",       desc: "Ask operational questions" },
                    { href: "/analyze",   icon: Activity,  label: "Product Validator",desc: "GO / NO-GO analysis" },
                  ].map(item => (
                    <Link key={item.href} href={item.href}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 hover:bg-muted/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs font-semibold text-foreground">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* SKU Health Snapshot */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="text-sm font-bold text-foreground mb-4">SKU Health</h3>
                <div className="space-y-2">
                  {skus.filter(s => s.status === "active").map(sku => {
                    const skuAlerts = alerts.filter(a => a.skuId === sku.id)
                    const worst = skuAlerts[0]
                    const statusColor = worst?.severity === "critical" ? "text-red-600" : worst?.severity === "high" ? "text-orange-600" : worst?.severity === "medium" ? "text-yellow-600" : "text-green-600"
                    const dot = worst?.severity === "critical" ? "bg-red-500 animate-pulse" : worst?.severity === "high" ? "bg-orange-500" : worst?.severity === "medium" ? "bg-yellow-500" : "bg-green-500"
                    return (
                      <div key={sku.id} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn("h-2 w-2 rounded-full flex-shrink-0", dot)} />
                          <span className="text-xs text-foreground truncate max-w-[140px]">{sku.name.split(" ").slice(0, 3).join(" ")}</span>
                        </div>
                        <span className={cn("text-xs font-semibold flex-shrink-0", statusColor)}>
                          {worst ? `${skuAlerts.length} alert${skuAlerts.length !== 1 ? "s" : ""}` : "Healthy"}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
