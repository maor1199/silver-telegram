// ─── Operational Memory ───────────────────────────────────────────────────────
// Architecture stub for future recurring-pattern detection and AI grounding.
//
// Current state: type definitions + localStorage schema only.
// Nothing is written to storage yet — this module is forward-looking.
//
// Future capabilities (do NOT build yet):
//   - Recurring operational pattern detection across sessions
//   - Weekly deterioration summaries for AI context
//   - Chronic issue explanation ("this has been active for 6 weeks without resolution")
//   - Business behavior learning (which SKUs are volatile vs stable)
//   - AI-assisted pattern labeling ("margin pressure always follows PPC spikes here")
//
// Design principle: AI memory should augment detection, not replace it.
// The deterministic system detects. Memory helps the AI explain patterns.

const KEY = "sellermentor_op_memory_v1"

// ─── Types ────────────────────────────────────────────────────────────────────

/** A named operational pattern observed across multiple sessions. */
export type OperationalPattern = {
  id:           string          // "{skuId}::{category}"
  skuId:        string
  skuName:      string
  category:     string
  occurrences:  number          // how many sessions this issue has appeared
  firstSeenAt:  string          // ISO timestamp of first detection
  lastSeenAt:   string          // ISO timestamp of most recent detection
  severityHistory: string[]     // e.g. ["medium","high","critical"] — shows escalation
  resolved:     boolean
  resolvedAt:   string | null
}

/** A recurring issue surfaced for AI reasoning context. */
export type RecurringIssue = {
  pattern:   OperationalPattern
  priority:  "watch" | "flag" | "escalate"
  /** AI-surfaced insight — only populated when pattern is strong enough. Null = not yet. */
  insight:   string | null
}

/** Weekly behavior summary — will be AI-generated from pattern data. */
export type WeeklyBriefing = {
  generatedAt:      string
  portfolioTrend:   "improving" | "stable" | "deteriorating"
  recurringIssues:  number
  newIssues:        number
  resolvedIssues:   number
  /** Human-readable narrative for AI context grounding. */
  summary:          string | null
}

// ─── Storage schema (not yet written to) ──────────────────────────────────────

type MemoryStore = {
  patterns:  OperationalPattern[]
  briefings: WeeklyBriefing[]
  schemaVersion: number
}

// ─── Stub API (returns empty / null — not yet implemented) ────────────────────

/**
 * Returns recurring operational patterns across sessions.
 * Stub — will aggregate persistence tracker data into named patterns.
 * @returns empty array until implemented
 */
export function getRecurringIssues(): RecurringIssue[] {
  return []
}

/**
 * Returns the most recent weekly briefing for AI context enrichment.
 * Stub — will be generated from pattern data weekly.
 * @returns null until implemented
 */
export function getWeeklyBriefing(): WeeklyBriefing | null {
  return null
}

/**
 * Returns a plain-text memory context string suitable for prepending to AI system prompt.
 * Stub — will include recurring issue summaries and portfolio behavior patterns.
 * @returns empty string until implemented
 */
export function buildMemoryContext(): string {
  return ""
}

/**
 * Records that an issue was manually resolved by the operator.
 * Stub — will mark the pattern as resolved and record the timestamp.
 */
export function recordResolution(_skuId: string, _category: string): void {
  // not yet implemented
}

// ─── Schema validation ────────────────────────────────────────────────────────
// When implemented, migration logic will live here.

export const MEMORY_SCHEMA_VERSION = 1

export function isMemoryStoreValid(raw: unknown): raw is MemoryStore {
  if (!raw || typeof raw !== "object") return false
  const store = raw as Record<string, unknown>
  return (
    Array.isArray(store.patterns) &&
    Array.isArray(store.briefings) &&
    store.schemaVersion === MEMORY_SCHEMA_VERSION
  )
}
