"use client"

// ─── Internal Validation Panel ────────────────────────────────────────────────
// NOT for end users. Visible at /internal/validation.
// Shows engagement analytics to learn what actually feels valuable.
// All data lives in localStorage — no server required.

import { useState, useEffect, useCallback } from "react"
import { Navbar } from "@/components/navbar"
import {
  getEngagementSummary,
  getRecentEvents,
  resetEngagement,
  resetDemoSession,
} from "@/lib/intelligence/engagement-tracker"
import type { EngagementSummary, EngagementEvent } from "@/lib/intelligence/engagement-tracker"
import { cn } from "@/lib/utils"

// ─── Stat row ─────────────────────────────────────────────────────────────────

function StatRow({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className="text-sm font-semibold text-foreground tabular-nums">{value}</span>
        {sub && <span className="text-xs text-muted-foreground ml-2">{sub}</span>}
      </div>
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
        {title}
      </p>
      {children}
    </div>
  )
}

// ─── Event badge ──────────────────────────────────────────────────────────────

function EventTypeBadge({ type }: { type: EngagementEvent["type"] }) {
  const color =
    type === "alert_expanded"  ? "text-blue-700 bg-blue-50 border-blue-200"    :
    type === "ai_clicked"      ? "text-purple-700 bg-purple-50 border-purple-200" :
    type === "feedback"        ? "text-green-700 bg-green-50 border-green-200"  :
    type === "feed_visit"      ? "text-orange-700 bg-orange-50 border-orange-200" :
                                 "text-muted-foreground bg-muted border-border"
  return (
    <span className={cn("inline-block rounded border px-1.5 py-0.5 text-[10px] font-mono font-semibold whitespace-nowrap", color)}>
      {type}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ValidationPage() {
  const [summary, setSummary] = useState<EngagementSummary | null>(null)
  const [events,  setEvents]  = useState<EngagementEvent[]>([])
  const [msg,     setMsg]     = useState("")
  const [mounted, setMounted] = useState(false)

  const refresh = useCallback(() => {
    setSummary(getEngagementSummary())
    setEvents(getRecentEvents(10))
  }, [])

  useEffect(() => {
    setMounted(true)
    refresh()
  }, [refresh])

  function flash(m: string) {
    setMsg(m)
    setTimeout(() => setMsg(""), 3000)
  }

  function handleResetEngagement() {
    resetEngagement()
    refresh()
    flash("Engagement data cleared.")
  }

  function handleResetDemo() {
    resetDemoSession()
    refresh()
    flash("Full demo session reset — all SellerMentor localStorage cleared.")
  }

  if (!mounted || !summary) return null

  const hasFeedback = Object.values(summary.feedbackCounts).some(n => n > 0)
  const hasCategoryData = Object.keys(summary.categoryExpands).length > 0 ||
                          Object.keys(summary.categoryRenders).length > 0

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-[800px] px-6 py-8">

          {/* Header */}
          <div className="mb-8 pb-5 border-b border-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600 mb-1">
              Internal · Not for end users
            </p>
            <h1 className="text-2xl font-bold text-foreground">Validation Panel</h1>
            <p className="text-sm text-muted-foreground mt-1">
              What sellers actually engage with. Sourced from localStorage — one session at a time.
            </p>
          </div>

          {/* Core metrics */}
          <Section title="Engagement Overview">
            <div className="rounded-xl border border-border bg-card px-4 divide-y divide-border/50">
              <StatRow label="Feed visits"     value={summary.feedVisits} />
              <StatRow label="Total expands"   value={summary.totalExpands} sub={`${summary.expandRate}× per visit`} />
              <StatRow label="Ask AI clicks"   value={summary.totalAiClicks} sub={`${summary.aiClickRate}× per visit`} />
              <StatRow
                label="Avg rank expanded"
                value={summary.avgRankExpanded > 0 ? summary.avgRankExpanded : "—"}
                sub="lower = higher-ranked issues opened first"
              />
              {summary.topAlertByEngagement && (
                <StatRow label="Top issue (weighted)" value={summary.topAlertByEngagement} />
              )}
            </div>
          </Section>

          {/* Category engagement */}
          {hasCategoryData && (
            <Section title="Category Engagement">
              <div className="rounded-xl border border-border bg-card px-4 divide-y divide-border/50 mb-3">
                {Object.entries(summary.categoryExpands)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, count]) => {
                    const renders = summary.categoryRenders[cat] ?? 0
                    const rate    = renders > 0 ? `${Math.round((count / renders) * 100)}% expand rate` : undefined
                    return <StatRow key={cat} label={cat} value={`${count} expand${count !== 1 ? "s" : ""}`} sub={rate} />
                  })
                }
                {Object.keys(summary.categoryRenders).filter(c => !summary.categoryExpands[c]).map(cat => (
                  <StatRow key={cat} label={cat} value="0 expands" sub={`${summary.categoryRenders[cat]} renders`} />
                ))}
              </div>
              <div className="flex gap-6 text-xs">
                {summary.mostExpandedCategory && (
                  <p className="text-muted-foreground">
                    Most engaged: <span className="font-semibold text-foreground capitalize">{summary.mostExpandedCategory}</span>
                  </p>
                )}
                {summary.mostIgnoredCategory && (
                  <p className="text-muted-foreground">
                    Most ignored: <span className="font-semibold text-foreground capitalize">{summary.mostIgnoredCategory}</span>
                  </p>
                )}
              </div>
            </Section>
          )}

          {/* Feedback */}
          <Section title="Qualitative Feedback">
            {hasFeedback ? (
              <div className="rounded-xl border border-border bg-card px-4 divide-y divide-border/50">
                {(Object.entries(summary.feedbackCounts) as [string, number][]).map(([key, count]) => (
                  <StatRow
                    key={key}
                    label={key.replace(/_/g, " ")}
                    value={count}
                    sub={summary.totalExpands > 0
                      ? `${Math.round((count / summary.totalExpands) * 100)}% of expands`
                      : undefined}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No feedback recorded yet.</p>
            )}
          </Section>

          {/* Session survey */}
          <Section title="Session Survey">
            {Object.values(summary.surveyCounts).some(n => n > 0) ? (
              <>
                <div className="rounded-xl border border-border bg-card px-4 divide-y divide-border/50 mb-2">
                  {(Object.entries(summary.surveyCounts) as [string, number][]).map(([key, count]) => {
                    const total = Object.values(summary.surveyCounts).reduce((a, b) => a + b, 0)
                    return (
                      <StatRow
                        key={key}
                        label={key.charAt(0).toUpperCase() + key.slice(1)}
                        value={count}
                        sub={total > 0 ? `${Math.round((count / total) * 100)}%` : undefined}
                      />
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  "Did SellerMentor help you understand what needs attention?"
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No survey responses yet.</p>
            )}
          </Section>

          {/* Last 10 events */}
          <Section title="Last 10 Events">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events recorded yet.</p>
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-x-auto">
                <table className="w-full text-xs min-w-[560px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Time</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Event</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Alert / Data</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {events.map((e, i) => (
                      <tr key={i} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 text-muted-foreground font-mono whitespace-nowrap">
                          {new Date(e.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </td>
                        <td className="px-4 py-2.5">
                          <EventTypeBadge type={e.type} />
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground font-mono truncate max-w-[160px]">
                          {e.alertId ?? e.categories ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground capitalize">{e.category ?? "—"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {e.rank != null ? `rank ${e.rank}` : e.feedbackValue?.replace(/_/g, " ") ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-2 flex justify-end">
              <button
                onClick={refresh}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Refresh ↻
              </button>
            </div>
          </Section>

          {/* Reset section */}
          <div className="pt-6 border-t border-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Reset / Testing
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Use these to simulate a fresh user session during testing.
            </p>
            <div className="flex gap-3 flex-wrap items-center">
              <button
                onClick={handleResetEngagement}
                className="rounded-lg border border-border bg-background hover:bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors"
              >
                Clear Engagement Data
              </button>
              <button
                onClick={handleResetDemo}
                className="rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition-colors"
              >
                Reset Full Demo Session
              </button>
            </div>
            {msg && (
              <p className="mt-3 text-xs text-muted-foreground">{msg}</p>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
