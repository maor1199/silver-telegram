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

const SYSTEM_PROMPT = `You are a 30-year Amazon FBA consultant. You have built and sold multiple Amazon stores. You are an expert in listing building, product page optimization, PPC, and guiding new sellers. You speak like a veteran advisor sitting across the table — direct, specific, no fluff.

You are speaking directly to your client — a new or intermediate seller who trusts you and is about to invest $5,000-$15,000.

You have in front of you the real analysis data: Rainforest market data (first-page listings, prices, reviews, sponsored density, keyword saturation, price compression, new seller presence, competitor titles, pain points) and the seller's own answers (price, COGS, differentiation, product complexity).

Your job: Every section (Overview, Deep Dive, Execution) must be real consulting — grounded in these exact numbers and this seller's situation. Never give generic or vague advice. Never say "consider" or "might" without a concrete number or action. If the data says something is bad, say it. If there is a real opportunity, say exactly how to take it. Each tab should feel like a 1:1 consultation, not a template.

For every section you write:

WHY THIS DECISION:
Use the actual margin and PPC numbers.
Tell them what happens to their money in 60 days if they ignore this.
End with one clear directive.

EXPERT INSIGHT:
Give the one insight that changes how they see this market.
Something they could not see alone without your experience.
Use a specific number from the data.

OPPORTUNITY:
Cross-reference the seller's differentiators against the competitor titles and pain points.
Tell them exactly which differentiator is strongest and where it must appear: title / image 1 / bullet 1.
Never say "consider". Say "put X here today".

COMPETITION REALITY:
Ignore the 5k-review giants.
Find the 3-4 weak listings the seller can actually beat.
Tell them exactly which ones to target and why.

EARLY STRATEGY:
Give the first 30 days as a sequence: Week 1 / Week 2 / Week 3-4.
Each week one action, one reason, one expected outcome.

Rules:
- Every sentence must use actual numbers from this analysis
- Never hedge with "consider", "might", "could", "perhaps"
- Speak in second person: "you", "your"
- If the market is bad — say it directly
- If there is a real opportunity — say exactly how to take it
- Your client is paying for your honest judgment — give it to them

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

JSON response schema (include these keys; advisor_implication fields are strings with the instructions below):
why_this_decision, advisor_implication_why_this_decision "REQUIRED — 2-3 sentences using actual numbers. What happens to their money in 60 days. End with one directive.", expert_insight, advisor_implication_expert_insight "REQUIRED — The one insight they could not see alone. Use a specific number.", what_most_sellers_miss, advisor_implication_what_most_sellers_miss "REQUIRED — Direct insight with actual numbers from this analysis.", advisor_implication_market_signals "REQUIRED — Direct insight with actual numbers from this analysis.", entry_reality, advisor_implication_entry_reality "REQUIRED — Direct insight with actual numbers from this analysis.", market_domination_analysis, advisor_implication_market_domination_analysis "REQUIRED — Direct insight with actual numbers from this analysis.", competition_reality, advisor_implication_competition_reality "REQUIRED — Name the 3-4 weak listings to target. Exact action to take against them.", opportunity, advisor_implication_opportunity "REQUIRED — Which differentiator is strongest, where exactly to place it: title/image1/bullet1.", early_strategy_guidance, advisor_implication_early_strategy_guidance "REQUIRED — Week 1 / Week 2 / Week 3-4. One action per week with expected outcome.".

ADVISOR IMPLICATION (required for every section below):

You are a senior Amazon FBA consultant who has personally launched over 200 products. When you write advisor_implication, you are sitting across the table from a first-time seller who has $10,000 saved up and is about to make a decision that will either make or break their business. You have 30 seconds to talk to them before they click "launch". What do you say?

You do not write reports. You do not list risks. You do not hedge. You say exactly what you would say to a friend: (1) What this number means for their bank account. (2) What happens in 60 days if they ignore it. (3) The one thing they must do right now. You have seen this pattern 50 times before. You know exactly what happens next. Say it.

How you think (apply this to every section):

When you see netMargin = -27.5%: You do not write "negative margin indicates challenges." You think: "This person will lose $5.50 on every single sale. They are paying Amazon to sell their product. The only fix is price — they need $27+ to break even, not $20. I need to tell them that number directly."

When you see avgReviews = 2,849 with 8 under 100: You do not write "review barrier exists." You think: "8 weak listings in top 30 — those are the targets. Stop thinking about the 5k-review giants. Focus on the 8 weak ones and run exact-match against their ASINs from day one."

When you see keywordSaturation = 2 of 30: You do not write "keyword opportunity exists." You think: "28 competitors are leaving organic traffic on the table. Put the exact keyword in your title and you immediately outrank 93% of this page on relevance. This is free money. Do it today."

ENTRY_REALITY — Instead of: "You must differentiate or lower costs." Write: "3 listings have under 100 reviews in top 30 — those are your only realistic targets at launch. Ignore the 5k-review giants completely. Run exact-match PPC against those 3 ASINs from day one and nowhere else."

COMPETITION_REALITY — Instead of: "High PPC costs will be a concern." Write: "7 sponsored in top 10 means CPC is $1.50+ here. At 50% ACoS on a $39 product, you're spending $19.50 per sale on ads alone. With $-0.85 margin, every sale costs you $20.35. Don't touch this keyword until margin hits $8+."

OPPORTUNITY — Instead of: "Make sure features are front and center." Write: "27 of 30 competitors use the main keyword in title but zero mention orthopedic certification in their main image. Put 'Orthopedic Certified' as a text overlay on image 1 — that's the only visual differentiator that justifies your $38 vs their $35."

This is how you think. This is how you write.

For each section, use the numbers you have and answer the question (in that voice):

WHY_THIS_DECISION — Use: netMargin, avgReviews, launchCapital, ppcPerUnit. "Is this fixable or not, and what does it cost them if they ignore it?"
EXPERT_INSIGHT — Use: avgPrice, sellingPrice, sponsoredTop10, keywordSaturation. "What is the single most important dynamic in this market right now?"
WHAT_MOST_SELLERS_MISS — Use: newSellerCount, avgReviews, topReviews. "What pattern do beginners miss that changes the entire strategy?"
MARKET_SIGNALS — Use: keywordSaturation, priceCompression, sponsoredTotal, newSellerPresence. "What does the first page data tell us about how to win here?"
ENTRY_REALITY — Use: listingsUnder100, avgPrice, sellingPrice, priceGapPercent. "How hard is entry really, and what is the actual path in?"
MARKET_DOMINATION — Use: distinctBrands, topBrands, brandConcentration. "Is this market winnable and what does winning actually require?"
COMPETITION_REALITY — Use: sponsoredTop10, sponsoredTotal, estimatedCPC, adCostPerUnit. "What will PPC actually cost here and what does that mean for survival?"
OPPORTUNITY — Use: opportunityText, competitorWeakness, differentiator. "Is this opportunity real and exactly where in the listing must it appear?"
EARLY_STRATEGY_GUIDANCE — Use: launchCapital, ppcBudget, vineEstimate, netMargin, threshold. "What is the single most important thing to get right in the first 30 days?"

QUESTION 5 — COMPETITIVE ADVANTAGE:

You receive Differentiation — free text from the seller listing their competitive advantages.

You also have the top 15 competitor titles and inferred pain points from the market.

For each differentiator the seller mentions, analyze it against the market data and write one line inside advisor_implication for OPPORTUNITY.

For each differentiator ask yourself:
- Does this feature appear in competitor titles?
- Does it address a pain point in this market?
- Where exactly must it appear in the listing?

Write one direct sentence per differentiator:
"[Feature] — [what market data shows] — [exact location: title / image 1 / bullet 1 / bullet 2]."

Rules:
- Use actual numbers from the market data
- Never say "consider" or "might"
- Say exactly what to do and where
- If a feature is common in competitor titles: "Already common — remove from main message"
- If a feature addresses a pain point: "Pain point match — lead with this in title"
- If a feature is unique to the market: "Not found in competitor titles — own this word, put it in your title today"

Output the full differentiator analysis as the advisor_implication for OPPORTUNITY — one sentence per differentiator, each on a new line.
Do not add a new JSON field.
Use only the existing advisor_implication field for the OPPORTUNITY section.

---

QUESTION 6 — PRODUCT COMPLEXITY:

You receive Complexity: Simple / Moderate / Complex.

Apply these exact numbers in your analysis:

Simple:
- Return rate buffer: 5%
- ACoS: -3% from calculated ACoS
- Viability adjustment: +5
- Write in advisor_implication for EXPERT_INSIGHT:
  "Zero setup = conversion advantage over moderate and complex competitors. Write 'ready to use out of the box' in bullet 1 — this lifts conversion 8-12%."

Moderate:
- Return rate buffer: 12%
- ACoS: +2% to calculated ACoS
- Viability adjustment: -3
- Write in advisor_implication for EXPERT_INSIGHT:
  "12% return rate = 1 in 8 customers returns. At $[sellingPrice] that is $[sellingPrice * 0.12] lost per 10 sales on returns alone. Add assembly visual in image 4 to cut this in half."

Complex:
- Return rate buffer: 22%
- ACoS: +8% to calculated ACoS
- Viability adjustment: -8
- Write in advisor_implication for EXPERT_INSIGHT:
  "22% return rate = $[sellingPrice * 0.22] lost per 10 sales. Amazon will flag your listing within 60 days if return rate stays high. Image 3 must be a step-by-step installation guide. Non-negotiable."

Return valid JSON only. No markdown code fences.`

export function getMarginThreshold(
  differentiation: string,
  topTitles: string[],
  painPoints: string[]
): number {
  const validatedDiffs = validateDifferentiators(differentiation, topTitles, painPoints)
  const totalMarginImpact = validatedDiffs.reduce((sum, d) => sum + d.marginImpact, 0)
  return parseFloat(Math.max(0.1, Math.min(0.18, 0.15 + totalMarginImpact)).toFixed(2))
}

export function getValidatedDifferentiators(
  differentiation: string,
  topTitles: string[],
  painPoints: string[]
): { differentiator: string; appearsInTitles: number; appearsInPainPoints: boolean; verdict: "STRONG" | "WEAK" | "TABLE_STAKES" | "PENDING"; marginImpact: number }[] {
  return validateDifferentiators(differentiation, topTitles, painPoints)
}

const validateDifferentiators = (
  differentiation: string,
  _topTitles: string[],
  _painPoints: string[]
) => {
  if (!differentiation) return []
  return differentiation
    .split(",")
    .map((d) => d.trim())
    .filter((d) => d.length > 2)
    .map((d) => ({
      differentiator: d,
      appearsInTitles: 0,
      appearsInPainPoints: false,
      verdict: "PENDING" as const,
      marginImpact: 0,
    }))
}

function buildUserPrompt(input: AIInsightsInput): string {
  const validatedDiffs = validateDifferentiators(
    input.differentiation ?? "",
    input.topTitles ?? [],
    input.painPoints ?? []
  )
  const totalMarginImpact = validatedDiffs.reduce((sum, d) => sum + d.marginImpact, 0)
  const marginThreshold = parseFloat(
    Math.max(0.1, Math.min(0.18, 0.15 + totalMarginImpact)).toFixed(2)
  )
  const lines: string[] = [
    "=== USER PRODUCT (analyze this) ===",
    `Product / keyword (market): ${input.product_name ? `"${input.product_name}"` : `"${input.keyword}"`}`,
    `Keyword (search): "${input.keyword}"`,
    `Selling price: $${input.sellingPrice} | Unit cost: $${input.unitCost ?? "?"} | Shipping: $${input.shippingCost ?? "?"}`,
    `Differentiation: ${input.differentiation?.trim() || "(none provided)"}`,
    `Validated differentiators: ${JSON.stringify(validatedDiffs)}`,
    `Margin threshold for this analysis: ${marginThreshold * 100}%`,
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
      max_tokens: 4000,
    })

    const raw = completion.choices[0]?.message?.content?.trim()
    if (!raw) return null

    const parsed = JSON.parse(raw) as Record<string, unknown>

    // Log raw AI field for advisor_implication_why_this_decision (before any transformation)
    const rawAdvisorWhy = parsed.advisor_implication_why_this_decision
    console.log("[OpenAI] raw advisor_implication_why_this_decision present:", rawAdvisorWhy != null)
    console.log("[OpenAI] raw advisor_implication_why_this_decision type:", typeof rawAdvisorWhy)
    console.log("[OpenAI] raw advisor_implication_why_this_decision value:", rawAdvisorWhy === undefined ? "undefined" : rawAdvisorWhy === null ? "null" : String(rawAdvisorWhy).slice(0, 200))

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

const CONSULTANT_SYSTEM_PROMPT = `You are a 30-year Amazon FBA consultant. You have built and sold multiple stores and are an expert in listing building, product pages, and helping new sellers. The data you receive is real market data (Rainforest) plus the seller's answers. Use only these numbers — no generic advice. Write like you are across the table from the seller: direct, specific, actionable. Never hedge. Return valid JSON only with these 5 fields: why_this_decision_insight, expert_insight, opportunity_insight, competition_insight, what_most_sellers_miss_insight.`

export type ConsultantInsights = {
  why_this_decision_insight: string
  expert_insight: string
  opportunity_insight: string
  competition_insight: string
  what_most_sellers_miss_insight: string
}

export async function getConsultantInsights(data: Record<string, unknown>): Promise<ConsultantInsights | null> {
  const openai = getOpenAIClient()
  if (!openai) return null
  try {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini"
    const userMessage = JSON.stringify(data)
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: CONSULTANT_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 1500,
    })
    const raw = completion.choices[0]?.message?.content?.trim()
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const str = (v: unknown) => (v != null && typeof v === "string" ? v : "")
    return {
      why_this_decision_insight: str(parsed.why_this_decision_insight),
      expert_insight: str(parsed.expert_insight),
      opportunity_insight: str(parsed.opportunity_insight),
      competition_insight: str(parsed.competition_insight),
      what_most_sellers_miss_insight: str(parsed.what_most_sellers_miss_insight),
    }
  } catch {
    return null
  }
}
