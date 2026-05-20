// ─── Priority Feed — "What needs attention NOW" ───────────────────────────────
// Hard cap: 5 items maximum. Signal quality over volume.
// Every item has a state, confidence, time horizon, and concrete action.
// "Monitor this SKU" is not a recommendation. Numbers + deadlines are.

import type { SKU, RiskAlert } from "./types"

// ─── Types ────────────────────────────────────────────────────────────────────

export type PriorityCategory = "stockout" | "margin" | "ppc" | "returns" | "overstock"

// "new"        — problem just surfaced
// "escalating" — existing problem getting materially worse
// "stable"     — ongoing issue, not worsening
export type AlertState = "new" | "escalating" | "stable"

export type PriorityItem = {
  id: string
  rank: number
  severity: "critical" | "high" | "medium"
  category: PriorityCategory
  state: AlertState
  confidence: number    // 0–100
  timeHorizon: string   // "Act within 2 days", "This week", etc.
  skuId: string
  skuName: string
  headline: string      // "Order Now — 6 days remaining"
  context: string       // Why this matters and what drives the risk
  action: string        // Specific operational instruction with numbers
  impact: string        // Quantified consequence of inaction
  advisorQ: string      // Pre-filled question for AI Advisor
}

// ─── Significance filter ──────────────────────────────────────────────────────
// Items below this confidence threshold are suppressed.
// Prevents alert fatigue from borderline signals.
const MIN_CONFIDENCE = 72

// ─── Build feed ───────────────────────────────────────────────────────────────

export function getPriorityFeed(skus: SKU[], alerts: RiskAlert[]): PriorityItem[] {
  const items: PriorityItem[] = []
  const skuMap = new Map(skus.map(s => [s.id, s]))

  for (const alert of alerts) {
    const sku = skuMap.get(alert.skuId)
    if (!sku || sku.status !== "active") continue

    // ── CRITICAL STOCKOUT ──────────────────────────────────────────────────
    if (alert.type === "stockout" && alert.severity === "critical") {
      const daysOver = Math.max(0, sku.reorderLeadTimeDays - sku.daysUntilStockout)
      const revenueAtRisk = Math.round(sku.sellingPrice * sku.avgDailySales * (daysOver + sku.reorderLeadTimeDays))
      const daysToAct = Math.max(0, sku.daysUntilStockout - 1)
      items.push({
        id: `stockout-crit-${sku.id}`,
        rank: 0,
        severity: "critical",
        category: "stockout",
        state: daysOver > 0 ? "escalating" : "new",
        confidence: 97,
        timeHorizon: daysToAct <= 1 ? "Act today" : `Act within ${daysToAct} day${daysToAct !== 1 ? "s" : ""}`,
        skuId: sku.id,
        skuName: sku.name,
        headline: `Order Now — ${sku.daysUntilStockout} day${sku.daysUntilStockout !== 1 ? "s" : ""} of stock remaining`,
        context: `Lead time is ${sku.reorderLeadTimeDays} days. You are ${daysOver > 0 ? `already ${daysOver} day${daysOver !== 1 ? "s" : ""} past` : "at"} your reorder point. A stockout gap of ${daysOver} day${daysOver !== 1 ? "s" : ""} is now baked in unless you order today.`,
        action: `Place an order for ${sku.reorderQuantity.toLocaleString()} units immediately. Request expedited shipping — standard lead time no longer sufficient.`,
        impact: `$${revenueAtRisk.toLocaleString()} revenue at risk. Amazon rank recovery after stockout takes 2–4× the OOS duration.`,
        advisorQ: `Walk me through the reorder plan for ${sku.name} — it stocks out in ${sku.daysUntilStockout} days but my lead time is ${sku.reorderLeadTimeDays} days`,
      })
    }

    // ── HIGH STOCKOUT (reorder soon) ────────────────────────────────────────
    if (alert.type === "stockout" && alert.severity === "high") {
      const buffer = sku.daysUntilStockout - sku.reorderLeadTimeDays
      const safeOrderBy = Math.max(1, buffer - 2)
      items.push({
        id: `stockout-high-${sku.id}`,
        rank: 1,
        severity: "high",
        category: "stockout",
        state: "stable",
        confidence: 90,
        timeHorizon: `Order within ${safeOrderBy} day${safeOrderBy !== 1 ? "s" : ""}`,
        skuId: sku.id,
        skuName: sku.name,
        headline: `Reorder Soon — ${sku.daysUntilStockout} days remaining`,
        context: `With a ${sku.reorderLeadTimeDays}-day lead time, you have a ${buffer}-day safety buffer. Any supplier delay, customs hold, or demand spike eliminates that buffer entirely.`,
        action: `Reorder ${sku.reorderQuantity.toLocaleString()} units within ${safeOrderBy} days to maintain continuous stock. Confirm with supplier lead time is firm.`,
        impact: `$${Math.round(sku.sellingPrice * sku.avgDailySales * 30).toLocaleString()}/mo revenue depends on uninterrupted stock.`,
        advisorQ: `When exactly should I reorder ${sku.name}? I have ${sku.daysUntilStockout} days remaining and a ${sku.reorderLeadTimeDays}-day lead time`,
      })
    }

    // ── NEGATIVE MARGIN (losing money) ─────────────────────────────────────
    if (alert.type === "negative_margin") {
      const monthlyLoss = Math.abs(sku.netProfitMonthly)
      const acosIsPrimaryDriver = sku.acos >= 0.40
      items.push({
        id: `margin-neg-${sku.id}`,
        rank: 0,
        severity: "critical",
        category: "margin",
        state: sku.marginTrend === "down" ? "escalating" : "stable",
        confidence: 99,
        timeHorizon: "Act this week",
        skuId: sku.id,
        skuName: sku.name,
        headline: `Losing $${monthlyLoss.toLocaleString()}/mo — every sale costs you money`,
        context: `ACoS at ${(sku.acos * 100).toFixed(0)}% against a ${sku.marginPercent.toFixed(1)}% gross margin means ad spend alone puts this SKU in the red. Net profit is ${sku.netProfitPerUnit < 0 ? `-$${Math.abs(sku.netProfitPerUnit).toFixed(2)}` : "$0.00"} per unit sold.`,
        action: acosIsPrimaryDriver
          ? `Pause all broad/auto campaigns today. Keep only exact-match on top-3 proven ASINs. Target ACoS below ${Math.round(sku.marginPercent * 0.6)}% to break even. Then raise price by $4–6 to rebuild margin.`
          : `Raise selling price by $5–8 (test conversion impact). Review COGS — negotiate with supplier or find alternate source. Current unit economics do not support this business.`,
        impact: `At current run rate: $${(monthlyLoss * 3).toLocaleString()} destroyed over 3 months. Each unit sold accelerates the loss.`,
        advisorQ: `${sku.name} is losing $${monthlyLoss}/month. Should I pause PPC, raise price, or stop selling it?`,
      })
    }

    // ── MARGIN EROSION (thin, not yet negative) ────────────────────────────
    if (alert.type === "margin_erosion" && alert.severity === "high") {
      const monthsToLoss = sku.marginPercent > 0
        ? Math.round(sku.marginPercent / Math.max(0.5, Math.abs((sku.marginPercent - 18) / 3)))
        : 0
      items.push({
        id: `margin-erosion-${sku.id}`,
        rank: 2,
        severity: "high",
        category: "margin",
        state: sku.marginTrend === "down" ? "escalating" : "stable",
        confidence: 87,
        timeHorizon: "Address within 2 weeks",
        skuId: sku.id,
        skuName: sku.name,
        headline: `Thin Margin — ${sku.marginPercent.toFixed(1)}% (danger zone below 12%)`,
        context: `At ${sku.marginPercent.toFixed(1)}%, a single bad week of PPC, a returns spike, or a fee increase pushes this SKU into loss. There is almost no operational buffer.`,
        action: `Target 18% margin via one or more: raise price $2–3, cut ACoS to below ${Math.round(sku.marginPercent * 0.65)}%, renegotiate COGS by 5-8%.`,
        impact: `Monthly profit of $${sku.netProfitMonthly.toLocaleString()} could turn negative within ${monthsToLoss > 0 ? `${monthsToLoss} month${monthsToLoss !== 1 ? "s" : ""}` : "weeks"} at current trend.`,
        advisorQ: `${sku.name} margin is at ${sku.marginPercent.toFixed(1)}%. What are the most realistic options to reach 18%+?`,
      })
    }

    // ── CRITICAL PPC (ACoS ≥50%) ───────────────────────────────────────────
    if (alert.type === "ppc_pressure" && alert.severity === "critical") {
      const savings = Math.round(sku.monthlyAdSpend * (sku.acos - 0.25))
      items.push({
        id: `ppc-crit-${sku.id}`,
        rank: 1,
        severity: "critical",
        category: "ppc",
        state: sku.adSpendTrend === "up" ? "escalating" : "stable",
        confidence: 94,
        timeHorizon: "Pause campaigns today",
        skuId: sku.id,
        skuName: sku.name,
        headline: `PPC Out of Control — ACoS ${(sku.acos * 100).toFixed(0)}%`,
        context: `${(sku.acos * 100).toFixed(0)}% ACoS means you are spending $${(sku.monthlyAdSpend / Math.max(sku.avgMonthlySales, 1)).toFixed(2)} in ads per unit sold. After fees and COGS, ad spend alone puts this SKU at a loss.`,
        action: `Today: pause all broad/auto campaigns. Run exact-match only on top 5 keywords with bids capped at $${(sku.sellingPrice * 0.12).toFixed(2)}/click. Review search term report weekly.`,
        impact: `Cutting ACoS to 25% recovers ~$${savings.toLocaleString()}/mo in profit. At current rate, ad budget is subsidising Amazon, not building your business.`,
        advisorQ: `How do I cut ACoS on ${sku.name} from ${(sku.acos * 100).toFixed(0)}% to 25% without killing organic rank?`,
      })
    }

    // ── HIGH PPC (ACoS 35–50%, trending up) ───────────────────────────────
    if (alert.type === "ppc_pressure" && alert.severity === "high") {
      const savings = Math.round(sku.monthlyAdSpend * (sku.acos - 0.25))
      const breakeven = Math.round(sku.marginPercent * 0.70)
      items.push({
        id: `ppc-high-${sku.id}`,
        rank: 2,
        severity: "high",
        category: "ppc",
        state: sku.adSpendTrend === "up" ? "escalating" : "stable",
        confidence: 83,
        timeHorizon: "Optimise this week",
        skuId: sku.id,
        skuName: sku.name,
        headline: `PPC Pressure — ACoS ${(sku.acos * 100).toFixed(0)}% and ${sku.adSpendTrend === "up" ? "rising" : "elevated"}`,
        context: `With ${sku.marginPercent.toFixed(1)}% margin, your breakeven ACoS is ~${breakeven}%. You are ${((sku.acos * 100) - breakeven).toFixed(0)}pp above breakeven — ad spend is consuming profit that should exist.`,
        action: `Run search term report. Negate the bottom 20% of keywords by ACOS. Reduce broad match bids by 15%. Do not pause — just constrain.`,
        impact: `Bringing ACoS to 25% saves ~$${savings.toLocaleString()}/mo — adds directly to net profit with no change to revenue.`,
        advisorQ: `How do I reduce ACoS on ${sku.name} from ${(sku.acos * 100).toFixed(0)}% without hurting sales velocity?`,
      })
    }

    // ── HIGH RETURNS ────────────────────────────────────────────────────────
    if (alert.type === "return_rate" && (alert.severity === "high" || alert.severity === "critical")) {
      const returnPct = (sku.returnRate * 100).toFixed(0)
      const processingCostEst = Math.round(sku.sellingPrice * 0.25)
      items.push({
        id: `returns-${sku.id}`,
        rank: 2,
        severity: "high",
        category: "returns",
        state: sku.marginTrend === "down" ? "escalating" : "stable",
        confidence: 91,
        timeHorizon: "Investigate this week",
        skuId: sku.id,
        skuName: sku.name,
        headline: `High Returns — ${returnPct}% rate (category avg: 4–8%)`,
        context: `Every return costs ~$${processingCostEst} in lost fees and processing. At ${returnPct}% on ${sku.avgMonthlySales} units/mo, you are losing $${sku.monthlyReturns.toLocaleString()} per month to returns before any other cost.`,
        action: `Pull return reason report in Seller Central. "Not as described" → fix listing images/copy. "Defective" → contact supplier QC and request batch test. "Changed mind" → review pricing vs perceived value.`,
        impact: `$${sku.monthlyReturns.toLocaleString()}/mo in return costs. Amazon flags accounts with sustained >20% return rates — suspension risk above that threshold.`,
        advisorQ: `Why is my return rate on ${sku.name} at ${returnPct}%? What should I check first?`,
      })
    }

    // ── DEAD INVENTORY ──────────────────────────────────────────────────────
    if (alert.type === "dead_inventory") {
      const monthsOfStock = Math.round(sku.daysUntilStockout / 30)
      const storageBurn = Math.round(sku.monthlyStorageFee * Math.max(0, monthsOfStock - 2))
      items.push({
        id: `dead-${sku.id}`,
        rank: 3,
        severity: "medium",
        category: "overstock",
        state: sku.salesVelocityTrend === "down" ? "escalating" : "stable",
        confidence: 86,
        timeHorizon: "Plan clearance this month",
        skuId: sku.id,
        skuName: sku.name,
        headline: `Dead Inventory — ${monthsOfStock} months of stock at current velocity`,
        context: `At ${sku.avgDailySales} unit${sku.avgDailySales !== 1 ? "s" : ""}/day, this inventory won't clear for ${sku.daysUntilStockout} days. Amazon long-term storage fees apply after 365 days and accelerate rapidly.`,
        action: `Run a 15–20% coupon for 2 weeks to accelerate sell-through. If velocity is still <${Math.ceil(sku.avgDailySales * 1.5)} units/day after that, begin liquidation for units beyond 4 months of stock.`,
        impact: `~$${storageBurn.toLocaleString()} in excess storage fees ahead. Capital tied up in ${sku.currentInventory.toLocaleString()} unsold units could be redeployed.`,
        advisorQ: `I have ${monthsOfStock} months of ${sku.name} inventory. What's the best strategy to clear it without destroying margin?`,
      })
    }
  }

  // Dedup: same SKU + category → keep highest severity item only
  const seen = new Map<string, PriorityItem>()
  const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2 }
  for (const item of items) {
    const key = `${item.skuId}::${item.category}`
    const existing = seen.get(key)
    if (!existing || sevOrder[item.severity] < sevOrder[existing.severity]) {
      seen.set(key, item)
    }
  }

  // Filter below confidence threshold, sort by severity → state → rank
  const stateOrder: Record<string, number> = { escalating: 0, new: 1, stable: 2 }
  const sorted = [...seen.values()]
    .filter(i => i.confidence >= MIN_CONFIDENCE)
    .sort((a, b) =>
      sevOrder[a.severity] - sevOrder[b.severity] ||
      stateOrder[a.state] - stateOrder[b.state] ||
      a.rank - b.rank
    )

  // Hard cap: never more than 5 items. Signal must stay strong.
  return sorted
    .slice(0, 5)
    .map((item, i) => ({ ...item, rank: i + 1 }))
}
