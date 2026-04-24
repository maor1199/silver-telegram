/**
 * Keepa API service — fetches 12-month market history for an ASIN.
 * Returns monthly-aggregated data ready for charting and verdict logic.
 *
 * CSV indices used (Keepa internal enum):
 *  [1]  = New price (cents)
 *  [3]  = Sales rank (BSR)
 *  [11] = Count of new offers (competing sellers)
 *  [15] = Rating (×10, so 43 → 4.3★)
 *  [16] = Review count
 */

const KEEPA_BASE = "https://api.keepa.com"

// ─── Types ────────────────────────────────────────────────────────────
export type KeepaMonthlyPoint = {
  month: string        // "Jan 2025" — formatted for Recharts x-axis
  bsr?: number         // Sales rank (lower = better)
  price?: number       // New price in USD
  reviews?: number     // Cumulative review count
  sellerCount?: number // Number of competing sellers
}

export type KeepaProductData = {
  asin: string
  monthlyHistory: KeepaMonthlyPoint[]   // Last 12 months, sorted oldest → newest

  // Current snapshot
  currentBsr?: number
  currentPrice?: number
  currentReviewCount?: number
  currentSellerCount?: number   // total sellers listing new condition

  // Trend signals (12-month direction)
  bsrTrend: "improving" | "declining" | "stable"
  sellerCountTrend: "growing" | "shrinking" | "stable"

  // Risk flags
  isSeasonalWarning: boolean
  seasonalityNote: string
  isPriceWarWarning: boolean
  priceWarNote: string

  // Amazon competition
  /** true = Amazon.com itself sells this product → Buy Box near-impossible */
  amazonIsSelling: boolean

  // Supply/demand
  /** % of last 30 days competitor was out of stock — >35% = demand exceeds supply */
  outOfStockPct30?: number

  // Sales velocity (prefer salesDrops over BSR formula when available)
  estimatedMonthlySales?: number
  /** Raw BSR rank-drop count in last 30 days (each drop ≈ 1 sale). More accurate than BSR formula. */
  salesDrops30?: number
  salesDrops90?: number

  // Review moat
  reviewVelocityMonthly: number    // Avg new reviews/month (last 90 days)

  // Financials
  /** Actual FBA pick+pack fee from Keepa product data (dollars). Replaces our size-tier estimate. */
  realFbaFee?: number
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Convert Keepa internal timestamp (minutes since Jan 1 2011) to Date */
function keepaTimeToDate(keepaTime: number): Date {
  return new Date((keepaTime + 21564000) * 60000)
}

/** Median of a number array */
function median(values: number[]): number {
  if (!values.length) return 0
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 === 0 ? (s[mid - 1]! + s[mid]!) / 2 : s[mid]!
}

/** Format YYYY-MM key as "Jan 2025" */
function fmtMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number)
  return new Date(y!, m! - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

/**
 * Parse a Keepa csv sub-array [time, val, time, val, ...]
 * into a Map<"YYYY-MM", number[]> (one year look-back).
 */
function parseCsvToMonthly(arr: number[] | null | undefined): Map<string, number[]> {
  const byMonth = new Map<string, number[]>()
  if (!arr || arr.length < 2) return byMonth
  const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000
  for (let i = 0; i + 1 < arr.length; i += 2) {
    const kt = arr[i]
    const val = arr[i + 1]
    if (kt == null || val == null || val < 0) continue
    const date = keepaTimeToDate(kt)
    if (date.getTime() < cutoff) continue
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const bucket = byMonth.get(key) ?? []
    bucket.push(val)
    byMonth.set(key, bucket)
  }
  return byMonth
}

/** Build sorted monthly array — integer values (BSR, reviews, seller count) */
function monthlyArray(map: Map<string, number[]>, divisor = 1): { key: string; value: number }[] {
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, vals]) => ({ key, value: Math.round(median(vals) / divisor) }))
}

// ─── Analytics ───────────────────────────────────────────────────────

function calcBsrTrend(points: { value: number }[]): "improving" | "declining" | "stable" {
  if (points.length < 4) return "stable"
  const half = Math.floor(points.length / 2)
  const avgFirst = points.slice(0, half).reduce((s, p) => s + p.value, 0) / half
  const avgLast  = points.slice(half).reduce((s, p) => s + p.value, 0) / (points.length - half)
  const change = (avgLast - avgFirst) / avgFirst  // positive = BSR rising = demand falling
  if (change < -0.15) return "improving"
  if (change > 0.20)  return "declining"
  return "stable"
}

/** Seller count trend: growing = commoditization risk; shrinking = consolidation (harder to enter) */
function calcSellerCountTrend(points: { value: number }[]): "growing" | "shrinking" | "stable" {
  if (points.length < 4) return "stable"
  const half = Math.floor(points.length / 2)
  const avgFirst = points.slice(0, half).reduce((s, p) => s + p.value, 0) / half
  const avgLast  = points.slice(half).reduce((s, p) => s + p.value, 0) / (points.length - half)
  if (avgFirst <= 0) return "stable"
  const change = (avgLast - avgFirst) / avgFirst
  if (change > 0.25)  return "growing"    // +25% more sellers = commoditizing
  if (change < -0.20) return "shrinking"  // -20% sellers = consolidating
  return "stable"
}

function calcSeasonality(bsrPoints: { key: string; value: number }[]): { isWarning: boolean; note: string } {
  if (bsrPoints.length < 6) return { isWarning: false, note: "" }
  const values = bsrPoints.map(p => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const salesAtMin = 1 / min
  const salesAtMax = 1 / max
  const ratio = salesAtMin / salesAtMax
  if (ratio > 3.0) {
    const peakMonth = bsrPoints.find(p => p.value === min)?.key ?? ""
    return {
      isWarning: true,
      note: `Demand peaks ~3× higher than trough${peakMonth ? ` (peak: ${fmtMonthKey(peakMonth)})` : ""}. Seasonal risk is HIGH.`,
    }
  }
  if (ratio > 1.8) {
    return { isWarning: true, note: `Demand varies ~${ratio.toFixed(1)}× between peak and low season. Monitor before ordering.` }
  }
  const avg = values.reduce((s, v) => s + v, 0) / values.length
  const cv = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length) / avg
  if (cv > 0.4) return { isWarning: true, note: "High BSR variance detected — possible seasonal demand." }
  return { isWarning: false, note: "BSR is relatively consistent year-round. Low seasonality risk." }
}

function calcPriceWar(pricePoints: { value: number }[]): { isWarning: boolean; note: string } {
  if (pricePoints.length < 3) return { isWarning: false, note: "" }
  const prices = pricePoints.map(p => p.value)
  const max = Math.max(...prices)
  const min = Math.min(...prices)
  const avg = prices.reduce((s, v) => s + v, 0) / prices.length
  const range = (max - min) / avg
  if (range > 0.35) {
    return {
      isWarning: true,
      note: `Price swung from $${min.toFixed(2)} to $${max.toFixed(2)} in the last year (${Math.round(range * 100)}% range). Possible price war.`,
    }
  }
  if (range > 0.20) {
    return {
      isWarning: true,
      note: `Moderate price volatility detected ($${min.toFixed(2)}–$${max.toFixed(2)}). Monitor before entering.`,
    }
  }
  return { isWarning: false, note: `Price stable: $${min.toFixed(2)}–$${max.toFixed(2)} over 12 months.` }
}

/** BSR-formula sales estimate — fallback when salesRankDrops not available */
function estimateMonthlySalesByBsr(bsr: number): number {
  if (bsr <= 0) return 0
  if (bsr < 100)    return 3000
  if (bsr < 500)    return Math.round(3000 - (bsr - 100) * 4.5)
  if (bsr < 1000)   return Math.round(1200 - (bsr - 500) * 1.8)
  if (bsr < 5000)   return Math.round(300  - (bsr - 1000) * 0.05)
  if (bsr < 20000)  return Math.round(55   - (bsr - 5000) * 0.002)
  if (bsr < 100000) return Math.round(25   - (bsr - 20000) * 0.0002)
  return Math.max(1, Math.round(10 - bsr / 500000))
}

function calcReviewVelocity(reviewPoints: { key: string; value: number }[]): number {
  if (reviewPoints.length < 2) return 0
  const sorted = reviewPoints.slice().sort((a, b) => a.key.localeCompare(b.key))
  const last3  = sorted.slice(-3)
  if (last3.length < 2) return 0
  const oldest = last3[0]!.value
  const newest = last3[last3.length - 1]!.value
  const months = last3.length - 1 || 1
  return Math.max(0, Math.round((newest - oldest) / months))
}

// ─── Main export ─────────────────────────────────────────────────────
export async function getKeepaData(asin: string): Promise<KeepaProductData | null> {
  const apiKey = (process.env.KEEPA_API_KEY ?? "").trim()
  if (!apiKey || !asin) return null

  try {
    const url = new URL(`${KEEPA_BASE}/product`)
    url.searchParams.set("key",     apiKey)
    url.searchParams.set("domain",  "1")    // amazon.com
    url.searchParams.set("asin",    asin)
    url.searchParams.set("history", "1")
    url.searchParams.set("stats",   "365")

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(12000) })
    if (!res.ok) {
      console.warn("[Keepa] Request failed:", res.status)
      return null
    }

    const data    = await res.json() as { products?: unknown[] }
    const product = data?.products?.[0] as Record<string, unknown> | undefined
    if (!product) return null

    const csv = product.csv as (number[] | null)[] | undefined

    // ── Parse CSV history tracks ──────────────────────────────────────
    // csv[3]  = Sales rank (BSR)          — always available
    // csv[1]  = New price (cents)         — available for most products
    // csv[16] = Review count              — available on some plans/products
    // csv[11] = New offer count (sellers) — available for most products
    // Note: csv[15] (rating ×10) not reliably available on standard plan
    const bsrRaw         = parseCsvToMonthly(csv?.[3]  ?? null)
    const priceRaw       = parseCsvToMonthly(csv?.[1]  ?? null)
    const reviewRaw      = parseCsvToMonthly(csv?.[16] ?? null)
    const sellerCountRaw = parseCsvToMonthly(csv?.[11] ?? null)

    const bsrMonthly         = monthlyArray(bsrRaw, 1)
    const priceMonthly       = monthlyArray(priceRaw, 100)    // cents → dollars
    const reviewMonthly      = monthlyArray(reviewRaw, 1)
    const sellerCountMonthly = monthlyArray(sellerCountRaw, 1)

    // ── Merge into unified monthly history ────────────────────────────
    const allKeys = Array.from(new Set([
      ...bsrMonthly.map(p => p.key),
      ...priceMonthly.map(p => p.key),
      ...reviewMonthly.map(p => p.key),
      ...sellerCountMonthly.map(p => p.key),
    ])).sort()

    const bsrMap         = new Map(bsrMonthly.map(p         => [p.key, p.value]))
    const priceMap       = new Map(priceMonthly.map(p       => [p.key, p.value]))
    const reviewMap      = new Map(reviewMonthly.map(p      => [p.key, p.value]))
    const sellerCountMap = new Map(sellerCountMonthly.map(p => [p.key, p.value]))

    const monthlyHistory: KeepaMonthlyPoint[] = allKeys.map(key => ({
      month:       fmtMonthKey(key),
      bsr:         bsrMap.get(key),
      price:       priceMap.get(key),
      reviews:     reviewMap.get(key),
      sellerCount: sellerCountMap.get(key),
    }))

    // ── Stats object (from stats=365 param) ───────────────────────────
    const stats = product.stats as Record<string, unknown> | undefined

    // ── Current snapshots ─────────────────────────────────────────────
    const currentBsr         = bsrMonthly.at(-1)?.value
    const currentPrice       = priceMonthly.at(-1)?.value
    const currentReviewCount = reviewMonthly.at(-1)?.value
    // Prefer live offer count from stats over csv history (more accurate)
    const statsSellerCount   = typeof stats?.totalOfferCount === "number" && (stats.totalOfferCount as number) > 0
      ? (stats.totalOfferCount as number)
      : undefined
    const currentSellerCount = statsSellerCount ?? sellerCountMonthly.at(-1)?.value

    // salesRankDrops: Keepa returns -1 when no data — filter those out
    const rawDrops30 =
      (typeof stats?.salesRankDrops30 === "number" ? (stats.salesRankDrops30 as number) : -1)
    const rawDrops90 =
      (typeof stats?.salesRankDrops90 === "number" ? (stats.salesRankDrops90 as number) : -1)
    const salesDrops30 = rawDrops30 > 0 ? rawDrops30 : undefined
    const salesDrops90 = rawDrops90 > 0 ? rawDrops90 : undefined

    // Out-of-stock %: outOfStockPercentage30 array indexed by csv type
    // Index 1 = New 3P seller OOS %. Keepa uses -1 for no data.
    const oosArr30 = stats?.outOfStockPercentage30 as number[] | undefined
    const rawOos = oosArr30?.[1] ?? -1
    const outOfStockPct30 = rawOos >= 0 ? rawOos : undefined

    // ── FBA fee (actual, from product object) ─────────────────────────
    const fbaFeesObj  = product.fbaFees as Record<string, number> | null | undefined
    const fbaFeeCents = fbaFeesObj?.pickAndPackFee ?? 0
    const realFbaFee  = fbaFeeCents > 0 ? Math.round(fbaFeeCents) / 100 : undefined

    // ── Amazon selling flag ───────────────────────────────────────────
    // Primary: stats.buyBoxIsAmazon (most reliable — reflects real Buy Box holder)
    // Fallback: availabilityAmazon === 0 (Amazon listing is in stock)
    const buyBoxIsAmazon = stats?.buyBoxIsAmazon === true
    const availNum       = typeof product.availabilityAmazon === "number" ? (product.availabilityAmazon as number) : -1
    const amazonIsSelling = buyBoxIsAmazon || availNum === 0

    // ── Derived analytics ─────────────────────────────────────────────
    const bsrTrend         = calcBsrTrend(bsrMonthly)
    const sellerCountTrend = calcSellerCountTrend(sellerCountMonthly)
    const seasonal         = calcSeasonality(bsrMonthly)
    const priceWar         = calcPriceWar(priceMonthly)
    const reviewVelocityMonthly = calcReviewVelocity(reviewMonthly)

    // Best sales estimate: salesDrops × 1.2 (each drop ≈ 1 sale; 1.2× accounts for multi-unit orders)
    // Fallback: BSR-formula estimate
    const estimatedMonthlySales =
      salesDrops30 != null && salesDrops30 > 0
        ? Math.round(salesDrops30 * 1.2)
        : currentBsr
          ? estimateMonthlySalesByBsr(currentBsr)
          : undefined

    console.log(`[Keepa] ASIN ${asin}: BSR ${currentBsr} | drops/30d ${salesDrops30 ?? "n/a"} → est. ${estimatedMonthlySales}/mo | sellers ${currentSellerCount} (${sellerCountTrend}) | FBA $${realFbaFee ?? "est"} | Amazon Buy Box: ${amazonIsSelling}`)

    return {
      asin,
      monthlyHistory,
      currentBsr,
      currentPrice,
      currentReviewCount,
      currentSellerCount,
      bsrTrend,
      sellerCountTrend,
      isSeasonalWarning: seasonal.isWarning,
      seasonalityNote: seasonal.note,
      isPriceWarWarning: priceWar.isWarning,
      priceWarNote: priceWar.note,
      amazonIsSelling,
      outOfStockPct30,
      estimatedMonthlySales,
      salesDrops30,
      salesDrops90,
      reviewVelocityMonthly,
      realFbaFee,
    }
  } catch (err) {
    console.error("[Keepa] Error fetching data:", err)
    return null
  }
}
