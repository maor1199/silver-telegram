// ─── Engagement Tracker ───────────────────────────────────────────────────────
// Lightweight localStorage instrumentation.
// Answers: which alerts feel operationally valuable? Which get ignored?
// No server, no external analytics — privacy-first, zero latency.

const KEY     = "sellermentor_engagement_v1"
const MAX_EVT = 1000   // keep store bounded

// ─── Types ────────────────────────────────────────────────────────────────────

export type FeedbackValue = "useful" | "not_useful" | "too_obvious" | "not_accurate"

type EventType =
  | "feed_visit"
  | "feed_rendered"   // what categories were shown in the feed
  | "alert_expanded"
  | "alert_collapsed"
  | "ai_clicked"
  | "feedback"

export type EngagementEvent = {
  type:           EventType
  ts:             string
  alertId?:       string
  category?:      string
  categories?:    string        // comma-separated, for feed_rendered
  severity?:      string
  trajectory?:    string
  rank?:          number
  feedbackValue?: FeedbackValue
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
    if (store.events.length > MAX_EVT) store.events = store.events.slice(-MAX_EVT)
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch { /* storage full */ }
}

function push(event: EngagementEvent): void {
  const store = load()
  store.events.push(event)
  save(store)
}

// ─── Public tracking API ──────────────────────────────────────────────────────

export function trackFeedVisit(): void {
  const store = load()
  const ts    = new Date().toISOString()
  store.feedVisits = (store.feedVisits ?? 0) + 1
  store.lastVisit  = ts
  store.events.push({ type: "feed_visit", ts })
  save(store)
}

export function trackFeedRendered(
  items: Array<{ alertId: string; category: string; severity: string }>
): void {
  if (items.length === 0) return
  push({
    type:       "feed_rendered",
    ts:         new Date().toISOString(),
    categories: items.map(i => i.category).join(","),
  })
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

export function trackFeedback(
  alertId:  string,
  category: string,
  value:    FeedbackValue
): void {
  push({ type: "feedback", ts: new Date().toISOString(), alertId, category, feedbackValue: value })
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export type EngagementSummary = {
  feedVisits:           number
  totalExpands:         number
  expandRate:           number              // expands per feed visit
  totalAiClicks:        number
  aiClickRate:          number              // AI clicks per feed visit
  topAlertByEngagement: string | null       // alertId with most weighted interactions
  avgRankExpanded:      number              // avg rank position when expanded
  categoryExpands:      Record<string, number>
  categoryRenders:      Record<string, number>
  mostExpandedCategory: string | null
  mostIgnoredCategory:  string | null       // high renders, low expand rate
  feedbackCounts:       Record<FeedbackValue, number>
  expandedAlerts:       Record<string, number>
  aiClicks:             Record<string, number>
}

export function getEngagementSummary(): EngagementSummary {
  const store = load()

  const expandedAlerts:  Record<string, number> = {}
  const aiClicks:        Record<string, number> = {}
  const categoryExpands: Record<string, number> = {}
  const categoryRenders: Record<string, number> = {}
  const feedbackCounts:  Record<FeedbackValue, number> = {
    useful: 0, not_useful: 0, too_obvious: 0, not_accurate: 0,
  }

  let totalExpands  = 0
  let totalAiClicks = 0
  let rankSum       = 0
  let rankCount     = 0

  for (const e of store.events) {
    switch (e.type) {
      case "feed_rendered":
        if (e.categories) {
          e.categories.split(",").forEach(cat => {
            if (cat) categoryRenders[cat] = (categoryRenders[cat] ?? 0) + 1
          })
        }
        break
      case "alert_expanded":
        if (e.alertId) {
          expandedAlerts[e.alertId] = (expandedAlerts[e.alertId] ?? 0) + 1
          totalExpands++
        }
        if (e.category) categoryExpands[e.category] = (categoryExpands[e.category] ?? 0) + 1
        if (e.rank != null) { rankSum += e.rank; rankCount++ }
        break
      case "ai_clicked":
        if (e.alertId) {
          aiClicks[e.alertId] = (aiClicks[e.alertId] ?? 0) + 1
          totalAiClicks++
        }
        break
      case "feedback":
        if (e.feedbackValue && e.feedbackValue in feedbackCounts) {
          feedbackCounts[e.feedbackValue]++
        }
        break
    }
  }

  const visits = Math.max(store.feedVisits || 1, 1)

  // Top alert: weight AI clicks (intent) higher than expansions (curiosity)
  const allIds = new Set([...Object.keys(expandedAlerts), ...Object.keys(aiClicks)])
  let topAlert: string | null = null
  let topScore = 0
  for (const id of allIds) {
    const score = (expandedAlerts[id] ?? 0) * 2 + (aiClicks[id] ?? 0) * 3
    if (score > topScore) { topScore = score; topAlert = id }
  }

  // Most ignored: highest render count with lowest expand rate
  let mostIgnored: string | null = null
  let worstIgnoreRate = -1
  for (const [cat, renders] of Object.entries(categoryRenders)) {
    if (renders < 2) continue
    const ignoreRate = 1 - ((categoryExpands[cat] ?? 0) / renders)
    if (ignoreRate > worstIgnoreRate) { worstIgnoreRate = ignoreRate; mostIgnored = cat }
  }

  const mostExpanded = Object.entries(categoryExpands).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return {
    feedVisits:           store.feedVisits ?? 0,
    totalExpands,
    expandRate:           Math.round((totalExpands / visits) * 100) / 100,
    totalAiClicks,
    aiClickRate:          Math.round((totalAiClicks / visits) * 100) / 100,
    topAlertByEngagement: topAlert,
    avgRankExpanded:      rankCount > 0 ? Math.round((rankSum / rankCount) * 10) / 10 : 0,
    categoryExpands,
    categoryRenders,
    mostExpandedCategory: mostExpanded,
    mostIgnoredCategory:  mostIgnored,
    feedbackCounts,
    expandedAlerts,
    aiClicks,
  }
}

export function getRecentEvents(n = 10): EngagementEvent[] {
  return [...load().events].reverse().slice(0, n)
}

// ─── Reset ────────────────────────────────────────────────────────────────────

export function resetEngagement(): void {
  if (typeof window === "undefined") return
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}

/** Clear all SellerMentor localStorage — full demo session reset. */
export function resetDemoSession(): void {
  if (typeof window === "undefined") return
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("sellermentor_"))
    keys.forEach(k => localStorage.removeItem(k))
  } catch { /* ignore */ }
}
