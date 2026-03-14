import { getAIInsights } from "./openaiService"

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
  } | null
}

function asNumber(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback
}

function ensureArray(v: unknown, fallback: string[]): string[] {
  if (Array.isArray(v)) return v.map(String)
  if (typeof v === "string" && v.trim()) return [v.trim()]
  return fallback
}

const REFERRAL_FEE_RATE = 0.15
const DEFAULT_FBA_FEE = 4

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

  const FIRST_ORDER_UNITS = 500
  const SALES_PER_DAY = 15
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

  const stage = input.stage === "launch" || input.stage === "optimized" ? input.stage : "optimized"
  const assumedAcosRaw = Number.isFinite(Number(input.assumedAcos))
    ? asNumber(input.assumedAcos, 0.35)
    : stage === "launch"
      ? 0.5
      : 0.35
  const assumedAcos = Math.max(assumedAcosRaw, acosFloor, effectiveLaunchAcos)

  const referralFee = sellingPrice * REFERRAL_FEE_RATE
  const ppcCostPerUnit = sellingPrice * assumedAcos
  const cogs = effectiveUnitCost + shippingCost
  const totalCost = cogs + referralFee + fbaFee
  const profitAfterAds = sellingPrice - totalCost - ppcCostPerUnit

  const isHighComplexity = complexity === "high"
  const NET_MARGIN_THRESHOLD = isHighComplexity ? 0.2 : 0.15
  const marginThresholdPct = NET_MARGIN_THRESHOLD * 100
  const netMarginRatio = sellingPrice > 0 ? profitAfterAds / sellingPrice : 0
  const passesMarginRule = netMarginRatio >= NET_MARGIN_THRESHOLD
  const estimatedMarginPercent = sellingPrice > 0 ? netMarginRatio * 100 : 0

  const premiumRiskWarning =
    hasRealMarketData && sellingPrice > avgPrice && avgPrice > 0
      ? `Premium Risk: Your price ($${sellingPrice.toFixed(2)}) is ${(((sellingPrice - avgPrice) / avgPrice) * 100).toFixed(0)}% higher than the top-5 market average ($${avgPrice.toFixed(2)}). Differentiation must justify this gap to maintain viability.`
      : undefined

  let score = 50
  const scoreBreakdown: Record<string, string> = { base: "50" }

  if (profitAfterAds >= 25) {
    score += 20
    scoreBreakdown.profitAfterAds = "+20"
  } else if (profitAfterAds >= 15) {
    score += 10
    scoreBreakdown.profitAfterAds = "+10"
  } else if (profitAfterAds >= 8) {
    score += 2
    scoreBreakdown.profitAfterAds = "+2"
  } else {
    score -= 18
    scoreBreakdown.profitAfterAds = "-18"
  }

  if (hasRealMarketData) {
    if (avgReviews < 500) {
      score += 8
      scoreBreakdown.avgReviews = "+8"
    } else if (avgReviews < 2000) {
      score += 3
      scoreBreakdown.avgReviews = "+3"
    } else {
      score -= 5
      scoreBreakdown.avgReviews = "-5"
    }
    if (!dominantBrand) {
      score += 5
      scoreBreakdown.dominantBrand = "+5"
    } else {
      scoreBreakdown.dominantBrand = "0"
    }
  }

  score = Math.max(1, Math.min(99, Math.round(score)))

  let verdict: "GO" | "NO_GO" = score >= 55 ? "GO" : "NO_GO"
  if (!passesMarginRule) verdict = "NO_GO"

  const confidence = Math.max(35, Math.min(92, Math.round(55 + (score - 50) * 0.7)))

  const aiInput = {
    keyword,
    sellingPrice,
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
  }
  const aiInsights = await getAIInsights(aiInput)

  // ─── 1. WHY THIS DECISION: 2–3 strongest real data signals only ───
  const whyBullets: string[] = []
  if (hasRealMarketData) {
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
  } else {
    if (!passesMarginRule) {
      whyBullets.push(`Net margin ${estimatedMarginPercent.toFixed(1)}% is below the ${marginThresholdPct}% threshold.`)
    }
    if (profitAfterAds >= 15 && passesMarginRule) {
      whyBullets.push(`Profit after ads $${profitAfterAds.toFixed(0)}/unit and margin pass — run again with live market data for full picture.`)
    } else if (profitAfterAds < 10) {
      whyBullets.push(`Profit after ads $${profitAfterAds.toFixed(0)}/unit is too low to sustain launch.`)
    }
  }
  const why_this_decision = (premiumRiskWarning ? [premiumRiskWarning] : []).concat(whyBullets.slice(0, 4))
  if (why_this_decision.length === 0) {
    why_this_decision.push(verdict === "NO_GO" ? "Unit economics and/or market barriers do not support a GO." : "Economics and market signals support a cautious GO; differentiate and control ACoS.")
  }

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

  // ─── 2. WHAT MOST SELLERS MISS: one insight from combined real signals ───
  let what_most_sellers_miss = ""
  if (hasRealMarketData) {
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
  } else {
    what_most_sellers_miss = "Enable live market data (Rainforest API) to see what most sellers miss in this niche."
  }

  // ─── 3. MARKET DOMINATION ANALYSIS ───
  let market_domination_analysis = ""
  if (hasRealMarketData && topCompetitors.length > 0) {
    if (dominantBrand && dominantBrandNames.length > 0) {
      const names = dominantBrandNames.slice(0, 3).join(", ")
      market_domination_analysis = `Market domination detected: ${names} appear repeatedly in the top ${topCompetitors.length} results. New sellers face established brand trust and review moats; winning share requires clear differentiation and sustained PPC, not just a lower price.`
    } else {
      const uniqueBrands = new Set(topCompetitors.map((c) => (c as { brand?: string }).brand?.toLowerCase()).filter(Boolean)).size
      market_domination_analysis = `Top ${topCompetitors.length} results show ${uniqueBrands} distinct brands — no single player dominates. Entry is more feasible; differentiation and execution matter more than overcoming a brand moat.`
    }
  } else if (hasRealMarketData) {
    market_domination_analysis = "Insufficient brand distribution data in this snapshot; run with full Rainforest results for domination analysis."
  } else {
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

  const profitability = [
    `Assumed economics: price $${sellingPrice.toFixed(2)} | COGS $${cogs.toFixed(2)} | referral $${referralFee.toFixed(2)} | FBA $${fbaFee.toFixed(2)} | ads $${ppcCostPerUnit.toFixed(2)} (ACoS ${(assumedAcos * 100).toFixed(0)}%) ⇒ profit after ads $${profitAfterAds.toFixed(2)}.`,
    "Reality check: returns/coupons/storage can compress profit 10–25%. Keep a buffer.",
    "If conversion drops, PPC costs inflate and profits collapse.",
  ]

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
  const what_would_make_go = aiInsights?.what_would_make_go

  const highIntentKeywords = [
    keyword,
    alternative_keywords[0] ?? `${keyword} premium`,
    alternative_keywords[1] ?? `${keyword} best`,
  ].slice(0, 3)
  const honeymoonRoadmap = [
    "Step 1 (Day 1–7): Vine Enrollment — Register for Amazon Vine immediately to get your first 15–30 reviews (Social Proof).",
    `Step 2 (Day 8–20): Aggressive Exact Match — Run PPC on these 3 high-intent keywords: ${highIntentKeywords.join(", ")} to build rank fast.`,
    "Step 3 (Day 21–30): Conversion Boost — Apply a 15–20% 'Green Coupon' to offset your lack of reviews and steal clicks from incumbents.",
  ]
  const highBarrierStep = "High Barrier to Entry detected. Do not launch without a minimum $15,000 launch budget for PPC and Vine reviews."
  const ppcCannibalizationStep = "PPC Cannibalization Risk: Your ad costs will likely exceed 60% of your revenue during launch. You MUST have a backend funnel or high LTV (Lifetime Value) to survive this."
  const execution_plan = [
    ...(avgReviews > 10000 ? [highBarrierStep] : []),
    ...(effectiveLaunchAcos > 0.6 ? [ppcCannibalizationStep] : []),
    ...honeymoonRoadmap,
  ]

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
  const marketRealityCheck =
    hasRealMarketData && (priceGapPct > 0 || differentiationInput)
      ? `Market Reality Check: ${priceGapPct > 0 ? `Your price is ${priceGapPct}% higher than the top 5 sellers (avg $${avgPrice.toFixed(2)}). ` : ""}${differentiationInput ? `Your differentiation ("${differentiationInput.slice(0, 80)}${differentiationInput.length > 80 ? "…" : ""}") must justify this gap to maintain a ${marginThresholdPct}% net margin.` : "Your positioning must justify the price to maintain viability."}`
      : undefined

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
          `At $${sellingPrice.toFixed(2)} and ${estimatedMarginPercent.toFixed(1)}% net margin after ads (ACoS floor ${(acosFloor * 100).toFixed(0)}%), "${keyword}" passes the ${marginThresholdPct}% stress test.`,
          opportunities.length > 0 ? opportunities[0] : "Differentiate on quality, bundle, or niche positioning to defend margin.",
          hasRealMarketData
            ? `Market: avg $${avgPrice.toFixed(2)}, ${avgReviews.toLocaleString()} reviews — ${dominantBrand ? "dominant players present; focus on long-tail and proof points." : "barrier is workable; nail one differentiator."}`
            : "Lock one clear differentiator and control ACoS in launch.",
        ]
      : [
          `Net margin ${estimatedMarginPercent.toFixed(1)}% is below the ${marginThresholdPct}% threshold — real-time PPC (${(acosFloor * 100).toFixed(0)}% floor) and returns would erase profit.`,
          financialPivotNoGo ?? (what_would_make_go?.length ? what_would_make_go[0] : "Raise price, cut COGS, or target a lower-ACoS niche to reach viability."),
          `Re-run with updated numbers once unit economics clear ${marginThresholdPct}%.`,
        ]
  if (underpricingAdvice) strategicIntelligenceParts.push(underpricingAdvice)
  if (marketRealityCheck) strategicIntelligenceParts.push(marketRealityCheck)
  const ppcRealityAudit = `PPC Reality Audit: In this niche, the average CPC is approximately $${baseCpcFinal.toFixed(2)}. At a 10% conversion rate, your launch ad cost per unit will be $${launchAdCostPerUnit.toFixed(2)}. This requires a daily budget of at least $100 to gain any traction.`
  strategicIntelligenceParts.push(ppcRealityAudit)
  const launchCapitalConsultantInsight = `To hit page 1 in this niche, you need roughly $${launchCapitalRequired.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} for your first 30 days. Don't start with less.`
  strategicIntelligenceParts.push(`Launch Capital Required: $${launchCapitalRequired.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}. ${launchCapitalConsultantInsight}`)
  const strategicIntelligence = strategicIntelligenceParts.join(" ")

  // ─── 5. EXPERT INSIGHT (consultant secret): synthesize real signals only ───
  const nicheHint = keyword.replace(/\s+/g, " ").slice(0, 30)
  const painHint = painPoints.length > 0 ? painPoints[0] : "quality and fit"
  let consultantSecret = ""
  if (hasRealMarketData) {
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
  } else {
    consultantSecret = `Run with live market data to get a data-backed expert take for "${nicheHint}".`
  }

  // ─── 6. OPPORTUNITY: from real pain points → one differentiation opportunity ───
  let opportunity_from_data = ""
  if (hasRealMarketData && painPoints.length > 0) {
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
  } else if (hasRealMarketData) {
    opportunity_from_data = "Enable pain-point extraction (e.g. from titles/reviews) to surface a concrete differentiation opportunity."
  } else {
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
          marketDensity: (marketDensityHigh ? "high" : "low") as const,
          acosFloorUsed: acosFloor,
          premiumRiskWarning: premiumRiskWarning ?? undefined,
          marketRealityCheck: marketRealityCheck ?? undefined,
        }
      : undefined

  const report = {
    verdict,
    score,
    confidence,
    profit_after_ads: profitAfterAds,
    estimated_margin: `${estimatedMarginPercent.toFixed(1)}%`,
    financial_stress_test: financialStressTest,
    strategic_intelligence: strategicIntelligence,
    score_breakdown: scoreBreakdown,
    has_real_market_data: hasRealMarketData,
    premium_risk_warning: premiumRiskWarning ?? undefined,
    market_reality_check: marketRealityCheck ?? undefined,
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
    alternative_keywords,
    alternative_keywords_with_cost,
    what_would_make_go: verdict === "NO_GO" ? what_would_make_go : undefined,
    profit_breakdown: profitBreakdown,
    profit_explanation: profitExplanation,
    net_profit: Math.round(profitAfterAds * 100) / 100,
    roi: Math.round(roiPct * 10) / 10,
    section_help: sectionHelp,
    why_this_decision: ensureArray(why_this_decision, []),
    review_intelligence: ensureArray(review_intelligence, []),
    market_trends: ensureArray(market_trends, []),
    competition: ensureArray(dominantControl, []),
    beginner_fit: ensureArray(beginnerFit, []),
    profitability: ensureArray(profitability, []),
    advertising: ensureArray(advertising, []),
    risks: ensureArray(risks, []),
    opportunities: ensureArray(opportunities, []),
    differentiation: ensureArray(differentiation, []),
    execution_plan: ensureArray(execution_plan, []),
  }

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
    premiumRiskWarning: premiumRiskWarning,
    marketRealityCheck: marketRealityCheck,
    liveMarketComparison: liveMarketComparison,
    marketDensity: report.market_density,
    acosFloorUsed: report.acos_floor_used,
    marginThresholdPct: report.margin_threshold_pct,
    operationalRiskBuffer: operationalRiskBufferDollars,
    ppcCompetitionFloor: acosFloor,
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
    whatWouldMakeGo: verdict === "NO_GO" ? what_would_make_go : undefined,
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
  }
}
