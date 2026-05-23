"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Send, User, Bot, Loader2, AlertCircle,
  BarChart3, Package, TrendingDown, ChevronDown,
  TrendingUp, Minus, Activity, ArrowUpDown, ArrowRight,
} from "lucide-react"
import { useSkus } from "@/lib/intelligence/store"
import { generateRiskAlerts, getBusinessHealthSummary } from "@/lib/intelligence/risk-engine"
import { getPriorityFeed } from "@/lib/intelligence/priority-feed"
import type { PriorityItem } from "@/lib/intelligence/priority-feed"
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
  const dot = {
    critical: "bg-red-500 animate-pulse",
    high:     "bg-orange-500",
    medium:   "bg-yellow-500",
    low:      "bg-blue-400",
    info:     "bg-blue-400",
  }[s]
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", cfg)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {s}
    </span>
  )
}

// ─── Business Briefing ────────────────────────────────────────────────────────
// Always visible. Grounding context for every AI conversation.

function BusinessBriefing({
  alerts,
  health,
  priorityItems,
  onAsk,
}: {
  alerts:        RiskAlert[]
  health:        ReturnType<typeof getBusinessHealthSummary>
  priorityItems: PriorityItem[]
  onAsk:         (q: string) => void
}) {
  const [expanded, setExpanded] = useState(true)

  const topAlerts = alerts.slice(0, 3)
  const healthColor =
    health.healthStatus === "critical"  ? "text-red-600"    :
    health.healthStatus === "at_risk"   ? "text-orange-600" :
    health.healthStatus === "watch"     ? "text-yellow-600" : "text-green-600"

  // ── Investigation questions — derived from actual detected signals ──────────
  const questions: { icon: typeof AlertCircle; label: string; color: string }[] = []

  const hasCritical = alerts.some(a => a.severity === "critical")
  const hasStockout = alerts.some(a => a.type === "stockout")
  const hasMargin   = alerts.some(a => a.type === "margin_erosion" || a.type === "negative_margin")
  const hasPPC      = alerts.some(a => a.type === "ppc_pressure")
  const hasReturn   = alerts.some(a => a.type === "return_rate")
  const hasOverstock= alerts.some(a => a.type === "overstock" || a.type === "dead_inventory")
  const multiIssue  = priorityItems.length >= 2

  // Prioritization question is first when there are multiple competing issues
  if (multiIssue) {
    questions.push({
      icon:  ArrowUpDown,
      label: `I have ${priorityItems.length} active issues. Which one do I address first — and what's the consequence of getting the sequence wrong?`,
      color: "text-primary",
    })
  }

  // Issue-specific investigation questions
  if (hasCritical) {
    questions.push({
      icon:  AlertCircle,
      label: "What's the single most urgent action I need to take today — and what happens if I wait 48 hours?",
      color: "text-red-500",
    })
  }
  if (hasStockout && hasMargin) {
    questions.push({
      icon:  TrendingDown,
      label: "If I stock out while my margin is already thin, what does the PPC recovery cost look like?",
      color: "text-orange-500",
    })
  } else if (hasStockout) {
    questions.push({
      icon:  Package,
      label: "Walk me through the exact reorder plan for my at-risk SKUs — quantities, timing, supplier conversation.",
      color: "text-blue-500",
    })
  } else if (hasMargin) {
    questions.push({
      icon:  TrendingDown,
      label: "Which SKU has the worst margin problem, and what's the fastest lever to reach breakeven?",
      color: "text-orange-500",
    })
  }
  if (hasPPC) {
    questions.push({
      icon:  BarChart3,
      label: "How do I cut PPC spend without losing organic rank — what's the sequence, and which campaigns do I touch first?",
      color: "text-purple-500",
    })
  }
  if (hasReturn) {
    questions.push({
      icon:  AlertCircle,
      label: "How do I diagnose whether the high return rate is a listing problem or a product quality problem?",
      color: "text-red-400",
    })
  }
  if (hasOverstock) {
    questions.push({
      icon:  Package,
      label: "What clearance options do I have for dead inventory — and which avoids the most ranking damage?",
      color: "text-blue-400",
    })
  }

  // Fallback operational questions (grounded, not generic)
  if (questions.length < 4) {
    questions.push({ icon: TrendingDown, label: "Which SKU is closest to becoming net negative — and what's the tipping point?", color: "text-orange-500" })
    questions.push({ icon: BarChart3,    label: "Where is my biggest margin leak right now, and what's causing it?",              color: "text-green-500" })
    questions.push({ icon: Activity,     label: "Which operational issue is most likely to compound another one?",                  color: "text-yellow-500" })
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
              {health.healthStatusLabel} · {alerts.length} active signal{alerts.length !== 1 ? "s" : ""} · ${health.totalNetProfitMonthly.toLocaleString()}/mo net profit
            </p>
          </div>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded ? "rotate-180" : "")} />
      </button>

      {expanded && (
        <div className="border-t border-border">

          {/* KPI strip — flat row, no dividers */}
          <div className="flex gap-8 px-5 py-4 border-b border-border">
            {[
              { label: "Revenue",    value: `$${health.totalMonthlyRevenue.toLocaleString()}`,  sub: "monthly" },
              {
                label:  "Net Profit",
                value:  `${health.totalNetProfitMonthly < 0 ? "-$" : "$"}${Math.abs(health.totalNetProfitMonthly).toLocaleString()}`,
                sub:    `${health.overallMarginPercent}% margin`,
                danger: health.totalNetProfitMonthly < 0,
              },
              { label: "Ad Spend",  value: `$${health.totalAdSpendMonthly.toLocaleString()}`,  sub: `ACoS ${health.overallAcos}%` },
            ].map(k => (
              <div key={k.label}>
                <p className="text-[10px] text-muted-foreground font-medium mb-0.5">{k.label}</p>
                <p className={cn("text-sm font-semibold tabular-nums", (k as {danger?: boolean}).danger ? "text-red-600" : "text-foreground")}>{k.value}</p>
                <p className="text-[10px] text-muted-foreground">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Active alerts */}
          {topAlerts.length > 0 && (
            <div className="px-5 py-3 space-y-2 border-b border-border">
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                Active signals
              </p>
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
                <p className="text-xs text-muted-foreground pl-1">+{alerts.length - 3} more in Command Center</p>
              )}
            </div>
          )}

          {/* Investigation questions */}
          <div className="px-5 pb-4 pt-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
              Investigate an operational issue
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {questions.slice(0, 4).map((q, i) => (
                <button
                  key={i}
                  onClick={() => onAsk(q.label)}
                  className={cn(
                    "flex items-start gap-2 rounded-xl border px-3 py-2.5 text-left hover:bg-muted/50 transition-all",
                    i === 0 && multiIssue
                      ? "border-primary/30 bg-primary/[0.04] hover:border-primary/50"
                      : "border-border bg-background/60 hover:border-primary/30"
                  )}
                >
                  <q.icon className={cn("h-3.5 w-3.5 flex-shrink-0 mt-0.5", q.color)} />
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

// ─── Build structured context for AI ─────────────────────────────────────────
// Passes operational signals, priority issues, persistence state, and consequence
// projections so the AI never needs to invent data.

function buildBusinessContext(
  skus:          ReturnType<typeof useSkus>["skus"],
  alerts:        RiskAlert[],
  health:        ReturnType<typeof getBusinessHealthSummary>,
  priorityItems: PriorityItem[],
): string {

  // ── Priority issues section — richest context ──────────────────────────────
  const prioritySection = priorityItems.length > 0
    ? `\n\n=== PRIORITY ISSUES (ranked by operational urgency) ===\n` +
      priorityItems.map((item, i) => {
        const lines = [
          `${i + 1}. [${item.severity.toUpperCase()}] ${item.category.toUpperCase()} — ${item.skuName}`,
          `   Issue: ${item.headline}`,
          `   Context: ${item.context}`,
          `   Trajectory: ${item.trajectory} | Confidence: ${item.confidence}%`,
          item.persistenceSince
            ? `   Persistence: Active for ${item.persistenceSince} — chronic, not a fluke`
            : `   Persistence: First or recent detection`,
          item.projectedImpact
            ? `   Consequence if unaddressed: ${item.projectedImpact}`
            : null,
          item.causedBy
            ? `   Root cause signal: ${item.causedBy}`
            : null,
          item.impacts
            ? `   Compounds: ${item.impacts}`
            : null,
          `   Recommended action: ${item.action}`,
          `   Quantified impact: ${item.impact}`,
        ].filter(Boolean)
        return lines.join("\n")
      }).join("\n\n")
    : "\n\n=== PRIORITY ISSUES ===\nNo issues above confidence threshold. Business appears operationally stable."

  // ── Data availability — explicit flags for the AI's discipline rules ────────
  // The AI must know what it CAN and CANNOT reference before giving actions.
  const activeSkus = skus.filter(s => s.status === "active")
  const skusWithoutLeadTime = activeSkus.filter(s => !s.reorderLeadTimeDays || s.reorderLeadTimeDays === 0)
  const skusWithZeroDailySales = activeSkus.filter(s => !s.avgDailySales || s.avgDailySales === 0)

  const dataAvailabilitySection = [
    `\n=== DATA AVAILABILITY (read before recommending actions) ===`,
    `Campaign-level PPC data: NOT AVAILABLE — only SKU-level ACoS and total ad spend are present. Do not recommend pausing specific campaign types. Reason from SKU-level ACoS only.`,
    `Fee breakdown by component: NOT AVAILABLE — only net profit and margin percent present. Root cause of margin deterioration cannot be attributed to specific fee categories.`,
    skusWithoutLeadTime.length > 0
      ? `Lead time missing for: ${skusWithoutLeadTime.map(s => s.name).join(", ")} — reorder timing for these SKUs cannot be calculated; do not state a reorder deadline.`
      : `Lead time: present for all active SKUs — reorder timing calculations are valid.`,
    skusWithZeroDailySales.length > 0
      ? `Daily sales rate absent for: ${skusWithZeroDailySales.map(s => s.name).join(", ")} — days-until-stockout calculation unreliable for these SKUs.`
      : `Daily sales rate: present for all active SKUs.`,
    `Reorder quantity field: present for all SKUs where shown in data.`,
    `Historical pricing data: NOT AVAILABLE — cannot calculate percentage price changes or historical margin baseline.`,
  ].join("\n")

  // ── Per-SKU data ───────────────────────────────────────────────────────────
  const skuSummaries = activeSkus.map(sku => {
    const skuAlerts = alerts.filter(a => a.skuId === sku.id)
    return [
      `SKU: ${sku.name} (ID: ${sku.id})`,
      `  Revenue: $${sku.monthlyRevenue.toLocaleString()}/mo | Net Profit: $${sku.netProfitMonthly.toLocaleString()}/mo | Margin: ${sku.marginPercent.toFixed(1)}%`,
      `  ACoS: ${(sku.acos * 100).toFixed(0)}% | Return Rate: ${(sku.returnRate * 100).toFixed(0)}% | Days Until Stockout: ${sku.daysUntilStockout}d`,
      `  Daily Sales: ${sku.avgDailySales} units | Lead Time: ${sku.reorderLeadTimeDays}d | Inventory: ${sku.currentInventory} units`,
      `  Trends — Margin: ${sku.marginTrend} | Sales Velocity: ${sku.salesVelocityTrend} | Ad Spend: ${sku.adSpendTrend}`,
      skuAlerts.length > 0
        ? `  Active Alerts: ${skuAlerts.map(a => `[${a.severity.toUpperCase()}] ${a.title} — ${a.estimatedImpact}`).join(" | ")}`
        : `  Status: No active risk alerts`,
    ].join("\n")
  }).join("\n\n")

  return [
    `=== BUSINESS SNAPSHOT ===`,
    `Revenue: $${health.totalMonthlyRevenue.toLocaleString()}/mo | Net Profit: $${health.totalNetProfitMonthly.toLocaleString()}/mo | Margin: ${health.overallMarginPercent}%`,
    `Ad Spend: $${health.totalAdSpendMonthly.toLocaleString()}/mo | ACoS: ${health.overallAcos}%`,
    `Operational Status: ${health.healthStatusLabel} | Total Alerts: ${health.totalAlerts} (${health.criticalAlerts} critical, ${health.highAlerts} high)`,
    `At-risk profit if alerts unaddressed: -$${health.projectedImpactIfUnaddressed.toLocaleString()}`,
    dataAvailabilitySection,
    prioritySection,
    `\n=== SKU DATA ===`,
    skuSummaries,
  ].join("\n")
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function AdvisorInner() {
  const { skus, meta, hydrated } = useSkus()
  const searchParams = useSearchParams()
  const [messages, setMessages]         = useState<Message[]>([])
  const [input, setInput]               = useState("")
  const [loading, setLoading]           = useState(false)
  // Set when arriving via ?q= from an issue card — clears after first send
  const [investigatingSource, setInvestigatingSource] = useState(false)
  // Stores the last user message that failed — enables one-click retry
  const [lastFailedMessage, setLastFailedMessage]     = useState<string | null>(null)
  const bottomRef                       = useRef<HTMLDivElement>(null)
  const didPreFill                      = useRef(false)

  const isDemo = meta.source === "demo"

  const alerts        = hydrated ? generateRiskAlerts(skus) : []
  const health        = hydrated ? getBusinessHealthSummary(skus, alerts) : null
  const feedResult    = hydrated ? getPriorityFeed(skus, alerts, isDemo) : { items: [], suppressedCount: 0, candidateCount: 0 }
  const priorityItems = feedResult.items

  // Pre-fill from ?q= URL param (comes from "Ask AI →" on a specific issue card)
  useEffect(() => {
    if (!hydrated || didPreFill.current) return
    const q = searchParams.get("q")
    if (q) {
      setInput(decodeURIComponent(q))
      setInvestigatingSource(true)
      didPreFill.current = true
    }
  }, [hydrated, searchParams])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || loading || !health) return

    const userMessage: Message = { role: "user", content: text.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setInvestigatingSource(false)
    setLastFailedMessage(null)
    setLoading(true)

    // 30-second client-side timeout — prevents infinite spinner if the network hangs
    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 30_000)

    try {
      const context  = buildBusinessContext(skus, alerts, health, priorityItems)
      const response = await fetch("/api/advisor", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: [...messages, userMessage], context }),
        signal:  controller.signal,
      })
      clearTimeout(timeoutId)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }])
    } catch (err) {
      clearTimeout(timeoutId)
      const isTimeout = err instanceof Error && err.name === "AbortError"
      setMessages(prev => [...prev, {
        role:    "assistant",
        content: isTimeout
          ? "Request timed out — took too long to respond."
          : "Something went wrong. Please try again.",
      }])
      // Store so the retry button can re-send without the user retyping
      setLastFailedMessage(text.trim())
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

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-1">Operational Advisor</h1>
            <p className="text-sm text-muted-foreground">
              Reasoning from your live business signals. Not generic advice — grounded investigation of detected issues.
            </p>
          </div>

          {/* ── Business Briefing — always first ─────────────────────────── */}
          <BusinessBriefing
            alerts={alerts}
            health={health}
            priorityItems={priorityItems}
            onAsk={sendMessage}
          />

          {/* ── Conversation ─────────────────────────────────────────────── */}
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

                {/* Retry — shown below a failed response so the user doesn't have to retype */}
                {lastFailedMessage && !loading && (
                  <div className="flex justify-start pl-11">
                    <button
                      onClick={() => {
                        const msg = lastFailedMessage
                        setLastFailedMessage(null)
                        sendMessage(msg)
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/70 transition-colors"
                    >
                      ↩ Retry
                    </button>
                  </div>
                )}

                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Reading your business signals...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}

            {/* ── Input ───────────────────────────────────────────────────── */}
            <div className="mt-auto">
              {/* Investigating source indicator — only shown when arriving via ?q= */}
              {investigatingSource && (
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <ArrowRight className="h-3 w-3 text-primary flex-shrink-0" />
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                    Investigating issue from Command Center
                  </span>
                </div>
              )}
              <div className="rounded-2xl border border-border bg-card p-3 focus-within:border-primary/40 transition-colors">
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about a specific issue, SKU, or operational decision..."
                  className="min-h-[52px] max-h-28 resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/60"
                  rows={2}
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[11px] text-muted-foreground">Enter to send · Shift+Enter for new line</p>
                  <Button
                    size="sm"
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || loading}
                    className="h-8 rounded-xl px-3 gap-1.5"
                  >
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Send
                  </Button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground/50 text-center mt-2">
                Responses are grounded in your detected operational signals — not generic ecommerce advice.
              </p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function AdvisorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <AdvisorInner />
    </Suspense>
  )
}
