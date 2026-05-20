// ─── "What changed since yesterday?" ─────────────────────────────────────────
// Significance-filtered delta engine.
// Tiny fluctuations are ignored. Only movement that materially changes
// business risk surfaces as a change. States track momentum, not snapshots.

import type { SKU } from "./types"

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeltaType =
  | "stockout_worsening"
  | "margin_drop"
  | "acos_spike"
  | "return_spike"
  | "profit_drop"
  | "margin_improving"
  | "acos_improving"
  | "stockout_improving"

// "new"        — problem didn't exist in baseline; now present
// "escalating" — problem existed; now materially worse
// "stable"     — ongoing issue; no material change
// "recovered"  — was a problem; now back in healthy range
export type DeltaState = "new" | "escalating" | "stable" | "recovered"

export type DeltaChange = {
  skuId: string
  skuName: string
  type: DeltaType
  severity: "critical" | "high" | "medium"
  state: DeltaState
  accelerating: boolean   // rate of deterioration is itself increasing
  confidence: number      // 0–100: how certain we are this is a real signal
  headline: string
  detail: string
  previousValue: number
  currentValue: number
  delta: number           // current − previous (negative = worsening for most types)
}

// ─── Significance thresholds ─────────────────────────────────────────────────
// Below these, the change is considered noise and filtered out.

const THRESHOLDS = {
  stockoutDays:   2,    // must change by ≥2 days AND remain <45 days
  marginPct:      2.0,  // must drop ≥2 percentage points
  acosPct:        5,    // must increase ≥5 percentage points
  returnRatePct:  2,    // must increase ≥2 percentage points
  profitDollars:  150,  // must drop ≥$150/mo
}

// ─── localStorage snapshot ────────────────────────────────────────────────────

const SNAPSHOT_KEY = "sellermentor_prev_snapshot_v1"

type SkuSnapshot = {
  skuId: string
  marginPercent: number
  daysUntilStockout: number
  acosPct: number       // 0–100
  returnRatePct: number // 0–100
  netProfitMonthly: number
}

type Snapshot = {
  savedAt: string
  healthScore?: number  // stored so we can show score delta
  skus: SkuSnapshot[]
}

export function saveSnapshot(skus: SKU[], healthScore?: number): void {
  if (typeof window === "undefined") return
  try {
    const snap: Snapshot = {
      savedAt: new Date().toISOString(),
      healthScore,
      skus: skus.map(s => ({
        skuId: s.id,
        marginPercent: s.marginPercent,
        daysUntilStockout: s.daysUntilStockout,
        acosPct: s.acos * 100,
        returnRatePct: s.returnRate * 100,
        netProfitMonthly: s.netProfitMonthly,
      })),
    }
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snap))
  } catch { /* storage unavailable */ }
}

export function loadSnapshot(): Snapshot | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    return raw ? (JSON.parse(raw) as Snapshot) : null
  } catch { return null }
}

export function clearSnapshot(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(SNAPSHOT_KEY)
}

export function loadYesterdayScore(): number | null {
  return loadSnapshot()?.healthScore ?? null
}

// ─── Demo baseline ────────────────────────────────────────────────────────────
// Represents "yesterday's state". Values are intentionally healthier than
// today to show realistic deterioration across the demo portfolio.

const DEMO_BASELINE: Record<string, SkuSnapshot> = {
  B001: { skuId: "B001", marginPercent: 33.5, daysUntilStockout: 9,   acosPct: 19,   returnRatePct: 3,  netProfitMonthly: 3200 },
  B002: { skuId: "B002", marginPercent: 13.6, daysUntilStockout: 44,  acosPct: 36,   returnRatePct: 4,  netProfitMonthly: 1420 },
  B003: { skuId: "B003", marginPercent: 12.2, daysUntilStockout: 245, acosPct: 30,   returnRatePct: 5,  netProfitMonthly: 240  },
  B004: { skuId: "B004", marginPercent: 35.5, daysUntilStockout: 33,  acosPct: 20.5, returnRatePct: 3,  netProfitMonthly: 4620 },
  B005: { skuId: "B005", marginPercent: 12.3, daysUntilStockout: 32,  acosPct: 24,   returnRatePct: 12, netProfitMonthly: 1140 },
  B006: { skuId: "B006", marginPercent: 0.5,  daysUntilStockout: 34,  acosPct: 47,   returnRatePct: 8,  netProfitMonthly: -30  },
}

// Approximate "yesterday" health score for demo (used to show score delta)
export const DEMO_YESTERDAY_SCORE = 61

// ─── State derivation ─────────────────────────────────────────────────────────

function deriveState(
  prevValue: number,
  currValue: number,
  isWorse: boolean,       // true when higher = worse (ACoS, return rate); false when lower = worse (margin, profit, days)
  prevSeverity: "ok" | "medium" | "high" | "critical",
  currSeverity: "ok" | "medium" | "high" | "critical",
): DeltaState {
  const prevBad = prevSeverity !== "ok"
  const currBad = currSeverity !== "ok"

  if (!prevBad && currBad) return "new"
  if (prevBad && !currBad) return "recovered"
  if (prevBad && currBad && currSeverity !== prevSeverity) return "escalating"
  return "stable"
}

function stockoutSeverity(days: number, leadTime: number): "ok" | "medium" | "high" | "critical" {
  if (days < leadTime) return "critical"
  if (days < leadTime + 14) return "high"
  if (days < leadTime + 30) return "medium"
  return "ok"
}

function marginSeverity(m: number): "ok" | "medium" | "high" | "critical" {
  if (m < 0) return "critical"
  if (m < 12) return "high"
  if (m < 18) return "medium"
  return "ok"
}

function acosSeverity(a: number): "ok" | "medium" | "high" | "critical" {
  if (a >= 50) return "critical"
  if (a >= 35) return "high"
  if (a >= 25) return "medium"
  return "ok"
}

function returnSeverity(r: number): "ok" | "medium" | "high" | "critical" {
  if (r >= 15) return "high"
  if (r >= 8) return "medium"
  return "ok"
}

// ─── Compute deltas ───────────────────────────────────────────────────────────

export function computeDeltas(currentSkus: SKU[], isDemo: boolean): DeltaChange[] {
  const changes: DeltaChange[] = []

  for (const sku of currentSkus) {
    if (sku.status !== "active") continue

    const prev: SkuSnapshot | undefined = isDemo
      ? DEMO_BASELINE[sku.id]
      : loadSnapshot()?.skus.find(s => s.skuId === sku.id)

    if (!prev) continue

    const currAcos   = sku.acos * 100
    const currReturn = sku.returnRate * 100

    // ── Stockout worsening ────────────────────────────────────────────────
    const daysDelta = sku.daysUntilStockout - prev.daysUntilStockout
    if (Math.abs(daysDelta) >= THRESHOLDS.stockoutDays && sku.daysUntilStockout < 45) {
      const isWorsening = daysDelta < 0
      if (isWorsening) {
        const prevSev = stockoutSeverity(prev.daysUntilStockout, sku.reorderLeadTimeDays)
        const currSev = stockoutSeverity(sku.daysUntilStockout, sku.reorderLeadTimeDays)
        const state = deriveState(prev.daysUntilStockout, sku.daysUntilStockout, false, prevSev, currSev)
        changes.push({
          skuId: sku.id,
          skuName: sku.name,
          type: "stockout_worsening",
          severity: currSev === "critical" ? "critical" : currSev === "high" ? "high" : "medium",
          state,
          accelerating: Math.abs(daysDelta) > 4 && currSev === "critical",
          confidence: 95,
          headline: `Stockout risk ${state === "escalating" ? "escalating" : "worsening"} — ${sku.name}`,
          detail: `${prev.daysUntilStockout}d remaining → ${sku.daysUntilStockout}d (lead time: ${sku.reorderLeadTimeDays}d)`,
          previousValue: prev.daysUntilStockout,
          currentValue: sku.daysUntilStockout,
          delta: daysDelta,
        })
      }
    }

    // ── Margin drop ───────────────────────────────────────────────────────
    const marginDelta = sku.marginPercent - prev.marginPercent
    if (marginDelta <= -THRESHOLDS.marginPct) {
      const prevSev = marginSeverity(prev.marginPercent)
      const currSev = marginSeverity(sku.marginPercent)
      const state = deriveState(prev.marginPercent, sku.marginPercent, false, prevSev, currSev)
      changes.push({
        skuId: sku.id,
        skuName: sku.name,
        type: "margin_drop",
        severity: currSev === "critical" ? "critical" : currSev === "high" ? "high" : "medium",
        state,
        accelerating: marginDelta < -4,
        confidence: 88,
        headline: `Margin dropped ${Math.abs(marginDelta).toFixed(1)}% — ${sku.name}`,
        detail: `${prev.marginPercent.toFixed(1)}% → ${sku.marginPercent.toFixed(1)}%`,
        previousValue: prev.marginPercent,
        currentValue: sku.marginPercent,
        delta: marginDelta,
      })
    }

    // ── ACoS spike ────────────────────────────────────────────────────────
    const acosDelta = currAcos - prev.acosPct
    if (acosDelta >= THRESHOLDS.acosPct) {
      const prevSev = acosSeverity(prev.acosPct)
      const currSev = acosSeverity(currAcos)
      const state = deriveState(prev.acosPct, currAcos, true, prevSev, currSev)
      changes.push({
        skuId: sku.id,
        skuName: sku.name,
        type: "acos_spike",
        severity: currSev === "critical" ? "critical" : "high",
        state,
        accelerating: acosDelta > 10,
        confidence: 85,
        headline: `ACoS ${state === "escalating" ? "escalating" : "spiked"} +${acosDelta.toFixed(0)}% — ${sku.name}`,
        detail: `${prev.acosPct.toFixed(0)}% → ${currAcos.toFixed(0)}% ACoS`,
        previousValue: prev.acosPct,
        currentValue: currAcos,
        delta: acosDelta,
      })
    }

    // ── Return rate spike ─────────────────────────────────────────────────
    const returnDelta = currReturn - prev.returnRatePct
    if (returnDelta >= THRESHOLDS.returnRatePct) {
      const prevSev = returnSeverity(prev.returnRatePct)
      const currSev = returnSeverity(currReturn)
      const state = deriveState(prev.returnRatePct, currReturn, true, prevSev, currSev)
      changes.push({
        skuId: sku.id,
        skuName: sku.name,
        type: "return_spike",
        severity: currReturn >= 15 ? "high" : "medium",
        state,
        accelerating: returnDelta > 5,
        confidence: 82,
        headline: `Return rate ${state === "escalating" ? "escalating" : "up"} +${returnDelta.toFixed(1)}% — ${sku.name}`,
        detail: `${prev.returnRatePct.toFixed(1)}% → ${currReturn.toFixed(1)}% return rate`,
        previousValue: prev.returnRatePct,
        currentValue: currReturn,
        delta: returnDelta,
      })
    }

    // ── Profit drop ───────────────────────────────────────────────────────
    const profitDelta = sku.netProfitMonthly - prev.netProfitMonthly
    // Only surface if not already covered by margin_drop on same SKU
    const alreadyCovered = changes.some(c => c.skuId === sku.id && c.type === "margin_drop")
    if (profitDelta <= -THRESHOLDS.profitDollars && !alreadyCovered) {
      changes.push({
        skuId: sku.id,
        skuName: sku.name,
        type: "profit_drop",
        severity: sku.netProfitMonthly < 0 ? "critical" : "high",
        state: sku.netProfitMonthly < 0 && prev.netProfitMonthly >= 0 ? "new" : "escalating",
        accelerating: profitDelta < -300,
        confidence: 90,
        headline: `Net profit dropped $${Math.abs(profitDelta).toFixed(0)}/mo — ${sku.name}`,
        detail: `${prev.netProfitMonthly < 0 ? "-" : ""}$${Math.abs(prev.netProfitMonthly)} → ${sku.netProfitMonthly < 0 ? "-" : ""}$${Math.abs(sku.netProfitMonthly)}`,
        previousValue: prev.netProfitMonthly,
        currentValue: sku.netProfitMonthly,
        delta: profitDelta,
      })
    }
  }

  // Sort: critical first, then escalating, then new, then high
  const sOrder: Record<string, number> = { critical: 0, high: 1, medium: 2 }
  const stOrder: Record<string, number> = { escalating: 0, new: 1, stable: 2, recovered: 3 }

  return changes
    .sort((a, b) =>
      sOrder[a.severity] - sOrder[b.severity] ||
      stOrder[a.state] - stOrder[b.state]
    )
    .slice(0, 5)   // Never more than 5 changes — signal > noise
}
