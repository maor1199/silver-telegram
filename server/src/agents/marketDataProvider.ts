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

/** New seller presence on first page (listings under 200 reviews) */
export type NewSellerPresence = "high" | "moderate" | "low";

/** Market maturity from review tiers and brand repetition */
export type MarketMaturitySignal = "emerging" | "growing" | "mature";

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
  review_barrier?: ReviewBarrier;
  /** Review tiers (from full first page, up to 30) */
  listings_over_5000_reviews?: number;
  listings_1000_to_5000_reviews?: number;
  listings_100_to_1000_reviews?: number;
  listings_under_100_reviews?: number;
  review_structure_summary?: string;
  /** Listings with under 200 reviews */
  new_seller_count?: number;
  new_seller_presence?: NewSellerPresence;
  sponsored_top10_count?: number;
  sponsored_total_count?: number;
  /** low | medium | high (derived from sponsored share) */
  advertising_environment?: "low" | "medium" | "high";
  /** e.g. "7 listings price between $35–$39" */
  price_compression?: string;
  /** e.g. "18 of 30 listings use the main keyword in title." */
  keyword_saturation_ratio?: string;
  /** e.g. "9 distinct brands in top 10 — fragmented market." */
  brand_distribution_summary?: string;
  market_maturity_signal?: MarketMaturitySignal;
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

/** e.g. "7 listings price between $35–$39" */
function priceCompressionSentence(prices: number[]): string {
  if (prices.length === 0) return "N/A";
  const step = 5;
  let bestCount = 0;
  let bestMin = 0;
  let bestMax = 0;
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  for (let bandStart = Math.floor(minP / step) * step; bandStart <= maxP; bandStart += step) {
    const bandEnd = bandStart + step;
    const count = prices.filter((p) => p >= bandStart && p < bandEnd).length;
    if (count > bestCount) {
      bestCount = count;
      bestMin = bandStart;
      bestMax = bandEnd;
    }
  }
  if (bestCount === 0) return "N/A";
  return `${bestCount} listings price between $${bestMin}–$${bestMax}`;
}

function countKeywordInTitles(titles: string[], keyword: string): number {
  if (!keyword || !titles.length) return 0;
  const kw = keyword.toLowerCase().trim();
  const words = kw.split(/\s+/).filter(Boolean);
  return titles.filter((title) => {
    const t = title.toLowerCase();
    return words.every((w) => t.includes(w));
  }).length;
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
    const priceCompressionSentenceText = priceCompressionSentence(pricesForMedian);

    const listingsOver5000 = reviewCounts.filter((c) => c >= 5000).length;
    const listings1000To5000 = reviewCounts.filter((c) => c >= 1000 && c < 5000).length;
    const listings100To1000 = reviewCounts.filter((c) => c >= 100 && c < 1000).length;
    const listingsUnder100 = reviewCounts.filter((c) => c < 100).length;
    const review_structure_summary = [
      listingsOver5000 ? `${listingsOver5000} listings have 5k+ reviews` : null,
      listings1000To5000 ? `${listings1000To5000} listings have 1k–5k reviews` : null,
      listings100To1000 ? `${listings100To1000} listings have 100–1k reviews` : null,
      listingsUnder100 ? `${listingsUnder100} listings under 100 reviews` : null,
    ]
      .filter(Boolean)
      .join(", ") || "N/A";
    const new_seller_count = reviewCounts.filter((c) => c < 200).length;
    const new_seller_presence: NewSellerPresence =
      new_seller_count >= 5 ? "high" : new_seller_count >= 2 ? "moderate" : "low";
    const top10 = listings.slice(0, 10);
    const sponsored_top10_count = top10.filter((l) => l.sponsored).length;
    const sponsored_total_count = sponsoredCount;
    const advertising_environment_lower: "low" | "medium" | "high" =
      advertisingPressure > 0.4 ? "high" : advertisingPressure >= 0.2 ? "medium" : "low";
    const brandsTop10 = new Set(top10.map((l) => (l.brand || "Unknown").toLowerCase()));
    const distinctBrandsTop10 = brandsTop10.size;
    const brand_distribution_summary = dominantBrand
      ? `${distinctBrandsTop10} distinct brands in top 10; one brand dominates — concentrated.`
      : `${distinctBrandsTop10} distinct brands in top 10, ${distinctBrands} in top 30 — fragmented market.`;
    const keywordInTitleCount = countKeywordInTitles(topTitles, keyword);
    const keyword_saturation_ratio =
      n > 0 ? `${keywordInTitleCount} of ${n} listings use the main keyword in title.` : "N/A";
    const market_maturity_signal: MarketMaturitySignal =
      listingsOver5000 >= 5 && dominantBrand
        ? "mature"
        : new_seller_count >= 4 && distinctBrands >= 8
          ? "emerging"
          : "growing";

    const painPoints = extractPainPointsFromTitles(topTitles);

    return {
      success: true,
      avgPrice,
      avgRating,
      avgReviews,
      dominantBrand,
      topTitles,
      topPrices,
      newSellersInTop10: top10.filter((l) => l.review_count < 200).length,
      newSellersInTop20: listings.slice(0, 20).filter((l) => l.review_count < 200).length,
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
        ad_presence: advertising_environment_lower,
        advertising_environment: advertisingEnvironment,
      },
      review_barrier,
      listings_over_5000_reviews: listingsOver5000,
      listings_1000_to_5000_reviews: listings1000To5000,
      listings_100_to_1000_reviews: listings100To1000,
      listings_under_100_reviews: listingsUnder100,
      review_structure_summary,
      new_seller_count,
      new_seller_presence,
      sponsored_top10_count,
      sponsored_total_count,
      advertising_environment: advertising_environment_lower,
      price_compression: priceCompressionSentenceText,
      keyword_saturation_ratio,
      brand_distribution_summary,
      market_maturity_signal,
    };
  } catch (err) {
    console.warn("[marketDataProvider] Rainforest fetch failed:", err instanceof Error ? err.message : err);
    return stub;
  }
}
