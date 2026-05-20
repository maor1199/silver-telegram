// ─── Priority Feed — "What needs attention NOW" ───────────────────────────────
// Converts risk alerts into a ranked, action-oriented feed.
// Each item has: what is happening, why it matters, exactly what to do, and the impact.
// This IS the homepage. Not tabs. Not charts. Action items.

import type { SKU, RiskAlert } from "./types"

// ─── Types ────────────────────────────────────────────────────────────────────

export type PriorityCategory = "stockout" | "margin" | "ppc" | "returns" | "overstock"

export type PriorityItem = {
  id: string
  rank: number
  severity: "critical" | "high" | "medium"
  category: PriorityCategory
  skuId: string
  skuName: string
  headline: string       // "Order Now — 6 days remaining"
  context: string        // "Lead time 28 days. Already 22 days past reorder point."
  action: string         // "Order 500 units immediately"
  impact: string         // "$4,860 revenue at risk if you stock out"
  advisorQ: string       // pre-filled question for AI Advisor
}

// ─── Build feed from alerts + SKU data ───────────────────────────────────────

export function getPriorityFeed(skus: SKU[], alerts: RiskAlert[]): PriorityItem[] {
  const items: PriorityItem[] = []
  const skuMap = new Map(skus.map(s => [s.id, s]))

  for (const alert of alerts) {
    const sku = skuMap.get(alert.skuId)
    if (!sku || sku.status !== "active") continue

    // ── CRITICAL STOCKOUT ─────────────────────────────────────────────────
    if (alert.type === "stockout" && alert.severity === "critical") {
      const stockoutGap = Math.max(0, sku.reorderLeadTimeDays - sku.daysUntilStockout)
      const revenueAtRisk = Math.round(sku.sellingPrice * sku.avgDailySales * (stockoutGap + sku.reorderLeadTimeDays))
      items.push({
        id: `stockout-critical-${sku.id}`,
        rank: 0,
        severity: "critical",
        category: "stockout",
        skuId: sku.id,
        skuName: sku.name,
        headline: `Order Now — ${sku.daysUntilStockout} days of stock remaining`,
        context: `Lead time is ${sku.reorderLeadTimeDays} days. You are already ${stockoutGap} day${stockoutGap !== 1 ? "s" : ""} past your reorder point. Stock out is inevitable without an order today.`,
        action: `Place an order for ${sku.reorderQuantity.toLocaleString()} units immediately — request expedited shipping`,
        impact: `$${revenueAtRisk.toLocaleString()} in revenue at risk. Rank recovery after stockout takes 2–4× the OOS period.`,
        advisorQ: `Walk me through the reorder plan for ${sku.name} — it stocks out in ${sku.daysUntilStockout} days and my lead time is ${sku.reorderLeadTimeDays} days`,
      })
    }

    // ── HIGH STOCKOUT (reorder soon) ──────────────────────────────────────
    if (alert.type === "stockout" && alert.severity === "high") {
      const buffer = sku.daysUntilStockout - sku.reorderLeadTimeDays
      items.push({
        id: `stockout-high-${sku.id}`,
        rank: 1,
        severity: "high",
        category: "stockout",
        skuId: sku.id,
        skuName: sku.name,
        headline: `Reorder Soon — ${sku.daysUntilStockout} days remaining`,
        context: `With a ${sku.reorderLeadTimeDays}-day lead time, you have only ${buffer} day${buffer !== 1 ? "s" : ""} of safety buffer left. Any delay in ordering risks a gap.`,
        action: `Place reorder of ${sku.reorderQuantity.toLocaleString()} units within the next ${Math.max(1, buffer - 3)} days`,
        impact: `$${Math.round(sku.sellingPrice * sku.avgDailySales * 30).toLocaleString()}/mo in revenue depends on continuous stock`,
        advisorQ: `When exactly should I reorder ${sku.name}? I have ${sku.daysUntilStockout} days left and ${sku.reorderLeadTimeDays}-day lead time`,
      })
    }

    // ── NEGATIVE MARGIN (losing money) ────────────────────────────────────
    if (alert.type === "negative_margin") {
      const monthlyLoss = Math.abs(sku.netProfitMonthly)
      items.push({
        id: `margin-negative-${sku.id}`,
        rank: 0,
        severity: "critical",
        category: "margin",
        skuId: sku.id,
        skuName: sku.name,
        headline: `Losing Money — $${monthlyLoss.toLocaleString()}/mo net loss`,
        context: `ACoS at ${(sku.acos * 100).toFixed(0)}% with ${sku.marginPercent.toFixed(1)}% margin leaves nothing after ad spend. You are paying to sell this product.`,
        action: sku.acos >= 0.40
          ? "Pause all broad/auto campaigns. Keep only exact-match on proven keywords. Target ACoS below 25%."
          : "Raise price by $4–7 and monitor conversion. Review COGS for sourcing improvements.",
        impact: `Burning $${monthlyLoss.toLocaleString()} every month. Over 3 months: $${(monthlyLoss * 3).toLocaleString()} destroyed.`,
        advisorQ: `${sku.name} is losing $${monthlyLoss}/month. How do I fix this — cut PPC, raise price, or stop selling it?`,
      })
    }

    // ── MARGIN EROSION (thin but not negative) ────────────────────────────
    if (alert.type === "margin_erosion" && alert.severity === "high") {
      items.push({
        id: `margin-erosion-${sku.id}`,
        rank: 2,
        severity: "high",
        category: "margin",
        skuId: sku.id,
        skuName: sku.name,
        headline: `Thin Margin — ${sku.marginPercent.toFixed(1)}% (survival threshold: 12%)`,
        context: `At ${sku.marginPercent.toFixed(1)}%, one bad PPC week, a returns spike, or a fee change can push this SKU into loss territory. There is almost no buffer.`,
        action: "Target 18% margin: raise price by $2–3, cut ACoS to <30%, or renegotiate COGS with supplier.",
        impact: `Monthly profit of $${sku.netProfitMonthly.toLocaleString()} could turn negative within 30 days`,
        advisorQ: `${sku.name} margin is at ${sku.marginPercent.toFixed(1)}%. What are my options to get it to 18%+?`,
      })
    }

    // ── CRITICAL PPC (ACoS >50%) ──────────────────────────────────────────
    if (alert.type === "ppc_pressure" && alert.severity === "critical") {
      const savings = Math.round(sku.monthlyAdSpend * (sku.acos - 0.25))
      items.push({
        id: `ppc-critical-${sku.id}`,
        rank: 1,
        severity: "critical",
        category: "ppc",
        skuId: sku.id,
        skuName: sku.name,
        headline: `PPC Out of Control — ACoS ${(sku.acos * 100).toFixed(0)}%`,
        context: `${(sku.acos * 100).toFixed(0)} cents of every dollar earned from ads goes straight back to Amazon. Ad spend is destroying what margin remains.`,
        action: "Pause all broad/auto campaigns immediately. Run exact-match only on top-5 proven keywords. Cap daily budget.",
        impact: `Cutting ACoS to 25% would recover ~$${savings.toLocaleString()}/mo in profit`,
        advisorQ: `How do I cut ACoS on ${sku.name} from ${(sku.acos * 100).toFixed(0)}% down to 25% without losing rank?`,
      })
    }

    // ── HIGH PPC (ACoS 35-50%, trending up) ──────────────────────────────
    if (alert.type === "ppc_pressure" && alert.severity === "high") {
      const savings = Math.round(sku.monthlyAdSpend * (sku.acos - 0.25))
      const breakeven = Math.round(sku.marginPercent * 0.75)
      items.push({
        id: `ppc-high-${sku.id}`,
        rank: 2,
        severity: "high",
        category: "ppc",
        skuId: sku.id,
        skuName: sku.name,
        headline: `PPC Pressure — ACoS ${(sku.acos * 100).toFixed(0)}% and rising`,
        context: `With ${sku.marginPercent.toFixed(1)}% margin, your breakeven ACoS is ~${breakeven}%. Ad spend is consuming a growing share of profit.`,
        action: "Review search term report. Negate wasted spend. Lower bids on low-CVR keywords by 15-20%.",
        impact: `Reducing to 25% ACoS saves ~$${savings.toLocaleString()}/mo — adds directly to net profit`,
        advisorQ: `How do I reduce ACoS on ${sku.name} from ${(sku.acos * 100).toFixed(0)}% without hurting sales velocity?`,
      })
    }

    // ── HIGH RETURNS ──────────────────────────────────────────────────────
    if (alert.type === "return_rate" && (alert.severity === "high" || alert.severity === "critical")) {
      const returnPct = (sku.returnRate * 100).toFixed(0)
      items.push({
        id: `returns-${sku.id}`,
        rank: 2,
        severity: "high",
        category: "returns",
        skuId: sku.id,
        skuName: sku.name,
        headline: `High Returns — ${returnPct}% return rate (avg: 4%)`,
        context: `Every return costs ~$${Math.round(sku.sellingPrice * 0.25)} in lost fees and processing. At ${returnPct}% you are losing $${sku.monthlyReturns.toLocaleString()} every month to returns alone.`,
        action: "Pull return reason report in Seller Central. 'Not as described' → fix listing. 'Defective' → contact supplier QC. Review listing images vs actual product.",
        impact: `$${sku.monthlyReturns.toLocaleString()}/mo in return costs — fixing this adds directly to bottom line`,
        advisorQ: `Why is my return rate on ${sku.name} so high at ${returnPct}%? What should I check first?`,
      })
    }

    // ── DEAD INVENTORY ────────────────────────────────────────────────────
    if (alert.type === "dead_inventory") {
      const monthsOfStock = Math.round(sku.daysUntilStockout / 30)
      const storageCostAhead = Math.round(sku.monthlyStorageFee * monthsOfStock)
      items.push({
        id: `dead-${sku.id}`,
        rank: 3,
        severity: "medium",
        category: "overstock",
        skuId: sku.id,
        skuName: sku.name,
        headline: `Dead Inventory — ${monthsOfStock} months of stock at current velocity`,
        context: `At ${sku.avgDailySales} unit${sku.avgDailySales !== 1 ? "s" : ""}/day, this stock won't clear for ${sku.daysUntilStockout} days. Storage fees are compounding and velocity is declining.`,
        action: "Run a 15–20% coupon or Lightning Deal to accelerate sell-through. Consider liquidation for units beyond 4 months of stock.",
        impact: `~$${storageCostAhead.toLocaleString()} in storage fees if not addressed — plus capital tied up in unsold units`,
        advisorQ: `I have ${monthsOfStock} months of stock for ${sku.name}. What's the best strategy to clear it without destroying margin?`,
      })
    }

    // ── OVERSTOCK ─────────────────────────────────────────────────────────
    if (alert.type === "overstock") {
      const monthsOfStock = Math.round(sku.daysUntilStockout / 30)
      items.push({
        id: `overstock-${sku.id}`,
        rank: 3,
        severity: "medium",
        category: "overstock",
        skuId: sku.id,
        skuName: sku.name,
        headline: `Overstock Risk — ${monthsOfStock} months of inventory`,
        context: `Sales velocity is declining while stock is high. This gap will widen. Storage fees will compound until action is taken.`,
        action: "Investigate why velocity is declining — competitor pricing, listing quality, seasonality. Run a targeted promo.",
        impact: `Storage fees accumulating at $${sku.monthlyStorageFee.toLocaleString()}/mo`,
        advisorQ: `${sku.name} has ${monthsOfStock} months of stock and velocity is declining. How do I address this?`,
      })
    }
  }

  // Dedup (same SKU can appear via multiple alert paths — keep highest severity)
  const seen = new Map<string, PriorityItem>()
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2 }
  for (const item of items) {
    const existing = seen.get(item.skuId + item.category)
    if (!existing || severityOrder[item.severity] < severityOrder[existing.severity]) {
      seen.set(item.skuId + item.category, item)
    }
  }

  // Sort by severity → rank, then assign final rank numbers
  return [...seen.values()]
    .sort((a, b) =>
      (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3) ||
      a.rank - b.rank
    )
    .map((item, i) => ({ ...item, rank: i + 1 }))
}
