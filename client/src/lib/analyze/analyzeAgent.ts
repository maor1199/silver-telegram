import { getAIInsights, getConsultantInsights, getMarginThreshold, getValidatedDifferentiators, type ConsultantInsights } from "./openaiService"
import { buildSignals } from "./signals"
import type { KeepaProductData } from "../keepa/keepaService"
import type { DataForSEOKeywordData } from "../dataforseo/dataForSeoService"

type AnalyzeInput = {
  keyword?: string
  sellingPrice?: number
  unitCost?: number
  shippingCost?: number
  fbaFee?: number
  assumedAcos?: number
  stage?: "launch" | "optimized"
  complexity?: string
  differentiation?: string
  marginThreshold?: number
  /** Keepa 12-month market intelligence for top competitor ASIN */
  keepaData?: KeepaProductData | null
  /** DataForSEO real search volume + CPC for the keyword */
  dataForSEO?: DataForSEOKeywordData | null
  /** Minimum Order Quantity from supplier — overrides velocity-based FIRST_ORDER_UNITS */
  moq?: number
  /** Supplier lead time in weeks (for display in results) */
  leadTimeWeeks?: number
  /** One-time sample cost in USD — added to launch capital */
  sampleCost?: number
  /** DataForSEO related keywords — passed to AI for better alternative_keywords and PPC suggestions */
  relatedKeywords?: string[]
  marketData?: {
    success?: boolean
    avgPrice?: number
    avgRating?: number
    avgReviews?: number
    dominantBrand?: boolean
    newSellersInTop10?: number
    newSellersInTop20?: number
    topTitles?: string[]
    topPrices?: number[]
    topCompetitors?: { position: number; title: string; price: number; ratingsTotal: number; rating?: number; brand?: string; sponsored?: boolean }[]
    painPoints?: string[]
    /** Pain points from real 1-2★ competitor reviews */
    reviewBasedPainPoints?: string[]
    /** "reviews" = sourced from real Amazon reviews; "titles" = inferred from product titles */
    painPointSource?: "reviews" | "titles"
    competitorsWithOver1000Reviews?: number
    priceMin?: number
    priceMax?: number
    sponsoredShare?: number
    brandCounts?: Record<string, number>
    dominantBrandNames?: string[]
    topAsins?: string[]
    review_structure_summary?: string
    new_seller_presence?: "high" | "moderate" | "low"
    keyword_saturation_ratio?: string
    price_compression?: string
    brand_distribution_summary?: string
    market_maturity_signal?: "emerging" | "growing" | "mature"
    sponsored_top10_count?: number
    sponsored_total_count?: number
  } | null
}

function asNumber(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback
}

/** Overview "What would flip" — derived from unified execution_plan (single AI field). */
function whatWouldFlipFromExecutionPlan(verdict: string, plan: string[]): string[] | undefined {
  if (verdict !== "NO_GO" && verdict !== "IMPROVE_BEFORE_LAUNCH") return undefined
  if (!plan.length) return undefined
  const lower = plan.map((s) => s.toLowerCase().trim())
  if (verdict === "NO_GO") {
    const iFix = lower.findIndex((s) => s.includes("what to fix"))
    const iBetter = lower.findIndex((s) => s.includes("better move"))
    if (iFix >= 0 && iBetter > iFix) {
      const mid = plan.slice(iFix + 1, iBetter).filter((s) => String(s).trim().length > 0)
      if (mid.length) return mid.slice(0, 3)
    }
  } else {
    const iDo = lower.findIndex((s) => s === "what to do" || s.includes("what to do"))
    const iRc = lower.findIndex((s) => s.includes("reality check"))
    if (iDo >= 0 && iRc > iDo) {
      const mid = plan.slice(iDo + 1, iRc).filter((s) => String(s).trim().length > 0)
      if (mid.length) return mid.slice(0, 3)
    }
    if (iDo >= 0) {
      const mid = plan.slice(iDo + 1, iDo + 5).filter((s) => String(s).trim().length > 0)
      if (mid.length) return mid.slice(0, 3)
    }
  }
  const rest = plan.slice(1).filter((s) => !/^(why it fails|critical gaps|game plan)$/i.test(String(s).trim()))
  return (rest.length ? rest : plan).slice(0, 3)
}

/** Dynamic ACoS from market data (competition, review barrier, keyword opportunity, price compression). */
function calculateDynamicACoS(marketData: {
  sponsoredTop10?: number
  avgReviews?: number
  newSellerPresence?: string
  keywordSaturation?: number
  priceCompression?: string
}): number {
  const sponsoredTop10 = marketData.sponsoredTop10 ?? 0
  const avgReviews = marketData.avgReviews ?? 1800
  const newSellerPresence = marketData.newSellerPresence
  const keywordSaturation = marketData.keywordSaturation ?? 30
  const priceCompression = marketData.priceCompression

  let acos = 0.35
  if (sponsoredTop10 >= 7) acos += 0.1
  else if (sponsoredTop10 >= 4) acos += 0.05
  if (avgReviews >= 5000) acos += 0.1
  else if (avgReviews >= 2000) acos += 0.05
  else if (avgReviews <= 500) acos -= 0.1
  if (newSellerPresence === "high") acos -= 0.1
  else if (newSellerPresence === "moderate") acos -= 0.05
  if (keywordSaturation === 0) acos -= 0.08
  else if (keywordSaturation <= 3) acos -= 0.04
  if (priceCompression === "high") acos += 0.05
  acos = Math.max(0.2, Math.min(0.65, acos))
  return parseFloat(acos.toFixed(2))
}

function ensureArray(v: unknown, fallback: string[]): string[] {
  if (Array.isArray(v)) return v.map(String)
  if (typeof v === "string" && v.trim()) return [v.trim()]
  return fallback
}

/**
 * Estimate FBA fulfillment fee by selling price as a size-tier proxy.
 * Real fees depend on dimensions + weight; this is a conservative estimate.
 * Small Standard < $10 → $3.22 | Light Large $10-20 → $4.75
 * Large Standard $20-40 → $6.50 | $40-75 → $8.50 | $75-150 → $11.50 | $150+ → $15.00
 */
function estimateFbaFee(price: number): number {
  if (price < 10) return 3.22
  if (price < 20) return 4.75
  if (price < 40) return 6.50
  if (price < 75) return 8.50
  if (price < 150) return 11.50
  return 15.00
}

/**
 * Amazon referral fee rate by category, inferred from keyword.
 * Electronics/Computers → 8% | Clothing/Shoes → 17% | Jewelry → 20%
 * Everything else (Home, Pet, Sports, Kitchen, Beauty, Toy, etc.) → 15%
 */
function estimateReferralFeeRate(keyword: string): number {
  const kw = keyword.toLowerCase()
  if (/\b(electronic|laptop|computer|desktop|phone|smartphone|tablet|camera|headphone|headset|speaker|monitor|tv|television|printer|keyboard|mouse|drone|robot|projector|smartwatch)\b/.test(kw)) return 0.08
  if (/\b(cloth|clothing|shirt|t-shirt|dress|shoes?|sneaker|boot|apparel|fashion|jacket|coat|jeans?|pants|hoodie|legging|swimsuit|sportswear)\b/.test(kw)) return 0.17
  if (/\b(jewelry|jewellery|necklace|bracelet|ring|earring|pendant|brooch|anklet)\b/.test(kw)) return 0.20
  return 0.15  // Home, Pet, Sports, Kitchen, Beauty, Toy, Baby, Books, etc.
}

export async function analyzeProduct(input: AnalyzeInput) {
  const keyword = asString(input.keyword, "cat cave").trim() || "cat cave"
  const sellingPrice = asNumber(input.sellingPrice, 44)
  const unitCost = asNumber(input.unitCost, 4)
  const shippingCost = asNumber(input.shippingCost, 2)
  // Use Keepa's actual FBA fee when available — replaces size-tier estimate with real number
  // FBA fee hierarchy: user override → Keepa pickAndPackFee → dimension-based calc → price-tier estimate
  const fbaFee = asNumber(input.fbaFee, 0)
    || input.keepaData?.realFbaFee
    || input.keepaData?.fbaFeeFromDimensions
    || estimateFbaFee(sellingPrice)
  const complexity = (input.complexity ?? "").toString().toLowerCase()
  const differentiationInput = asString(input.differentiation, "").trim()

  const complexityBufferPct = complexity === "high" ? 0.12 : complexity === "medium" ? 0.08 : 0
  const operationalRiskBufferDollars = unitCost * complexityBufferPct
  const effectiveUnitCost = unitCost + operationalRiskBufferDollars

  const market = input.marketData
  const avgPrice = market?.avgPrice ?? 24.5
  const avgReviews = market?.avgReviews ?? 1800
  const avgRating = market?.avgRating ?? 4.3
  const dominantBrand = market?.dominantBrand ?? false
  const newSellersInTop10 = market?.newSellersInTop10 ?? 0
  const newSellersInTop20 = market?.newSellersInTop20 ?? 0
  const sponsoredTop10Count = market?.sponsored_top10_count ?? 0
  const hasRealMarketData = Boolean(market?.success)
  const competitorsWithOver1000Reviews = market?.competitorsWithOver1000Reviews ?? 0
  // Prefer real review-based pain points over title-inferred ones
  const painPoints = Array.isArray(market?.reviewBasedPainPoints) && (market.reviewBasedPainPoints?.length ?? 0) > 0
    ? market.reviewBasedPainPoints!
    : Array.isArray(market?.painPoints) ? market.painPoints : []
  const topCompetitors = market?.topCompetitors ?? []
  const priceMin = market?.priceMin
  const priceMax = market?.priceMax
  const sponsoredShare = market?.sponsoredShare ?? 0
  const brandCounts = market?.brandCounts ?? {}
  const dominantBrandNames = market?.dominantBrandNames ?? []

  const diffInputLower = differentiationInput.toLowerCase()
  const mentionsPainPoint = painPoints.length > 0 && painPoints.some((p) => diffInputLower.includes(String(p).toLowerCase()))
  const differentiationScore =
    differentiationInput.length < 50 || !mentionsPainPoint ? ("Weak" as const) : ("Strong" as const)
  const painPoint1 = painPoints[0] ?? "quality"
  const gapTip =
    differentiationScore === "Weak" && painPoints.length > 0
      ? `The market complains about ${painPoint1}. Your current plan doesn't solve this. Adding a clear solution for ${painPoint1} in your bullets and images would double your conversion rate.`
      : undefined

  const marketDensityHigh = competitorsWithOver1000Reviews >= 3
  let acosFloor = marketDensityHigh ? 0.40 : 0.25
  // Aligned with the Differentiation Score card — weak text (<50 chars or no pain-point mention)
  // means the seller has no real edge → ACoS floor rises (more PPC needed to compensate)
  const differentiationStrong = differentiationInput.length >= 50 && mentionsPainPoint
  if (!differentiationStrong) acosFloor = Math.max(acosFloor, 0.38)

  // 6.5% is realistic for a new listing with 0–10 reviews; 10% is after Vine reviews + listing polish
  const LAUNCH_CVR = 0.065
  let baseCpcDollars: number
  if (avgReviews > 20000) baseCpcDollars = 3.25
  else if (avgReviews >= 5000) baseCpcDollars = 2.1
  else if (avgReviews >= 1000) baseCpcDollars = 1.45
  else baseCpcDollars = 0.9
  const keywordLower = keyword.toLowerCase()
  const categoryWeight =
    /\b(electronic|laptop|computer|phone|tablet|camera|drone|robot|gadget|smartwatch)\b/.test(keywordLower) ? 1.3 :
    /\b(supplement|vitamin|protein|probiotic|collagen|omega|creatine|whey)\b/.test(keywordLower) ? 1.25 :
    /\b(beauty|skincare|makeup|cosmetic|serum|face cream|anti.aging|moisturizer)\b/.test(keywordLower) ? 1.2 :
    /\b(power tool|drill|saw|grinder|hardware|automotive|mechanic)\b/.test(keywordLower) ? 1.15 :
    /\b(toy|game|puzzle|kids|children|baby product)\b/.test(keywordLower) ? 1.1 :
    /\b(clothing|apparel|fashion|shirt|shoes|sneaker|jacket|dress)\b/.test(keywordLower) ? 1.1 :
    1.0
  const baseCpcFinal = baseCpcDollars * categoryWeight

  // CPC range — declared here so it's available to both the advertising card and alternative_keywords_with_cost.
  // Uses baseCpcFinal (category × review-depth calibrated) as midpoint; ±40% spread reflects real auction variance.
  const estimatedMinCpc = Math.max(0.15, Math.round(baseCpcFinal * 0.60 * 100) / 100)
  const estimatedMaxCpc = Math.round(baseCpcFinal * 1.60 * 100) / 100
  const cpcLabel = `$${estimatedMinCpc.toFixed(2)}–$${estimatedMaxCpc.toFixed(2)}/click (est.)`

  const launchAdCostPerUnit = baseCpcFinal / LAUNCH_CVR
  // CPC-based ACoS on day 1 (before reviews improve CVR) — used to trigger the PPC cannibalization warning
  const cpcBasedLaunchAcos = sellingPrice > 0 ? launchAdCostPerUnit / sellingPrice : 0

  // ─── Market Intelligence Metrics (CPR, Opportunity Score, 5★ Price) ───────
  // CPR — Cerebro Product Rank equivalent: units a new seller must move in 8 days
  // to signal to Amazon's algorithm they belong on page 1.
  // Formula: (top competitor daily sales) × 8
  const topCompetitorMonthlySales =
    input.keepaData?.estimatedMonthlySales
    ?? (avgReviews >= 5000 ? 800 : avgReviews >= 2000 ? 500 : avgReviews >= 500 ? 300 : 150)
  const cpr = Math.max(8, Math.round((topCompetitorMonthlySales / 30) * 8))
  const topCompetitorRevenue = Math.round(topCompetitorMonthlySales * avgPrice)

  // Opportunity Score (0–99) — demand vs competition balance (like JungleScout IQ)
  // Demand pulls score up; competition barriers pull it down. Base = 50.
  let oppScore = 50
  // Demand signals
  oppScore += topCompetitorMonthlySales >= 600 ? 18 : topCompetitorMonthlySales >= 300 ? 12 : topCompetitorMonthlySales >= 150 ? 6 : 0
  if (input.keepaData?.bsrTrend === "improving") oppScore += 14
  else if (input.keepaData?.bsrTrend === "stable") oppScore += 4
  else if (input.keepaData?.bsrTrend === "declining") oppScore -= 12
  oppScore += newSellersInTop20 >= 4 ? 10 : newSellersInTop20 >= 2 ? 5 : 0
  // Competition barriers
  oppScore -= avgReviews >= 5000 ? 22 : avgReviews >= 2000 ? 14 : avgReviews >= 500 ? 7 : 0
  oppScore -= dominantBrand ? 12 : 0
  oppScore -= (market?.sponsoredShare ?? 0) > 0.5 ? 10 : (market?.sponsoredShare ?? 0) > 0.3 ? 5 : 0
  oppScore -= input.keepaData?.amazonIsSelling ? 18 : 0
  oppScore -= input.keepaData?.sellerCountTrend === "growing" ? 5 : 0
  const opportunityScore = Math.max(1, Math.min(99, Math.round(oppScore)))

  // 5-star price zone — price range of competitors with 4.5★+ rating
  const fiveStarComps = topCompetitors.filter(c => (c.rating ?? 0) >= 4.5 && c.price > 0)
  const fiveStarPriceRange =
    fiveStarComps.length >= 2
      ? (() => {
          const prices = fiveStarComps.map(c => c.price).sort((a, b) => a - b)
          const lo = prices[0]
          const hi = prices[prices.length - 1]
          return `$${lo.toFixed(0)}–$${hi.toFixed(0)}`
        })()
      : null

  // ── Niche Revenue Estimator ──────────────────────────────────────────────
  // Estimate monthly sales for each organic top-10 competitor using the
  // same reviews-based proxy, then sum for total niche size.
  const organicCompetitors = topCompetitors.filter(c => !c.sponsored).slice(0, 10)
  const nicheCompData = organicCompetitors.length >= 3
    ? organicCompetitors.map(c => {
        const rev = c.ratingsTotal ?? 0
        const estSales = rev >= 5000 ? 650 : rev >= 2000 ? 450 : rev >= 500 ? 250 : 120
        return { estSales, price: c.price > 0 ? c.price : avgPrice }
      })
    : null
  const nicheMonthlyUnits = nicheCompData
    ? Math.round(nicheCompData.reduce((s, c) => s + c.estSales, 0))
    : Math.round(topCompetitorMonthlySales * 6) // fallback: 6 competitors at top-seller velocity
  const nicheMonthlyRevenue = nicheCompData
    ? Math.round(nicheCompData.reduce((s, c) => s + c.estSales * c.price, 0))
    : Math.round(nicheMonthlyUnits * avgPrice)

  // ── Demand Score (0–100) ─────────────────────────────────────────────────
  // Pure demand signal — how strong is buyer appetite, independent of competition.
  // DataForSEO search volume is the strongest signal when available (replaces guesswork).
  const dfsSearchVol    = input.dataForSEO?.searchVolume ?? null
  const dfsVolSource    = input.dataForSEO?.searchVolumeSource ?? null
  const dfsVolLabel     = dfsVolSource === "amazon" ? "Amazon searches/mo" : "Google searches/mo (proxy)"
  let dScore = 35
  if (dfsSearchVol != null) {
    // Real search data — override the sales-velocity proxy
    dScore += dfsSearchVol >= 40000 ? 30
            : dfsSearchVol >= 10000 ? 22
            : dfsSearchVol >= 2000  ? 14
            : dfsSearchVol >= 500   ? 6
            : dfsSearchVol >= 100   ? 0
            : -15 // near-zero demand
  } else {
    // Fallback: infer from top competitor sales velocity
    dScore += topCompetitorMonthlySales >= 600 ? 25 : topCompetitorMonthlySales >= 300 ? 15 : topCompetitorMonthlySales >= 150 ? 8 : 2
  }
  if (input.keepaData?.bsrTrend === "improving") dScore += 22
  else if (input.keepaData?.bsrTrend === "stable") dScore += 10
  else if (input.keepaData?.bsrTrend === "declining") dScore -= 18
  // DataForSEO search trend reinforces or tempers the Keepa signal
  if (input.dataForSEO?.searchTrend === "growing" && input.keepaData?.bsrTrend !== "improving") dScore += 8
  else if (input.dataForSEO?.searchTrend === "declining" && input.keepaData?.bsrTrend !== "declining") dScore -= 8
  const reviewVel = input.keepaData?.reviewVelocityMonthly ?? 0
  dScore += reviewVel >= 50 ? 15 : reviewVel >= 20 ? 8 : reviewVel >= 5 ? 3 : 0
  if (market?.market_maturity_signal === "emerging") dScore += 12
  else if (market?.market_maturity_signal === "mature") dScore -= 8
  dScore += nicheMonthlyRevenue >= 500000 ? 8 : nicheMonthlyRevenue >= 200000 ? 4 : 0
  const demandScore = Math.max(1, Math.min(99, Math.round(dScore)))

  // Review mining — top pain points already extracted above as `painPoints`
  // (sourced from reviewBasedPainPoints when available, else title-inferred)

  // Use Keepa estimated sales velocity when available — far more accurate than hardcoded defaults.
  // SALES_PER_DAY: Keepa monthly ÷ 30, floored at 1, capped at 100 (no fantasy numbers).
  // FIRST_ORDER_UNITS: 2 months of velocity — enough to survive launch without over-committing.
  const _keepaForCapital = input.keepaData ?? null
  const SALES_PER_DAY = _keepaForCapital?.estimatedMonthlySales
    ? Math.min(100, Math.max(1, Math.round(_keepaForCapital.estimatedMonthlySales / 30)))
    : 7
  // If user provided an MOQ, use it directly — their real constraint. Otherwise estimate from velocity.
  const FIRST_ORDER_UNITS = input.moq != null && input.moq > 0
    ? input.moq
    : _keepaForCapital?.estimatedMonthlySales
      ? Math.min(500, Math.max(150, Math.round(SALES_PER_DAY * 60)))  // 2 months, capped 150–500
      : 300
  const LAUNCH_DAYS = 30
  const VINE_AND_MISC = 500
  const sampleCostActual = input.sampleCost ?? 0
  const launchInventoryCost = (unitCost + shippingCost) * FIRST_ORDER_UNITS
  const launchPpcBurn = launchAdCostPerUnit * SALES_PER_DAY * LAUNCH_DAYS
  // Storage buffer: 3 months of storage cost on first inventory order
  const storageCostBuffer = _keepaForCapital?.estimatedMonthlyStoragePerUnit
    ? Math.round(_keepaForCapital.estimatedMonthlyStoragePerUnit * FIRST_ORDER_UNITS * 3 * 100) / 100
    : 0
  const launchCapitalRequired = launchInventoryCost + launchPpcBurn + VINE_AND_MISC + storageCostBuffer + sampleCostActual
  const launchCapitalBreakdown = {
    inventory: launchInventoryCost,
    ppcMarketing: launchPpcBurn,
    vineAndMisc: VINE_AND_MISC,
    storage: storageCostBuffer > 0 ? storageCostBuffer : undefined,
    sample: sampleCostActual > 0 ? sampleCostActual : undefined,
    total: launchCapitalRequired,
  }

  // Dynamic ACoS from market data (for launch and for display in Market Signals).
  const keywordSaturationCount = (() => {
    const s = market?.keyword_saturation_ratio
    if (!s || typeof s !== "string") return undefined
    const m = s.match(/^(\d+)\s*of\s*\d+/)
    return m ? parseInt(m[1], 10) : undefined
  })()
  const priceCompressionHigh =
    (() => {
      const s = market?.price_compression
      if (!s || typeof s !== "string" || s === "N/A") return false
      const m = s.match(/^(\d+)\s+listings/)
      return m ? parseInt(m[1], 10) >= 10 : false
    })()
      ? "high"
      : undefined
  const marketDataForAcos = market
    ? {
        sponsoredTop10: market?.sponsored_top10_count ?? 0,
        avgReviews: market?.avgReviews ?? 1800,
        newSellerPresence: market?.new_seller_presence,
        keywordSaturation: keywordSaturationCount ?? 30,
        priceCompression: priceCompressionHigh,
      }
    : undefined
  const dynamicAcosForMarket =
    marketDataForAcos != null ? calculateDynamicACoS(marketDataForAcos) : undefined

  const stage = input.stage === "launch" || input.stage === "optimized" ? input.stage : "optimized"
  const baseAcos = hasRealMarketData ? (dynamicAcosForMarket ?? 0.35) : 0.35
  // Cap raised to 0.65 — hard markets genuinely have 50-65% launch ACoS; capping at 0.45 was
  // artificially inflating profit projections and producing false GO verdicts.
  const assumedAcos = Math.min(0.65, Math.max(0.25, Math.max(baseAcos, acosFloor)))

  const referralFeeRate = estimateReferralFeeRate(keyword)
  const referralFee = sellingPrice * referralFeeRate
  const ppcCostPerUnit = sellingPrice * assumedAcos
  const cogs = effectiveUnitCost + shippingCost
  const totalCost = cogs + referralFee + fbaFee
  const profitAfterAds = sellingPrice - totalCost - ppcCostPerUnit

  const isHighComplexity = complexity === "complex"
  const effectiveMarginThreshold =
    input.marginThreshold ??
    getMarginThreshold(
      input.differentiation ?? "",
      market?.topTitles ?? [],
      market?.painPoints ?? []
    )
  const NET_MARGIN_THRESHOLD = isHighComplexity ? 0.2 : effectiveMarginThreshold
  const marginThresholdPct = NET_MARGIN_THRESHOLD * 100
  const validatedDifferentiators = getValidatedDifferentiators(
    input.differentiation ?? "",
    market?.topTitles ?? [],
    market?.painPoints ?? []
  )
  const netMarginRatio = sellingPrice > 0 ? profitAfterAds / sellingPrice : 0
  const passesMarginRule = netMarginRatio >= NET_MARGIN_THRESHOLD
  const estimatedMarginPercent = sellingPrice > 0 ? netMarginRatio * 100 : 0

  const premiumRiskWarning =
    hasRealMarketData && sellingPrice > avgPrice && avgPrice > 0
      ? `Premium Risk: Your price ($${sellingPrice.toFixed(2)}) is ${(((sellingPrice - avgPrice) / avgPrice) * 100).toFixed(1)}% higher than the top-5 market average ($${avgPrice.toFixed(2)}). Differentiation must justify this gap to maintain viability.`
      : undefined

  // ─── Decision engine: 5‑Layer Verdict Model ───
  // Layer 1 — Economic Floor (Kill Switch)
  const netMarginRatioForGate = sellingPrice > 0 ? profitAfterAds / sellingPrice : 0

  // Base score before market/differentiation layers
  let score = 50
  const scoreBreakdown: Record<string, string> = { base: "50" }

  // Layer 2 — Market Fluidity (New Seller Scan, Top 20)
  const newSellers20 = Number.isFinite(newSellersInTop20) ? (newSellersInTop20 as number) : 0
  if (newSellers20 < 2) {
    score -= 30
    scoreBreakdown.marketFluidity = "-30 (locked market: <2 new sellers in top 20)"
  } else if (newSellers20 >= 4) {
    score += 15
    scoreBreakdown.marketFluidity = "+15 (fluid market: 4+ new sellers in top 20)"
  }

  // Layer 3 — Ad Saturation (Sponsored density across first page, organic gaps)
  const SERP_SIZE = 30
  const sponsoredTotal = Number.isFinite(market?.sponsored_total_count)
    ? (market!.sponsored_total_count as number)
    : Math.round((sponsoredShare ?? 0.0) * SERP_SIZE)
  const firstPageSponsoredShare = SERP_SIZE > 0 ? sponsoredTotal / SERP_SIZE : 0

  if (firstPageSponsoredShare > 0.35) {
    score -= 20
    scoreBreakdown.adSaturation = "-20 (PPC battlefield: >35% sponsored on first page)"
  }

  // Approximate organic gaps: organic low‑review listings in positions 15–30
  const organicGapsCount =
    Array.isArray(market?.topCompetitors) && market.topCompetitors.length
      ? market.topCompetitors.filter((c) => {
          const pos = c.position ?? 0
          const reviews = c.ratingsTotal ?? 0
          const isSponsored = c.sponsored === true
          return !isSponsored && pos >= 15 && pos <= 30 && reviews > 0 && reviews < 200
        }).length
      : 0

  if (organicGapsCount >= 2) {
    score += 10
    scoreBreakdown.organicGaps = "+10 (organic low‑review gaps between ranks 15–30)"
  }

  // Layer 4 — Differentiation Multiplier
  const validatedDiffsForScore = getValidatedDifferentiators(
    differentiationInput,
    market?.topTitles ?? [],
    market?.painPoints ?? []
  )
  const hasStrongVisualDiff = validatedDiffsForScore.some((d) => d.verdict === "STRONG")
  const hasAnyDiffText = (differentiationInput ?? "").trim().length > 0

  // Detect vague/generic differentiation — words that mean nothing to a buyer
  const GENERIC_DIFF_WORDS = ["quality", "premium", "best", "good", "better", "unique", "great", "special", "nice", "excellent", "high quality", "top", "superior", "amazing"]
  const isVagueDiff = hasAnyDiffText && (
    differentiationInput.trim().length < 20 ||
    GENERIC_DIFF_WORDS.every(w => differentiationInput.toLowerCase().includes(w)) ||
    differentiationInput.trim().split(/\s+/).length <= 2 && GENERIC_DIFF_WORDS.some(w => differentiationInput.toLowerCase().includes(w))
  )

  // Differentiation warning — surfaces clearly to the user
  const differentiationStatus: "none" | "vague" | "unverified" | "weak" | "strong" =
    !hasAnyDiffText ? "none"
    : isVagueDiff ? "vague"
    : !hasRealMarketData ? "unverified"
    : hasStrongVisualDiff ? "strong"
    : "weak"

  const differentiationWarning: string | null =
    differentiationStatus === "none"
      ? "You didn't enter a competitive advantage. Without one, you're competing on price alone — the hardest way to succeed on Amazon. Add a specific differentiator and re-run."
      : differentiationStatus === "vague"
        ? `"${differentiationInput.trim()}" is too generic to be a real advantage — every competitor says the same thing. Add something specific: a feature, a problem you solve, a measurable benefit.`
        : differentiationStatus === "unverified"
          ? "Your differentiator can't be validated without market data. Add a competitor ASIN to see if it actually stands out on page 1."
          : null

  // ── Differentiation Suggestions from real market pain points ─────────────
  // When diff is none/vague AND we have real pain points, give concrete suggestions
  const differentiationSuggestions: string[] =
    (differentiationStatus === "none" || differentiationStatus === "vague") && painPoints.length > 0
      ? painPoints.slice(0, 3).map((p) => String(p).trim()).filter(Boolean)
      : []

  if (hasStrongVisualDiff) {
    score += 20
    scoreBreakdown.differentiation = "+20 (strong differentiation aligned with market pain points)"
  } else if (!hasAnyDiffText) {
    score -= 15
    scoreBreakdown.differentiation = "-15 (no differentiation entered — competing on price alone)"
  } else if (isVagueDiff) {
    score -= 12
    scoreBreakdown.differentiation = "-12 (vague differentiation — too generic to validate)"
  } else if (hasAnyDiffText) {
    score -= 10
    scoreBreakdown.differentiation = "-10 (weak/generic differentiation)"
  }

  // Layer 5 — Keepa Market Intelligence (12-month real data)
  const keepa = input.keepaData ?? null
  if (keepa) {
    // BSR trend — demand direction
    if (keepa.bsrTrend === "improving") {
      score += 12
      scoreBreakdown.keepaTrend = "+12 (Keepa: BSR improving — real demand growing over 12 months)"
    } else if (keepa.bsrTrend === "declining") {
      score -= 18
      scoreBreakdown.keepaTrend = "-18 (Keepa: BSR declining — market demand shrinking)"
    }
    // Price war
    if (keepa.isPriceWarWarning) {
      score -= 10
      scoreBreakdown.keepaPriceWar = "-10 (Keepa: price war in last 12 months — margin compression risk)"
    }
    // Seasonality
    if (keepa.isSeasonalWarning) {
      score -= 6
      scoreBreakdown.keepaSeasonality = "-6 (Keepa: seasonal demand pattern detected — timing risk)"
    }
    // Amazon selling → Buy Box locked
    if (keepa.amazonIsSelling) {
      score -= 15
      scoreBreakdown.keepaAmazon = "-15 (Keepa: Amazon.com sells this product — Buy Box near-impossible)"
    }
    // OOS opportunity: top competitor often out of stock → unmet demand
    if (keepa.outOfStockPct30 != null && keepa.outOfStockPct30 > 35) {
      score += 8
      scoreBreakdown.keepaOOS = `+8 (Keepa: competitor OOS ${keepa.outOfStockPct30.toFixed(0)}% of last 30 days — unmet demand)`
    }
    // Seller count growing → market commoditizing, price war risk
    if (keepa.sellerCountTrend === "growing") {
      score -= 6
      scoreBreakdown.keepaSellers = "-6 (Keepa: seller count rising — commoditization risk)"
    }
    // FBA-specific competition: many FBA sellers = stiffer Prime-eligible competition
    if (keepa.fbaSellerCount != null && keepa.fbaSellerCount >= 8) {
      score -= 5
      scoreBreakdown.keepaFbaSellers = `-5 (Keepa: ${keepa.fbaSellerCount} active FBA sellers — high direct competition in Prime search)`
    }
  }

  // Layer 6 — DataForSEO Search Volume (real demand signal)
  if (dfsSearchVol != null) {
    if (dfsSearchVol >= 10000) {
      score += 10
      scoreBreakdown.dfsVolume = `+10 (${dfsSearchVol.toLocaleString()} ${dfsVolLabel} — strong confirmed demand)`
    } else if (dfsSearchVol >= 1000) {
      score += 5
      scoreBreakdown.dfsVolume = `+5 (${dfsSearchVol.toLocaleString()} ${dfsVolLabel} — moderate demand)`
    } else if (dfsSearchVol < 200) {
      score -= 12
      scoreBreakdown.dfsVolume = `-12 (only ${dfsSearchVol.toLocaleString()} ${dfsVolLabel} — very limited demand)`
    }
    // Search trend reinforcement
    if (input.dataForSEO?.searchTrend === "growing") {
      score += 5
      scoreBreakdown.dfsTrend = "+5 (DataForSEO: search volume growing over 12 months)"
    } else if (input.dataForSEO?.searchTrend === "declining") {
      score -= 5
      scoreBreakdown.dfsTrend = "-5 (DataForSEO: search volume declining over 12 months)"
    }
  }

  // Layer 6b — DataForSEO CPC signal (real ad competition cost indicator)
  // High CPC means expensive ads = lower profit margin = score penalty.
  // Low CPC means cheaper ranking opportunity = score boost.
  const dfsCpcUsd = input.dataForSEO?.cpcUsd ?? null
  if (dfsCpcUsd != null) {
    if (dfsCpcUsd >= 3.0) {
      score -= 10
      scoreBreakdown.dfsCpc = `-10 (CPC $${dfsCpcUsd.toFixed(2)}/click — very high ad cost, profit under pressure)`
    } else if (dfsCpcUsd >= 1.50) {
      score -= 5
      scoreBreakdown.dfsCpc = `-5 (CPC $${dfsCpcUsd.toFixed(2)}/click — moderate-high ad competition)`
    } else if (dfsCpcUsd < 0.60) {
      score += 5
      scoreBreakdown.dfsCpc = `+5 (CPC $${dfsCpcUsd.toFixed(2)}/click — low ad competition, cheaper ranking)`
    }
  }

  // Clamp final score (UI only — verdict is logic‑based below)
  score = Math.max(1, Math.min(99, Math.round(score)))

  // ─── FINAL DECISION ENGINE — RIGOROUS 5-FACTOR INTEGRATION ───
  // All 5 scoring layers must align with the verdict.
  // Score is now a gate, not just a display number.

  // 1. ECONOMIC SURVIVAL
  const hasRealProfit = profitAfterAds > 0 && netMarginRatioForGate > 0.12
  const hasHealthyProfit = profitAfterAds >= 10 && netMarginRatioForGate >= 0.18

  // 2. ENTRY BARRIERS
  const avgTop10Reviews = market?.avgReviews ?? 0
  const brandShareTop3 = dominantBrand ? 0.6 : 0.2
  const hasDominantBrand = dominantBrand
  // Severe review barrier: avg >5k reviews = new listing invisible without a true sub-niche angle
  const severeReviewBarrier = avgTop10Reviews > 5000
  // Full lock: brand moat + review moat together = near-impossible organic entry
  const marketLocked = avgTop10Reviews > 2000 && hasDominantBrand

  // 3. WIN PATH — differentiation only
  // Price wars are NOT a viable strategy for new sellers; competing 15% below market
  // simply shrinks margin without improving rank. Removed from win-path logic.
  const hasRealDifferentiation = hasStrongVisualDiff

  // 4. CAPITAL THRESHOLD — flag when launch requires serious capital
  const isHighCapitalLaunch = launchCapitalRequired > 10000

  // 5. SCORE GATE — market signal score must match the verdict
  // Score < 40: too many structural red flags → cap verdict at IMPROVE
  // Score < 30: severe red flags → push toward NO_GO
  const scoreForcesImprove = score < 40
  const scoreForcesDanger = score < 30

  // ─── VERDICT ───
  let verdict: "GO" | "IMPROVE_BEFORE_LAUNCH" | "NO_GO"
  let verdictAdvisory: string | undefined

  // KILL SWITCH 1: can't make money after ads → always NO_GO
  if (!hasRealProfit) {
    verdict = "NO_GO"
    verdictAdvisory = `After all Amazon fees and estimated PPC, you're left with $${profitAfterAds.toFixed(2)}/unit (${estimatedMarginPercent.toFixed(1)}% margin). Minimum to survive: 12% and $1+. Fix COGS, price, or both.`
  }

  // KILL SWITCH 2: full market lock + no differentiation + thin profit
  else if (marketLocked && !hasRealDifferentiation && profitAfterAds < 8) {
    verdict = "NO_GO"
    verdictAdvisory = `Market is locked (avg ${avgTop10Reviews.toLocaleString()} reviews + dominant brand) and there's no differentiation to carve a niche. A me-too product here will be invisible.`
  }

  // BARRIER: severe review moat with no sub-niche angle → entry too expensive
  else if (severeReviewBarrier && !hasRealDifferentiation) {
    verdict = "IMPROVE_BEFORE_LAUNCH"
    verdictAdvisory = `Top 10 listings average ${avgTop10Reviews.toLocaleString()} reviews. A new listing with 0 reviews needs a clear sub-niche or differentiation to show up in search at all. Without it, 100% of traffic comes from expensive PPC against established sellers.`
  }

  // IMPROVE: profit exists but too thin for a safe launch
  else if (!hasHealthyProfit) {
    verdict = "IMPROVE_BEFORE_LAUNCH"
    verdictAdvisory = `$${profitAfterAds.toFixed(2)}/unit profit is real but not enough buffer for returns, storage, and real-world PPC variance. Reach $10+ and 18%+ before you commit inventory.`
  }

  // GO — only when economics are solid AND no structural barriers
  else {
    verdict = "GO"
  }

  // SCORE GATE: 5-layer market score overrides too-optimistic verdict
  if (scoreForcesImprove && verdict === "GO") {
    verdict = "IMPROVE_BEFORE_LAUNCH"
    verdictAdvisory = `Unit economics are solid, but market signals score (${score}/100) shows too many structural red flags. Review the score breakdown before committing capital.`
  }
  if (scoreForcesDanger && verdict === "IMPROVE_BEFORE_LAUNCH") {
    verdict = "NO_GO"
    verdictAdvisory = `Market signals score (${score}/100) is critically low — multiple compounding barriers. High probability of loss even with improvements. Reassess the product entirely.`
  }

  // ─── Keepa Verdict Override ───────────────────────────────────────
  // Apply AFTER base verdict — Keepa adds real 12-month reality check
  if (keepa) {
    // Declining market demand → downgrade GO to IMPROVE (market is shrinking)
    if (keepa.bsrTrend === "declining" && verdict === "GO") {
      verdict = "IMPROVE_BEFORE_LAUNCH"
      verdictAdvisory = `Keepa BSR trend shows declining demand over 12 months. ${keepa.seasonalityNote || "Verify timing before launch."}`
    }
    // Price war + thin margin → downgrade GO to IMPROVE
    if (keepa.isPriceWarWarning && profitAfterAds < 12 && verdict === "GO") {
      verdict = "IMPROVE_BEFORE_LAUNCH"
      verdictAdvisory = `Price war detected (${keepa.priceWarNote}). Margin too thin to survive. Fix COGS or raise price before launching.`
    }
    // Severe decline + already borderline → push to NO_GO
    if (keepa.bsrTrend === "declining" && verdict === "IMPROVE_BEFORE_LAUNCH" && !hasHealthyProfit) {
      verdict = "NO_GO"
      verdictAdvisory = `Keepa confirms declining demand AND thin margins — both risks compound. High probability of loss.`
    }
    // Tiny market + shrinking → not worth building a business on regardless of margins
    if (
      keepa.estimatedMonthlySales != null &&
      keepa.estimatedMonthlySales < 120 &&
      keepa.bsrTrend === "declining" &&
      verdict !== "NO_GO"
    ) {
      verdict = "NO_GO"
      verdictAdvisory = `Keepa: top competitor sells only ~${keepa.estimatedMonthlySales} units/month AND the market is shrinking. Total addressable volume is too small to build a business on — even a perfect launch won't move the needle.`
    }
    // Extreme review velocity = widening moat — competitors are entrenching faster than you can enter
    if (
      keepa.reviewVelocityMonthly > 100 &&
      (keepa.currentReviewCount ?? 0) > 1500 &&
      verdict === "GO"
    ) {
      verdict = "IMPROVE_BEFORE_LAUNCH"
      verdictAdvisory = `Keepa shows top competitor gaining ${keepa.reviewVelocityMonthly} reviews/month with ${keepa.currentReviewCount?.toLocaleString()} total. The review gap compounds every month you wait — you need a strong niche keyword or differentiation angle before entering.`
    }
    // Amazon selling this product → Buy Box is nearly impossible to win
    if (keepa.amazonIsSelling) {
      if (verdict === "GO") {
        verdict = "IMPROVE_BEFORE_LAUNCH"
        verdictAdvisory = "Keepa confirms Amazon.com sells this product directly. Winning the Buy Box against Amazon requires a genuine private-label differentiation — a me-too product will be buried."
      } else if (verdict === "IMPROVE_BEFORE_LAUNCH" && !hasHealthyProfit) {
        verdict = "NO_GO"
        verdictAdvisory = "Amazon.com sells this product AND margins are thin. Two compounding risks: no Buy Box path + no profit buffer. Do not enter this product as-is."
      }
    }
  }

  const confidence = Math.max(35, Math.min(92, Math.round(55 + (score - 50) * 0.7)))

  // ── Confidence Band ──────────────────────────────────────────────────────
  // How certain are we? Data quality + score distance from verdict thresholds.
  let confScore = confidence
  if (hasRealMarketData) confScore += 5   // real SERP data reduces guesswork
  if (keepa != null) confScore += 8       // 12-month Keepa adds strong signal
  const scoreFromThreshold =
    verdict === "GO"    ? score - 40    // how far above the GO gate
    : verdict === "NO_GO" ? 40 - score  // how far below the NO-GO gate
    : 5                                 // IMPROVE is inherently uncertain
  confScore += Math.min(8, Math.max(0, Math.round(scoreFromThreshold * 0.3)))
  const verdictConfidencePct = Math.max(50, Math.min(96, Math.round(confScore)))
  const confidenceBand: "STRONG" | "MODERATE" | "BORDERLINE" =
    verdictConfidencePct >= 78 ? "STRONG" : verdictConfidencePct >= 64 ? "MODERATE" : "BORDERLINE"

  // ── Break-even Calculator ────────────────────────────────────────────────
  // Units + months to recoup total launch capital at current profit/unit.
  const breakEvenUnitsForCapital = profitAfterAds > 0 && launchCapitalRequired > 0
    ? Math.ceil(launchCapitalRequired / profitAfterAds)
    : null
  const breakEvenMonths = breakEvenUnitsForCapital != null && SALES_PER_DAY > 0
    ? parseFloat((breakEvenUnitsForCapital / (SALES_PER_DAY * 30)).toFixed(1))
    : null

  // ── Month-by-Month Profit Projection (M1–M6) ────────────────────────────
  // Models the P&L ramp as a new listing gains reviews and organic traffic.
  // Ramp factors are conservative estimates for a product launching with 0 reviews:
  //   M1 20% velocity, ACoS +20pp (no reviews, paying Newbie Tax)
  //   M2 40% velocity, ACoS +15pp (a few Vine reviews landing)
  //   M3 65% velocity, ACoS +10pp (10+ reviews, organic rank beginning)
  //   M4 85% velocity, ACoS +5pp  (stable listing, organic contributing)
  //   M5 100% velocity, ACoS 0pp  (fully ramped, steady state)
  //   M6 110% velocity, ACoS -5pp (optimized campaigns, margin improving)
  const monthlyRamp = [
    { month: 1, velocityFactor: 0.20, acosAdj: 0.20 },
    { month: 2, velocityFactor: 0.40, acosAdj: 0.15 },
    { month: 3, velocityFactor: 0.65, acosAdj: 0.10 },
    { month: 4, velocityFactor: 0.85, acosAdj: 0.05 },
    { month: 5, velocityFactor: 1.00, acosAdj: 0.00 },
    { month: 6, velocityFactor: 1.10, acosAdj: -0.05 },
  ]
  const baseMonthlyUnits = SALES_PER_DAY * 30
  let cumulativeProfit = -launchCapitalRequired // start from negative (sunk launch cost)
  const monthlyProjection = monthlyRamp.map(({ month, velocityFactor, acosAdj }) => {
    const units = Math.round(baseMonthlyUnits * velocityFactor)
    const effectiveAcos = Math.min(0.75, Math.max(0.15, assumedAcos + acosAdj))
    const monthRevenue = units * sellingPrice
    const monthReferral = units * referralFee
    const monthFba = units * fbaFee
    const monthCogs = units * cogs
    const monthPpc = units * sellingPrice * effectiveAcos
    const monthProfit = monthRevenue - monthReferral - monthFba - monthCogs - monthPpc
    cumulativeProfit += monthProfit
    return {
      month,
      units,
      revenue: Math.round(monthRevenue),
      profit: Math.round(monthProfit),
      acos: Math.round(effectiveAcos * 100),
      cumulativeProfit: Math.round(cumulativeProfit),
      breaksEven: cumulativeProfit >= 0,
    }
  })
  // Determine breakeven month from projection (more accurate than units-only calc)
  const breakEvenMonth = monthlyProjection.find(m => m.breaksEven)?.month ?? null
  const projectedMonthlyProfitAtSteadyState = monthlyProjection[4]?.profit ?? null // M5 = fully ramped

  // ── Stress Test Calculations ─────────────────────────────────────────────
  // Q1: What happens if ACoS runs 10pp higher than modeled? (realistic scenario)
  const stressAcos = Math.min(0.85, assumedAcos + 0.10)
  const stressPpcCost = sellingPrice * stressAcos
  const stressProfitAfterAds = sellingPrice - totalCost + ppcCostPerUnit - stressPpcCost
  const stressMarginPct = sellingPrice > 0 ? (stressProfitAfterAds / sellingPrice) * 100 : 0

  // Q2: What happens if 8% of units are returned? (mid-range return scenario)
  const RETURN_RATE = 0.08
  const returnLossPerUnit = sellingPrice * RETURN_RATE  // refund + disposal
  const profitAfterReturns = profitAfterAds - returnLossPerUnit
  const marginAfterReturns = sellingPrice > 0 ? (profitAfterReturns / sellingPrice) * 100 : 0

  // Combined worst-case (both stress at once)
  const worstCaseProfit = stressProfitAfterAds - returnLossPerUnit
  const worstCaseMargin = sellingPrice > 0 ? (worstCaseProfit / sellingPrice) * 100 : 0

  const stressTest = {
    baseProfit: Math.round(profitAfterAds * 100) / 100,
    baseMarginPct: Math.round(estimatedMarginPercent * 10) / 10,
    // Scenario A: ACoS 10pp higher
    highAcosProfit: Math.round(stressProfitAfterAds * 100) / 100,
    highAcosMarginPct: Math.round(stressMarginPct * 10) / 10,
    highAcosLabel: `+10pp ACoS (${Math.round(stressAcos * 100)}%)`,
    highAcosSurvives: stressProfitAfterAds > 0 && stressMarginPct >= 8,
    // Scenario B: 8% return rate
    returnRateProfit: Math.round(profitAfterReturns * 100) / 100,
    returnRateMarginPct: Math.round(marginAfterReturns * 10) / 10,
    returnRateLabel: "8% return rate",
    returnRateSurvives: profitAfterReturns > 0,
    // Scenario C: both at once
    worstCaseProfit: Math.round(worstCaseProfit * 100) / 100,
    worstCaseMarginPct: Math.round(worstCaseMargin * 10) / 10,
    worstCaseSurvives: worstCaseProfit > 0,
  }

  // ── Return Rate Estimate ─────────────────────────────────────────────────
  const complexityStr = (input.complexity ?? "moderate").toLowerCase()
  const returnRatePct = complexityStr === "complex" ? "10–18%" : complexityStr === "simple" ? "1–4%" : "5–9%"
  const returnRateLevel: "low" | "moderate" | "high" =
    complexityStr === "complex" ? "high" : complexityStr === "simple" ? "low" : "moderate"

  // ── Price Position Alert ─────────────────────────────────────────────────
  // Warn when selling price is outside the market's dominant band.
  let pricePositionAlert: { type: "TOO_LOW" | "TOO_HIGH"; msg: string } | null = null
  if (hasRealMarketData && sellingPrice > 0 && avgPrice > 0) {
    const bandLo = avgPrice * 0.78
    const bandHi = avgPrice * 1.28
    if (sellingPrice < bandLo) {
      pricePositionAlert = {
        type: "TOO_LOW",
        msg: `Your price ($${sellingPrice.toFixed(2)}) is below the market's dominant band ($${bandLo.toFixed(0)}–$${bandHi.toFixed(0)}). Thin margins and a perceived quality gap vs established listings.`,
      }
    } else if (sellingPrice > bandHi) {
      pricePositionAlert = {
        type: "TOO_HIGH",
        msg: `Your price ($${sellingPrice.toFixed(2)}) is above the market's dominant band ($${bandLo.toFixed(0)}–$${bandHi.toFixed(0)}). Without 100+ reviews, buyers with choices will default to cheaper options.`,
      }
    }
  }

  // ── Niche Saturation ─────────────────────────────────────────────────────
  const newSellers20num = Number.isFinite(newSellersInTop20) ? (newSellersInTop20 as number) : 0
  const nicheSaturationLabel =
    newSellers20num >= 5 ? "Open" : newSellers20num >= 2 ? "Moderate" : "Locked"
  const nicheSaturationDesc =
    newSellers20num >= 5
      ? `${newSellers20num} new sellers in top 20 — market is accepting newcomers`
      : newSellers20num >= 2
        ? `${newSellers20num} new sellers in top 20 — possible to enter with strong execution`
        : "Fewer than 2 new sellers in top 20 — incumbents dominating"

  const totalUnitCostForRoi = cogs + referralFee + fbaFee + ppcCostPerUnit
  const estimatedRoiPct = totalUnitCostForRoi > 0 ? (profitAfterAds / totalUnitCostForRoi) * 100 : 0
  const advertisingPressure = market?.sponsoredShare ?? (hasRealMarketData ? 0.4 : 0)
  const priceBandLow = avgPrice * 0.75
  const priceBandHigh = avgPrice * 1.25
  const pricePositionInside = sellingPrice >= priceBandLow && sellingPrice <= priceBandHigh
  const productVsMarket = {
    price_position: hasRealMarketData
      ? pricePositionInside
        ? `within dominant band — User price $${sellingPrice.toFixed(2)} is inside the dominant price band ($${priceBandLow.toFixed(0)}–$${priceBandHigh.toFixed(0)}).`
        : sellingPrice > priceBandHigh
          ? `premium above market — User price is above the dominant band; differentiation must justify premium.`
          : `below market — User price is below the dominant band; margin pressure or perceived quality risk.`
      : "No SERP data; price position vs market unknown.",
    review_barrier: hasRealMarketData
      ? avgReviews > 5000
        ? `STRONG: top listings average ${avgReviews.toLocaleString()}+ reviews; new listings struggle for visibility.`
        : avgReviews >= 1000
          ? `MODERATE: ${avgReviews.toLocaleString()} avg reviews; achievable with budget and time.`
          : `LOW: ${avgReviews.toLocaleString()} avg reviews; entry more feasible.`
      : "Review barrier unknown without SERP data.",
    advertising_environment: hasRealMarketData
      ? advertisingPressure > 0.4
        ? `HIGH: ${(advertisingPressure * 100).toFixed(1)}% of first-page results sponsored; expect strong PPC competition.`
        : advertisingPressure >= 0.2
          ? `MEDIUM: meaningful ad presence; plan for CPC.`
          : `LOW: organic opportunity exists.`
      : "Ad pressure unknown without SERP data.",
    differentiation_strength: differentiationInput.length >= 50 && mentionsPainPoint
      ? "Strong: user described differentiation that aligns with market pain points."
      : differentiationInput.length >= 20
        ? "Moderate: some differentiation; could be sharper for conversion."
        : "Weak or missing; generic positioning increases PPC cost and risk.",
    product_risk: complexity === "high"
      ? "High complexity: returns and QC buffer (12%) applied; focus on quality to avoid Frequently Returned badge."
      : complexity === "medium"
        ? "Moderate complexity: 8% buffer; watch returns and listing clarity."
        : "Lower complexity; standard margin rules apply.",
  }
  const keywordSaturation = keywordSaturationCount != null ? keywordSaturationCount / 30 : 1
  const userDifferentiation = differentiationInput
  const sponsoredTop10 = sponsoredTop10Count
  const signals = buildSignals({
    profitAfterAds,
    estimatedMarginPercent,
    avgTop10Reviews,
    brandShareTop3,
    sponsoredTop10,
    keywordSaturation,
    sellingPrice,
    avgPrice,
    userDifferentiation,
  })

  const aiInput = {
    keyword,
    sellingPrice,
    unitCost: effectiveUnitCost,
    shippingCost,
    profitAfterAds,
    verdict,
    avgPrice,
    avgRating,
    avgReviews,
    dominantBrand,
    newSellersInTop10,
    newSellersInTop20,
    topTitles: market?.topTitles ?? [],
    topPrices: market?.topPrices ?? [],
    differentiation: differentiationInput || undefined,
    complexity: complexity || undefined,
    product_vs_market: productVsMarket,
    landed_cost: cogs,
    estimated_margin: estimatedMarginPercent,
    estimated_roi: estimatedRoiPct,
    topCompetitors: topCompetitors.map((c) => ({
      position: c.position,
      title: c.title,
      price: c.price,
      ratingsTotal: c.ratingsTotal,
      rating: "rating" in c ? (c as { rating?: number }).rating : undefined,
      brand: "brand" in c ? (c as { brand?: string }).brand : undefined,
      sponsored: "sponsored" in c ? (c as { sponsored?: boolean }).sponsored : undefined,
    })),
    painPoints: painPoints.length > 0 ? painPoints : undefined,
    painPointSource: market?.painPointSource ?? "titles",
    product_name: keyword,
    review_structure_summary: market?.review_structure_summary,
    new_seller_presence: market?.new_seller_presence,
    keyword_saturation_ratio: market?.keyword_saturation_ratio,
    price_compression: market?.price_compression,
    brand_distribution_summary: market?.brand_distribution_summary,
    market_maturity_signal: market?.market_maturity_signal,
    sponsored_top10_count: market?.sponsored_top10_count,
    sponsored_total_count: market?.sponsored_total_count,
    signals,
    // Keepa 12-month market intelligence
    keepa_bsr_trend: keepa?.bsrTrend,
    keepa_current_bsr: keepa?.currentBsr,
    keepa_estimated_monthly_sales: keepa?.estimatedMonthlySales,
    keepa_sales_drops_30: keepa?.salesDrops30,
    keepa_is_seasonal: keepa?.isSeasonalWarning,
    keepa_seasonality_note: keepa?.seasonalityNote,
    keepa_is_price_war: keepa?.isPriceWarWarning,
    keepa_price_war_note: keepa?.priceWarNote,
    keepa_review_velocity_monthly: keepa?.reviewVelocityMonthly,
    keepa_current_price: keepa?.currentPrice,
    keepa_amazon_is_selling: keepa?.amazonIsSelling,
    keepa_out_of_stock_pct30: keepa?.outOfStockPct30,
    keepa_seller_count_trend: keepa?.sellerCountTrend,
    keepa_real_fba_fee: keepa?.realFbaFee ?? keepa?.fbaFeeFromDimensions,
    keepa_size_tier: keepa?.sizeTier,
    keepa_storage_per_unit_monthly: keepa?.estimatedMonthlyStoragePerUnit,
    keepa_fba_seller_count: keepa?.fbaSellerCount,
    keepa_peak_sales_months: keepa?.peakSalesMonths?.join(", "),
    keepa_trough_sales_months: keepa?.troughSalesMonths?.join(", "),
    // DataForSEO real market signals for AI context
    dfs_cpc_usd: input.dataForSEO?.cpcUsd ?? undefined,
    dfs_search_volume: input.dataForSEO?.searchVolume ?? undefined,
    relatedKeywords: input.relatedKeywords?.length ? input.relatedKeywords : undefined,
    assumed_acos: assumedAcos,
  }
  const aiInsights = await getAIInsights(aiInput)
  console.log("STEP 1 - RAW AI WHY:", aiInsights?.why_this_decision)

  // ── Advisor Brief — plain-English 3-sentence synthesis (prefer AI, else deterministic fallback) ──
  const advisorBriefFallback = (() => {
    const marketLine = hasRealMarketData
      ? `The "${keyword}" niche averages ${avgReviews.toLocaleString()} reviews per top listing — ${avgReviews >= 3000 ? "entry is expensive and takes time" : avgReviews >= 500 ? "competition is real but winnable with a clear differentiator" : "competition is relatively low and entry is feasible"}.`
      : `The "${keyword}" niche needs live market data to properly assess competition; the numbers below are based on your inputs only.`
    const verdictLine = verdict === "NO_GO"
      ? `Your numbers show $${profitAfterAds.toFixed(2)} profit per unit after all costs — that is too thin to safely absorb advertising, returns, and unexpected fees.`
      : `Your numbers show $${profitAfterAds.toFixed(2)} profit per unit at ${estimatedMarginPercent.toFixed(1)}% margin — workable for a controlled launch if you manage advertising spend tightly.`
    const actionLine = verdict === "NO_GO"
      ? `To move forward, raise your selling price, cut your product cost, or find a less competitive keyword — then re-run this analysis.`
      : `Start with 100–150 units, enroll in Amazon's Vine review program right away, and run ads only on your exact main keyword for the first 30 days.`
    return `${marketLine} ${verdictLine} ${actionLine}`
  })()
  const advisorBrief = aiInsights?.advisor_brief?.trim() || advisorBriefFallback

  // ─── 1. WHY THIS DECISION: prefer AI (Observation → implication), else fallback ───
  const why_this_decision_raw =
    (aiInsights?.why_this_decision?.length
      ? aiInsights.why_this_decision
      : null) ??
    (verdict === "NO_GO"
      ? [
          `Profit after ads is $${profitAfterAds.toFixed(2)} per unit -> downside risk is high at current economics.`,
          `Average reviews are ${avgReviews.toLocaleString()} -> ranking requires sustained spend and stronger proof.`,
          `Required launch capital is about $${launchCapitalRequired.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} -> risk-to-reward is unfavorable now.`,
        ]
      : [
          `Profit after ads is $${profitAfterAds.toFixed(2)} per unit -> economics can support a controlled launch.`,
          `Average reviews are ${avgReviews.toLocaleString()} -> competition pressure is ${avgReviews < 1000 ? "lower" : "meaningful"}.`,
          `Estimated margin is ${estimatedMarginPercent.toFixed(1)}% -> execution quality will determine scalability.`,
        ])
  const why_this_decision = why_this_decision_raw

  const whyBullets: string[] = []
  if (hasRealMarketData && !aiInsights?.why_this_decision?.length) {
    if (!passesMarginRule) {
      whyBullets.push(`Net margin ${estimatedMarginPercent.toFixed(1)}% is below the ${marginThresholdPct}% threshold — unit economics fail the viability test.`)
    }
    if (avgReviews >= 2000) {
      whyBullets.push(`Top listings average ${avgReviews.toLocaleString()} reviews — strong review moat makes it hard for new entrants to compete on social proof.`)
    } else if (avgReviews >= 500 && avgReviews < 2000) {
      whyBullets.push(`Market has ${avgReviews.toLocaleString()} avg reviews in top results — moderate barrier; differentiation and budget matter.`)
    }
    if (dominantBrand && dominantBrandNames.length > 0) {
      whyBullets.push(`${dominantBrandNames.slice(0, 2).join(" and ")} appear repeatedly in top results — brand concentration limits new-seller share.`)
    } else if (dominantBrand) {
      whyBullets.push("One or few brands dominate top positions — high barrier for new sellers.")
    }
    if (competitorsWithOver1000Reviews >= 3) {
      whyBullets.push(`${competitorsWithOver1000Reviews} of top results have 1,000+ reviews — PPC and conversion will be expensive.`)
    }
    if (sellingPrice > 0 && avgPrice > 0 && sellingPrice > avgPrice * 1.15) {
      whyBullets.push(`Your price ($${sellingPrice.toFixed(2)}) is above market avg ($${avgPrice.toFixed(2)}) — differentiation must justify the premium or you'll lose to cheaper options.`)
    }
    if (severeReviewBarrier && !hasRealDifferentiation) {
      whyBullets.push(`Avg ${avgTop10Reviews.toLocaleString()} reviews in top 10 — without a differentiated angle, a new listing has no path to organic rank and 100% of sales must come from PPC at a severe CVR disadvantage.`)
    }
    if (isHighCapitalLaunch) {
      whyBullets.push(`Launch requires ~$${launchCapitalRequired.toLocaleString("en-US", { maximumFractionDigits: 0 })} (inventory + PPC burn + Vine). Undercapitalization is the #1 cause of failed Amazon launches — do not start with less.`)
    }
    if (profitAfterAds >= 15 && passesMarginRule) {
      whyBullets.push(`Profit $${profitAfterAds.toFixed(0)}/unit at ${estimatedMarginPercent.toFixed(1)}% margin — economics are viable. Execute on differentiation and PPC discipline to protect it.`)
    } else if (profitAfterAds < 10 && whyBullets.length < 2) {
      whyBullets.push(`$${profitAfterAds.toFixed(0)}/unit profit after ads is too thin — returns (3–8%), storage, and real PPC variance will likely make this unprofitable.`)
    }
  }
  if (!hasRealMarketData || !aiInsights?.why_this_decision?.length) {
    if (!passesMarginRule) {
      whyBullets.push(`Net margin ${estimatedMarginPercent.toFixed(1)}% is below the ${marginThresholdPct}% threshold.`)
    }
    if (profitAfterAds >= 15 && passesMarginRule && !hasRealMarketData) {
      whyBullets.push(`Profit after ads $${profitAfterAds.toFixed(0)}/unit and margin pass — run again with live market data for full picture.`)
    } else if (profitAfterAds < 10 && whyBullets.length < 2) {
      whyBullets.push(`Profit after ads $${profitAfterAds.toFixed(0)}/unit is too low to sustain launch.`)
    }
  }
  const why_this_decision_final =
    why_this_decision.length > 0 ? why_this_decision : whyBullets.length > 0 ? whyBullets : [verdict === "NO_GO" ? "Unit economics and/or market barriers do not support a GO." : verdict === "IMPROVE_BEFORE_LAUNCH" ? "Borderline viability; improve margin or differentiation before launch." : "Economics and market signals support a cautious GO; differentiate and control ACoS."]
  console.log("STEP 2 - FINAL WHY BEFORE REPORT:", why_this_decision_final)

  const review_intelligence = aiInsights?.review_intelligence?.length
    ? aiInsights.review_intelligence
    : [
        "Recurring pain points in this niche usually include durability, sizing expectations, and material quality.",
        "Hidden conversion killer: mismatch between listing photos and real size; buyers punish with 1–3★ reviews.",
        "What buyers love: premium feel, easy cleaning, and proof of quality (close-up + stress points).",
      ]

  const market_trends = hasRealMarketData
    ? [
        `Real Amazon data: avg price $${avgPrice.toFixed(2)} | avg rating ${avgRating}★ | avg reviews ${avgReviews.toLocaleString()} for "${keyword}".`,
        keepa?.estimatedMonthlySales
          ? `Keepa BSR data: top competitor sells ~${keepa.estimatedMonthlySales.toLocaleString()} units/month — market demand ${keepa.bsrTrend === "improving" ? "growing" : keepa.bsrTrend === "declining" ? "declining" : "stable"} over 12 months.`
          : "Seasonality often improves in colder months and Q4 gifting.",
        keepa?.isSeasonalWarning
          ? `Seasonality warning: ${keepa.seasonalityNote}`
          : "Saturation risk is real — winners differentiate on materials, size niche, or bundle value.",
      ]
    : [
        `Demand for "${keyword}" is stable; growth is mostly premium-positioning driven.`,
        keepa?.estimatedMonthlySales
          ? `Keepa BSR: top competitor ~${keepa.estimatedMonthlySales.toLocaleString()} units/month, trend: ${keepa.bsrTrend}.`
          : "Seasonality often improves in colder months and Q4 gifting.",
        "Saturation risk is real — winners differentiate on materials, size niche, or bundle value.",
      ]

  // ─── 2. WHAT MOST SELLERS MISS: prefer AI text, else fallback ───
  let what_most_sellers_miss = aiInsights?.what_most_sellers_miss?.trim() ?? ""
  if (!what_most_sellers_miss && hasRealMarketData) {
    const parts: string[] = []
    if (dominantBrand && dominantBrandNames.length > 0) {
      parts.push(`A few brands (${dominantBrandNames.slice(0, 2).join(", ")}) repeat in the top results.`)
    }
    if (sponsoredShare >= 0.6) {
      parts.push("Most top slots are sponsored — ad spend is the real gate.")
    }
    if (priceMin != null && priceMax != null && priceMax > 0 && (priceMax - priceMin) / priceMax < 0.25) {
      parts.push(`Prices are tightly clustered ($${priceMin.toFixed(0)}–$${priceMax.toFixed(0)}) so undercutting barely works.`)
    }
    if (avgReviews >= 5000) {
      parts.push("Review counts in the thousands mean new listings get outranked on both organic and PPC.")
    }
    what_most_sellers_miss = parts.length ? parts.join(" ") + " Most beginners underestimate this." : `Top listings average ${avgReviews.toLocaleString()} reviews — the real barrier is social proof, not just price. Most beginners underestimate this.`
  } else if (!what_most_sellers_miss) {
    what_most_sellers_miss = "Enable live market data (Rainforest API) to see what most sellers miss in this niche."
  }

  // ─── 3. MARKET DOMINATION ANALYSIS: prefer AI, else fallback ───
  let market_domination_analysis = aiInsights?.market_domination_analysis?.trim() ?? ""
  if (!market_domination_analysis && hasRealMarketData && topCompetitors.length > 0) {
    if (dominantBrand && dominantBrandNames.length > 0) {
      const names = dominantBrandNames.slice(0, 3).join(", ")
      market_domination_analysis = `Market domination detected: ${names} appear repeatedly in the top ${topCompetitors.length} results. New sellers face established brand trust and review moats; winning share requires clear differentiation and sustained PPC, not just a lower price.`
    } else {
      const uniqueBrands = new Set(topCompetitors.map((c) => (c as { brand?: string }).brand?.toLowerCase()).filter(Boolean)).size
      market_domination_analysis = `Top ${topCompetitors.length} results show ${uniqueBrands} distinct brands — no single player dominates. Entry is more feasible; differentiation and execution matter more than overcoming a brand moat.`
    }
  } else if (!market_domination_analysis && hasRealMarketData) {
    market_domination_analysis = "Insufficient brand distribution data in this snapshot; run with full Rainforest results for domination analysis."
  } else if (!market_domination_analysis) {
    market_domination_analysis = "Live market data required to assess brand domination."
  }

  // ─── 4. DIFFICULTY SCORE: from review moat, brand dominance, ad saturation, price pressure ───
  let difficultyScore = 0
  if (hasRealMarketData) {
    if (avgReviews >= 10000) difficultyScore += 3
    else if (avgReviews >= 2000) difficultyScore += 2
    else if (avgReviews >= 500) difficultyScore += 1
    if (dominantBrand) difficultyScore += 2
    if (sponsoredShare >= 0.7) difficultyScore += 1
    if (competitorsWithOver1000Reviews >= 4) difficultyScore += 1
    if (priceMin != null && priceMax != null && priceMax > 0 && (priceMax - priceMin) / priceMax < 0.2) difficultyScore += 1
  }
  const difficultyLevel = difficultyScore >= 6 ? "Very High" : difficultyScore >= 4 ? "High" : difficultyScore >= 2 ? "Medium" : "Low"
  const difficulty_score_display = hasRealMarketData
    ? `${difficultyLevel} (${difficultyScore}/8 — review moat, brand concentration, ad saturation, price band)`
    : "Unknown (enable live market data)"

  const dominantControl = hasRealMarketData && dominantBrand
    ? [
        `Dominant control: top listings have ${avgReviews.toLocaleString()}+ reviews — high barrier to entry.`,
        "Dominant brands win via image stack + A+ content + variants, not only price.",
        newSellersInTop10 > 0
          ? `Opportunity: ${newSellersInTop10} sellers with ≤100 reviews in top 10 — market not fully locked.`
          : "Market largely closed — new sellers rarely crack top 10.",
      ]
    : hasRealMarketData
      ? [
          `Competition: avg ${avgReviews.toLocaleString()} reviews — ${avgReviews >= 2000 ? "high" : avgReviews >= 500 ? "medium" : "lower"} barrier.`,
          newSellersInTop10 > 0
            ? `New-seller opportunity: ${newSellersInTop10} with ≤100 reviews in top 10, ${newSellersInTop20} in top 20.`
            : null,
          `Your price $${sellingPrice} vs market avg $${avgPrice.toFixed(2)} — ${sellingPrice < avgPrice ? "underselling; check margin." : sellingPrice > avgPrice * 1.2 ? "premium; differentiation required." : "aligned."}`,
        ].filter(Boolean) as string[]
      : [
          "If top listings have thousands of reviews, review moat is the main barrier.",
          "Dominant brands win via image stack + A+ content + variants.",
          "Expect higher CPC on broad terms; long-tail is your profitability path.",
        ]
  const competitionFinal = (aiInsights?.competition_reality?.length ? aiInsights.competition_reality : undefined) ?? dominantControl

  const beginnerFit = (() => {
    const hasMargin = profitAfterAds >= 10
    const lowBarrier = avgReviews < 1000 || newSellersInTop10 > 2
    const noDominant = !dominantBrand
    if (hasMargin && lowBarrier && noDominant)
      return ["Good fit: enough margin to learn, lower review barrier, no dominant player.", "Start small — 100–200 units. Prove conversion before scaling."]
    if (hasMargin && (lowBarrier || newSellersInTop10 > 0))
      return ["Moderate fit: margin exists but competition is tougher.", "Recommended: clear differentiator + 3–6 month runway. Consider as second product."]
    return ["Challenging for beginners: thin margin or high competition.", "Best for sellers with existing traffic, brand, or deep PPC experience."]
  })()

  const profitabilityBase = [
    `Assumed economics: price $${sellingPrice.toFixed(2)} | COGS $${cogs.toFixed(2)} | referral $${referralFee.toFixed(2)} (${(referralFeeRate * 100).toFixed(0)}%) | FBA $${fbaFee.toFixed(2)} | ads $${ppcCostPerUnit.toFixed(2)} (ACoS ${(assumedAcos * 100).toFixed(1)}%) ⇒ profit after ads $${profitAfterAds.toFixed(2)}.`,
    `Reality check: returns/coupons/storage can compress profit 10–25%. At ${(LAUNCH_CVR * 100).toFixed(1)}% CVR (new listing baseline), expect your real ACoS to be higher than the model until you accumulate reviews.`,
    "If conversion drops, PPC costs inflate and profits collapse. Keep 3+ months of capital buffer.",
  ]
  const profitability = aiInsights?.profit_reality?.trim()
    ? [aiInsights.profit_reality.trim(), ...profitabilityBase]
    : profitabilityBase

  // Dynamic advertising card — category-aware CPC range and ACoS
  const categoryLabel =
    /\b(electronic|laptop|computer|phone|tablet|camera|drone|gadget|smartwatch)\b/.test(keywordLower) ? "electronics" :
    /\b(supplement|vitamin|protein|probiotic|collagen|omega|creatine|whey)\b/.test(keywordLower) ? "supplements" :
    /\b(beauty|skincare|makeup|cosmetic|serum|moisturizer)\b/.test(keywordLower) ? "beauty" :
    /\b(toy|game|puzzle|kids|children)\b/.test(keywordLower) ? "toys & kids" :
    /\b(cloth|shirt|shoes?|sneaker|apparel|jacket|dress)\b/.test(keywordLower) ? "clothing & apparel" :
    /\b(pet|dog|cat|bird|fish|hamster)\b/.test(keywordLower) ? "pet" :
    /\b(sport|fitness|gym|yoga|outdoor|hiking)\b/.test(keywordLower) ? "sports & fitness" :
    /\b(kitchen|cooking|baking|coffee|cookware)\b/.test(keywordLower) ? "kitchen" :
    "home & lifestyle"
  const launchAcosMin = Math.round(assumedAcos * 100)
  const launchAcosMax = Math.min(75, launchAcosMin + 20)
  const dfsCpc = input.dataForSEO?.cpcUsd
  const cpcLine = dfsCpc != null
    ? `CPC benchmark: $${dfsCpc.toFixed(2)}/click (Google Ads bid data — the most reliable proxy for Amazon PPC competition in this keyword). At ${(LAUNCH_CVR * 100).toFixed(1)}% CVR, that's ~$${(dfsCpc / LAUNCH_CVR).toFixed(2)} in ad spend per unit sold at launch. Verify with your Search Term Report after the first 72 hours — your actual Amazon CPC may be lower or higher depending on bidder density.`
    : `Finding your real CPC: run a $50 auto campaign for 72 hours, then pull your Search Term Report. That's the only way to know what you're actually paying per click in this market. Pre-launch directional ranges: use Helium 10 Cerebro or Jungle Scout Keyword Scout.`
  const advertising = [
    `Expected launch ACoS: ${launchAcosMin}–${launchAcosMax}% for the first 30–60 days. This is calibrated to ${categoryLabel} competition depth (${avgReviews.toLocaleString()} avg competitor reviews, ${sponsoredTop10Count} sponsored slots on page 1). ⚠ This is a model estimate — your real ACoS depends on your actual cost per click, which you can only know from a live campaign.`,
    cpcLine,
    `PPC execution: (1) Exact Match only for 30 days — no broad match until conversion is proven. (2) Add negatives daily from the Search Term Report. (3) Scale budget only when ACoS drops below ${launchAcosMin}%. (4) Never run ads to a listing with fewer than 5 reviews.`,
    ...(input.keepaData?.peakSalesMonths?.length
      ? [`📅 Demand calendar: peak sales in ${input.keepaData.peakSalesMonths.join(" & ")}; slowest in ${(input.keepaData.troughSalesMonths ?? []).join(" & ")}. Source your inventory 10–12 weeks before your peak month — running out of stock during peak kills your ranking.`]
      : []),
  ]

  const risks = aiInsights?.risks?.length
    ? aiInsights.risks
    : [
        "Review moat risk: slow review velocity keeps ACoS high.",
        "Quality risk: one weak point triggers a review spiral.",
        "Price pressure risk: low-cost sellers force coupons and reduce net margin.",
      ]

  const opportunities = aiInsights?.opportunities?.length
    ? aiInsights.opportunities
    : [
        "Premium niche: reinforced build + premium materials.",
        "Bundle: low-cost accessory that increases perceived value and conversion.",
        "Positioning: solve the #1 complaint explicitly and show proof in images.",
      ]

  const differentiation = aiInsights?.differentiation?.length
    ? aiInsights.differentiation
    : [
        "Double stitching at stress points (show close-ups).",
        "Removable/washable parts to reduce returns.",
        "Premium materials + rigid structure to hold shape.",
      ]

  const raw_keywords = aiInsights?.alternative_keywords?.length ? aiInsights.alternative_keywords : []
  const alternative_keywords = raw_keywords
    .map((kw) => {
      const s = String(kw).trim()
      return s
        .replace(/\s*[·\-–]\s*NaN\/?CLICK.*$/i, "")
        .replace(/\s*[·\-–]\s*N\/?A.*$/i, "")
        .replace(/\s*\(.*est.*\).*$/i, "")
        .trim() || s
    })
    .filter(Boolean)
  const highIntentKeywords = [
    keyword,
    alternative_keywords[0] ?? `${keyword} for beginners`,
    alternative_keywords[1] ?? `${keyword} set`,
  ].slice(0, 3).map(kw => String(kw).split(" ").slice(0, 5).join(" "))

  const dailyPpcBudget = Math.max(30, Math.round(launchAdCostPerUnit * 5 / 10) * 10)
  const startingBid = baseCpcFinal > 0 ? baseCpcFinal.toFixed(2) : "0.75"
  const targetAcosDisplay = Math.round(assumedAcos * 100)
  const reorderTrigger = Math.max(3, Math.round(SALES_PER_DAY * 0.6))

  const honeymoonRoadmapDefault = [
    `Week 1 (Day 1–7) — Get Your House in Order Before Spending a Dollar: ` +
    `(1) Title: make sure "${keyword}" appears in your first 5 words. ` +
    `(2) Main image: white background, product fills 85% of frame — this is your #1 CTR lever. ` +
    `(3) Bullet points: first bullet = your biggest benefit, not a feature. ` +
    `(4) Enroll in Amazon Vine ($0 if brand-registered) — this gets you 15–30 honest reviews and is the single highest-ROI action you can take this week. ` +
    `Do NOT turn on PPC until Vine is enrolled and your listing is complete.`,

    `Week 2 (Day 8–20) — Turn On Ads, But Stay Disciplined: ` +
    `Launch Exact Match PPC on these 3 keywords only: ${highIntentKeywords.join(", ")}. ` +
    `Daily budget: $${dailyPpcBudget}. Starting bid: $${startingBid} — raise by $0.25 every 2 days until you start getting clicks. ` +
    `Check your Search Term Report every single day and add irrelevant terms as negative keywords. ` +
    `Your target ACoS is under ${targetAcosDisplay}%. If you're above that after Day 14, pause the worst-performing keyword and focus spend on the other two.`,

    `Week 3–4 (Day 21–30) — Convert Clicks into Sales: ` +
    `Add a 15–20% coupon — the green badge makes buyers click even without reviews. ` +
    `Once you have 5+ Vine reviews, drop the coupon to 10%. ` +
    `Check your conversion rate: if it's below 10%, stop increasing ad spend and fix your main image or price first. ` +
    `If you're moving ${reorderTrigger}+ units per day, place your second order now — running out of stock in month 2 kills your ranking and wastes everything you spent in month 1.`,
  ]

  const honeymoonRoadmap = honeymoonRoadmapDefault

  // ── Execution Plan: AI-first, deterministic fallback ───────────────────
  // The AI returns a verdict-specific plan (GO / NO_GO / IMPROVE_BEFORE_LAUNCH).
  // We always prefer the AI's version — it references real market numbers, not
  // generic steps. The deterministic honeymoonRoadmapDefault is a fallback only
  // when the AI returns nothing or truncates.
  const highBarrierStep = `High Review Barrier: avg ${avgReviews.toLocaleString()} reviews in this niche. Do not launch without at least $15,000 total budget (inventory + PPC + Vine).`
  const ppcCannibalizationStep = `PPC Warning: your launch ACoS will likely hit 60%+ in the first 30 days. Cap your daily budget at $${dailyPpcBudget} and only scale when ACoS drops below ${targetAcosDisplay}%.`
  const deterministicPlanRaw = [
    ...(avgReviews > 10000 ? [highBarrierStep] : []),
    ...(cpcBasedLaunchAcos > 0.6 ? [ppcCannibalizationStep] : []),
    ...honeymoonRoadmapDefault,
  ]
  const deterministicPlan = deterministicPlanRaw.map((step: string) =>
    String(step).replace(/\bkeywords:\s*:\s*/gi, "keywords: ")
  )

  // AI execution_plan wins when non-empty (verdict-specific, data-grounded)
  // Market warnings (high barrier, PPC cannibalization) are prepended even on AI plan
  const aiExecutionPlan = aiInsights?.execution_plan?.length
    ? aiInsights.execution_plan.map(s => String(s).replace(/\bkeywords:\s*:\s*/gi, "keywords: "))
    : null
  const executionWarnings = [
    ...(avgReviews > 10000 ? [highBarrierStep] : []),
    ...(cpcBasedLaunchAcos > 0.6 ? [ppcCannibalizationStep] : []),
  ]
  const execution_plan = aiExecutionPlan
    ? [...executionWarnings, ...aiExecutionPlan]
    : deterministicPlan

  const what_would_make_go = whatWouldFlipFromExecutionPlan(verdict, execution_plan)

  const alternative_keywords_with_cost = alternative_keywords.map((kw) => ({
    keyword: String(kw).trim(),
    estimatedCpc: null,
    estimatedCpcDisplay: "Check Helium 10 Cerebro",
  }))

  const totalUnitCost = cogs + referralFee + fbaFee + ppcCostPerUnit
  const roiPct = totalUnitCost > 0 ? (profitAfterAds / totalUnitCost) * 100 : 0

  const profitBreakdown = {
    sellingPrice,
    referralFee: Math.round(referralFee * 100) / 100,
    fbaFee,
    cogs,
    ppcCostPerUnit: Math.round(ppcCostPerUnit * 100) / 100,
    assumedAcosPercent: Math.round(assumedAcos * 100),
    acosRangePercent: `${launchAcosMin}–${launchAcosMax}%`,
    estimatedCpcRange: null,
    profitAfterAds: Math.round(profitAfterAds * 100) / 100,
  }

  const fbaFeeNote = input.keepaData?.realFbaFee
    ? `$${fbaFee.toFixed(2)} (real Keepa data — actual fee for this product)`
    : input.keepaData?.fbaFeeFromDimensions
      ? `$${fbaFee.toFixed(2)} (computed from product dimensions — ${input.keepaData.sizeTier ?? "standard"} tier, ${input.keepaData.packageWeightOz?.toFixed(1) ?? "?"}oz)`
      : `$${fbaFee.toFixed(2)} (estimated by price tier — provide an ASIN for the exact fee based on real dimensions)`

  const profitExplanation =
    `Your selling price is $${sellingPrice.toFixed(2)}. Amazon takes: (1) Referral fee — ${(referralFeeRate * 100).toFixed(0)}% = $${referralFee.toFixed(2)} on every sale, no exceptions. ` +
    `(2) FBA fee — ${fbaFeeNote}. ` +
    `(3) COGS — $${cogs.toFixed(2)} (unit + shipping to FBA). ` +
    `(4) Ad spend — modeled at ${Math.round(assumedAcos * 100)}% ACoS = $${ppcCostPerUnit.toFixed(2)}/unit. ` +
    `⚠ This is a model estimate. Your real ACoS depends on what you actually pay per click — a number only a live campaign can tell you. Expect ACoS of ${launchAcosMin}–${launchAcosMax}% in your first 30 days until reviews build. ` +
    `After all deductions: $${profitAfterAds.toFixed(2)} profit per unit. Returns (3–8%), storage, and coupons can cut this by another 10–25%.`

  const financialStressTest =
    `Net margin: ${estimatedMarginPercent.toFixed(1)}%. Threshold: ${marginThresholdPct}%${isHighComplexity ? " (high-complexity product)." : "."} ` +
    (passesMarginRule
      ? "PASS — Unit economics meet Aggregator viability. Verdict: GO."
      : `FAIL — Net margin below ${marginThresholdPct}%. Product is not viable at current price/cost/ACoS. Verdict: NO-GO. Increase price, reduce COGS, or lower assumed ACoS to reach at least ${marginThresholdPct}% net margin.`)

  const priceGapPct =
    hasRealMarketData && avgPrice > 0 && sellingPrice > avgPrice
      ? Math.round(((sellingPrice - avgPrice) / avgPrice) * 100)
      : 0
  const marketRealityCheckFallback = hasRealMarketData
    ? `${newSellersInTop20} new sellers appear in the top 20 — this market is ${newSellersInTop20 >= 4 ? "fluid and open to new entrants" : "locked, with incumbents holding position"}. Avg reviews in this niche: ${avgReviews.toLocaleString()} — expect 60–90 days of PPC spend before organic rank contributes meaningful traffic.`
    : undefined
  const marketRealityCheck = aiInsights?.entry_reality?.trim() ?? marketRealityCheckFallback

  const underpricingPct =
    hasRealMarketData && avgPrice > 0 && sellingPrice < avgPrice
      ? Math.round(((avgPrice - sellingPrice) / avgPrice) * 100)
      : 0
  const significantlyUnderpricing = underpricingPct >= 15
  const denominator20 = 0.65 - assumedAcos
  const suggestedPriceFor20 =
    significantlyUnderpricing && denominator20 > 0.05 ? Math.max(sellingPrice, (cogs + fbaFee) / denominator20) : 0
  const underpricingAdvice =
    significantlyUnderpricing && suggestedPriceFor20 > sellingPrice
      ? `You are underpricing by ${underpricingPct}%. To reach a healthy 20% margin and improve brand perception, consider testing a price point of $${suggestedPriceFor20.toFixed(2)}.`
      : undefined

  const targetCogsFor15 =
    !passesMarginRule && assumedAcos < 0.7 ? Math.max(0, sellingPrice * (0.7 - assumedAcos) - fbaFee) : 0
  const financialPivotNoGo =
    verdict === "NO_GO"
      ? targetCogsFor15 > 0 && targetCogsFor15 < cogs
        ? `Financial Pivot: To make this a GO, you need to either reduce COGS to $${targetCogsFor15.toFixed(2)} or achieve a 15% higher Conversion Rate through Major Differentiation.`
        : `Financial Pivot: To make this a GO, you need to either reduce COGS significantly or raise price, and/or achieve a 15% higher Conversion Rate through Major Differentiation.`
      : undefined

  const strategicIntelligenceParts: string[] =
    verdict === "GO"
      ? [
          `At $${sellingPrice.toFixed(2)} and ${estimatedMarginPercent.toFixed(1)}% net margin after ads (ACoS floor ${(acosFloor * 100).toFixed(1)}%), "${keyword}" passes the ${marginThresholdPct}% stress test.`,
          opportunities.length > 0 ? opportunities[0] : "Differentiate on quality, bundle, or niche positioning to defend margin.",
          hasRealMarketData
            ? `Market: avg $${avgPrice.toFixed(2)}, ${avgReviews.toLocaleString()} reviews — ${dominantBrand ? "dominant players present; focus on long-tail and proof points." : "barrier is workable; nail one differentiator."}`
            : "Lock one clear differentiator and control ACoS in launch.",
        ]
      : [
          `Net margin ${estimatedMarginPercent.toFixed(1)}% is below the ${marginThresholdPct}% threshold — real-time PPC (${(acosFloor * 100).toFixed(1)}% floor) and returns would erase profit.`,
          financialPivotNoGo ??
            (execution_plan.length ? execution_plan[0] : "Raise price, cut COGS, or target a lower-ACoS niche to reach viability."),
          `Re-run with updated numbers once unit economics clear ${marginThresholdPct}%.`,
        ]
  if (underpricingAdvice) strategicIntelligenceParts.push(underpricingAdvice)
  if (marketRealityCheck) strategicIntelligenceParts.push(marketRealityCheck)
  const earlyGuidanceRaw = aiInsights?.early_strategy_guidance?.trim() ?? ""
  const priceWarningPattern = /Your price .*?% higher than .*?\.?\s*/i
  const early_strategy_guidance = earlyGuidanceRaw.replace(priceWarningPattern, "").trim() || earlyGuidanceRaw
  if (early_strategy_guidance) {
    strategicIntelligenceParts.push(early_strategy_guidance)
  }
  const ppcRealityAudit = `Ad Spend Reality: At a ${(LAUNCH_CVR * 100).toFixed(1)}% conversion rate (baseline for a new listing with no reviews), your modeled ad cost is $${launchAdCostPerUnit.toFixed(2)}/unit sold. This is a model — your real number depends on your actual CPC, which only a live campaign can tell you. Plan a minimum daily budget of $${Math.max(50, Math.round(launchAdCostPerUnit * 5 / 10) * 10)} for the first two weeks.`
  strategicIntelligenceParts.push(ppcRealityAudit)
  const launchCapitalConsultantInsight = `To hit page 1 in this niche, you need roughly $${launchCapitalRequired.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} for your first 30 days. Don't start with less.`
  strategicIntelligenceParts.push(`Launch Capital Required: $${launchCapitalRequired.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}. ${launchCapitalConsultantInsight}`)
  const strategicIntelligence = strategicIntelligenceParts.join(" ")

  // ─── 5. EXPERT INSIGHT (consultant secret): prefer AI, else synthesize real signals ───
  const nicheHint = keyword.replace(/\s+/g, " ").slice(0, 30)
  const painHint = painPoints.length > 0 ? painPoints[0] : "quality and fit"
  let consultantSecret = aiInsights?.expert_insight?.trim() ?? ""
  if (!consultantSecret && hasRealMarketData) {
    const bits: string[] = []
    if (dominantBrand && dominantBrandNames.length > 0) {
      bits.push(`Brand concentration (${dominantBrandNames[0]} etc.) means you win with differentiation and proof, not price.`)
    }
    if (avgReviews >= 2000) {
      bits.push(`With ${avgReviews.toLocaleString()}+ reviews on top results, your main image and first bullet must answer "${painHint}" or you'll bleed on returns and ads.`)
    }
    if (sponsoredShare >= 0.6) {
      bits.push("Most top slots are paid — expect high CPC; long-tail and exact match are the only way to start.")
    }
    if (priceMin != null && priceMax != null && priceMax > 0 && (priceMax - priceMin) / priceMax < 0.25) {
      bits.push("Prices are compressed; margin comes from conversion and repeat, not undercutting.")
    }
    if (!differentiationStrong) {
      bits.push(`Generic positioning in "${nicheHint}" burns 50%+ on PPC; add a clear, specific differentiator (50+ chars) tied to ${painHint}.`)
    }
    consultantSecret = bits.length > 0 ? bits.join(" ") : `In ${nicheHint}, focus on ${painHint} in listing and images — that's where this category gets returned and where you can stand out.`
  } else if (!consultantSecret) {
    consultantSecret = `Run with live market data to get a data-backed expert take for "${nicheHint}".`
  }

  // ─── 6. OPPORTUNITY: prefer AI, else from real pain points ───
  let opportunity_from_data = aiInsights?.opportunity?.trim() ?? ""
  if (!opportunity_from_data && hasRealMarketData && painPoints.length > 0) {
    const topPain = painPoints[0]
    const nicheShort = keyword.slice(0, 30)
    opportunity_from_data = `In the "${nicheShort}" niche, "${topPain}" is a recurring signal in competitor titles. A listing that leads with ${topPain} in bullet 1 and image 2 will stand out from the ${avgReviews > 500 ? "review-heavy" : "crowded"} field — most current competitors don't address it directly.`
  } else if (!opportunity_from_data && hasRealMarketData) {
    opportunity_from_data = `No clear pain point detected in competitor titles for "${keyword.slice(0, 30)}". Run analysis with more competitors to surface a data-based opportunity.`
  } else if (!opportunity_from_data) {
    opportunity_from_data = "Live market data required to identify a data-based opportunity."
  }

  const sectionHelp: Record<string, string> = {
    financialStressTest: "Aggregator 15% rule: net margin = (Selling Price − All Costs) / Selling Price. Must be ≥ 15% for GO.",
    strategicIntelligence: "Why this product passes or fails the Aggregator bar — margin, positioning, and next steps.",
    whyThisDecision: "2–3 strongest data signals behind the GO or NO_GO verdict (reviews, margin, brand dominance, PPC).",
    whatMostSellersMiss: "Non-obvious structural dynamic in the market from live data (brand concentration, ad saturation, price band).",
    marketDominationAnalysis: "Whether a few brands control the top results and how that impacts new sellers.",
    difficultyScore: "Estimated entry difficulty from review moat, brand dominance, ad saturation, and price pressure.",
    opportunity: "One concrete differentiation opportunity inferred from common complaints or pain points in the niche.",
    reviewIntelligence: "What buyers complain about and what they love in this niche, from real competitor data.",
    marketTrends: "Live market snapshot (avg price, rating, reviews) and seasonality for this keyword.",
    competition: "How crowded the niche is, dominant control, new-seller opportunity, and your price vs market.",
    beginnerFit: "Whether this niche suits a new Amazon seller — margin, barriers, and realistic expectations.",
    profitability: "Unit economics summary and reality checks (returns, coupons, ACoS risk).",
    advertising: "What to expect from PPC (ACoS, CPC) and a concrete launch plan.",
    risks: "Main risks for this category (reviews, quality, price pressure).",
    opportunities: "Product and positioning gaps you can exploit.",
    differentiationIdeas: "Concrete ways to stand out (materials, features, positioning).",
    executionPlan: "Step-by-step action plan: audit → spec → prototype → listing → launch and PPC.",
    alternativeKeywords: "Other keywords to test; est. CPC is based on competition level.",
    whatWouldMakeGo: "If the verdict is NO_GO, what would need to change to make it a GO.",
    profitBreakdown: "How we calculate profit after ads: we subtract referral, FBA, COGS, and PPC from your selling price.",
  }

  // ── Fix-It Scenarios — exact math to flip verdict from NO_GO/IMPROVE to GO ─
  // profit/price >= NET_MARGIN_THRESHOLD
  // ↔ price >= (fbaFee + cogs) / (1 − referralFeeRate − assumedAcos − threshold)
  // ↔ cogs <= price*(1 − referralFeeRate − assumedAcos − threshold) − fbaFee
  const _fitDenom = 1 - referralFeeRate - assumedAcos - NET_MARGIN_THRESHOLD
  const fixItMinPrice: number | null =
    _fitDenom > 0.01 ? Math.ceil(((fbaFee + cogs) / _fitDenom) * 100) / 100 : null
  const fixItMaxCogs: number | null = (() => {
    const max = sellingPrice * (1 - referralFeeRate - assumedAcos - NET_MARGIN_THRESHOLD) - fbaFee
    return max > 0 && max < cogs ? Math.floor(max * 100) / 100 : null
  })()
  // "Split the difference" — a midpoint price that requires both a smaller price rise AND smaller COGS cut
  const fixItBothPrice: number | null =
    fixItMinPrice != null && fixItMinPrice > sellingPrice
      ? Math.ceil(((sellingPrice + fixItMinPrice) / 2) * 100) / 100
      : null
  const fixItBothCogs: number | null = fixItBothPrice
    ? (() => {
        const max = fixItBothPrice * (1 - referralFeeRate - assumedAcos - NET_MARGIN_THRESHOLD) - fbaFee
        return max > 0 && max < cogs ? Math.floor(max * 100) / 100 : null
      })()
    : null
  const fixItProfitAtMinPrice: number | null =
    fixItMinPrice != null && fixItMinPrice > sellingPrice
      ? Math.round((fixItMinPrice * (1 - referralFeeRate - assumedAcos) - fbaFee - cogs) * 100) / 100
      : null
  const fixItScenarios =
    verdict !== "GO" && (fixItMinPrice != null && fixItMinPrice > sellingPrice || fixItMaxCogs != null)
      ? {
          minPrice:            fixItMinPrice != null && fixItMinPrice > sellingPrice ? fixItMinPrice : null,
          maxCogs:             fixItMaxCogs,
          bothPrice:           fixItBothPrice,
          bothCogs:            fixItBothCogs,
          profitAtMinPrice:    fixItProfitAtMinPrice,
          targetMarginPct:     marginThresholdPct,
          priceIncreaseNeeded: fixItMinPrice != null && fixItMinPrice > sellingPrice
                                 ? Math.round((fixItMinPrice - sellingPrice) * 100) / 100 : null,
          cogsReductionNeeded: fixItMaxCogs != null
                                 ? Math.round((cogs - fixItMaxCogs) * 100) / 100 : null,
        }
      : null

  const liveMarketComparison =
    hasRealMarketData && (topCompetitors.length > 0 || painPoints.length > 0)
      ? {
          avgPrice,
          avgReviews,
          topCompetitors,
          painPoints,
          marketDensity: marketDensityHigh ? "high" : "low",
          acosFloorUsed: acosFloor,
          premiumRiskWarning: premiumRiskWarning ?? undefined,
          marketRealityCheck: marketRealityCheck ?? undefined,
        }
      : undefined

  const report = {
    verdict,
    verdictAdvisory,
    debug_values: {
      profitAfterAds,
      netMarginRatioForGate,
      hasRealProfit,
      marketLocked,
      hasRealDifferentiation,
    },
    score,
    confidence,
    profit_after_ads: profitAfterAds,
    estimated_margin: `${estimatedMarginPercent.toFixed(1)}%`,
    financial_stress_test: financialStressTest,
    strategic_intelligence: strategicIntelligence,
    early_strategy_guidance: early_strategy_guidance || undefined,
    score_breakdown: scoreBreakdown,
    has_real_market_data: hasRealMarketData,
    premium_risk_warning: premiumRiskWarning ?? undefined,
    market_reality_check: marketRealityCheck ?? undefined,
    market_reality: marketRealityCheck ?? undefined,
    live_market_comparison: liveMarketComparison,
    market_density: marketDensityHigh ? "high" : "low",
    acos_floor_used: acosFloor,
    margin_threshold_pct: marginThresholdPct,
    operational_risk_buffer: operationalRiskBufferDollars,
    ppc_competition_floor: acosFloor,
    consultant_secret: consultantSecret,
    what_most_sellers_miss: what_most_sellers_miss,
    market_domination_analysis: market_domination_analysis,
    difficulty_score: difficultyScore,
    difficulty_level: difficultyLevel,
    difficulty_score_display: difficulty_score_display,
    opportunity: opportunity_from_data,
    launch_capital_required: launchCapitalRequired,
    launch_capital_breakdown: launchCapitalBreakdown,
    launch_capital_consultant_insight: launchCapitalConsultantInsight,
    launch_ad_cost_per_unit: launchAdCostPerUnit,
    differentiation_score: differentiationScore,
    differentiation_gap_tip: gapTip,
    honeymoon_roadmap: honeymoonRoadmap,
    market_snapshot: hasRealMarketData
      ? {
          avgPrice,
          avgRating,
          avgReviews,
          dominantBrand,
          newSellersInTop10,
          newSellersInTop20,
          topTitles: market?.topTitles ?? [],
          topPrices: market?.topPrices ?? [],
          painPoints,
          competitorsWithOver1000Reviews,
        }
      : undefined,
    review_structure_summary: market?.review_structure_summary,
    new_seller_presence: market?.new_seller_presence,
    keyword_saturation_ratio: market?.keyword_saturation_ratio,
    price_compression: market?.price_compression,
    brand_distribution_summary: market?.brand_distribution_summary,
    market_maturity_signal: market?.market_maturity_signal,
    sponsored_top10_count: market?.sponsored_top10_count,
    sponsored_total_count: market?.sponsored_total_count,
    estimated_acos_for_market: dynamicAcosForMarket,
    alternative_keywords,
    alternative_keywords_with_cost,
    what_would_make_go:
      (verdict === "NO_GO" || verdict === "IMPROVE_BEFORE_LAUNCH") && what_would_make_go?.length
        ? what_would_make_go
        : undefined,
    verdict_explanation: aiInsights?.verdict_explanation ?? undefined,
    recommended_action: aiInsights?.recommended_action ?? (
      verdict === "NO_GO"
        ? "Do not invest. Fix margins or choose a less saturated keyword before re-running."
        : verdict === "IMPROVE_BEFORE_LAUNCH"
          ? "Viable but not yet safe. Raise price, cut COGS, or sharpen differentiation — then re-run."
          : "Proceed with a controlled launch: 100–200 units, Amazon Vine, exact-match PPC only."
    ),
    profit_breakdown: profitBreakdown,
    profit_explanation: profitExplanation,
    net_profit: Math.round(profitAfterAds * 100) / 100,
    roi: Math.round(roiPct * 10) / 10,
    section_help: sectionHelp,
    why_this_decision: ensureArray(why_this_decision_final, []),
    review_intelligence: ensureArray(review_intelligence, []),
    market_trends: ensureArray(market_trends, []),
    competition: ensureArray(competitionFinal, []),
    beginner_fit: ensureArray(beginnerFit, []),
    profitability: ensureArray(profitability, []),
    advertising: ensureArray(advertising, []),
    risks: ensureArray(risks, []),
    opportunities: ensureArray(opportunities, []),
    differentiation: ensureArray(differentiation, []),
    execution_plan: ensureArray(execution_plan, []),
    advisor_implication_why_this_decision: aiInsights?.advisor_implication_why_this_decision ?? undefined,
    advisor_implication_expert_insight: aiInsights?.advisor_implication_expert_insight ?? undefined,
    advisor_implication_what_most_sellers_miss: aiInsights?.advisor_implication_what_most_sellers_miss ?? undefined,
    advisor_implication_market_signals: aiInsights?.advisor_implication_market_signals ?? undefined,
    advisor_implication_entry_reality: aiInsights?.advisor_implication_entry_reality ?? undefined,
    advisor_implication_market_domination_analysis: aiInsights?.advisor_implication_market_domination_analysis ?? undefined,
    advisor_implication_competition_reality: aiInsights?.advisor_implication_competition_reality ?? undefined,
    advisor_implication_opportunity: aiInsights?.advisor_implication_opportunity ?? undefined,
    advisor_implication_early_strategy_guidance: aiInsights?.advisor_implication_early_strategy_guidance ?? undefined,
    // ── Market Intelligence ──
    cpr,
    opportunity_score: opportunityScore,
    top_competitor_monthly_sales: topCompetitorMonthlySales,
    top_competitor_revenue: topCompetitorRevenue,
    five_star_price_range: fiveStarPriceRange ?? undefined,
    pain_points_list: painPoints.length > 0 ? painPoints : undefined,
    // ── Compliance & IP ──
    compliance_flags: aiInsights?.compliance_flags ?? undefined,
    ip_risk: aiInsights?.ip_risk ?? undefined,
    // ── Advisor Brief ──
    advisor_brief: advisorBrief,
    // ── Fix-It & Differentiation ──
    fix_it_scenarios: fixItScenarios ?? undefined,
    differentiation_suggestions: differentiationSuggestions.length > 0 ? differentiationSuggestions : undefined,
    // ── Month-by-Month Projection ──
    monthly_projection: monthlyProjection,
    break_even_month: breakEvenMonth ?? undefined,
    projected_monthly_profit_steady_state: projectedMonthlyProfitAtSteadyState ?? undefined,
    // ── Stress Test ──
    stress_test: stressTest,
  }
  console.log("STEP 3 - REPORT WHY:", report.why_this_decision)

  const consultantData: Record<string, unknown> = {
    verdict,
    profitAfterAds,
    estimatedMarginPercent,
    avgPrice,
    avgReviews,
    avgRating: market?.avgRating,
    dominantBrand,
    newSellersInTop10,
    newSellersInTop20,
    marginThresholdPct,
    launchCapitalRequired,
    differentiation: input.differentiation,
    topTitles: market?.topTitles ?? [],
    painPoints: painPoints ?? [],
    sponsored_top10_count: market?.sponsored_top10_count,
    keyword_saturation_ratio: market?.keyword_saturation_ratio,
    price_compression: market?.price_compression,
    new_seller_presence: market?.new_seller_presence,
    sellingPrice,
    unitCost: input.unitCost,
  }
  let consultantInsights: ConsultantInsights | null = null
  try {
    consultantInsights = await getConsultantInsights(consultantData)
  } catch {
    consultantInsights = null
  }
  const emptyConsultant = { why_this_decision_insight: "", expert_insight: "", opportunity_insight: "", competition_insight: "", what_most_sellers_miss_insight: "" }
  const co = consultantInsights ?? emptyConsultant

  return {
    ok: true,
    clientConfig: { showDebugPanel: false },
    ...report,
    scoreBreakdown: scoreBreakdown,
    hasRealMarketData: hasRealMarketData,
    marketSnapshot: report.market_snapshot,
    estimatedMargin: report.estimated_margin,
    financialStressTest: financialStressTest,
    strategicIntelligence: strategicIntelligence,
    earlyStrategyGuidance: early_strategy_guidance || undefined,
    premiumRiskWarning: premiumRiskWarning,
    marketRealityCheck: marketRealityCheck,
    marketReality: marketRealityCheck ?? undefined,
    liveMarketComparison: liveMarketComparison,
    marketDensity: report.market_density,
    acosFloorUsed: report.acos_floor_used,
    marginThresholdPct: report.margin_threshold_pct,
    operationalRiskBuffer: operationalRiskBufferDollars,
    ppcCompetitionFloor: acosFloor,
    estimatedAcosForMarket: dynamicAcosForMarket,
    validatedDifferentiators: validatedDifferentiators,
    consultantSecret: consultantSecret,
    whatMostSellersMiss: what_most_sellers_miss,
    marketDominationAnalysis: market_domination_analysis,
    difficultyScore: difficultyScore,
    difficultyLevel: difficultyLevel,
    difficultyScoreDisplay: difficulty_score_display,
    opportunity: opportunity_from_data,
    launchCapitalRequired: launchCapitalRequired,
    launchCapitalBreakdown: launchCapitalBreakdown,
    launchCapitalConsultantInsight: launchCapitalConsultantInsight,
    launchAdCostPerUnit: launchAdCostPerUnit,
    differentiationScore: differentiationScore,
    differentiationGapTip: gapTip,
    honeymoonRoadmap: honeymoonRoadmap,
    alternativeKeywords: report.alternative_keywords,
    alternativeKeywordsWithCost: report.alternative_keywords_with_cost,
    whatWouldMakeGo:
      (verdict === "NO_GO" || verdict === "IMPROVE_BEFORE_LAUNCH") && what_would_make_go?.length
        ? what_would_make_go
        : undefined,
    verdictExplanation: aiInsights?.verdict_explanation ?? undefined,
    verdictAdvisory: report.verdictAdvisory,
    recommendedAction: aiInsights?.recommended_action ?? (
      verdict === "NO_GO"
        ? "Do not invest. Fix margins or choose a less saturated keyword before re-running."
        : verdict === "IMPROVE_BEFORE_LAUNCH"
          ? "Viable but not yet safe. Raise price, cut COGS, or sharpen differentiation — then re-run."
          : "Proceed with a controlled launch: 100–200 units, Amazon Vine, exact-match PPC only."
    ),
    profitAfterAds: profitAfterAds,
    profitBreakdown: profitBreakdown,
    profitExplanation: profitExplanation,
    netProfit: Math.round(profitAfterAds * 100) / 100,
    roi: Math.round(roiPct * 10) / 10,
    sectionHelp: sectionHelp,
    whyThisDecision: report.why_this_decision,
    reviewIntelligence: report.review_intelligence,
    marketTrends: report.market_trends,
    competition: report.competition,
    differentiationIdeas: report.differentiation,
    advertisingReality: report.advertising,
    profitabilityReality: report.profitability,
    beginnerFit: report.beginner_fit,
    risks: report.risks,
    opportunities: report.opportunities,
    executionPlan: report.execution_plan,
    report,
    review_structure_summary: market?.review_structure_summary,
    new_seller_presence: market?.new_seller_presence,
    keyword_saturation_ratio: market?.keyword_saturation_ratio,
    price_compression: market?.price_compression,
    brand_distribution_summary: market?.brand_distribution_summary,
    market_maturity_signal: market?.market_maturity_signal,
    sponsored_top10_count: market?.sponsored_top10_count,
    sponsored_total_count: market?.sponsored_total_count,
    advisorImplicationWhyThisDecision: report.advisor_implication_why_this_decision,
    advisorImplicationExpertInsight: report.advisor_implication_expert_insight,
    advisorImplicationWhatMostSellersMiss: report.advisor_implication_what_most_sellers_miss,
    advisorImplicationMarketSignals: report.advisor_implication_market_signals,
    advisorImplicationEntryReality: report.advisor_implication_entry_reality,
    advisorImplicationMarketDominationAnalysis: report.advisor_implication_market_domination_analysis,
    advisorImplicationCompetitionReality: report.advisor_implication_competition_reality,
    advisorImplicationOpportunity: report.advisor_implication_opportunity,
    advisorImplicationEarlyStrategyGuidance: report.advisor_implication_early_strategy_guidance,
    why_this_decision_insight: co.why_this_decision_insight,
    expert_insight: co.expert_insight,
    opportunity_insight: co.opportunity_insight,
    competition_insight: co.competition_insight,
    what_most_sellers_miss_insight: co.what_most_sellers_miss_insight,
    // ── Market Intelligence ──
    cpr,
    opportunityScore,
    demandScore,
    topCompetitorMonthlySales,
    topCompetitorRevenue,
    nicheMonthlyRevenue,
    nicheMonthlyUnits,
    fiveStarPriceRange: fiveStarPriceRange ?? undefined,
    painPointsList: painPoints.length > 0 ? painPoints : undefined,
    topCompetitorsList: topCompetitors.length > 0 ? topCompetitors : undefined,
    launchKeywords: aiInsights?.launch_keywords ?? undefined,
    // ── Compliance & IP ──
    complianceFlags: aiInsights?.compliance_flags ?? undefined,
    ipRisk: aiInsights?.ip_risk ?? undefined,
    // ── Supplier Details (pass-through for display) ──
    supplierMoq: input.moq ?? undefined,
    supplierLeadTimeWeeks: input.leadTimeWeeks ?? undefined,
    supplierSampleCost: input.sampleCost ?? undefined,
    // ── Verdict Quality ──
    confidenceBand,
    verdictConfidencePct,
    // ── Break-even ──
    breakEvenUnitsForCapital: breakEvenUnitsForCapital ?? undefined,
    breakEvenMonths: breakEvenMonths ?? undefined,
    // ── Return Rate ──
    returnRatePct,
    returnRateLevel,
    // ── Price Alert ──
    pricePositionAlert: pricePositionAlert ?? undefined,
    // ── Niche Saturation ──
    nicheSaturationLabel,
    nicheSaturationDesc,
    // ── Advisor Brief ──
    advisorBrief,
    // ── Differentiation Quality ──
    differentiationStatus,
    differentiationWarning: differentiationWarning ?? undefined,
    differentiationSuggestions: differentiationSuggestions.length > 0 ? differentiationSuggestions : undefined,
    // ── Fix-It Scenarios ──
    fixItScenarios: fixItScenarios ?? undefined,
    // ── DataForSEO ──
    dataForSEOData: input.dataForSEO ?? undefined,
    searchVolume: input.dataForSEO?.searchVolume ?? undefined,
    searchVolumeSource: input.dataForSEO?.searchVolumeSource ?? undefined,
    searchVolumeMonthly: input.dataForSEO?.monthlySearches?.length
      ? input.dataForSEO.monthlySearches
      : undefined,
    searchTrend: input.dataForSEO?.searchTrend ?? undefined,
    realCpcUsd: input.dataForSEO?.cpcUsd ?? undefined,
    keywordCompetitionLevel: input.dataForSEO?.competitionLevel ?? undefined,
    // ── Month-by-Month Projection ──
    monthlyProjection,
    breakEvenMonth: breakEvenMonth ?? undefined,
    projectedMonthlyProfitAtSteadyState: projectedMonthlyProfitAtSteadyState ?? undefined,
    // ── Stress Test ──
    stressTest,
  }
}
