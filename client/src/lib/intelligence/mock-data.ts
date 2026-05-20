import type { SKU } from "./types"

// ─── Realistic sample ecommerce SKU data ─────────────────────────────────────
// Designed to demo a range of risk scenarios:
// B001 — Stockout imminent (critical)
// B002 — PPC burning margin (high)
// B003 — Dead inventory building (medium)
// B004 — Healthy performer (info)
// B005 — High return rate (high)
// B006 — Margin collapsed on aggressive PPC (critical)

export const MOCK_SKUS: SKU[] = [
  // ── B001: Bamboo Cutting Board — CRITICAL stockout ─────────────────────────
  {
    id: "B001",
    name: "Bamboo Cutting Board Set (3-Pack)",
    asin: "B08XK2J4NL",
    sku: "BCB-3PK-2026",
    channel: "amazon",
    status: "active",
    category: "Kitchen",
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&q=80",

    currentInventory: 54,
    reorderLeadTimeDays: 28,
    reorderPoint: 300,
    reorderQuantity: 500,

    sellingPrice: 34.99,
    cogs: 7.20,
    platformFees: 8.40,
    shippingToWarehouse: 1.10,

    avgDailySales: 9,
    avgMonthlySales: 270,
    monthlyRevenue: 9447,

    monthlyAdSpend: 820,
    acos: 0.19,
    ppcRevenueShare: 0.34,

    returnRate: 0.03,
    monthlyReturns: 283,

    monthlyStorageFee: 94,
    monthlyDiscountCost: 120,

    grossMarginPerUnit: 18.29,
    netProfitPerUnit: 11.10,
    netProfitMonthly: 2997,
    marginPercent: 31.7,
    daysUntilStockout: 6,

    marginTrend: "stable",
    salesVelocityTrend: "up",
    adSpendTrend: "stable",

    lastUpdated: "2026-05-20T08:00:00Z",
  },

  // ── B002: Silicone Spatula Set — PPC destroying margin ────────────────────
  {
    id: "B002",
    name: "Silicone Kitchen Spatula Set (5-Piece)",
    asin: "B09TW3L8MK",
    sku: "SSK-5PC-2026",
    channel: "amazon",
    status: "active",
    category: "Kitchen",
    imageUrl: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=200&q=80",

    currentInventory: 620,
    reorderLeadTimeDays: 21,
    reorderPoint: 200,
    reorderQuantity: 400,

    sellingPrice: 22.95,
    cogs: 4.80,
    platformFees: 5.60,
    shippingToWarehouse: 0.90,

    avgDailySales: 14,
    avgMonthlySales: 420,
    monthlyRevenue: 9639,

    monthlyAdSpend: 2180,
    acos: 0.42,
    ppcRevenueShare: 0.58,

    returnRate: 0.04,
    monthlyReturns: 386,

    monthlyStorageFee: 110,
    monthlyDiscountCost: 280,

    grossMarginPerUnit: 11.65,
    netProfitPerUnit: 2.48,
    netProfitMonthly: 1042,
    marginPercent: 10.8,
    daysUntilStockout: 44,

    marginTrend: "down",
    salesVelocityTrend: "stable",
    adSpendTrend: "up",

    lastUpdated: "2026-05-20T08:00:00Z",
  },

  // ── B003: Foam Roller Pro — Dead inventory risk ────────────────────────────
  {
    id: "B003",
    name: "High-Density Foam Roller Pro",
    asin: "B07RX4N5PQ",
    sku: "FRP-HD-2026",
    channel: "amazon",
    status: "active",
    category: "Sports & Fitness",
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=200&q=80",

    currentInventory: 480,
    reorderLeadTimeDays: 30,
    reorderPoint: 60,
    reorderQuantity: 200,

    sellingPrice: 29.95,
    cogs: 8.10,
    platformFees: 7.20,
    shippingToWarehouse: 1.40,

    avgDailySales: 2,
    avgMonthlySales: 60,
    monthlyRevenue: 1797,

    monthlyAdSpend: 220,
    acos: 0.31,
    ppcRevenueShare: 0.41,

    returnRate: 0.05,
    monthlyReturns: 90,

    monthlyStorageFee: 460,
    monthlyDiscountCost: 55,

    grossMarginPerUnit: 13.25,
    netProfitPerUnit: 3.40,
    netProfitMonthly: 204,
    marginPercent: 11.4,
    daysUntilStockout: 240,

    marginTrend: "down",
    salesVelocityTrend: "down",
    adSpendTrend: "stable",

    lastUpdated: "2026-05-20T08:00:00Z",
  },

  // ── B004: LED Desk Lamp — Healthy performer ────────────────────────────────
  {
    id: "B004",
    name: "LED Desk Lamp with USB Charging",
    asin: "B08P2X3QRM",
    sku: "LDL-USB-2026",
    channel: "amazon",
    status: "active",
    category: "Home Office",
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=200&q=80",

    currentInventory: 340,
    reorderLeadTimeDays: 25,
    reorderPoint: 120,
    reorderQuantity: 300,

    sellingPrice: 39.99,
    cogs: 9.50,
    platformFees: 9.40,
    shippingToWarehouse: 1.80,

    avgDailySales: 11,
    avgMonthlySales: 330,
    monthlyRevenue: 13197,

    monthlyAdSpend: 1180,
    acos: 0.21,
    ppcRevenueShare: 0.29,

    returnRate: 0.03,
    monthlyReturns: 396,

    monthlyStorageFee: 124,
    monthlyDiscountCost: 180,

    grossMarginPerUnit: 19.29,
    netProfitPerUnit: 13.20,
    netProfitMonthly: 4356,
    marginPercent: 33.0,
    daysUntilStockout: 31,

    marginTrend: "up",
    salesVelocityTrend: "up",
    adSpendTrend: "stable",

    lastUpdated: "2026-05-20T08:00:00Z",
  },

  // ── B005: Yoga Mat — High return rate ─────────────────────────────────────
  {
    id: "B005",
    name: "Premium Non-Slip Yoga Mat 6mm",
    asin: "B09LK7R3PX",
    sku: "YMT-6MM-2026",
    channel: "amazon",
    status: "active",
    category: "Sports & Fitness",
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=200&q=80",

    currentInventory: 210,
    reorderLeadTimeDays: 35,
    reorderPoint: 80,
    reorderQuantity: 250,

    sellingPrice: 44.95,
    cogs: 11.20,
    platformFees: 10.50,
    shippingToWarehouse: 2.10,

    avgDailySales: 7,
    avgMonthlySales: 210,
    monthlyRevenue: 9440,

    monthlyAdSpend: 980,
    acos: 0.26,
    ppcRevenueShare: 0.37,

    returnRate: 0.16,
    monthlyReturns: 1511,

    monthlyStorageFee: 148,
    monthlyDiscountCost: 220,

    grossMarginPerUnit: 21.15,
    netProfitPerUnit: 4.40,
    netProfitMonthly: 924,
    marginPercent: 9.8,
    daysUntilStockout: 30,

    marginTrend: "down",
    salesVelocityTrend: "stable",
    adSpendTrend: "up",

    lastUpdated: "2026-05-20T08:00:00Z",
  },

  // ── B006: Coffee Grinder — Negative margin, ACoS out of control ───────────
  {
    id: "B006",
    name: "Electric Coffee Grinder Burr 40-Setting",
    asin: "B08NVZ7S4Q",
    sku: "ECG-40S-2026",
    channel: "amazon",
    status: "active",
    category: "Kitchen",
    imageUrl: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=200&q=80",

    currentInventory: 165,
    reorderLeadTimeDays: 32,
    reorderPoint: 100,
    reorderQuantity: 200,

    sellingPrice: 59.99,
    cogs: 18.40,
    platformFees: 12.80,
    shippingToWarehouse: 2.50,

    avgDailySales: 5,
    avgMonthlySales: 150,
    monthlyRevenue: 8999,

    monthlyAdSpend: 3420,
    acos: 0.53,
    ppcRevenueShare: 0.68,

    returnRate: 0.08,
    monthlyReturns: 720,

    monthlyStorageFee: 186,
    monthlyDiscountCost: 340,

    grossMarginPerUnit: 26.29,
    netProfitPerUnit: -1.80,
    netProfitMonthly: -270,
    marginPercent: -3.0,
    daysUntilStockout: 33,

    marginTrend: "down",
    salesVelocityTrend: "stable",
    adSpendTrend: "up",

    lastUpdated: "2026-05-20T08:00:00Z",
  },
]
