// ─── Business Health Score ────────────────────────────────────────────────────
// Four operational dimensions: Inventory, Profit, Cashflow, Operations.
// Each scored 0–100. Overall = weighted composite.
// Purpose: operational awareness indicator, not a gimmick grade.

import type { SKU, RiskAlert } from "./types"

// ─── Types ────────────────────────────────────────────────────────────────────

export type HealthGrade = "A" | "B" | "C" | "D" | "F"

export type DimensionScore = {
  score: number        // 0–100
  grade: HealthGrade
  label: string
  detail: string       // one-line reason for the score
  trend: "improving" | "stable" | "declining"
}

export type BusinessHealthScore = {
  overall: number
  grade: HealthGrade
  label: string        // "Needs Attention", "At Risk", etc.
  inventory: DimensionScore
  profit: DimensionScore
  cashflow: DimensionScore
  operations: DimensionScore
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function gradeFromScore(score: number): HealthGrade {
  if (score >= 82) return "A"
  if (score >= 68) return "B"
  if (score >= 52) return "C"
  if (score >= 38) return "D"
  return "F"
}

function labelFromScore(score: number): string {
  if (score >= 82) return "Healthy"
  if (score >= 68) return "Stable"
  if (score >= 52) return "Needs Attention"
  if (score >= 38) return "At Risk"
  return "Critical"
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n))
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function getBusinessHealthScore(skus: SKU[], alerts: RiskAlert[]): BusinessHealthScore {
  const active = skus.filter(s => s.status === "active")

  if (active.length === 0) {
    const empty: DimensionScore = { score: 0, grade: "F", label: "", detail: "No SKU data", trend: "stable" }
    return { overall: 0, grade: "F", label: "No Data", inventory: empty, profit: empty, cashflow: empty, operations: empty }
  }

  // ── Inventory Health ──────────────────────────────────────────────────────
  const orderNowCount   = active.filter(s => s.daysUntilStockout < s.reorderLeadTimeDays).length
  const reorderSoonCount = active.filter(s =>
    s.daysUntilStockout >= s.reorderLeadTimeDays &&
    s.daysUntilStockout < s.reorderLeadTimeDays + 14
  ).length
  const overstockCount  = active.filter(s => s.daysUntilStockout > 90 && s.daysUntilStockout <= 240).length
  const deadCount       = active.filter(s => s.daysUntilStockout > 240).length

  let invScore = 100
  invScore -= Math.min(orderNowCount   * 22, 44)
  invScore -= Math.min(reorderSoonCount * 12, 24)
  invScore -= Math.min(overstockCount  *  6, 18)
  invScore -= Math.min(deadCount       * 14, 28)
  invScore = clamp(invScore)

  const invDetail = orderNowCount > 0
    ? `${orderNowCount} SKU${orderNowCount > 1 ? "s" : ""} past reorder point — order immediately`
    : reorderSoonCount > 0
    ? `${reorderSoonCount} SKU${reorderSoonCount > 1 ? "s" : ""} approaching reorder window`
    : deadCount > 0
    ? `${deadCount} SKU${deadCount > 1 ? "s" : ""} with 8+ months of stock`
    : "Inventory levels are healthy"

  const invTrend: DimensionScore["trend"] = orderNowCount > 0 ? "declining" : reorderSoonCount > 0 ? "declining" : "stable"

  // ── Profit Stability ──────────────────────────────────────────────────────
  const unprofitableCount = active.filter(s => s.netProfitMonthly < 0).length
  const thinMarginCount   = active.filter(s => s.marginPercent >= 0 && s.marginPercent < 12).length
  const highAcosCount     = active.filter(s => s.acos >= 0.50).length
  const medAcosCount      = active.filter(s => s.acos >= 0.35 && s.acos < 0.50).length
  const healthyCount      = active.filter(s => s.marginPercent >= 18).length

  let profScore = 100
  profScore -= Math.min(unprofitableCount * 22, 44)
  profScore -= Math.min(thinMarginCount   * 10, 30)
  profScore -= Math.min(highAcosCount     * 12, 24)
  profScore -= Math.min(medAcosCount      *  6, 18)
  profScore = clamp(profScore)

  const profDetail = unprofitableCount > 0
    ? `${unprofitableCount} SKU${unprofitableCount > 1 ? "s" : ""} losing money every month`
    : thinMarginCount > 0
    ? `${thinMarginCount} SKU${thinMarginCount > 1 ? "s" : ""} below 12% survival margin`
    : `${healthyCount}/${active.length} SKUs at healthy margin (18%+)`

  const profTrend: DimensionScore["trend"] =
    unprofitableCount > 0 ? "declining"
    : active.some(s => s.marginTrend === "down") ? "declining"
    : "stable"

  // ── Cashflow Risk ─────────────────────────────────────────────────────────
  const totalRevenue  = active.reduce((s, k) => s + k.monthlyRevenue, 0)
  const totalProfit   = active.reduce((s, k) => s + k.netProfitMonthly, 0)
  const totalAdSpend  = active.reduce((s, k) => s + k.monthlyAdSpend, 0)
  const highReturnCount = active.filter(s => s.returnRate > 0.15).length

  // Cash needed for pending reorders (order_now + reorder_soon)
  const pendingReorders = active.filter(s =>
    s.daysUntilStockout < s.reorderLeadTimeDays + 14
  )
  const reorderCashNeeded = pendingReorders.reduce((s, k) => s + k.cogs * k.reorderQuantity, 0)

  let cashScore = 100
  if (totalProfit < 0)
    cashScore -= 28
  else if (totalProfit < totalRevenue * 0.08)
    cashScore -= 14
  cashScore -= Math.min(highReturnCount * 12, 24)
  if (totalAdSpend / Math.max(totalRevenue, 1) > 0.30) cashScore -= 10
  if (reorderCashNeeded > 10000) cashScore -= 12
  else if (reorderCashNeeded > 5000) cashScore -= 6
  cashScore = clamp(cashScore)

  const cashDetail = totalProfit < 0
    ? `Portfolio losing $${Math.abs(Math.round(totalProfit)).toLocaleString()}/mo net`
    : reorderCashNeeded > 5000
    ? `$${Math.round(reorderCashNeeded).toLocaleString()} in reorder capital needed soon`
    : highReturnCount > 0
    ? `${highReturnCount} SKU${highReturnCount > 1 ? "s" : ""} with high return rates draining cash`
    : "Cashflow looks stable"

  const cashTrend: DimensionScore["trend"] = totalProfit < 0 ? "declining" : "stable"

  // ── Operational Risk ──────────────────────────────────────────────────────
  const criticalCount = alerts.filter(a => a.severity === "critical" && !a.isAcknowledged).length
  const highCount     = alerts.filter(a => a.severity === "high"     && !a.isAcknowledged).length
  const avgReturn     = active.reduce((s, k) => s + k.returnRate, 0) / active.length

  let opsScore = 100
  opsScore -= Math.min(criticalCount * 20, 40)
  opsScore -= Math.min(highCount     * 10, 30)
  if (avgReturn > 0.10) opsScore -= 12
  else if (avgReturn > 0.05) opsScore -= 5
  opsScore = clamp(opsScore)

  const opsDetail = criticalCount > 0
    ? `${criticalCount} critical alert${criticalCount > 1 ? "s" : ""} need immediate action`
    : highCount > 0
    ? `${highCount} high-priority issue${highCount > 1 ? "s" : ""} open`
    : "No critical operational issues"

  const opsTrend: DimensionScore["trend"] = criticalCount > 0 ? "declining" : highCount > 2 ? "declining" : "stable"

  // ── Overall ───────────────────────────────────────────────────────────────
  const overall = Math.round(
    invScore   * 0.28 +
    profScore  * 0.35 +
    cashScore  * 0.22 +
    opsScore   * 0.15
  )

  return {
    overall,
    grade: gradeFromScore(overall),
    label: labelFromScore(overall),
    inventory:  { score: invScore,  grade: gradeFromScore(invScore),  label: "Inventory",  detail: invDetail,  trend: invTrend  },
    profit:     { score: profScore, grade: gradeFromScore(profScore), label: "Profit",     detail: profDetail, trend: profTrend },
    cashflow:   { score: cashScore, grade: gradeFromScore(cashScore), label: "Cashflow",   detail: cashDetail, trend: cashTrend },
    operations: { score: opsScore,  grade: gradeFromScore(opsScore),  label: "Operations", detail: opsDetail,  trend: opsTrend  },
  }
}
