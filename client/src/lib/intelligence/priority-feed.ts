// ─── Priority Feed — "What needs attention NOW" ───────────────────────────────
// Hard cap: 5 items. Signal quality > volume.
//
// Precision scaling rules (enforced throughout):
//   confidence ≥ 90  → data-derived numbers OK (from seller's CSV)
//   confidence 75-89 → ranges only ("15–25%", "within 5–7 days")
//   confidence < 75  → directional only; no numbers
//   never            → hallucinated bid prices, invented thresholds
//
// Language standard: sharp operator, not consulting firm.
//   ✓ "Pause broad campaigns today — they're losing money."
//   ✗ "We recommend reviewing your ACoS optimization strategy."

import type { SKU, RiskAlert } from "./types"
import { buildCausalContext } from "./causal-engine"
import { updatePersistence, persistenceLabel, persistenceColorClass, alertKey } from "./persistence-tracker"

// ─── Types ────────────────────────────────────────────────────────────────────

export type PriorityCategory = "stockout" | "margin" | "ppc" | "returns" | "overstock"

// new        — problem just appeared in current session
// escalating — existing problem materially worse than last session
// stable     — ongoing issue, not worsening
export type AlertState = "new" | "escalating" | "stable"

export type PriorityItem = {
  id: string
  alertId: string               // for causal lookup
  rank: number
  severity: "critical" | "high" | "medium"
  category: PriorityCategory
  state: AlertState
  confidence: number            // 0–100
  timeHorizon: string           // "Act today", "Within 2 days", etc.
  skuId: string
  skuName: string
  headline: string
  context: string               // why this is a problem
  action: string                // what to do — scaled to confidence
  impact: string                // quantified consequence of inaction
  advisorQ: string
  // Enriched after initial build:
  causedBy?: string             // upstream cause text
  impacts?: string              // downstream consequence text
  chainLabel?: string           // "PPC pressure → net loss"
  persistenceLabel?: string     // "Persistent — 9 sessions"
  persistenceColorClass?: string
}

// ─── Confidence threshold ─────────────────────────────────────────────────────
// Items below this threshold are suppressed.
const MIN_CONFIDENCE = 72

// ─── Precision helper ─────────────────────────────────────────────────────────
// Returns a recommendation scaled to the actual data confidence.
// High confidence: data-grounded specific numbers.
// Medium confidence: ranges and approximations.
// Do NOT compute bid prices from selling price — that is fake precision.

function acosRecommendation(confidence: number, marginPct: number, currentAcosPct: number): string {
  if (confidence >= 90) {
    // Margin data is from seller's CSV — breakeven range is grounded
    const breakevenLow  = Math.round(marginPct * 0.55)
    const breakevenHigh = Math.round(marginPct * 0.70)
    return `Pull your search term report. Negate keywords with ACoS above ${breakevenHigh}%. Your breakeven ACoS is approximately ${breakevenLow}–${breakevenHigh}% based on your reported margin.`
  }
  if (confidence >= 75) {
    return `Pull your search term report. Reduce bids by 15–25% on broad and auto campaigns. Track TACoS — not daily ACoS — for a cleaner signal over 5–7 days.`
  }
  return `Review your PPC campaigns. Start with search term report to find wasted spend.`
}

// ─── Build feed ───────────────────────────────────────────────────────────────

export function getPriorityFeed(skus: SKU[], alerts: RiskAlert[], isDemo = false): PriorityItem[] {
  const rawItems: PriorityItem[] = []
  const skuMap = new Map(skus.map(s => [s.id, s]))

  for (const alert of alerts) {
    const sku = skuMap.get(alert.skuId)
    if (!sku || sku.status !== "active") continue

    // ── CRITICAL STOCKOUT ──────────────────────────────────────────────────
    if (alert.type === "stockout" && alert.severity === "critical") {
      const daysOver    = Math.max(0, sku.reorderLeadTimeDays - sku.daysUntilStockout)
      const gapRevenue  = Math.round(sku.sellingPrice * sku.avgDailySales * Math.max(daysOver, sku.reorderLeadTimeDays))
      const daysToAct   = Math.max(0, sku.daysUntilStockout - 1)
      rawItems.push({
        id: `stockout-crit-${sku.id}`,
        alertId: alert.id,
        rank: 0,
        severity: "critical",
        category: "stockout",
        state: daysOver > 0 ? "escalating" : "new",
        confidence: 97,
        timeHorizon: daysToAct <= 0 ? "Act today" : `Within ${daysToAct} day${daysToAct !== 1 ? "s" : ""}`,
        skuId: sku.id,
        skuName: sku.name,
        headline: `Order Now — ${sku.daysUntilStockout} day${sku.daysUntilStockout !== 1 ? "s" : ""} of stock remaining`,
        context: daysOver > 0
          ? `Lead time is ${sku.reorderLeadTimeDays} days. You are already ${daysOver} day${daysOver !== 1 ? "s" : ""} past your reorder point. A ${daysOver}-day stockout gap is now baked in unless you order today.`
          : `Lead time is ${sku.reorderLeadTimeDays} days. You are at your reorder point — any delay now locks in a stockout gap.`,
        action: `Order ${sku.reorderQuantity.toLocaleString()} units immediately. Ask your supplier explicitly about expedited shipping — standard lead time is no longer safe.`,
        impact: `$${gapRevenue.toLocaleString()} revenue at risk from the gap alone. Amazon rank recovery after a stockout typically takes 2–4× the OOS duration.`,
        advisorQ: `Walk me through the reorder plan for ${sku.name} — it stocks out in ${sku.daysUntilStockout} days and my lead time is ${sku.reorderLeadTimeDays} days`,
      })
    }

    // ── HIGH STOCKOUT (reorder soon) ────────────────────────────────────────
    if (alert.type === "stockout" && alert.severity === "high") {
      const buffer    = sku.daysUntilStockout - sku.reorderLeadTimeDays
      const safeBy    = Math.max(1, buffer - 2)
      const monthlyR  = Math.round(sku.sellingPrice * sku.avgDailySales * 30)
      rawItems.push({
        id: `stockout-high-${sku.id}`,
        alertId: alert.id,
        rank: 1,
        severity: "high",
        category: "stockout",
        state: "stable",
        confidence: 90,
        timeHorizon: `Order within ${safeBy} day${safeBy !== 1 ? "s" : ""}`,
        skuId: sku.id,
        skuName: sku.name,
        headline: `Reorder Soon — ${sku.daysUntilStockout} days remaining`,
        context: `With a ${sku.reorderLeadTimeDays}-day lead time, you have a ${buffer}-day buffer. Any supplier delay, customs hold, or demand spike eliminates it. This is not a warning — it is a deadline.`,
        action: `Place a reorder of ${sku.reorderQuantity.toLocaleString()} units. Confirm your supplier's lead time is firm — if it can slip, order sooner.`,
        impact: `$${monthlyR.toLocaleString()}/mo in revenue depends on uninterrupted stock.`,
        advisorQ: `How much time do I really have to reorder ${sku.name}? I have ${sku.daysUntilStockout} days and a ${sku.reorderLeadTimeDays}-day lead time`,
      })
    }

    // ── NEGATIVE MARGIN (losing money) ─────────────────────────────────────
    if (alert.type === "negative_margin") {
      const loss        = Math.abs(sku.netProfitMonthly)
      const adDriven    = sku.acos >= 0.40
      const quarterLoss = loss * 3
      rawItems.push({
        id: `margin-neg-${sku.id}`,
        alertId: alert.id,
        rank: 0,
        severity: "critical",
        category: "margin",
        state: sku.marginTrend === "down" ? "escalating" : "stable",
        confidence: 99,
        timeHorizon: "Act this week",
        skuId: sku.id,
        skuName: sku.name,
        headline: `Losing $${loss.toLocaleString()}/mo — every sale costs you money`,
        context: `At ${(sku.acos * 100).toFixed(0)}% ACoS and ${sku.marginPercent.toFixed(1)}% net margin, ad spend alone puts this SKU in the red. You are spending to lose.`,
        action: adDriven
          ? `Pause all broad and auto campaigns today. Keep only exact-match on your best-performing keywords. Run a search term report — negate anything that is burning spend without converting. Do not cut PPC to zero; cut the waste.`
          : `Your PPC is not the primary problem — review COGS and fees. A $3–5 price increase may be necessary. Test it on one ASIN variant first if possible.`,
        impact: `At current rate: $${quarterLoss.toLocaleString()} destroyed over 3 months. Each unit sold accelerates the loss.`,
        advisorQ: `${sku.name} is losing $${loss}/month. What's the fastest path to breaking even — PPC cuts, price increase, or sourcing?`,
      })
    }

    // ── MARGIN EROSION (thin, not negative) ────────────────────────────────
    if (alert.type === "margin_erosion" && alert.severity === "high") {
      rawItems.push({
        id: `margin-erosion-${sku.id}`,
        alertId: alert.id,
        rank: 2,
        severity: "high",
        category: "margin",
        state: sku.marginTrend === "down" ? "escalating" : "stable",
        confidence: 87,
        timeHorizon: "Address within 2 weeks",
        skuId: sku.id,
        skuName: sku.name,
        headline: `Thin Margin — ${sku.marginPercent.toFixed(1)}% (below 12% survival threshold)`,
        context: `At ${sku.marginPercent.toFixed(1)}%, there is almost no operational buffer. A single bad PPC week, a returns spike, or an Amazon fee change pushes this SKU negative.`,
        action: `Identify the biggest cost driver: if ACoS >30%, start with PPC reduction. If ACoS is reasonable, review COGS — even a 5–8% supplier cost reduction has an outsized margin impact at this level.`,
        impact: `$${sku.netProfitMonthly.toLocaleString()}/mo at risk of turning negative. Thin margin SKUs are the first to fail when external costs shift.`,
        advisorQ: `${sku.name} margin is at ${sku.marginPercent.toFixed(1)}%. What lever should I pull first — PPC, price, or sourcing?`,
      })
    }

    // ── CRITICAL PPC (ACoS ≥50%) ───────────────────────────────────────────
    if (alert.type === "ppc_pressure" && alert.severity === "critical") {
      const savings = Math.round(sku.monthlyAdSpend * (sku.acos - 0.25))
      rawItems.push({
        id: `ppc-crit-${sku.id}`,
        alertId: alert.id,
        rank: 1,
        severity: "critical",
        category: "ppc",
        state: sku.adSpendTrend === "up" ? "escalating" : "stable",
        confidence: 94,
        timeHorizon: "Pause campaigns today",
        skuId: sku.id,
        skuName: sku.name,
        headline: `PPC Out of Control — ACoS ${(sku.acos * 100).toFixed(0)}%`,
        context: `At ${(sku.acos * 100).toFixed(0)}% ACoS, you are spending ${(sku.acos * 100).toFixed(0)} cents in ads for every dollar earned. After fees and COGS, nothing is left. Ad spend is not acquiring customers — it is subsidising Amazon.`,
        action: `Pause all broad and auto campaigns today. Activate exact-match only on your 3–5 highest-converting keywords. ${acosRecommendation(94, sku.marginPercent, sku.acos * 100)}`,
        impact: `Getting to 25% ACoS recovers approximately $${savings.toLocaleString()}/mo. At current ACoS, every dollar spent on ads returns less than the cost.`,
        advisorQ: `How do I cut ACoS on ${sku.name} from ${(sku.acos * 100).toFixed(0)}% to 25% without losing organic rank?`,
      })
    }

    // ── HIGH PPC (ACoS 35–50%, trending up) ───────────────────────────────
    if (alert.type === "ppc_pressure" && alert.severity === "high") {
      const savings    = Math.round(sku.monthlyAdSpend * (sku.acos - 0.25))
      const breakevenL = Math.round(sku.marginPercent * 0.55)
      const breakevenH = Math.round(sku.marginPercent * 0.70)
      rawItems.push({
        id: `ppc-high-${sku.id}`,
        alertId: alert.id,
        rank: 2,
        severity: "high",
        category: "ppc",
        state: sku.adSpendTrend === "up" ? "escalating" : "stable",
        confidence: 83,
        timeHorizon: "Optimise this week",
        skuId: sku.id,
        skuName: sku.name,
        headline: `PPC Pressure — ACoS ${(sku.acos * 100).toFixed(0)}% ${sku.adSpendTrend === "up" ? "and rising" : ""}`.trim(),
        context: `With ${sku.marginPercent.toFixed(1)}% net margin, your estimated breakeven ACoS is around ${breakevenL}–${breakevenH}%. You are ${((sku.acos * 100) - breakevenH).toFixed(0)}pp above that — ad spend is consuming profit.`,
        action: `Run your search term report. Identify keywords with ACoS above ${breakevenH}% and reduce bids by 15–25%. Do not cut blindly — sort by cost, not by ACoS alone.`,
        impact: `Getting to 25% ACoS saves approximately $${savings.toLocaleString()}/mo with no change to revenue.`,
        advisorQ: `How do I reduce ACoS on ${sku.name} from ${(sku.acos * 100).toFixed(0)}% without hurting velocity?`,
      })
    }

    // ── HIGH RETURN RATE ────────────────────────────────────────────────────
    if (alert.type === "return_rate" && (alert.severity === "high" || alert.severity === "critical")) {
      const returnPct   = (sku.returnRate * 100).toFixed(0)
      rawItems.push({
        id: `returns-${sku.id}`,
        alertId: alert.id,
        rank: 2,
        severity: "high",
        category: "returns",
        state: sku.marginTrend === "down" ? "escalating" : "stable",
        confidence: 91,
        timeHorizon: "Investigate this week",
        skuId: sku.id,
        skuName: sku.name,
        headline: `High Returns — ${returnPct}% return rate (category avg: 4–8%)`,
        context: `${returnPct}% of units sold are coming back. At ${sku.avgMonthlySales} units/mo, that is ~${Math.round(sku.avgMonthlySales * sku.returnRate)} returns per month — each costing you fees, fulfilment, and lost revenue.`,
        action: `Go to Seller Central → Manage Returns → pull reason codes. "Not as described" means listing problem. "Defective" means supplier QC issue. "Changed mind" means pricing or expectation mismatch. Fix the highest-frequency reason first.`,
        impact: `$${sku.monthlyReturns.toLocaleString()}/mo in return costs. Amazon flags accounts with return rates above 20% — suspension risk above that threshold.`,
        advisorQ: `Return rate on ${sku.name} is at ${returnPct}%. How do I diagnose whether it's a listing problem or a product quality problem?`,
      })
    }

    // ── DEAD INVENTORY ──────────────────────────────────────────────────────
    if (alert.type === "dead_inventory") {
      const months     = Math.round(sku.daysUntilStockout / 30)
      const storageBurn = Math.round(sku.monthlyStorageFee * Math.max(0, months - 2))
      rawItems.push({
        id: `dead-${sku.id}`,
        alertId: alert.id,
        rank: 3,
        severity: "medium",
        category: "overstock",
        state: sku.salesVelocityTrend === "down" ? "escalating" : "stable",
        confidence: 86,
        timeHorizon: "Plan clearance this month",
        skuId: sku.id,
        skuName: sku.name,
        headline: `Dead Inventory — ${months} months of stock at current velocity`,
        context: `At ${sku.avgDailySales} unit${sku.avgDailySales !== 1 ? "s" : ""}/day this inventory won't clear for ${sku.daysUntilStockout} days. Storage fees compound every month, and Amazon charges long-term storage fees after 365 days.`,
        action: `Run a 15–20% coupon for 2 weeks to accelerate sell-through. If velocity does not improve meaningfully, plan liquidation for units beyond 4 months of stock. Do not discount indefinitely.`,
        impact: `~$${storageBurn.toLocaleString()} in excess storage fees ahead. Capital locked in ${sku.currentInventory.toLocaleString()} unsold units.`,
        advisorQ: `I have ${months} months of ${sku.name} inventory. What is the best clearance strategy that doesn't destroy my average review count or ranking?`,
      })
    }
  }

  // ── Dedup: same SKU + category → keep highest severity ───────────────────
  const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2 }
  const seen = new Map<string, PriorityItem>()
  for (const item of rawItems) {
    const key = `${item.skuId}::${item.category}`
    const existing = seen.get(key)
    if (!existing || sevOrder[item.severity] < sevOrder[existing.severity]) {
      seen.set(key, item)
    }
  }

  // ── Filter by confidence, sort, cap at 5 ─────────────────────────────────
  const stateOrder: Record<string, number> = { escalating: 0, new: 1, stable: 2 }
  const sorted = [...seen.values()]
    .filter(i => i.confidence >= MIN_CONFIDENCE)
    .sort((a, b) =>
      sevOrder[a.severity] - sevOrder[b.severity] ||
      stateOrder[a.state] - stateOrder[b.state] ||
      a.rank - b.rank
    )
    .slice(0, 5)

  // ── Enrich with causal context + persistence ──────────────────────────────
  const causalMap     = buildCausalContext(alerts, skus)
  const persistMap    = updatePersistence(alerts, isDemo)
  const alertById     = new Map(alerts.map(a => [a.id, a]))

  return sorted.map((item, i) => {
    const causal  = causalMap.get(item.alertId) ?? null
    const pKey    = alertById.has(item.alertId)
      ? alertKey({ skuId: item.skuId, type: alertById.get(item.alertId)!.type })
      : null
    const persist = pKey ? persistMap.get(pKey) : undefined
    return {
      ...item,
      rank: i + 1,
      causedBy:              causal?.causedBy   ?? undefined,
      impacts:               causal?.impacts    ?? undefined,
      chainLabel:            causal?.chainLabel ?? undefined,
      persistenceLabel:      persistenceLabel(persist)      ?? undefined,
      persistenceColorClass: persistenceColorClass(persist) ?? undefined,
    }
  })
}
