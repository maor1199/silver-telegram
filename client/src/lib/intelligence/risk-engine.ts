import type {
  SKU,
  RiskAlert,
  RiskSeverity,
  BusinessHealthSummary,
  HealthStatus,
  InventorySnapshot,
  InventoryStatus,
  ProfitSnapshot,
  ProfitStatus,
} from "./types"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeId(skuId: string, type: string): string {
  return `${skuId}-${type}`
}

function fmt(n: number): string {
  return n >= 0 ? `+$${n.toLocaleString()}` : `-$${Math.abs(n).toLocaleString()}`
}

// ─── Inventory Risk ───────────────────────────────────────────────────────────

export function assessStockoutRisk(sku: SKU): RiskAlert | null {
  const { daysUntilStockout, reorderLeadTimeDays, avgDailySales } = sku
  if (avgDailySales <= 0) return null

  const gapDays = daysUntilStockout - reorderLeadTimeDays
  const revenueAtRisk = Math.round(sku.avgDailySales * sku.sellingPrice * Math.abs(gapDays))

  if (daysUntilStockout <= 0) {
    return {
      id: makeId(sku.id, "stockout"),
      skuId: sku.id,
      skuName: sku.name,
      type: "stockout",
      severity: "critical",
      title: `${sku.name} is out of stock`,
      description: "This SKU has zero inventory remaining. All sales are stopped.",
      whyItMatters: `You are losing ~$${Math.round(sku.avgDailySales * sku.sellingPrice)}/day in revenue while out of stock. Rank drops compound every day.`,
      estimatedImpact: `-$${revenueAtRisk.toLocaleString()} in lost revenue + ranking loss`,
      recommendedAction: "Place emergency reorder immediately. Consider expedited shipping. Update listing with expected restock date.",
      confidence: 99,
      dataUsed: ["Current inventory: 0 units", `Daily sales velocity: ${avgDailySales} units/day`],
      createdAt: new Date().toISOString(),
      isAcknowledged: false,
    }
  }

  if (daysUntilStockout < reorderLeadTimeDays) {
    const stockoutGap = reorderLeadTimeDays - daysUntilStockout
    return {
      id: makeId(sku.id, "stockout"),
      skuId: sku.id,
      skuName: sku.name,
      type: "stockout",
      severity: "critical",
      title: `Reorder ${sku.name} today — stockout in ${daysUntilStockout} days`,
      description: `Stock will run out in ${daysUntilStockout} days, but your supplier needs ${reorderLeadTimeDays} days to deliver. You are already ${stockoutGap} days past your reorder point.`,
      whyItMatters: `Stockout will last ~${stockoutGap} days minimum. Amazon's algorithm penalises listings that go OOS — rank recovery typically takes 2–4× the OOS period.`,
      estimatedImpact: `-$${Math.round(sku.avgDailySales * sku.sellingPrice * stockoutGap).toLocaleString()} in lost revenue + ${stockoutGap * 2}+ days of rank recovery`,
      recommendedAction: `Order ${sku.reorderQuantity} units immediately. Request expedited shipping. If possible, source a spot order locally to bridge the gap.`,
      confidence: 97,
      dataUsed: [
        `Current stock: ${sku.currentInventory} units`,
        `Daily velocity: ${avgDailySales} units/day`,
        `Lead time: ${reorderLeadTimeDays} days`,
        `Days remaining: ${daysUntilStockout}`,
      ],
      createdAt: new Date().toISOString(),
      isAcknowledged: false,
    }
  }

  if (daysUntilStockout < reorderLeadTimeDays + 14) {
    return {
      id: makeId(sku.id, "stockout"),
      skuId: sku.id,
      skuName: sku.name,
      type: "stockout",
      severity: "high",
      title: `Reorder ${sku.name} within ${daysUntilStockout - reorderLeadTimeDays} days`,
      description: `${daysUntilStockout} days of inventory remaining vs ${reorderLeadTimeDays}-day lead time. Only a ${daysUntilStockout - reorderLeadTimeDays}-day buffer before you must order.`,
      whyItMatters: "Cutting it close on inventory leaves no margin for shipping delays, customs holds, or demand spikes.",
      estimatedImpact: `Stockout risk if not ordered in ${daysUntilStockout - reorderLeadTimeDays} days`,
      recommendedAction: `Place order for ${sku.reorderQuantity} units within ${Math.max(1, daysUntilStockout - reorderLeadTimeDays)} days.`,
      confidence: 90,
      dataUsed: [`Stock: ${sku.currentInventory} units`, `Velocity: ${avgDailySales}/day`, `Lead time: ${reorderLeadTimeDays}d`],
      createdAt: new Date().toISOString(),
      isAcknowledged: false,
    }
  }

  return null
}

export function assessOverstockRisk(sku: SKU): RiskAlert | null {
  const { daysUntilStockout, monthlyStorageFee } = sku
  const monthsOfStock = daysUntilStockout / 30
  const projectedStorageCost = Math.round(monthlyStorageFee * Math.max(0, monthsOfStock - 2))

  if (daysUntilStockout > 240) {
    return {
      id: makeId(sku.id, "dead_inventory"),
      skuId: sku.id,
      skuName: sku.name,
      type: "dead_inventory",
      severity: "high",
      title: `Dead inventory risk — ${Math.round(daysUntilStockout / 30)} months of stock at current velocity`,
      description: `${sku.currentInventory} units on hand at ${sku.avgDailySales} units/day = ${daysUntilStockout} days. Storage fees are compounding with no end in sight.`,
      whyItMatters: `Long-term storage fees will exceed product value. After 365 days at Amazon, overage fees apply. Dead capital that could be reinvested.`,
      estimatedImpact: `-$${projectedStorageCost.toLocaleString()} in excess storage fees over next 6 months`,
      recommendedAction: "Run a targeted promotional campaign or price reduction to accelerate sell-through. Consider liquidation for units beyond 180-day stock needs.",
      confidence: 88,
      dataUsed: [`${sku.currentInventory} units in stock`, `${sku.avgDailySales} units/day velocity`, `Storage: $${monthlyStorageFee}/mo`],
      createdAt: new Date().toISOString(),
      isAcknowledged: false,
    }
  }

  if (daysUntilStockout > 90 && sku.salesVelocityTrend === "down") {
    return {
      id: makeId(sku.id, "overstock"),
      skuId: sku.id,
      skuName: sku.name,
      type: "overstock",
      severity: "medium",
      title: `Overstock building — ${Math.round(daysUntilStockout)} days of inventory with declining velocity`,
      description: `Sales velocity is declining while you have ${Math.round(daysUntilStockout / 30)} months of stock. This gap will widen.`,
      whyItMatters: "Overstock ties up cash and generates storage fees. If velocity continues declining, this becomes a dead inventory problem within 60 days.",
      estimatedImpact: `-$${Math.round(projectedStorageCost * 0.5).toLocaleString()} in excess storage if trend continues`,
      recommendedAction: "Investigate why velocity is declining. Check competitor pricing, listing quality, and review trends. Consider a limited promotion.",
      confidence: 72,
      dataUsed: [`${sku.currentInventory} units`, `${sku.avgDailySales}/day`, "Velocity trend: ↓ declining"],
      createdAt: new Date().toISOString(),
      isAcknowledged: false,
    }
  }

  return null
}

// ─── Profit & Margin Risk ─────────────────────────────────────────────────────

export function assessMarginRisk(sku: SKU): RiskAlert | null {
  const { marginPercent, netProfitMonthly, name } = sku

  if (marginPercent < 0) {
    return {
      id: makeId(sku.id, "negative_margin"),
      skuId: sku.id,
      skuName: name,
      type: "negative_margin",
      severity: "critical",
      title: `${name} is losing money — ${marginPercent.toFixed(1)}% margin`,
      description: `Every sale of ${name} costs you money. After fees, PPC, returns, and storage, your net profit is $${sku.netProfitPerUnit.toFixed(2)}/unit.`,
      whyItMatters: "Selling at a loss does not build a business. Each unit sold destroys capital. Without intervention, this SKU will drain cash for the entire inventory cycle.",
      estimatedImpact: `${fmt(Math.round(netProfitMonthly))}/month (${Math.round(sku.avgMonthlySales * Math.abs(sku.netProfitPerUnit))} units × $${Math.abs(sku.netProfitPerUnit).toFixed(2)} loss each)`,
      recommendedAction: "Immediately reduce ad spend to minimum or pause non-performing campaigns. Raise price by $5–8 and A/B test conversion. Review COGS for sourcing improvements.",
      confidence: 99,
      dataUsed: [`Net profit: $${sku.netProfitPerUnit.toFixed(2)}/unit`, `ACoS: ${(sku.acos * 100).toFixed(0)}%`, `Return rate: ${(sku.returnRate * 100).toFixed(0)}%`],
      createdAt: new Date().toISOString(),
      isAcknowledged: false,
    }
  }

  if (marginPercent < 12) {
    return {
      id: makeId(sku.id, "margin_erosion"),
      skuId: sku.id,
      skuName: name,
      type: "margin_erosion",
      severity: "high",
      title: `${name} margin critical — ${marginPercent.toFixed(1)}% (below 12% survival threshold)`,
      description: `Net margin has dropped to ${marginPercent.toFixed(1)}%. At this level, normal variance in PPC, returns, or storage fees can push the SKU into loss territory.`,
      whyItMatters: "A 12% margin provides almost no buffer. A single bad PPC week, a supplier cost increase, or a returns spike will make this unprofitable.",
      estimatedImpact: `One bad month could cost $${Math.round(sku.avgMonthlySales * 3).toLocaleString()} in losses`,
      recommendedAction: "Target margin improvement to 18%+. Options: raise price, renegotiate COGS, or cut ad spend by 20% and monitor rank impact.",
      confidence: 90,
      dataUsed: [`Margin: ${marginPercent.toFixed(1)}%`, `ACoS: ${(sku.acos * 100).toFixed(0)}%`, `Net: $${sku.netProfitPerUnit.toFixed(2)}/unit`],
      createdAt: new Date().toISOString(),
      isAcknowledged: false,
    }
  }

  if (marginPercent < 18 && sku.marginTrend === "down") {
    return {
      id: makeId(sku.id, "margin_erosion"),
      skuId: sku.id,
      skuName: name,
      type: "margin_erosion",
      severity: "medium",
      title: `${name} margin declining — ${marginPercent.toFixed(1)}% and trending down`,
      description: `Margin is below the healthy 18% threshold and has been declining month-over-month. Current trajectory points toward the danger zone.`,
      whyItMatters: "Margin erosion is rarely linear. If the trend that drove this continues, you could cross the 10% threshold within 2–3 months.",
      estimatedImpact: `Projected to reach 10% margin within ~60 days at current trend`,
      recommendedAction: "Identify the erosion driver: rising ad costs, fee changes, return rate, or COGS. Address the largest contributor first.",
      confidence: 78,
      dataUsed: [`Margin: ${marginPercent.toFixed(1)}%`, "Trend: ↓ declining", `Monthly profit: $${netProfitMonthly.toLocaleString()}`],
      createdAt: new Date().toISOString(),
      isAcknowledged: false,
    }
  }

  return null
}

export function assessPpcRisk(sku: SKU): RiskAlert | null {
  const { acos, name, monthlyAdSpend, monthlyRevenue } = sku
  const acosPct = acos * 100

  if (acos >= 0.50) {
    return {
      id: makeId(sku.id, "ppc_pressure"),
      skuId: sku.id,
      skuName: name,
      type: "ppc_pressure",
      severity: "critical",
      title: `PPC destroying margin — ACoS ${acosPct.toFixed(0)}% on ${name}`,
      description: `${acosPct.toFixed(0)}% of every dollar earned from ads goes back to Amazon in ad spend. At this ACoS, advertising is subsidising Amazon, not building your business.`,
      whyItMatters: `You are spending $${monthlyAdSpend.toLocaleString()}/month on ads that generate $${monthlyRevenue.toLocaleString()} in revenue but leave almost nothing after fees and COGS.`,
      estimatedImpact: `Reducing ACoS to 25% would recover ~$${Math.round(monthlyAdSpend * (acos - 0.25)).toLocaleString()}/month in profit`,
      recommendedAction: "Pause all broad/auto campaigns immediately. Keep only exact-match on proven keywords. Review search term reports for wasted spend. Set target ACoS at 25%.",
      confidence: 96,
      dataUsed: [`ACoS: ${acosPct.toFixed(0)}%`, `Ad spend: $${monthlyAdSpend.toLocaleString()}/mo`, `Revenue: $${monthlyRevenue.toLocaleString()}/mo`],
      createdAt: new Date().toISOString(),
      isAcknowledged: false,
    }
  }

  if (acos >= 0.35 && sku.adSpendTrend === "up") {
    return {
      id: makeId(sku.id, "ppc_pressure"),
      skuId: sku.id,
      skuName: name,
      type: "ppc_pressure",
      severity: "high",
      title: `PPC pressure rising on ${name} — ACoS ${acosPct.toFixed(0)}% and climbing`,
      description: `Ad spend is increasing faster than revenue, pushing ACoS up. At ${acosPct.toFixed(0)}%, ads are consuming a dangerous share of gross margin.`,
      whyItMatters: "When ACoS trends up consistently, it usually means keyword competition has increased or your conversion rate is declining — both require action, not just bid adjustments.",
      estimatedImpact: `Each additional 5pp of ACoS removes ~$${Math.round(monthlyRevenue * 0.05).toLocaleString()}/month from profit`,
      recommendedAction: "Run a search term report. Identify and negate wasted spend. Review product listing for conversion issues. Cap bids on low-CVR keywords.",
      confidence: 85,
      dataUsed: [`ACoS: ${acosPct.toFixed(0)}%`, "Ad spend trend: ↑ rising", `Ad spend: $${monthlyAdSpend.toLocaleString()}/mo`],
      createdAt: new Date().toISOString(),
      isAcknowledged: false,
    }
  }

  return null
}

export function assessReturnRisk(sku: SKU): RiskAlert | null {
  const { returnRate, name, monthlyReturns } = sku
  const returnPct = returnRate * 100

  if (returnRate >= 0.15) {
    return {
      id: makeId(sku.id, "return_rate"),
      skuId: sku.id,
      skuName: name,
      type: "return_rate",
      severity: "high",
      title: `High return rate on ${name} — ${returnPct.toFixed(0)}% (category avg: 4%)`,
      description: `${returnPct.toFixed(0)}% of units sold are being returned — 4× the typical category rate. This signals a product-expectation mismatch, a quality issue, or a listing problem.`,
      whyItMatters: `High return rates trigger Amazon policy review (suspension risk above 20%). You are losing $${monthlyReturns.toLocaleString()}/month to returns alone, not counting the fulfilment cost of processing each return.`,
      estimatedImpact: `-$${monthlyReturns.toLocaleString()}/month in direct return losses + listing suspension risk above 20%`,
      recommendedAction: "Pull return reason reports from Seller Central. If 'not as described': fix listing images/copy. If 'defective': contact supplier about QC. If 'changed mind': review pricing and photos.",
      confidence: 93,
      dataUsed: [`Return rate: ${returnPct.toFixed(0)}%`, `Monthly losses: $${monthlyReturns.toLocaleString()}`, "Category avg: 4%"],
      createdAt: new Date().toISOString(),
      isAcknowledged: false,
    }
  }

  if (returnRate >= 0.08) {
    return {
      id: makeId(sku.id, "return_rate"),
      skuId: sku.id,
      skuName: name,
      type: "return_rate",
      severity: "medium",
      title: `Return rate elevated on ${name} — ${returnPct.toFixed(0)}%`,
      description: `${returnPct.toFixed(0)}% return rate is above the healthy threshold. Worth investigating before it escalates.`,
      whyItMatters: `Returns cost ~$${monthlyReturns.toLocaleString()}/month and erode margin. Upward trends often precede negative review clusters.`,
      estimatedImpact: `-$${monthlyReturns.toLocaleString()}/month currently`,
      recommendedAction: "Review customer feedback and return reasons. Check if a recent batch had quality issues.",
      confidence: 75,
      dataUsed: [`Return rate: ${returnPct.toFixed(0)}%`, `Monthly cost: $${monthlyReturns.toLocaleString()}`],
      createdAt: new Date().toISOString(),
      isAcknowledged: false,
    }
  }

  return null
}

// ─── Main Risk Engine ─────────────────────────────────────────────────────────

export function generateRiskAlerts(skus: SKU[]): RiskAlert[] {
  const alerts: RiskAlert[] = []

  for (const sku of skus) {
    if (sku.status !== "active") continue

    const checks = [
      assessStockoutRisk(sku),
      assessOverstockRisk(sku),
      assessMarginRisk(sku),
      assessPpcRisk(sku),
      assessReturnRisk(sku),
    ]

    for (const alert of checks) {
      if (alert) alerts.push(alert)
    }
  }

  // Sort: critical first, then high, medium, low
  const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
  alerts.sort((a, b) => (order[a.severity] ?? 5) - (order[b.severity] ?? 5))

  return alerts
}

// ─── Business Health Summary ──────────────────────────────────────────────────

export function getBusinessHealthSummary(skus: SKU[], alerts: RiskAlert[]): BusinessHealthSummary {
  const active = skus.filter(s => s.status === "active")
  const totalRevenue = active.reduce((s, sku) => s + sku.monthlyRevenue, 0)
  const totalProfit = active.reduce((s, sku) => s + sku.netProfitMonthly, 0)
  const totalAdSpend = active.reduce((s, sku) => s + sku.monthlyAdSpend, 0)
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
  const overallAcos = totalRevenue > 0 ? (totalAdSpend / totalRevenue) * 100 : 0

  const critical = alerts.filter(a => a.severity === "critical" && !a.isAcknowledged).length
  const high = alerts.filter(a => a.severity === "high" && !a.isAcknowledged).length
  const medium = alerts.filter(a => a.severity === "medium" && !a.isAcknowledged).length

  // Estimated at-risk profit if alerts unaddressed
  const negativeSkus = active.filter(s => s.netProfitMonthly < 0)
  const highAcosSkus = active.filter(s => s.acos >= 0.40)
  const projectedImpact = Math.round(
    negativeSkus.reduce((s, sku) => s + Math.abs(sku.netProfitMonthly), 0) +
    highAcosSkus.reduce((s, sku) => s + sku.monthlyAdSpend * (sku.acos - 0.25), 0)
  )

  let healthStatus: HealthStatus = "healthy"
  let healthStatusLabel = "Healthy"
  if (critical >= 2 || overallMargin < 5) {
    healthStatus = "critical"
    healthStatusLabel = "Critical"
  } else if (critical >= 1 || high >= 3 || overallMargin < 12) {
    healthStatus = "at_risk"
    healthStatusLabel = "At Risk"
  } else if (high >= 1 || medium >= 3) {
    healthStatus = "watch"
    healthStatusLabel = "Needs Attention"
  }

  return {
    totalSkus: skus.length,
    activeSkus: active.length,
    totalMonthlyRevenue: Math.round(totalRevenue),
    totalNetProfitMonthly: Math.round(totalProfit),
    overallMarginPercent: Math.round(overallMargin * 10) / 10,
    totalAdSpendMonthly: Math.round(totalAdSpend),
    overallAcos: Math.round(overallAcos * 10) / 10,
    criticalAlerts: critical,
    highAlerts: high,
    mediumAlerts: medium,
    totalAlerts: alerts.filter(a => !a.isAcknowledged).length,
    projectedImpactIfUnaddressed: projectedImpact,
    healthStatus,
    healthStatusLabel,
  }
}

// ─── Inventory Snapshots ──────────────────────────────────────────────────────

export function getInventorySnapshots(skus: SKU[]): InventorySnapshot[] {
  return skus.filter(s => s.status === "active").map(sku => {
    const { daysUntilStockout, reorderLeadTimeDays, currentInventory, avgDailySales } = sku

    let status: InventoryStatus
    let statusLabel: string

    if (daysUntilStockout <= 0) {
      status = "order_now"; statusLabel = "Out of Stock"
    } else if (daysUntilStockout < reorderLeadTimeDays) {
      status = "order_now"; statusLabel = "Order Now"
    } else if (daysUntilStockout < reorderLeadTimeDays + 14) {
      status = "reorder_soon"; statusLabel = "Reorder Soon"
    } else if (daysUntilStockout > 240) {
      status = "dead"; statusLabel = "Dead Stock Risk"
    } else if (daysUntilStockout > 90) {
      status = "overstock"; statusLabel = "Overstock"
    } else if (daysUntilStockout < reorderLeadTimeDays + 30) {
      status = "watch"; statusLabel = "Watch"
    } else {
      status = "ok"; statusLabel = "On Track"
    }

    const daysOfCoverageAfterReorder =
      avgDailySales > 0
        ? Math.floor((currentInventory + sku.reorderQuantity) / avgDailySales)
        : 999

    return {
      skuId: sku.id,
      skuName: sku.name,
      channel: sku.channel,
      currentInventory,
      avgDailySales,
      daysUntilStockout,
      reorderLeadTimeDays,
      reorderPoint: sku.reorderPoint,
      reorderQuantity: sku.reorderQuantity,
      status,
      statusLabel,
      daysOfCoverageAfterReorder,
      salesVelocityTrend: sku.salesVelocityTrend,
    }
  })
}

// ─── Profit Snapshots ─────────────────────────────────────────────────────────

export function getProfitSnapshots(skus: SKU[]): ProfitSnapshot[] {
  return skus.filter(s => s.status === "active").map(sku => {
    let status: ProfitStatus
    let statusLabel: string

    if (sku.marginPercent < 0) {
      status = "unprofitable"; statusLabel = "Losing Money"
    } else if (sku.marginPercent < 12) {
      status = "at_risk"; statusLabel = "At Risk"
    } else if (sku.marginPercent < 18 && sku.marginTrend === "down") {
      status = "watch"; statusLabel = "Declining"
    } else {
      status = "healthy"; statusLabel = "Healthy"
    }

    return {
      skuId: sku.id,
      skuName: sku.name,
      channel: sku.channel,
      monthlyRevenue: sku.monthlyRevenue,
      cogs: Math.round(sku.cogs * sku.avgMonthlySales),
      platformFees: Math.round(sku.platformFees * sku.avgMonthlySales),
      adSpend: sku.monthlyAdSpend,
      returnCost: sku.monthlyReturns,
      storageCost: sku.monthlyStorageFee,
      netProfitMonthly: sku.netProfitMonthly,
      marginPercent: sku.marginPercent,
      acos: sku.acos * 100,
      returnRate: sku.returnRate * 100,
      status,
      statusLabel,
      marginTrend: sku.marginTrend,
      adSpendTrend: sku.adSpendTrend,
    }
  })
}
