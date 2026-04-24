/**
 * Live market data for a keyword. Matches server intelligence: full first page (up to 30 listings).
 * Uses Rainforest API when RAINFOREST_API_KEY is set; otherwise stub.
 */

const RAINFOREST_BASE = "https://api.rainforestapi.com/request"
const SERP_SIZE = 30

export type TopCompetitor = {
  position: number
  asin?: string
  title: string
  price: number
  ratingsTotal: number
  rating?: number
  brand?: string
  sponsored?: boolean
}

export type NewSellerPresence = "high" | "moderate" | "low"
export type MarketMaturitySignal = "emerging" | "growing" | "mature"

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
  /** Pain points from real 1-2★ competitor reviews — far more accurate than title inference */
  reviewBasedPainPoints?: string[]
  /** "reviews" = sourced from real Amazon reviews; "titles" = inferred from product titles */
  painPointSource?: "reviews" | "titles"
  competitorsWithOver1000Reviews?: number
  priceMin?: number
  priceMax?: number
  sponsoredShare?: number
  brandCounts?: Record<string, number>
  dominantBrandNames?: string[]
  /** Top organic (non-sponsored) ASINs for Keepa lookup */
  topAsins?: string[]
  /** Same signals as server (full first page, up to 30) */
  review_structure_summary?: string
  new_seller_presence?: NewSellerPresence
  keyword_saturation_ratio?: string
  price_compression?: string
  brand_distribution_summary?: string
  market_maturity_signal?: MarketMaturitySignal
  sponsored_top10_count?: number
  sponsored_total_count?: number
}

function parsePrice(value: unknown): number {
  if (value != null && typeof value === "number" && Number.isFinite(value)) return value
  if (value != null && typeof value === "string") return parseFloat(value) || 0
  return 0
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

function dominantPriceBand(prices: number[]): string {
  if (prices.length === 0) return "N/A"
  const bands = [
    { label: "$0–15", min: 0, max: 15 },
    { label: "$15–30", min: 15, max: 30 },
    { label: "$30–50", min: 30, max: 50 },
    { label: "$50–75", min: 50, max: 75 },
    { label: "$75–100", min: 75, max: 100 },
    { label: "$100+", min: 100, max: 1e6 },
  ]
  const counts = bands.map((b) => prices.filter((p) => p >= b.min && p < b.max).length)
  const maxIdx = counts.indexOf(Math.max(...counts))
  return bands[maxIdx]!.label
}

function priceCompressionSentence(prices: number[]): string {
  if (prices.length === 0) return "N/A"
  const step = 5
  let bestCount = 0
  let bestMin = 0
  let bestMax = 0
  const minP = Math.min(...prices)
  const maxP = Math.max(...prices)
  for (let bandStart = Math.floor(minP / step) * step; bandStart <= maxP; bandStart += step) {
    const bandEnd = bandStart + step
    const count = prices.filter((p) => p >= bandStart && p < bandEnd).length
    if (count > bestCount) {
      bestCount = count
      bestMin = bandStart
      bestMax = bandEnd
    }
  }
  if (bestCount === 0) return "N/A"
  return `${bestCount} listings price between $${bestMin}–$${bestMax}`
}

function countKeywordInTitles(titles: string[], keyword: string): number {
  if (!keyword || !titles.length) return 0
  const kw = keyword.toLowerCase().trim()
  const words = kw.split(/\s+/).filter(Boolean)
  return titles.filter((title) => {
    const t = title.toLowerCase()
    return words.every((w) => t.includes(w))
  }).length
}

// ─── Real pain points from competitor negative reviews ────────────────────────

function extractPainPointsFromReviews(reviewTexts: string[]): string[] {
  const allText = reviewTexts.join(" ").toLowerCase()
  const phrases: [string, string][] = [
    ["breaks easily / poor durability",    "break|broke|broken|falls apart|snap|snapped|cracked|fell apart"],
    ["cheap materials / flimsy build",     "cheap|flimsy|thin|feels cheap|low quality|poor quality|bad quality|poor material"],
    ["wrong size / sizing issues",         "too small|too large|too big|doesn't fit|size issue|sizing|narrow|too wide"],
    ["smell / odor problems",              "smell|odor|stinks|stink|chemical smell|plastic smell"],
    ["difficult assembly or setup",        "hard to assemble|hard to install|confusing|difficult to|instructions"],
    ["not as described / misleading",      "not as described|misleading|false advertising|nothing like|different from picture"],
    ["stops working quickly",              "stopped working|doesn't work|doesn't last|broke after|failed after|lasted only"],
    ["comfort / ergonomics issues",        "uncomfortable|hurts|painful|too stiff|too hard|too soft"],
    ["poor stitching / weak seams",        "stitching|seam|stitch|zipper broke|unraveling|thread|fraying"],
    ["poor packaging / arrived damaged",   "arrived broken|arrived damaged|poorly packaged|crushed|missing part"],
  ]
  return phrases
    .filter(([, pattern]) => new RegExp(pattern).test(allText))
    .slice(0, 5)
    .map(([label]) => label)
}

async function fetchCompetitorReviewPainPoints(
  asin: string, apiKey: string, domain: string
): Promise<string[]> {
  try {
    const url = new URL(RAINFOREST_BASE)
    url.searchParams.set("api_key",          apiKey)
    url.searchParams.set("type",             "reviews")
    url.searchParams.set("amazon_domain",    domain)
    url.searchParams.set("asin",             asin)
    url.searchParams.set("filter_by_star",   "one_star,two_star")
    url.searchParams.set("sort_by",          "most_recent")
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return []
    const data = await res.json() as { reviews?: { body?: string; title?: string }[] }
    const texts = (data?.reviews ?? [])
      .slice(0, 15)
      .map(r => `${r.title ?? ""} ${r.body ?? ""}`.trim())
      .filter(Boolean)
    return extractPainPointsFromReviews(texts)
  } catch {
    return []
  }
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

  if (!keyword || !apiKey) {
    if (!apiKey) console.warn("[Rainforest] RAINFOREST_API_KEY missing in this environment (client/.env locally, Vercel env in production).")
    return stub
  }

  try {
    const url = new URL(RAINFOREST_BASE)
    url.searchParams.set("api_key", apiKey)
    url.searchParams.set("type", "search")
    url.searchParams.set("amazon_domain", domain)
    url.searchParams.set("search_term", keyword)
    url.searchParams.set("number_of_results", String(SERP_SIZE))
    url.searchParams.set("page", "1")

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(20000) })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.warn("[Rainforest] Request failed:", res.status, body.slice(0, 150))
      return stub
    }

    const data = (await res.json()) as { search_results?: unknown[] }
    const results = data?.search_results
    if (!Array.isArray(results) || results.length === 0) {
      console.warn("[Rainforest] No search_results in response.")
      return stub
    }

    const topCompetitors: TopCompetitor[] = []
    const topTitles: string[] = []
    const topPrices: number[] = []
    const pricesForMedian: number[] = []
    const reviewCounts: number[] = []
    const brandCounts: Record<string, number> = {}
    let sumPrice = 0
    let sumRating = 0
    let ratingCount = 0
    let sponsoredCount = 0
    let competitorsWithOver1000Reviews = 0

    const limit = Math.min(SERP_SIZE, results.length)

    for (let i = 0; i < limit; i++) {
      const r = results[i] as Record<string, unknown>
      const title = typeof r?.title === "string" ? r.title.trim() : ""
      const asin = typeof r?.asin === "string" ? r.asin.trim() : undefined
      const priceVal = (r?.price as { value?: number })?.value ?? (Array.isArray((r?.prices as { value?: number }[])) ? (r.prices as { value?: number }[])[0]?.value : undefined) ?? 0
      const price = parsePrice(priceVal)
      const ratingsTotal = typeof r?.ratings_total === "number" ? r.ratings_total : 0
      const rating = typeof r?.rating === "number" ? r.rating : undefined
      const sponsored = r?.sponsored === true
      if (sponsored) sponsoredCount++
      const brandRaw = typeof (r?.brand as string) === "string" ? (r.brand as string).trim() : ""
      const brand = brandRaw || inferBrandFromTitle(title)

      topCompetitors.push({
        position: i + 1,
        asin: asin || undefined,
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
        pricesForMedian.push(price)
        sumPrice += price
      }
      if (rating != null && Number.isFinite(rating)) {
        sumRating += rating as number
        ratingCount++
      }
      reviewCounts.push(ratingsTotal)
      if (ratingsTotal > 1000) competitorsWithOver1000Reviews++
      const b = (brand || "Unknown").toLowerCase()
      brandCounts[b] = (brandCounts[b] ?? 0) + 1
    }

    const n = topCompetitors.length
    const count = topPrices.length || 1
    const avgPrice = sumPrice / count
    const avgRating = ratingCount > 0 ? sumRating / ratingCount : 4.3
    const avgReviews =
      reviewCounts.length > 0
        ? Math.round(reviewCounts.reduce((a, c) => a + c, 0) / reviewCounts.length)
        : 1800

    const distinctBrands = Object.keys(brandCounts).length
    const maxBrandCount = Math.max(...Object.values(brandCounts), 0)
    const dominantBrand = distinctBrands > 0 && maxBrandCount >= n * 0.4

    const listingsOver5000 = reviewCounts.filter((c) => c >= 5000).length
    const listings1000To5000 = reviewCounts.filter((c) => c >= 1000 && c < 5000).length
    const listings100To1000 = reviewCounts.filter((c) => c >= 100 && c < 1000).length
    const listingsUnder100 = reviewCounts.filter((c) => c < 100).length
    const review_structure_summary = [
      listingsOver5000 ? `${listingsOver5000} listings have 5k+ reviews` : null,
      listings1000To5000 ? `${listings1000To5000} listings have 1k–5k reviews` : null,
      listings100To1000 ? `${listings100To1000} listings have 100–1k reviews` : null,
      listingsUnder100 ? `${listingsUnder100} listings under 100 reviews` : null,
    ]
      .filter(Boolean)
      .join(", ") || "N/A"

    const new_seller_count = reviewCounts.filter((c) => c < 200).length
    const new_seller_presence: NewSellerPresence =
      new_seller_count >= 5 ? "high" : new_seller_count >= 2 ? "moderate" : "low"

    const top10 = topCompetitors.slice(0, 10)
    const sponsored_top10_count = top10.filter((l) => l.sponsored).length
    const sponsored_total_count = sponsoredCount

    const brandsTop10 = new Set(top10.map((l) => (l.brand || "Unknown").toLowerCase()))
    const distinctBrandsTop10 = brandsTop10.size
    const brand_distribution_summary = dominantBrand
      ? `${distinctBrandsTop10} distinct brands in top 10; one brand dominates — concentrated.`
      : `${distinctBrandsTop10} distinct brands in top 10, ${distinctBrands} in top 30 — fragmented market.`

    const keywordInTitleCount = countKeywordInTitles(topTitles, keyword)
    const keyword_saturation_ratio =
      n > 0 ? `${keywordInTitleCount} of ${n} listings use the main keyword in title.` : "N/A"

    const price_compression = priceCompressionSentence(pricesForMedian)

    const market_maturity_signal: MarketMaturitySignal =
      listingsOver5000 >= 5 && dominantBrand
        ? "mature"
        : new_seller_count >= 4 && distinctBrands >= 8
          ? "emerging"
          : "growing"

    const painPoints = extractPainPointsFromTitles(topTitles)

    const priceMin = topPrices.length > 0 ? Math.min(...topPrices) : undefined
    const priceMax = topPrices.length > 0 ? Math.max(...topPrices) : undefined
    const sponsoredShare = n > 0 ? sponsoredCount / n : 0
    const brandEntries = Object.entries(brandCounts).sort((a, b) => b[1] - a[1])
    const dominantBrandNames = dominantBrand ? brandEntries.filter(([, c]) => c >= 2).map(([name]) => name) : []

    // Top organic ASINs for Keepa lookup (skip sponsored)
    const topAsins = topCompetitors
      .filter(c => !c.sponsored && c.asin)
      .slice(0, 3)
      .map(c => c.asin!)

    // Fetch real pain points from top competitor's negative reviews (1-2★)
    // Runs after SERP so we have a top ASIN. Costs 1 extra credit but gives real data.
    let reviewBasedPainPoints: string[] = []
    if (topAsins[0]) {
      try {
        reviewBasedPainPoints = await fetchCompetitorReviewPainPoints(topAsins[0], apiKey, domain)
      } catch {
        // Optional — title-based fallback used if this fails
      }
    }

    return {
      success: true,
      avgPrice,
      avgRating,
      avgReviews,
      dominantBrand,
      topTitles,
      topPrices,
      newSellersInTop10: top10.filter((l) => l.ratingsTotal < 200).length,
      newSellersInTop20: topCompetitors.slice(0, 20).filter((l) => l.ratingsTotal < 200).length,
      topCompetitors,
      painPoints,
      competitorsWithOver1000Reviews,
      priceMin,
      priceMax,
      sponsoredShare,
      brandCounts: Object.keys(brandCounts).length > 0 ? brandCounts : undefined,
      dominantBrandNames: dominantBrandNames.length > 0 ? dominantBrandNames : undefined,
      topAsins: topAsins.length > 0 ? topAsins : undefined,
      reviewBasedPainPoints: reviewBasedPainPoints.length > 0 ? reviewBasedPainPoints : undefined,
      painPointSource: reviewBasedPainPoints.length > 0 ? "reviews" : "titles",
      review_structure_summary,
      new_seller_presence,
      keyword_saturation_ratio,
      price_compression,
      brand_distribution_summary,
      market_maturity_signal,
      sponsored_top10_count,
      sponsored_total_count,
    }
  } catch {
    return stub
  }
}
