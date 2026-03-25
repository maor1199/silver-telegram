import { getAIInsights, getConsultantInsights, getMarginThreshold, getValidatedDifferentiators, type ConsultantInsights } from "./openaiService"
import { buildSignals } from "./signals"

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
    competitorsWithOver1000Reviews?: number
    priceMin?: number
    priceMax?: number
    sponsoredShare?: number
    brandCounts?: Record<string, number>
    dominantBrandNames?: string[]
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

  let acos = 0.45
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

const REFERRAL_FEE_RATE = 0.15
const DEFAULT_FBA_FEE = 6.50

export async function analyzeProduct(input: AnalyzeInput) {
  const keyword = asString(input.keyword, "cat cave").trim() || "cat cave"
  const sellingPrice = asNumber(input.sellingPrice, 44)
  const unitCost = asNumber(input.unitCost, 4)
  const shippingCost = asNumber(input.shippingCost, 2)
  const fbaFee = asNumber(input.fbaFee, DEFAULT_FBA_FEE)
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
  const painPoints = Array.isArray(market?.painPoints) ? market.painPoints : []
  const topCompetitors = market?.topCompetitors ?? []
  const priceMin = market?.priceMin
  const priceMax = market?.priceMax
  const sponsoredShare = market?.sponsoredShare ?? 0
  const brandCounts = market?.brandCounts ?? {}
  const dominantBrandNames = market?.dominantBrandNames ?? []

  const diffInputLower = differentiationInput.toLowerCase()
  const mentionsPainPoint = painPoints.length > 0 && painPoints.some((p) => diffInputLower.includes(String(p).toLowerCase()))
  const differentiationScore =
    differentiationInput.length < 100 || !mentionsPainPoint ? ("Weak" as const) : ("Strong" as const)
  const painPoint1 = painPoints[0] ?? "quality"
  const gapTip =
    differentiationScore === "Weak" && painPoints.length > 0
      ? `The market complains about ${painPoint1}. Your current plan doesn't solve this. Adding a clear solution for ${painPoint1} in your bullets and images would double your conversion rate.`
      : undefined

  const marketDensityHigh = competitorsWithOver1000Reviews >= 3
  let acosFloor = marketDensityHigh ? 0.45 : 0.25
  const differentiationStrong = differentiationInput.length >= 50
  if (!differentiationStrong) acosFloor = Math.max(acosFloor, 0.5)

  const LAUNCH_CVR = 0.1
  let baseCpcDollars: number
  if (avgReviews > 20000) baseCpcDollars = 3.25
  else if (avgReviews >= 5000) baseCpcDollars = 2.1
  else if (avgReviews >= 1000) baseCpcDollars = 1.45
  else baseCpcDollars = 0.9
  const keywordLower = keyword.toLowerCase()
  const categoryWeight = /electric|supplements|beauty/.test(keywordLower) ? 1.2 : 1
  const baseCpcFinal = baseCpcDollars * categoryWeight

  const launchAdCostPerUnit = baseCpcFinal / LAUNCH_CVR
  const effectiveLaunchAcos = sellingPrice > 0 ? launchAdCostPerUnit / sellingPrice : 0

  const FIRST_ORDER_UNITS = 300
  const SALES_PER_DAY = 7
  const LAUNCH_DAYS = 30
  const VINE_AND_MISC = 500
  const launchInventoryCost = (unitCost + shippingCost) * FIRST_ORDER_UNITS
  const launchPpcBurn = launchAdCostPerUnit * SALES_PER_DAY * LAUNCH_DAYS
  const launchCapitalRequired = launchInventoryCost + launchPpcBurn + VINE_AND_MISC
  const launchCapitalBreakdown = {
    inventory: launchInventoryCost,
    ppcMarketing: launchPpcBurn,
    vineAndMisc: VINE_AND_MISC,
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
  const launchAcosValue =
    dynamicAcosForMarket != null ? dynamicAcosForMarket : 0.5
  const assumedAcosRaw = Number.isFinite(Number(input.assumedAcos))
    ? asNumber(input.assumedAcos, 0.35)
    : stage === "launch"
      ? launchAcosValue
      : 0.35
  const baseAcos = hasRealMarketData ? (dynamicAcosForMarket ?? 0.35) : 0.35
  const assumedAcos = Math.min(0.45, Math.max(0.25, Math.max(baseAcos, acosFloor)))

  const referralFee = sellingPrice * REFERRAL_FEE_RATE
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

  // ─── Decision engine: 4‑Layer Verdict Model ───
  // Layer 1 — Economic Floor (Kill Switch)
  const netMarginRatioForGate = sellingPrice > 0 ? profitAfterAds / sellingPrice : 0
  const economicFloorFails = profitAfterAds < 6 || netMarginRatioForGate < 0.15

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

  if (hasStrongVisualDiff) {
    score += 20
    scoreBreakdown.differentiation = "+20 (strong differentiation aligned with market pain points)"
  } else if (hasAnyDiffText) {
    score -= 10
    scoreBreakdown.differentiation = "-10 (weak/generic differentiation)"
  }

  // Clamp final score (UI only — verdict is logic‑based below)
  score = Math.max(1, Math.min(99, Math.round(score)))

  // ─── FINAL DECISION ENGINE (SIMPLE & HUMAN-LIKE) ───

  // 1. SURVIVAL — real profit after ads
  const hasRealProfit = profitAfterAds > 0 && netMarginRatioForGate > 0.12

  // 2. STRONG PROFIT — safe for scaling
  const hasHealthyProfit = profitAfterAds >= 10 && netMarginRatioForGate >= 0.18

  // 3. MARKET LOCK — entry blocked
  const avgTop10Reviews = market?.avgReviews ?? 0
  const brandShareTop3 = dominantBrand ? 0.6 : 0.2
  const hasDominantBrand = dominantBrand

  const marketLocked = avgTop10Reviews > 500 && hasDominantBrand

  // 4. WIN PATH — any way to compete
  const avgPriceForVerdict = market?.avgPrice ?? sellingPrice
  const pricePosition = avgPriceForVerdict > 0 ? sellingPrice / avgPriceForVerdict : 1

  const canCompeteOnPrice = pricePosition <= 0.95
  const hasRealDifferentiation = hasStrongVisualDiff

  const hasWinPath = hasRealDifferentiation || canCompeteOnPrice

  // ─── VERDICT ───
  let verdict: "GO" | "IMPROVE_BEFORE_LAUNCH" | "NO_GO"
  let verdictAdvisory: string | undefined

  // NO_GO only if clearly bad
  if (!hasRealProfit) {
    verdict = "NO_GO"
  } else if (marketLocked && !hasWinPath && profitAfterAds < 5) {
    verdict = "NO_GO"
  }

  // IMPROVE for most realistic cases
  else if (!hasHealthyProfit) {
    verdict = "IMPROVE_BEFORE_LAUNCH"
  }

  // GO only for strong cases
  else {
    verdict = "GO"
  }

  const confidence = Math.max(35, Math.min(92, Math.round(55 + (score - 50) * 0.7)))

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
  }
  const aiInsights = await getAIInsights(aiInput)
  console.log("STEP 1 - RAW AI WHY:", aiInsights?.why_this_decision)

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
      whyBullets.push(`Your price ($${sellingPrice.toFixed(2)}) is above market avg ($${avgPrice.toFixed(2)}) — differentiation must justify the premium.`)
    }
    if (profitAfterAds >= 15 && passesMarginRule) {
      whyBullets.push(`Profit after ads $${profitAfterAds.toFixed(0)}/unit and ${estimatedMarginPercent.toFixed(1)}% margin meet the bar — economics support a GO.`)
    } else if (profitAfterAds < 10 && whyBullets.length < 2) {
      whyBullets.push(`Profit after ads $${profitAfterAds.toFixed(0)}/unit is too thin — PPC and returns would erase margin.`)
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
        "Seasonality often improves in colder months and Q4 gifting.",
        "Saturation risk is real — winners differentiate on materials, size niche, or bundle value.",
      ]
    : [
        `Demand for "${keyword}" is stable; growth is mostly premium-positioning driven.`,
        "Seasonality often improves in colder months and Q4 gifting.",
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
    `Assumed economics: price $${sellingPrice.toFixed(2)} | COGS $${cogs.toFixed(2)} | referral $${referralFee.toFixed(2)} | FBA $${fbaFee.toFixed(2)} | ads $${ppcCostPerUnit.toFixed(2)} (ACoS ${(assumedAcos * 100).toFixed(1)}%) ⇒ profit after ads $${profitAfterAds.toFixed(2)}.`,
    "Reality check: returns/coupons/storage can compress profit 10–25%. Keep a buffer.",
    "If conversion drops, PPC costs inflate and profits collapse.",
  ]
  const profitability = aiInsights?.profit_reality?.trim()
    ? [aiInsights.profit_reality.trim(), ...profitabilityBase]
    : profitabilityBase

  const advertising = [
    "Launch ACoS assumption: 40–60% for the first 30–60 days.",
    "Typical CPC range in competitive pet niches can be $1.2–$2.8 depending on keyword intent.",
    "PPC plan: start exact/phrase long-tail, add negatives daily, cap broad until conversion proven.",
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

  const executionFromAi = aiInsights?.execution_plan?.length ? aiInsights.execution_plan : null
  const honeymoonFromAi = aiInsights?.honeymoon_roadmap?.length ? aiInsights.honeymoon_roadmap : null
  const honeymoonRoadmap = honeymoonRoadmapDefault

  const highBarrierStep = `High Review Barrier: avg ${avgReviews.toLocaleString()} reviews in this niche. Do not launch without at least $15,000 total budget (inventory + PPC + Vine).`
  const ppcCannibalizationStep = `PPC Warning: your launch ACoS will likely hit 60%+ in the first 30 days. Cap your daily budget at $${dailyPpcBudget} and only scale when ACoS drops below ${targetAcosDisplay}%.`
  const executionPlanRaw = [
    ...(avgReviews > 10000 ? [highBarrierStep] : []),
    ...(effectiveLaunchAcos > 0.6 ? [ppcCannibalizationStep] : []),
    ...honeymoonRoadmapDefault,
  ]
  const execution_plan = executionPlanRaw.map((step: string) =>
    String(step).replace(/\bkeywords:\s*:\s*/gi, "keywords: ")
  )
  const what_would_make_go = whatWouldFlipFromExecutionPlan(verdict, execution_plan)

  const estimatedCpcRange = avgReviews >= 2000 ? { min: 1.5, max: 3 } : avgReviews >= 500 ? { min: 0.8, max: 2 } : { min: 0.3, max: 1 }
  const minCpc = Number.isFinite(estimatedCpcRange.min) ? estimatedCpcRange.min : 0.5
  const maxCpc = Number.isFinite(estimatedCpcRange.max) ? estimatedCpcRange.max : 2
  const cpcLabel = `$${minCpc.toFixed(1)}–$${maxCpc.toFixed(1)}/click`
  const alternative_keywords_with_cost = alternative_keywords.map((kw) => ({
    keyword: String(kw).trim(),
    estimatedCpc: cpcLabel,
    estimatedCpcDisplay: cpcLabel,
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
    profitAfterAds: Math.round(profitAfterAds * 100) / 100,
  }

  const profitExplanation =
    "We start with your selling price. We subtract: (1) Amazon referral fee — 15% of selling price, paid to Amazon on every sale. " +
    "(2) FBA fulfillment fee — pick, pack, ship, and customer service (we use a standard-size estimate unless you provide your FBA fee). " +
    "(3) COGS — your unit cost plus shipping to FBA. " +
    "(4) PPC cost per unit — we estimate it as ACoS × selling price (ACoS = ad spend as % of sales; launch is often 40–60%, optimized 25–35%). " +
    "What remains is profit after ads. Returns, coupons, and storage can reduce this by 10–25% in practice."

  const financialStressTest =
    `Net margin: ${estimatedMarginPercent.toFixed(1)}%. Threshold: ${marginThresholdPct}%${isHighComplexity ? " (high-complexity product)." : "."} ` +
    (passesMarginRule
      ? "PASS — Unit economics meet Aggregator viability. Verdict: GO."
      : `FAIL — Net margin below ${marginThresholdPct}%. Product is not viable at current price/cost/ACoS. Verdict: NO-GO. Increase price, reduce COGS, or lower assumed ACoS to reach at least ${marginThresholdPct}% net margin.`)

  const priceGapPct =
    hasRealMarketData && avgPrice > 0 && sellingPrice > avgPrice
      ? Math.round(((sellingPrice - avgPrice) / avgPrice) * 100)
      : 0
  const marketRealityCheckFallback =
    hasRealMarketData && (priceGapPct > 0 || differentiationInput)
      ? `Market Reality Check: ${priceGapPct > 0 ? `Your price is ${priceGapPct}% higher than the top 5 sellers (avg $${avgPrice.toFixed(2)}). ` : ""}${differentiationInput ? `Your differentiation ("${differentiationInput.slice(0, 80)}${differentiationInput.length > 80 ? "…" : ""}") must justify this gap to maintain a ${marginThresholdPct}% net margin.` : "Your positioning must justify the price to maintain viability."}`
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
  const ppcRealityAudit = `PPC Reality Audit: In this niche, the average CPC is approximately $${baseCpcFinal.toFixed(2)}. At a 10% conversion rate, your launch ad cost per unit will be $${launchAdCostPerUnit.toFixed(2)}. This requires a daily budget of at least $100 to gain any traction.`
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
    const suggestions: Record<string, string> = {
      durable: "A reinforced design or stress-point warranty could create a clear advantage.",
      durability: "Highlight materials and construction; show stress tests in images.",
      quality: "Address quality complaints with specs and close-up proof in the main image.",
      size: "Offer size clarity (dimensions, comparison) and reduce returns.",
      sizing: "Clear sizing guide and fit expectations to cut returns and bad reviews.",
      comfort: "Emphasize comfort features and materials; use lifestyle imagery.",
      washable: "Lead with washability and care instructions to capture that segment.",
      sturdy: "Reinforced build and durability claims with visuals.",
      fit: "Improve fit description and sizing; reduce mismatch returns.",
      material: "Premium or specific materials as differentiator with proof.",
      fabric: "Fabric quality and care as a selling point.",
    }
    const key = topPain.toLowerCase().replace(/\s+/g, "")
    opportunity_from_data = suggestions[key] ?? `Reviews in this niche often mention "${topPain}". A product that explicitly solves for ${topPain} (and shows it in bullets and images) can capture buyers who filter by that concern.`
  } else if (!opportunity_from_data && hasRealMarketData) {
    opportunity_from_data = "Enable pain-point extraction (e.g. from titles/reviews) to surface a concrete differentiation opportunity."
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
      hasWinPath,
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
  }
}
