"use client"

import { useState, useEffect, useCallback } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useSession } from "@/hooks/use-session"
import {
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
  Bell,
  Minus,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────
type Snapshot = {
  id: string
  price: number | null
  rating: number | null
  reviews_total: number | null
  rank: number | null
  created_at: string
}

type Alert = {
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
  latest_snapshot: Snapshot | null
  previous_snapshot: Snapshot | null
  unread_alerts: Alert[]
}

const FREE_LIMIT = 5

// ─── Helpers ──────────────────────────────────────────────
function alertLabel(type: string) {
  switch (type) {
    case "price_drop": return "Price dropped"
    case "price_increase": return "Price increased"
    case "reviews_change": return "Review count changed"
    case "rating_change": return "Rating changed"
    default: return type
  }
}

function priceDelta(curr: number, prev: number) {
  const d = curr - prev
  if (Math.abs(d) < 0.01) return null
  return d
}

// ─── Stat Tile ────────────────────────────────────────────
function Stat({
  label,
  value,
  delta,
  deltaLabel,
  icon,
  positive,
}: {
  label: string
  value: string
  delta?: number | null
  deltaLabel?: string
  icon: React.ReactNode
  positive?: boolean // true = green for positive delta
}) {
  const hasDelta = delta != null && delta !== 0
  const isGood = positive ? delta! > 0 : delta! < 0

  return (
    <div className="rounded-2xl bg-card border border-border p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="text-muted-foreground/60">{icon}</span>
      </div>
      <div>
        <span className="text-3xl font-bold tracking-tight text-foreground">{value}</span>
      </div>
      {hasDelta && deltaLabel ? (
        <div className={`flex items-center gap-1 text-xs font-medium ${isGood ? "text-emerald-600" : "text-red-500"}`}>
          {isGood ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
          {deltaLabel}
        </div>
      ) : (
        <div className="flex items-center gap-1 text-xs text-muted-foreground/50">
          <Minus className="h-3 w-3" />
          No change
        </div>
      )}
    </div>
  )
}

// ─── Product Panel ─────────────────────────────────────────
function ProductPanel({ monitor, token }: { monitor: Monitor; token: string | null }) {
  const [analysis, setAnalysis] = useState<ReviewAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const snap = monitor.latest_snapshot
  const prev = monitor.previous_snapshot

  const runAnalysis = async () => {
    if (!token) return
    setAnalyzing(true)
    setAnalysisError(null)
    try {
      const res = await fetch("/api/monitor/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ asin: monitor.asin }),
      })
      const data = await res.json()
      if (data.ok) setAnalysis(data)
      else setAnalysisError(data.error ?? "Failed to analyze reviews.")
    } catch {
      setAnalysisError("Network error. Please try again.")
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">

      {/* ── Product Identity ──────────────────── */}
      <div className="flex items-start gap-5 pb-6 border-b border-border">
        {monitor.image_url ? (
          <img
            src={monitor.image_url}
            alt={monitor.product_name}
            className="h-[72px] w-[72px] rounded-2xl object-contain border border-border bg-white shrink-0 shadow-sm"
          />
        ) : (
          <div className="h-[72px] w-[72px] rounded-2xl border border-border bg-secondary flex items-center justify-center shrink-0">
            <Package className="h-7 w-7 text-muted-foreground/40" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground leading-tight">{monitor.product_name}</h2>
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <span className="font-mono text-xs text-muted-foreground bg-secondary border border-border px-2.5 py-1 rounded-lg">{monitor.asin}</span>
            <a
              href={`https://www.amazon.com/dp/${monitor.asin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View on Amazon <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          {monitor.last_checked_at ? (
            <p className="mt-2 text-xs text-muted-foreground/60 flex items-center gap-1.5">
              <RefreshCw className="h-3 w-3" />
              Updated {new Date(monitor.last_checked_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground/60 flex items-center gap-1.5">
              <RefreshCw className="h-3 w-3" />
              First scan pending — check back within 24 hours
            </p>
          )}
        </div>
      </div>

      {/* ── Live Metrics ──────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Live Metrics</p>
        {snap ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {snap.price != null && (
              <Stat
                label="Price"
                value={`$${snap.price.toFixed(2)}`}
                delta={prev?.price != null ? priceDelta(snap.price, prev.price) : null}
                deltaLabel={prev?.price != null && priceDelta(snap.price, prev.price) != null
                  ? `$${Math.abs(priceDelta(snap.price, prev.price)!).toFixed(2)} from $${prev.price.toFixed(2)}`
                  : undefined}
                icon={<BarChart2 className="h-4 w-4" />}
                positive={false}
              />
            )}
            {snap.rating != null && (
              <Stat
                label="Rating"
                value={`${snap.rating}★`}
                delta={prev?.rating != null ? snap.rating - prev.rating : null}
                deltaLabel={prev?.rating != null && snap.rating !== prev.rating
                  ? `Was ${prev.rating}★`
                  : undefined}
                icon={<Star className="h-4 w-4" />}
                positive={true}
              />
            )}
            {snap.reviews_total != null && (
              <Stat
                label="Reviews"
                value={snap.reviews_total.toLocaleString()}
                delta={prev?.reviews_total != null ? snap.reviews_total - prev.reviews_total : null}
                deltaLabel={prev?.reviews_total != null && snap.reviews_total !== prev.reviews_total
                  ? `+${snap.reviews_total - prev.reviews_total} new`
                  : undefined}
                icon={<MessageSquare className="h-4 w-4" />}
                positive={true}
              />
            )}
            {snap.rank != null && (
              <Stat
                label="BSR"
                value={`#${snap.rank.toLocaleString()}`}
                delta={prev?.rank != null ? snap.rank - prev.rank : null}
                deltaLabel={prev?.rank != null && snap.rank !== prev.rank
                  ? snap.rank < prev.rank ? `↑ ${prev.rank - snap.rank} positions` : `↓ ${snap.rank - prev.rank} positions`
                  : undefined}
                icon={<TrendingUp className="h-4 w-4" />}
                positive={false}
              />
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-secondary/30 py-12 text-center">
            <RefreshCw className="h-6 w-6 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Awaiting first scan</p>
            <p className="text-xs text-muted-foreground mt-1">Your VA runs daily and will populate metrics within 24 hours.</p>
          </div>
        )}
      </div>

      {/* ── Alerts ────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Change Alerts</p>
          {monitor.unread_alerts.length > 0 && (
            <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
              {monitor.unread_alerts.length} new
            </span>
          )}
        </div>
        {monitor.unread_alerts.length > 0 ? (
          <div className="flex flex-col divide-y divide-border rounded-2xl border border-border overflow-hidden">
            {monitor.unread_alerts.map((a) => (
              <div key={a.id} className="flex items-center gap-4 px-5 py-4 bg-card hover:bg-secondary/30 transition-colors">
                <Bell className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{alertLabel(a.change_type)}</span>
                  <span className="text-sm text-muted-foreground ml-2">{a.old_value} → {a.new_value}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card px-5 py-8 text-center">
            <Bell className="h-5 w-5 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No changes detected yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">We&apos;ll alert you the moment something moves.</p>
          </div>
        )}
      </div>

      {/* ── Review Intelligence ───────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Review Intelligence</p>
          {analysis ? (
            <button
              onClick={() => { setAnalysis(null); runAnalysis() }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="h-3 w-3" /> Re-run
            </button>
          ) : null}
        </div>

        {!analysis && !analyzing && !analysisError && (
          <div className="rounded-2xl border border-dashed border-border bg-secondary/20 py-12 text-center">
            <MessageSquare className="h-6 w-6 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">AI Review Analysis</p>
            <p className="text-xs text-muted-foreground mt-1 mb-5 max-w-xs mx-auto">
              Reads the latest customer reviews and tells you exactly what to fix and what&apos;s working.
            </p>
            <Button size="sm" className="rounded-xl px-6" onClick={runAnalysis}>
              Run Analysis
            </Button>
          </div>
        )}

        {analyzing && (
          <div className="rounded-2xl border border-border bg-card py-12 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Reading reviews and finding patterns...</p>
          </div>
        )}

        {analysisError && (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">{analysisError}</p>
          </div>
        )}

        {analysis && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">Based on {analysis.reviews_analyzed} reviews</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-red-100 bg-red-50/40 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ThumbsDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-semibold text-foreground">Top Complaints</span>
                </div>
                <ol className="flex flex-col gap-3">
                  {analysis.complaints.map((c, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-xs font-bold text-red-400 mt-0.5 w-4 shrink-0">{i + 1}</span>
                      <p className="text-sm text-foreground leading-snug">{c}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ThumbsUp className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-foreground">What Customers Love</span>
                </div>
                <ol className="flex flex-col gap-3">
                  {analysis.positives.map((p, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-xs font-bold text-emerald-500 mt-0.5 w-4 shrink-0">{i + 1}</span>
                      <p className="text-sm text-foreground leading-snug">{p}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {analysis.recommendation && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <Lightbulb className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">VA Recommendation</p>
                  <p className="text-sm text-foreground leading-relaxed">{analysis.recommendation}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────
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

  const getToken = useCallback(() => session?.access_token ?? null, [session])

  const fetchMonitors = useCallback(async () => {
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch("/api/monitor/list", { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.ok) {
        const list: Monitor[] = data.monitors ?? []
        setMonitors(list)
        setUnreadCount(data.unread_count ?? 0)
        setSelected(prev => {
          if (prev) return list.find(m => m.id === prev.id) ?? list[0] ?? null
          return list[0] ?? null
        })
      }
    } catch {}
    finally { setLoading(false) }
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
      const res = await fetch("/api/monitor/add", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ asin }),
      })
      const data = await res.json()
      if (!data.ok) { setAddError(data.error ?? "Failed to add.") }
      else { setAsinInput(""); setShowAdd(false); await fetchMonitors() }
    } catch { setAddError("Network error.") }
    finally { setAdding(false) }
  }

  const handleRemove = async (id: string) => {
    setRemoving(id)
    try {
      await fetch("/api/monitor/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ id }),
      })
      await fetchMonitors()
    } catch {}
    finally { setRemoving(null) }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-[1200px] px-6 py-10">

          {/* ── Header ───────────────────────── */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2.5">
                <Activity className="h-5 w-5 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Amazon VA</h1>
                {unreadCount > 0 && (
                  <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                    {unreadCount} alerts
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Tracks competitors, monitors reviews, and alerts you when something changes.
              </p>
            </div>
            {monitors.length < FREE_LIMIT && (
              <Button size="sm" className="rounded-xl h-9 gap-1.5" onClick={() => setShowAdd(!showAdd)}>
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            )}
          </div>

          {/* ── Add ASIN ─────────────────────── */}
          {showAdd && (
            <div className="mb-6 rounded-2xl border border-border bg-card p-6">
              <p className="text-sm font-semibold text-foreground mb-1">Track a new product</p>
              <p className="text-xs text-muted-foreground mb-4">
                Find the ASIN on any Amazon product page — in the URL (e.g. <span className="font-mono">amazon.com/dp/<strong>B08N5WRWNW</strong></span>) or under product details.
              </p>
              <div className="flex gap-2 max-w-md">
                <Input
                  placeholder="ASIN — e.g. B08N5WRWNW"
                  value={asinInput}
                  onChange={e => { setAsinInput(e.target.value); setAddError(null) }}
                  onKeyDown={e => e.key === "Enter" && handleAdd()}
                  className="h-10 rounded-xl font-mono"
                  maxLength={10}
                  autoFocus
                />
                <Button onClick={handleAdd} disabled={adding || !asinInput.trim()} className="h-10 rounded-xl px-5 shrink-0">
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Track"}
                </Button>
                <Button variant="ghost" onClick={() => { setShowAdd(false); setAddError(null); setAsinInput("") }} className="h-10 rounded-xl">
                  Cancel
                </Button>
              </div>
              {addError && <p className="mt-2 text-sm text-destructive">{addError}</p>}
            </div>
          )}

          {/* ── Body ─────────────────────────── */}
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : monitors.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-28 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary mb-5">
                <Activity className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Your VA dashboard is ready</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                Add any Amazon product ASIN to start tracking price, reviews, BSR, and more — automatically.
              </p>
              <Button className="mt-6 rounded-xl gap-1.5" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4" /> Add your first product
              </Button>
            </div>
          ) : (
            <div className="flex gap-6 items-start">

              {/* ── Sidebar ──────────────────── */}
              <div className="w-56 shrink-0 flex flex-col gap-1 sticky top-20">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-2">
                  Products ({monitors.length}/{FREE_LIMIT})
                </p>

                {monitors.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelected(m)}
                    className={`group w-full text-left rounded-xl px-3 py-2.5 transition-all ${
                      selected?.id === m.id
                        ? "bg-primary/8 border border-primary/20"
                        : "border border-transparent hover:bg-secondary/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {m.image_url ? (
                        <img src={m.image_url} alt="" className="h-8 w-8 rounded-lg object-contain border border-border bg-white shrink-0" />
                      ) : (
                        <div className="h-8 w-8 rounded-lg border border-border bg-secondary flex items-center justify-center shrink-0">
                          <Package className="h-3.5 w-3.5 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${selected?.id === m.id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                          {m.product_name !== m.asin ? m.product_name : m.asin}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground/50 mt-0.5">{m.asin}</p>
                      </div>
                      {m.unread_alerts.length > 0 && (
                        <span className="h-4 w-4 rounded-full bg-primary text-[9px] font-bold text-white flex items-center justify-center shrink-0">
                          {m.unread_alerts.length}
                        </span>
                      )}
                    </div>
                    {m.latest_snapshot?.price != null && (
                      <p className="mt-1.5 pl-10 text-xs font-semibold text-foreground">
                        ${m.latest_snapshot.price.toFixed(2)}
                        {m.latest_snapshot.rating != null && (
                          <span className="font-normal text-muted-foreground ml-1.5">{m.latest_snapshot.rating}★</span>
                        )}
                      </p>
                    )}
                  </button>
                ))}

                {monitors.length < FREE_LIMIT && (
                  <button
                    onClick={() => setShowAdd(true)}
                    className="w-full text-left rounded-xl border border-dashed border-border px-3 py-2.5 mt-1 flex items-center gap-2 text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Add product</span>
                  </button>
                )}

                {selected && (
                  <button
                    onClick={() => handleRemove(selected.id)}
                    disabled={removing === selected.id}
                    className="w-full text-left rounded-xl px-3 py-2 mt-3 flex items-center gap-2 text-muted-foreground/50 hover:text-destructive transition-colors text-xs"
                  >
                    {removing === selected.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    Remove this product
                  </button>
                )}
              </div>

              {/* ── Main Panel ───────────────── */}
              <div className="flex-1 min-w-0">
                {selected ? (
                  <ProductPanel
                    key={selected.id}
                    monitor={selected}
                    token={session?.access_token ?? null}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 rounded-2xl border border-dashed border-border">
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
