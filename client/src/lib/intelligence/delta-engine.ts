// ─── "What changed since yesterday?" ─────────────────────────────────────────
// Computes business state deltas between current data and a previous snapshot.
// For demo mode: uses a hardcoded baseline that represents realistic "yesterday" values.
// For live mode: stores and loads a localStorage snapshot.

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

export type DeltaChange = {
  skuId: string
  skuName: string
  type: DeltaType
  severity: "critical" | "high" | "medium"
  headline: string      // e.g. "Stockout risk worsened — Bamboo Cutting Board"
  detail: string        // e.g. "9 days remaining → 6 days (lead time: 28d)"
  previousValue: number
  currentValue: number
  delta: number         // current - previous (negative = worsening for most types)
}

// ─── localStorage snapshot ────────────────────────────────────────────────────

const SNAPSHOT_KEY = "sellermentor_prev_snapshot_v1"

type SkuSnapshot = {
  skuId: string
  marginPercent: number
  daysUntilStockout: number
  acosPct: number       // stored as 0-100
  returnRatePct: number // stored as 0-100
  netProfitMonthly: number
}

type Snapshot = {
  savedAt: string
  skus: SkuSnapshot[]
}

export function saveSnapshot(skus: SKU[]): void {
  if (typeof window === "undefined") return
  try {
    const snap: Snapshot = {
      savedAt: new Date().toISOString(),
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

// ─── Demo baseline — simulated "yesterday" values ─────────────────────────────
// Each value is intentionally better than current to show realistic deterioration.

const DEMO_BASELINE: Record<string, SkuSnapshot> = {
  // B001 Bamboo Cutting Board: was 9 days remaining (now 6 — stockout accelerating)
  B001: { skuId: "B001", marginPercent: 33.5, daysUntilStockout: 9,  acosPct: 19, returnRatePct: 3,  netProfitMonthly: 3200 },
  // B002 Silicone Spatula: ACoS climbed from 36% → 42%, margin eroded 13.6% → 10.8%
  B002: { skuId: "B002", marginPercent: 13.6, daysUntilStockout: 44, acosPct: 36, returnRatePct: 4,  netProfitMonthly: 1420 },
  // B003 Foam Roller: marginal change, no notable delta
  B003: { skuId: "B003", marginPercent: 12.2, daysUntilStockout: 245, acosPct: 30, returnRatePct: 5, netProfitMonthly: 240 },
  // B004 LED Desk Lamp: slight margin compression 35.5% → 33.0%
  B004: { skuId: "B004", marginPercent: 35.5, daysUntilStockout: 33, acosPct: 20.5, returnRatePct: 3, netProfitMonthly: 4620 },
  // B005 Yoga Mat: return rate jumped 12% → 16%, margin eroded
  B005: { skuId: "B005", marginPercent: 12.3, daysUntilStockout: 32, acosPct: 24, returnRatePct: 12, netProfitMonthly: 1140 },
  // B006 Coffee Grinder: ACoS 47% → 53%, monthly profit -$30 → -$270
  B006: { skuId: "B006", marginPercent: 0.5,  daysUntilStockout: 34, acosPct: 47, returnRatePct: 8,  netProfitMonthly: -30 },
}

// ─── Compute deltas ───────────────────────────────────────────────────────────

export function computeDeltas(currentSkus: SKU[], isDemo: boolean): DeltaChange[] {
  const changes: DeltaChange[] = []

  for (const sku of currentSkus) {
    if (sku.status !== "active") continue

    let prev: SkuSnapshot | undefined

    if (isDemo) {
      prev = DEMO_BASELINE[sku.id]
    } else {
      const snap = loadSnapshot()
      prev = snap?.skus.find(s => s.skuId === sku.id)
    }

    if (!prev) continue

    const currAcos = sku.acos * 100
    const currReturn = sku.returnRate * 100

    // ── Stockout worsening ────────────────────────────────────────────────────
    const daysDelta = sku.daysUntilStockout - prev.daysUntilStockout
    if (daysDelta < -1 && sku.daysUntilStockout < 45) {
      changes.push({
        skuId: sku.id,
        skuName: sku.name,
        type: "stockout_worsening",
        severity: sku.daysUntilStockout < sku.reorderLeadTimeDays ? "critical" : "high",
        headline: `Stockout risk worsening — ${sku.name}`,
        detail: `${prev.daysUntilStockout}d remaining → ${sku.daysUntilStockout}d (lead time: ${sku.reorderLeadTimeDays}d)`,
        previousValue: prev.daysUntilStockout,
        currentValue: sku.daysUntilStockout,
        delta: daysDelta,
      })
    }

    // ── Margin drop (>2% absolute) ────────────────────────────────────────────
    const marginDelta = sku.marginPercent - prev.marginPercent
    if (marginDelta < -2) {
      changes.push({
        skuId: sku.id,
        skuName: sku.name,
        type: "margin_drop",
        severity: sku.marginPercent < 0 ? "critical" : sku.marginPercent < 12 ? "high" : "medium",
        headline: `Margin down ${Math.abs(marginDelta).toFixed(1)}% — ${sku.name}`,
        detail: `${prev.marginPercent.toFixed(1)}% → ${sku.marginPercent.toFixed(1)}%`,
        previousValue: prev.marginPercent,
        currentValue: sku.marginPercent,
        delta: marginDelta,
      })
    }

    // ── ACoS spike (>5% increase) ─────────────────────────────────────────────
    const acosDelta = currAcos - prev.acosPct
    if (acosDelta > 5) {
      changes.push({
        skuId: sku.id,
        skuName: sku.name,
        type: "acos_spike",
        severity: currAcos >= 50 ? "critical" : "high",
        headline: `ACoS spiked +${acosDelta.toFixed(0)}% — ${sku.name}`,
        detail: `${prev.acosPct.toFixed(0)}% → ${currAcos.toFixed(0)}% ACoS`,
        previousValue: prev.acosPct,
        currentValue: currAcos,
        delta: acosDelta,
      })
    }

    // ── Return rate spike (>2% increase) ─────────────────────────────────────
    const returnDelta = currReturn - prev.returnRatePct
    if (returnDelta > 2) {
      changes.push({
        skuId: sku.id,
        skuName: sku.name,
        type: "return_spike",
        severity: currReturn >= 15 ? "high" : "medium",
        headline: `Return rate up +${returnDelta.toFixed(1)}% — ${sku.name}`,
        detail: `${prev.returnRatePct.toFixed(1)}% → ${currReturn.toFixed(1)}% return rate`,
        previousValue: prev.returnRatePct,
        currentValue: currReturn,
        delta: returnDelta,
      })
    }

    // ── Profit drop (>$150/mo) ────────────────────────────────────────────────
    const profitDelta = sku.netProfitMonthly - prev.netProfitMonthly
    if (profitDelta < -150) {
      // Skip if already covered by margin_drop for same SKU
      const alreadyCovered = changes.some(c => c.skuId === sku.id && c.type === "margin_drop")
      if (!alreadyCovered) {
        changes.push({
          skuId: sku.id,
          skuName: sku.name,
          type: "profit_drop",
          severity: sku.netProfitMonthly < 0 ? "critical" : "high",
          headline: `Net profit dropped $${Math.abs(profitDelta).toFixed(0)}/mo — ${sku.name}`,
          detail: `${prev.netProfitMonthly < 0 ? "-$" : "$"}${Math.abs(prev.netProfitMonthly)} → ${sku.netProfitMonthly < 0 ? "-$" : "$"}${Math.abs(sku.netProfitMonthly)}`,
          previousValue: prev.netProfitMonthly,
          currentValue: sku.netProfitMonthly,
          delta: profitDelta,
        })
      }
    }
  }

  // Sort by severity, take top 5
  const order: Record<string, number> = { critical: 0, high: 1, medium: 2 }
  return changes
    .sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3))
    .slice(0, 5)
}
