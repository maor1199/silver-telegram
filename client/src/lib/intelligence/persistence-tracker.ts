// ─── Issue Persistence Tracker ────────────────────────────────────────────────
// Distinguishes: temporary fluctuation / recurring issue / chronic problem.
// "Margin-negative for 9 sessions" is more actionable than "Margin alert detected."
//
// Writes to localStorage in live mode.
// Returns pre-seeded demo data in demo mode so the product feels real.

import type { RiskAlert } from "./types"

const PERSISTENCE_KEY = "sellermentor_persistence_v1"

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertRecord = {
  key: string
  firstSeenAt: string
  lastSeenAt: string
  sessionCount: number
  lastSeverity: string
}

type PersistenceStore = Record<string, AlertRecord>

// ─── Demo baseline ────────────────────────────────────────────────────────────
// Pre-seeded to make the product feel real and the persistence labels meaningful.
// Reflects realistic "how long has this been going on" stories per SKU.

const DEMO_PERSISTENCE: PersistenceStore = {
  "B001-stockout": {
    key: "B001-stockout",
    firstSeenAt: daysAgo(3),
    lastSeenAt:  now(),
    sessionCount: 3,
    lastSeverity: "critical",
  },
  "B002-ppc_pressure": {
    key: "B002-ppc_pressure",
    firstSeenAt: daysAgo(5),
    lastSeenAt:  now(),
    sessionCount: 5,
    lastSeverity: "high",
  },
  "B003-dead_inventory": {
    key: "B003-dead_inventory",
    firstSeenAt: daysAgo(14),
    lastSeenAt:  now(),
    sessionCount: 12,
    lastSeverity: "high",
  },
  "B005-return_rate": {
    key: "B005-return_rate",
    firstSeenAt: daysAgo(21),
    lastSeenAt:  now(),
    sessionCount: 7,
    lastSeverity: "high",
  },
  "B005-margin_erosion": {
    key: "B005-margin_erosion",
    firstSeenAt: daysAgo(10),
    lastSeenAt:  now(),
    sessionCount: 4,
    lastSeverity: "high",
  },
  "B006-negative_margin": {
    key: "B006-negative_margin",
    firstSeenAt: daysAgo(9),
    lastSeenAt:  now(),
    sessionCount: 9,
    lastSeverity: "critical",
  },
  "B006-ppc_pressure": {
    key: "B006-ppc_pressure",
    firstSeenAt: daysAgo(11),
    lastSeenAt:  now(),
    sessionCount: 11,
    lastSeverity: "critical",
  },
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400_000).toISOString()
}
function now(): string {
  return new Date().toISOString()
}

// ─── localStorage ops ─────────────────────────────────────────────────────────

function loadStore(): PersistenceStore {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(PERSISTENCE_KEY)
    return raw ? (JSON.parse(raw) as PersistenceStore) : {}
  } catch { return {} }
}

function saveStore(store: PersistenceStore): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(store))
  } catch { /* storage unavailable */ }
}

// ─── Update persistence per session ──────────────────────────────────────────
// Called once per session load. Records each active alert.
// Resolved alerts are removed (no longer present = no longer tracked).

export function updatePersistence(alerts: RiskAlert[], isDemo: boolean): Map<string, AlertRecord> {
  if (isDemo) {
    return new Map(Object.entries(DEMO_PERSISTENCE))
  }

  const store = loadStore()
  const ts = now()
  const activeKeys = new Set<string>()

  for (const alert of alerts) {
    const key = alertKey(alert)
    activeKeys.add(key)
    if (store[key]) {
      store[key].sessionCount++
      store[key].lastSeenAt  = ts
      store[key].lastSeverity = alert.severity
    } else {
      store[key] = { key, firstSeenAt: ts, lastSeenAt: ts, sessionCount: 1, lastSeverity: alert.severity }
    }
  }

  // Remove resolved alerts
  for (const key of Object.keys(store)) {
    if (!activeKeys.has(key)) delete store[key]
  }

  saveStore(store)
  return new Map(Object.entries(store))
}

// ─── Display helpers ──────────────────────────────────────────────────────────

// Returns null for session 1 (too early to draw conclusions).
// Labels escalate: Ongoing → Recurring → Persistent → Chronic
export function persistenceLabel(record: AlertRecord | undefined): string | null {
  if (!record) return null
  const n = record.sessionCount
  if (n <= 1)  return null
  if (n <= 3)  return `Ongoing — ${n} sessions`
  if (n <= 6)  return `Recurring — ${n} sessions`
  if (n <= 11) return `Persistent — ${n} sessions`
  return `Chronic — ${n} sessions`
}

export function persistenceColorClass(record: AlertRecord | undefined): string {
  if (!record) return "text-muted-foreground"
  const n = record.sessionCount
  if (n <= 3)  return "text-muted-foreground"
  if (n <= 6)  return "text-orange-600"
  return "text-red-600"
}

// Canonical key for an alert in persistence store
export function alertKey(alert: { skuId: string; type: string }): string {
  return `${alert.skuId}-${alert.type}`
}
