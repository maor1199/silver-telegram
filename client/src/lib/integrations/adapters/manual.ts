// ─── Manual CSV Adapter ────────────────────────────────────────────────────────
// Wraps the existing CSV → SKU parse flow.
// This is the production adapter for user-uploaded files.
// All other adapters will follow the same contract.

import type { DataAdapter, AdapterResult, IntegrationConfig, RawManualCsvRow } from "../types"
import type { SKU } from "@/lib/intelligence/types"

// ─── Required CSV column headers ─────────────────────────────────────────────

const REQUIRED_COLUMNS = [
  "name",
  "sellingPrice",
  "cogs",
  "avgDailySales",
  "currentInventory",
  "monthlyAdSpend",
  "acos",
  "returnRate",
]

// ─── Adapter ──────────────────────────────────────────────────────────────────

export class ManualCsvAdapter implements DataAdapter<RawManualCsvRow> {
  readonly channel     = "manual_csv" as const
  readonly displayName = "Manual CSV Upload"
  readonly supportsLive = false

  validate(rows: RawManualCsvRow[]): string[] {
    const problems: string[] = []
    if (rows.length === 0) {
      problems.push("File appears to be empty — no data rows found.")
      return problems
    }
    const headers = Object.keys(rows[0])
    for (const col of REQUIRED_COLUMNS) {
      if (!headers.includes(col)) {
        problems.push(`Missing required column: "${col}"`)
      }
    }
    return problems
  }

  parse(rows: RawManualCsvRow[]): AdapterResult {
    const skus: SKU[]      = []
    const warnings: string[] = []
    const errors: string[]   = []
    let rowIndex = 0

    for (const row of rows) {
      rowIndex++
      try {
        const sku = this._rowToSku(row, rowIndex, warnings)
        if (sku) skus.push(sku)
      } catch (e) {
        errors.push(`Row ${rowIndex}: ${e instanceof Error ? e.message : "Parse error"}`)
      }
    }

    return {
      skus,
      warnings,
      errors,
      rowCount: rows.length,
      source:   "manual_csv",
    }
  }

  getConfig(): IntegrationConfig {
    return {
      channel:     "manual_csv",
      displayName: this.displayName,
      isLive:      false,
    }
  }

  // ─── Internal ───────────────────────────────────────────────────────────────

  private _rowToSku(
    row:      RawManualCsvRow,
    idx:      number,
    warnings: string[],
  ): SKU | null {
    const str  = (k: string) => String(row[k] ?? "").trim()
    const num  = (k: string, fallback = 0) => {
      const v = parseFloat(String(row[k] ?? ""))
      return isNaN(v) ? fallback : v
    }

    const name = str("name")
    if (!name) {
      warnings.push(`Row ${idx}: missing name — row skipped`)
      return null
    }

    const id             = str("id") || `csv-${idx}`
    const sellingPrice   = num("sellingPrice")
    const cogs           = num("cogs")
    const platformFees   = num("platformFees", sellingPrice * 0.15)
    const shipping       = num("shippingToWarehouse", 1.5)
    const avgDailySales  = num("avgDailySales")
    const inventory      = num("currentInventory")
    const adSpend        = num("monthlyAdSpend")
    const acos           = num("acos") > 1 ? num("acos") / 100 : num("acos") // accept 0–1 or 0–100
    const returnRate     = num("returnRate") > 1 ? num("returnRate") / 100 : num("returnRate")
    const storageFee     = num("monthlyStorageFee")
    const discountCost   = num("monthlyDiscountCost")
    const leadTime       = num("reorderLeadTimeDays", 21)
    const reorderPoint   = num("reorderPoint", avgDailySales * leadTime)
    const reorderQty     = num("reorderQuantity", avgDailySales * 60)

    const avgMonthlySales  = Math.round(avgDailySales * 30)
    const monthlyRevenue   = sellingPrice * avgMonthlySales
    const monthlyReturns   = monthlyRevenue * returnRate * 0.25
    const grossMargin      = sellingPrice - cogs - platformFees - shipping
    const netProfitPerUnit = grossMargin - (adSpend / Math.max(avgMonthlySales, 1)) - (monthlyReturns / Math.max(avgMonthlySales, 1)) - (storageFee / Math.max(avgMonthlySales, 1))
    const netProfitMonthly = netProfitPerUnit * avgMonthlySales
    const marginPercent    = sellingPrice > 0 ? (netProfitMonthly / monthlyRevenue) * 100 : 0
    const daysUntilStockout = avgDailySales > 0 ? Math.floor(inventory / avgDailySales) : 999

    return {
      id,
      name,
      sku:                 str("sku") || undefined,
      asin:                str("asin") || undefined,
      channel:             "amazon",
      status:              "active",
      category:            str("category") || "General",

      currentInventory:    inventory,
      reorderLeadTimeDays: leadTime,
      reorderPoint,
      reorderQuantity:     reorderQty,

      sellingPrice,
      cogs,
      platformFees,
      shippingToWarehouse: shipping,

      avgDailySales,
      avgMonthlySales,
      monthlyRevenue,

      monthlyAdSpend:      adSpend,
      acos,
      ppcRevenueShare:     acos * 0.6, // rough estimate

      returnRate,
      monthlyReturns,

      monthlyStorageFee:   storageFee,
      monthlyDiscountCost: discountCost,

      grossMarginPerUnit:  grossMargin,
      netProfitPerUnit,
      netProfitMonthly,
      marginPercent,
      daysUntilStockout,

      marginTrend:         "stable",
      salesVelocityTrend:  "stable",
      adSpendTrend:        "stable",

      lastUpdated:         new Date().toISOString(),
    }
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const manualCsvAdapter = new ManualCsvAdapter()
