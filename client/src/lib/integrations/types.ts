// ─── Integration Abstraction Layer ────────────────────────────────────────────
// Channel-agnostic raw data interfaces.
//
// PURPOSE:
//   Decouple the risk engine from data sources.
//   All channels (Amazon, Shopify, Sellerboard, CSV) normalize to these types.
//   The intelligence layer only ever sees `SKU[]` — it never knows the origin.
//
// ADDING A NEW CHANNEL:
//   1. Create `adapters/<channel>.ts`
//   2. Implement `DataAdapter` interface
//   3. Register in the relevant import/upload flow
//   The risk engine, health score, and delta engine need zero changes.

import type { SKU } from "@/lib/intelligence/types"

// ─── Channel identifiers ──────────────────────────────────────────────────────

export type IntegrationChannel =
  | "amazon_seller_central"   // Amazon SP-API or CSV export
  | "shopify"                 // Shopify Admin API
  | "sellerboard"             // Sellerboard CSV export
  | "manual_csv"              // User-uploaded generic CSV
  | "demo"                    // Internal demo/mock data

// ─── Connection config ────────────────────────────────────────────────────────

export type IntegrationConfig = {
  channel:      IntegrationChannel
  displayName:  string
  isLive:       boolean   // true = API, false = CSV/manual
  connectedAt?: string    // ISO date if connected
  lastSyncAt?:  string    // ISO date of last data pull
}

// ─── Raw data shapes (before normalization) ───────────────────────────────────
// Each adapter receives its channel's native shape and returns SKU[].
// These are loose / partial — adapters handle missing fields gracefully.

export type RawAmazonRow = {
  asin:                 string
  sku:                  string
  title:                string
  price:                number
  cogs?:                number
  units_sold_30d:       number
  revenue_30d:          number
  ad_spend_30d:         number
  acos:                 number             // decimal 0–1
  fnsku?:               string
  inbound_quantity?:    number
  afn_fulfillable_qty:  number
  reserved_qty?:        number
  lead_time_days?:      number
  return_rate?:         number             // decimal 0–1
  storage_fee_30d?:     number
  referral_fee_pct?:    number
  fba_fee_per_unit?:    number
}

export type RawShopifyOrder = {
  product_id:           string
  variant_id:           string
  title:                string
  sku?:                 string
  price:                number
  cost?:                number
  quantity:             number
  created_at:           string
  refunded?:            boolean
}

export type RawShopifyInventory = {
  product_id:           string
  variant_id:           string
  title:                string
  sku?:                 string
  inventory_quantity:   number
  lead_time_days?:      number
}

export type RawSellerboardRow = {
  asin:                 string
  title:                string
  revenue:              number
  cogs:                 number
  amazon_fees:          number
  ad_spend:             number
  units:                number
  returns:              number
  fba_inventory:        number
  storage_fees:         number
  net_profit:           number
}

export type RawManualCsvRow = {
  [key: string]: string | number | undefined
}

// ─── Adapter result ───────────────────────────────────────────────────────────

export type AdapterResult = {
  skus:      SKU[]
  warnings:  string[]    // non-fatal issues (missing fields, approximations used)
  errors:    string[]    // fatal issues per-row
  rowCount:  number
  source:    IntegrationChannel
}
