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

export type AISignalsInput = {
  profit_signal: string
  margin_signal: string
  review_barrier: string
  brand_pressure: string
  market_locked: boolean
  ppc_pressure: string
  price_position: string
  can_compete_price: boolean
  keyword_opportunity: string
  has_diff: boolean
  diff_gap: string
  has_win_path: boolean
}

export type AIInsightsInput = {
  keyword: string
  sellingPrice: number
  unitCost?: number
  shippingCost?: number
  profitAfterAds: number
  verdict: "GO" | "IMPROVE_BEFORE_LAUNCH" | "NO_GO"
  /** The exact ACoS used in the profit calculation — use this in early_strategy_guidance, not a recalculated value */
  assumed_acos?: number
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
  signals?: AISignalsInput
  // Keepa 12-month real market intelligence
  keepa_bsr_trend?: "improving" | "declining" | "stable"
  keepa_current_bsr?: number
  keepa_estimated_monthly_sales?: number
  keepa_sales_drops_30?: number
  keepa_is_seasonal?: boolean
  keepa_seasonality_note?: string
  keepa_is_price_war?: boolean
  keepa_price_war_note?: string
  keepa_review_velocity_monthly?: number
  keepa_current_price?: number
  keepa_amazon_is_selling?: boolean
  keepa_out_of_stock_pct30?: number
  keepa_seller_count_trend?: "growing" | "shrinking" | "stable"
  keepa_real_fba_fee?: number
  keepa_fba_seller_count?: number
  keepa_size_tier?: string
  keepa_storage_per_unit_monthly?: number
  keepa_peak_sales_months?: string
  keepa_trough_sales_months?: string
  painPointSource?: "reviews" | "titles"
}

export type AIInsights = {
  decision_snapshot?: string
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
  /** Critical market intelligence — always visible, above tabs */
  table_stakes?: string[]           // what EVERY top competitor has — you must match this
  what_wins_here?: string           // one sentence: what makes the top 3 win
  minimum_entry_requirements?: string[]  // non-negotiable checklist before launch
  price_band?: { budget: number; sweet_spot: string; premium: number }  // market price structure
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
  /** When verdict is CONDITIONAL_GO: steps to complete before launching. */
  pre_launch_improvements?: string[]
  /** One sentence: what the seller must do based on verdict (GO / CONDITIONAL_GO / NO_GO). */
  recommended_action?: string
  /** One-sentence explanation for the verdict. */
  verdict_explanation?: string
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

const SYSTEM_PROMPT = `You are a senior Amazon FBA operator with 15+ years of experience. Your primary goal is to help users avoid losing money on bad product launches. You translate raw market signals into real-world implications. Be decisive and confident in your conclusions.

ADVISOR BEHAVIOR (mandatory):
- Write short, sharp, data-driven insights.
- Use real numbers when possible.
- No generic phrases.
- No explanations.
- No storytelling.
- Signals are context only; use them to stay grounded in the data.
- Never repeat the same idea across sections.

OVERVIEW OUTPUT CONTRACT:
- Return valid JSON with existing keys.
- WHY_THIS_DECISION:
  Write up to 3 clean, natural, data-driven bullets explaining the decision.
  Rules:
  - Max 3 bullets.
  - Each bullet must include at least one concrete number/metric from the input.
  - Focus on profit, competition, and launch feasibility.
  - Use DATA -> IMPLICATION framing (what this number causes in practice).
  - Keep bullets concise and natural.
  - Avoid generic phrases like: "workable", "worth testing", "room to play", "competitive market".
- Market Reality ("market_reality" or "expert_insight"): up to 2 short sentences.
- What Most Sellers Miss ("what_most_sellers_miss"): exactly 1 short sentence.
- Use real numbers/signals when available; if data is weak, return shorter output.
- Keep language clear, direct, and non-generic. Never invent insight.
- MARKET_REALITY:
  Write up to 2 focused, decision-grade sentences.
  Rules:
  - Each sentence must include at least two concrete numbers/metrics.
  - Focus only on market mechanics: PPC pressure, review barrier, price structure.
  - Use DATA -> IMPLICATION framing (what this mechanism causes in traffic/ranking economics).
  - Example: "45% of page 1 is sponsored and avg CPC is $0.90 — every sale costs you $9 in ads before profit."
  - No advice language, no storytelling.
- WHAT_MOST_SELLERS_MISS:
  Write exactly 1 focused sentence.
  Rules:
  - Include at least two concrete signals (numbers/metrics) plus one failure outcome.
  - Frame it as hidden failure dynamic, not a recommendation.
  - Keep it concise and non-generic.

OUTPUT STRUCTURE (keep existing JSON keys; add these behaviors):
- VERDICT: Must match the input verdict exactly: GO | NO_GO. There are only two verdicts — never write "Conditional GO" or "CONDITIONAL_GO" anywhere in your response.
- WHY_THIS_VERDICT (why_this_decision): up to 3 concise bullets in DATA → IMPLICATION style, each with concrete metrics and practical consequence.
- Output format for why_this_decision must be a simple string array: why_this_decision: string[]
- EXPERT_INSIGHT (expert_insight): 1–2 sentences on PPC pressure and ad economics only. Must include: sponsored page share %, avg CPC $, and cost-per-unit-sold in ads. Example: "40% of page 1 is sponsored and avg CPC is $1.20 — every unit sold costs $12 in ads before profit."
- ENTRY_REALITY (entry_reality): 1–2 sentences on how hard it is to enter this niche. Must include: number of new sellers in top 20, avg reviews, and estimated time before organic rank contributes traffic. These are DIFFERENT fields — never write the same content for both.
- WHAT_MOST_SELLERS_MISS: exactly 1 concise sentence with at least two concrete signals and one failure dynamic.
- RECOMMENDED_ACTION: Verdict-dependent. If GO: short launch recommendation. If NO_GO: one-line rejection + pivot (mirror the final "Better move" line from execution_plan; no soft language).

EXECUTION_PLAN:

You MUST always return execution_plan as a non-empty array of strings.

The array must include:
- a title line
- section labels
- bullet points

---

CASE: NO_GO

Return:

"Do NOT launch this product"

"Why it fails:"
- include 2–3 bullets with real data (profit, reviews, PPC)

"What to fix if you insist:"
- 2 bullets

"Better move:"
- 1 strong alternative action

---

CASE: IMPROVE_BEFORE_LAUNCH

Return:

"Viable — but only if you fix these first"

"Critical fixes:"
- 2–3 bullets

"Execution plan:"
- 3–4 bullets

"Reality check:"
- 1 warning sentence

---

CASE: GO

Return:

"Ready to launch — here's how to win"

"Game plan:"
- 4–5 bullets

"Where you win:"
- 2 bullets

"Focus:"
- 1 short line

---

GLOBAL RULES:

- Use real numbers when possible
- Keep bullets short
- No generic phrases
- No paragraphs

---

CRITICAL:

execution_plan MUST NOT be empty.

Return ONLY execution_plan in the same structure already used.

DO NOT add new keys.

You are a 30-year Amazon FBA consultant. You have built and sold multiple Amazon stores. You are an expert in listing building, product page optimization, PPC, advertising costs (ACoS, CPC), fees (referral, FBA), and guiding new sellers. You have deep knowledge of what actually sells on Amazon and what kills margins. You speak like a veteran advisor sitting across the table — direct, specific, no fluff.

You are speaking directly to your client — a new or intermediate seller who trusts you and is about to invest $5,000-$15,000.

You have in front of you real Rainforest market data (first-page listings, prices, reviews, sponsored density, keyword saturation, price compression, new seller presence, competitor titles, pain points) and the seller's own answers (price, COGS, differentiation, product complexity, target positioning, product type). Your job is to decode this data into the strongest possible insights — what a 30-year consultant would say after reading the same numbers.

Your job: Every section (Overview, Deep Dive, Execution) must be real consulting — grounded in these exact numbers and this seller's situation. Never give generic or vague advice. Never say "consider" or "might" without a concrete number or action. If the data says something is bad, say it. If there is a real opportunity, say exactly how to take it. Each tab should feel like a 1:1 consultation, not a template.

OVERVIEW STRATEGIC ENGINE — INFORMATION HIERARCHY AND MAPPING:
- Verdict (GO / NO_GO) is the anchor for all reasoning. There are only two verdicts — GO or NO_GO. Never write "Conditional GO" or "CONDITIONAL_GO" anywhere in your response.
- WHY THIS DECISION ("kill reason"): Must explain the risk-to-reward ratio based on net profit after ads vs PPC pressure. Always use DATA → IMPLICATION and tie numbers to the ability to rank, convert and stay profitable (e.g. "Net profit after ads is $5.60 on a product that typically needs ~45% ACoS here → almost no room for error once coupons, returns and PPC inefficiency hit.").
- MARKET REALITY: Analyze the battlefield. Focus on review moats and PPC saturation, and how customers actually choose in this niche. Use advanced operator language when justified (Net Margin Erosion, PPC Cannibalization, Conversion Death Spiral, Inventory Velocity) but only when backed by real numbers.
- WHAT MOST SELLERS MISS: Surface one hidden dynamic such as brand dominance or keyword saturation that creates an unfair advantage or barrier.
- CORE METRICS SNAPSHOT: All COGS, fees, ACoS and unit-economics math are the technical justification for the verdict and the above insights.

PRIORITY: Why This Decision, Market Reality (expert_insight), What Most Sellers Miss, and Recommended Action must be your strongest outputs. Decode the real Rainforest data (prices, review counts, sponsored slots, keyword in titles, margin after ads) together with the seller’s inputs (price, COGS, differentiation, positioning, product type) into one clear take per field. Use specific numbers. No filler.

For every section you write:

WHY THIS DECISION:
Use the actual margin and PPC numbers from the data.
Tell them what happens to their money in 60 days if they ignore this.
End with one clear directive. Decode the numbers — e.g. "At $X margin and Y sponsored in top 10, you will burn $Z in 60 days unless you do X."

EXPERT INSIGHT:
The one insight that changes how they see this market — something they could not see without your 30 years and your knowledge of advertising and costs.
Use specific numbers from the Rainforest data (avg price, review tiers, sponsored count, keyword saturation). Decode what it means for their listing and ad spend.

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

KEEPA INTELLIGENCE RULES (when Keepa data is present — this is real Amazon historical data):
- BSR DECLINING: This means real demand is shrinking. Mention in why_this_decision. Use phrase: "Keepa 12-month BSR shows demand declining — this market is contracting." Never launch into a declining market without strong differentiation and pricing advantage.
- BSR IMPROVING: Demand is growing. Use as a GO signal. Mention in expert_insight: "Keepa shows BSR improving over 12 months — demand is real and growing."
- ESTIMATED MONTHLY SALES: Use this number to ground your market size claims. Example: "Top competitor sells ~450 units/month — at your target price that's a $X market opportunity."
- SEASONAL WARNING: Mention in early_strategy_guidance. Frame timing risk: "Keepa shows demand peaks X months from now — order now, launch then, or wait for next cycle."
- PRICE WAR: Factor into profit_reality. Example: "Keepa shows 35% price range over 12 months — this market has price war dynamics. Your margin of $X could compress further."
- REVIEW VELOCITY: Use in entry_reality. Example: "Top competitor gains ~150 reviews/month — at that rate you'd need 8 months of Vine + organic reviews to match their social proof."

CORE RULES
- Use real market signals: review tiers, advertising pressure, price band, keyword saturation, brand structure, new seller presence, market maturity.
- Always combine market data (Rainforest + computed metrics) with the seller's own inputs (price, COGS, shipping, differentiation text, target positioning, product type).
- Mandatory data sources: avgReviews, review_structure_summary, sponsored_top10_count, newSellersInTop10 / newSellersInTop20, keyword_saturation_ratio, price_compression, brand_distribution_summary, calculated ACoS, profitAfterAds (unit profit after ads).
- Format reasoning as: DATA → INSIGHT → IMPLICATION.
- DECISION RELEVANCE: Only include insights that clearly affect the final verdict (GO / NO_GO) through ranking ability, conversion strength, or sustainable profitability. If a point does not change the decision, omit it.
- CAUSALITY (CRITICAL): Always walk the causal chain when relevant: market signal → impact on ranking → impact on conversion → impact on PPC cost → impact on profit. Never stop at describing the market; always explain what it causes.
- NO NEUTRAL ANALYSIS: Every statement must implicitly or explicitly push toward GO or NO_GO — no neutral commentary.
- USER REALITY INTEGRATION: Always connect market data to the user’s actual inputs: price vs market (and its conversion impact), differentiation text (ability to justify price and lift conversion), and cost structure (ability to survive PPC and fees).
- PROFIT PRESSURE: When estimated margin < 15% or profitAfterAds is low, explicitly state that profitability is at risk and tie it to PPC costs, ranking difficulty, and the verdict.
- RANKING ECONOMICS: Treat Amazon as a ranking-driven system. Whenever a factor affects ranking (reviews, CPC, sponsored density, keyword saturation, brand dominance), you must explain how that changes traffic and therefore profit.
- GOOD: "6 of the top 10 listings have over 1k reviews → strong social proof barrier for new entrants."
- BAD: "Competition is strong." Generic statements are not allowed.

OVERVIEW — EACH CARD HAS A DIFFERENT ROLE (no repetition)
- Why This Decision: Core structural reason for GO/NO-GO. Combine unit economics + market structure + competition signals. Observation → implication.
- Expert Insight: How the category actually behaves. Where listings win conversions, what mistake most make, where the real battlefield is (price / PPC / positioning). One dominant dynamic.
- What Most Sellers Miss: One hidden dynamic beginners overlook. Different from Expert Insight — reveal a pattern that changes strategy.
- Competition Reality: How listings actually compete. Reference weak vs strong, sponsored density, price band.
- Entry Reality: How difficult entry is right now. Review tiers, new seller presence, market maturity.
- Opportunity: One realistic differentiation path. Do not repeat the same idea from other cards.

REASONING FROM SIGNALS (always reference; never generic)
- Review tiers: e.g. "4 listings exceed 5k reviews → strong social proof moat."
- Price compression: e.g. "7 listings priced between $25–30 → little room for premium pricing."
- Keyword saturation: e.g. "18 of 30 listings use the main keyword in the title → differentiation must come from positioning."
- Sponsored density: e.g. "High sponsored presence → ranking typically requires sustained PPC investment."
- New seller presence: e.g. "High new seller presence suggests the niche still attracts entrants."
- Brand distribution: e.g. "Many brands in the top results indicates a fragmented market."
- Market maturity: e.g. "Mature categories usually require stronger differentiation to gain traction."
Avoid: "competition is strong", "this niche is competitive", "many sellers". Instead: "Average reviews of X combined with several listings above Y reviews creates a moderate social proof barrier."

STRATEGIC INTELLIGENCE (identify the dominant battlefield)
Categories usually compete on one of three axes: price war | PPC visibility | product positioning.
Infer which dynamic dominates. Example: "If most listings are priced within a narrow band and sponsored density is high, the category likely operates as a PPC-driven price war." Surface this mainly in Expert Insight or Competition Reality. Keep it one sentence.

CONSULTANT LANGUAGE (natural, not robotic)
Use: "this suggests", "this dynamic creates", "this typically means", "this indicates".
Avoid robotic or generic phrasing. Stay concise — better reasoning, not longer answers.

CARD INTELLIGENCE RULES (Overview output: sharp, consultative, not long)

WHY THIS DECISION: Exactly 3 bullets. Observation → implication. Combine unit economics, market structure, competition signals. Example: "Price compression combined with mid-level review barriers creates a PPC-heavy environment where new sellers struggle to buy ranking efficiently." Quote numbers. No repetition with other cards.

EXPERT INSIGHT: 3–4 sentences max. Focus on: where listings actually win conversions, what mistake most listings make, where the real battlefield is (price, PPC, images, positioning). Example style: "Most listings in this category compete primarily on price and keyword placement. Few clearly communicate [key spec] in the first image, which is where many buyers make their decision." Reference signals. Identify dominant axis (price war / PPC / positioning) in one line if clear.

WHAT MOST SELLERS MISS: 2 insights max. A hidden dynamic beginners overlook — different angle from Expert Insight. Use signals. e.g. "X of 30 titles don't use the main keyword → organic gap." / "Y weak listings in top 10 → exact targets for PPC." No generic "sellers underestimate competition."

ENTRY REALITY: 2–3 bullets. How difficult entry is right now. Use: review tiers, new seller presence, market maturity. e.g. "3 listings have under 300 reviews — new sellers still reach page one." / "4 listings exceed 5k reviews — strong long-term competitors exist."

COMPETITION REALITY: Minimum 2 insights. How listings actually compete. Price compression, review tiers, sponsored density. e.g. "7 listings between $35–39 → strong price compression." / "5 of top 10 sponsored → PPC-heavy environment." No repetition with Why This Decision or Expert Insight.

OPPORTUNITY: One realistic differentiation path. Compare: user differentiation, competitor titles, pain points. Do not repeat same idea from other cards.

DEEP DIVE — Strategic Risk/Reward Engine (convert Rainforest + user inputs into decisions, not description):
- MARKET SIGNALS (The Battlefield): Keep the raw metrics (avg price, avg reviews, avg rating, review_structure_summary, keyword_saturation_ratio, price_compression, brand_distribution_summary, sponsored_top10_count, sponsored_total_count, new_seller_presence). Then explain the Review Moat and Cost of Entry. Use operator language where appropriate (Review Moat, PPC Floor, Conversion Threshold). End with a 1–2 sentence "Market Snapshot" that summarizes competition level, review barrier and keyword saturation using real numbers (e.g. "Avg reviews around 1,850 with 6 sponsored in top 10 and high keyword saturation → Review Moat that turns this into a 'Locked Market' requiring a $15k–$20k launch budget just to buy initial relevance."). Finish with an explicit single-line Operator’s Verdict for this section.

- ENTRY REALITY (Differentiation Audit — CRITICAL): Stress-test the seller’s differentiation against real complaints and competitor features. Use pain points from review_structure_summary / negative review signals plus competitor titles. Answer:
  • Pain Point Alignment — does their differentiation directly solve a top-3 complaint in the niche?
  • Visual vs Textual — is the differentiator visible in a main image (CTR lift) or only in bullets/description (conversion-only lift)?
  • Value Verdict — can this differentiation realistically reduce CPC or only justify price after reviews?
  Use terms like Visual Differentiation vs Textual Differentiation, Newbie Tax, Conversion Threshold. End with one clear Operator’s Verdict line (e.g. "Operator’s Verdict — your differentiation is mostly textual and will not lower your initial CPC; expect to pay a Newbie Tax until social proof catches up.").

- COMPETITION REALITY (Tactical Landscape): Structure into three mini-blocks (you still return one competition_reality array, but conceptually cover all three):
  1) How competition works — use reviews, price_compression and sponsored density to describe how listings actually win and defend rank (e.g. “PPC Cannibalization detected — major brands are bidding on their own branded terms and generic terms, creating a PPC Floor of ~$X.XX/click.”).
  2) Barriers to entry — describe Review Moats and Brand Dominance using avgReviews, review tiers, brand_distribution_summary.
  3) Where new sellers can break in — use newSellersInTop10 / newSellersInTop20 and weaker-review pockets to point to realistic lanes.
  Every bullet: DATA → INSIGHT → IMPLICATION about ranking, conversion and profitability. End the section with a single-line Operator’s Verdict summarizing whether a new seller has a realistic tactical path or faces a losing PPC war.

- OPPORTUNITY (Economic Viability of Differentiation): Cross-reference the seller’s differentiation with COGS, target price and market gaps. Ask: can they actually afford their differentiation at the price they want? Use terms like Margin Trap and Net Margin Erosion. Example reasoning: "To execute 'premium material', COGS at $6.00 on a $37 price puts you into a Margin Trap — you either need COGS ≤ $4.80 or a price closer to $44.99 to survive the PPC Floor." End with one clear actionable direction plus an Operator’s Verdict sentence on whether the differentiation is economically viable in this niche.

- PROFIT REALITY (Stress Test): Explain clearly: selling_price, manufacturing_cost (COGS), shipping, Amazon fees, calculated / estimated ACoS, net_profit_after_ads and estimated_margin. Calculate and reason around breakeven ACoS and Safety Margin. Use language like Net Margin Erosion and Conversion Death Spiral when small shocks (CPC spikes, return rates) flip profit to loss. Always end with a "Bottom line:" sentence plus an Operator’s Verdict on whether the current unit economics can survive realistic PPC and returns.

- LAUNCH CAPITAL (Velocity Plan): Connect inventory cost to the ad spend required to move it. Use inventory units, landed cost, expected ACoS and target rank velocity to reason about cash flow and Inventory Velocity. Call out when this is effectively a "Buy-to-Rank" strategy where 60%+ of capital goes into PPC and the seller risks running out of cash before a second order if page 1 is not reached within ~30 days. End with a one-line Operator’s Verdict that states whether their current capital is sufficient for a realistic launch path in this niche.

EXECUTION PLAN FIELDS: Follow EXECUTION_PLAN above. For ALL verdicts, return only execution_plan (same structured bullets per CASE). Do not use pre_launch_improvements or what_would_make_go for execution content.

Return JSON with these exact keys (include advisor_implication for each section below):

OVERVIEW: verdict_explanation (string, one sentence), expert_insight (string), what_most_sellers_miss (string), why_this_decision (array of up to 3 strings, DATA → IMPLICATION), recommended_action (string, verdict-dependent). Omit what_would_make_go (execution lives only in execution_plan).
DEEP DIVE: competition_reality (array, min 2), opportunity (string), profit_reality (string), entry_reality (string or array), market_domination_analysis (string). End each with implication for new seller.
EXECUTION: alternative_keywords (array, max 3). execution_plan (array, premium structure per verdict — REQUIRED for GO and NO_GO). Omit pre_launch_improvements. early_strategy_guidance (string).
LEGACY: decision_conversation, review_intelligence (3), opportunities (3), differentiation (3), risks (3).

CRITICAL KEYWORD RULE — alternative_keywords and any keywords mentioned inside execution_plan MUST be short natural Amazon search terms: 2–4 words maximum (e.g. "pilates kit", "resistance bands set", "home pilates equipment"). NEVER use full product titles or sentences as keywords. NEVER repeat the same keyword phrase with only "premium" or "best" appended — those are not real search terms.

JSON response schema (include these keys; advisor_implication fields are strings with the instructions below):
why_this_decision, advisor_implication_why_this_decision "REQUIRED — 2-3 sentences using actual numbers. What happens to their money in 60 days. End with one directive.", expert_insight, advisor_implication_expert_insight "REQUIRED — The one insight they could not see alone. Use a specific number.", what_most_sellers_miss, advisor_implication_what_most_sellers_miss "REQUIRED — Direct insight with actual numbers from this analysis.", advisor_implication_market_signals "REQUIRED — Direct insight with actual numbers from this analysis.", entry_reality, advisor_implication_entry_reality "REQUIRED — Direct insight with actual numbers from this analysis.", market_domination_analysis, advisor_implication_market_domination_analysis "REQUIRED — Direct insight with actual numbers from this analysis.", competition_reality, advisor_implication_competition_reality "REQUIRED — Name the 3-4 weak listings to target. Exact action to take against them.", opportunity, advisor_implication_opportunity "REQUIRED — Which differentiator is strongest, where exactly to place it: title/image1/bullet1.", early_strategy_guidance, advisor_implication_early_strategy_guidance "REQUIRED — Week 1 / Week 2 / Week 3-4. One action per week with expected outcome.".

ADVISOR IMPLICATION (required for every section below):

You are a 30-year Amazon FBA consultant who has launched over 200 products. When you write advisor_implication, you are across the table from a seller with real Rainforest data in front of you. Decode it into the strongest take. (1) What this number means for their bank account. (2) What happens in 60 days if they ignore it. (3) The one thing they must do right now. Use phrases like "this suggests", "this typically means". No reports, no hedging. Concise.

How you think (apply this to every section):

When you see netMargin = -27.5%: You do not write "negative margin indicates challenges." You think: "This person will lose $5.50 on every single sale. They are paying Amazon to sell their product. The only fix is price — they need $27+ to break even, not $20. I need to tell them that number directly."

When you see avgReviews = 2,849 with 8 under 100: You do not write "review barrier exists." You think: "8 weak listings in top 30 — those are the targets. Stop thinking about the 5k-review giants. Focus on the 8 weak ones and run exact-match against their ASINs from day one."

When you see keywordSaturation = 2 of 30: You do not write "keyword opportunity exists." You think: "28 competitors are leaving organic traffic on the table. Put the exact keyword in your title and you immediately outrank 93% of this page on relevance. This is free money. Do it today."

ENTRY_REALITY — Instead of: "You must differentiate or lower costs." Write: "3 listings have under 100 reviews in top 30 — those are your only realistic targets at launch. Ignore the 5k-review giants completely. Run exact-match PPC against those 3 ASINs from day one and nowhere else."

COMPETITION_REALITY — Instead of: "High PPC costs will be a concern." Write: "7 sponsored in top 10 means CPC is $1.50+ here. At 50% ACoS on a $39 product, you're spending $19.50 per sale on ads alone. With $-0.85 margin, every sale costs you $20.35. Don't touch this keyword until margin hits $8+."

OPPORTUNITY — Instead of: "Make sure features are front and center." Write: "27 of 30 competitors use the main keyword in title but zero mention orthopedic certification in their main image. Put 'Orthopedic Certified' as a text overlay on image 1 — that's the only visual differentiator that justifies your $38 vs their $35."

This is how you think. This is how you write.

When signals are missing, fallback to provided raw metrics and still return all required Overview keys with concise non-empty values.

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

CRITICAL MARKET INTELLIGENCE (4 required new fields — always return these):

TABLE_STAKES (table_stakes — array of 3–5 strings):
What does EVERY top competitor on page 1 have? This is the minimum bar a new seller must match to get traffic and convert. Scan competitor titles, review signals, pricing patterns, and listing quality signals.
Rules:
- Each item must be specific and observable — not generic like "good product quality"
- Must reference actual data from competitor titles, prices, or market signals
- Focus only on things ALL top sellers share — not just some
Example: "All top 10 listings are priced between $26–$32 — outside this band you lose the Buy Box comparison before you have reviews"
Example: "Every listing above 4.0 stars mentions the main keyword in the first 5 words of the title"
Return 3–5 concise strings.

WHAT_WINS_HERE (what_wins_here — string):
One sentence explaining what gives the top 3 sellers their unfair advantage. What is the specific mechanism — not a description of the market, but the WHY behind who wins. Reference a specific signal.
Example: "Top sellers win because they own exact-match terms with 200–400 reviews each, creating a social proof floor that keeps CPC low while forcing new entrants into broad match at 2× cost."

MINIMUM_ENTRY (minimum_entry_requirements — array of 3–5 strings):
What must a new seller have or do BEFORE launching? Non-negotiable requirements specific to this market.
Rules:
- Each item must be actionable and specific to this market's data
- Reference actual numbers (review counts, price points, budgets)
- Frame as "you must X or Y happens"
Example: "Price at $28–$31 — 7 listings cluster here; pricing above this without 500+ reviews loses Buy Box immediately"
Example: "Minimum $600/month PPC budget for 60 days — this market has high sponsored density and you need purchase history before organic rank contributes"
Return 3–5 concise strings.

PRICE_BAND (price_band — object with 3 keys):
Based on topPrices, avgPrice, and market positioning signals, return the price structure:
{ "budget": <number — lowest viable price before race to bottom>, "sweet_spot": "<string — '$X–$Y' range where winning listings cluster>", "premium": <number — highest a listing can charge with differentiation> }
Use real numbers from the market data. Never invent prices.

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
): { differentiator: string; appearsInTitles: number; appearsInPainPoints: boolean; verdict: "STRONG" | "WEAK" | "TABLE_STAKES" | "UNIQUE" | "PENDING"; marginImpact: number }[] {
  return validateDifferentiators(differentiation, topTitles, painPoints)
}

const validateDifferentiators = (
  differentiation: string,
  topTitles: string[],
  painPoints: string[]
) => {
  if (!differentiation) return []
  return differentiation
    .split(",")
    .map((d) => d.trim())
    .filter((d) => d.length > 2)
    .map((d) => {
      const dLower = d.toLowerCase()

      // How many competitor titles contain this differentiator word(s)?
      const appearsInTitles = topTitles.filter((t) =>
        dLower.split(" ").every((word) => t.toLowerCase().includes(word))
      ).length

      // Does this differentiator address a known pain point?
      const appearsInPainPoints = painPoints.some((p) =>
        dLower.includes(p.toLowerCase()) || p.toLowerCase().includes(dLower)
      )

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
          : ("WEAK" as const)

      // Margin impact: STRONG differentiator → can support higher threshold (+1%)
      // TABLE_STAKES → actually lowers threshold (no edge, -1%)
      const marginImpact =
        verdict === "STRONG" ? 0.01 : verdict === "TABLE_STAKES" ? -0.01 : 0

      return {
        differentiator: d,
        appearsInTitles,
        appearsInPainPoints,
        verdict,
        marginImpact,
      }
    })
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
    `Margin stress test: ${input.estimated_margin != null && input.estimated_margin >= marginThreshold * 100 ? `PASS — ${input.estimated_margin.toFixed(1)}% is ABOVE the ${(marginThreshold * 100).toFixed(0)}% threshold. Unit economics are viable.` : `FAIL — ${input.estimated_margin?.toFixed(1) ?? "N/A"}% is BELOW the ${(marginThreshold * 100).toFixed(0)}% threshold.`}`,
    `Complexity: ${input.complexity?.trim() || "not specified"}`,
    "",
    "=== UNIT ECONOMICS ===",
    `Profit after ads: $${input.profitAfterAds.toFixed(2)}/unit`,
    `Estimated margin: ${input.estimated_margin != null ? input.estimated_margin.toFixed(1) + "%" : "N/A"} | ROI: ${input.estimated_roi != null ? input.estimated_roi.toFixed(1) + "%" : "N/A"}`,
    `Landed cost: $${input.landed_cost != null ? input.landed_cost.toFixed(2) : "N/A"}`,
    `ACoS used in this calculation: ${input.assumed_acos != null ? (input.assumed_acos * 100).toFixed(1) + "%" : "N/A"} — this is the exact ACoS applied to compute profit after ads and margin above. Use ONLY this ACoS value in early_strategy_guidance. Do NOT recalculate or override it.`,
    "",
    "Signals:",
    JSON.stringify(input.signals ?? {}, null, 2),
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
    lines.push(
      "",
      "Inferred signals from competitor titles (NOT from buyer reviews — these are keywords that appear in competitor listing titles, used as proxy indicators for what the market emphasizes):",
      input.painPoints.join(", "),
      "IMPORTANT: Do NOT present these as confirmed buyer complaints or negative review themes. Use them only as weak market signals when no stronger data is available."
    )
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

  // Keepa 12-month historical intelligence — all signals in one block
  if (input.keepa_bsr_trend) {
    const trendLabel =
      input.keepa_bsr_trend === "improving" ? "📈 IMPROVING (BSR dropping = sales rising)"
      : input.keepa_bsr_trend === "declining" ? "📉 DECLINING (BSR rising = sales falling)"
      : "➡️ STABLE"

    lines.push(
      "",
      "=== KEEPA 12-MONTH MARKET INTELLIGENCE (real competitor data) ===",
      `Demand trend (BSR): ${trendLabel}`,
    )

    // Sales velocity — prefer salesDrops (actual events) over BSR formula
    if (input.keepa_sales_drops_30 != null) {
      lines.push(`Sales rank drops last 30d: ${input.keepa_sales_drops_30} (each drop ≈ 1 sale → ~${Math.round(input.keepa_sales_drops_30 * 1.2)} units/month)`)
    } else if (input.keepa_estimated_monthly_sales) {
      lines.push(`Est. monthly sales (BSR formula): ~${input.keepa_estimated_monthly_sales.toLocaleString()} units/month`)
    }
    if (input.keepa_current_bsr)  lines.push(`Current BSR: #${input.keepa_current_bsr.toLocaleString()}`)
    if (input.keepa_current_price) lines.push(`Current market price: $${input.keepa_current_price.toFixed(2)}`)

    // Review velocity
    if (input.keepa_review_velocity_monthly) {
      lines.push(`Review velocity: ~${input.keepa_review_velocity_monthly} new reviews/month`)
    }

    // Amazon selling flag — CRITICAL signal
    if (input.keepa_amazon_is_selling) {
      lines.push(`🚨 AMAZON IS SELLING THIS PRODUCT — Buy Box is near-impossible for 3P sellers. Mention this prominently in expert_insight.`)
    }

    // Out-of-stock opportunity
    if (input.keepa_out_of_stock_pct30 != null && input.keepa_out_of_stock_pct30 > 25) {
      lines.push(`📦 SUPPLY SHORTAGE: top seller was OOS ${input.keepa_out_of_stock_pct30.toFixed(0)}% of the last 30 days — unmet demand. Mention as opportunity.`)
    }

    // Seller count trend
    if (input.keepa_seller_count_trend === "growing") {
      lines.push(`⚠️ SELLER COUNT RISING: more competitors entering — commoditization risk. Mention in risks.`)
    } else if (input.keepa_seller_count_trend === "shrinking") {
      lines.push(`📉 SELLER COUNT SHRINKING: competitors leaving — possible opportunity OR market dying. Contextualize with BSR trend.`)
    }

    // Price stability / price war
    if (input.keepa_is_price_war) {
      lines.push(`⚠️ PRICE WAR: ${input.keepa_price_war_note}`)
    } else {
      lines.push(`Price stability: stable over 12 months`)
    }

    // Seasonality
    if (input.keepa_is_seasonal) {
      lines.push(`⚠️ SEASONAL WARNING: ${input.keepa_seasonality_note}`)
    }

    // Real FBA fee
    if (input.keepa_real_fba_fee != null) {
      lines.push(`Actual FBA fee for this product: $${input.keepa_real_fba_fee.toFixed(2)} (used in profit calculation)`)
    }

    // Size tier & storage
    if (input.keepa_size_tier) {
      lines.push(`Product size tier: ${input.keepa_size_tier}`)
    }
    if (input.keepa_storage_per_unit_monthly != null) {
      lines.push(`Monthly storage fee per unit: $${input.keepa_storage_per_unit_monthly.toFixed(3)} — mention in launch capital context for inventory sitting 3+ months`)
    }

    // FBA seller count
    if (input.keepa_fba_seller_count != null) {
      lines.push(`Active FBA sellers (csv[7]): ${input.keepa_fba_seller_count} — ${input.keepa_fba_seller_count >= 8 ? "HIGH competition from established FBA sellers, mention in risks" : input.keepa_fba_seller_count >= 4 ? "moderate FBA competition" : "low FBA seller count — opportunity signal"}`)
    }

    // Seasonal calendar
    if (input.keepa_peak_sales_months) {
      lines.push(`Peak demand months: ${input.keepa_peak_sales_months} — inventory must arrive 10–12 weeks before. Mention in execution plan.`)
    }
    if (input.keepa_trough_sales_months) {
      lines.push(`Slowest months: ${input.keepa_trough_sales_months} — avoid heavy stock entering these periods.`)
    }

    // Pain point source note
    if (input.painPointSource === "reviews") {
      lines.push(`Pain points above are extracted from REAL 1–2 star reviews of the top competitor. These are verified customer complaints — lead with them in differentiation section.`)
    } else if (input.painPointSource === "titles") {
      lines.push(`Pain points are inferred from listing titles (no review data available). Treat as signals, not verified complaints.`)
    }

    lines.push(
      "",
      "MANDATORY — HOW TO USE KEEPA DATA:",
      "- DECLINING BSR: warn explicitly in why_this_decision + expert_insight with the actual trend.",
      "- IMPROVING BSR: highlight as key GO signal with market size numbers.",
      "- AMAZON SELLING: lead with this in expert_insight — it changes the competitive reality entirely.",
      "- OOS SHORTAGE: mention as a concrete opportunity (unmet demand = faster ranking).",
      "- SELLER COUNT GROWING: mention commoditization risk in risks section.",
      "- HIGH FBA SELLER COUNT (≥8): call out explicitly in risks — this means the page is full of FBA-backed listings.",
      "- PEAK MONTHS: name them in execution_plan and early_strategy_guidance — timing inventory is make-or-break.",
      "- REVIEW-BASED PAIN POINTS: if source is 'reviews', lead differentiation with these as verified product failures competitors haven't fixed.",
      "- Ground every market size claim with the actual sales number from Keepa.",
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
    const compact = (v: unknown, fallback: string): string => {
      const s = typeof v === "string" ? v.trim() : ""
      return s.length > 0 ? s : fallback
    }
    const firstSentences = (text: string, max: number): string => {
      const parts = text
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean)
      if (parts.length === 0) return text.trim()
      return parts.slice(0, max).join(" ").trim()
    }

    const whyDecision = toArray(parsed.why_this_decision)
    console.log("[WHY TRACE] parsed.why_this_decision:", parsed.why_this_decision)
    console.log("[WHY TRACE] mapped whyDecision array:", whyDecision)
    const opportunityOverviewRaw = toArray(parsed.opportunity).slice(0, 3)
    const opportunityOverview =
      input.verdict === "NO_GO" ? [] : opportunityOverviewRaw
    const decisionConversation = toArray(parsed.decision_conversation)
    const useWhy = decisionConversation
    console.log("[WHY TRACE] fallback decision_conversation:", decisionConversation)
    console.log("[WHY TRACE] final useWhy:", useWhy)
    const decisionSnapshot = compact(
      parsed.decision_snapshot,
      input.verdict === "NO_GO"
        ? "Risk-to-reward is unfavorable under current economics and market pressure."
        : input.verdict === "IMPROVE_BEFORE_LAUNCH"
          ? "Economics are close, but execution upgrades are required before launch."
          : "Signals indicate a viable launch path with controlled execution."
    )
    const marketReality = compact(
      parsed.market_reality,
      "Signals indicate the category is shaped by review moat and PPC pressure."
    )
    const whatMostSellersMiss = compact(
      parsed.what_most_sellers_miss,
      "Most sellers miss how signal gaps between economics and market pressure determine survival."
    )
    const marketRealityClean = firstSentences(marketReality, 2)
    const missClean = firstSentences(whatMostSellersMiss, 1)

    const entryRealityRaw = parsed.entry_reality
    const entry_reality =
      Array.isArray(entryRealityRaw)
        ? entryRealityRaw.map((x) => String(x)).filter(Boolean).join("\n")
        : toStr(entryRealityRaw)

    return {
      decision_snapshot: decisionSnapshot,
      decision_conversation: useWhy,
      review_intelligence: toArray(parsed.review_intelligence).slice(0, 3),
      opportunities:
        opportunityOverview.length > 0
          ? opportunityOverview
          : toArray(parsed.opportunities).slice(0, 3),
      differentiation: toArray(parsed.differentiation).slice(0, 3),
      risks: toArray(parsed.risks).slice(0, 3),
      alternative_keywords: toArray(parsed.alternative_keywords).slice(0, 3),
      // Execution tab: single source of truth — execution_plan for every verdict (legacy AI may still send pre_launch / what_would_make_go).
      what_would_make_go: undefined,
      execution_plan: (() => {
        const ep = toArray(parsed.execution_plan)
        if (ep.length) return ep.slice(0, 16)
        if (input.verdict === "NO_GO") return toArray(parsed.what_would_make_go).slice(0, 16)
        if (input.verdict === "IMPROVE_BEFORE_LAUNCH")
          return toArray(parsed.pre_launch_improvements).slice(0, 16)
        return []
      })(),
      pre_launch_improvements: undefined,
      recommended_action: toStr(parsed.recommended_action),
      verdict_explanation: toStr(parsed.verdict_explanation),
      expert_insight: firstSentences(toStr(parsed.expert_insight) ?? marketRealityClean, 2),
      what_most_sellers_miss: missClean,
      competition_reality: toArray(parsed.competition_reality).slice(0, 6),
      opportunity:
        opportunityOverview.length > 0
          ? opportunityOverview.join(" ")
          : toStr(parsed.opportunity),
      profit_reality: toStr(parsed.profit_reality),
      entry_reality: entry_reality ?? toStr(parsed.entry_reality),
      why_this_decision: whyDecision,
      market_domination_analysis: toStr(parsed.market_domination_analysis),
      early_strategy_guidance: toStr(parsed.early_strategy_guidance),
      honeymoon_roadmap: toArray(parsed.honeymoon_roadmap).slice(0, 8),
      advisor_implication_why_this_decision: toStr(parsed.advisor_implication_why_this_decision),
      advisor_implication_expert_insight:
        firstSentences(toStr(parsed.advisor_implication_expert_insight) ?? marketRealityClean, 2),
      advisor_implication_what_most_sellers_miss: toStr(parsed.advisor_implication_what_most_sellers_miss),
      advisor_implication_market_signals: toStr(parsed.advisor_implication_market_signals),
      advisor_implication_entry_reality: toStr(parsed.advisor_implication_entry_reality),
      advisor_implication_market_domination_analysis: toStr(parsed.advisor_implication_market_domination_analysis),
      advisor_implication_competition_reality: toStr(parsed.advisor_implication_competition_reality),
      advisor_implication_opportunity:
        toStr(parsed.advisor_implication_opportunity) ??
        (opportunityOverview.length > 0 ? opportunityOverview.join(" ") : ""),
      advisor_implication_early_strategy_guidance: toStr(parsed.advisor_implication_early_strategy_guidance),
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("❌ OpenAI error:", message)
    return null
  }
}

const CONSULTANT_SYSTEM_PROMPT = `You are a 30-year Amazon FBA consultant. You have built and sold multiple stores. Deep knowledge of selling on Amazon, advertising (PPC, ACoS, CPC), and costs. Input: real Rainforest market data plus seller answers. Decode into the strongest consultant insights. Each of the 5 fields must provide a different insight — no repetition. Reference signals (review tiers, price compression, keyword saturation, sponsored density, new seller presence, brand distribution). Use phrases like "this suggests", "this dynamic creates", "this typically means". Avoid generic language ("competition is strong", "many sellers"). Sharp, consultative, concise. Never hedge.

why_this_decision_insight (Primary Reason): Core structural reason for the verdict. Unit economics + market structure. What it means for their money in 60 days, one directive. Use actual numbers. 1.5–2 lines.

expert_insight: How the category actually behaves. Where listings win conversions, what mistake most make, where the real battlefield is (price / PPC / positioning). One dominant dynamic. Use signals. 2–3 sentences.

what_most_sellers_miss_insight: One hidden dynamic beginners overlook — different from expert_insight. Use signals. No generic "sellers underestimate competition." 2–3 sentences.

opportunity_insight: One realistic differentiation path. Different angle from other fields.

competition_insight: How listings actually compete. Different angle from other fields.

Return valid JSON only with these 5 fields: why_this_decision_insight, expert_insight, opportunity_insight, competition_insight, what_most_sellers_miss_insight.`

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
