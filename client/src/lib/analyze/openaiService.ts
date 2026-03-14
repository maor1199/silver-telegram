import OpenAI from "openai"

function getOpenAIClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) return null
  return new OpenAI({ apiKey: key })
}

/** Product-vs-market comparison for the analyst */
export type ProductVsMarketInput = {
  price_position: string
  review_barrier: string
  advertising_environment: string
  differentiation_strength: string
  product_risk: string
}

export type AIInsightsInput = {
  keyword: string
  sellingPrice: number
  unitCost?: number
  shippingCost?: number
  profitAfterAds: number
  verdict: "GO" | "NO_GO"
  avgPrice: number
  avgRating: number
  avgReviews: number
  dominantBrand: boolean
  newSellersInTop10?: number
  newSellersInTop20?: number
  topTitles: string[]
  topPrices: number[]
  differentiation?: string
  complexity?: string
  product_vs_market?: ProductVsMarketInput
  landed_cost?: number
  estimated_margin?: number
  estimated_roi?: number
  topCompetitors?: { position: number; title: string; price: number; ratingsTotal: number; rating?: number; brand?: string; sponsored?: boolean }[]
  painPoints?: string[]
  product_name?: string
  review_structure_summary?: string
  new_seller_presence?: "high" | "moderate" | "low"
  keyword_saturation_ratio?: string
  price_compression?: string
  brand_distribution_summary?: string
  market_maturity_signal?: "emerging" | "growing" | "mature"
  sponsored_top10_count?: number
  sponsored_total_count?: number
}

export type AIInsights = {
  review_intelligence: string[]
  opportunities: string[]
  differentiation: string[]
  risks: string[]
  alternative_keywords: string[]
  what_would_make_go?: string[]
  decision_conversation?: string[]
  execution_plan?: string[]
  expert_insight?: string
  what_most_sellers_miss?: string
  competition_reality?: string[]
  opportunity?: string
  profit_reality?: string
  entry_reality?: string
  why_this_decision?: string[]
  market_domination_analysis?: string
  early_strategy_guidance?: string
  honeymoon_roadmap?: string[]
  /** Advisor implication per section: what this data means in money/time/risk and what to do (max 2 sentences, definitive, to "you") */
  advisor_implication_why_this_decision?: string
  advisor_implication_expert_insight?: string
  advisor_implication_what_most_sellers_miss?: string
  advisor_implication_market_signals?: string
  advisor_implication_entry_reality?: string
  advisor_implication_market_domination_analysis?: string
  advisor_implication_competition_reality?: string
  advisor_implication_opportunity?: string
  advisor_implication_early_strategy_guidance?: string
}

/** Response structure schema: each section has content key and advisor_implication (string). */
const RESPONSE_JSON_SCHEMA = {
  why_this_decision: [] as string[],
  advisor_implication_why_this_decision: "",
  expert_insight: "",
  advisor_implication_expert_insight: "",
  what_most_sellers_miss: "",
  advisor_implication_what_most_sellers_miss: "",
  advisor_implication_market_signals: "",
  entry_reality: "",
  advisor_implication_entry_reality: "",
  market_domination_analysis: "",
  advisor_implication_market_domination_analysis: "",
  competition_reality: [] as string[],
  advisor_implication_competition_reality: "",
  opportunity: "",
  advisor_implication_opportunity: "",
  early_strategy_guidance: "",
  advisor_implication_early_strategy_guidance: "",
} as const

const SYSTEM_PROMPT = `You are a senior Amazon product strategist with 30 years of experience analyzing the FULL first page of Amazon search results (up to 30 listings). You base every insight on the provided market data — not generic advice. The analysis must clearly communicate that the system evaluates the FULL first page (up to 30 listings), not just the top 10. Reference both top-10 dynamics and overall first-page structure where relevant.

CORE RULES
- Use real market signals: review tiers, advertising pressure, price band, keyword saturation, brand structure, new seller presence, market maturity.
- Format reasoning as: Observation → implication.
- GOOD: "6 of the top 10 listings have over 1k reviews → strong social proof barrier for new entrants."
- BAD: "Competition is strong." Generic statements are not allowed.

CARD INTELLIGENCE RULES

WHY THIS DECISION: Exactly 3 bullets. Each in "Observation → implication" form. Use signals: review tiers, advertising pressure, price band, keyword saturation. Example: "Top listings average 4,452 reviews → strong review barrier." / "5 of the top 10 listings are sponsored → PPC competition is aggressive." / "Most listings cluster between $35–42 → limited pricing flexibility."

EXPERT INSIGHT: 3–4 sentences max. Reference: review barrier, price band, keyword saturation, brand structure.

WHAT MOST SELLERS MISS: Maximum 2 insights. Example: "Many sellers underestimate how tightly prices cluster in this niche."

ENTRY REALITY: 2–3 bullets explaining entry conditions. Use: review tiers, new seller presence, market maturity. Example: "3 listings have under 300 reviews — indicating new sellers still reach page one." / "However, 4 listings exceed 5k reviews — strong long-term competitors exist."

COMPETITION REALITY: Minimum 2 insights. Reference: price compression, review tiers, sponsored density. Example: "7 listings price between $35–39 → strong price compression." / "5 of the top 10 listings are sponsored → aggressive PPC environment."

OPPORTUNITY: One realistic differentiation opportunity. Compare: user differentiation, competitor positioning, review pain points.

PROFIT REALITY: Explain briefly how margin, Amazon fees, and PPC pressure impact profitability.

EXECUTION PLAN: 30-day roadmap only. Structure: Week 1, Week 2, Week 3–4.

Return JSON with these exact keys (include advisor_implication for each section below):

OVERVIEW: expert_insight (string), what_most_sellers_miss (string), why_this_decision (array of exactly 3 strings, Observation → implication), what_would_make_go (array of 3 strings, ONLY when verdict is NO_GO).
DEEP DIVE: competition_reality (array, min 2), opportunity (string, one), profit_reality (string), entry_reality (string or array 2–3 bullets), market_domination_analysis (string).
EXECUTION: alternative_keywords (array, max 3), execution_plan (array, 30-day: Week 1 / Week 2 / Week 3–4), early_strategy_guidance (string).
LEGACY: decision_conversation, review_intelligence (3), opportunities (3), differentiation (3), risks (3).

JSON response schema (include these keys; advisor_implication fields are strings, use "" if omitted):
why_this_decision, advisor_implication_why_this_decision "", expert_insight, advisor_implication_expert_insight "", what_most_sellers_miss, advisor_implication_what_most_sellers_miss "", advisor_implication_market_signals "", entry_reality, advisor_implication_entry_reality "", market_domination_analysis, advisor_implication_market_domination_analysis "", competition_reality, advisor_implication_competition_reality "", opportunity, advisor_implication_opportunity "", early_strategy_guidance, advisor_implication_early_strategy_guidance "".

ADVISOR IMPLICATION (required for every section below):
For every advisor_implication, think like a senior Amazon consultant writing to a friend who is about to invest $10,000. Be direct, use the actual numbers, no hedging.

For each section, use the specific numbers you have access to and answer the question below.

WHY_THIS_DECISION — Use: netMargin, avgReviews, launchCapital, ppcPerUnit. Question: "Is this fixable or not, and what does it cost them if they ignore it?"

EXPERT_INSIGHT — Use: avgPrice, sellingPrice, sponsoredTop10, keywordSaturation. Question: "What is the single most important dynamic in this market right now?"

WHAT_MOST_SELLERS_MISS — Use: newSellerCount, avgReviews, topReviews. Question: "What pattern do beginners miss that changes the entire strategy?"

MARKET_SIGNALS — Use: keywordSaturation, priceCompression, sponsoredTotal, newSellerPresence. Question: "What does the first page data tell us about how to win here?"

ENTRY_REALITY — Use: listingsUnder100, avgPrice, sellingPrice, priceGapPercent. Question: "How hard is entry really, and what is the actual path in?"

MARKET_DOMINATION — Use: distinctBrands, topBrands, brandConcentration. Question: "Is this market winnable and what does winning actually require?"

COMPETITION_REALITY — Use: sponsoredTop10, sponsoredTotal, estimatedCPC, adCostPerUnit. Question: "What will PPC actually cost here and what does that mean for survival?"

OPPORTUNITY — Use: opportunityText, competitorWeakness, differentiator. Question: "Is this opportunity real and exactly where in the listing must it appear?"

EARLY_STRATEGY_GUIDANCE — Use: launchCapital, ppcBudget, vineEstimate, netMargin, threshold. Question: "What is the single most important thing to get right in the first 30 days?"

Each advisor_implication must: (1) Use the specific numbers above — never speak in generals. (2) Tell the seller exactly what will happen to their money or rank if they ignore this. (3) End with one concrete action — a directive, not a suggestion.

Return valid JSON only. No markdown code fences.`

function buildUserPrompt(input: AIInsightsInput): string {
  const lines: string[] = [
    "=== USER PRODUCT (analyze this) ===",
    `Product / keyword (market): ${input.product_name ? `"${input.product_name}"` : `"${input.keyword}"`}`,
    `Keyword (search): "${input.keyword}"`,
    `Selling price: $${input.sellingPrice} | Unit cost: $${input.unitCost ?? "?"} | Shipping: $${input.shippingCost ?? "?"}`,
    `Differentiation: ${input.differentiation?.trim() || "(none provided)"}`,
    `Complexity: ${input.complexity?.trim() || "not specified"}`,
    "",
    "=== UNIT ECONOMICS ===",
    `Profit after ads: $${input.profitAfterAds.toFixed(2)}/unit`,
    `Estimated margin: ${input.estimated_margin != null ? input.estimated_margin.toFixed(1) + "%" : "N/A"} | ROI: ${input.estimated_roi != null ? input.estimated_roi.toFixed(1) + "%" : "N/A"}`,
    `Landed cost: $${input.landed_cost != null ? input.landed_cost.toFixed(2) : "N/A"}`,
    "",
    "=== VERDICT ===",
    `Verdict: ${input.verdict}`,
    "",
    "=== MARKET — TOP 30 LISTINGS (first page, organic + sponsored) ===",
    `Avg price: $${input.avgPrice.toFixed(2)} | Avg reviews: ${input.avgReviews.toLocaleString()} | Avg rating: ${input.avgRating}★`,
    `Brand distribution: ${input.dominantBrand ? "one or few brands dominate" : "fragmented"}. New sellers in top 10: ${input.newSellersInTop10 ?? 0}, top 20: ${input.newSellersInTop20 ?? 0}.`,
  ]

  if (input.review_structure_summary) {
    lines.push("", "Review structure summary (full first page, up to 30 listings):", input.review_structure_summary)
  }
  if (input.new_seller_presence) {
    lines.push("", "New seller presence (listings under 200 reviews):", input.new_seller_presence)
  }
  if (input.keyword_saturation_ratio) {
    lines.push("", "Keyword saturation:", input.keyword_saturation_ratio)
  }
  if (input.price_compression) {
    lines.push("", "Price compression:", input.price_compression)
  }
  if (input.brand_distribution_summary) {
    lines.push("", "Brand distribution:", input.brand_distribution_summary)
  }
  if (input.market_maturity_signal) {
    lines.push("", "Market maturity signal:", input.market_maturity_signal)
  }
  if (input.sponsored_top10_count != null || input.sponsored_total_count != null) {
    lines.push(
      "",
      "Sponsored density:",
      `Top 10: ${input.sponsored_top10_count ?? "—"} sponsored | First page total: ${input.sponsored_total_count ?? "—"} sponsored`
    )
  }
  if (input.painPoints?.length) {
    lines.push("", "Inferred pain points from competitor titles (use for review intelligence and differentiation gap):", input.painPoints.join(", "))
  }

  if (input.product_vs_market) {
    lines.push(
      "",
      "Product vs market:",
      `- Price position: ${input.product_vs_market.price_position}`,
      `- Review barrier: ${input.product_vs_market.review_barrier}`,
      `- Advertising environment: ${input.product_vs_market.advertising_environment}`,
      `- Differentiation strength: ${input.product_vs_market.differentiation_strength}`,
      `- Product risk: ${input.product_vs_market.product_risk}`
    )
  }

  lines.push(
    "",
    "Top competitor titles (use for pain points and positioning):",
    ...(input.topTitles.slice(0, 15).map((t, i) => `${i + 1}. ${t}`) || []),
    "",
    "Top prices (first page):",
    input.topPrices.length ? input.topPrices.slice(0, 10).map((p) => "$" + p).join(", ") : "N/A"
  )

  if (input.topCompetitors?.length) {
    const top5 = input.topCompetitors.slice(0, 5)
    lines.push(
      "",
      "COMPETITOR SNAPSHOT — Top 5 (use for price positioning, brand presence, review strength, rating quality):",
      ...top5.map(
        (c) =>
          `#${c.position} $${c.price.toFixed(2)} | ${c.ratingsTotal} reviews | ${c.rating != null ? c.rating + "★" : "—"} | ${c.brand ?? "—"} | ${c.sponsored ? "sponsored" : "organic"} | ${(c.title || "").slice(0, 50)}…`
      ),
      "",
      "Full SERP sample (top 20):",
      ...input.topCompetitors.slice(0, 20).map(
        (c) =>
          `#${c.position} $${c.price.toFixed(2)} | ${c.ratingsTotal} reviews | ${c.brand ?? "—"} ${c.sponsored ? "sponsored" : "organic"} | ${(c.title || "").slice(0, 50)}…`
      )
    )
  }

  lines.push(
    "",
    "This data represents the FULL first page of Amazon results (up to 30 listings), not just the top 10. Analyze the user's product against it. Use real market structure signals in every insight. Return JSON with all required keys."
  )
  return lines.join("\n")
}

export async function getAIInsights(input: AIInsightsInput): Promise<AIInsights | null> {
  const openai = getOpenAIClient()
  if (!openai) {
    console.warn("⚠️ OPENAI_API_KEY not set; skipping AI insights")
    return null
  }

  try {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini"
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    })

    const raw = completion.choices[0]?.message?.content?.trim()
    if (!raw) return null

    const parsed = JSON.parse(raw) as Record<string, unknown>

    const toArray = (v: unknown): string[] => {
      if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean)
      if (typeof v === "string") return [v]
      return []
    }
    const toStr = (v: unknown): string | undefined => (v != null && typeof v === "string" ? v : undefined)

    const whyDecision = toArray(parsed.why_this_decision).slice(0, 3)
    const decisionConversation = toArray(parsed.decision_conversation)
    const useWhy = whyDecision.length >= 1 ? whyDecision : decisionConversation.slice(0, 5)

    const entryRealityRaw = parsed.entry_reality
    const entry_reality =
      Array.isArray(entryRealityRaw)
        ? entryRealityRaw.map((x) => String(x)).filter(Boolean).join("\n")
        : toStr(entryRealityRaw)

    return {
      decision_conversation: useWhy,
      review_intelligence: toArray(parsed.review_intelligence).slice(0, 3),
      opportunities: toArray(parsed.opportunities).slice(0, 3),
      differentiation: toArray(parsed.differentiation).slice(0, 3),
      risks: toArray(parsed.risks).slice(0, 3),
      alternative_keywords: toArray(parsed.alternative_keywords).slice(0, 3),
      what_would_make_go:
        input.verdict === "NO_GO" ? toArray(parsed.what_would_make_go).slice(0, 3) : undefined,
      execution_plan: toArray(parsed.execution_plan).slice(0, 8),
      expert_insight: toStr(parsed.expert_insight),
      what_most_sellers_miss: toStr(parsed.what_most_sellers_miss),
      competition_reality: toArray(parsed.competition_reality).slice(0, 6),
      opportunity: toStr(parsed.opportunity),
      profit_reality: toStr(parsed.profit_reality),
      entry_reality: entry_reality ?? toStr(parsed.entry_reality),
      why_this_decision: whyDecision.length >= 1 ? whyDecision : useWhy.slice(0, 3),
      market_domination_analysis: toStr(parsed.market_domination_analysis),
      early_strategy_guidance: toStr(parsed.early_strategy_guidance),
      honeymoon_roadmap: toArray(parsed.honeymoon_roadmap).slice(0, 8),
      advisor_implication_why_this_decision: toStr(parsed.advisor_implication_why_this_decision),
      advisor_implication_expert_insight: toStr(parsed.advisor_implication_expert_insight),
      advisor_implication_what_most_sellers_miss: toStr(parsed.advisor_implication_what_most_sellers_miss),
      advisor_implication_market_signals: toStr(parsed.advisor_implication_market_signals),
      advisor_implication_entry_reality: toStr(parsed.advisor_implication_entry_reality),
      advisor_implication_market_domination_analysis: toStr(parsed.advisor_implication_market_domination_analysis),
      advisor_implication_competition_reality: toStr(parsed.advisor_implication_competition_reality),
      advisor_implication_opportunity: toStr(parsed.advisor_implication_opportunity),
      advisor_implication_early_strategy_guidance: toStr(parsed.advisor_implication_early_strategy_guidance),
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("❌ OpenAI error:", message)
    return null
  }
}
