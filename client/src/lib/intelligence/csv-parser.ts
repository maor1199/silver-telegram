import type { SKU, Channel } from "./types"

// ─── CSV column spec ──────────────────────────────────────────────────────────
// Maps flexible header names → canonical field name

const HEADER_MAP: Record<string, string> = {
  // SKU identification
  sku_name: "name",         name: "name",       product: "name",       product_name: "name",
  asin: "asin",
  sku: "sku",               sku_id: "sku",
  channel: "channel",
  category: "category",

  // Inventory
  current_inventory: "currentInventory",   inventory: "currentInventory",     units_in_stock: "currentInventory",
  avg_daily_sales: "avgDailySales",        daily_sales: "avgDailySales",      units_per_day: "avgDailySales",
  avg_monthly_sales: "avgMonthlySales",    monthly_sales: "avgMonthlySales",  units_per_month: "avgMonthlySales",
  reorder_lead_time_days: "reorderLeadTimeDays", lead_time: "reorderLeadTimeDays", lead_time_days: "reorderLeadTimeDays",
  reorder_point: "reorderPoint",           reorder_at: "reorderPoint",
  reorder_quantity: "reorderQuantity",     reorder_qty: "reorderQuantity",    order_quantity: "reorderQuantity",

  // Pricing
  selling_price: "sellingPrice",           price: "sellingPrice",             sale_price: "sellingPrice",
  cogs: "cogs",                            cost_of_goods: "cogs",             unit_cost: "cogs",
  platform_fees: "platformFees",           amazon_fees: "platformFees",       fees: "platformFees",    fees_per_unit: "platformFees",
  shipping_to_warehouse: "shippingToWarehouse", inbound_shipping: "shippingToWarehouse",

  // PPC
  monthly_ad_spend: "monthlyAdSpend",      ad_spend: "monthlyAdSpend",        ppc_spend: "monthlyAdSpend",
  acos_percent: "acosPercent",             acos: "acosPercent",               acos_pct: "acosPercent",
  ppc_revenue_share: "ppcRevenueShare",

  // Returns / storage / discounts
  return_rate_percent: "returnRatePercent", return_rate: "returnRatePercent", returns_pct: "returnRatePercent",
  monthly_storage_fee: "monthlyStorageFee", storage_fee: "monthlyStorageFee", storage: "monthlyStorageFee",
  monthly_discount_cost: "monthlyDiscountCost", discount_cost: "monthlyDiscountCost", coupons: "monthlyDiscountCost",
}

const VALID_CHANNELS: Channel[] = ["amazon", "shopify", "ebay", "walmart", "tiktok", "manual"]

function parseNum(v: string | undefined, fallback = 0): number {
  if (!v || v.trim() === "") return fallback
  const n = parseFloat(v.replace(/[,$%]/g, "").trim())
  return Number.isFinite(n) ? n : fallback
}

function parseChannel(v: string | undefined): Channel {
  const lower = (v ?? "").toLowerCase().trim()
  return VALID_CHANNELS.includes(lower as Channel) ? (lower as Channel) : "amazon"
}

// ─── Derive computed fields from raw inputs ───────────────────────────────────

function deriveComputedFields(raw: Record<string, number | string>): SKU {
  const sellingPrice    = parseNum(String(raw.sellingPrice), 0)
  const cogs            = parseNum(String(raw.cogs), 0)
  const platformFees    = parseNum(String(raw.platformFees), 0)
  const shippingToWH    = parseNum(String(raw.shippingToWarehouse), 0)
  const monthlyAdSpend  = parseNum(String(raw.monthlyAdSpend), 0)
  const acosRaw         = parseNum(String(raw.acosPercent), 0)
  const acos            = acosRaw > 1 ? acosRaw / 100 : acosRaw   // accept 0.35 or 35
  const returnRateRaw   = parseNum(String(raw.returnRatePercent), 0)
  const returnRate      = returnRateRaw > 1 ? returnRateRaw / 100 : returnRateRaw
  const monthlyStorage  = parseNum(String(raw.monthlyStorageFee), 0)
  const monthlyDiscount = parseNum(String(raw.monthlyDiscountCost), 0)

  const avgDailySales   = parseNum(String(raw.avgDailySales), 0)
  const avgMonthlySales = parseNum(String(raw.avgMonthlySales), avgDailySales * 30)
  const monthlyRevenue  = sellingPrice * avgMonthlySales

  const grossMarginPerUnit = sellingPrice - cogs - platformFees - shippingToWH
  const adCostPerUnit      = avgMonthlySales > 0 ? monthlyAdSpend / avgMonthlySales : 0
  const returnCostPerUnit  = sellingPrice * returnRate
  const storageCostPerUnit = avgMonthlySales > 0 ? monthlyStorage / avgMonthlySales : 0
  const netProfitPerUnit   = grossMarginPerUnit - adCostPerUnit - returnCostPerUnit - storageCostPerUnit

  const monthlyReturns      = Math.round(sellingPrice * returnRate * avgMonthlySales)
  const netProfitMonthly    = Math.round(netProfitPerUnit * avgMonthlySales - monthlyDiscount)
  const marginPercent       = sellingPrice > 0 ? (netProfitPerUnit / sellingPrice) * 100 : 0

  const currentInventory    = parseNum(String(raw.currentInventory), 0)
  const daysUntilStockout   = avgDailySales > 0 ? Math.floor(currentInventory / avgDailySales) : 9999

  const reorderLeadTimeDays = parseNum(String(raw.reorderLeadTimeDays), 21)
  const reorderPoint        = parseNum(String(raw.reorderPoint), Math.round(avgDailySales * (reorderLeadTimeDays + 14)))
  const reorderQuantity     = parseNum(String(raw.reorderQuantity), Math.round(avgMonthlySales * 2))

  const ppcRevenueShare = acos > 0 ? Math.min(0.9, acos * (1 / Math.max(marginPercent / 100, 0.1))) : 0

  return {
    id:   String(raw.id ?? `SKU-${Math.random().toString(36).slice(2, 7).toUpperCase()}`),
    name: String(raw.name || "Unnamed SKU"),
    asin: raw.asin ? String(raw.asin) : undefined,
    sku:  raw.sku ? String(raw.sku) : undefined,
    channel: parseChannel(String(raw.channel)),
    status: "active",
    category: String(raw.category || "General"),

    currentInventory,
    reorderLeadTimeDays,
    reorderPoint,
    reorderQuantity,

    sellingPrice,
    cogs,
    platformFees,
    shippingToWarehouse: shippingToWH,

    avgDailySales,
    avgMonthlySales,
    monthlyRevenue,

    monthlyAdSpend,
    acos,
    ppcRevenueShare,

    returnRate,
    monthlyReturns,

    monthlyStorageFee: monthlyStorage,
    monthlyDiscountCost: monthlyDiscount,

    grossMarginPerUnit: Math.round(grossMarginPerUnit * 100) / 100,
    netProfitPerUnit:   Math.round(netProfitPerUnit * 100) / 100,
    netProfitMonthly,
    marginPercent:      Math.round(marginPercent * 10) / 10,
    daysUntilStockout,

    marginTrend:        "stable",
    salesVelocityTrend: "stable",
    adSpendTrend:       "stable",

    lastUpdated: new Date().toISOString(),
  }
}

// ─── Parse CSV string → SKU[] ─────────────────────────────────────────────────

export type ParseResult = {
  skus: SKU[]
  errors: string[]
  warnings: string[]
  rowCount: number
}

export function parseCSV(raw: string): ParseResult {
  const errors: string[] = []
  const warnings: string[] = []
  const skus: SKU[] = []

  // Normalise line endings
  const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(l => l.trim().length > 0)

  if (lines.length < 2) {
    return { skus: [], errors: ["CSV must contain a header row and at least one data row."], warnings: [], rowCount: 0 }
  }

  // Parse header
  const rawHeaders = parseCSVRow(lines[0]).map(h => h.toLowerCase().trim().replace(/\s+/g, "_"))
  const canonicalHeaders = rawHeaders.map(h => HEADER_MAP[h] ?? h)

  if (!canonicalHeaders.includes("name") && !rawHeaders.includes("sku_name") && !rawHeaders.includes("product_name")) {
    errors.push("Required column 'sku_name' (or 'name' / 'product_name') not found in header.")
    return { skus: [], errors, warnings, rowCount: 0 }
  }

  const REQUIRED = ["sellingPrice", "cogs", "currentInventory", "avgDailySales"]
  const missingRequired = REQUIRED.filter(f => !canonicalHeaders.includes(f))
  if (missingRequired.length > 0) {
    errors.push(`Missing required columns: ${missingRequired.join(", ")}. See template for column names.`)
    return { skus: [], errors, warnings, rowCount: 0 }
  }

  // Parse data rows
  const dataLines = lines.slice(1)

  for (let i = 0; i < dataLines.length; i++) {
    const rowNum = i + 2
    const line = dataLines[i].trim()
    if (!line) continue

    const values = parseCSVRow(line)
    if (values.length !== rawHeaders.length && values.length !== 0) {
      warnings.push(`Row ${rowNum}: ${values.length} columns found, expected ${rawHeaders.length}. Row skipped.`)
      continue
    }

    const raw: Record<string, string> = {}
    canonicalHeaders.forEach((col, idx) => {
      raw[col] = values[idx]?.trim() ?? ""
    })

    // Validate selling price
    const price = parseNum(raw.sellingPrice)
    if (price <= 0) {
      warnings.push(`Row ${rowNum} (${raw.name || "?"}): selling price is 0 or invalid. Row skipped.`)
      continue
    }

    raw.id = `R${rowNum}`

    try {
      const sku = deriveComputedFields(raw)
      skus.push(sku)
    } catch (e) {
      warnings.push(`Row ${rowNum}: failed to parse — ${String(e)}`)
    }
  }

  if (skus.length === 0 && errors.length === 0) {
    errors.push("No valid SKUs found. Check that all required fields have numeric values.")
  }

  return { skus, errors, warnings, rowCount: dataLines.length }
}

// ─── Simple CSV row tokeniser (handles quoted fields with commas) ──────────────

function parseCSVRow(line: string): string[] {
  const cells: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === "," && !inQuotes) {
      cells.push(current); current = ""
    } else {
      current += ch
    }
  }
  cells.push(current)
  return cells
}

// ─── Generate CSV template ────────────────────────────────────────────────────

export const CSV_TEMPLATE_HEADERS = [
  "sku_name", "asin", "sku", "channel", "category",
  "current_inventory", "avg_daily_sales", "avg_monthly_sales",
  "selling_price", "cogs", "platform_fees", "shipping_to_warehouse",
  "monthly_ad_spend", "acos_percent", "return_rate_percent",
  "monthly_storage_fee", "monthly_discount_cost",
  "reorder_lead_time_days", "reorder_point", "reorder_quantity",
]

export const CSV_TEMPLATE_EXAMPLE_ROWS = [
  ["Bamboo Cutting Board Set", "B08XK2J4NL", "BCB-3PK", "amazon", "Kitchen", "54", "9", "270", "34.99", "7.20", "8.40", "1.10", "820", "19", "3", "94", "120", "28", "300", "500"],
  ["Silicone Spatula Set", "B09TW3L8MK", "SSK-5PC", "amazon", "Kitchen", "620", "14", "420", "22.95", "4.80", "5.60", "0.90", "2180", "42", "4", "110", "280", "21", "200", "400"],
  ["My Product Name", "", "", "amazon", "Category", "200", "5", "150", "29.99", "8.00", "7.50", "1.50", "500", "28", "3", "80", "0", "25", "100", "200"],
]

export function generateCSVTemplate(): string {
  const rows = [
    CSV_TEMPLATE_HEADERS.join(","),
    ...CSV_TEMPLATE_EXAMPLE_ROWS.map(r => r.join(",")),
  ]
  return rows.join("\n")
}
