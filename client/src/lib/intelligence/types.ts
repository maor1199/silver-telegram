// ─── Core ecommerce data models for SellerMentor operational intelligence ───

export type Channel = "amazon" | "shopify" | "ebay" | "walmart" | "tiktok" | "manual"

export type SKUStatus = "active" | "inactive" | "archived"

export type RiskSeverity = "critical" | "high" | "medium" | "low" | "info"

export type RiskType =
  | "stockout"
  | "overstock"
  | "dead_inventory"
  | "margin_erosion"
  | "negative_margin"
  | "ppc_pressure"
  | "return_rate"
  | "fee_increase"
  | "price_compression"
  | "supplier_delay"
  | "velocity_drop"

// ─── SKU ────────────────────────────────────────────────────────────────────

export type SKU = {
  id: string
  name: string
  asin?: string
  sku?: string
  channel: Channel
  status: SKUStatus
  category: string
  imageUrl?: string

  // Inventory
  currentInventory: number        // units in stock
  reorderLeadTimeDays: number     // supplier lead time
  reorderPoint: number            // units at which to trigger reorder
  reorderQuantity: number         // suggested reorder amount

  // Pricing
  sellingPrice: number            // average selling price
  cogs: number                    // cost of goods
  platformFees: number            // referral + FBA fees per unit
  shippingToWarehouse: number     // inbound shipping per unit

  // Performance (monthly averages)
  avgDailySales: number           // units/day
  avgMonthlySales: number         // units/month
  monthlyRevenue: number

  // PPC / Advertising
  monthlyAdSpend: number
  acos: number                    // Advertising Cost of Sales %
  ppcRevenueShare: number         // % of sales from PPC (0–1)

  // Returns
  returnRate: number              // % of units returned (0–1)
  monthlyReturns: number          // $ lost to returns/mo

  // Storage
  monthlyStorageFee: number       // total storage cost/mo

  // Coupons / discounts
  monthlyDiscountCost: number     // $ lost to coupons/discounts/mo

  // Computed
  grossMarginPerUnit: number      // selling_price - cogs - fees - shipping
  netProfitPerUnit: number        // gross - (ad_spend/units) - (returns/units) - (storage/units)
  netProfitMonthly: number        // monthly net profit in $
  marginPercent: number           // net_profit / selling_price (%)
  daysUntilStockout: number       // current_inventory / avg_daily_sales

  // Trend (MoM)
  marginTrend: "up" | "down" | "stable"
  salesVelocityTrend: "up" | "down" | "stable"
  adSpendTrend: "up" | "down" | "stable"

  lastUpdated: string
}

// ─── Risk Alert ─────────────────────────────────────────────────────────────

export type RiskAlert = {
  id: string
  skuId: string
  skuName: string
  type: RiskType
  severity: RiskSeverity
  title: string
  description: string             // what is happening
  whyItMatters: string            // business impact explanation
  estimatedImpact: string         // e.g. "-$2,400/month" or "7-day stockout gap"
  recommendedAction: string       // what to do next
  confidence: number              // 0–100
  dataUsed: string[]              // which signals drove this alert
  createdAt: string
  isAcknowledged: boolean
}

// ─── Business Health Summary ─────────────────────────────────────────────────

export type HealthStatus = "healthy" | "watch" | "at_risk" | "critical"

export type BusinessHealthSummary = {
  totalSkus: number
  activeSkus: number
  totalMonthlyRevenue: number
  totalNetProfitMonthly: number
  overallMarginPercent: number
  totalAdSpendMonthly: number
  overallAcos: number
  criticalAlerts: number
  highAlerts: number
  mediumAlerts: number
  totalAlerts: number
  projectedImpactIfUnaddressed: number  // $ at risk
  healthStatus: HealthStatus
  healthStatusLabel: string
}

// ─── Inventory Snapshot ──────────────────────────────────────────────────────

export type InventoryStatus = "order_now" | "reorder_soon" | "watch" | "overstock" | "dead" | "ok"

export type InventorySnapshot = {
  skuId: string
  skuName: string
  channel: Channel
  currentInventory: number
  avgDailySales: number
  daysUntilStockout: number
  reorderLeadTimeDays: number
  reorderPoint: number
  reorderQuantity: number
  status: InventoryStatus
  statusLabel: string
  daysOfCoverageAfterReorder: number
  salesVelocityTrend: "up" | "down" | "stable"
}

// ─── Profit Snapshot ─────────────────────────────────────────────────────────

export type ProfitStatus = "healthy" | "watch" | "at_risk" | "unprofitable"

export type ProfitSnapshot = {
  skuId: string
  skuName: string
  channel: Channel
  monthlyRevenue: number
  cogs: number
  platformFees: number
  adSpend: number
  returnCost: number
  storageCost: number
  netProfitMonthly: number
  marginPercent: number
  acos: number
  returnRate: number
  status: ProfitStatus
  statusLabel: string
  marginTrend: "up" | "down" | "stable"
  adSpendTrend: "up" | "down" | "stable"
}
