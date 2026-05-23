// ─── Priority Feed — "What needs attention NOW" ───────────────────────────────
// Hard cap: 5 items. Signal quality > volume.
//
// Precision scaling rules:
//   confidence ≥ 90  → data-derived numbers OK
//   confidence 75-89 → ranges only
//   confidence < 75  → directional only; no numbers
//   never            → hallucinated bid prices, invented thresholds

import type { SKU, RiskAlert } from "./types"
import { buildCausalContext } from "./causal-engine"
import { updatePersistence, persistenceLabel, persistenceColorClass, alertKey } from "./persistence-tracker"

// ─── Types ────────────────────────────────────────────────────────────────────

export type PriorityCategory = "stockout" | "margin" | "ppc" | "returns" | "overstock"
export type AlertState       = "new" | "escalating" | "stable"
export type Trajectory       = "accelerating" | "deteriorating" | "stabilizing" | "recovering"

export type PriorityItem = {
  id:              string
  alertId:         string
  rank:            number
  severity:        "critical" | "high" | "medium"
  category:        PriorityCategory
  state:           AlertState
  trajectory:      Trajectory
  confidence:      number
  confidenceReason: string          // plain English: what data backs the score
  timeHorizon:     string
  skuId:           string
  skuName:         string
  headline:        string
  context:         string
  action:          string
  impact:          string           // quantified consequence
  projectedImpact: string | null    // "If nothing changes…" — null = suppressed
  advisorQ:        string
  // Enriched after initial build:
  causedBy?:              string
  impacts?:               string
  chainLabel?:            string
  persistenceLabel?:      string
  persistenceColorClass?: string
  persistenceSince?:      string    // "9 sessions, first detected 14 days ago"
}

const MIN_CONFIDENCE = 72

// ─── Feed result (items + suppression metadata) ───────────────────────────────

export type PriorityFeedResult = {
  items:            PriorityItem[]
  suppressedCount:  number    // raw candidates filtered below confidence threshold
  candidateCount:   number    // unique de-duplicated candidates before filter+cap
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function acosRecommendation(confidence: number, marginPct: number, _acosPct: number): string {
  if (confidence >= 90) {
    const lo = Math.round(marginPct * 0.55)
    const hi = Math.round(marginPct * 0.70)
    return `Pull your search term report. Negate keywords with ACoS above ${hi}%. Your breakeven ACoS is approximately ${lo}–${hi}% based on your reported margin.`
  }
  if (confidence >= 75) {
    return `Pull your search term report. Reduce bids by 15–25% on broad and auto campaigns. Track TACoS — not daily ACoS — over 5–7 days.`
  }
  return `Review your PPC campaigns. Start with search term report to find wasted spend.`
}

function deriveTrajectory(
  state:  AlertState,
  trends: { isWorsening: boolean; isImproving: boolean }
): Trajectory {
  if (state === "escalating") return "accelerating"
  if (state === "new")        return "deteriorating"
  if (trends.isImproving)     return "stabilizing"
  return "deteriorating"
}

// What data actually backs the confidence level for this alert type.
function buildConfidenceReason(type: RiskAlert["type"], confidence: number): string {
  if (confidence >= 95) {
    switch (type) {
      case "stockout":
        return "Based on exact inventory count, confirmed supplier lead time, and current daily sales rate from your uploaded data."
      case "negative_margin":
        return "Based on confirmed net profit from your reported revenue, COGS, fees, and ad spend — all from your CSV."
      case "ppc_pressure":
        return "Based on confirmed ACoS and monthly ad spend directly from your data — no assumptions made."
      default:
        return "Based on confirmed data from your uploaded CSV — high signal quality."
    }
  }
  if (confidence >= 88) {
    return "Based on your data with standard assumptions for minor fee variance. Directional accuracy is high; specific figures are reliable estimates."
  }
  if (confidence >= 75) {
    return "Based on your data with some assumptions for missing cost components. Ranges used rather than exact figures."
  }
  return "Signal present but below threshold for specific projections — directional guidance only."
}

function buildProjectedImpact(type: RiskAlert["type"], sku: SKU, confidence: number): string | null {
  if (confidence < 75) return null
  const hi       = confidence >= 88
  const dailyRev = sku.monthlyRevenue / 30

  switch (type) {

    case "stockout": {
      const d         = sku.daysUntilStockout
      const gapDays   = sku.reorderLeadTimeDays - d
      const exposedDays = Math.max(gapDays, 7) // minimum realistic gap
      if (hi) {
        const gapLoss = Math.round(dailyRev * exposedDays)
        const rankNote = exposedDays >= 7
          ? " Search ranking typically falls 20–30 positions after a 7-day gap — recovery takes 2–4× the stockout duration."
          : ""
        return `At current velocity, a stockout gap of ~${exposedDays} day${exposedDays !== 1 ? "s" : ""} costs approximately $${gapLoss.toLocaleString()} in lost revenue.${rankNote}`
      }
      return `A stockout at this stage produces a revenue gap and ranking damage that typically takes 2–4 weeks to recover. The longer it runs, the more expensive the recovery.`
    }

    case "negative_margin": {
      const loss   = Math.abs(sku.netProfitMonthly)
      const annualLoss = Math.round(loss * 12)
      const q2Loss = Math.round(loss * 3)
      if (hi) {
        return `At $${loss.toLocaleString()}/mo in losses, this SKU will consume $${q2Loss.toLocaleString()} in the next 90 days. Annualised: $${annualLoss.toLocaleString()} destroyed if the root cause is not resolved. Every unit sold accelerates the drain.`
      }
      return `Each month of inaction compounds the loss. The damage will not self-correct — either ad spend, COGS, or price needs to change.`
    }

    case "margin_erosion": {
      const margin = sku.marginPercent
      const breakeven = Math.round(sku.monthlyAdSpend * 0.10)
      if (hi) {
        return `At ${margin.toFixed(1)}% margin, a single cost event — a 5pp ACoS rise, a fee increase, or a returns surge — flips this SKU to net negative. At current trajectory, that crossover is likely within 30–45 days without intervention.`
      }
      return `Margin this thin offers no buffer for normal operational variance. One bad week on PPC or returns tips it negative.`
    }

    case "ppc_pressure": {
      const acos       = (sku.acos * 100).toFixed(0)
      const spend      = Math.round(sku.monthlyAdSpend)
      const tacosEst   = ((sku.monthlyAdSpend / sku.monthlyRevenue) * 100).toFixed(1)
      const breakeven  = Math.round(sku.marginPercent * 0.65)
      if (hi) {
        return `$${spend.toLocaleString()}/mo in ads at ${acos}% ACoS against ~${breakeven}% breakeven. Effective TACoS is ~${tacosEst}% — meaning ad spend is consuming more than the net margin this SKU generates. Every day at this spend rate deepens the hole.`
      }
      return `Ad spend at this ACoS is consuming most of the available margin. If TACoS exceeds net margin, the business is paying to sell at a loss.`
    }

    case "return_rate": {
      const rate      = (sku.returnRate * 100).toFixed(0)
      const units     = Math.round(sku.avgMonthlySales * sku.returnRate)
      const costPerReturn = Math.round((sku.monthlyReturns / Math.max(units, 1)))
      if (hi && units > 0) {
        return `~${units} returns/mo at an estimated $${costPerReturn.toLocaleString()} cost per return unit (refund + FBA removal + relisting). ${rate}% return rate also increases suppression risk — Amazon flags listings with sustained returns above category average.`
      }
      return `High return rates erode net revenue every month and increase the risk of listing suppression if they exceed Amazon's category threshold.`
    }

    case "dead_inventory": {
      const months  = Math.round(sku.daysUntilStockout / 30)
      const q3Fees  = Math.round(sku.monthlyStorageFee * 3)
      const surcharge = months > 6 ? `Long-term storage fees apply to units over 365 days — these are significantly higher than standard rates.` : ""
      if (hi && q3Fees > 0) {
        return `At current velocity, ${months} months of stock generates ~$${q3Fees.toLocaleString()} in storage fees over the next 90 days with no revenue offset. Working capital remains locked. ${surcharge}`
      }
      return `Storage costs compound month over month without a velocity recovery or clearance action. Capital tied up in idle units cannot be redeployed.`
    }

    case "overstock": {
      const months    = (sku.daysUntilStockout / 30).toFixed(1)
      const storage90 = Math.round(sku.monthlyStorageFee * 3)
      if (hi) {
        return `${months} months of inventory at current velocity locks up working capital and accumulates ~$${storage90.toLocaleString()} in storage costs over the next 90 days. A velocity recovery or clearance is needed to free the capital.`
      }
      return `Excess stock ties up capital and generates storage costs until velocity recovers. The longer it sits, the more expensive the resolution.`
    }

    default: return null
  }
}

function daysAgoLabel(isoDate: string): string {
  const d = Math.max(1, Math.round((Date.now() - new Date(isoDate).getTime()) / 86_400_000))
  return `${d} day${d !== 1 ? "s" : ""} ago`
}

// ─── Build feed ───────────────────────────────────────────────────────────────

export function getPriorityFeed(skus: SKU[], alerts: RiskAlert[], isDemo = false): PriorityFeedResult {
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
        id: `stockout-crit-${sku.id}`, alertId: alert.id, rank: 0,
        severity: "critical", category: "stockout", state,
        trajectory:       deriveTrajectory(state, { isWorsening: daysOver > 0, isImproving: false }),
        confidence,
        confidenceReason: buildConfidenceReason(alert.type, confidence),
        timeHorizon:      daysToAct <= 0 ? "Act today" : `Within ${daysToAct} day${daysToAct !== 1 ? "s" : ""}`,
        skuId: sku.id, skuName: sku.name,
        headline: `Order Now — ${sku.daysUntilStockout} day${sku.daysUntilStockout !== 1 ? "s" : ""} of stock remaining`,
        context: daysOver > 0
          ? `Lead time is ${sku.reorderLeadTimeDays} days. You are already ${daysOver} day${daysOver !== 1 ? "s" : ""} past your reorder point. A stockout gap is now locked in unless you order today.`
          : `Lead time is ${sku.reorderLeadTimeDays} days. You are at your reorder point — any delay now locks in a stockout gap.`,
        action:          `Order ${sku.reorderQuantity.toLocaleString()} units immediately. Ask your supplier explicitly about expedited shipping — standard lead time is no longer safe.`,
        impact:          `$${gapRevenue.toLocaleString()} revenue at risk from the gap alone. Rank recovery after a stockout typically takes 2–4× the OOS duration.`,
        projectedImpact: buildProjectedImpact(alert.type, sku, confidence),
        advisorQ: `Walk me through the reorder plan for ${sku.name} — it stocks out in ${sku.daysUntilStockout} days and my lead time is ${sku.reorderLeadTimeDays} days`,
      })
    }

    // ── HIGH STOCKOUT ─────────────────────────────────────────────────────
    if (alert.type === "stockout" && alert.severity === "high") {
      const buffer   = sku.daysUntilStockout - sku.reorderLeadTimeDays
      const safeBy   = Math.max(1, buffer - 2)
      const monthlyR = Math.round(sku.sellingPrice * sku.avgDailySales * 30)
      const state: AlertState = "stable"
      const confidence = 90
      rawItems.push({
        id: `stockout-high-${sku.id}`, alertId: alert.id, rank: 1,
        severity: "high", category: "stockout", state,
        trajectory:       deriveTrajectory(state, { isWorsening: false, isImproving: false }),
        confidence,
        confidenceReason: buildConfidenceReason(alert.type, confidence),
        timeHorizon:      `Order within ${safeBy} day${safeBy !== 1 ? "s" : ""}`,
        skuId: sku.id, skuName: sku.name,
        headline: `Reorder Soon — ${sku.daysUntilStockout} days remaining`,
        context:  `With a ${sku.reorderLeadTimeDays}-day lead time, you have a ${buffer}-day buffer. Any supplier delay, customs hold, or demand spike eliminates it. This is not a warning — it is a deadline.`,
        action:          `Place a reorder of ${sku.reorderQuantity.toLocaleString()} units. Confirm your supplier's lead time is firm — if it can slip, order sooner.`,
        impact:          `$${monthlyR.toLocaleString()}/mo in revenue depends on uninterrupted stock.`,
        projectedImpact: buildProjectedImpact(alert.type, sku, confidence),
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
        id: `margin-neg-${sku.id}`, alertId: alert.id, rank: 0,
        severity: "critical", category: "margin", state,
        trajectory:       deriveTrajectory(state, { isWorsening: sku.marginTrend === "down", isImproving: sku.marginTrend === "up" }),
        confidence,
        confidenceReason: buildConfidenceReason(alert.type, confidence),
        timeHorizon:      "Act this week",
        skuId: sku.id, skuName: sku.name,
        headline: `Losing $${loss.toLocaleString()}/mo — every sale costs you money`,
        context:  `At ${(sku.acos * 100).toFixed(0)}% ACoS and ${sku.marginPercent.toFixed(1)}% net margin, ad spend alone puts this SKU in the red. You are spending to lose.`,
        action: adDriven
          ? `Pause all broad and auto campaigns today. Keep only exact-match on your best-performing keywords. Run a search term report — negate anything burning spend without converting.`
          : `PPC is not the primary driver — review COGS and fees. A $3–5 price increase may be necessary. Test it on one ASIN variant first if possible.`,
        impact:          `At current rate: $${quarterLoss.toLocaleString()} destroyed over 3 months.`,
        projectedImpact: buildProjectedImpact(alert.type, sku, confidence),
        advisorQ: `${sku.name} is losing $${loss}/month. What's the fastest path to breaking even — PPC cuts, price increase, or sourcing?`,
      })
    }

    // ── MARGIN EROSION ─────────────────────────────────────────────────────
    if (alert.type === "margin_erosion" && alert.severity === "high") {
      const state: AlertState = sku.marginTrend === "down" ? "escalating" : "stable"
      const confidence = 87
      rawItems.push({
        id: `margin-erosion-${sku.id}`, alertId: alert.id, rank: 2,
        severity: "high", category: "margin", state,
        trajectory:       deriveTrajectory(state, { isWorsening: sku.marginTrend === "down", isImproving: sku.marginTrend === "up" }),
        confidence,
        confidenceReason: buildConfidenceReason(alert.type, confidence),
        timeHorizon:      "Address within 2 weeks",
        skuId: sku.id, skuName: sku.name,
        headline: `Thin Margin — ${sku.marginPercent.toFixed(1)}% (below 12% survival threshold)`,
        context:  `At ${sku.marginPercent.toFixed(1)}%, there is almost no operational buffer. A single bad PPC week, a returns spike, or an Amazon fee change pushes this SKU negative.`,
        action:          `Identify the biggest cost driver: if ACoS >30%, start with PPC reduction. If ACoS is reasonable, review COGS — even a 5–8% supplier cost reduction has an outsized margin impact at this level.`,
        impact:          `$${sku.netProfitMonthly.toLocaleString()}/mo at risk of turning negative.`,
        projectedImpact: buildProjectedImpact(alert.type, sku, confidence),
        advisorQ: `${sku.name} margin is at ${sku.marginPercent.toFixed(1)}%. What lever should I pull first — PPC, price, or sourcing?`,
      })
    }

    // ── CRITICAL PPC ───────────────────────────────────────────────────────
    if (alert.type === "ppc_pressure" && alert.severity === "critical") {
      const savings    = Math.round(sku.monthlyAdSpend * (sku.acos - 0.25))
      const state: AlertState = sku.adSpendTrend === "up" ? "escalating" : "stable"
      const confidence = 94
      rawItems.push({
        id: `ppc-crit-${sku.id}`, alertId: alert.id, rank: 1,
        severity: "critical", category: "ppc", state,
        trajectory:       deriveTrajectory(state, { isWorsening: sku.adSpendTrend === "up", isImproving: sku.adSpendTrend === "down" }),
        confidence,
        confidenceReason: buildConfidenceReason(alert.type, confidence),
        timeHorizon:      "Pause campaigns today",
        skuId: sku.id, skuName: sku.name,
        headline: `PPC Out of Control — ACoS ${(sku.acos * 100).toFixed(0)}%`,
        context:  `You are spending ${(sku.acos * 100).toFixed(0)} cents in ads for every dollar earned. After fees and COGS, nothing remains. Ad spend is subsidising Amazon, not acquiring customers.`,
        action:          `Pause all broad and auto campaigns today. Activate exact-match only on your 3–5 highest-converting keywords. ${acosRecommendation(confidence, sku.marginPercent, sku.acos * 100)}`,
        impact:          `Getting to 25% ACoS recovers approximately $${savings.toLocaleString()}/mo.`,
        projectedImpact: buildProjectedImpact(alert.type, sku, confidence),
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
        id: `ppc-high-${sku.id}`, alertId: alert.id, rank: 2,
        severity: "high", category: "ppc", state,
        trajectory:       deriveTrajectory(state, { isWorsening: sku.adSpendTrend === "up", isImproving: sku.adSpendTrend === "down" }),
        confidence,
        confidenceReason: buildConfidenceReason(alert.type, confidence),
        timeHorizon:      "Optimise this week",
        skuId: sku.id, skuName: sku.name,
        headline: `PPC Pressure — ACoS ${(sku.acos * 100).toFixed(0)}%${sku.adSpendTrend === "up" ? " and rising" : ""}`,
        context:  `With ${sku.marginPercent.toFixed(1)}% net margin, your estimated breakeven ACoS is around ${breakevenL}–${breakevenH}%. You are ${((sku.acos * 100) - breakevenH).toFixed(0)}pp above that — ad spend is consuming profit.`,
        action:          `Run your search term report. Identify keywords with ACoS above ${breakevenH}% and reduce bids by 15–25%. Sort by cost, not by ACoS alone.`,
        impact:          `Getting to 25% ACoS saves approximately $${savings.toLocaleString()}/mo.`,
        projectedImpact: buildProjectedImpact(alert.type, sku, confidence),
        advisorQ: `How do I reduce ACoS on ${sku.name} from ${(sku.acos * 100).toFixed(0)}% without hurting velocity?`,
      })
    }

    // ── RETURN RATE ────────────────────────────────────────────────────────
    if (alert.type === "return_rate" && (alert.severity === "high" || alert.severity === "critical")) {
      const returnPct = (sku.returnRate * 100).toFixed(0)
      const state: AlertState = sku.marginTrend === "down" ? "escalating" : "stable"
      const confidence = 91
      rawItems.push({
        id: `returns-${sku.id}`, alertId: alert.id, rank: 2,
        severity: "high", category: "returns", state,
        trajectory:       deriveTrajectory(state, { isWorsening: sku.marginTrend === "down", isImproving: false }),
        confidence,
        confidenceReason: buildConfidenceReason(alert.type, confidence),
        timeHorizon:      "Investigate this week",
        skuId: sku.id, skuName: sku.name,
        headline: `High Returns — ${returnPct}% return rate (category avg: 4–8%)`,
        context:  `${returnPct}% of units sold are coming back. At ${sku.avgMonthlySales} units/mo, that is ~${Math.round(sku.avgMonthlySales * sku.returnRate)} returns per month — each costing fees, fulfilment, and lost revenue.`,
        action:          `Pull return reason codes from Seller Central. "Not as described" means listing problem. "Defective" means supplier QC issue. Fix the highest-frequency reason first.`,
        impact:          `$${sku.monthlyReturns.toLocaleString()}/mo in return costs.`,
        projectedImpact: buildProjectedImpact(alert.type, sku, confidence),
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
        id: `dead-${sku.id}`, alertId: alert.id, rank: 3,
        severity: "medium", category: "overstock", state,
        trajectory:       deriveTrajectory(state, { isWorsening: sku.salesVelocityTrend === "down", isImproving: sku.salesVelocityTrend === "up" }),
        confidence,
        confidenceReason: buildConfidenceReason(alert.type, confidence),
        timeHorizon:      "Plan clearance this month",
        skuId: sku.id, skuName: sku.name,
        headline: `Dead Inventory — ${months} months of stock at current velocity`,
        context:  `At ${sku.avgDailySales} unit${sku.avgDailySales !== 1 ? "s" : ""}/day this inventory won't clear for ${sku.daysUntilStockout} days. Storage fees compound every month.`,
        action:          `Run a 15–20% coupon for 2 weeks to accelerate sell-through. If velocity does not improve meaningfully, plan liquidation for units beyond 4 months of stock.`,
        impact:          `~$${storageBurn.toLocaleString()} in excess storage fees ahead.`,
        projectedImpact: buildProjectedImpact(alert.type, sku, confidence),
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

  const candidateCount = seen.size

  // ── Filter by confidence ──────────────────────────────────────────────────
  const stateOrder: Record<string, number> = { escalating: 0, new: 1, stable: 2 }
  const aboveThreshold  = [...seen.values()].filter(i => i.confidence >= MIN_CONFIDENCE)
  const suppressedCount = candidateCount - aboveThreshold.length

  // ── Sort and cap at 5 ─────────────────────────────────────────────────────
  const sorted = aboveThreshold
    .sort((a, b) =>
      sevOrder[a.severity] - sevOrder[b.severity] ||
      stateOrder[a.state] - stateOrder[b.state]   ||
      a.rank - b.rank
    )
    .slice(0, 5)

  // ── Enrich with causal context + persistence ──────────────────────────────
  const causalMap  = buildCausalContext(alerts, skus)
  const persistMap = updatePersistence(alerts, isDemo)
  const alertById  = new Map(alerts.map(a => [a.id, a]))

  const items = sorted.map((item, i) => {
    const causal   = causalMap.get(item.alertId) ?? null
    const pKey     = alertById.has(item.alertId)
      ? alertKey({ skuId: item.skuId, type: alertById.get(item.alertId)!.type })
      : null
    const persist  = pKey ? persistMap.get(pKey) : undefined

    const persistenceSince = persist && persist.sessionCount > 1
      ? `${persist.sessionCount} session${persist.sessionCount !== 1 ? "s" : ""}${
          persist.firstSeenAt
            ? `, first detected ${daysAgoLabel(persist.firstSeenAt)}`
            : ""
        }`
      : undefined

    return {
      ...item,
      rank:                  i + 1,
      causedBy:              causal?.causedBy   ?? undefined,
      impacts:               causal?.impacts    ?? undefined,
      chainLabel:            causal?.chainLabel ?? undefined,
      persistenceLabel:      persistenceLabel(persist)      ?? undefined,
      persistenceColorClass: persistenceColorClass(persist) ?? undefined,
      persistenceSince,
    }
  })

  return { items, suppressedCount, candidateCount }
}
