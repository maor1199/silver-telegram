/**
 * High-End Amazon SEO Listing Builder using OpenAI GPT-4o-mini.
 * Env: OPENAI_API_KEY.
 */
import OpenAI from "openai";

const LOG = "[OpenAI-Listing]";
const MODEL = "gpt-4o-mini";

function getOpenAIClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

const SEO_SYSTEM_PROMPT = `You are an Aggregator Intelligence engine: a world-class Amazon SEO & PPC Specialist and the "Monster" conversion engine. Your goal is to dominate the A9 algorithm with long-form, high-end copy and to deliver a data-driven GO/NO-GO verdict.

CRITICAL — 100% DYNAMIC OUTPUT. STRICTLY FORBIDDEN:
- Pre-written templates, fill-in-the-blank phrases, or canned text.
- Any product-agnostic placeholders (e.g., "durability gap", "coffee pods") reused across different products.
- Hardcoded examples from this prompt copied into the response.
Every field MUST be uniquely generated from the specific product input. Adapt all language to the exact product, niche, and keywords provided.

VOCABULARY & TONE: Be aggressive, expert, and premium. Use: Industrial-Strength, Surgical-Grade, Architectural Design, Unrivaled, Master-Crafted, Eco-Conscious Durability, Life-Changing. Forbid "Good", "Nice", "Premium" (unless "Premium-Grade"). Adapt terms to the product (e.g., Whisker-Friendly for pet products; not for mugs).

---

1. BRAND LOGIC (MANDATORY — NO FAKE BRANDS)
- NEVER invent a brand name.
- If brandName provided: use it EXACTLY as the first word in the Title and in the Description.
- If brandName NOT provided: use the literal placeholder [YOUR_BRAND] as the first token in the Title (e.g., "[YOUR_BRAND] [Product Type] [Main Benefit]...").

---

2. MASSIVE TITLE (190-200 characters) — CUSTOMER-FACING ONLY
Use the FULL space. Structure: [Brand or YOUR_BRAND] [Main Keyword] - [High Volume LSI] | [Emotional Benefit] | [Technical Spec] | [Target Audience/Size]. First 80 chars = keyword-heavy for mobile.
FORBIDDEN in the title (never include): "Strong Variants", "A9", "Golden 80", "Golden 80 Indexing", "algorithm", "indexing", "LSI", "PPC", "SEO", "Strategic Intelligence", "Market Reality", "canonical", "backend search terms", "Exact Match", "Manual Launch". The title is for buyers only—no internal or strategy jargon. Technical SEO terms belong ONLY in strategicIntelligence and seoNote, never in title or bullets.

---

3. DEEP PSYCHOLOGY BULLETS (300+ characters EACH) — CUSTOMER-FACING ONLY
Each bullet = full PARAGRAPH, min 300 chars. Format: [SHOUTING HOOK]: [Agony] + [Solution] + [Transformation]. Headers: ALL CAPS, product-specific (e.g., for a mug: THERMAL RETENTION; for pet bed: ODOR CONTROL). Return 5 objects with "header" and "content".
FORBIDDEN in bullets (never include): "A9", "Golden 80", "PPC", "LSI", "Strong Variants", "algorithm", "indexing", "SEO", "Strategic Intelligence", "Market Reality", "backend search terms". Bullets are sales copy for buyers only. Technical/strategy jargon belongs ONLY in strategicIntelligence and seoNote.

---

4. HTML SALES LETTER DESCRIPTION
- Start with <h3>WHY YOUR [CUSTOMER] NEEDS THE [PRODUCT]</h3>. Use <strong> for every major benefit.
- Story tailored to the product. Include <ul>/<li> for specs or "Package Includes."
- End with a powerful CTA adapted to the product (e.g., "Click Add to Cart now!").

---

5. SEO NOTE (seoNote — MANDATORY, NEVER OMIT)
Generate the seoNote using the 4-pillar structure (GOLDEN 80, PPC EXACT, SEMANTIC GAP, MARKET COUNTER-ATTACK) as the very first part of your strategic analysis. seoNote must be a single string, formatted with clear headers. Act as a Senior Amazon Brand Manager. EVERY sentence must refer to the actual product and keywords—no generic templates.

--- GOLDEN 80 INDEXING ---
Name the exact primary keywords YOU placed in the first 80 characters of the Title for this product. Explain Mobile Canonical URL and A9 relevance for THIS listing.

--- STRATEGIC PLACEMENT / PPC EXACT MATCH ---
From the provided keywords for THIS product, pick the top 3 high-intent terms. Mark as "Recommended for Manual Exact Launch".

--- SEMANTIC GAP AUDIT ---
Confirm 100% of the provided keywords were used. List which terms were moved to the 249-byte backend for THIS product to protect CTR.

--- MARKET COUNTER-ATTACK ---
Justify the first bullet's hook for THIS product by naming a product-specific competitor weakness.

At the very end: BACKEND SEARCH TERMS (Copy to Seller Central): [paste backendSearchTerms].

---

6. STRATEGIC INTELLIGENCE FIELDS (Uniquely Generated — No Templates)
- marketReality: 2-3 sentences on the CURRENT market for this exact product (demand, competition, trends). Product-specific.
- strategicIntelligence: 2-3 sentences on why this listing will win (positioning, differentiators). Product-specific.
- executionPlan: 2-3 actionable steps for launch (PPC, reviews, promotions). Product-specific.
- risks: 1-2 product-specific risks (e.g., saturation, seasonality).
- opportunities: 1-2 product-specific opportunities (e.g., underserved segment, trend).

---

7. VERDICT LOGIC (Aggregator Intelligence — Calculated, Not Hardcoded)
- 15% net margin rule: A product is viable only if estimated net margin (after fees, COGS, and typical PPC) is at least 15%. Use this rule when deciding GO vs NO-GO.
- estimatedMargin: string, e.g., "25-35%" or "12%" based on typical margins for this product type. Be specific.
- verdict: "GO" or "NO-GO". Compute from the generated risks and estimatedMargin. Apply the 15% net margin rule: if estimated net margin is below 15%, verdict must be NO-GO. If risks are low and margin meets or exceeds 15%, use GO. Never default to GO without justifying margin and risks.

---

8. BACKEND SEARCH TERMS
Generate "backendSearchTerms": 249 characters of LSI keywords NOT in the title. Spaces only, no commas. Product-specific.

---

9. JSON OUTPUT — REQUIRED SCHEMA (all keys mandatory, never omit)
Return ONLY a valid JSON object. No intro, no outro, no markdown. You MUST include every key below.
{
  "title": "...",
  "bulletPoints": [{"header": "...", "content": "..."}, {"header": "...", "content": "..."}, {"header": "...", "content": "..."}, {"header": "...", "content": "..."}, {"header": "...", "content": "..."}],
  "description": "...",
  "seoNote": "...",
  "marketReality": "...",
  "strategicIntelligence": "...",
  "executionPlan": "...",
  "risks": "...",
  "opportunities": "...",
  "estimatedMargin": "...",
  "verdict": "GO or NO-GO",
  "backendSearchTerms": "..."
}`;

export type GeminiListingRequest = {
  productName: string;
  productDescription: string;
  keywords: string[];
  /** If provided, use exactly as first word in Title and in Description. If missing, Title must start with [YOUR_BRAND]. */
  brandName?: string;
  /** Optional market context (e.g. from /api/analyze) for GO/NO-GO and margin analysis. */
  marketData?: Record<string, unknown> | string;
  /** Optional financials (price, unitCost, shipping, etc.) for 15% net margin rule. */
  financials?: Record<string, unknown> | string;
};

export type GeminiListingResponse = {
  title: string;
  bulletPoints: string[];
  description: string;
  seoNote?: string;
  backendSearchTerms?: string;
  marketReality?: string;
  strategicIntelligence?: string;
  executionPlan?: string;
  risks?: string;
  opportunities?: string;
  estimatedMargin?: string;
  verdict?: "GO" | "NO-GO";
  keywordsUsed?: string[];
};

export async function generateListingWithGemini(
  input: GeminiListingRequest
): Promise<GeminiListingResponse> {
  console.log("🤖 ENTERING OPENAI LISTING FUNCTION (Gemini route now backed by OpenAI)");
  const openai = getOpenAIClient();
  if (!openai) {
    const msg = "OPENAI_API_KEY is not set. Set it in .env to generate listings.";
    console.error(`${LOG} ${msg}`);
    throw new Error(msg);
  }

  const { productName, productDescription } = input;

  const keywordsArray =
    Array.isArray(input.keywords)
      ? input.keywords
          .map((k) => (k ?? "").toString().trim())
          .filter(Boolean)
      : typeof input.keywords === "string"
        ? (input.keywords as string)
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        : [];

  const keywordsLine = keywordsArray.join(", ");
  const brandName = typeof input.brandName === "string" ? input.brandName.trim() : undefined;

  const marketDataStr =
    input.marketData == null
      ? ""
      : typeof input.marketData === "string"
        ? input.marketData
        : JSON.stringify(input.marketData);
  const financialsStr =
    input.financials == null
      ? ""
      : typeof input.financials === "string"
        ? input.financials
        : JSON.stringify(input.financials);

  const userPrompt = [
    `Product Name: ${productName || "(not provided)"}`,
    `Product Description: ${productDescription || "(not provided)"}`,
    `Target Keywords: ${keywordsLine || "(none)"}`,
    brandName
      ? `Brand Name: ${brandName} (use this EXACTLY as the first word in the Title and naturally in the Description; do not invent any other brand)`
      : "Brand Name: NOT PROVIDED — you MUST use the literal placeholder [YOUR_BRAND] as the first token in the Title. Do not invent a brand name.",
    marketDataStr ? `\nMarket Data (use for verdict and marketReality):\n${marketDataStr}` : "",
    financialsStr ? `\nFinancials (use for 15% net margin rule and estimatedMargin):\n${financialsStr}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const OPENAI_TIMEOUT_MS = 60000;

  try {
    console.log("--- DATA PREPPED FOR OPENAI ---", {
      productName: input.productName,
      keywordsCount: keywordsArray.length,
    });
    console.log(`${LOG} User prompt preview:`, userPrompt.substring(0, 400) + "...");
    console.log("🚀 TRYING OPENAI WITH GPT-4O-MINI...");
    console.log("Using NEW API KEY - Sending request...");
    console.log("--- ATTEMPTING OPENAI CALL ---");
    console.log(`${LOG} Sending request to OpenAI...`);
    
    const completion = (await Promise.race([
      openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: SEO_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      } as any),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("OpenAI prompt generation timed out.")), OPENAI_TIMEOUT_MS)
      ),
    ])) as any;

    const text = completion.choices?.[0]?.message?.content?.trim() ?? "";
    console.log(`${LOG} Raw text from OpenAI:`, text.substring(0, 400) + "...");

    if (!text) {
      const msg = "OpenAI returned an empty response. No listing content was generated.";
      console.error(`${LOG} ${msg}`);
      throw new Error(msg);
    }

    // Extract JSON from response: handle triple-backtick wrapping (e.g. ```json ... ``` or ``` ... ```)
    let jsonCandidate = text;
    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      jsonCandidate = jsonBlockMatch[1].trim();
    }
    jsonCandidate = jsonCandidate.replace(/^```json|^```|```$/gi, "").trim();
    console.log(`${LOG} Cleaned JSON candidate:`, jsonCandidate.substring(0, 400) + "...");

    let parsedRaw: Record<string, unknown>;
    try {
      parsedRaw = JSON.parse(jsonCandidate) as Record<string, unknown>;
    } catch (err) {
      const parseMsg = err instanceof Error ? err.message : String(err);
      console.error("JSON Parse Error:", err, "Raw text:", text);
      throw new Error(`AI returned invalid JSON. Listing generation failed. Parse error: ${parseMsg}`);
    }

    let title = typeof parsedRaw.title === "string" ? parsedRaw.title.trim() : "";
    // Strip strategy/algorithm jargon so listing page stays clean
    const stripFromTitle = /\s*[-–|]\s*Strong Variants\s*[-–|]?|\s*Strong Variants\s*|\s*A9\s+Algorithm\s*|\s*Golden\s*80\s*|\s*Strategic\s+Intelligence\s*[:.]?\s*|\s*Market\s+Reality\s*[:.]?\s*|\s*\(?\s*SEO[^)]*\)?\s*|\s*\(?\s*LSI[^)]*\)?\s*|\s*—\s*Indexing[^|]*/gi;
    title = title.replace(stripFromTitle, " ").replace(/\s+/g, " ").replace(/^\s*[-–|]\s*|\s*[-–|]\s*$/g, "").trim();
    if (!title) {
      throw new Error("AI response missing or invalid 'title'. Cannot return generic fallback.");
    }

    // Brand validation: no fake brands. If brandName provided, title must start with it; if not, title must contain [YOUR_BRAND].
    const providedBrand = typeof input.brandName === "string" ? input.brandName.trim() : undefined;
    const firstWord = title.split(/\s+/)[0] ?? "";
    if (providedBrand) {
      if (firstWord !== providedBrand) {
        throw new Error(
          `Brand validation failed: title must start with the provided brand "${providedBrand}". Got: "${firstWord}". Do not use a different or invented brand.`
        );
      }
    } else {
      if (!title.includes("[YOUR_BRAND]")) {
        throw new Error(
          "Brand validation failed: no brand was provided, so title must include the placeholder [YOUR_BRAND]. The AI may have invented a brand name—refusing to return it."
        );
      }
    }

    // Normalize bulletPoints: expect 5 objects with header + content; join as "HEADER: Content" for frontend
    let bulletPoints: string[] = [];
    const rawBullets = parsedRaw.bulletPoints as unknown;
    if (Array.isArray(rawBullets) && rawBullets.length === 5) {
      const hasHeaderContent = rawBullets.every(
        (b) => b && typeof b === "object" && "header" in (b as object) && "content" in (b as object)
      );
      if (hasHeaderContent) {
        bulletPoints = (rawBullets as { header?: string; content?: string }[]).map((b) => {
          const header = String(b.header ?? "").trim().toUpperCase();
          const content = String(b.content ?? "").trim();
          return header ? `${header}: ${content}` : content;
        });
      } else if (rawBullets.every((b) => typeof b === "string")) {
        bulletPoints = rawBullets as string[];
      }
    }
    if (bulletPoints.length !== 5) {
      throw new Error(
        `AI response must have exactly 5 bullet objects with header and content. Got ${bulletPoints.length} valid bullets.`
      );
    }
    // Strip technical/strategy jargon from bullets so listing stays customer-only (A9, PPC, LSI belong in strategicIntelligence only)
    const stripJargon = (s: string) =>
      s
        .replace(/\s*A9\s+Algorithm\s*/gi, " ")
        .replace(/\s*Golden\s*80\s*(Indexing)?\s*/gi, " ")
        .replace(/\s*Strategic\s+Intelligence\s*[:.]?\s*/gi, " ")
        .replace(/\s*Market\s+Reality\s*[:.]?\s*/gi, " ")
        .replace(/\s*Strong\s+Variants\s*/gi, " ")
        .replace(/\s*\bPPC\s+(?:Exact|Launch|keywords?)\s*/gi, " ")
        .replace(/\s*\bLSI\s+(?:keywords?|terms?)\s*/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
    bulletPoints = bulletPoints.map(stripJargon);

    const description = typeof parsedRaw.description === "string" ? parsedRaw.description.trim() : "";
    if (!description) {
      throw new Error("AI response missing or invalid 'description'. Cannot return generic fallback.");
    }

    const seoNote =
      typeof parsedRaw.seoNote === "string" ? parsedRaw.seoNote.trim() : "";
    const backendSearchTerms =
      typeof parsedRaw.backendSearchTerms === "string"
        ? parsedRaw.backendSearchTerms.trim().slice(0, 249)
        : undefined;

    const marketReality =
      typeof parsedRaw.marketReality === "string" ? parsedRaw.marketReality.trim() : undefined;
    const strategicIntelligence =
      typeof parsedRaw.strategicIntelligence === "string" ? parsedRaw.strategicIntelligence.trim() : undefined;
    const executionPlan =
      typeof parsedRaw.executionPlan === "string" ? parsedRaw.executionPlan.trim() : undefined;
    const risks =
      typeof parsedRaw.risks === "string" ? parsedRaw.risks.trim() : undefined;
    const opportunities =
      typeof parsedRaw.opportunities === "string" ? parsedRaw.opportunities.trim() : undefined;
    const estimatedMargin =
      typeof parsedRaw.estimatedMargin === "string" ? parsedRaw.estimatedMargin.trim() : undefined;
    const verdict =
      parsedRaw.verdict === "GO" || parsedRaw.verdict === "NO-GO" ? parsedRaw.verdict : undefined;

    console.log(`${LOG} Success! Listing generated.`);
    console.log("✅ Success! Returning Monster listing data (no fallback).");
    const result: GeminiListingResponse = {
      title,
      bulletPoints,
      description,
      seoNote: seoNote || "",
      backendSearchTerms,
      marketReality,
      strategicIntelligence,
      executionPlan,
      risks,
      opportunities,
      estimatedMargin,
      verdict,
      keywordsUsed: [],
    };
    return { ...result, seoNote: result.seoNote || "" };
  } catch (err) {
    console.log("Full OpenAI Error:", err);
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${LOG} Error during generation:`, message);
    // Propagate the error so the route handler can return it to the client
    throw err instanceof Error ? err : new Error(String(err));
  }
}