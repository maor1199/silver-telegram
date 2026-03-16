# Market competition and entry signals — variable inventory

Analysis of the client analysis pipeline. No code was modified.

---

## 1. lowReviewListingsTop10 (number of listings in top 10 with <100 reviews)

| Item | Value |
|------|--------|
| **Exists?** | **No** |
| **Closest** | **newSellersInTop10** = number of listings in **top 10** with **< 200** reviews (not < 100). |
| **Note** | `listingsUnder100` exists only **inside** `marketDataProvider.ts` (line 251) as a **local** variable for the **full 30** results: `reviewCounts.filter((c) => c < 100).length`. It is used only to build the text of `review_structure_summary` and is **not** returned or exposed. There is no variable for “top 10 with < 100 reviews”. |

---

## 2. newSellersTop20

| Item | Value |
|------|--------|
| **Exists?** | **Yes** |
| **Exact variable name** | **newSellersInTop20** |
| **File** | **client/src/lib/analyze/marketDataProvider.ts** |
| **Where calculated** | Line 305: `topCompetitors.slice(0, 20).filter((l) => l.ratingsTotal < 200).length` |
| **Source** | **Derived after parsing** Rainforest `search_results`. Uses `topCompetitors` (built from API results) and threshold **< 200** reviews. |
| **Also** | Returned in `MarketDataResult`; consumed in `analyzeAgent.ts` (e.g. lines 109, 330, 831, 889) and passed to AI in `openaiService` buildUserPrompt. |

---

## 3. medianReviews

| Item | Value |
|------|--------|
| **Exists?** | **No** |
| **Note** | A generic `median(values: number[])` exists in **marketDataProvider.ts** (line 57) but is **not** used for review counts. **avgReviews** (mean) is computed and returned; there is no median of reviews anywhere in the pipeline. |

---

## 4. reviewDistribution / reviewStructure

| Item | Value |
|------|--------|
| **Exists?** | **Yes** (as a **summary string**, not a structured distribution object). |
| **Exact variable name** | **review_structure_summary** |
| **File** | **client/src/lib/analyze/marketDataProvider.ts** |
| **Where calculated** | Lines 248–259. Bands: 5k+, 1k–5k, 100–1k, under 100. Local vars: `listingsOver5000`, `listings1000To5000`, `listings100To1000`, `listingsUnder100` (from `reviewCounts`). Combined into one string, e.g. `"X listings have 5k+ reviews, Y listings have 1k–5k reviews, ..."`. |
| **Source** | **Derived after parsing** Rainforest results. `reviewCounts` is built from `ratings_total` of each result; the band counts are not returned as separate fields, only the string. |
| **Consumed** | Returned in `MarketDataResult`; used in **analyzeAgent.ts** (350, 838), **openaiService.ts** (403–404), **war-room.tsx** (515, 919, 948). |

---

## 5. sponsoredTop10Count

| Item | Value |
|------|--------|
| **Exists?** | **Yes** |
| **Exact variable name** | **sponsored_top10_count** |
| **File** | **client/src/lib/analyze/marketDataProvider.ts** |
| **Where calculated** | Line 266: `top10.filter((l) => l.sponsored).length` where `top10 = topCompetitors.slice(0, 10)`. |
| **Source** | **Derived after parsing** Rainforest results. Each result has `sponsored`; count of sponsored in first 10. |
| **Consumed** | Returned in `MarketDataResult`; used in **analyzeAgent.ts** (180, 356, 844, 895, 976), **openaiService.ts** (421, 425), **war-room.tsx** (521, 919, 954, 957). Also **analyzeAgent** passes it as `sponsoredTop10` into **calculateDynamicACoS** (openaiService / analyzeAgent). |

---

## 6. brandDistribution / brandCounts

| Item | Value |
|------|--------|
| **Exists?** | **Yes** — both a summary string and a counts object. |
| **Exact variable names** | **brand_distribution_summary** (string), **brandCounts** (Record<string, number>) |
| **File** | **client/src/lib/analyze/marketDataProvider.ts** |
| **Where calculated** | **brandCounts:** lines 188, 232 — `brandCounts[b] = (brandCounts[b] ?? 0) + 1` per listing (brand from result or inferred from title). **brand_distribution_summary:** lines 271–273 — text using `dominantBrand`, `distinctBrandsTop10`, `distinctBrands`. |
| **Source** | **Derived after parsing** Rainforest results. Brand from API or `inferBrandFromTitle(title)`. |
| **Consumed** | **brand_distribution_summary** in **analyzeAgent.ts** (354, 842, 974), **openaiService.ts** (415–416), **war-room.tsx** (519, 919, 952). **brandCounts** in **analyzeAgent.ts** (117, 842) and in marketDataProvider for `dominantBrandNames`; not passed to AI as raw object in buildUserPrompt (only the summary string is). |

---

## 7. priceCompression

| Item | Value |
|------|--------|
| **Exists?** | **Yes** |
| **Exact variable name** | **price_compression** |
| **File** | **client/src/lib/analyze/marketDataProvider.ts** |
| **Where calculated** | Line 279: `price_compression = priceCompressionSentence(pricesForMedian)`. Helper **priceCompressionSentence** (lines 79–97) finds the $5 price band with the most listings and returns a string like `"X listings price between $Y–$Z"`. |
| **Source** | **Derived after parsing** Rainforest results. Uses `topPrices` (from result prices). |
| **Consumed** | Returned in `MarketDataResult`; used in **analyzeAgent.ts** (169–184, 353, 841, 897, 973) for dynamic ACoS and AI input; **openaiService.ts** (412–413); **war-room.tsx** (518, 919, 951). In analyzeAgent, parsed for “high” (≥10 listings in band) and passed as `priceCompression` to **calculateDynamicACoS**. |

---

## 8. keywordSaturationRatio

| Item | Value |
|------|--------|
| **Exists?** | **Yes** |
| **Exact variable name** | **keyword_saturation_ratio** |
| **File** | **client/src/lib/analyze/marketDataProvider.ts** |
| **Where calculated** | Lines 274–277: `keywordInTitleCount = countKeywordInTitles(topTitles, keyword)` then `keyword_saturation_ratio = \`${keywordInTitleCount} of ${n} listings use the main keyword in title.\`` (or `"N/A"`). **countKeywordInTitles** (lines 99–106) checks that each word of the keyword appears in the title. |
| **Source** | **Derived after parsing** Rainforest results. Uses `topTitles` and search `keyword`. |
| **Consumed** | Returned in `MarketDataResult`; used in **analyzeAgent.ts** (163–168, 352, 840, 896, 972) — optionally parsed to numeric `keywordSaturationCount` for dynamic ACoS; **openaiService.ts** (409–410); **war-room.tsx** (517, 919, 950). |

---

## Summary table

| Metric | Exists | Variable name | Calculated in | From Rainforest directly or derived? |
|--------|--------|----------------|---------------|--------------------------------------|
| lowReviewListingsTop10 (<100 in top 10) | No | — | — | — |
| newSellersTop20 | Yes | **newSellersInTop20** | marketDataProvider.ts (line 305) | Derived after parsing |
| medianReviews | No | — | — | — |
| reviewDistribution / reviewStructure | Yes (as string) | **review_structure_summary** | marketDataProvider.ts (252–259) | Derived after parsing |
| sponsoredTop10Count | Yes | **sponsored_top10_count** | marketDataProvider.ts (266) | Derived after parsing |
| brandDistribution / brandCounts | Yes | **brand_distribution_summary**, **brandCounts** | marketDataProvider.ts (271–273, 188/232) | Derived after parsing |
| priceCompression | Yes | **price_compression** | marketDataProvider.ts (279, 79–97) | Derived after parsing |
| keywordSaturationRatio | Yes | **keyword_saturation_ratio** | marketDataProvider.ts (274–277, 99–106) | Derived after parsing |

**Note:** None of these metrics are raw Rainforest API fields. All are **derived** in **client/src/lib/analyze/marketDataProvider.ts** from the parsed `search_results` (prices, ratings_total, sponsored, title, brand, etc.). The only “direct” use of Rainforest is the fetch and the array of results; every signal above is computed in that file after parsing.
