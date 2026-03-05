import OpenAI from "openai";

function getOpenAIClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

export type AIInsightsInput = {
  keyword: string;
  sellingPrice: number;
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
};

const SYSTEM_PROMPT = `You are AMZ Mentor AI — a real Amazon FBA operator with 30+ years in the business. You've built and sold multiple Amazon brands (7–8 figure exits), launched hundreds of SKUs, and know what makes a GO vs NO-GO from the gut. You speak as the expert in the room: direct, no fluff, like a mentor who's been there. Your insights are the main value — they must feel personal and experience-based.

Return JSON with these exact keys (arrays of strings):

- decision_conversation: 4–5 items. THIS IS CRITICAL. Write as the expert explaining why this is GO or NO-GO. Each line = one sharp insight from YOUR experience. Be the 30-year operator, not a generic analyst.

- review_intelligence: 3 items — recurring pain points, hidden conversion killers, what buyers love (from competitor titles).

- opportunities: 3 items — product/positioning gaps.

- differentiation: 3 items — concrete ideas for this niche.

- risks: 3 items — key risks.

- alternative_keywords: 3–5 items — ONLY the keyword text (e.g. "cat bed for large cats"). No CPC, no "N/A", no numbers.

- what_would_make_go: (ONLY when verdict is NO_GO) 3 items — specific actions to flip to GO.

- execution_plan: Exactly 4 or 5 items. Each item = ONE clear step, one short sentence. Number them "Step 1:", "Step 2:", etc. Order: (1) Gating/category if relevant. (2) Audit top 10. (3) Lock one differentiator. (4) Listing + main image. (5) Launch PPC — long-tail only, cap until CVR proven. No long paragraphs.

Base everything on the competitor titles and data provided. Be specific to this niche. Return valid JSON only, no markdown.`;

function buildUserPrompt(input: AIInsightsInput): string {
  const lines = [
    `Keyword: "${input.keyword}"`,
    `Seller's price: $${input.sellingPrice} | Market avg: $${input.avgPrice.toFixed(2)}`,
    `Profit after ads: $${input.profitAfterAds.toFixed(2)}`,
    `Verdict: ${input.verdict}`,
    `Market: avg ${input.avgReviews} reviews, ${input.avgRating}★ rating, ${input.dominantBrand ? "dominant brands" : "no dominant brands"}. New sellers (≤100 reviews): ${input.newSellersInTop10 ?? 0} in top 10, ${input.newSellersInTop20 ?? 0} in top 20.`,
    ``,
    `Top competitor titles (analyze for pain points & positioning):`,
    ...input.topTitles.slice(0, 10).map((t, i) => `${i + 1}. ${t}`),
    ``,
    `Top prices: ${input.topPrices.length ? input.topPrices.slice(0, 5).map((p) => "$" + p).join(", ") : "N/A"}`,
    ``,
    `Return JSON with: decision_conversation, review_intelligence, opportunities, differentiation, risks, alternative_keywords, execution_plan${input.verdict === "NO_GO" ? ", what_would_make_go" : ""}`,
  ];
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
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Record<string, unknown>;

    const toArray = (v: unknown): string[] => {
      if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean);
      if (typeof v === "string") return [v];
      return [];
    };

    return {
      decision_conversation: toArray(parsed.decision_conversation).slice(0, 5),
      review_intelligence: toArray(parsed.review_intelligence).slice(0, 3),
      opportunities: toArray(parsed.opportunities).slice(0, 3),
      differentiation: toArray(parsed.differentiation).slice(0, 3),
      risks: toArray(parsed.risks).slice(0, 3),
      alternative_keywords: toArray(parsed.alternative_keywords).slice(0, 5),
      what_would_make_go:
        input.verdict === "NO_GO"
          ? toArray(parsed.what_would_make_go).slice(0, 3)
          : undefined,
      execution_plan: toArray(parsed.execution_plan).slice(0, 6),
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
