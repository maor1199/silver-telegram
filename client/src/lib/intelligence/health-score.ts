// ─── Business Health Score — decomposable ────────────────────────────────────
// Four operational dimensions, each explainable.
// Every point deduction is tracked as a contribution so the user knows
// exactly why their score is what it is. No magic numbers.

import type { SKU, RiskAlert } from "./types"

// ─── Types ────────────────────────────────────────────────────────────────────

export type HealthGrade = "A" | "B" | "C" | "D" | "F"

export type DimensionScore = {
  score: number
  grade: HealthGrade
  label: string
  detail: string
  trend: "improving" | "stable" | "declining"
}

// Each line item that explains why the score is what it is
export type ScoreContribution = {
  dimension: "inventory" | "profit" | "cashflow" | "operations"
  label: string        // e.g. "1 SKU past reorder point"
  points: number       // negative = hurting score; positive = helping
  reason: string       // short operational explanation
  isPositive: boolean
}

export type BusinessHealthScore = {
  overall: number
  grade: HealthGrade
  label: string
  inventory:  DimensionScore
  profit:     DimensionScore
  cashflow:   DimensionScore
  operations: DimensionScore
  contributions: ScoreContribution[]  // sorted by abs impact, descending
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function gradeFromScore(n: number): HealthGrade {
  if (n >= 82) return "A"
  if (n >= 68) return "B"
  if (n >= 52) return "C"
  if (n >= 38) return "D"
  return "F"
}

function labelFromScore(n: number): string {
  if (n >= 82) return "Healthy"
  if (n >= 68) return "Stable"
  if (n >= 52) return "Needs Attention"
  if (n >= 38) return "At Risk"
  return "Critical"
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n))
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function getBusinessHealthScore(skus: SKU[], alerts: RiskAlert[]): BusinessHealthScore {
  const active = skus.filter(s => s.status === "active")
  const contributions: ScoreContribution[] = []

  if (active.length === 0) {
    const empty: DimensionScore = { score: 0, grade: "F", label: "", detail: "No SKU data", trend: "stable" }
    return { overall: 0, grade: "F", label: "No Data", inventory: empty, profit: empty, cashflow: empty, operations: empty, contributions: [] }
  }

  // ── Inventory Health (weight: 28%) ────────────────────────────────────────
  const orderNowCount    = active.filter(s => s.daysUntilStockout < s.reorderLeadTimeDays).length
  const reorderSoonCount = active.filter(s =>
    s.daysUntilStockout >= s.reorderLeadTimeDays &&
    s.daysUntilStockout <  s.reorderLeadTimeDays + 14
  ).length
  const overstockCount = active.filter(s => s.daysUntilStockout > 90 && s.daysUntilStockout <= 240).length
  const deadCount      = active.filter(s => s.daysUntilStockout > 240).length

  let invScore = 100
  if (orderNowCount > 0) {
    const pts = Math.min(orderNowCount * 22, 44)
    invScore -= pts
    contributions.push({ dimension: "inventory", label: `${orderNowCount} SKU${orderNowCount > 1 ? "s" : ""} past reorder point`, points: -pts, reason: "Stockout imminent — revenue at risk", isPositive: false })
  }
  if (reorderSoonCount > 0) {
    const pts = Math.min(reorderSoonCount * 12, 24)
    invScore -= pts
    contributions.push({ dimension: "inventory", label: `${reorderSoonCount} SKU${reorderSoonCount > 1 ? "s" : ""} approaching reorder window`, points: -pts, reason: "Less than 14-day buffer before reorder must be placed", isPositive: false })
  }
  if (overstockCount > 0) {
    const pts = Math.min(overstockCount * 6, 18)
    invScore -= pts
    contributions.push({ dimension: "inventory", label: `${overstockCount} SKU${overstockCount > 1 ? "s" : ""} with 3–8 months of stock`, points: -pts, reason: "Capital locked in slow-moving inventory", isPositive: false })
  }
  if (deadCount > 0) {
    const pts = Math.min(deadCount * 14, 28)
    invScore -= pts
    contributions.push({ dimension: "inventory", label: `${deadCount} SKU${deadCount > 1 ? "s" : ""} with 8+ months of stock`, points: -pts, reason: "Dead inventory — storage fees compounding", isPositive: false })
  }
  invScore = clamp(invScore)

  const invDetail = orderNowCount > 0
    ? `${orderNowCount} SKU${orderNowCount > 1 ? "s" : ""} past reorder point — order immediately`
    : reorderSoonCount > 0
    ? `${reorderSoonCount} SKU${reorderSoonCount > 1 ? "s" : ""} approaching reorder window`
    : deadCount > 0 ? `${deadCount} SKU${deadCount > 1 ? "s" : ""} with 8+ months of stock`
    : "Inventory levels are healthy"
  const invTrend: DimensionScore["trend"] = orderNowCount > 0 || reorderSoonCount > 0 ? "declining" : "stable"

  // ── Profit Stability (weight: 35%) ────────────────────────────────────────
  const unprofitableCount = active.filter(s => s.netProfitMonthly < 0).length
  const thinMarginCount   = active.filter(s => s.marginPercent >= 0 && s.marginPercent < 12).length
  const highAcosCount     = active.filter(s => s.acos >= 0.50).length
  const medAcosCount      = active.filter(s => s.acos >= 0.35 && s.acos < 0.50).length
  const healthyCount      = active.filter(s => s.marginPercent >= 18).length

  let profScore = 100
  if (unprofitableCount > 0) {
    const pts = Math.min(unprofitableCount * 22, 44)
    profScore -= pts
    contributions.push({ dimension: "profit", label: `${unprofitableCount} SKU${unprofitableCount > 1 ? "s" : ""} losing money`, points: -pts, reason: "Negative net profit — every sale destroys capital", isPositive: false })
  }
  if (thinMarginCount > 0) {
    const pts = Math.min(thinMarginCount * 10, 30)
    profScore -= pts
    contributions.push({ dimension: "profit", label: `${thinMarginCount} SKU${thinMarginCount > 1 ? "s" : ""} below 12% survival margin`, points: -pts, reason: "Thin margin — no buffer for variance in costs or returns", isPositive: false })
  }
  if (highAcosCount > 0) {
    const pts = Math.min(highAcosCount * 12, 24)
    profScore -= pts
    contributions.push({ dimension: "profit", label: `${highAcosCount} SKU${highAcosCount > 1 ? "s" : ""} with ACoS ≥50%`, points: -pts, reason: "Ad spend destroying what margin remains", isPositive: false })
  }
  if (medAcosCount > 0) {
    const pts = Math.min(medAcosCount * 6, 18)
    profScore -= pts
    contributions.push({ dimension: "profit", label: `${medAcosCount} SKU${medAcosCount > 1 ? "s" : ""} with ACoS 35–50%`, points: -pts, reason: "PPC pressure consuming a growing share of gross margin", isPositive: false })
  }
  if (healthyCount > 0 && unprofitableCount === 0 && thinMarginCount === 0) {
    contributions.push({ dimension: "profit", label: `${healthyCount} SKU${healthyCount > 1 ? "s" : ""} at healthy margin (18%+)`, points: 0, reason: "Strong margin provides buffer against cost variance", isPositive: true })
  }
  profScore = clamp(profScore)

  const profDetail = unprofitableCount > 0
    ? `${unprofitableCount} SKU${unprofitableCount > 1 ? "s" : ""} losing money every month`
    : thinMarginCount > 0 ? `${thinMarginCount} SKU${thinMarginCount > 1 ? "s" : ""} below 12% survival margin`
    : `${healthyCount}/${active.length} SKUs at healthy margin (18%+)`
  const profTrend: DimensionScore["trend"] =
    unprofitableCount > 0 ? "declining"
    : active.some(s => s.marginTrend === "down") ? "declining"
    : "stable"

  // ── Cashflow Risk (weight: 22%) ───────────────────────────────────────────
  const totalRevenue  = active.reduce((s, k) => s + k.monthlyRevenue,   0)
  const totalProfit   = active.reduce((s, k) => s + k.netProfitMonthly, 0)
  const totalAdSpend  = active.reduce((s, k) => s + k.monthlyAdSpend,   0)
  const highReturnCount = active.filter(s => s.returnRate > 0.15).length
  const pendingReorders = active.filter(s => s.daysUntilStockout < s.reorderLeadTimeDays + 14)
  const reorderCashNeeded = pendingReorders.reduce((s, k) => s + k.cogs * k.reorderQuantity, 0)

  let cashScore = 100
  if (totalProfit < 0) {
    cashScore -= 28
    contributions.push({ dimension: "cashflow", label: "Portfolio net negative", points: -28, reason: `Losing $${Math.abs(Math.round(totalProfit)).toLocaleString()}/mo across all SKUs`, isPositive: false })
  } else if (totalProfit < totalRevenue * 0.08) {
    cashScore -= 14
    contributions.push({ dimension: "cashflow", label: "Portfolio margin below 8%", points: -14, reason: "Very little profit buffer — one cost increase flips to loss", isPositive: false })
  }
  if (highReturnCount > 0) {
    const pts = Math.min(highReturnCount * 12, 24)
    cashScore -= pts
    contributions.push({ dimension: "cashflow", label: `${highReturnCount} SKU${highReturnCount > 1 ? "s" : ""} with high return rates`, points: -pts, reason: "Returns drain cash directly — each return costs fees + fulfilment", isPositive: false })
  }
  if (totalAdSpend / Math.max(totalRevenue, 1) > 0.30) {
    cashScore -= 10
    contributions.push({ dimension: "cashflow", label: "Ad spend >30% of revenue", points: -10, reason: "Excessive PPC consuming working capital", isPositive: false })
  }
  if (reorderCashNeeded > 10000) {
    cashScore -= 12
    contributions.push({ dimension: "cashflow", label: `$${Math.round(reorderCashNeeded / 1000)}k reorder capital needed soon`, points: -12, reason: "Multiple SKUs need reorders — significant cash outflow coming", isPositive: false })
  } else if (reorderCashNeeded > 5000) {
    cashScore -= 6
    contributions.push({ dimension: "cashflow", label: `$${Math.round(reorderCashNeeded / 1000)}k reorder capital needed`, points: -6, reason: "Reorder cash requirements coming due", isPositive: false })
  }
  cashScore = clamp(cashScore)

  const cashDetail = totalProfit < 0
    ? `Portfolio losing $${Math.abs(Math.round(totalProfit)).toLocaleString()}/mo net`
    : reorderCashNeeded > 5000
    ? `$${Math.round(reorderCashNeeded).toLocaleString()} in reorder capital needed`
    : highReturnCount > 0
    ? `${highReturnCount} SKU${highReturnCount > 1 ? "s" : ""} with high return rates draining cash`
    : "Cashflow looks stable"
  const cashTrend: DimensionScore["trend"] = totalProfit < 0 ? "declining" : "stable"

  // ── Operational Risk (weight: 15%) ────────────────────────────────────────
  const criticalCount = alerts.filter(a => a.severity === "critical" && !a.isAcknowledged).length
  const highCount     = alerts.filter(a => a.severity === "high"     && !a.isAcknowledged).length
  const avgReturn     = active.reduce((s, k) => s + k.returnRate, 0) / active.length

  let opsScore = 100
  if (criticalCount > 0) {
    const pts = Math.min(criticalCount * 20, 40)
    opsScore -= pts
    contributions.push({ dimension: "operations", label: `${criticalCount} critical alert${criticalCount > 1 ? "s" : ""} unresolved`, points: -pts, reason: "Critical issues require immediate action", isPositive: false })
  }
  if (highCount > 0) {
    const pts = Math.min(highCount * 10, 30)
    opsScore -= pts
    contributions.push({ dimension: "operations", label: `${highCount} high-priority issue${highCount > 1 ? "s" : ""} open`, points: -pts, reason: "High-severity alerts compound over time if ignored", isPositive: false })
  }
  if (avgReturn > 0.10) {
    opsScore -= 12
    contributions.push({ dimension: "operations", label: "Portfolio return rate above 10%", points: -12, reason: "High return rates signal product or listing quality issues", isPositive: false })
  } else if (avgReturn > 0.05) {
    opsScore -= 5
    contributions.push({ dimension: "operations", label: "Return rates elevated across portfolio", points: -5, reason: "Worth monitoring before it escalates", isPositive: false })
  }
  opsScore = clamp(opsScore)

  const opsDetail = criticalCount > 0
    ? `${criticalCount} critical alert${criticalCount > 1 ? "s" : ""} need immediate action`
    : highCount > 0 ? `${highCount} high-priority issue${highCount > 1 ? "s" : ""} open`
    : "No critical operational issues"
  const opsTrend: DimensionScore["trend"] = criticalCount > 0 ? "declining" : highCount > 2 ? "declining" : "stable"

  // ── Overall (weighted composite) ──────────────────────────────────────────
  const overall = Math.round(
    invScore   * 0.28 +
    profScore  * 0.35 +
    cashScore  * 0.22 +
    opsScore   * 0.15
  )

  // Sort contributions by absolute impact (largest deductions first)
  contributions.sort((a, b) => Math.abs(b.points) - Math.abs(a.points))

  return {
    overall,
    grade: gradeFromScore(overall),
    label: labelFromScore(overall),
    inventory:  { score: invScore,  grade: gradeFromScore(invScore),  label: "Inventory",  detail: invDetail,  trend: invTrend  },
    profit:     { score: profScore, grade: gradeFromScore(profScore), label: "Profit",     detail: profDetail, trend: profTrend },
    cashflow:   { score: cashScore, grade: gradeFromScore(cashScore), label: "Cashflow",   detail: cashDetail, trend: cashTrend },
    operations: { score: opsScore,  grade: gradeFromScore(opsScore),  label: "Operations", detail: opsDetail,  trend: opsTrend  },
    contributions,
  }
}
