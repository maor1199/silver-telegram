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

// Trajectory describes the operational momentum of the issue
export type Trajectory = "accelerating" | "deteriorating" | "stabilizing" | "recovering"

export type PriorityItem = {
  id: string
  alertId: string               // for causal lookup
  rank: number
  severity: "critical" | "high" | "medium"
  category: PriorityCategory
  state: AlertState
  trajectory: Trajectory        // operational momentum
  confidence: number            // 0–100
  timeHorizon: string           // "Act today", "Within 2 days", etc.
  skuId: string
  skuName: string
  headline: string
  context: string               // why this is a problem
  action: string                // what to do — scaled to confidence
  impact: string                // quantified consequence of inaction
  projectedImpact: string | null  // "If nothing changes..." — null = confidence too low
  advisorQ: string
  // Enriched after initial build:
  causedBy?: string             // upstream cause text
  impacts?: string              // downstream consequence text
  chainLabel?: string           // "PPC pressure → net loss"
  persistenceLabel?: string     // "Persistent — 9 sessions"
  persistenceColorClass?: string
}

// ─── Confidence threshold ─────────────────────────────────────────────────────
const MIN_CONFIDENCE = 72

// ─── Precision helper ─────────────────────────────────────────────────────────
// Recommendation text scaled to data confidence.
// High confidence: data-grounded specific numbers.
// Medium confidence: ranges and approximations.

function acosRecommendation(confidence: number, marginPct: number, _currentAcosPct: number): string {
  if (confidence >= 90) {
    const breakevenLow  = Math.round(marginPct * 0.55)
    const breakevenHigh = Math.round(marginPct * 0.70)
    return `Pull your search term report. Negate keywords with ACoS above ${breakevenHigh}%. Your breakeven ACoS is approximately ${breakevenLow}–${breakevenHigh}% based on your reported margin.`
  }
  if (confidence >= 75) {
    return `Pull your search term report. Reduce bids by 15–25% on broad and auto campaigns. Track TACoS — not daily ACoS — for a cleaner signal over 5–7 days.`
  }
  return `Review your PPC campaigns. Start with search term report to find wasted spend.`
}

// ─── Trajectory derivation ────────────────────────────────────────────────────
// Derives operational momentum from alert state + SKU metric trends.

function deriveTrajectory(
  state: AlertState,
  trends: { isWorsening: boolean; isImproving: boolean }
): Trajectory {
  if (state === "escalating") return "accelerating"
  if (state === "new")        return "deteriorating"
  // stable state — use trend signals
  if (trends.isImproving) return "stabilizing"
  return "deteriorating" // chronic stable issues are still deteriorating situations
}

// ─── Projected impact ─────────────────────────────────────────────────────────
// Forward-looking consequence statement scaled to confidence.
// null = confidence too low — avoids speculation.

function buildProjectedImpact(
  type: RiskAlert["type"],
  sku: SKU,
  confidence: number
): string | null {
  if (confidence < 75) return null

  const hi          = confidence >= 88
  const dailyRevenue = sku.monthlyRevenue / 30

  switch (type) {
    case "stockout": {
      const d   = sku.daysUntilStockout
      const low = Math.round(dailyRevenue * 5)
      const high = Math.round(dailyRevenue * 14)
      if (hi) {
        return `At current velocity, a stockout in ${d} day${d !== 1 ? "s" : ""} could cost $${low.toLocaleString()}–$${high.toLocaleString()} in lost revenue over a typical 1–2 week gap, plus compounded rank damage.`
      }
      return `A stockout at this stage causes significant revenue loss and search rank damage that takes weeks to recover.`
    }

    case "negative_margin": {
      const loss = Math.abs(sku.netProfitMonthly)
      if (hi) {
        return `At the current rate, this SKU destroys $${loss.toLocaleString()}/mo — $${Math.round(loss * 12).toLocaleString()} annualized if nothing changes.`
      }
      return `Losses will compound monthly and continue draining portfolio cashflow until the root cause is addressed.`
    }

    case "margin_erosion": {
      if (hi) {
        return `At ${sku.marginPercent.toFixed(1)}% margin, one cost variance — a fee increase, ACoS spike, or returns surge — flips this SKU to net negative.`
      }
      return `Continued erosion at this rate may produce a net-negative SKU within 30–60 days.`
    }

    case "ppc_pressure": {
      const acos  = (sku.acos * 100).toFixed(0)
      const spend = Math.round(sku.monthlyAdSpend)
      if (hi) {
        return `$${spend.toLocaleString()}/mo consumed by ads at ${acos}% ACoS. Unless ACoS drops toward your margin breakeven, net profit on this SKU will remain negative from ads alone.`
      }
      return `If ad spend continues at this level, net margin erosion will accelerate over the coming weeks.`
    }

    case "return_rate": {
      const rate = (sku.returnRate * 100).toFixed(0)
      const est  = Math.round(sku.monthlyRevenue * sku.returnRate * 0.25)
      if (hi && est > 0) {
        return `At a ${rate}% return rate, an estimated $${est.toLocaleString()}/mo is lost to refunds and return processing. Root cause unaddressed means this drain continues every month.`
      }
      return `High returns are steadily reducing effective revenue. Unresolved, this compounds month over month.`
    }

    case "dead_inventory": {
      const months      = (sku.daysUntilStockout / 30).toFixed(1)
      const storageFees = Math.round(sku.monthlyStorageFee * 3)
      if (hi && storageFees > 0) {
        return `With ${months} months of stock and declining velocity, storage fees alone will add ~$${storageFees.toLocaleString()} over the next 90 days. Capital remains locked in idle units.`
      }
      return `Without a velocity recovery or clearance action, storage fees will compound on idle inventory for months.`
    }

    case "overstock": {
      const months = (sku.daysUntilStockout / 30).toFixed(1)
      if (hi) {
        return `At ${months} months of stock, working capital is locked in inventory that won't convert to cash at current velocity.`
      }
      return `Excess inventory ties up capital and accumulates storage costs. Velocity is too low to clear stock at a healthy rate.`
    }

    default:
      return null
  }
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
      const daysOver   = Math.max(0, sku.reorderLeadTimeDays - sku.daysUntilStockout)
      const gapRevenue = Math.round(sku.sellingPrice * sku.avgDailySales * Math.max(daysOver, sku.reorderLeadTimeDays))
      const daysToAct  = Math.max(0, sku.daysUntilStockout - 1)
      const state: AlertState = daysOver > 0 ? "escalating" : "new"
      const confidence = 97
      rawItems.push({
        id:         `stockout-crit-${sku.id}`,
        alertId:    alert.id,
        rank:       0,
        severity:   "critical",
        category:   "stockout",
        state,
        trajectory: deriveTrajectory(state, { isWorsening: daysOver > 0, isImproving: false }),
        confidence,
        timeHorizon: daysToAct <= 0 ? "Act today" : `Within ${daysToAct} day${daysToAct !== 1 ? "s" : ""}`,
        skuId:   sku.id,
        skuName: sku.name,
        headline: `Order Now — ${sku.daysUntilStockout} day${sku.daysUntilStockout !== 1 ? "s" : ""} of stock remaining`,
        context: daysOver > 0
          ? `Lead time is ${sku.reorderLeadTimeDays} days. You are already ${daysOver} day${daysOver !== 1 ? "s" : ""} past your reorder point. A stockout gap is now locked in unless you order today.`
          : `Lead time is ${sku.reorderLeadTimeDays} days. You are at your reorder point — any delay now locks in a stockout gap.`,
        action:          `Order ${sku.reorderQuantity.toLocaleString()} units immediately. Ask your supplier explicitly about expedited shipping — standard lead time is no longer safe.`,
        impact:          `$${gapRevenue.toLocaleString()} revenue at risk from the gap alone. Rank recovery after a stockout typically takes 2–4× the OOS duration.`,
        projectedImpact: buildProjectedImpact("stockout", sku, confidence),
        advisorQ: `Walk me through the reorder plan for ${sku.name} — it stocks out in ${sku.daysUntilStockout} days and my lead time is ${sku.reorderLeadTimeDays} days`,
      })
    }

    // ── HIGH STOCKOUT (reorder soon) ────────────────────────────────────────
    if (alert.type === "stockout" && alert.severity === "high") {
      const buffer   = sku.daysUntilStockout - sku.reorderLeadTimeDays
      const safeBy   = Math.max(1, buffer - 2)
      const monthlyR = Math.round(sku.sellingPrice * sku.avgDailySales * 30)
      const state: AlertState = "stable"
      const confidence = 90
      rawItems.push({
        id:         `stockout-high-${sku.id}`,
        alertId:    alert.id,
        rank:       1,
        severity:   "high",
        category:   "stockout",
        state,
        trajectory: deriveTrajectory(state, { isWorsening: false, isImproving: false }),
        confidence,
        timeHorizon: `Order within ${safeBy} day${safeBy !== 1 ? "s" : ""}`,
        skuId:   sku.id,
        skuName: sku.name,
        headline: `Reorder Soon — ${sku.daysUntilStockout} days remaining`,
        context:  `With a ${sku.reorderLeadTimeDays}-day lead time, you have a ${buffer}-day buffer. Any supplier delay, customs hold, or demand spike eliminates it. This is not a warning — it is a deadline.`,
        action:          `Place a reorder of ${sku.reorderQuantity.toLocaleString()} units. Confirm your supplier's lead time is firm — if it can slip, order sooner.`,
        impact:          `$${monthlyR.toLocaleString()}/mo in revenue depends on uninterrupted stock.`,
        projectedImpact: buildProjectedImpact("stockout", sku, confidence),
        advisorQ: `How much time do I really have to reorder ${sku.name}? I have ${sku.daysUntilStockout} days and a ${sku.reorderLeadTimeDays}-day lead time`,
      })
    }

    // ── NEGATIVE MARGIN ────────────────────────────────────────────────────
    if (alert.type === "negative_margin") {
      const loss        = Math.abs(sku.netProfitMonthly)
      const adDriven    = sku.acos >= 0.40
      const quarterLoss = loss * 3
      const state: AlertState = sku.marginTrend === "down" ? "escalating" : "stable"
      const confidence = 99
      rawItems.push({
        id:         `margin-neg-${sku.id}`,
        alertId:    alert.id,
        rank:       0,
        severity:   "critical",
        category:   "margin",
        state,
        trajectory: deriveTrajectory(state, { isWorsening: sku.marginTrend === "down", isImproving: sku.marginTrend === "up" }),
        confidence,
        timeHorizon: "Act this week",
        skuId:   sku.id,
        skuName: sku.name,
        headline: `Losing $${loss.toLocaleString()}/mo — every sale costs you money`,
        context:  `At ${(sku.acos * 100).toFixed(0)}% ACoS and ${sku.marginPercent.toFixed(1)}% net margin, ad spend alone puts this SKU in the red. You are spending to lose.`,
        action: adDriven
          ? `Pause all broad and auto campaigns today. Keep only exact-match on your best-performing keywords. Run a search term report — negate anything burning spend without converting.`
          : `PPC is not the primary driver — review COGS and fees. A $3–5 price increase may be necessary. Test it on one ASIN variant first if possible.`,
        impact:          `At current rate: $${quarterLoss.toLocaleString()} destroyed over 3 months.`,
        projectedImpact: buildProjectedImpact("negative_margin", sku, confidence),
        advisorQ: `${sku.name} is losing $${loss}/month. What's the fastest path to breaking even — PPC cuts, price increase, or sourcing?`,
      })
    }

    // ── MARGIN EROSION ─────────────────────────────────────────────────────
    if (alert.type === "margin_erosion" && alert.severity === "high") {
      const state: AlertState = sku.marginTrend === "down" ? "escalating" : "stable"
      const confidence = 87
      rawItems.push({
        id:         `margin-erosion-${sku.id}`,
        alertId:    alert.id,
        rank:       2,
        severity:   "high",
        category:   "margin",
        state,
        trajectory: deriveTrajectory(state, { isWorsening: sku.marginTrend === "down", isImproving: sku.marginTrend === "up" }),
        confidence,
        timeHorizon: "Address within 2 weeks",
        skuId:   sku.id,
        skuName: sku.name,
        headline: `Thin Margin — ${sku.marginPercent.toFixed(1)}% (below 12% survival threshold)`,
        context:  `At ${sku.marginPercent.toFixed(1)}%, there is almost no operational buffer. A single bad PPC week, a returns spike, or an Amazon fee change pushes this SKU negative.`,
        action:          `Identify the biggest cost driver: if ACoS >30%, start with PPC reduction. If ACoS is reasonable, review COGS — even a 5–8% supplier cost reduction has an outsized margin impact at this level.`,
        impact:          `$${sku.netProfitMonthly.toLocaleString()}/mo at risk of turning negative.`,
        projectedImpact: buildProjectedImpact("margin_erosion", sku, confidence),
        advisorQ: `${sku.name} margin is at ${sku.marginPercent.toFixed(1)}%. What lever should I pull first — PPC, price, or sourcing?`,
      })
    }

    // ── CRITICAL PPC ───────────────────────────────────────────────────────
    if (alert.type === "ppc_pressure" && alert.severity === "critical") {
      const savings    = Math.round(sku.monthlyAdSpend * (sku.acos - 0.25))
      const state: AlertState = sku.adSpendTrend === "up" ? "escalating" : "stable"
      const confidence = 94
      rawItems.push({
        id:         `ppc-crit-${sku.id}`,
        alertId:    alert.id,
        rank:       1,
        severity:   "critical",
        category:   "ppc",
        state,
        trajectory: deriveTrajectory(state, { isWorsening: sku.adSpendTrend === "up", isImproving: sku.adSpendTrend === "down" }),
        confidence,
        timeHorizon: "Pause campaigns today",
        skuId:   sku.id,
        skuName: sku.name,
        headline: `PPC Out of Control — ACoS ${(sku.acos * 100).toFixed(0)}%`,
        context:  `You are spending ${(sku.acos * 100).toFixed(0)} cents in ads for every dollar earned. After fees and COGS, nothing remains. Ad spend is subsidising Amazon, not acquiring customers.`,
        action:          `Pause all broad and auto campaigns today. Activate exact-match only on your 3–5 highest-converting keywords. ${acosRecommendation(confidence, sku.marginPercent, sku.acos * 100)}`,
        impact:          `Getting to 25% ACoS recovers approximately $${savings.toLocaleString()}/mo.`,
        projectedImpact: buildProjectedImpact("ppc_pressure", sku, confidence),
        advisorQ: `How do I cut ACoS on ${sku.name} from ${(sku.acos * 100).toFixed(0)}% to 25% without losing organic rank?`,
      })
    }

    // ── HIGH PPC ───────────────────────────────────────────────────────────
    if (alert.type === "ppc_pressure" && alert.severity === "high") {
      const savings    = Math.round(sku.monthlyAdSpend * (sku.acos - 0.25))
      const breakevenL = Math.round(sku.marginPercent * 0.55)
      const breakevenH = Math.round(sku.marginPercent * 0.70)
      const state: AlertState = sku.adSpendTrend === "up" ? "escalating" : "stable"
      const confidence = 83
      rawItems.push({
        id:         `ppc-high-${sku.id}`,
        alertId:    alert.id,
        rank:       2,
        severity:   "high",
        category:   "ppc",
        state,
        trajectory: deriveTrajectory(state, { isWorsening: sku.adSpendTrend === "up", isImproving: sku.adSpendTrend === "down" }),
        confidence,
        timeHorizon: "Optimise this week",
        skuId:   sku.id,
        skuName: sku.name,
        headline: `PPC Pressure — ACoS ${(sku.acos * 100).toFixed(0)}%${sku.adSpendTrend === "up" ? " and rising" : ""}`,
        context:  `With ${sku.marginPercent.toFixed(1)}% net margin, your estimated breakeven ACoS is around ${breakevenL}–${breakevenH}%. You are ${((sku.acos * 100) - breakevenH).toFixed(0)}pp above that — ad spend is consuming profit.`,
        action:          `Run your search term report. Identify keywords with ACoS above ${breakevenH}% and reduce bids by 15–25%. Sort by cost, not by ACoS alone.`,
        impact:          `Getting to 25% ACoS saves approximately $${savings.toLocaleString()}/mo.`,
        projectedImpact: buildProjectedImpact("ppc_pressure", sku, confidence),
        advisorQ: `How do I reduce ACoS on ${sku.name} from ${(sku.acos * 100).toFixed(0)}% without hurting velocity?`,
      })
    }

    // ── RETURN RATE ────────────────────────────────────────────────────────
    if (alert.type === "return_rate" && (alert.severity === "high" || alert.severity === "critical")) {
      const returnPct = (sku.returnRate * 100).toFixed(0)
      const state: AlertState = sku.marginTrend === "down" ? "escalating" : "stable"
      const confidence = 91
      rawItems.push({
        id:         `returns-${sku.id}`,
        alertId:    alert.id,
        rank:       2,
        severity:   "high",
        category:   "returns",
        state,
        trajectory: deriveTrajectory(state, { isWorsening: sku.marginTrend === "down", isImproving: false }),
        confidence,
        timeHorizon: "Investigate this week",
        skuId:   sku.id,
        skuName: sku.name,
        headline: `High Returns — ${returnPct}% return rate (category avg: 4–8%)`,
        context:  `${returnPct}% of units sold are coming back. At ${sku.avgMonthlySales} units/mo, that is ~${Math.round(sku.avgMonthlySales * sku.returnRate)} returns per month — each costing fees, fulfilment, and lost revenue.`,
        action:          `Pull return reason codes from Seller Central. "Not as described" means listing problem. "Defective" means supplier QC issue. Fix the highest-frequency reason first.`,
        impact:          `$${sku.monthlyReturns.toLocaleString()}/mo in return costs.`,
        projectedImpact: buildProjectedImpact("return_rate", sku, confidence),
        advisorQ: `Return rate on ${sku.name} is at ${returnPct}%. How do I diagnose whether it's a listing problem or a product quality problem?`,
      })
    }

    // ── DEAD INVENTORY ─────────────────────────────────────────────────────
    if (alert.type === "dead_inventory") {
      const months      = Math.round(sku.daysUntilStockout / 30)
      const storageBurn = Math.round(sku.monthlyStorageFee * Math.max(0, months - 2))
      const state: AlertState = sku.salesVelocityTrend === "down" ? "escalating" : "stable"
      const confidence = 86
      rawItems.push({
        id:         `dead-${sku.id}`,
        alertId:    alert.id,
        rank:       3,
        severity:   "medium",
        category:   "overstock",
        state,
        trajectory: deriveTrajectory(state, { isWorsening: sku.salesVelocityTrend === "down", isImproving: sku.salesVelocityTrend === "up" }),
        confidence,
        timeHorizon: "Plan clearance this month",
        skuId:   sku.id,
        skuName: sku.name,
        headline: `Dead Inventory — ${months} months of stock at current velocity`,
        context:  `At ${sku.avgDailySales} unit${sku.avgDailySales !== 1 ? "s" : ""}/day this inventory won't clear for ${sku.daysUntilStockout} days. Storage fees compound every month.`,
        action:          `Run a 15–20% coupon for 2 weeks to accelerate sell-through. If velocity does not improve meaningfully, plan liquidation for units beyond 4 months of stock.`,
        impact:          `~$${storageBurn.toLocaleString()} in excess storage fees ahead.`,
        projectedImpact: buildProjectedImpact("dead_inventory", sku, confidence),
        advisorQ: `I have ${months} months of ${sku.name} inventory. What is the best clearance strategy that doesn't destroy my ranking?`,
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
      sevOrder[a.severity]  - sevOrder[b.severity]  ||
      stateOrder[a.state]   - stateOrder[b.state]   ||
      a.rank - b.rank
    )
    .slice(0, 5)

  // ── Enrich with causal context + persistence ──────────────────────────────
  const causalMap  = buildCausalContext(alerts, skus)
  const persistMap = updatePersistence(alerts, isDemo)
  const alertById  = new Map(alerts.map(a => [a.id, a]))

  return sorted.map((item, i) => {
    const causal  = causalMap.get(item.alertId) ?? null
    const pKey    = alertById.has(item.alertId)
      ? alertKey({ skuId: item.skuId, type: alertById.get(item.alertId)!.type })
      : null
    const persist = pKey ? persistMap.get(pKey) : undefined
    return {
      ...item,
      rank:                  i + 1,
      causedBy:              causal?.causedBy   ?? undefined,
      impacts:               causal?.impacts    ?? undefined,
      chainLabel:            causal?.chainLabel ?? undefined,
      persistenceLabel:      persistenceLabel(persist)      ?? undefined,
      persistenceColorClass: persistenceColorClass(persist) ?? undefined,
    }
  })
}
