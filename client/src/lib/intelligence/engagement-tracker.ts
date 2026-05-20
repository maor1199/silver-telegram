// ─── Engagement Tracker ───────────────────────────────────────────────────────
// Lightweight localStorage instrumentation.
// Tracks which alerts feel operationally valuable to sellers.
// No server, no external analytics — privacy-first, zero latency.
//
// Answers:
//   - Which alerts get expanded (vs skimmed)?
//   - Which issue types trigger AI follow-up?
//   - What gets clicked first in the feed?
//   - Are "If nothing changes" projections driving action?

const KEY     = "sellermentor_engagement_v1"
const MAX_EVT = 500   // keep store bounded — trim oldest on overflow

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType =
  | "feed_visit"
  | "alert_expanded"
  | "alert_collapsed"
  | "ai_clicked"

type EngagementEvent = {
  type:        EventType
  ts:          string
  alertId?:    string
  category?:   string
  severity?:   string
  trajectory?: string
  rank?:       number
}

type Store = {
  events:     EngagementEvent[]
  feedVisits: number
  lastVisit:  string
}

// ─── Storage ops ──────────────────────────────────────────────────────────────

function load(): Store {
  if (typeof window === "undefined") return { events: [], feedVisits: 0, lastVisit: "" }
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Store) : { events: [], feedVisits: 0, lastVisit: "" }
  } catch { return { events: [], feedVisits: 0, lastVisit: "" } }
}

function save(store: Store): void {
  if (typeof window === "undefined") return
  try {
    if (store.events.length > MAX_EVT) {
      store.events = store.events.slice(-MAX_EVT)
    }
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch { /* storage full — silently drop */ }
}

function push(event: EngagementEvent): void {
  const store = load()
  store.events.push(event)
  save(store)
}

// ─── Public tracking API ──────────────────────────────────────────────────────

export function trackFeedVisit(): void {
  const store   = load()
  const ts      = new Date().toISOString()
  store.feedVisits = (store.feedVisits ?? 0) + 1
  store.lastVisit  = ts
  store.events.push({ type: "feed_visit", ts })
  save(store)
}

export function trackAlertExpanded(
  alertId:    string,
  category:   string,
  severity:   string,
  trajectory: string,
  rank:       number
): void {
  push({ type: "alert_expanded", ts: new Date().toISOString(), alertId, category, severity, trajectory, rank })
}

export function trackAlertCollapsed(alertId: string): void {
  push({ type: "alert_collapsed", ts: new Date().toISOString(), alertId })
}

export function trackAiClicked(alertId: string, category: string, rank: number): void {
  push({ type: "ai_clicked", ts: new Date().toISOString(), alertId, category, rank })
}

// ─── Summary ──────────────────────────────────────────────────────────────────
// Used for debugging and future product analytics.

export type EngagementSummary = {
  feedVisits:      number
  expandedAlerts:  Record<string, number>   // alertId → expand count
  aiClicks:        Record<string, number>   // alertId → click count
  topCategory:     string | null            // most expanded category type
  expandRate:      number                   // avg expands per visit (0–1 if <1)
}

export function getEngagementSummary(): EngagementSummary {
  const store          = load()
  const expanded:       Record<string, number> = {}
  const aiClicks:       Record<string, number> = {}
  const categoryCount:  Record<string, number> = {}

  for (const e of store.events) {
    if (e.type === "alert_expanded" && e.alertId) {
      expanded[e.alertId] = (expanded[e.alertId] ?? 0) + 1
      if (e.category) categoryCount[e.category] = (categoryCount[e.category] ?? 0) + 1
    }
    if (e.type === "ai_clicked" && e.alertId) {
      aiClicks[e.alertId] = (aiClicks[e.alertId] ?? 0) + 1
    }
  }

  const totalExpands  = Object.values(expanded).reduce((s, n) => s + n, 0)
  const visits        = store.feedVisits || 1
  const topCategory   = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return {
    feedVisits:     store.feedVisits ?? 0,
    expandedAlerts: expanded,
    aiClicks,
    topCategory,
    expandRate:     Math.round((totalExpands / visits) * 100) / 100,
  }
}
