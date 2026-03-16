# SellerMentor — Analysis Logic Reference

---

## 0. Viability Score — Exact Calculation

**Location:** `client/src/lib/analyze/analyzeAgent.ts` (lines 230–266)

### Factors and points

| Factor | Condition | Points | Notes |
|--------|-----------|--------|--------|
| **Base** | — | **50** | Starting score. |
| **profitAfterAds** | ≥ $25/unit | **+20** | Strong unit economics. |
| | ≥ $15/unit | **+10** | Good. |
| | ≥ $8/unit | **+2** | Marginal. |
| | &lt; $8/unit | **−18** | Weak. |
| **avgReviews** (only if `hasRealMarketData`) | &lt; 500 | **+8** | Low barrier. |
| | &lt; 2000 | **+3** | Moderate barrier. |
| | ≥ 2000 | **−5** | High barrier. |
| **dominantBrand** (only if `hasRealMarketData`) | `false` | **+5** | Fragmented market. |
| | `true` | **0** | No change. |

### Final formula

```
score = 50
       + (profitAfterAds >= 25 ? 20 : profitAfterAds >= 15 ? 10 : profitAfterAds >= 8 ? 2 : -18)
       + (hasRealMarketData ? (avgReviews < 500 ? 8 : avgReviews < 2000 ? 3 : -5) : 0)
       + (hasRealMarketData && !dominantBrand ? 5 : 0)
score = clamp(round(score), 1, 99)
```

So: **score = base 50 + profit tier + review tier (if real data) + dominantBrand bonus (if real data, no dominant brand), then rounded and clamped to 1–99.**

### Do Rainforest signals affect the score or verdict?

- **Directly in the score:**  
  - **avgReviews** — review tier (+8 / +3 / −5) when `hasRealMarketData`.  
  - **dominantBrand** — +5 when market is fragmented (when `hasRealMarketData`).  
  - **hasRealMarketData** — gates the review and dominantBrand adjustments; without it, only profit tier applies.

- **Indirectly (via profitAfterAds → score):**  
  - **profitAfterAds** depends on **assumedAcos** (and thus PPC cost).  
  - **assumedAcos** = max(assumedAcosRaw, **acosFloor**, effectiveLaunchAcos).  
  - **acosFloor:** uses **competitorsWithOver1000Reviews** (Rainforest): ≥3 → 0.45, else 0.25; if differentiation is weak, at least 0.5.  
  - **effectiveLaunchAcos** uses **avgReviews** (Rainforest) to set base CPC and thus launch ACoS.  
  - **assumedAcosRaw** (when stage = launch) can use **dynamicAcosForMarket**, which uses: **sponsored_top10_count**, **avgReviews**, **new_seller_presence**, **keyword_saturation_ratio**, **price_compression**.  

So: **keyword saturation, sponsored density, price compression** affect the score only **indirectly** (through ACoS → profitAfterAds → profit tier). They do **not** have their own dedicated score buckets.

- **Review structure:**  
  - **review_structure_summary** (the text like "X listings have 5k+ reviews...") is **not** used in the score or verdict.  
  - Only the **numeric** **avgReviews** (and, for ACoS, review-based CPC) is used.

- **Verdict:**  
  - **passesMarginRule** (net margin ≥ threshold) → can be GO or CONDITIONAL_GO; else **NO_GO**.  
  - Margin uses selling price, costs, and threshold (complexity/differentiation); no Rainforest field is used **directly** in the margin formula.  
  - Rainforest affects verdict only **indirectly** by affecting **profitAfterAds** (hence **score**) and, via ACoS, **net margin** (hence **passesMarginRule**).

**Summary table**

| Rainforest signal | In score? | In verdict? |
|-------------------|-----------|-------------|
| **avgReviews** | Yes (direct: +8/+3/−5; indirect: via ACoS → profitAfterAds) | Indirect (via margin if ACoS changes) |
| **dominantBrand** | Yes (direct: +5 or 0) | No |
| **competitorsWithOver1000Reviews** | Indirect (acosFloor → ACoS → profitAfterAds) | Indirect (via margin) |
| **sponsored_top10_count** | Indirect (dynamicAcosForMarket → assumedAcos → profitAfterAds) | Indirect |
| **keyword_saturation_ratio** | Indirect (same as above) | Indirect |
| **price_compression** | Indirect (same as above) | Indirect |
| **new_seller_presence** | Indirect (same as above) | Indirect |
| **review_structure_summary** | **No** | **No** |

---

## 1. תנאי GO / CONDITIONAL_GO / NO_GO (בפועל)

**מיקום:** `client/src/lib/analyze/analyzeAgent.ts` (שורות 273–274)

```ts
let verdict: "GO" | "CONDITIONAL_GO" | "NO_GO" =
  !passesMarginRule ? "NO_GO" : score >= 55 ? "GO" : "CONDITIONAL_GO"
```

**לוגיקה:**

| תנאי | Verdict |
|------|--------|
| `passesMarginRule === false` | **NO_GO** (גובר על הכל) |
| `passesMarginRule === true` **ו-** `score >= 55` | **GO** |
| `passesMarginRule === true` **ו-** `score < 55` | **CONDITIONAL_GO** |

**`passesMarginRule`:**
- `netMarginRatio >= NET_MARGIN_THRESHOLD`
- `netMarginRatio` = `profitAfterAds / sellingPrice` (מרווח נטו אחרי פרסום, באחוזים)
- **NET_MARGIN_THRESHOLD:**
  - אם **מורכבות = "complex"** (או "high") → **20%**
  - אחרת → **effectiveMarginThreshold** (ברירת מחדל **15%**; מגיע מ־`input.marginThreshold` או מ־`getMarginThreshold(...)`)

**חישוב הציון (score):**
- התחלה: 50.
- **profitAfterAds:** ≥25 → +20; ≥15 → +10; ≥8 → +2; אחרת → -18.
- **אם יש דאטה שוק אמיתי (hasRealMarketData):**
  - **avgReviews:** <500 → +8; <2000 → +3; אחרת → -5.
  - **dominantBrand:** false → +5; true → 0.
- ציון סופי: מוגבל ל־1–99.

**סיכום:**  
NO_GO = כישלון במבחן המרווח (מתחת ל־15% או 20%); אחרת GO רק אם ציון ≥55, אחרת CONDITIONAL_GO.

---

## 2. מה נשלח ל־AI בכל ניתוח

**מיקום:** `client/src/lib/analyze/openaiService.ts` — `buildUserPrompt(input)` בונה את ה־user message; ה־system message הוא `SYSTEM_PROMPT` (קבוע).

**ה־input ל־getAIInsights (aiInput)** נבנה ב־`analyzeAgent.ts` (שורות 317–357) ונשלח כ־user prompt:

| שדה | מקור |
|-----|------|
| `keyword` | מהמשתמש |
| `sellingPrice` | מהמשתמש |
| `unitCost` | effectiveUnitCost (unitCost + buffer לפי מורכבות) |
| `shippingCost` | מהמשתמש |
| `profitAfterAds` | מחושב (מחיר − עלויות − PPC) |
| **`verdict`** | **GO / CONDITIONAL_GO / NO_GO** (מחושב מראש) |
| `avgPrice`, `avgRating`, `avgReviews` | Rainforest (או ברירת מחדל) |
| `dominantBrand`, `newSellersInTop10`, `newSellersInTop20` | Rainforest |
| `topTitles`, `topPrices` | Rainforest |
| **`differentiation`** | **תשובת המשתמש** (טקסט חופשי) |
| **`complexity`** | **תשובת המשתמש** (simple/medium/complex וכו') |
| `product_vs_market` | מחושב ב־analyzeAgent (price_position, review_barrier, advertising_environment, **differentiation_strength**, **product_risk**) |
| `landed_cost`, `estimated_margin`, `estimated_roi` | מחושבים |
| `topCompetitors` | Rainforest (עם position, title, price, ratingsTotal, rating, brand, sponsored) |
| `painPoints` | Rainforest (מופק מ־topTitles) |
| `review_structure_summary` | Rainforest |
| `new_seller_presence` | Rainforest |
| `keyword_saturation_ratio` | Rainforest |
| `price_compression` | Rainforest |
| `brand_distribution_summary` | Rainforest |
| `market_maturity_signal` | Rainforest |
| `sponsored_top10_count`, `sponsored_total_count` | Rainforest |

**product_vs_market.differentiation_strength** (מחושב לפני שליחה ל־AI):
- אורך differentiation ≥50 **ו**־מזכיר pain point → "Strong: user described differentiation that aligns with market pain points."
- אורך ≥20 → "Moderate: some differentiation; could be sharper for conversion."
- אחרת → "Weak or missing; generic positioning increases PPC cost and risk."

**product_vs_market.product_risk** (לפי מורכבות):
- high → "High complexity: returns and QC buffer (12%) applied; ..."
- medium → "Moderate complexity: 8% buffer; ..."
- אחרת → "Lower complexity; standard margin rules apply."

כל זה נשלח ל־OpenAI יחד עם ה־SYSTEM_PROMPT (הוראות היועץ, מבנה JSON, איסור חזרות, התנהגות לפי verdict).

---

## 3. שדות שנמשכים מ־Rainforest

**מיקום:** `client/src/lib/analyze/marketDataProvider.ts` — פונקציית `getMarketData(keyword)` קוראת ל־Rainforest Search API וממפה את `search_results` לאובייקט שוק.

**שדות שמוחזרים (ומשמשים כ־marketData / input.marketData):**

| שדה | איך מחושב |
|-----|-----------|
| `success` | true אם יש search_results |
| `avgPrice` | ממוצע מחירים מהתוצאות |
| `avgRating` | ממוצע דירוג |
| `avgReviews` | ממוצע מספר ביקורות |
| `dominantBrand` | האם מותג אחד מופיע ב־≥40% מהתוצאות |
| `topTitles` | רשימת כותרות (עד SERP_SIZE) |
| `topPrices` | רשימת מחירים |
| `topCompetitors` | מערך עם position, title, price, ratingsTotal, rating, brand, sponsored |
| `newSellersInTop10` | כמה מתוך 10 הראשונים עם <200 ביקורות |
| `newSellersInTop20` | כמה מתוך 20 הראשונים עם <200 ביקורות |
| `painPoints` | מופק מ־topTitles (extractPainPointsFromTitles) |
| `competitorsWithOver1000Reviews` | ספירה |
| `priceMin`, `priceMax` | מ־topPrices |
| `sponsoredShare` | sponsoredCount / n |
| `brandCounts`, `dominantBrandNames` | מספור מותגים ורשימת מותגים דומיננטיים |
| `review_structure_summary` | טקסט מסוג "X listings have 5k+ reviews, Y have 1k–5k, ..." |
| `new_seller_presence` | "high" / "moderate" / "low" לפי מספר רשימות עם <200 ביקורות |
| `keyword_saturation_ratio` | "X of N listings use the main keyword in title." |
| `price_compression` | משפט על דחיסת מחירים (מחושב מ־pricesForMedian) |
| `brand_distribution_summary` | משפט על ריכוז/פיזור מותגים |
| `market_maturity_signal` | "mature" / "emerging" / "growing" לפי ביקורות ו־dominantBrand |
| `sponsored_top10_count` | כמה sponsored ב־10 הראשונים |
| `sponsored_total_count` | סה"כ sponsored בדף |

**המקור ל־API:** `client/src/app/api/analyze/route.ts` קורא ל־`getMarketData(keyword)` ומעביר את התוצאה כ־`marketData` ל־`analyzeProduct(...)`.

---

## 4. איפה בידול (Differentiation) ומורכבות (Complexity) נכנסים ללוגיקה

### מורכבות (Complexity)

| מקום | השפעה |
|------|--------|
| **effectiveUnitCost** | buffer: high → 12%, medium → 8%, אחרת → 0. מוסיף ל־unitCost לפני חישוב COGS ו־profitAfterAds. |
| **NET_MARGIN_THRESHOLD** | אם `complexity === "complex"` (או "high") → סף מרווח **20%**; אחרת 15%. משפיע ישירות על `passesMarginRule` ולכן על **NO_GO**. |
| **acosFloor** | לא משתנה ישירות ממורכבות; מושפע מבידול (ראו למטה). |
| **product_vs_market.product_risk** | טקסט ל־AI: high/medium/low complexity + buffer. |
| **פרומפט OpenAI** | QUESTION 6 — PRODUCT COMPLEXITY: Simple/Moderate/Complex עם return rate buffer, ACoS, ו־advisor_implication ל־EXPERT_INSIGHT. |

כלומר: מורכבות משפיעה על **עלות יחידה**, על **סף המרווח ל־NO_GO** ועל **הטקסט שה־AI מקבל**.

### בידול (Differentiation)

| מקום | השפעה |
|------|--------|
| **effectiveMarginThreshold** | `getMarginThreshold(differentiation, topTitles, painPoints)` — בפועל **validateDifferentiators** מחזיר תמיד `marginImpact: 0`, ולכן הסף נשאר **15%** (או מה שה־API מעביר ב־input.marginThreshold). הבידול **לא** משנה כרגע את אחוז הסף. |
| **acosFloor** | אם `differentiationInput.length < 50` → acosFloor מוגבר ל־לפחות 0.5. משפיע על חישובי ACoS ותצוגה. |
| **differentiationScore** | "Weak" אם אורך <100 או לא מזכיר pain point; אחרת "Strong". לתצוגה ו־gapTip. |
| **product_vs_market.differentiation_strength** | Strong/Moderate/Weak לפי אורך + pain points — **נשלח ל־AI**. |
| **validatedDifferentiators** | רשימת פריטים מ־differentiation (split by comma); כרגע **appearsInTitles / appearsInPainPoints / verdict / marginImpact** לא ממומשים (תמיד 0 / PENDING). משמש לתצוגת "Differentiation Verdict" ב־war-room. |
| **buildUserPrompt** | הטקסט של differentiation + validatedDiffs + margin threshold נשלחים ל־AI. |
| **פרומפט OpenAI** | QUESTION 5 — COMPETITIVE ADVANTAGE: השוואת בידול ל־top 15 titles ו־pain points, איפה לשים (title/image 1/bullet). |

כלומר: בידול משפיע על **רמת ACoS המינימלית**, על **הטקסט והמבנה שנשלחים ל־AI** ועל **תצוגת בידול**. הוא **לא** משנה בפועל את אחוז סף המרווח (15%) כי `marginImpact` לא מחושב עדיין.

---

## 5. סיכום קצר

- **GO / CONDITIONAL_GO / NO_GO:** נקבעים לפי `passesMarginRule` (מרווח נטו ≥ 15% או 20% למורכב) ולפי ציון 1–99 (≥55 = GO, <55 = CONDITIONAL_GO).
- **מה נשלח ל־AI:** כל ה־aiInput (כלכלה, verdict, שוק Rainforest, בידול, מורכבות, product_vs_market) + SYSTEM_PROMPT.
- **Rainforest:** כל שדות ה־marketData למעלה נמשכים מ־getMarketData (Search API) ומעובדים ב־marketDataProvider.
- **בידול:** נכנס ל־ACoS floor, ל־product_vs_market, ל־prompt ולתצוגה; **לא** ל־סף המרווח בפועל (כי marginImpact = 0).
- **מורכבות:** נכנסת ל־עלות יחידה, ל־סף 20% ל־NO_GO, ול־product_risk בפרומפט.
