/**
 * Live market data for a keyword. Uses Rainforest API when RAINFOREST_API_KEY is set; otherwise stub.
 */

const RAINFOREST_BASE = "https://api.rainforestapi.com/request"
const TOP_N = 10

export type TopCompetitor = {
  position: number
  title: string
  price: number
  ratingsTotal: number
  rating?: number
  /** Brand from Rainforest when available; otherwise inferred from first word of title */
  brand?: string
  sponsored?: boolean
}

export type MarketDataResult = {
  success: boolean
  avgPrice: number
  avgRating: number
  avgReviews: number
  dominantBrand: boolean
  topTitles: string[]
  topPrices: number[]
  newSellersInTop10: number
  newSellersInTop20: number
  topCompetitors?: TopCompetitor[]
  painPoints?: string[]
  competitorsWithOver1000Reviews?: number
  /** Min/max price in top results — for price compression and narrow band signals */
  priceMin?: number
  priceMax?: number
  /** Share of top results that are sponsored (0–1) — PPC saturation signal */
  sponsoredShare?: number
  /** Brand name → count in top results. Used for market domination. */
  brandCounts?: Record<string, number>
  /** Top brand(s) by presence; empty if fragmented */
  dominantBrandNames?: string[]
}

function parsePrice(value: unknown): number {
  if (value != null && typeof value === "number" && Number.isFinite(value)) return value
  if (value != null && typeof value === "string") return parseFloat(value) || 0
  return 0
}

function extractPainPointsFromTitles(titles: string[]): string[] {
  const seen = new Set<string>()
  const painKeywords = [
    "durable", "durability", "quality", "size", "sizing", "comfort", "washable", "sturdy",
    "break", "broke", "tear", "odor", "smell", "cheap", "flimsy", "small", "large",
    "fit", "material", "fabric", "easy", "hard", "difficult", "assembly", "install",
  ]
  const out: string[] = []
  const allText = titles.join(" ").toLowerCase()
  for (const kw of painKeywords) {
    if (allText.includes(kw) && !seen.has(kw)) {
      seen.add(kw)
      out.push(kw)
    }
  }
  if (out.length === 0) out.push("quality", "value", "fit")
  return out.slice(0, 6)
}

/** Infer brand from title: first word (or first two if first is short). */
function inferBrandFromTitle(title: string): string {
  const t = title.trim()
  if (!t) return ""
  const parts = t.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ""
  const first = parts[0] ?? ""
  if (first.length <= 2 && parts.length > 1) return `${first} ${parts[1] ?? ""}`.trim()
  return first
}

export async function getMarketData(keyword: string): Promise<MarketDataResult> {
  const apiKey = (process.env.RAINFOREST_API_KEY ?? "").trim()
  const domain = (process.env.RAINFOREST_DOMAIN ?? "amazon.com").trim()

  const stub: MarketDataResult = {
    success: false,
    avgPrice: 24.5,
    avgRating: 4.3,
    avgReviews: 1800,
    dominantBrand: false,
    topTitles: [],
    topPrices: [],
    newSellersInTop10: 0,
    newSellersInTop20: 0,
  }

  if (!keyword || !apiKey) return stub

  try {
    const url = new URL(RAINFOREST_BASE)
    url.searchParams.set("api_key", apiKey)
    url.searchParams.set("type", "search")
    url.searchParams.set("amazon_domain", domain)
    url.searchParams.set("search_term", keyword)
    url.searchParams.set("number_of_results", String(TOP_N))

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) })
    if (!res.ok) return stub

    const data = (await res.json()) as { search_results?: unknown[] }
    const results = data?.search_results
    if (!Array.isArray(results) || results.length === 0) return stub

    const topCompetitors: TopCompetitor[] = []
    const topTitles: string[] = []
    const topPrices: number[] = []
    let sumPrice = 0
    let sumRating = 0
    let ratingCount = 0
    let competitorsWithOver1000Reviews = 0
    let sponsoredCount = 0
    const brandCounts: Record<string, number> = {}

    for (let i = 0; i < Math.min(TOP_N, results.length); i++) {
      const r = results[i] as Record<string, unknown>
      const title = typeof r?.title === "string" ? r.title.trim() : ""
      const priceVal = (r?.price as { value?: number })?.value ?? (Array.isArray((r?.prices as { value?: number }[])) ? (r.prices as { value?: number }[])[0]?.value : undefined) ?? 0
      const price = parsePrice(priceVal)
      const ratingsTotal = typeof r?.ratings_total === "number" ? r.ratings_total : 0
      const rating = typeof r?.rating === "number" ? r.rating : undefined
      const sponsored = r?.sponsored === true
      if (sponsored) sponsoredCount++
      const brandRaw = typeof (r?.brand as string) === "string" ? (r.brand as string).trim() : ""
      const brand = brandRaw || inferBrandFromTitle(title)
      if (brand) {
        const key = brand.toLowerCase()
        brandCounts[key] = (brandCounts[key] ?? 0) + 1
      }

      topCompetitors.push({
        position: i + 1,
        title: title || `Competitor ${i + 1}`,
        price,
        ratingsTotal,
        rating,
        brand: brand || undefined,
        sponsored: sponsored || undefined,
      })
      if (title) topTitles.push(title)
      if (price > 0) {
        topPrices.push(price)
        sumPrice += price
      }
      if (rating != null && Number.isFinite(rating)) {
        sumRating += rating as number
        ratingCount++
      }
      if (ratingsTotal > 1000) competitorsWithOver1000Reviews += 1
    }

    const count = topPrices.length || 1
    const avgPrice = sumPrice / count
    const avgRating = ratingCount > 0 ? sumRating / ratingCount : 4.3
    const avgReviews =
      topCompetitors.length > 0
        ? Math.round(
            topCompetitors.reduce((a, c) => a + c.ratingsTotal, 0) / topCompetitors.length
          )
        : 1800

    const priceMin = topPrices.length > 0 ? Math.min(...topPrices) : undefined
    const priceMax = topPrices.length > 0 ? Math.max(...topPrices) : undefined
    const sponsoredShare = topCompetitors.length > 0 ? sponsoredCount / topCompetitors.length : 0
    const brandEntries = Object.entries(brandCounts).sort((a, b) => b[1] - a[1])
    const maxBrandCount = brandEntries[0]?.[1] ?? 0
    const dominantBrand = maxBrandCount >= 2 && maxBrandCount / topCompetitors.length >= 0.4
    const dominantBrandNames = dominantBrand ? brandEntries.filter(([, c]) => c >= 2).map(([name]) => name) : []

    const painPoints = extractPainPointsFromTitles(topTitles)

    return {
      success: true,
      avgPrice,
      avgRating,
      avgReviews,
      dominantBrand,
      topTitles,
      topPrices,
      newSellersInTop10: 0,
      newSellersInTop20: 0,
      topCompetitors,
      painPoints,
      competitorsWithOver1000Reviews,
      priceMin,
      priceMax,
      sponsoredShare,
      brandCounts: Object.keys(brandCounts).length > 0 ? brandCounts : undefined,
      dominantBrandNames: dominantBrandNames.length > 0 ? dominantBrandNames : undefined,
    }
  } catch {
    return stub
  }
}
