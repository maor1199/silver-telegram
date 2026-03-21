# Overview Section Map: Why This Decision, Market Reality, What Most Sellers Miss

This document maps exactly how the three Overview sections are built on **Analyze → Results → Overview**, with file paths, functions, prompts, data flow, and problems.

---

## 1. Why This Decision

### A. Where is the content generated?

| Location | Details |
|----------|---------|
| **Backend** | `client/src/lib/analyze/analyzeAgent.ts` |
| **Function** | `analyzeProduct()` — logic for this section lives in the block between **lines 442–496** (why_this_decision_raw → why_this_decision → whyBullets → why_this_decision_final). |
| **UI** | `client/src/app/analyze/results/war-room.tsx`: **lines 439, 464–466, 736–755**. The section renders when `fWhy.length > 0` and displays `fWhy.slice(0, 3)` as bullets. |

**Variable chain:**  
`why_this_decision_final` (analyzeAgent) → stored in `report.why_this_decision` → returned as `whyThisDecision` (and spread via `...report`) → API returns it → **war-room** reads `R?.whyThisDecision ?? analysisData?.whyThisDecision ?? R?.why_this_decision` into `whyFallback` → `fWhy = whyFallback.length > 0 ? whyFallback : [fRisks, fCompetition, fProfitReality, fReviewIntel].filter(Boolean).slice(0, 5)`.

### B. Is this content from OpenAI, hardcoded, or computed?

**Hybrid:**

1. **Primary:** **OpenAI** — `getAIInsights(aiInput)` returns `why_this_decision` (array). Used if `aiInsights?.why_this_decision?.length` (or `decision_conversation?.length`) is truthy.
2. **Fallback 1:** **Hardcoded** — If AI returns nothing, `why_this_decision_raw` is set to a **verdict-based** template:
   - **NO_GO:** 3 bullets: "Profit after ads is too thin…", "Market avg X reviews; you'll burn roughly $Y…", "Unless you have a real differentiator…".
   - **GO:** 3 bullets: "$X/unit after ads — room to play.", "Competition: workable/tough.", "Worth testing. Nail one differentiator…".
3. **Fallback 2:** **Computed** — If there is real market data but no AI bullets, `whyBullets` is built from **if/else** rules (lines 458–492): `passesMarginRule`, `avgReviews`, `dominantBrand`/`dominantBrandNames`, `competitorsWithOver1000Reviews`, `sellingPrice` vs `avgPrice`, `profitAfterAds`, etc.
4. **Fallback 3:** **Single sentence by verdict** — If both AI and whyBullets are empty, one of: NO_GO / IMPROVE_BEFORE_LAUNCH / GO (line 496).

### C. If AI is used — prompts and inputs

**AI is used:** `getAIInsights(aiInput)` in `client/src/lib/analyze/openaiService.ts` (lines 506–596).

**SYSTEM PROMPT** (excerpts that govern why_this_decision):

- `client/src/lib/analyze/openaiService.ts` — `SYSTEM_PROMPT` (starts ~line 110):
  - "WHY_THIS_VERDICT (why_this_decision): Exactly 3 concise bullets. Each bullet: DATA → IMPLICATION. Example: \"Net margin after ads is only 6.8%, leaving little buffer for launch inefficiencies.\""
  - "OVERVIEW STRATEGIC ENGINE — … WHY THIS DECISION (\"kill reason\"): Must explain the risk-to-reward ratio based on net profit after ads vs PPC pressure. Always use DATA → IMPLICATION and tie numbers to the ability to rank, convert and stay profitable…"
  - "PRIORITY: Why This Decision, Market Reality (expert_insight), What Most Sellers Miss, and Recommended Action must be your strongest outputs…"
  - "WHY THIS DECISION: Exactly 3 bullets. Observation → implication. Combine unit economics, market structure, competition signals. Quote numbers. No repetition with other cards."
  - "Return JSON with these exact keys… why_this_decision (array of exactly 3 strings, DATA → IMPLICATION)…"
  - "advisor_implication_why_this_decision \"REQUIRED — 2-3 sentences using actual numbers. What happens to their money in 60 days. End with one directive.\""

**USER PROMPT:** Built by `buildUserPrompt(input)` in the same file (lines 397–503). It includes:

- Product/keyword, selling price, unit cost, shipping, differentiation, validated differentiators, margin threshold, complexity.
- Unit economics: profit after ads, estimated margin, ROI, landed cost.
- **Verdict:** `Verdict: ${input.verdict}`.
- Market: avg price, avg reviews, avg rating, brand distribution, new sellers in top 10/20.
- Optional: review_structure_summary, new_seller_presence, keyword_saturation_ratio, price_compression, brand_distribution_summary, market_maturity_signal, sponsored density, pain points, product_vs_market, top competitor titles/prices, COMPETITOR SNAPSHOT (top 5 + SERP top 20).

**Data passed into the model:** The entire `aiInput` object (analyzeAgent.ts lines 399–437): keyword, sellingPrice, unitCost, shippingCost, profitAfterAds, **verdict**, avgPrice, avgRating, avgReviews, dominantBrand, newSellersInTop10, newSellersInTop20, topTitles, topPrices, differentiation, complexity, product_vs_market, landed_cost, estimated_margin, estimated_roi, topCompetitors (position, title, price, ratingsTotal, rating, brand, sponsored), painPoints, product_name, review_structure_summary, new_seller_presence, keyword_saturation_ratio, price_compression, brand_distribution_summary, market_maturity_signal, sponsored_top10_count, sponsored_total_count.

### D. What data influences this section?

| Variable | Where computed / source |
|----------|-------------------------|
| `verdict` | `analyzeAgent.ts` — "FINAL DECISION ENGINE" (lines 330–348): `hasRealProfit`, `hasHealthyProfit`, `marketLocked`, `hasWinPath`, `profitAfterAds`. Only two branches set NO_GO; else IMPROVE_BEFORE_LAUNCH or GO. |
| `profitAfterAds` | Same file: unit economics block (selling price − referral − FBA − unit cost − shipping − PPC per unit). |
| `passesMarginRule` | Margin threshold vs estimated margin. |
| `estimatedMarginPercent` | From economics. |
| `marginThresholdPct` | From getMarginThreshold (differentiation/titles/pain points). |
| `avgReviews`, `avgPrice`, `avgRating` | From `marketData` (marketDataProvider). |
| `dominantBrand`, `dominantBrandNames` | From market. |
| `competitorsWithOver1000Reviews` | From market. |
| `sellingPrice`, `launchCapitalRequired` | User input + computed. |
| `hasRealMarketData` | `Boolean(market?.success)`. |

These are all passed to the AI via `aiInput` and/or used in the computed `whyBullets` and the hardcoded verdict fallbacks.

### E. Is the output controlled by verdict (GO / GO-BUT / NO_GO)?

**Yes, in three places:**

1. **Hardcoded fallback (lines 444–454):** If AI returns no why_this_decision, the 3 bullets are chosen by `verdict === "NO_GO"` vs else (GO/IMPROVE).
2. **Last-resort sentence (line 496):** If both AI and whyBullets are empty, the single bullet is verdict-based: NO_GO / IMPROVE_BEFORE_LAUNCH / GO.
3. **AI input:** `input.verdict` is passed to the model so the model can tailor WHY_THIS_VERDICT to the verdict. The **verdict itself is not recomputed by the model**; it is an input.

The **UI** does not hide "Why This Decision" by verdict; it shows whenever `fWhy.length > 0`. So the section is **content-controlled** by verdict (what we say), not **visibility-controlled** (always shown).

### F. Full data flow

```
User input (keyword, price, COGS, shipping, differentiation, etc.)
  → POST /api/analyze (client/src/app/api/analyze/route.ts)
  → getMarketData(keyword) → marketData
  → analyzeProduct({ ...body, marketData, marginThreshold })
       → Economics (profitAfterAds, margin, etc.)
       → Verdict (GO / IMPROVE_BEFORE_LAUNCH / NO_GO)
       → aiInput = { verdict, profitAfterAds, market snapshot, competitors, ... }
       → getAIInsights(aiInput) → aiInsights (why_this_decision, advisor_implication_*, etc.)
       → why_this_decision_raw = aiInsights.why_this_decision ?? verdict-based hardcoded
       → why_this_decision = raw.slice(0,5)
       → If no AI and has real data: whyBullets from rules (margin, reviews, brand, etc.)
       → why_this_decision_final = AI bullets ?? whyBullets ?? single verdict sentence
       → report.why_this_decision = why_this_decision_final
  → Return { ...report, whyThisDecision: report.why_this_decision, ... }
  → normalizeAnalysisResponse(raw) (adds camelCase aliases; whyThisDecision already on raw)
  → JSON response to client
  → War Room: analysisData / R → whyFallback = R?.whyThisDecision ?? R?.why_this_decision
  → fWhy = whyFallback or fallback from parsed sections
  → Overview: render "Why This Decision" with fWhy.slice(0, 3) as bullets
```

### G. Problems

- **Generic when AI is missing:** Hardcoded NO_GO/GO bullets use fixed phrasing and only one number (avgReviews, launchCapitalRequired, profitAfterAds). No market structure (brand concentration, sponsored share, price compression).
- **AI not constrained by verdict:** The system prompt says verdict is the anchor, but the model can still produce bullets that don’t match GO/IMPROVE/NO_GO. There is no post-check that why_this_decision aligns with the engine verdict.
- **Consultant “Why” not used here:** A second AI call `getConsultantInsights` returns `why_this_decision_insight`; the Overview card does **not** use it for "Why This Decision" — it uses only main AI bullets or code fallbacks. So two sources of “why” exist and only one is shown in this section.
- **Fallback chain can show unrelated content:** If `whyFallback` is empty, `fWhy` is built from `fRisks`, `fCompetition`, `fProfitReality`, `fReviewIntel` (war-room 464–466). So "Why This Decision" can show risks/competition/profit/review bullets that are not explicitly “why this verdict.”

---

## 2. Market Reality

### A. Where is the content generated?

| Location | Details |
|----------|---------|
| **Backend** | Main content: `client/src/lib/analyze/openaiService.ts` — `getAIInsights()` returns `expert_insight` and `advisor_implication_expert_insight`. Secondary: `getConsultantInsights()` returns `expert_insight`. Both are used by `analyzeAgent.ts` and returned on the result object. |
| **Function** | In **analyzeAgent**: `consultantSecret` (lines 783–806) uses `aiInsights?.expert_insight` and a computed fallback; the **Market Reality card** in the UI does **not** use `consultantSecret`. It uses `expert_insight` (consultant) or `advisor_implication_expert_insight` (main AI). Return object (1069, 1078): `advisorImplicationExpertInsight: report.advisor_implication_expert_insight`, `expert_insight: co.expert_insight`. |
| **UI** | `client/src/app/analyze/results/war-room.tsx`: **lines 515–516, 804–819**. Variable: `advisorImplicationExpertInsight = safeStr(R?.expert_insight ?? analysisData?.expert_insight) || safeStr(R?.advisorImplicationExpertInsight ?? … ?? R?.advisor_implication_expert_insight)`. Section renders when `advisorImplicationExpertInsight` is truthy and displays that string. |

So the **Market Reality** block shows: **(1) consultant `expert_insight`** (second AI call) if present, else **(2) main AI `advisor_implication_expert_insight`**. The main AI’s `expert_insight` field is used only for `consultantSecret` (and consultant_secret elsewhere), not for this card.

### B. Is this content from OpenAI, hardcoded, or computed?

**Almost entirely AI:**

- **Main AI:** `getAIInsights` returns `expert_insight` and `advisor_implication_expert_insight`. Only `advisor_implication_expert_insight` is shown on this card when consultant is absent or returns empty.
- **Consultant AI:** `getConsultantInsights(consultantData)` returns `expert_insight`. The UI prefers this over main AI’s advisor_implication for the same card.
- **Computed fallback:** In analyzeAgent, `consultantSecret` (which uses main AI’s `expert_insight`) has a computed fallback (bits from dominantBrand, avgReviews, sponsoredShare, price compression, differentiationStrong, etc.) and a generic niche hint — but **this is not what the Market Reality card displays**. The card only shows `advisorImplicationExpertInsight` / `expert_insight` from the two AI calls. So for **Market Reality**, there is **no** hardcoded or computed fallback shown; if both AIs return empty, the section simply doesn’t render.

### C. If AI is used — prompts and inputs

**Main AI (getAIInsights)**

- **SYSTEM PROMPT** (openaiService.ts, SYSTEM_PROMPT):
  - "MARKET_REALITY (entry_reality / expert_insight): Core market dynamic in 2–3 sentences. Example: \"In this niche, visibility is largely controlled by advertising…\""
  - "MARKET REALITY: Analyze the battlefield. Focus on review moats and PPC saturation, and how customers actually choose in this niche."
  - "EXPERT INSIGHT: The one insight that changes how they see this market… Use specific numbers from the Rainforest data."
  - "advisor_implication_expert_insight \"REQUIRED — The one insight they could not see alone. Use a specific number.\""
  - "EXPERT INSIGHT: 3–4 sentences max. Focus on: where listings actually win conversions, what mistake most listings make, where the real battlefield is…"
- **USER PROMPT:** Same `buildUserPrompt(input)` as in section 1 — product, economics, **verdict**, market snapshot, competitors, review structure, sponsored density, etc.

**Consultant AI (getConsultantInsights)**

- **SYSTEM PROMPT** (openaiService.ts, CONSULTANT_SYSTEM_PROMPT, ~lines 598–610):
  - "expert_insight: How the category actually behaves. Where listings win conversions, what mistake most make, where the real battlefield is (price / PPC / positioning). One dominant dynamic. Use signals. 2–3 sentences."
- **USER PROMPT:** `JSON.stringify(consultantData)`. **consultantData** (analyzeAgent 969–988): verdict, profitAfterAds, estimatedMarginPercent, avgPrice, avgReviews, avgRating, dominantBrand, newSellersInTop10, newSellersInTop20, marginThresholdPct, launchCapitalRequired, differentiation, topTitles, painPoints, sponsored_top10_count, keyword_saturation_ratio, price_compression, new_seller_presence, sellingPrice, unitCost.

**Data passed to main model:** Same `aiInput` as for Why This Decision (verdict, economics, full competitor list, market signals, etc.).  
**Data passed to consultant:** Only the compact `consultantData` object above — no full competitor titles or SERP snapshot.

### D. What data influences this section?

- **Main AI:** All of `aiInput` (verdict, profitAfterAds, margin, market averages, dominantBrand, newSellersInTop10/20, topCompetitors, review_structure_summary, sponsored counts, keyword_saturation_ratio, price_compression, etc.).
- **Consultant:** verdict, profitAfterAds, estimatedMarginPercent, avgPrice, avgReviews, avgRating, dominantBrand, newSellersInTop10/20, marginThresholdPct, launchCapitalRequired, differentiation, topTitles, painPoints, sponsored_top10_count, keyword_saturation_ratio, price_compression, new_seller_presence, sellingPrice, unitCost. So consultant has less SERP detail but same high-level signals.

Variables are computed in **analyzeAgent** (economics, verdict) and **marketDataProvider** (market fields).

### E. Is the output controlled by verdict?

**Only indirectly:**

- Verdict is **input** to both AI calls so the model can tailor tone/emphasis. There is **no** code that forces Market Reality text to change or hide based on GO vs NO_GO.
- The section is **visibility-controlled** only by “do we have any text?” — not by verdict. So **no** strict verdict-based control of content or visibility.

### F. Full data flow

```
User input + marketData
  → analyzeProduct
       → aiInput (includes verdict, market snapshot, competitors)
       → getAIInsights(aiInput) → expert_insight, advisor_implication_expert_insight
       → consultantData = { verdict, profitAfterAds, avgPrice, avgReviews, ... }
       → getConsultantInsights(consultantData) → expert_insight (consultant)
       → report.advisor_implication_expert_insight = aiInsights.advisor_implication_expert_insight
       → return { ..., advisorImplicationExpertInsight: report.advisor_implication_expert_insight, expert_insight: co.expert_insight }
  → API → normalizeAnalysisResponse (adds advisorImplicationExpertInsight from report if needed)
  → Client: R / analysisData
  → advisorImplicationExpertInsight = R?.expert_insight || R?.advisorImplicationExpertInsight || R?.advisor_implication_expert_insight
  → Overview: if advisorImplicationExpertInsight, render "Market Reality" with that string
```

### G. Problems

- **Two AIs, no single source of truth:** Market Reality can show either consultant’s `expert_insight` or main AI’s `advisor_implication_expert_insight`. Priority is consultant first; if consultant is empty, main AI is used. Inconsistent naming (expert_insight vs advisor_implication_expert_insight) and two prompts can produce different tones/depth.
- **No fallback when both AIs fail:** If both return empty, the section disappears. There is a computed `consultantSecret` in analyzeAgent that could serve as fallback but it is not wired to this card.
- **Consultant gets less context:** Consultant prompt receives only JSON summary (no full competitor list or long-form review_structure_summary), so Market Reality can be less data-rich when it shows consultant output.
- **Not explicitly verdict-driven:** Content is not required to reflect GO vs NO_GO (e.g. “this market supports a GO” vs “this market blocks a GO”). Risk of generic or misaligned phrasing.

---

## 3. What Most Sellers Miss

### A. Where is the content generated?

| Location | Details |
|----------|---------|
| **Backend** | `client/src/lib/analyze/analyzeAgent.ts` — **lines 517–536**: `what_most_sellers_miss` = AI or computed fallback. Main AI: `getAIInsights` → `what_most_sellers_miss` and `advisor_implication_what_most_sellers_miss`. Consultant: `getConsultantInsights` → `what_most_sellers_miss_insight`. |
| **Functions** | In analyzeAgent: `what_most_sellers_miss` is set from `aiInsights?.what_most_sellers_miss`; if empty and hasRealMarketData, built from dominantBrand, sponsoredShare, priceMin/Max, avgReviews (parts array); else generic message or “Enable live market data…”. Report stores `what_most_sellers_miss`; return object has `whatMostSellersMiss` and `advisorImplicationWhatMostSellersMiss` / `what_most_sellers_miss_insight` (consultant). |
| **UI** | `client/src/app/analyze/results/war-room.tsx`: **lines 507, 516, 821–841**. Main text: `whatMostSellersMiss = R?.whatMostSellersMiss ?? R?.what_most_sellers_miss`. Sub text: `advisorImplicationWhatMostSellersMiss = R?.what_most_sellers_miss_insight ?? R?.advisorImplicationWhatMostSellersMiss ?? R?.advisor_implication_what_most_sellers_miss`. Section shows main paragraph + optional styled sub-paragraph. |

### B. Is this content from OpenAI, hardcoded, or computed?

**Hybrid:**

1. **Primary:** **OpenAI** — Main AI returns `what_most_sellers_miss` and `advisor_implication_what_most_sellers_miss`. Consultant returns `what_most_sellers_miss_insight`.
2. **Fallback (main paragraph only):** **Computed** (analyzeAgent 519–536): if no AI and `hasRealMarketData`, build `parts[]` from: dominantBrand + dominantBrandNames, sponsoredShare ≥ 0.6, price compression (priceMin/priceMax), avgReviews ≥ 5000. If parts non-empty: `parts.join(" ") + " Most beginners underestimate this."`; else one sentence with `avgReviews`. If no real market data and no AI: **hardcoded** "Enable live market data (Rainforest API) to see what most sellers miss in this niche."

### C. If AI is used — prompts and inputs

**Main AI (getAIInsights):**

- **SYSTEM PROMPT:** "WHAT_MOST_SELLERS_MISS: One short insight about a hidden dynamic. Do not repeat the same point from other sections." / "WHAT MOST SELLERS MISS: Surface one hidden dynamic such as brand dominance or keyword saturation…" / "what_most_sellers_miss, advisor_implication_what_most_sellers_miss \"REQUIRED — Direct insight with actual numbers from this analysis.\"" / "WHAT MOST SELLERS MISS: 2 insights max. A hidden dynamic beginners overlook — different angle from Expert Insight. Use signals."
- **USER PROMPT:** Same `buildUserPrompt(input)` as for the other sections (product, economics, verdict, market, competitors).

**Consultant (getConsultantInsights):**

- **SYSTEM PROMPT:** "what_most_sellers_miss_insight: One hidden dynamic beginners overlook — different from expert_insight. Use signals. No generic \"sellers underestimate competition.\" 2–3 sentences."
- **USER PROMPT:** `JSON.stringify(consultantData)` (same object as for Market Reality).

**Data passed:** Same as in sections 1 and 2 for main AI; same consultantData for consultant.

### D. What data influences this section?

- **AI:** Full aiInput / consultantData (verdict, economics, market, competitors, signals).
- **Computed fallback:** dominantBrand, dominantBrandNames, sponsoredShare, priceMin, priceMax, avgReviews, hasRealMarketData. All from analyzeAgent/market.

### E. Is the output controlled by verdict?

**No.** Verdict is only passed as input to the model. There is no branch that changes or gates "What Most Sellers Miss" by GO / GO-BUT / NO_GO. The computed fallback does not use verdict. So **no** verdict-based control.

### F. Full data flow

```
User input + marketData
  → analyzeProduct
       → getAIInsights(aiInput) → what_most_sellers_miss, advisor_implication_what_most_sellers_miss
       → what_most_sellers_miss = aiInsights.what_most_sellers_miss ?? (computed from dominantBrand, sponsoredShare, price compression, avgReviews) ?? "Enable live market data…"
       → getConsultantInsights(consultantData) → what_most_sellers_miss_insight
       → report.what_most_sellers_miss = what_most_sellers_miss
       → return { whatMostSellersMiss, advisorImplicationWhatMostSellersMiss: report.advisor_implication_*, what_most_sellers_miss_insight: co.what_most_sellers_miss_insight }
  → API → normalizeAnalysisResponse (advisorImplicationWhatMostSellersMiss from report)
  → Client: R / analysisData
  → whatMostSellersMiss = R?.whatMostSellersMiss ?? R?.what_most_sellers_miss
  → advisorImplicationWhatMostSellersMiss = R?.what_most_sellers_miss_insight ?? R?.advisorImplicationWhatMostSellersMiss ?? R?.advisor_implication_what_most_sellers_miss
  → Overview: render "What Most Sellers Miss" — main paragraph (whatMostSellersMiss) + optional sub (advisorImplicationWhatMostSellersMiss)
```

### G. Problems

- **Not tied to verdict:** Section does not change framing for GO vs NO_GO (e.g. “what sellers miss that would have made this a GO” vs “what sellers miss that makes this niche dangerous”). Can feel generic across verdicts.
- **Two sources for the sub-block:** Main paragraph is main AI or computed; sub-paragraph is consultant or main AI advisor_implication. Again two AIs and two prompts can diverge.
- **Generic fallback when no data:** "Enable live market data (Rainforest API)…" is a generic CTA, not insight.
- **Repetition risk:** Prompt asks “different from Expert Insight” but no enforcement; main AI could overlap with Market Reality.

---

## Summary Table

| Section                | Primary source     | Fallback                    | Verdict controls content? | Verdict controls visibility? |
|------------------------|--------------------|-----------------------------|----------------------------|-------------------------------|
| Why This Decision      | AI (why_this_decision) | Hardcoded + computed bullets | Yes (fallbacks + AI input) | No                            |
| Market Reality         | Consultant expert_insight, else main AI advisor_implication_expert_insight | None (section hidden if both empty) | No                            | No                            |
| What Most Sellers Miss | AI + consultant    | Computed (market signals) + hardcoded CTA | No                         | No                            |

---

## File reference

- **Verdict + report construction:** `client/src/lib/analyze/analyzeAgent.ts` — `analyzeProduct()`
- **AI (main):** `client/src/lib/analyze/openaiService.ts` — `getAIInsights()`, `buildUserPrompt()`, `SYSTEM_PROMPT`
- **AI (consultant):** `client/src/lib/analyze/openaiService.ts` — `getConsultantInsights()`, `CONSULTANT_SYSTEM_PROMPT`
- **API:** `client/src/app/api/analyze/route.ts` — POST body → getMarketData → analyzeProduct → normalizeAnalysisResponse → JSON
- **Normalize:** `client/src/lib/analysisApi.ts` — `normalizeAnalysisResponse()`
- **Results UI:** `client/src/app/analyze/results/war-room.tsx` — Overview tab: Why This Decision (fWhy), Market Reality (advisorImplicationExpertInsight), What Most Sellers Miss (whatMostSellersMiss + advisorImplicationWhatMostSellersMiss)
