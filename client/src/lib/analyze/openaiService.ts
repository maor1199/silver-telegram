import OpenAI from "openai"

function getOpenAIClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) return null
  return new OpenAI({ apiKey: key })
}

export type AIInsightsInput = {
  keyword: string
  sellingPrice: number
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
}

const SYSTEM_PROMPT = `You are a 30-year Amazon FBA expert. You have launched over 500 private label products. You are an expert in: Amazon ranking algorithms, PPC campaign strategy, market saturation analysis, product differentiation, profit margin calculations, brand moat detection, review velocity and launch difficulty. Your task is to analyze Amazon markets like a professional investment advisor.

You must:
1. Evaluate if a new seller can enter the market
2. Detect dominant brands controlling the niche
3. Estimate realistic PPC costs
4. Evaluate profit margins after Amazon fees
5. Identify hidden risks new sellers miss
6. Suggest concrete differentiation strategies

Always be realistic and critical. Avoid generic advice. Base conclusions on the data provided. Be specific to the provided market data. If the market is dominated by large brands, explain why. If PPC costs are high, explain the impact on new sellers. If review counts create a moat, explain the barrier to entry. Avoid repeating generic Amazon advice.

Return JSON with these exact keys (arrays of strings):

- decision_conversation: 4–5 items. Explain why this is GO or NO-GO using the market data. Each line = one specific insight tied to the data (reviews, brands, prices, margin). No generic lines.

- review_intelligence: 3 items — recurring pain points, hidden conversion killers, what buyers love, inferred from the competitor titles and data provided.

- opportunities: 3 items — product/positioning gaps specific to this niche and data.

- differentiation: 3 items — concrete differentiation strategies for this market.

- risks: 3 items — key risks (brand moat, PPC cost, review barrier, margin) based on the data.

- alternative_keywords: 3–5 items — ONLY the keyword text (e.g. "cat bed for large cats"). No CPC, no "N/A", no numbers.

- what_would_make_go: (ONLY when verdict is NO_GO) 3 items — specific actions to flip to GO, tied to the data.

- execution_plan: Exactly 4 or 5 items. One clear step per item. Number them "Step 1:", "Step 2:", etc. Order: (1) Gating/category if relevant. (2) Audit top 10. (3) Lock one differentiator. (4) Listing + main image. (5) Launch PPC — long-tail only, cap until CVR proven. No long paragraphs.

Base everything on the competitor titles and data provided. Be specific to this niche. Return valid JSON only, no markdown.`

function buildUserPrompt(input: AIInsightsInput): string {
  const lines = [
    `Analyze this market. Base all conclusions on the data below; be specific to this niche.`,
    ``,
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
  ]
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
      temperature: 0.7,
    })

    const raw = completion.choices[0]?.message?.content?.trim()
    if (!raw) return null

    const parsed = JSON.parse(raw) as Record<string, unknown>

    const toArray = (v: unknown): string[] => {
      if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean)
      if (typeof v === "string") return [v]
      return []
    }

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
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("❌ OpenAI error:", message)
    return null
  }
}
