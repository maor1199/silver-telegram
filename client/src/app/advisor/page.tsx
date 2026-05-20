"use client"

import { useState, useRef, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Zap, Send, User, Bot, Loader2, AlertCircle, BarChart3, Package, TrendingDown } from "lucide-react"
import { MOCK_SKUS } from "@/lib/intelligence/mock-data"
import { generateRiskAlerts, getBusinessHealthSummary } from "@/lib/intelligence/risk-engine"
import { cn } from "@/lib/utils"

// ─── Prompt suggestions ───────────────────────────────────────────────────────

const SUGGESTED_QUESTIONS = [
  { icon: AlertCircle, label: "Which SKU needs attention today?", color: "text-red-500" },
  { icon: TrendingDown, label: "Where am I losing margin?", color: "text-orange-500" },
  { icon: Package, label: "What should I reorder first?", color: "text-blue-500" },
  { icon: BarChart3, label: "Which products are becoming unprofitable?", color: "text-purple-500" },
  { icon: Zap, label: "What could hurt my cashflow this month?", color: "text-yellow-500" },
  { icon: AlertCircle, label: "Which PPC campaigns are burning money?", color: "text-red-500" },
]

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  role: "user" | "assistant"
  content: string
}

// ─── Build business context for AI ───────────────────────────────────────────

function buildBusinessContext(): string {
  const alerts = generateRiskAlerts(MOCK_SKUS)
  const health = getBusinessHealthSummary(MOCK_SKUS, alerts)

  const skuSummaries = MOCK_SKUS.filter(s => s.status === "active").map(sku => {
    const skuAlerts = alerts.filter(a => a.skuId === sku.id)
    return [
      `SKU: ${sku.name} (${sku.id})`,
      `  Revenue: $${sku.monthlyRevenue.toLocaleString()}/mo | Net Profit: $${sku.netProfitMonthly.toLocaleString()}/mo | Margin: ${sku.marginPercent.toFixed(1)}%`,
      `  ACoS: ${(sku.acos * 100).toFixed(0)}% | Returns: ${(sku.returnRate * 100).toFixed(0)}% | Days Until Stockout: ${sku.daysUntilStockout}d`,
      `  Daily Sales: ${sku.avgDailySales} units | Lead Time: ${sku.reorderLeadTimeDays}d | Inventory: ${sku.currentInventory} units`,
      `  Margin Trend: ${sku.marginTrend} | Sales Velocity Trend: ${sku.salesVelocityTrend} | Ad Spend Trend: ${sku.adSpendTrend}`,
      skuAlerts.length > 0 ? `  Active Alerts: ${skuAlerts.map(a => `[${a.severity.toUpperCase()}] ${a.title}`).join(" | ")}` : "  Status: No active risks",
    ].join("\n")
  }).join("\n\n")

  return `
=== BUSINESS SNAPSHOT ===
Revenue: $${health.totalMonthlyRevenue.toLocaleString()}/mo | Net Profit: $${health.totalNetProfitMonthly.toLocaleString()}/mo | Overall Margin: ${health.overallMarginPercent}%
Overall ACoS: ${health.overallAcos}% | Active Alerts: ${health.totalAlerts} (${health.criticalAlerts} critical, ${health.highAlerts} high)
Business Status: ${health.healthStatusLabel}
At-Risk Profit if Unaddressed: -$${health.projectedImpactIfUnaddressed.toLocaleString()}

=== SKU DETAILS ===
${skuSummaries}
`.trim()
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    const userMessage: Message = { role: "user", content: text.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const context = buildBusinessContext()
      const response = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context,
        }),
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const isFirstMessage = messages.length === 0

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-[900px] px-6 py-8 flex flex-col" style={{ minHeight: "calc(100vh - 140px)" }}>

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">AI Advisor</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Ask operational questions about your business. The advisor reads your live inventory, margins, and risk alerts to give specific answers — not generic advice.
            </p>
          </div>

          {/* ── Chat Area ───────────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col">
            {isFirstMessage ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2">What do you want to know about your business?</h2>
                <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
                  I&apos;m analyzing your inventory, margins, and risk alerts. Ask me anything operational.
                </p>

                <div className="grid sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q.label}
                      onClick={() => sendMessage(q.label)}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 text-left hover:bg-muted/50 hover:border-primary/30 transition-all group"
                    >
                      <q.icon className={cn("h-4 w-4 flex-shrink-0", q.color)} />
                      <span className="text-sm text-foreground font-medium leading-snug">{q.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                    {msg.role === "assistant" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
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
            <div className={cn("mt-auto", isFirstMessage ? "mt-6" : "")}>
              <div className="rounded-2xl border border-border bg-card p-3 focus-within:border-primary/40 transition-colors">
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about inventory, margins, PPC, returns, or cashflow…"
                  className="min-h-[60px] max-h-32 resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/60"
                  rows={2}
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[11px] text-muted-foreground">Press Enter to send · Shift+Enter for new line</p>
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
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
