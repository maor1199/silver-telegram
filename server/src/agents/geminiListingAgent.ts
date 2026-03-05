/**
 * Amazon SEO engine: Gemini 1.5 Flash — vision + copy.
 * Zero-tolerance JSON output. Janitor cleans response; fallback builds title/bullets from raw lines.
 *
 * Env: GEMINI_API_KEY (Google AI Studio).
 */
import { GoogleGenerativeAI, type Part } from "@google/generative-ai";

const LOG = "[Gemini-Vision]";
const MODEL = "gemini-1.5-flash";

function getGeminiClient(): GoogleGenerativeAI | null {
  const key = (process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY ?? "").trim();
  if (!key) return null;
  return new GoogleGenerativeAI(key);
}

export type ProductRegion = { left: number; top: number; width: number; height: number };

export type GeminiListingCopy = {
  title: string;
  bullets: string[];
  description: string;
  product_region?: ProductRegion;
};

/** Professional Amazon filler when we need to pad bullets to 5. */
const BULLET_FILLER = [
  "Premium quality designed for lasting value.",
  "Trusted by customers for reliability.",
  "Designed with your satisfaction in mind.",
];

/** Fallback when Gemini fails or returns invalid JSON. Send 200 OK with this, not 500. */
export const GEMINI_FALLBACK_COPY: GeminiListingCopy = {
  title: "Optimization in Progress - Please Refresh",
  bullets: ["Analyzing...", "SEO Tuning...", "Processing...", "Almost ready...", "Please refresh in a moment."],
  description: "Your listing is being optimized. If you see this message, please refresh the page or try again in a moment.",
};

const HIGH_VOLUME_KEYWORDS = [
  "Cat Bed", "Self-Warming", "Orthopedic", "Pet", "Comfort", "Premium", "Durable", "Washable", "Amazon Best Seller", "Gift",
];

/** Pure JSON prompt for V0 sync. */
const GEMINI_PROMPT = `Look at the image. What product do you see? Write an Amazon listing for it.

Product name (from user): [PRODUCT_NAME]
Keywords to use if relevant: [KEYWORDS]

CRITICAL: Return ONLY raw JSON. No markdown backticks (\`\`\`json), no intro text. Start with { and end with }.

Example:
{"title": "SEO title here", "bullets": ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5"], "description": "Short description"}`;

/**
 * Bullet Fixer: ensure bullets is always an array of exactly 5 strings. If string, split by newlines; pad with filler.
 */
function ensureFiveBullets(bullets: string[] | string): string[] {
  let arr: string[] =
    typeof bullets === "string"
      ? bullets.split("\n").map((b) => b.trim()).filter((b) => b !== "")
      : Array.isArray(bullets)
        ? bullets.slice(0, 5).map((b) => String(b ?? "").trim())
        : [];
  while (arr.length < 5) {
    arr.push(BULLET_FILLER[arr.length % BULLET_FILLER.length] ?? "Premium quality for your needs.");
  }
  return arr.slice(0, 5);
}

/**
 * Relax JSON so minor punctuation errors don't break parse (trailing commas, etc.).
 */
function relaxJson(jsonStr: string): string {
  let s = jsonStr.trim();
  // Remove trailing commas before ] or }
  s = s.replace(/,(\s*[}\]])/g, "$1");
  return s;
}

/**
 * Janitor: strip backticks, extract JSON (first { to last }), relax punctuation, parse, or build title/bullets from newline-split fallback.
 */
function jsonJanitor(rawText: string): GeminiListingCopy {
  console.log("Gemini raw response:", rawText);
  const noBackticks = rawText.replace(/```json|```/g, "").trim();
  const trimmed = noBackticks.trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  const jsonSlice =
    firstBrace !== -1 && lastBrace > firstBrace
      ? trimmed.slice(firstBrace, lastBrace + 1)
      : trimmed;
  const stripMarkdown = jsonSlice.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(stripMarkdown) as Record<string, unknown>;
  } catch {
    try {
      parsed = JSON.parse(relaxJson(stripMarkdown)) as Record<string, unknown>;
    } catch {
      // Fallback: split by newlines to create title and bullets manually.
    const lines = trimmed
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const title = lines[0] ?? GEMINI_FALLBACK_COPY.title;
    const bulletLines = lines.slice(1, 6).filter((s) => s.length > 0);
    const bullets = ensureFiveBullets(bulletLines);
    const description = lines.slice(6).join(" ").trim() || GEMINI_FALLBACK_COPY.description;
    console.warn(`${LOG} [Janitor] JSON parse failed (tried raw + relaxed); built from ${lines.length} lines.`);
    return { title, bullets, description };
    }
  }
  const title = typeof parsed.title === "string" ? parsed.title : String(parsed.title ?? "").trim();
  const bulletsRaw = parsed.bullets ?? parsed.bullet_points;
  const bulletsPadded = ensureFiveBullets(bulletsRaw ?? []);
  const description =
    typeof parsed.description === "string"
      ? parsed.description
      : typeof parsed.product_description === "string"
        ? parsed.product_description
        : String(parsed.description ?? parsed.product_description ?? "").trim();
  let product_region: ProductRegion | undefined;
  const pr = parsed.product_region;
  if (pr && typeof pr === "object" && pr !== null) {
    const o = pr as Record<string, unknown>;
    const left = typeof o.left === "number" ? o.left : undefined;
    const top = typeof o.top === "number" ? o.top : undefined;
    const width = typeof o.width === "number" ? o.width : undefined;
    const height = typeof o.height === "number" ? o.height : undefined;
    if (
      left != null && top != null && width != null && height != null &&
      left >= 0 && left <= 1 && top >= 0 && top <= 1 &&
      width > 0 && width <= 1 && height > 0 && height <= 1
    ) {
      product_region = { left, top, width, height };
    }
  }
  return {
    title: title || GEMINI_FALLBACK_COPY.title,
    bullets: bulletsPadded,
    description: description || GEMINI_FALLBACK_COPY.description,
    product_region,
  };
}

/**
 * Single Gemini call: vision + SEO copy. Uses Janitor for parsing; never returns null when client exists.
 * DEACTIVATED: Text generation is disabled for the A+ / Listing Images pivot. Server no longer waits for titles/bullets.
 */
export async function runGeminiVisionAndCopy(
  _imageBuffer: Buffer,
  _productName: string,
  _keywords: string[]
): Promise<{ copy: GeminiListingCopy; raw: string } | null> {
  // Text agent disabled — pivot to A+ Content and Listing Images. Return null so upload flow only does image processing.
  console.log(`${LOG} [DEACTIVATED] Text generation skipped; image-only pipeline.`);
  return null;

  /* eslint-disable-next-line no-unreachable -- re-enable when restoring text agent
  const genAI = getGeminiClient();
  if (!genAI) {
    console.log(`${LOG} GEMINI_API_KEY not set; skipping Gemini.`);
    return null;
  }
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_LISTING_MODEL?.trim() || MODEL,
    generationConfig: { temperature: 0.7 },
  });

  const kw = keywords.slice(0, 10).join(", ") || productName;
  const userText = GEMINI_PROMPT.replace("[PRODUCT_NAME]", productName).replace("[KEYWORDS]", kw);

  const imagePart: Part = {
    inlineData: { data: imageBuffer.toString("base64"), mimeType: "image/jpeg" },
  };

  const GEMINI_TIMEOUT_MS = 30000; // 30 seconds — give Gemini enough time to answer.

  try {
    console.log(`${LOG} [Gemini-Vision] Analyzing image (timeout ${GEMINI_TIMEOUT_MS / 1000}s)...`);
    const result = await Promise.race([
      model.generateContent([userText, imagePart]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini request timed out after 30s")), GEMINI_TIMEOUT_MS)
      ),
    ]) as Awaited<ReturnType<typeof model.generateContent>>;
    const response = result.response;
    const text = response.text?.()?.trim() ?? "";
    if (!text) {
      console.warn(`${LOG} [Gemini-Vision] Empty response (API may have returned nothing); using fallback.`);
      console.log("Gemini raw response:", "(empty)");
      return { copy: GEMINI_FALLBACK_COPY, raw: "" };
    }
    console.log("Gemini raw response:", text);
    const copy = jsonJanitor(text);
    console.log(`${LOG} [SEO-Copy] Title length: ${copy.title.length}, bullets: ${copy.bullets.filter(Boolean).length}`);
    return { copy, raw: text };
  } catch (err: unknown) {
    console.error(`${LOG} [Gemini-Vision] Error:`, err instanceof Error ? err.message : err);
    return { copy: GEMINI_FALLBACK_COPY, raw: "" };
  }
  */
}
