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
  advertising_environment?: "low" | "medium" | "high";
};

/** Pricing structure from SERP (top 30) */
export type PricingStructureInput = {
  average_price: number;
  median_price: number;
  dominant_price_band: string;
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
  /** Top competitors for context (title, price, reviews, brand, sponsored) */
  topCompetitors?: { position: number; title: string; price: number; ratingsTotal: number; brand?: string; sponsored?: boolean }[];
  /** Pricing structure (avg, median, dominant band) from top 30 */
  pricing_structure?: PricingStructureInput;
  /** Review structure (avg, median, distribution) from top 30 */
  review_structure?: ReviewStructureInput;
  /** strong | moderate | lower — review barrier for this SERP */
  review_barrier?: "strong" | "moderate" | "lower";
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
};

const SYSTEM_PROMPT = `You are a senior Amazon product strategist with 30 years of experience launching products, running PPC campaigns, and analyzing marketplace competition. You analyze the real first-page market (top 30 listings) and the user's product inputs to produce strategic, data-grounded insights.

DATA YOU RECEIVE:
- User inputs: main keyword, selling price, unit cost, shipping cost, differentiation description, product complexity.
- Top 30 listings from Amazon first page for that keyword (organic + sponsored): titles, brands, prices, ratings, review counts, sponsored flag.
- Computed market structures: pricing (avg, median, dominant price band), review structure (avg, median, distribution), brand distribution, advertising pressure (sponsored ratio), review barrier (strong/moderate/lower), product-vs-market (price position, differentiation strength, product risk).

QUALITY RULES — insights MUST:
- Reference real market data from the 30 listings (e.g. "Top listings average 18k reviews", "Dominant band $30–50", "40% sponsored").
- Reference review barriers and price bands explicitly.
- Connect every point directly to the user's product (their price, differentiation, complexity, margin).
- Be concise but strategic; Amazon-specific. No generic advice.

GOOD example: "Top listings average 18k reviews — a strong social proof moat that requires aggressive Vine enrollment and PPC support."
BAD example: "Competition is strong so marketing is important."

Return JSON with these exact keys:

OVERVIEW (Decision layer):
- expert_insight (string): Real market reality and how it affects the user's product. Max 3 sentences. Cite top-30 data.
- what_most_sellers_miss (string): One hidden structural dynamic in the niche. One short paragraph.
- why_this_decision (array of exactly 3 strings): Exactly 3 bullets. Format each as "Observation → implication." Example: "Average reviews in top listings exceed 9,000 → new listings struggle to gain visibility."
- what_would_make_go (array of 3 strings, ONLY when verdict is NO_GO): Three conditions that would change NO-GO into GO. Short and specific.

DEEP DIVE (Market intelligence):
- competition_reality (array of strings): How listings actually compete (reviews, pricing, positioning). 3–5 bullets. Reference the 30 listings.
- opportunity (string): The single most realistic differentiation opportunity for the user's product. One short paragraph. One opportunity only.
- profit_reality (string): Whether the user's projected profit is realistic given market conditions. Reference margin and PPC. 2–3 sentences.
- entry_reality (string): What makes entering this niche difficult or feasible. 2–3 sentences.
- market_domination_analysis (string): Whether the niche is controlled by one brand or many. One short paragraph.

EXECUTION:
- alternative_keywords (array): Maximum 3 keyword phrases. Format: keyword only, or "keyword (est. CPC $X–$Y)" if you can infer from market.
- execution_plan (array): 30-day launch plan. Group into Week 1, Week 2, Week 3–4. Each item one short sentence. 4–6 items total.
- early_strategy_guidance (string): One short strategic recommendation. 1–2 sentences.

LEGACY (keep for compatibility):
- decision_conversation: Same as why_this_decision.
- review_intelligence: 3 items — pain points and what buyers love from competitor titles.
- opportunities: 3 items — product/positioning gaps.
- differentiation: 3 items — concrete ideas for this niche.
- risks: 3 items — key risks.

Return valid JSON only. No markdown code fences.`;

function buildUserPrompt(input: AIInsightsInput): string {
  const lines: string[] = [
    "=== USER PRODUCT (analyze this) ===",
    `Keyword (market): "${input.keyword}"`,
    `Target selling price: $${input.sellingPrice}`,
    `Unit cost (COGS): $${input.unitCost ?? "?"} | Shipping to FBA: $${input.shippingCost ?? "?"}`,
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
  ];

  if (input.pricing_structure) {
    lines.push(
      "",
      "Pricing structure (from top 30):",
      `- Average price: $${input.pricing_structure.average_price.toFixed(2)}, median: $${input.pricing_structure.median_price.toFixed(2)}, dominant band: ${input.pricing_structure.dominant_price_band}`
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
    lines.push("", `Review barrier (for this SERP): ${input.review_barrier} (strong = >5k avg, moderate = 1k–5k, lower = <1k).`);
  }
  if (input.market_snapshot) {
    lines.push(
      "",
      "Market snapshot:",
      `- Avg price: $${input.market_snapshot.avg_price.toFixed(2)}, avg reviews: ${input.market_snapshot.avg_reviews.toLocaleString()}`,
      `- Brand distribution: ${input.market_snapshot.brand_distribution}`,
      `- Advertising environment: ${input.market_snapshot.advertising_environment ?? input.market_snapshot.ad_presence}`
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
    lines.push(
      "",
      "Top 30 SERP sample (position, price, reviews, brand, sponsored, title):",
      ...input.topCompetitors.slice(0, 20).map(
        (c) =>
          `#${c.position} $${c.price.toFixed(2)} | ${c.ratingsTotal} reviews | ${c.brand ?? "—"} ${c.sponsored ? "sponsored" : "organic"} | ${(c.title || "").slice(0, 55)}…`
      )
    );
  }

  lines.push("", "Analyze the user's product against this first-page market. Return JSON with all required keys. Reference the top 30 listings, price bands, and review barrier in your insights.");
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
      entry_reality: toStr(parsed.entry_reality),
      why_this_decision: whyDecision.length >= 1 ? whyDecision : useWhy.slice(0, 3),
      market_domination_analysis: toStr(parsed.market_domination_analysis),
      early_strategy_guidance: toStr(parsed.early_strategy_guidance),
      honeymoon_roadmap: toArray(parsed.honeymoon_roadmap).slice(0, 8),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ OpenAI error:", message);
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
