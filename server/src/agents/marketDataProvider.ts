/**
 * Live Intelligence Mode: fetch real-time market data for a keyword.
 * Uses Rainforest API when RAINFOREST_API_KEY is set; otherwise returns stub data.
 * Retrieves up to 30 listings (full first SERP). Extracts: title, brand, price, rating, review_count, sponsored.
 * Computes: pricing_structure, review_structure, brand_distribution, advertising_pressure, market_snapshot.
 */

import axios from "axios";

const RAINFOREST_BASE = "https://api.rainforestapi.com/request";
const SERP_SIZE = 30;

export type SerpListing = {
  position: number;
  title: string;
  brand: string;
  price: number;
  rating: number;
  review_count: number;
  sponsored: boolean;
};

export type PricingStructure = {
  average_price: number;
  median_price: number;
  dominant_price_band: string;
  /** compressed | moderate spread | dispersed */
  price_compression_vs_dispersion: string;
};

export type ReviewStructure = {
  average_reviews: number;
  median_reviews: number;
  review_distribution: string;
  distribution_summary: string;
};

export type BrandDistribution = {
  distinct_brands: number;
  dominant_brand: boolean;
  dominant_brand_name?: string;
};

export type MarketSnapshot = {
  avg_price: number;
  avg_reviews: number;
  brand_distribution: string;
  ad_presence: string;
  /** LOW <20% | MEDIUM 20–40% | HIGH >40% sponsored */
  advertising_environment: "LOW" | "MEDIUM" | "HIGH";
};

/** Review barrier: STRONG (>5k), MODERATE (1k–5k), LOW (<1k) */
export type ReviewBarrier = "STRONG" | "MODERATE" | "LOW";

export type TopCompetitor = {
  position: number;
  title: string;
  price: number;
  ratingsTotal: number;
  rating?: number;
  brand?: string;
  sponsored?: boolean;
};

export type MarketDataResult = {
  success: boolean;
  avgPrice: number;
  avgRating: number;
  avgReviews: number;
  dominantBrand: boolean;
  topTitles: string[];
  topPrices: number[];
  newSellersInTop10: number;
  newSellersInTop20: number;
  topCompetitors?: TopCompetitor[];
  painPoints?: string[];
  competitorsWithOver1000Reviews?: number;
  /** Structured SERP data (up to 30 listings) */
  listings?: SerpListing[];
  /** Computed market structure */
  pricing_structure?: PricingStructure;
  review_structure?: ReviewStructure;
  brand_distribution?: BrandDistribution;
  advertising_pressure?: number;
  market_snapshot?: MarketSnapshot;
  /** strong (>5k), moderate (1k–5k), lower (<1k) */
  review_barrier?: ReviewBarrier;
};

function parsePrice(value: unknown): number {
  if (value != null && typeof value === "number" && Number.isFinite(value)) return value;
  if (value != null && typeof value === "string") return parseFloat(value) || 0;
  return 0;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function priceCompressionVsDispersion(prices: number[]): string {
  if (prices.length < 2) return "N/A";
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((s, p) => s + (p - avg) ** 2, 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const cv = avg > 0 ? (stdDev / avg) * 100 : 0;
  return cv < 15 ? "compressed (prices clustered)" : cv > 35 ? "dispersed (wide range)" : "moderate spread";
}

function dominantPriceBand(prices: number[]): string {
  if (prices.length === 0) return "N/A";
  const bands = [
    { label: "$0–15", min: 0, max: 15 },
    { label: "$15–30", min: 15, max: 30 },
    { label: "$30–50", min: 30, max: 50 },
    { label: "$50–75", min: 50, max: 75 },
    { label: "$75–100", min: 75, max: 100 },
    { label: "$100+", min: 100, max: 1e6 },
  ];
  const counts = bands.map((b) => prices.filter((p) => p >= b.min && p < b.max).length);
  const maxIdx = counts.indexOf(Math.max(...counts));
  return bands[maxIdx]!.label;
}

function extractBrandFromTitle(title: string): string {
  if (!title || typeof title !== "string") return "";
  const t = title.trim();
  const match = t.match(/^([A-Z][A-Za-z0-9\s&'-]{1,40}?)(?:\s+[-–—]|\s+\d|$)/);
  return match ? match[1].trim() : "";
}

function extractPainPointsFromTitles(titles: string[]): string[] {
  const seen = new Set<string>();
  const painKeywords = [
    "durable", "durability", "quality", "size", "sizing", "comfort", "washable", "sturdy",
    "break", "broke", "tear", "odor", "smell", "cheap", "flimsy", "small", "large",
    "fit", "material", "fabric", "easy", "hard", "difficult", "assembly", "install",
  ];
  const out: string[] = [];
  const allText = titles.join(" ").toLowerCase();
  for (const kw of painKeywords) {
    if (allText.includes(kw) && !seen.has(kw)) {
      seen.add(kw);
      out.push(kw);
    }
  }
  if (out.length === 0) out.push("quality", "value", "fit");
  return out.slice(0, 6);
}

export async function getMarketData(keyword: string): Promise<MarketDataResult> {
  const apiKey = (process.env.RAINFOREST_API_KEY ?? "").trim();
  const domain = (process.env.RAINFOREST_DOMAIN ?? "amazon.com").trim();

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
  };

  if (!keyword || !apiKey) {
    return stub;
  }

  try {
    const { data } = await axios.get(RAINFOREST_BASE, {
      params: {
        api_key: apiKey,
        type: "search",
        amazon_domain: domain,
        search_term: keyword,
        number_of_results: SERP_SIZE,
        page: 1,
      },
      timeout: 20000,
      validateStatus: (s) => s === 200,
    });

    const results = data?.search_results;
    if (!Array.isArray(results) || results.length === 0) {
      return stub;
    }

    const listings: SerpListing[] = [];
    const topCompetitors: TopCompetitor[] = [];
    const topTitles: string[] = [];
    const topPrices: number[] = [];
    const pricesForMedian: number[] = [];
    const reviewCounts: number[] = [];
    const brandCounts: Record<string, number> = {};
    let sumPrice = 0;
    let sumRating = 0;
    let ratingCount = 0;
    let sponsoredCount = 0;
    let competitorsWithOver1000Reviews = 0;

    const limit = Math.min(SERP_SIZE, results.length);

    for (let i = 0; i < limit; i++) {
      const r = results[i];
      const title = typeof r?.title === "string" ? r.title.trim() : "";
      const priceVal = r?.price?.value ?? r?.prices?.[0]?.value ?? 0;
      const price = parsePrice(priceVal);
      const ratingsTotal = typeof r?.ratings_total === "number" ? r.ratings_total : 0;
      const rating = typeof r?.rating === "number" ? r.rating : undefined;
      const sponsored = Boolean(r?.sponsored);
      const brand = typeof r?.brand === "string" ? r.brand.trim() : extractBrandFromTitle(title);

      listings.push({
        position: i + 1,
        title: title || `Listing ${i + 1}`,
        brand: brand || "Unknown",
        price,
        rating: rating ?? 0,
        review_count: ratingsTotal,
        sponsored,
      });

      topCompetitors.push({
        position: i + 1,
        title: title || `Competitor ${i + 1}`,
        price,
        ratingsTotal,
        rating,
        brand: brand || undefined,
        sponsored,
      });

      if (title) topTitles.push(title);
      if (price > 0) {
        topPrices.push(price);
        pricesForMedian.push(price);
        sumPrice += price;
      }
      if (rating != null && Number.isFinite(rating)) {
        sumRating += rating;
        ratingCount++;
      }
      reviewCounts.push(ratingsTotal);
      if (ratingsTotal > 1000) competitorsWithOver1000Reviews += 1;
      if (sponsored) sponsoredCount += 1;

      const b = (brand || "Unknown").toLowerCase();
      brandCounts[b] = (brandCounts[b] || 0) + 1;
    }

    const n = listings.length;
    const count = topPrices.length || 1;
    const avgPrice = sumPrice / count;
    const avgRating = ratingCount > 0 ? sumRating / ratingCount : 4.3;
    const avgReviews =
      reviewCounts.length > 0
        ? Math.round(reviewCounts.reduce((a, c) => a + c, 0) / reviewCounts.length)
        : 1800;

    const medianPrice = median(pricesForMedian);
    const dominantBand = dominantPriceBand(pricesForMedian);
    const advertisingPressure = n > 0 ? sponsoredCount / n : 0;
    const distinctBrands = Object.keys(brandCounts).length;
    const maxBrandCount = Math.max(...Object.values(brandCounts), 0);
    const dominantBrand = distinctBrands > 0 && maxBrandCount >= n * 0.4;
    const dominantBrandName = dominantBrand
      ? Object.entries(brandCounts).find(([, c]) => c === maxBrandCount)?.[0]
      : undefined;

    const medianReviews = median(reviewCounts);
    const reviewDistDesc =
      avgReviews >= 10000
        ? "very high (10k+ avg)"
        : avgReviews >= 3000
          ? "high (3k–10k)"
          : avgReviews >= 500
            ? "medium (500–3k)"
            : "lower (<500)";
    const distributionSummary =
      reviewCounts.length > 0
        ? `${reviewCounts.filter((c) => c >= 5000).length} with 5k+ reviews, ${reviewCounts.filter((c) => c >= 1000 && c < 5000).length} with 1k–5k, ${reviewCounts.filter((c) => c < 1000).length} under 1k`
        : "N/A";
    const advertisingEnvironment: "LOW" | "MEDIUM" | "HIGH" =
      advertisingPressure > 0.4 ? "HIGH" : advertisingPressure >= 0.2 ? "MEDIUM" : "LOW";
    const brandDistDesc = dominantBrand
      ? `one brand dominates (${dominantBrandName ?? "unknown"})`
      : `${distinctBrands} distinct brands, fragmented`;
    const review_barrier: ReviewBarrier =
      avgReviews > 5000 ? "STRONG" : avgReviews >= 1000 ? "MODERATE" : "LOW";
    const priceCompression = priceCompressionVsDispersion(pricesForMedian);

    const painPoints = extractPainPointsFromTitles(topTitles);

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
      listings,
      pricing_structure: {
        average_price: avgPrice,
        median_price: medianPrice,
        dominant_price_band: dominantBand,
        price_compression_vs_dispersion: priceCompression,
      },
      review_structure: {
        average_reviews: avgReviews,
        median_reviews: medianReviews,
        review_distribution: reviewDistDesc,
        distribution_summary: distributionSummary,
      },
      brand_distribution: {
        distinct_brands: distinctBrands,
        dominant_brand: dominantBrand,
        dominant_brand_name: dominantBrandName,
      },
      advertising_pressure: advertisingPressure,
      market_snapshot: {
        avg_price: avgPrice,
        avg_reviews: avgReviews,
        brand_distribution: brandDistDesc,
        ad_presence: advertisingEnvironment.toLowerCase(),
        advertising_environment: advertisingEnvironment,
      },
      review_barrier,
    };
  } catch (err) {
    console.warn("[marketDataProvider] Rainforest fetch failed:", err instanceof Error ? err.message : err);
    return stub;
  }
}
