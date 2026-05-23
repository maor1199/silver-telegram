"use client"

// ─── Demo Session Control Panel ────────────────────────────────────────────────
// Internal-only. Not linked from anywhere public.
// Gives the team control over what a demo session looks like.
//
// WHAT IT CONTROLS:
//   — The "since your last visit" daily brief message (feed snapshot override)
//   — The first-run intro overlay (reset to show again)
//   — Persistence session counts (simulate different history lengths)
//   — All engagement tracking data (clean slate)
//
// DOES NOT MODIFY:
//   — The actual SKU data or risk engine output
//   — Any Supabase state

import { useState, useEffect } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { cn } from "@/lib/utils"

// ─── localStorage keys ────────────────────────────────────────────────────────

const KEYS = {
  engagement:   "sellermentor_engagement_v1",
  persistence:  "sellermentor_persistence_v1",
  feedSnapshot: "sellermentor_feed_snapshot_v1",
  intro:        "sellermentor_intro_v1",
  skus:         "sellermentor_skus_v1",
  skusMeta:     "sellermentor_skus_meta_v1",
  prevSnapshot: "sellermentor_prev_snapshot_v1",
}

// ─── Scenario definitions ─────────────────────────────────────────────────────

type Scenario = {
  id:          string
  label:       string
  description: string
  tone:        "neutral" | "warning" | "critical" | "positive"
  apply:       () => void
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString()
}

function buildScenarios(): Scenario[] {
  return [
    {
      id:          "fresh",
      label:       "Fresh visit",
      description: "No previous session. Intro overlay will show. No daily brief.",
      tone:        "neutral",
      apply: () => {
        localStorage.removeItem(KEYS.feedSnapshot)
        localStorage.removeItem(KEYS.intro)
      },
    },
    {
      id:          "escalation",
      label:       "1 issue worsened",
      description: "B001 stockout was HIGH yesterday — now CRITICAL. Brief shows 'escalated to critical'.",
      tone:        "warning",
      apply: () => {
        localStorage.setItem(INTRO_KEY, "1") // hide intro
        const previousFeed = {
          savedAt: daysAgo(1),
          items: [
            { alertId: "stockout-high-B001", skuId: "B001", skuName: "Bamboo Cutting Board Set (3-Pack)", category: "stockout", severity: "high",     trajectory: "deteriorating" },
            { alertId: "margin-neg-B006",    skuId: "B006", skuName: "Electric Coffee Grinder Burr 40-Setting", category: "margin", severity: "critical", trajectory: "accelerating"  },
            { alertId: "ppc-crit-B006",      skuId: "B006", skuName: "Electric Coffee Grinder Burr 40-Setting", category: "ppc",    severity: "critical", trajectory: "accelerating"  },
            { alertId: "ppc-high-B002",      skuId: "B002", skuName: "Silicone Kitchen Spatula Set (5-Piece)", category: "ppc",    severity: "high",     trajectory: "deteriorating" },
            { alertId: "returns-B005",       skuId: "B005", skuName: "Premium Non-Slip Yoga Mat 6mm", category: "returns", severity: "high",     trajectory: "deteriorating" },
          ],
        }
        localStorage.setItem(KEYS.feedSnapshot, JSON.stringify(previousFeed))
      },
    },
    {
      id:          "resolved",
      label:       "1 issue resolved",
      description: "Coffee Grinder PPC was present yesterday — today it's no longer above threshold. Brief shows 'fell below significance'.",
      tone:        "positive",
      apply: () => {
        localStorage.setItem(INTRO_KEY, "1")
        const previousFeed = {
          savedAt: daysAgo(1),
          items: [
            { alertId: "stockout-crit-B001", skuId: "B001", skuName: "Bamboo Cutting Board Set (3-Pack)", category: "stockout", severity: "critical", trajectory: "accelerating"  },
            { alertId: "margin-neg-B006",    skuId: "B006", skuName: "Electric Coffee Grinder Burr 40-Setting", category: "margin", severity: "critical", trajectory: "accelerating"  },
            { alertId: "ppc-crit-B006",      skuId: "B006", skuName: "Electric Coffee Grinder Burr 40-Setting", category: "ppc",    severity: "critical", trajectory: "accelerating"  },
            { alertId: "ppc-high-B002",      skuId: "B002", skuName: "Silicone Kitchen Spatula Set (5-Piece)", category: "ppc",    severity: "high",     trajectory: "deteriorating" },
            // This one disappeared — simulates PPC on B006 dropping below threshold
            { alertId: "dead-B003",          skuId: "B003", skuName: "High-Density Foam Roller Pro", category: "overstock", severity: "medium",   trajectory: "deteriorating" },
          ],
        }
        localStorage.setItem(KEYS.feedSnapshot, JSON.stringify(previousFeed))
      },
    },
    {
      id:          "stable",
      label:       "No change",
      description: "Operational state unchanged since last visit. Brief shows issue count, no escalation.",
      tone:        "neutral",
      apply: () => {
        localStorage.setItem(INTRO_KEY, "1")
        const previousFeed = {
          savedAt: daysAgo(1),
          items: [
            { alertId: "stockout-crit-B001", skuId: "B001", skuName: "Bamboo Cutting Board Set (3-Pack)", category: "stockout", severity: "critical", trajectory: "accelerating"  },
            { alertId: "margin-neg-B006",    skuId: "B006", skuName: "Electric Coffee Grinder Burr 40-Setting", category: "margin", severity: "critical", trajectory: "accelerating"  },
            { alertId: "ppc-crit-B006",      skuId: "B006", skuName: "Electric Coffee Grinder Burr 40-Setting", category: "ppc",    severity: "critical", trajectory: "accelerating"  },
            { alertId: "ppc-high-B002",      skuId: "B002", skuName: "Silicone Kitchen Spatula Set (5-Piece)", category: "ppc",    severity: "high",     trajectory: "deteriorating" },
            { alertId: "returns-B005",       skuId: "B005", skuName: "Premium Non-Slip Yoga Mat 6mm", category: "returns", severity: "high",     trajectory: "deteriorating" },
          ],
        }
        localStorage.setItem(KEYS.feedSnapshot, JSON.stringify(previousFeed))
      },
    },
    {
      id:          "chronic",
      label:       "Chronic issues mode",
      description: "Persistence store set to high session counts. All cards show 'Chronic — 12 sessions'.",
      tone:        "warning",
      apply: () => {
        localStorage.setItem(INTRO_KEY, "1")
        const persistence = {
          "B001-stockout":        { key: "B001-stockout",        firstSeenAt: daysAgo(14), lastSeenAt: new Date().toISOString(), sessionCount: 14, lastSeverity: "critical" },
          "B002-ppc_pressure":    { key: "B002-ppc_pressure",    firstSeenAt: daysAgo(18), lastSeenAt: new Date().toISOString(), sessionCount: 18, lastSeverity: "high"     },
          "B003-dead_inventory":  { key: "B003-dead_inventory",  firstSeenAt: daysAgo(30), lastSeenAt: new Date().toISOString(), sessionCount: 30, lastSeverity: "medium"   },
          "B005-return_rate":     { key: "B005-return_rate",     firstSeenAt: daysAgo(45), lastSeenAt: new Date().toISOString(), sessionCount: 45, lastSeverity: "high"     },
          "B005-margin_erosion":  { key: "B005-margin_erosion",  firstSeenAt: daysAgo(22), lastSeenAt: new Date().toISOString(), sessionCount: 22, lastSeverity: "high"     },
          "B006-negative_margin": { key: "B006-negative_margin", firstSeenAt: daysAgo(28), lastSeenAt: new Date().toISOString(), sessionCount: 28, lastSeverity: "critical" },
          "B006-ppc_pressure":    { key: "B006-ppc_pressure",    firstSeenAt: daysAgo(32), lastSeenAt: new Date().toISOString(), sessionCount: 32, lastSeverity: "critical" },
        }
        localStorage.setItem(KEYS.persistence, JSON.stringify(persistence))
      },
    },
  ]
}

const INTRO_KEY = "sellermentor_intro_v1"

// ─── State helpers ─────────────────────────────────────────────────────────────

function readLocalState() {
  if (typeof window === "undefined") return null
  return {
    hasIntro:        !localStorage.getItem(KEYS.intro),
    hasFeedSnapshot: !!localStorage.getItem(KEYS.feedSnapshot),
    hasEngagement:   !!localStorage.getItem(KEYS.engagement),
    hasPersistence:  !!localStorage.getItem(KEYS.persistence),
    hasLiveData:     !!localStorage.getItem(KEYS.skus),
    activeScenario:  localStorage.getItem("sellermentor_active_scenario") ?? null,
  }
}

// ─── Component helpers ────────────────────────────────────────────────────────

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className={cn("inline-block h-1.5 w-1.5 rounded-full", active ? "bg-green-500" : "bg-border")} />
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground">{value}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoSessionPage() {
  const [state,     setState]     = useState<ReturnType<typeof readLocalState>>(null)
  const [msg,       setMsg]       = useState("")
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [mounted,   setMounted]   = useState(false)

  useEffect(() => {
    setMounted(true)
    setState(readLocalState())
    setScenarios(buildScenarios())
  }, [])

  function refresh() { setState(readLocalState()) }

  function flash(m: string) {
    setMsg(m)
    setTimeout(() => setMsg(""), 3000)
  }

  function applyScenario(scenario: Scenario) {
    scenario.apply()
    localStorage.setItem("sellermentor_active_scenario", scenario.id)
    refresh()
    flash(`Scenario set: "${scenario.label}"`)
  }

  function resetAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k))
    localStorage.removeItem("sellermentor_active_scenario")
    refresh()
    flash("All SellerMentor state cleared — clean slate.")
  }

  function resetEngagement() {
    localStorage.removeItem(KEYS.engagement)
    refresh()
    flash("Engagement data cleared.")
  }

  function resetIntro() {
    localStorage.removeItem(KEYS.intro)
    refresh()
    flash("Intro overlay will show on next dashboard visit.")
  }

  function resetPersistence() {
    localStorage.removeItem(KEYS.persistence)
    refresh()
    flash("Persistence history cleared — all session counts reset.")
  }

  if (!mounted) return null

  const toneStyle = (tone: Scenario["tone"]) =>
    tone === "critical" ? "border-red-200 bg-red-50/50 hover:bg-red-50"    :
    tone === "warning"  ? "border-orange-200 bg-orange-50/50 hover:bg-orange-50" :
    tone === "positive" ? "border-green-200 bg-green-50/50 hover:bg-green-50"  :
                          "border-border bg-muted/30 hover:bg-muted/50"

  const toneText = (tone: Scenario["tone"]) =>
    tone === "critical" ? "text-red-700"    :
    tone === "warning"  ? "text-orange-700" :
    tone === "positive" ? "text-green-700"  :
                          "text-muted-foreground"

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-[860px] px-6 py-8">

          {/* Header */}
          <div className="mb-8 pb-5 border-b border-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600 mb-1">
              Internal · Demo Control Panel
            </p>
            <h1 className="text-2xl font-bold text-foreground">Demo Session</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Control what the seller sees before opening the dashboard. Reset state, inject scenarios, observe reactions.
            </p>
          </div>

          {/* Current state */}
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Current State</p>
            <div className="rounded-xl border border-border bg-card px-4 divide-y divide-border/50">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-muted-foreground">Intro overlay</span>
                <div className="flex items-center gap-2">
                  <StatusDot active={!!state?.hasIntro} />
                  <span className="text-xs font-medium text-foreground">
                    {state?.hasIntro ? "Will show on next visit" : "Already seen"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-muted-foreground">Feed snapshot</span>
                <div className="flex items-center gap-2">
                  <StatusDot active={!!state?.hasFeedSnapshot} />
                  <span className="text-xs font-medium text-foreground">
                    {state?.hasFeedSnapshot ? "Loaded (daily brief will compare)" : "Empty (no brief on next visit)"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-muted-foreground">Persistence history</span>
                <div className="flex items-center gap-2">
                  <StatusDot active={!!state?.hasPersistence} />
                  <span className="text-xs font-medium text-foreground">
                    {state?.hasPersistence ? "Custom history loaded" : "Using demo defaults"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-muted-foreground">Data source</span>
                <span className="text-xs font-medium text-foreground">
                  {state?.hasLiveData ? "Live uploaded data" : "Demo (mock SKUs)"}
                </span>
              </div>
              {state?.activeScenario && (
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-xs text-muted-foreground">Active scenario</span>
                  <span className="text-xs font-medium text-primary">{state.activeScenario}</span>
                </div>
              )}
            </div>
          </div>

          {/* Scenario presets */}
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Scenario Presets
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Sets the "last visit" state so the daily brief shows the desired comparison on next dashboard visit.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {scenarios.map(s => (
                <button
                  key={s.id}
                  onClick={() => applyScenario(s)}
                  className={cn(
                    "rounded-xl border px-4 py-4 text-left transition-colors",
                    toneStyle(s.tone),
                    state?.activeScenario === s.id ? "ring-2 ring-primary/30" : ""
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className={cn("text-sm font-semibold", toneText(s.tone))}>{s.label}</p>
                    {state?.activeScenario === s.id && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 rounded px-1.5 py-0.5">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Reset controls */}
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Reset Controls
            </p>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={resetIntro}
                className="rounded-lg border border-border bg-background hover:bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors"
              >
                Reset intro overlay
              </button>
              <button
                onClick={resetEngagement}
                className="rounded-lg border border-border bg-background hover:bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors"
              >
                Clear engagement data
              </button>
              <button
                onClick={resetPersistence}
                className="rounded-lg border border-border bg-background hover:bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors"
              >
                Reset persistence history
              </button>
              <button
                onClick={resetAll}
                className="rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition-colors"
              >
                Reset everything
              </button>
            </div>
            {msg && <p className="mt-3 text-xs text-muted-foreground">{msg}</p>}
          </div>

          {/* Launch */}
          <div className="pt-6 border-t border-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Launch</p>
            <p className="text-xs text-muted-foreground mb-4">
              Apply a scenario, then open the dashboard to see the result. The seller will see whatever state you configured.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Open Command Center →
              </Link>
              <Link
                href="/internal/validation"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                View engagement data
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
