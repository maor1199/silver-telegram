// ─── Daily Check-In Brief ─────────────────────────────────────────────────────
// Answers: "what changed since your last visit?"
// Compares the current priority feed against a stored previous-session snapshot.
// Goal: make the system feel alive and aware of business movement.
// All state is local — no server required.

import type { PriorityItem } from "./priority-feed"

// ─── Types ────────────────────────────────────────────────────────────────────

const FEED_SNAPSHOT_KEY = "sellermentor_feed_snapshot_v1"

type FeedItemSnapshot = {
  skuId:      string
  skuName:    string
  category:   string
  severity:   string
  trajectory: string
  alertId:    string
}

type FeedSnapshot = {
  savedAt: string
  items:   FeedItemSnapshot[]
}

export type DailyBriefTone = "neutral" | "positive" | "warning" | "critical"

export type DailyBrief = {
  message:         string
  tone:            DailyBriefTone
  newCount:        number
  resolvedCount:   number
  worsenedCount:   number
  stabilizedCount: number
  isFirstVisit:    boolean
}

// ─── Demo baseline ────────────────────────────────────────────────────────────
// Represents "last visit" state for demo mode.
// B001 stockout was "high" — now it's "critical" → worsened.
// B005 margin-erosion not yet in feed → will appear as "new" this visit.

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString()
}

const DEMO_PREVIOUS_SNAPSHOT: FeedSnapshot = {
  savedAt: daysAgo(1),
  items: [
    {
      alertId:    "stockout-high-B001",
      skuId:      "B001",
      skuName:    "Bamboo Cutting Board Set (3-Pack)",
      category:   "stockout",
      severity:   "high",
      trajectory: "deteriorating",
    },
    {
      alertId:    "margin-neg-B006",
      skuId:      "B006",
      skuName:    "Electric Coffee Grinder Burr 40-Setting",
      category:   "margin",
      severity:   "critical",
      trajectory: "accelerating",
    },
    {
      alertId:    "ppc-crit-B006",
      skuId:      "B006",
      skuName:    "Electric Coffee Grinder Burr 40-Setting",
      category:   "ppc",
      severity:   "critical",
      trajectory: "accelerating",
    },
    {
      alertId:    "ppc-high-B002",
      skuId:      "B002",
      skuName:    "Silicone Kitchen Spatula Set (5-Piece)",
      category:   "ppc",
      severity:   "high",
      trajectory: "deteriorating",
    },
    {
      alertId:    "returns-B005",
      skuId:      "B005",
      skuName:    "Premium Non-Slip Yoga Mat 6mm",
      category:   "returns",
      severity:   "high",
      trajectory: "deteriorating",
    },
  ],
}

// ─── Storage ──────────────────────────────────────────────────────────────────

function loadSnapshot(): FeedSnapshot | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(FEED_SNAPSHOT_KEY)
    return raw ? (JSON.parse(raw) as FeedSnapshot) : null
  } catch { return null }
}

export function saveFeedSnapshot(feed: PriorityItem[]): void {
  if (typeof window === "undefined") return
  try {
    const snap: FeedSnapshot = {
      savedAt: new Date().toISOString(),
      items: feed.map(item => ({
        alertId:    item.alertId,
        skuId:      item.skuId,
        skuName:    item.skuName,
        category:   item.category,
        severity:   item.severity,
        trajectory: item.trajectory,
      })),
    }
    localStorage.setItem(FEED_SNAPSHOT_KEY, JSON.stringify(snap))
  } catch { /* storage unavailable */ }
}

// ─── Severity ranking ─────────────────────────────────────────────────────────

const SEV_RANK: Record<string, number> = { critical: 2, high: 1, medium: 0 }
const TRAJ_DANGER: Record<string, number> = { accelerating: 3, deteriorating: 2, stabilizing: 1, recovering: 0 }

// ─── Build daily brief ────────────────────────────────────────────────────────

export function buildDailyBrief(
  currentFeed: PriorityItem[],
  isDemo:      boolean,
): DailyBrief {
  // Load previous snapshot
  const previous: FeedSnapshot | null = isDemo
    ? loadSnapshot() ?? DEMO_PREVIOUS_SNAPSHOT
    : loadSnapshot()

  // First visit — no previous data
  if (!previous) {
    return {
      message: "",
      tone: "neutral",
      newCount: 0, resolvedCount: 0, worsenedCount: 0, stabilizedCount: 0,
      isFirstVisit: true,
    }
  }

  // Index by skuId::category for fast lookup
  const prevIndex = new Map<string, FeedItemSnapshot>()
  for (const item of previous.items) {
    prevIndex.set(`${item.skuId}::${item.category}`, item)
  }

  const currIndex = new Map<string, PriorityItem>()
  for (const item of currentFeed) {
    currIndex.set(`${item.skuId}::${item.category}`, item)
  }

  let newCount = 0, resolvedCount = 0, worsenedCount = 0, stabilizedCount = 0
  const worsenedItems: string[] = []
  const newItems:      string[] = []
  const stabilizedItems: string[] = []
  const resolvedItems: string[] = []

  // Check what worsened or stabilized
  for (const [key, curr] of currIndex.entries()) {
    const prev = prevIndex.get(key)
    if (!prev) {
      // New issue
      newCount++
      newItems.push(`${curr.skuName} (${curr.category})`)
    } else {
      const sevWorsened   = SEV_RANK[curr.severity]   > SEV_RANK[prev.severity]
      const trajWorsened  = TRAJ_DANGER[curr.trajectory] > TRAJ_DANGER[prev.trajectory]
      const trajImproved  = TRAJ_DANGER[curr.trajectory] < TRAJ_DANGER[prev.trajectory]

      if (sevWorsened || (trajWorsened && !sevWorsened)) {
        worsenedCount++
        const sevChange = sevWorsened ? ` escalated to ${curr.severity}` : " worsening"
        worsenedItems.push(`${curr.skuName}${sevChange}`)
      } else if (trajImproved) {
        stabilizedCount++
        stabilizedItems.push(curr.skuName)
      }
    }
  }

  // Check what resolved
  for (const [key, prev] of prevIndex.entries()) {
    if (!currIndex.has(key)) {
      resolvedCount++
      resolvedItems.push(`${prev.skuName} ${prev.category}`)
    }
  }

  // ── Compose message ────────────────────────────────────────────────────────

  const parts: string[] = []

  if (worsenedCount > 0) {
    if (worsenedCount === 1) {
      parts.push(`1 issue escalated since your last visit — ${worsenedItems[0]}.`)
    } else {
      parts.push(`${worsenedCount} issues escalated since your last visit.`)
    }
  }

  if (newCount > 0) {
    if (newCount === 1) {
      parts.push(`1 new issue detected — ${newItems[0]}.`)
    } else {
      parts.push(`${newCount} new issues detected.`)
    }
  }

  if (stabilizedCount > 0 && worsenedCount === 0 && newCount === 0) {
    if (stabilizedCount === 1) {
      parts.push(`1 issue stabilised since your last visit — ${stabilizedItems[0]}.`)
    } else {
      parts.push(`${stabilizedCount} issues stabilised since your last visit.`)
    }
  }

  if (resolvedCount > 0) {
    if (resolvedCount === 1) {
      parts.push(`1 issue fell below the significance threshold — ${resolvedItems[0]} no longer requires attention.`)
    } else {
      parts.push(`${resolvedCount} issues resolved or fell below the significance threshold.`)
    }
  }

  if (parts.length === 0) {
    // No material change
    const count = currentFeed.length
    if (count === 0) {
      return {
        message: "No material operational deterioration detected. Operational state holding.",
        tone: "neutral",
        newCount: 0, resolvedCount: 0, worsenedCount: 0, stabilizedCount: 0,
        isFirstVisit: false,
      }
    }
    return {
      message: `Operational state unchanged since your last visit. ${count} issue${count !== 1 ? "s" : ""} remain at the same level.`,
      tone: "neutral",
      newCount: 0, resolvedCount: 0, worsenedCount: 0, stabilizedCount: 0,
      isFirstVisit: false,
    }
  }

  const message = parts.join(" ")

  const tone: DailyBriefTone =
    worsenedCount > 0 && (worsenedItems.some(s => s.includes("critical")) || worsenedCount >= 2)
      ? "critical"
      : worsenedCount > 0 || newCount > 0
      ? "warning"
      : resolvedCount > 0 || stabilizedCount > 0
      ? "positive"
      : "neutral"

  return {
    message,
    tone,
    newCount,
    resolvedCount,
    worsenedCount,
    stabilizedCount,
    isFirstVisit: false,
  }
}

// ─── Visit-time label ─────────────────────────────────────────────────────────

export function sinceLabel(savedAt: string): string {
  const ms   = Date.now() - new Date(savedAt).getTime()
  const hrs  = Math.floor(ms / 3_600_000)
  const mins = Math.floor(ms / 60_000)
  if (hrs >= 20)  return "since yesterday"
  if (hrs >= 1)   return `${hrs}h ago`
  if (mins >= 5)  return `${mins}m ago`
  return "just now"
}
