// ─── Causal Chain Engine ──────────────────────────────────────────────────────
// Connects isolated alerts into operational chains.
// The goal is not a complex graph — just one honest line per alert:
// "this problem is likely caused by X" or "this problem is likely driving Y"
//
// Only asserts chains that are deterministic from the data.
// Never speculates without clear evidence in the numbers.

import type { SKU, RiskAlert, RiskType } from "./types"

// ─── Types ────────────────────────────────────────────────────────────────────

export type CausalContext = {
  causedBy:   string | null   // upstream driver (shown on effect alert)
  impacts:    string | null   // downstream consequence (shown on cause alert)
  chainLabel: string | null   // compact chain: "PPC pressure → net loss"
}

// ─── Known operational chains ─────────────────────────────────────────────────
// [cause type, effect type, cause.impacts text, effect.causedBy text]
// Only chains with direct operational logic are included.

const KNOWN_CHAINS: [RiskType, RiskType, string, string][] = [
  [
    "ppc_pressure", "negative_margin",
    "Ad spend above breakeven is eliminating profit margin",
    "ACoS exceeds breakeven — ad cost alone is driving net loss",
  ],
  [
    "ppc_pressure", "margin_erosion",
    "Rising ad cost reducing net margin toward danger zone",
    "PPC pressure is the primary margin erosion driver",
  ],
  [
    "return_rate", "negative_margin",
    "Return costs compounding the net loss on this SKU",
    "Return costs adding to margin collapse from ad spend",
  ],
  [
    "return_rate", "margin_erosion",
    "Return costs reducing effective margin below safe threshold",
    "High return rate consuming margin alongside PPC pressure",
  ],
  [
    "overstock", "dead_inventory",
    "Declining velocity is accelerating toward a dead stock position",
    "Originated as overstock — velocity trend worsened over time",
  ],
]

// Human-readable labels for chain display
const TYPE_LABELS: Partial<Record<RiskType, string>> = {
  ppc_pressure:    "PPC pressure",
  negative_margin: "net loss",
  margin_erosion:  "margin erosion",
  return_rate:     "high returns",
  overstock:       "overstock",
  dead_inventory:  "dead stock",
  stockout:        "stockout",
}

// ─── Build causal context for all active alerts ───────────────────────────────

export function buildCausalContext(alerts: RiskAlert[], _skus: SKU[]): Map<string, CausalContext> {
  const result = new Map<string, CausalContext>()

  // Index: skuId::type → alertId for fast lookup
  const bySkuType = new Map<string, string>()
  for (const a of alerts) {
    bySkuType.set(`${a.skuId}::${a.type}`, a.id)
  }

  // Count patterns for portfolio-level context
  const negMarginCount   = alerts.filter(a => a.type === "negative_margin").length
  const critStockoutCount = alerts.filter(a => a.type === "stockout" && a.severity === "critical").length

  for (const alert of alerts) {
    const ctx: CausalContext = { causedBy: null, impacts: null, chainLabel: null }

    // ── Intra-SKU chain detection ─────────────────────────────────────────
    for (const [causeType, effectType, causeImpactsText, effectCausedByText] of KNOWN_CHAINS) {
      if (alert.type === causeType) {
        const effectId = bySkuType.get(`${alert.skuId}::${effectType}`)
        if (effectId) {
          ctx.impacts = causeImpactsText
          if (!ctx.chainLabel) {
            ctx.chainLabel = `${TYPE_LABELS[causeType] ?? causeType} → ${TYPE_LABELS[effectType] ?? effectType}`
          }
        }
      }
      if (alert.type === effectType) {
        const causeId = bySkuType.get(`${alert.skuId}::${causeType}`)
        if (causeId) {
          ctx.causedBy = effectCausedByText
          if (!ctx.chainLabel) {
            ctx.chainLabel = `${TYPE_LABELS[causeType] ?? causeType} → ${TYPE_LABELS[effectType] ?? effectType}`
          }
        }
      }
    }

    // ── Portfolio-level context (cross-SKU) ───────────────────────────────
    if (alert.type === "negative_margin" && negMarginCount >= 2) {
      const existing = ctx.impacts
      ctx.impacts = existing
        ? `${existing} — ${negMarginCount} SKUs total are draining portfolio cashflow`
        : `${negMarginCount} SKUs losing money — portfolio cashflow under cumulative pressure`
    }

    if (alert.type === "stockout" && alert.severity === "critical" && critStockoutCount > 1) {
      const existing = ctx.impacts
      ctx.impacts = existing
        ? `${existing}; multiple SKUs at critical stockout simultaneously`
        : "Multiple SKUs at critical stockout — revenue gap and rank loss compound across portfolio"
    }

    if (ctx.causedBy || ctx.impacts || ctx.chainLabel) {
      result.set(alert.id, ctx)
    }
  }

  return result
}
