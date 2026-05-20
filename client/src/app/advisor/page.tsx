"use client"

import { useState, useRef, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Zap, Send, User, Bot, Loader2, AlertCircle,
  BarChart3, Package, TrendingDown, ChevronDown,
  TrendingUp, Minus, Activity,
} from "lucide-react"
import { useSkus } from "@/lib/intelligence/store"
import { generateRiskAlerts, getBusinessHealthSummary } from "@/lib/intelligence/risk-engine"
import type { RiskAlert, RiskSeverity } from "@/lib/intelligence/types"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = { role: "user" | "assistant"; content: string }

// ─── Severity pill ────────────────────────────────────────────────────────────

function SeverityPill({ s }: { s: RiskSeverity }) {
  const cfg = {
    critical: "bg-red-100 text-red-700 border-red-200",
    high:     "bg-orange-100 text-orange-700 border-orange-200",
    medium:   "bg-yellow-100 text-yellow-700 border-yellow-200",
    low:      "bg-blue-100 text-blue-700 border-blue-200",
    info:     "bg-blue-100 text-blue-700 border-blue-200",
  }[s]
  const dot = { critical: "bg-red-500 animate-pulse", high: "bg-orange-500", medium: "bg-yellow-500", low: "bg-blue-400", info: "bg-blue-400" }[s]
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", cfg)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {s}
    </span>
  )
}

// ─── Business Briefing (always visible at top) ────────────────────────────────

function BusinessBriefing({
  alerts,
  health,
  onAsk,
}: {
  alerts: RiskAlert[]
  health: ReturnType<typeof getBusinessHealthSummary>
  onAsk: (q: string) => void
}) {
  const [expanded, setExpanded] = useState(true)

  const topAlerts = alerts.slice(0, 3)
  const healthColor = health.healthStatus === "critical" ? "text-red-600" :
    health.healthStatus === "at_risk" ? "text-orange-600" :
    health.healthStatus === "watch" ? "text-yellow-600" : "text-green-600"

  // Context-aware suggestions based on actual alerts
  const suggestions: { icon: typeof AlertCircle; label: string; color: string }[] = []
  const hasCritical = alerts.some(a => a.severity === "critical")
  const hasStockout = alerts.some(a => a.type === "stockout")
  const hasMargin = alerts.some(a => a.type === "margin_erosion" || a.type === "negative_margin")
  const hasPPC = alerts.some(a => a.type === "ppc_pressure")
  const hasReturn = alerts.some(a => a.type === "return_rate")
  const hasOverstock = alerts.some(a => a.type === "overstock" || a.type === "dead_inventory")

  if (hasCritical)  suggestions.push({ icon: AlertCircle,  label: "What's the single most urgent thing I need to do today?", color: "text-red-500" })
  if (hasStockout)  suggestions.push({ icon: Package,      label: "Walk me through the reorder plan for my at-risk SKUs.", color: "text-blue-500" })
  if (hasMargin)    suggestions.push({ icon: TrendingDown,  label: "Which SKU has the worst margin problem and how do I fix it?", color: "text-orange-500" })
  if (hasPPC)       suggestions.push({ icon: BarChart3,     label: "How do I cut ad spend without losing sales rank?", color: "text-purple-500" })
  if (hasReturn)    suggestions.push({ icon: AlertCircle,   label: "Why is my return rate high and what are the options?", color: "text-red-500" })
  if (hasOverstock) suggestions.push({ icon: Package,       label: "What should I do about dead inventory before storage fees compound?", color: "text-blue-500" })

  if (suggestions.length < 4) {
    suggestions.push({ icon: Activity,    label: "What could hurt my cashflow this month?",    color: "text-yellow-500" })
    suggestions.push({ icon: TrendingDown, label: "Which product is closest to becoming unprofitable?", color: "text-orange-500" })
    suggestions.push({ icon: BarChart3,   label: "Where is my biggest margin leak right now?", color: "text-green-500" })
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden mb-4">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">Business Briefing</p>
            <p className={cn("text-xs font-semibold", healthColor)}>
              {health.healthStatusLabel} · {alerts.length} active risk{alerts.length !== 1 ? "s" : ""} · ${health.totalNetProfitMonthly.toLocaleString()}/mo net profit
            </p>
          </div>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded ? "rotate-180" : "")} />
      </button>

      {expanded && (
        <div className="border-t border-border">
          {/* KPI strip */}
          <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
            {[
              { label: "Revenue",    value: `$${health.totalMonthlyRevenue.toLocaleString()}`, sub: "monthly" },
              { label: "Net Profit", value: `${health.totalNetProfitMonthly < 0 ? "-$" : "$"}${Math.abs(health.totalNetProfitMonthly).toLocaleString()}`, sub: `${health.overallMarginPercent}% margin`, danger: health.totalNetProfitMonthly < 0 },
              { label: "Ad Spend",   value: `$${health.totalAdSpendMonthly.toLocaleString()}`, sub: `ACoS ${health.overallAcos}%` },
            ].map(k => (
              <div key={k.label} className="px-4 py-3">
                <p className="text-[10px] text-muted-foreground font-medium mb-0.5">{k.label}</p>
                <p className={cn("text-sm font-bold tabular-nums", k.danger ? "text-red-600" : "text-foreground")}>{k.value}</p>
                <p className="text-[10px] text-muted-foreground">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Top alerts */}
          {topAlerts.length > 0 && (
            <div className="px-5 py-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Active Alerts</p>
              {topAlerts.map(alert => (
                <div key={alert.id} className="flex items-start gap-2">
                  <SeverityPill s={alert.severity} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground leading-snug truncate">{alert.title}</p>
                    <p className="text-[10px] text-muted-foreground">{alert.estimatedImpact}</p>
                  </div>
                </div>
              ))}
              {alerts.length > 3 && (
                <p className="text-xs text-muted-foreground pl-1">+{alerts.length - 3} more alerts in Command Center</p>
              )}
            </div>
          )}

          {/* Context-aware suggestions */}
          <div className="px-5 pb-4 border-t border-border pt-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Ask about your business</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {suggestions.slice(0, 4).map((q, i) => (
                <button
                  key={i}
                  onClick={() => onAsk(q.label)}
                  className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-left hover:bg-muted/50 hover:border-primary/30 transition-all"
                >
                  <q.icon className={cn("h-3.5 w-3.5 flex-shrink-0", q.color)} />
                  <span className="text-xs text-foreground leading-snug">{q.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Build context for AI ─────────────────────────────────────────────────────

function buildBusinessContext(skus: ReturnType<typeof useSkus>["skus"], alerts: RiskAlert[], health: ReturnType<typeof getBusinessHealthSummary>): string {
  const skuSummaries = skus.filter(s => s.status === "active").map(sku => {
    const skuAlerts = alerts.filter(a => a.skuId === sku.id)
    return [
      `SKU: ${sku.name} (ID: ${sku.id})`,
      `  Revenue: $${sku.monthlyRevenue.toLocaleString()}/mo | Net Profit: $${sku.netProfitMonthly.toLocaleString()}/mo | Margin: ${sku.marginPercent.toFixed(1)}%`,
      `  ACoS: ${(sku.acos * 100).toFixed(0)}% | Return Rate: ${(sku.returnRate * 100).toFixed(0)}% | Days Until Stockout: ${sku.daysUntilStockout}d`,
      `  Daily Sales: ${sku.avgDailySales} units | Lead Time: ${sku.reorderLeadTimeDays}d | Inventory: ${sku.currentInventory} units`,
      `  Margin Trend: ${sku.marginTrend} | Sales Trend: ${sku.salesVelocityTrend} | Ad Spend Trend: ${sku.adSpendTrend}`,
      skuAlerts.length > 0
        ? `  Alerts: ${skuAlerts.map(a => `[${a.severity.toUpperCase()}] ${a.title} — ${a.estimatedImpact}`).join(" | ")}`
        : `  Status: No active risks`,
    ].join("\n")
  }).join("\n\n")

  return `
=== BUSINESS SNAPSHOT ===
Revenue: $${health.totalMonthlyRevenue.toLocaleString()}/mo | Net Profit: $${health.totalNetProfitMonthly.toLocaleString()}/mo | Margin: ${health.overallMarginPercent}%
Ad Spend: $${health.totalAdSpendMonthly.toLocaleString()}/mo | ACoS: ${health.overallAcos}%
Status: ${health.healthStatusLabel} | Alerts: ${health.totalAlerts} (${health.criticalAlerts} critical, ${health.highAlerts} high)
Projected at-risk profit if alerts unaddressed: -$${health.projectedImpactIfUnaddressed.toLocaleString()}

=== SKU DATA ===
${skuSummaries}
`.trim()
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdvisorPage() {
  const { skus, hydrated } = useSkus()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const alerts = hydrated ? generateRiskAlerts(skus) : []
  const health = hydrated ? getBusinessHealthSummary(skus, alerts) : null

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || loading || !health) return

    const userMessage: Message = { role: "user", content: text.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const context = buildBusinessContext(skus, alerts, health)
      const response = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage], context }),
      })
      if (!response.ok) throw new Error("API error")
      const data = await response.json()
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }])
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment.",
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  if (!hydrated || !health) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading business data...</span>
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
        <div className="mx-auto max-w-[860px] px-6 py-8 flex flex-col" style={{ minHeight: "calc(100vh - 130px)" }}>

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">AI Advisor</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Operational co-pilot. Reads your live business state and answers with specific numbers and actions — not generic advice.
            </p>
          </div>

          {/* ── Business Briefing — always visible, always first ─────────── */}
          <BusinessBriefing alerts={alerts} health={health} onAsk={sendMessage} />

          {/* ── Conversation ───────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-h-0">
            {messages.length > 0 && (
              <div className="flex-1 space-y-4 mb-4 overflow-y-auto max-h-[50vh]">
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                    {msg.role === "assistant" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-card border border-border text-foreground rounded-bl-sm"
                    )}>
                      {msg.content.split("\n").map((line, j) => (
                        <p key={j} className={j > 0 ? "mt-2" : ""}>{line}</p>
                      ))}
                    </div>
                    {msg.role === "user" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Analyzing your business data...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}

            {/* ── Input ─────────────────────────────────────────────────────── */}
            <div className="mt-auto">
              <div className="rounded-2xl border border-border bg-card p-3 focus-within:border-primary/40 transition-colors">
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about a specific SKU, metric, or operational decision..."
                  className="min-h-[52px] max-h-28 resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/60"
                  rows={2}
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[11px] text-muted-foreground">Enter to send · Shift+Enter for new line</p>
                  <Button size="sm" onClick={() => sendMessage(input)} disabled={!input.trim() || loading} className="h-8 rounded-xl px-3 gap-1.5">
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Send
                  </Button>
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
