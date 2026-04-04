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

function getChangeColor(type: string) {
  switch (type) {
    case "price_drop": return "text-green-600 bg-green-50 border-green-200"
    case "price_increase": return "text-red-600 bg-red-50 border-red-200"
    case "reviews_change": return "text-blue-600 bg-blue-50 border-blue-200"
    case "rating_change": return "text-orange-600 bg-orange-50 border-orange-200"
    default: return "text-muted-foreground bg-secondary border-border"
  }
}

export default function MonitorPage() {
  const { loading: authLoading } = useRequireAuth()
  const { session } = useSession()
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [asinInput, setAsinInput] = useState("")
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

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
        setMonitors(data.monitors ?? [])
        setUnreadCount(data.unread_count ?? 0)
      }
    } catch (err) {
      console.error("Failed to fetch monitors:", err)
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    if (!authLoading && session) {
      fetchMonitors()
    }
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
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">Monitor</h1>
                {unreadCount > 0 && (
                  <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Track price, rating, and review changes for any Amazon product — checked every 12 hours.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>{monitors.length} / {FREE_LIMIT} products monitored</span>
            </div>
          </div>

          {/* Add ASIN */}
          <div className="mt-8 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Add product to monitor</h2>
            <div className="flex gap-2">
              <Input
                placeholder="Enter Amazon ASIN (e.g. B08N5WRWNW)"
                value={asinInput}
                onChange={(e) => { setAsinInput(e.target.value); setAddError(null) }}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="h-10 rounded-xl font-mono"
                maxLength={10}
                disabled={monitors.length >= FREE_LIMIT}
              />
              <Button
                onClick={handleAdd}
                disabled={adding || !asinInput.trim() || monitors.length >= FREE_LIMIT}
                className="h-10 rounded-xl px-5 shrink-0"
              >
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1.5" />Add</>}
              </Button>
            </div>
            {addError && <p className="mt-2 text-sm text-destructive">{addError}</p>}
            {monitors.length >= FREE_LIMIT && (
              <p className="mt-2 text-sm text-muted-foreground">
                Free tier limit reached ({FREE_LIMIT} products). Upgrade to PRO for unlimited monitoring.
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Where to find the ASIN: Go to any Amazon product page — look in the URL or product details section.
            </p>
          </div>

          {/* Stats */}
          {monitors.length > 0 && (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monitored</span>
                <p className="mt-1 text-2xl font-bold text-card-foreground">{monitors.length}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unread Alerts</span>
                <p className="mt-1 text-2xl font-bold text-primary">{unreadCount}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Check Frequency</span>
                <p className="mt-1 text-2xl font-bold text-card-foreground">12h</p>
              </div>
            </div>
          )}

          {/* Monitor List */}
          <div className="mt-6 flex flex-col gap-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : monitors.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                  <Bell className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">No products monitored yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">Add an ASIN above to start tracking changes.</p>
              </div>
            ) : (
              monitors.map((monitor) => (
                <div key={monitor.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start gap-4">
                    {/* Product image */}
                    {monitor.image_url ? (
                      <img
                        src={monitor.image_url}
                        alt={monitor.product_name}
                        className="h-16 w-16 rounded-xl object-contain border border-border bg-white shrink-0"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-xl border border-border bg-secondary flex items-center justify-center shrink-0">
                        <BarChart2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}

                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
                            {monitor.product_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono text-muted-foreground">{monitor.asin}</span>
                            <a
                              href={`https://www.amazon.com/dp/${monitor.asin}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => handleRemove(monitor.id)}
                          disabled={removing === monitor.id}
                        >
                          {removing === monitor.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>

                      {/* Metrics */}
                      {monitor.latest_snapshot ? (
                        <div className="mt-3 flex flex-wrap gap-3">
                          {monitor.latest_snapshot.price != null && (
                            <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1">
                              {monitor.previous_snapshot?.price != null && monitor.latest_snapshot.price < monitor.previous_snapshot.price ? (
                                <TrendingDown className="h-3.5 w-3.5 text-green-600" />
                              ) : monitor.previous_snapshot?.price != null && monitor.latest_snapshot.price > monitor.previous_snapshot.price ? (
                                <TrendingUp className="h-3.5 w-3.5 text-red-500" />
                              ) : null}
                              <span className="text-sm font-semibold text-foreground">${monitor.latest_snapshot.price.toFixed(2)}</span>
                            </div>
                          )}
                          {monitor.latest_snapshot.rating != null && (
                            <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1">
                              <Star className="h-3.5 w-3.5 text-yellow-500" />
                              <span className="text-sm font-medium text-foreground">{monitor.latest_snapshot.rating}</span>
                            </div>
                          )}
                          {monitor.latest_snapshot.reviews_total != null && (
                            <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1">
                              <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                              <span className="text-sm font-medium text-foreground">{monitor.latest_snapshot.reviews_total.toLocaleString()} reviews</span>
                            </div>
                          )}
                          {monitor.latest_snapshot.rank != null && (
                            <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1">
                              <BarChart2 className="h-3.5 w-3.5 text-purple-500" />
                              <span className="text-sm font-medium text-foreground">#{monitor.latest_snapshot.rank.toLocaleString()} BSR</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>First check pending — data will appear within 12 hours</span>
                        </div>
                      )}

                      {/* Alerts */}
                      {monitor.unread_alerts.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {monitor.unread_alerts.map((alert) => (
                            <span
                              key={alert.id}
                              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium ${getChangeColor(alert.change_type)}`}
                            >
                              {getChangeLabel(alert.change_type)}: {alert.old_value} → {alert.new_value}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Last checked */}
                      {monitor.last_checked_at && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Last checked: {new Date(monitor.last_checked_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
