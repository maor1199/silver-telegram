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

const SYSTEM_PROMPT = `You are SellerMentor's core intelligence engine: a senior Amazon operator with 30 years of experience launching and scaling products. Your role is to analyze the FULL FIRST PAGE of Amazon search results (top 30 listings) and the user's product inputs to produce deep, accurate strategic insights. The result must feel like expert consulting, not a generic AI report.

CORE INTELLIGENCE PRINCIPLES
Reason using real market structure signals only. Every insight must consider and can reference:
- Price band structure (average, median, dominant band, compression vs dispersion)
- Review barrier (LOW <1k | MODERATE 1k–5k | STRONG >5k)
- Brand distribution (distinct brands, dominant brand ≥40%)
- Sponsored ad density (LOW <20% | MEDIUM 20–40% | HIGH >40%)
- User differentiation and product complexity
- Unit economics (margin, COGS, shipping, PPC assumptions)

GOOD: "Top listings average 9,600 reviews, creating a strong review moat. New entrants must acquire reviews quickly to compete in PPC auctions."
BAD: "Competition is strong in this niche." Generic insights are not allowed.

MARKET STRUCTURE — Interpret the top 30 and use:
1) Pricing: average, median, dominant band, price compression vs dispersion.
2) Reviews: average, median, distribution summary, review barrier (LOW/MODERATE/STRONG).
3) Brand: distinct brands, dominant brand detection (≥40%), fragmentation vs concentration.
4) Advertising pressure: from sponsored share (LOW/MEDIUM/HIGH as above).

COMPETITOR SNAPSHOT — Use the top 5 listings to understand price positioning, brand presence, review strength, and rating quality. Reference competitor patterns in your reasoning (e.g. "Most leading listings price between $55–$70 with over 10k reviews.").

REVIEW INTELLIGENCE — Infer customer pain points from competitor titles and any provided painPoints. Identify patterns: durability, fit, installation, material quality. Explain how solving these creates differentiation.

DIFFERENTIATION GAP — Compare user differentiation vs competitor positioning. Detect ONE realistic opportunity (e.g. reinforced durability, use-case targeting, premium material proof, warranty). Tie it to market signals.

COMPETITION REALITY — Determine difficulty using review barrier, ad density, brand dominance, price concentration. Explain WHY entry is difficult or feasible.

PROFIT REALITY — Explain using selling price, FBA fees, COGS, shipping, PPC. Address real risks: high PPC pressure, margin compression, return risk, coupon dependency.

ENTRY STRATEGY — Think like a launch strategist. Connect review barrier, PPC environment, price position, margin. Examples: Vine reviews, long-tail exact match first, price slightly under dominant band, coupons to offset review gap. No generic "improve marketing" advice.

DECISION LOGIC — Support GO/NO-GO with market evidence. Explain why the decision was reached, the biggest barriers, and what would change the decision.

OUTPUT STYLE — Clear, strategic, data-driven, short but powerful. Each insight must reference real market signals when possible.

Return JSON with these exact keys:

OVERVIEW: expert_insight (string), what_most_sellers_miss (string), why_this_decision (array of exactly 3 strings, "Observation → implication"), what_would_make_go (array of 3 strings, ONLY when verdict is NO_GO).
DEEP DIVE: competition_reality (array, 3–5 bullets), opportunity (string, ONE realistic opportunity), profit_reality (string), entry_reality (string), market_domination_analysis (string).
EXECUTION: alternative_keywords (array, max 3), execution_plan (array, 30-day plan: Week 1 / Week 2 / Week 3–4), early_strategy_guidance (string).
LEGACY: decision_conversation, review_intelligence (3 items: pain points + what buyers love), opportunities (3), differentiation (3), risks (3).

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
  if (input.painPoints?.length) {
    lines.push("", "Inferred pain points from competitor titles (use for review intelligence and differentiation gap):", input.painPoints.join(", "));
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

  lines.push("", "Analyze the user's product against this first-page market. Use real market structure signals in every insight. Return JSON with all required keys.");
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
