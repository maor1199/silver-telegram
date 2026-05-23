// ─── Engagement Tracker ───────────────────────────────────────────────────────
// Lightweight localStorage instrumentation.
// Answers: which alerts feel valuable? Which get ignored? Do users understand?
// No server, no external analytics — privacy-first, zero latency.

const KEY     = "sellermentor_engagement_v1"
const MAX_EVT = 1000

// ─── Types ────────────────────────────────────────────────────────────────────

export type FeedbackValue = "useful" | "not_useful" | "too_obvious" | "not_accurate"
export type SurveyValue   = "yes" | "somewhat" | "no"

type EventType =
  | "feed_visit"
  | "feed_rendered"
  | "alert_expanded"
  | "alert_collapsed"
  | "ai_clicked"
  | "feedback"
  | "session_survey"

export type EngagementEvent = {
  type:           EventType
  ts:             string
  alertId?:       string
  category?:      string
  categories?:    string        // comma-separated (feed_rendered)
  severity?:      string
  trajectory?:    string
  rank?:          number
  feedbackValue?: FeedbackValue
  surveyValue?:   SurveyValue
}

type Store = {
  events:     EngagementEvent[]
  feedVisits: number
  lastVisit:  string
}

// ─── Storage ──────────────────────────────────────────────────────────────────

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

// ─── Tracking API ─────────────────────────────────────────────────────────────

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
  push({ type: "feed_rendered", ts: new Date().toISOString(), categories: items.map(i => i.category).join(",") })
}

export function trackAlertExpanded(
  alertId: string, category: string, severity: string, trajectory: string, rank: number
): void {
  push({ type: "alert_expanded", ts: new Date().toISOString(), alertId, category, severity, trajectory, rank })
}

export function trackAlertCollapsed(alertId: string): void {
  push({ type: "alert_collapsed", ts: new Date().toISOString(), alertId })
}

export function trackAiClicked(alertId: string, category: string, rank: number): void {
  push({ type: "ai_clicked", ts: new Date().toISOString(), alertId, category, rank })
}

export function trackFeedback(alertId: string, category: string, value: FeedbackValue): void {
  push({ type: "feedback", ts: new Date().toISOString(), alertId, category, feedbackValue: value })
}

export function trackSessionSurvey(value: SurveyValue): void {
  push({ type: "session_survey", ts: new Date().toISOString(), surveyValue: value })
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export type EngagementSummary = {
  feedVisits:           number
  totalExpands:         number
  expandRate:           number
  totalAiClicks:        number
  aiClickRate:          number
  topAlertByEngagement: string | null
  avgRankExpanded:      number
  categoryExpands:      Record<string, number>
  categoryRenders:      Record<string, number>
  mostExpandedCategory: string | null
  mostIgnoredCategory:  string | null
  feedbackCounts:       Record<FeedbackValue, number>
  surveyCounts:         Record<SurveyValue,   number>
  expandedAlerts:       Record<string, number>
  aiClicks:             Record<string, number>
}

export function getEngagementSummary(): EngagementSummary {
  const store = load()

  const expandedAlerts:  Record<string, number> = {}
  const aiClicks:        Record<string, number> = {}
  const categoryExpands: Record<string, number> = {}
  const categoryRenders: Record<string, number> = {}
  const feedbackCounts:  Record<FeedbackValue, number> = { useful: 0, not_useful: 0, too_obvious: 0, not_accurate: 0 }
  const surveyCounts:    Record<SurveyValue,   number> = { yes: 0, somewhat: 0, no: 0 }

  let totalExpands = 0, totalAiClicks = 0, rankSum = 0, rankCount = 0

  for (const e of store.events) {
    switch (e.type) {
      case "feed_rendered":
        e.categories?.split(",").forEach(cat => {
          if (cat) categoryRenders[cat] = (categoryRenders[cat] ?? 0) + 1
        })
        break
      case "alert_expanded":
        if (e.alertId) { expandedAlerts[e.alertId] = (expandedAlerts[e.alertId] ?? 0) + 1; totalExpands++ }
        if (e.category) categoryExpands[e.category] = (categoryExpands[e.category] ?? 0) + 1
        if (e.rank != null) { rankSum += e.rank; rankCount++ }
        break
      case "ai_clicked":
        if (e.alertId) { aiClicks[e.alertId] = (aiClicks[e.alertId] ?? 0) + 1; totalAiClicks++ }
        break
      case "feedback":
        if (e.feedbackValue && e.feedbackValue in feedbackCounts) feedbackCounts[e.feedbackValue]++
        break
      case "session_survey":
        if (e.surveyValue && e.surveyValue in surveyCounts) surveyCounts[e.surveyValue]++
        break
    }
  }

  const visits = Math.max(store.feedVisits || 1, 1)

  let topAlert: string | null = null, topScore = 0
  for (const id of new Set([...Object.keys(expandedAlerts), ...Object.keys(aiClicks)])) {
    const score = (expandedAlerts[id] ?? 0) * 2 + (aiClicks[id] ?? 0) * 3
    if (score > topScore) { topScore = score; topAlert = id }
  }

  let mostIgnored: string | null = null, worstIgnoreRate = -1
  for (const [cat, renders] of Object.entries(categoryRenders)) {
    if (renders < 2) continue
    const rate = 1 - ((categoryExpands[cat] ?? 0) / renders)
    if (rate > worstIgnoreRate) { worstIgnoreRate = rate; mostIgnored = cat }
  }

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
    mostExpandedCategory: Object.entries(categoryExpands).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    mostIgnoredCategory:  mostIgnored,
    feedbackCounts,
    surveyCounts,
    expandedAlerts,
    aiClicks,
  }
}

export function getRecentEvents(n = 10): EngagementEvent[] {
  return [...load().events].reverse().slice(0, n)
}

// ─── Session Replay ───────────────────────────────────────────────────────────
// Derived from existing events — no extra tracking needed.
// Answers: "what did this seller actually engage with?"

export type SessionReplay = {
  firstExpandCategory:    string | null   // category of first expanded alert
  firstExpandAt:          string | null   // ISO timestamp
  firstAiClickAt:         string | null
  timeToFirstAiClickMs:   number | null   // ms from first expand to first AI click
  mostEngagedAlertId:     string | null   // alertId with most expand+ai interactions
  ignoredCategories:      string[]        // rendered but never expanded
  aiClickCount:           number
  feedbackCount:          number
  sessionCount:           number          // total feed visits
  projectedImpactViews:   number          // inferred: alerts expanded where category signals a projection exists
}

export function getSessionReplay(): SessionReplay {
  const store = load()
  const events = store.events

  let firstExpandAt:       string | null = null
  let firstExpandCategory: string | null = null
  let firstAiClickAt:      string | null = null

  const expandsByAlert:   Record<string, number> = {}
  const aiClicksByAlert:  Record<string, number> = {}
  const expandedCategories = new Set<string>()
  const renderedCategories = new Set<string>()
  let feedbackCount = 0
  let projectedImpactViews = 0

  // Categories where projectedImpact is likely shown (based on priority-feed confidence rules)
  const PROJECTION_CATEGORIES = new Set(["stockout", "margin", "ppc", "returns", "overstock"])

  for (const e of events) {
    switch (e.type) {
      case "feed_rendered":
        e.categories?.split(",").forEach(c => { if (c) renderedCategories.add(c) })
        break
      case "alert_expanded":
        if (!firstExpandAt && e.alertId) {
          firstExpandAt       = e.ts
          firstExpandCategory = e.category ?? null
        }
        if (e.alertId) {
          expandsByAlert[e.alertId] = (expandsByAlert[e.alertId] ?? 0) + 1
        }
        if (e.category) {
          expandedCategories.add(e.category)
          if (PROJECTION_CATEGORIES.has(e.category)) projectedImpactViews++
        }
        break
      case "ai_clicked":
        if (!firstAiClickAt) firstAiClickAt = e.ts
        if (e.alertId) aiClicksByAlert[e.alertId] = (aiClicksByAlert[e.alertId] ?? 0) + 1
        break
      case "feedback":
        feedbackCount++
        break
    }
  }

  // Most engaged alert (expands × 2 + ai clicks × 3)
  let mostEngaged: string | null = null
  let topScore = 0
  for (const id of new Set([...Object.keys(expandsByAlert), ...Object.keys(aiClicksByAlert)])) {
    const score = (expandsByAlert[id] ?? 0) * 2 + (aiClicksByAlert[id] ?? 0) * 3
    if (score > topScore) { topScore = score; mostEngaged = id }
  }

  const ignoredCategories = [...renderedCategories].filter(c => !expandedCategories.has(c))

  const timeToFirstAiClickMs =
    firstExpandAt && firstAiClickAt
      ? new Date(firstAiClickAt).getTime() - new Date(firstExpandAt).getTime()
      : null

  return {
    firstExpandCategory,
    firstExpandAt,
    firstAiClickAt,
    timeToFirstAiClickMs,
    mostEngagedAlertId:   mostEngaged,
    ignoredCategories,
    aiClickCount:         Object.values(aiClicksByAlert).reduce((a, b) => a + b, 0),
    feedbackCount,
    sessionCount:         store.feedVisits ?? 0,
    projectedImpactViews,
  }
}

// ─── Reset ────────────────────────────────────────────────────────────────────

export function resetEngagement(): void {
  if (typeof window === "undefined") return
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}

/** Clear ALL SellerMentor localStorage — full demo session reset. */
export function resetDemoSession(): void {
  if (typeof window === "undefined") return
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith("sellermentor_"))
      .forEach(k => localStorage.removeItem(k))
  } catch { /* ignore */ }
}
