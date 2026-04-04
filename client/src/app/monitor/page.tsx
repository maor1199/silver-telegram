"use client"

import { useState, useEffect, useCallback } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useSession } from "@/hooks/use-session"
import {
  Bell,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Star,
  MessageSquare,
  BarChart2,
  Loader2,
  ExternalLink,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Activity,
  Package,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
} from "lucide-react"

type MonitorSnapshot = {
  id: string
  price: number | null
  rating: number | null
  reviews_total: number | null
  rank: number | null
  created_at: string
}

type MonitorAlert = {
  id: string
  change_type: string
  old_value: string
  new_value: string
  created_at: string
}

type ReviewAnalysis = {
  complaints: string[]
  positives: string[]
  recommendation: string
  reviews_analyzed: number
}

type Monitor = {
  id: string
  asin: string
  product_name: string
  image_url: string | null
  last_checked_at: string | null
  created_at: string
  latest_snapshot: MonitorSnapshot | null
  previous_snapshot: MonitorSnapshot | null
  unread_alerts: MonitorAlert[]
}

const FREE_LIMIT = 5

function getChangeLabel(type: string) {
  switch (type) {
    case "price_drop": return "Price dropped"
    case "price_increase": return "Price increased"
    case "reviews_change": return "Reviews changed"
    case "rating_change": return "Rating changed"
    default: return type
  }
}

function getChangeIcon(type: string) {
  switch (type) {
    case "price_drop": return <TrendingDown className="h-4 w-4 text-green-600" />
    case "price_increase": return <TrendingUp className="h-4 w-4 text-red-500" />
    case "reviews_change": return <MessageSquare className="h-4 w-4 text-blue-500" />
    case "rating_change": return <Star className="h-4 w-4 text-orange-500" />
    default: return <Bell className="h-4 w-4 text-muted-foreground" />
  }
}

function MetricCard({
  label,
  value,
  sub,
  trend,
  icon,
}: {
  label: string
  value: string
  sub?: string
  trend?: "up" | "down" | null
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {trend === "down" && <TrendingDown className="h-4 w-4 text-green-600 mb-1" />}
        {trend === "up" && <TrendingUp className="h-4 w-4 text-red-500 mb-1" />}
      </div>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function ProductDashboard({
  monitor,
  token,
}: {
  monitor: Monitor
  token: string | null
}) {
  const [reviewAnalysis, setReviewAnalysis] = useState<ReviewAnalysis | null>(null)
  const [analyzingReviews, setAnalyzingReviews] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const snap = monitor.latest_snapshot
  const prev = monitor.previous_snapshot

  const priceTrend = snap?.price != null && prev?.price != null
    ? snap.price < prev.price ? "down" : snap.price > prev.price ? "up" : null
    : null

  const handleAnalyzeReviews = async () => {
    if (!token) return
    setAnalyzingReviews(true)
    setReviewError(null)
    try {
      const res = await fetch("/api/monitor/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ asin: monitor.asin }),
      })
      const data = await res.json()
      if (data.ok) {
        setReviewAnalysis(data)
      } else {
        setReviewError(data.error ?? "Failed to analyze reviews.")
      }
    } catch {
      setReviewError("Network error. Please try again.")
    } finally {
      setAnalyzingReviews(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Product Hero ─────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-5">
          {monitor.image_url ? (
            <img
              src={monitor.image_url}
              alt={monitor.product_name}
              className="h-20 w-20 rounded-xl object-contain border border-border bg-white shrink-0"
            />
          ) : (
            <div className="h-20 w-20 rounded-xl border border-border bg-secondary flex items-center justify-center shrink-0">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground leading-tight">{monitor.product_name}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="font-mono text-sm text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg">{monitor.asin}</span>
              <a
                href={`https://www.amazon.com/dp/${monitor.asin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                View on Amazon <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            {monitor.last_checked_at ? (
              <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                <RefreshCw className="h-3 w-3" />
                Last updated: {new Date(monitor.last_checked_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                <RefreshCw className="h-3 w-3" />
                First check pending — data will appear within 24 hours
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Live Metrics ─────────────────────────────── */}
      {snap ? (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Live Market Metrics
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {snap.price != null && (
              <MetricCard
                label="Price"
                value={`$${snap.price.toFixed(2)}`}
                sub={prev?.price != null ? `Was $${prev.price.toFixed(2)}` : undefined}
                trend={priceTrend}
                icon={<BarChart2 className="h-4 w-4 text-primary" />}
              />
            )}
            {snap.rating != null && (
              <MetricCard
                label="Rating"
                value={`${snap.rating}★`}
                sub={prev?.rating != null && prev.rating !== snap.rating ? `Was ${prev.rating}★` : undefined}
                icon={<Star className="h-4 w-4 text-yellow-500" />}
              />
            )}
            {snap.reviews_total != null && (
              <MetricCard
                label="Reviews"
                value={snap.reviews_total.toLocaleString()}
                sub={prev?.reviews_total != null ? `+${snap.reviews_total - prev.reviews_total} since last check` : undefined}
                icon={<MessageSquare className="h-4 w-4 text-blue-500" />}
              />
            )}
            {snap.rank != null && (
              <MetricCard
                label="BSR Rank"
                value={`#${snap.rank.toLocaleString()}`}
                sub="Best Sellers Rank"
                icon={<TrendingUp className="h-4 w-4 text-purple-500" />}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
          <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">Metrics loading soon</p>
          <p className="text-xs text-muted-foreground mt-1">Your VA checks this product daily and will populate the data within 24 hours.</p>
        </div>
      )}

      {/* ── Alerts ─────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          Recent Alerts
          {monitor.unread_alerts.length > 0 && (
            <Badge className="bg-primary/10 text-primary border-primary/20 ml-1" variant="outline">
              {monitor.unread_alerts.length} new
            </Badge>
          )}
        </h3>
        {monitor.unread_alerts.length > 0 ? (
          <div className="flex flex-col gap-2">
            {monitor.unread_alerts.map((alert) => (
              <div key={alert.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                {getChangeIcon(alert.change_type)}
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{getChangeLabel(alert.change_type)}</span>
                  <span className="text-sm text-muted-foreground ml-2">{alert.old_value} → {alert.new_value}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(alert.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card/50 px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">No alerts yet — your VA will notify you when something changes.</p>
          </div>
        )}
      </div>

      {/* ── Review Intelligence ───────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Review Intelligence
          </h3>
          {!reviewAnalysis && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl h-8 text-xs"
              onClick={handleAnalyzeReviews}
              disabled={analyzingReviews}
            >
              {analyzingReviews ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Analyzing...</>
              ) : (
                <>Run AI Analysis</>
              )}
            </Button>
          )}
          {reviewAnalysis && (
            <button
              onClick={() => { setReviewAnalysis(null); handleAnalyzeReviews() }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3 w-3" /> Re-run
            </button>
          )}
        </div>

        {!reviewAnalysis && !analyzingReviews && !reviewError && (
          <div className="rounded-xl border border-dashed border-border bg-card/50 px-4 py-8 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">AI Review Analysis</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Reads the latest customer reviews and surfaces what to fix and what&apos;s working.</p>
            <Button size="sm" className="rounded-xl" onClick={handleAnalyzeReviews}>
              Run Analysis
            </Button>
          </div>
        )}

        {analyzingReviews && (
          <div className="rounded-xl border border-border bg-card px-4 py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Reading reviews and analyzing patterns...</p>
          </div>
        )}

        {reviewError && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">{reviewError}</p>
          </div>
        )}

        {reviewAnalysis && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">Based on {reviewAnalysis.reviews_analyzed} reviews</p>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Complaints */}
              <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ThumbsDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-semibold text-foreground">Top Complaints</span>
                </div>
                <div className="flex flex-col gap-2">
                  {reviewAnalysis.complaints.map((c, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs font-bold text-red-500 mt-0.5 shrink-0 w-4">{i + 1}.</span>
                      <p className="text-sm text-foreground leading-snug">{c}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Positives */}
              <div className="rounded-2xl border border-green-100 bg-green-50/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ThumbsUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-foreground">What Customers Love</span>
                </div>
                <div className="flex flex-col gap-2">
                  {reviewAnalysis.positives.map((p, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs font-bold text-green-600 mt-0.5 shrink-0 w-4">{i + 1}.</span>
                      <p className="text-sm text-foreground leading-snug">{p}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendation */}
            {reviewAnalysis.recommendation && (
              <div className="flex items-start gap-3 rounded-2xl bg-primary/5 border border-primary/20 px-5 py-4">
                <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">VA Recommendation</span>
                  <p className="text-sm text-foreground mt-1 leading-relaxed">{reviewAnalysis.recommendation}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

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

  const getToken = useCallback(async () => {
    return session?.access_token ?? null
  }, [session])

  const fetchMonitors = useCallback(async () => {
    const token = await getToken()
    if (!token) return
    try {
      const res = await fetch("/api/monitor/list", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.ok) {
        const list: Monitor[] = data.monitors ?? []
        setMonitors(list)
        setUnreadCount(data.unread_count ?? 0)
        setSelected((prev) => {
          if (prev) return list.find((m) => m.id === prev.id) ?? list[0] ?? null
          return list[0] ?? null
        })
      }
    } catch (err) {
      console.error("Failed to fetch monitors:", err)
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    if (!authLoading && session) fetchMonitors()
  }, [authLoading, session, fetchMonitors])

  const handleAdd = async () => {
    const asin = asinInput.trim().toUpperCase()
    if (!asin) return
    setAdding(true)
    setAddError(null)
    try {
      const token = await getToken()
      const res = await fetch("/api/monitor/add", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ asin }),
      })
      const data = await res.json()
      if (!data.ok) {
        setAddError(data.error ?? "Failed to add monitor.")
      } else {
        setAsinInput("")
        setShowAdd(false)
        await fetchMonitors()
      }
    } catch {
      setAddError("Network error. Please try again.")
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (id: string) => {
    setRemoving(id)
    try {
      const token = await getToken()
      await fetch("/api/monitor/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      })
      await fetchMonitors()
    } catch {
      // ignore
    } finally {
      setRemoving(null)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-[1200px] px-6 py-8">

          {/* ── Page Header ──────────────────────────── */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Amazon VA</h1>
                {unreadCount > 0 && (
                  <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Your AI-powered virtual assistant — tracks competitors, analyzes reviews, and keeps you ahead.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {monitors.length}/{FREE_LIMIT} tracked
              </span>
              {monitors.length < FREE_LIMIT && (
                <Button size="sm" className="rounded-xl h-9" onClick={() => setShowAdd(!showAdd)}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Track Product
                </Button>
              )}
            </div>
          </div>

          {/* ── Add ASIN Panel ────────────────────── */}
          {showAdd && (
            <div className="mb-6 rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-1">Add a product to track</h2>
              <p className="text-xs text-muted-foreground mb-3">Find the ASIN on any Amazon product page — in the URL or under product details.</p>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. B08N5WRWNW"
                  value={asinInput}
                  onChange={(e) => { setAsinInput(e.target.value); setAddError(null) }}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className="h-10 rounded-xl font-mono max-w-xs"
                  maxLength={10}
                  autoFocus
                />
                <Button onClick={handleAdd} disabled={adding || !asinInput.trim()} className="h-10 rounded-xl px-5">
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                </Button>
                <Button variant="ghost" onClick={() => { setShowAdd(false); setAddError(null); setAsinInput("") }} className="h-10 rounded-xl">
                  Cancel
                </Button>
              </div>
              {addError && <p className="mt-2 text-sm text-destructive">{addError}</p>}
            </div>
          )}

          {/* ── Main Layout ───────────────────────── */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : monitors.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-24">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary mb-4">
                <Activity className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Your VA dashboard is ready</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs text-center">
                Add your first Amazon product ASIN to start tracking — price, reviews, BSR, and more.
              </p>
              <Button className="mt-6 rounded-xl" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Track your first product
              </Button>
            </div>
          ) : (
            <div className="flex gap-6">

              {/* ── Sidebar: Product List ────────── */}
              <div className="w-64 shrink-0 flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-1">Tracked Products</p>
                {monitors.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelected(m)}
                    className={`w-full text-left rounded-xl border px-3 py-3 transition-all ${
                      selected?.id === m.id
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-card hover:border-primary/20 hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {m.image_url ? (
                        <img src={m.image_url} alt={m.product_name} className="h-9 w-9 rounded-lg object-contain border border-border bg-white shrink-0" />
                      ) : (
                        <div className="h-9 w-9 rounded-lg border border-border bg-secondary flex items-center justify-center shrink-0">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate leading-tight">{m.product_name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{m.asin}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {m.unread_alerts.length > 0 && (
                          <span className="h-4 w-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                            {m.unread_alerts.length}
                          </span>
                        )}
                        <ChevronRight className={`h-3.5 w-3.5 transition-colors ${selected?.id === m.id ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5">
                        {m.latest_snapshot?.price != null && (
                          <span className="text-xs font-semibold text-foreground">${m.latest_snapshot.price.toFixed(2)}</span>
                        )}
                        {m.latest_snapshot?.rating != null && (
                          <span className="text-[10px] text-muted-foreground">{m.latest_snapshot.rating}★</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemove(m.id) }}
                        disabled={removing === m.id}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        {removing === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      </button>
                    </div>
                  </button>
                ))}

                {monitors.length < FREE_LIMIT && (
                  <button
                    onClick={() => setShowAdd(true)}
                    className="w-full text-left rounded-xl border border-dashed border-border px-3 py-3 hover:border-primary/30 hover:bg-secondary/30 transition-all flex items-center gap-2 text-muted-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-xs font-medium">Add product</span>
                  </button>
                )}
              </div>

              {/* ── Main Panel ───────────────────── */}
              <div className="flex-1 min-w-0">
                {selected ? (
                  <ProductDashboard
                    key={selected.id}
                    monitor={selected}
                    token={session?.access_token ?? null}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 rounded-2xl border border-dashed border-border bg-card/50">
                    <p className="text-sm text-muted-foreground">Select a product to view its dashboard</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
