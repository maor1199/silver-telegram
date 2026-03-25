import OpenAI from "openai";

function getOpenAIClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

/** Market snapshot passed to OpenAI for context */
export type MarketSnapshotInput = {
  avg_price: number;
  avg_reviews: number;
  brand_distribution: string;
  ad_presence: string;
  /** LOW <20% | MEDIUM 20–40% | HIGH >40% sponsored */
  advertising_environment?: "LOW" | "MEDIUM" | "HIGH";
};

/** Pricing structure from SERP (top 30) */
export type PricingStructureInput = {
  average_price: number;
  median_price: number;
  dominant_price_band: string;
  price_compression_vs_dispersion?: string;
};

/** Review structure from SERP (top 30) */
export type ReviewStructureInput = {
  average_reviews: number;
  median_reviews: number;
  review_distribution: string;
  distribution_summary: string;
};

/** Product-vs-market comparison for the analyst */
export type ProductVsMarketInput = {
  price_position: string;
  review_barrier: string;
  advertising_environment: string;
  differentiation_strength: string;
  product_risk: string;
};

export type AIInsightsInput = {
  keyword: string;
  sellingPrice: number;
  unitCost?: number;
  shippingCost?: number;
  profitAfterAds: number;
  verdict: "GO" | "NO_GO";
  /** The exact ACoS used in the profit calculation — use this in early_strategy_guidance, not a recalculated value */
  assumed_acos?: number;
  avgPrice: number;
  avgRating: number;
  avgReviews: number;
  dominantBrand: boolean;
  newSellersInTop10?: number;
  newSellersInTop20?: number;
  topTitles: string[];
  topPrices: number[];
  /** User's product differentiation / competitive advantage */
  differentiation?: string;
  /** Product complexity level */
  complexity?: string;
  /** Structured market snapshot */
  market_snapshot?: MarketSnapshotInput;
  /** Product vs market comparison */
  product_vs_market?: ProductVsMarketInput;
  /** Landed cost (COGS + shipping + buffers) */
  landed_cost?: number;
  /** Estimated margin % */
  estimated_margin?: number;
  /** Estimated ROI % */
  estimated_roi?: number;
  /** Top competitors for context (title, price, reviews, rating, brand, sponsored) */
  topCompetitors?: { position: number; title: string; price: number; ratingsTotal: number; rating?: number; brand?: string; sponsored?: boolean }[];
  /** Pricing structure (avg, median, dominant band) from top 30 */
  pricing_structure?: PricingStructureInput;
  /** Review structure (avg, median, distribution) from top 30 */
  review_structure?: ReviewStructureInput;
  /** STRONG >5k | MODERATE 1k–5k | LOW <1k */
  review_barrier?: "STRONG" | "MODERATE" | "LOW";
  /** Inferred pain points from competitor titles (for review intelligence & differentiation gap) */
  painPoints?: string[];
  /** Enriched market signals (full first page, up to 30 listings) */
  product_name?: string;
  review_structure_summary?: string;
  new_seller_presence?: "high" | "moderate" | "low";
  keyword_saturation_ratio?: string;
  price_compression?: string;
  brand_distribution_summary?: string;
  market_maturity_signal?: "emerging" | "growing" | "mature";
  /** Sponsored in top 10 and total (first page) */
  sponsored_top10_count?: number;
  sponsored_total_count?: number;
};

export type AIInsights = {
  review_intelligence: string[];
  opportunities: string[];
  differentiation: string[];
  risks: string[];
  alternative_keywords: string[];
  what_would_make_go?: string[];
  decision_conversation?: string[];
  execution_plan?: string[];
  /** New structured insights — fill analysis cards */
  expert_insight?: string;
  what_most_sellers_miss?: string;
  competition_reality?: string[];
  opportunity?: string;
  profit_reality?: string;
  entry_reality?: string;
  why_this_decision?: string[];
  market_domination_analysis?: string;
  early_strategy_guidance?: string;
  honeymoon_roadmap?: string[];
  /** Advisor implication per section: what this data means in money/time/risk and what to do (max 2 sentences, definitive, to "you") */
  advisor_implication_why_this_decision?: string;
  advisor_implication_expert_insight?: string;
  advisor_implication_what_most_sellers_miss?: string;
  advisor_implication_market_signals?: string;
  advisor_implication_entry_reality?: string;
  advisor_implication_market_domination_analysis?: string;
  advisor_implication_competition_reality?: string;
  advisor_implication_opportunity?: string;
  advisor_implication_early_strategy_guidance?: string;
};

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
} as const;

const SYSTEM_PROMPT = `You are a 30-year Amazon FBA consultant. You have built and sold multiple Amazon stores. You are an expert in listing building, product page optimization, PPC, advertising costs (ACoS, CPC), fees (referral, FBA), and guiding new sellers. You have deep knowledge of what actually sells on Amazon and what kills margins. You speak like a veteran advisor sitting across the table — direct, specific, no fluff.

You are speaking directly to your client — a new or intermediate seller who trusts you and is about to invest $5,000-$15,000.

You have in front of you real Rainforest market data (first-page listings, prices, reviews, sponsored density, keyword saturation, price compression, new seller presence, competitor titles, pain points) and the seller's own answers (price, COGS, differentiation, product complexity, target positioning, product type). Your job is to decode this data into the strongest possible insights — what a 30-year consultant would say after reading the same numbers.

Your job: Every section (Overview, Deep Dive, Execution) must be real consulting — grounded in these exact numbers and this seller's situation. Never give generic or vague advice. Never say "consider" or "might" without a concrete number or action. If the data says something is bad, say it. If there is a real opportunity, say exactly how to take it. Each tab should feel like a 1:1 consultation, not a template.

OVERVIEW STRATEGIC ENGINE — INFORMATION HIERARCHY AND MAPPING:
- Verdict (GO / NO_GO) is the anchor for all reasoning. There are only two verdicts — GO or NO_GO. Never write "Conditional GO" or "CONDITIONAL_GO" anywhere in your response.
- WHY THIS DECISION ("kill reason"): Must explain the risk-to-reward ratio based on net profit after ads vs PPC pressure. Always use DATA → INSIGHT → IMPLICATION and tie numbers to the ability to rank, convert and stay profitable (e.g. "Net profit after ads is $5.60 on a product that typically needs ~45% ACoS here → almost no room for error once coupons, returns and PPC inefficiency hit."). If verdict = NO_GO, you must explicitly state why the margin cannot realistically survive PPC and fees in this niche.
- MARKET REALITY: Analyze the battlefield. Focus on review moats and PPC saturation, and how customers actually choose in this niche. Use advanced operator language when justified (Review Moat, PPC Floor, Net Margin Erosion, Conversion Threshold, Conversion Death Spiral, Inventory Velocity) but only when backed by real numbers.
- WHAT MOST SELLERS MISS: Surface one hidden dynamic such as brand dominance or keyword saturation that creates an unfair advantage or barrier.
- CORE METRICS SNAPSHOT: All COGS, fees, ACoS and unit-economics math are the technical justification for the verdict and the above insights.

PRIORITY: Why This Decision, Market Reality (expert_insight), What Most Sellers Miss, and Recommended Action must be your strongest outputs. Decode the real Rainforest data (prices, review counts, sponsored slots, keyword in titles, margin after ads) together with the seller’s inputs (price, COGS, differentiation, positioning, product type) into one clear take per field. Use specific numbers. No filler.

For every section you write:

Rules:
- Every sentence must use actual numbers from this analysis.
- Format every reasoning chain as DATA → INSIGHT → IMPLICATION.
- Never hedge with "consider", "might", "could", "perhaps".
- Never write generic lines like "competition is tough" or "this niche is competitive". Instead, use operator language grounded in numbers: Review Moat, PPC Floor, Net Margin Erosion, Conversion Threshold, PPC Cannibalization.
- Speak in second person: "you", "your".
- If the market is bad — say it directly.
- If there is a real opportunity — say exactly how to take it.
- Your client is paying for your honest judgment — give it to them.

CORE RULES
- Use real market signals: review tiers, advertising pressure, price band, keyword saturation, brand structure, new seller presence, market maturity.
- Always combine market data (Rainforest + computed metrics) with the seller's own inputs (price, COGS, shipping, differentiation text, target positioning, product type).
- Mandatory data sources: avgReviews, review_structure_summary, sponsored_top10_count, newSellersInTop10 / newSellersInTop20, keyword_saturation_ratio, price_compression, brand_distribution_summary, calculated ACoS, profitAfterAds (unit profit after ads).
- DECISION RELEVANCE: Only include insights that clearly affect the final verdict (GO / CONDITIONAL_GO / NO_GO) through ranking ability, conversion strength, or sustainable profitability. If a point does not change the decision, omit it.
- CAUSALITY (CRITICAL): Always walk the causal chain when relevant: market signal → impact on ranking → impact on conversion → impact on PPC cost → impact on profit. Never stop at describing the market; always explain what it causes.
- NO NEUTRAL ANALYSIS: Every statement must implicitly or explicitly push toward GO, CONDITIONAL_GO, or NO_GO — no neutral commentary.
- USER REALITY INTEGRATION: Always connect market data to the user’s actual inputs: price vs market (and its conversion impact), differentiation text (ability to justify price and lift conversion), and cost structure (ability to survive PPC and fees).
- PROFIT PRESSURE: When estimated margin < 15% or profitAfterAds is low, explicitly state that profitability is at risk and tie it to PPC costs, ranking difficulty, and the verdict.
- RANKING ECONOMICS: Treat Amazon as a ranking-driven system. Whenever a factor affects ranking (reviews, CPC, sponsored density, keyword saturation, brand dominance), you must explain how that changes traffic and therefore profit.
- GOOD: "6 of the top 10 listings have over 1k reviews → strong social proof barrier for new entrants."
- BAD: "Competition is strong." Generic statements are not allowed.

DEEP DIVE — Strategic Risk/Reward Engine (convert Rainforest + user inputs into decisions, not description):
- MARKET SIGNALS (The Battlefield): Keep the raw metrics (avg price, avg reviews, avg rating, review_structure_summary, keyword_saturation_ratio, price_compression, brand_distribution_summary, sponsored_top10_count, sponsored_total_count, new_seller_presence). Then explain the Review Moat and Cost of Entry. Use operator language where appropriate (Review Moat, PPC Floor, Conversion Threshold). End with a 1–2 sentence "Market Snapshot" that summarizes competition level, review barrier and keyword saturation using real numbers (e.g. "Avg reviews around 1,850 with 6 sponsored in top 10 and high keyword saturation → Review Moat that turns this into a 'Locked Market' requiring a $15k–$20k launch budget just to buy initial relevance."). Finish with an explicit single-line Operator’s Verdict for this section.

- ENTRY REALITY (Differentiation Audit — CRITICAL): Stress-test the seller’s differentiation against real complaints and competitor features. Use pain points from review_structure_summary / negative review signals plus competitor titles. Answer:
  • Pain Point Alignment — does their differentiation directly solve a top-3 complaint in the niche?
  • Visual vs Textual — is the differentiator visible in a main image (CTR lift) or only in bullets/description (conversion-only lift)?
  • Value Verdict — can this differentiation realistically reduce CPC or only justify price after reviews?
  Use terms like Visual Differentiation vs Textual Differentiation, Newbie Tax, Conversion Threshold. End with one clear Operator’s Verdict line (e.g. "Operator’s Verdict — your differentiation is mostly textual and will not lower your initial CPC; expect to pay a Newbie Tax until social proof catches up.").

- COMPETITION REALITY (Tactical Landscape): Structure into three mini-blocks (you still return one competition_reality array, but conceptually cover all three):
  1) How competition works — use reviews, price_compression and sponsored density to describe how listings actually win and defend rank (e.g. "PPC Cannibalization detected — major brands are bidding on their own branded terms and generic terms, creating a PPC Floor of ~$X.XX/click.").
  2) Barriers to entry — describe Review Moats and Brand Dominance using avgReviews, review tiers, brand_distribution_summary.
  3) Where new sellers can break in — use newSellersInTop10 / newSellersInTop20 and weaker-review pockets to point to realistic lanes.
  Every bullet: DATA → INSIGHT → IMPLICATION about ranking, conversion and profitability. End the section with a single-line Operator’s Verdict summarizing whether a new seller has a realistic tactical path or faces a losing PPC war.

- OPPORTUNITY (Economic Viability of Differentiation): Cross-reference the seller’s differentiation with COGS, target price and market gaps. Ask: can they actually afford their differentiation at the price they want? Use terms like Margin Trap and Net Margin Erosion. Example reasoning: "To execute 'premium material', COGS at $6.00 on a $37 price puts you into a Margin Trap — you either need COGS ≤ $4.80 or a price closer to $44.99 to survive the PPC Floor." End with one clear actionable direction plus an Operator’s Verdict sentence on whether the differentiation is economically viable in this niche.

- PROFIT REALITY (Stress Test): Explain clearly: selling_price, manufacturing_cost (COGS), shipping, Amazon fees, calculated / estimated ACoS, net_profit_after_ads and estimated_margin. Calculate and reason around breakeven ACoS and Safety Margin. Use language like Net Margin Erosion and Conversion Death Spiral when small shocks (CPC spikes, return rates) flip profit to loss. Always end with a "Bottom line:" sentence plus an Operator’s Verdict on whether the current unit economics can survive realistic PPC and returns.

- LAUNCH CAPITAL (Velocity Plan): Connect inventory cost to the ad spend required to move it. Use inventory units, landed cost, expected ACoS and target rank velocity to reason about cash flow and Inventory Velocity. Call out when this is effectively a "Buy-to-Rank" strategy where 60%+ of capital goes into PPC and the seller risks running out of cash before a second order if page 1 is not reached within ~30 days. End with a one-line Operator’s Verdict that states whether their current capital is sufficient for a realistic launch path in this niche.

Return JSON with these exact keys (include advisor_implication for each section below):

OVERVIEW: expert_insight (string), what_most_sellers_miss (string), why_this_decision (array of exactly 3 strings, DATA → INSIGHT → IMPLICATION), what_would_make_go (array of 3 strings, ONLY when verdict is NO_GO).
DEEP DIVE: competition_reality (array, min 2), opportunity (string, one), profit_reality (string), entry_reality (string or array 2–3 bullets), market_domination_analysis (string).
EXECUTION: alternative_keywords (array, max 3), execution_plan (array, 30-day: Week 1 / Week 2 / Week 3–4), early_strategy_guidance (string).

CRITICAL KEYWORD RULE — alternative_keywords and any keywords mentioned inside execution_plan MUST be short natural Amazon search terms: 2–4 words maximum (e.g. "pilates kit", "resistance bands set", "home pilates equipment"). NEVER use full product titles or sentences as keywords. NEVER repeat the same keyword phrase with only "premium" or "best" appended — those are not real search terms.
LEGACY: decision_conversation, review_intelligence (3), opportunities (3), differentiation (3), risks (3).

JSON response schema (include these keys; advisor_implication fields are strings with the instructions below):
why_this_decision, advisor_implication_why_this_decision "REQUIRED — 2-3 sentences using actual numbers. What happens to their money in 60 days. End with one directive.", expert_insight, advisor_implication_expert_insight "REQUIRED — The one insight they could not see alone. Use a specific number.", what_most_sellers_miss, advisor_implication_what_most_sellers_miss "REQUIRED — Direct insight with actual numbers from this analysis.", advisor_implication_market_signals "REQUIRED — Direct insight with actual numbers from this analysis.", entry_reality, advisor_implication_entry_reality "REQUIRED — Direct insight with actual numbers from this analysis.", market_domination_analysis, advisor_implication_market_domination_analysis "REQUIRED — Direct insight with actual numbers from this analysis.", competition_reality, advisor_implication_competition_reality "REQUIRED — Name the 3-4 weak listings to target. Exact action to take against them.", opportunity, advisor_implication_opportunity "REQUIRED — Which differentiator is strongest, where exactly to place it: title/image1/bullet1.", early_strategy_guidance, advisor_implication_early_strategy_guidance "REQUIRED — Week 1 / Week 2 / Week 3-4. One action per week with expected outcome.".

ADVISOR IMPLICATION (required for every section below):

You are a 30-year Amazon FBA consultant with deep knowledge of product sales, advertising (PPC, ACoS, CPC), and costs (fees, margins). You have launched over 200 products. When you write advisor_implication, you are across the table from a seller who has real Rainforest data in front of you — decode it into the strongest possible take. (1) What this number means for their bank account. (2) What happens in 60 days if they ignore it. (3) The one thing they must do right now. Use the actual numbers from the data. No reports, no hedging. Say it like you have seen this pattern 50 times.

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

Return valid JSON only. No markdown code fences.`;

export function getMarginThreshold(
  differentiation: string,
  topTitles: string[],
  painPoints: string[]
): number {
  const validatedDiffs = validateDifferentiators(differentiation, topTitles, painPoints);
  const totalMarginImpact = validatedDiffs.reduce((sum, d) => sum + d.marginImpact, 0);
  return parseFloat(Math.max(0.1, Math.min(0.18, 0.15 + totalMarginImpact)).toFixed(2));
}

export function getValidatedDifferentiators(
  differentiation: string,
  topTitles: string[],
  painPoints: string[]
): { differentiator: string; appearsInTitles: number; appearsInPainPoints: boolean; verdict: "STRONG" | "WEAK" | "TABLE_STAKES" | "PENDING"; marginImpact: number }[] {
  return validateDifferentiators(differentiation, topTitles, painPoints);
}

const validateDifferentiators = (
  differentiation: string,
  topTitles: string[],
  painPoints: string[]
) => {
  if (!differentiation) return [];
  return differentiation
    .split(",")
    .map((d) => d.trim())
    .filter((d) => d.length > 2)
    .map((d) => {
      const dLower = d.toLowerCase();

      // How many competitor titles contain this differentiator word(s)?
      const appearsInTitles = topTitles.filter((t) =>
        dLower.split(" ").every((word) => t.toLowerCase().includes(word))
      ).length;

      // Does this differentiator address a known pain point?
      const appearsInPainPoints = painPoints.some((p) =>
        dLower.includes(p.toLowerCase()) || p.toLowerCase().includes(dLower)
      );

      // TABLE_STAKES: appears in 5+ competitor titles → already common, no edge
      // STRONG: addresses a pain point AND rare in titles → real differentiator
      // WEAK: doesn't address pain points and common in titles
      // UNIQUE: rare in titles but doesn't address a known pain point
      const verdict =
        appearsInTitles >= 5
          ? ("TABLE_STAKES" as const)
          : appearsInPainPoints && appearsInTitles <= 2
          ? ("STRONG" as const)
          : appearsInPainPoints
          ? ("STRONG" as const)
          : appearsInTitles <= 1
          ? ("UNIQUE" as const)
          : ("WEAK" as const);

      // Margin impact: STRONG differentiator → can support higher threshold (+1%)
      // TABLE_STAKES → actually lowers threshold (no edge, -1%)
      const marginImpact =
        verdict === "STRONG" ? 0.01 : verdict === "TABLE_STAKES" ? -0.01 : 0;

      return {
        differentiator: d,
        appearsInTitles,
        appearsInPainPoints,
        verdict,
        marginImpact,
      };
    });
};

function buildUserPrompt(input: AIInsightsInput): string {
  const validatedDiffs = validateDifferentiators(
    input.differentiation ?? "",
    input.topTitles ?? [],
    input.painPoints ?? []
  );
  const totalMarginImpact = validatedDiffs.reduce((sum, d) => sum + d.marginImpact, 0);
  const marginThreshold = parseFloat(
    Math.max(0.1, Math.min(0.18, 0.15 + totalMarginImpact)).toFixed(2)
  );
  const lines: string[] = [
    "=== USER PRODUCT (analyze this) ===",
    `Product / keyword (market): ${input.product_name ? `"${input.product_name}"` : `"${input.keyword}"`}`,
    `Keyword (search): "${input.keyword}"`,
    `Selling price: $${input.sellingPrice} | Unit cost: $${input.unitCost ?? "?"} | Shipping: $${input.shippingCost ?? "?"}`,
    `Differentiation: ${input.differentiation?.trim() || "(none provided)"}`,
    `Validated differentiators: ${JSON.stringify(validatedDiffs)}`,
    `Margin threshold for this analysis: ${marginThreshold * 100}%`,
    `Margin stress test: ${input.estimated_margin != null && input.estimated_margin >= marginThreshold * 100 ? `PASS — ${input.estimated_margin.toFixed(1)}% is ABOVE the ${(marginThreshold * 100).toFixed(0)}% threshold. Unit economics are viable.` : `FAIL — ${input.estimated_margin?.toFixed(1) ?? "N/A"}% is BELOW the ${(marginThreshold * 100).toFixed(0)}% threshold.`}`,
    `Complexity: ${input.complexity?.trim() || "not specified"}`,
    "",
    "=== UNIT ECONOMICS ===",
    `Profit after ads: $${input.profitAfterAds.toFixed(2)}/unit`,
    `Estimated margin: ${input.estimated_margin != null ? input.estimated_margin.toFixed(1) + "%" : "N/A"} | ROI: ${input.estimated_roi != null ? input.estimated_roi.toFixed(1) + "%" : "N/A"}`,
    `Landed cost: $${input.landed_cost != null ? input.landed_cost.toFixed(2) : "N/A"}`,
    `ACoS used in this calculation: ${input.assumed_acos != null ? (input.assumed_acos * 100).toFixed(1) + "%" : "N/A"} — this is the exact ACoS applied to compute profit after ads and margin above. Use ONLY this ACoS value in early_strategy_guidance. Do NOT recalculate or override it.`,
    "",
    "=== VERDICT ===",
    `Verdict: ${input.verdict}`,
    "",
    "=== MARKET — TOP 30 LISTINGS (first page, organic + sponsored) ===",
    `Avg price: $${input.avgPrice.toFixed(2)} | Avg reviews: ${input.avgReviews.toLocaleString()} | Avg rating: ${input.avgRating}★`,
    `Brand distribution: ${input.dominantBrand ? "one or few brands dominate" : "fragmented"}. New sellers in top 10: ${input.newSellersInTop10 ?? 0}, top 20: ${input.newSellersInTop20 ?? 0}.`,
  ];

  if (input.pricing_structure) {
    lines.push(
      "",
      "Pricing structure (from top 30):",
      `- Average: $${input.pricing_structure.average_price.toFixed(2)}, median: $${input.pricing_structure.median_price.toFixed(2)}, dominant band: ${input.pricing_structure.dominant_price_band}`,
      ...(input.pricing_structure.price_compression_vs_dispersion ? [`- Price structure: ${input.pricing_structure.price_compression_vs_dispersion}`] : [])
    );
  }
  if (input.review_structure) {
    lines.push(
      "",
      "Review structure (from top 30):",
      `- Average reviews: ${input.review_structure.average_reviews.toLocaleString()}, median: ${input.review_structure.median_reviews.toLocaleString()}`,
      `- Distribution: ${input.review_structure.review_distribution}. Summary: ${input.review_structure.distribution_summary}`
    );
  }
  if (input.review_barrier) {
    lines.push("", `Review barrier: ${input.review_barrier} (LOW <1k | MODERATE 1k–5k | STRONG >5k).`);
  }
  if (input.market_snapshot) {
    lines.push(
      "",
      "Market snapshot:",
      `- Avg price: $${input.market_snapshot.avg_price.toFixed(2)}, avg reviews: ${input.market_snapshot.avg_reviews.toLocaleString()}`,
      `- Brand distribution: ${input.market_snapshot.brand_distribution}`,
      `- Advertising pressure: ${input.market_snapshot.advertising_environment ?? input.market_snapshot.ad_presence} (LOW <20% | MEDIUM 20–40% | HIGH >40% sponsored)`
    );
  }
  if (input.review_structure_summary) {
    lines.push("", "Review structure summary (full first page, up to 30 listings):", input.review_structure_summary);
  }
  if (input.new_seller_presence) {
    lines.push("", "New seller presence (listings under 200 reviews):", input.new_seller_presence);
  }
  if (input.keyword_saturation_ratio) {
    lines.push("", "Keyword saturation:", input.keyword_saturation_ratio);
  }
  if (input.price_compression) {
    lines.push("", "Price compression:", input.price_compression);
  }
  if (input.brand_distribution_summary) {
    lines.push("", "Brand distribution:", input.brand_distribution_summary);
  }
  if (input.market_maturity_signal) {
    lines.push("", "Market maturity signal:", input.market_maturity_signal);
  }
  if (input.sponsored_top10_count != null || input.sponsored_total_count != null) {
    lines.push(
      "",
      "Sponsored density:",
      `Top 10: ${input.sponsored_top10_count ?? "—"} sponsored | First page total: ${input.sponsored_total_count ?? "—"} sponsored`
    );
  }
  if (input.painPoints?.length) {
    lines.push(
      "",
      "Inferred signals from competitor titles (NOT from buyer reviews — these are keywords that appear in competitor listing titles, used as proxy indicators for what the market emphasizes):",
      input.painPoints.join(", "),
      "IMPORTANT: Do NOT present these as confirmed buyer complaints or negative review themes. Use them only as weak market signals when no stronger data is available."
    );
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
    );
  }

  lines.push(
    "",
    "Top competitor titles (use for pain points and positioning):",
    ...(input.topTitles.slice(0, 15).map((t, i) => `${i + 1}. ${t}`) || []),
    "",
    "Top prices (first page):",
    (input.topPrices.length ? input.topPrices.slice(0, 10).map((p) => "$" + p).join(", ") : "N/A")
  );

  if (input.topCompetitors?.length) {
    const top5 = input.topCompetitors.slice(0, 5);
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
    );
  }

  lines.push(
    "",
    "This data represents the FULL first page of Amazon results (up to 30 listings), not just the top 10. Analyze the user's product against it. Use real market structure signals in every insight. Return JSON with all required keys."
  );
  return lines.join("\n");
}

export async function getAIInsights(input: AIInsightsInput): Promise<AIInsights | null> {
  const openai = getOpenAIClient();
  if (!openai) {
    console.warn("⚠️ OPENAI_API_KEY not set; skipping AI insights");
    return null;
  }

  try {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 4000,
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Record<string, unknown>;

    const toArray = (v: unknown): string[] => {
      if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean);
      if (typeof v === "string") return [v];
      return [];
    };
    const toStr = (v: unknown): string | undefined => (v != null && typeof v === "string" ? v : undefined);
    const entryRealityRaw = parsed.entry_reality;
    const entry_reality =
      Array.isArray(entryRealityRaw)
        ? entryRealityRaw.map((x) => String(x)).filter(Boolean).join("\n")
        : toStr(entryRealityRaw);

    const whyDecision = toArray(parsed.why_this_decision).slice(0, 3);
    const decisionConversation = toArray(parsed.decision_conversation);
    const useWhy = whyDecision.length >= 1 ? whyDecision : decisionConversation.slice(0, 5);

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
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ OpenAI error:", message);
    return null;
  }
}

const CONSULTANT_SYSTEM_PROMPT = `You are a 30-year Amazon FBA consultant. You have built and sold multiple stores. You have deep knowledge of selling products on Amazon, advertising (PPC, ACoS, CPC), and costs (fees, margins, launch capital). The input you receive is real Rainforest market data (prices, reviews, sponsored density, keyword saturation, top titles, pain points, etc.) plus the seller's answers (price, COGS, differentiation). Your job: decode this data into the strongest possible consultant insights. Use only these numbers — no generic advice. Write like you are across the table from the seller: direct, specific, actionable. Never hedge.

why_this_decision_insight (Primary Reason): At least 1.5 lines. One clear conclusion from the data: why this verdict, what it means for their money in the next 60 days, one directive. Use actual numbers (margin, ad cost, review barrier, etc.). No hedging.

expert_insight: The single strongest insight from the Rainforest data — what only a 30-year consultant would say. Use specific numbers (avg price, review tiers, sponsored count, keyword saturation). Decode what it means for their listing and ad spend. 2–3 sentences.

what_most_sellers_miss_insight: Decode the data into what beginners miss — e.g. weak listings in top 10, keyword gap in titles, price band. Use numbers. 2–3 sentences. No generic "sellers underestimate competition."

opportunity_insight and competition_insight: Same standard — decode the data, use numbers, one strong take each.

Return valid JSON only with these 5 fields: why_this_decision_insight, expert_insight, opportunity_insight, competition_insight, what_most_sellers_miss_insight.`;

export type ConsultantInsights = {
  why_this_decision_insight: string;
  expert_insight: string;
  opportunity_insight: string;
  competition_insight: string;
  what_most_sellers_miss_insight: string;
};

export async function getConsultantInsights(data: Record<string, unknown>): Promise<ConsultantInsights | null> {
  const openai = getOpenAIClient();
  if (!openai) return null;
  try {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const userMessage = JSON.stringify(data);
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: CONSULTANT_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 1500,
    });
    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const str = (v: unknown) => (v != null && typeof v === "string" ? v : "");
    return {
      why_this_decision_insight: str(parsed.why_this_decision_insight),
      expert_insight: str(parsed.expert_insight),
      opportunity_insight: str(parsed.opportunity_insight),
      competition_insight: str(parsed.competition_insight),
      what_most_sellers_miss_insight: str(parsed.what_most_sellers_miss_insight),
    };
  } catch {
    return null;
  }
}

/** Generate 2 punchy, SEO-optimized marketing sentences from Scene + Highlight (and optional narrative for A+). */
export async function generateSeoCopyForImage(options: {
  scene: string;
  highlight: string;
  narrative?: string;
}): Promise<string> {
  const openai = getOpenAIClient();
  if (!openai) {
    return [options.scene || "Professional product presentation.", options.highlight ? `Highlight: ${options.highlight}.` : "Designed for clarity and impact."].join(" ");
  }
  try {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const userPrompt = `Scene/context: ${(options.scene || "").trim() || "product image"}. Feature to highlight: ${(options.highlight || "").trim() || "key benefit"}.${options.narrative ? ` Narrative: ${options.narrative.trim()}.` : ""}

Write exactly two short, punchy, SEO-friendly marketing sentences for this image (e.g. for Amazon listing or A+ content). No bullet points, no labels—just 2 sentences. Output plain text only, no JSON.`;
    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.6,
      max_tokens: 120,
    });
    const raw = completion.choices[0]?.message?.content?.trim();
    if (raw) return raw.replace(/\n+/g, " ").slice(0, 400);
  } catch (err: unknown) {
    console.warn("SEO copy generation failed:", err instanceof Error ? err.message : err);
  }
  return [options.scene || "Professional product presentation.", options.highlight ? `Highlight: ${options.highlight}.` : "Designed for clarity and impact."].join(" ");
}
