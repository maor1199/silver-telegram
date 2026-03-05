import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import Replicate from "replicate";

function getOpenAIClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

function getAnthropicClient(): Anthropic | null {
  const key = (process.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_KEY ?? "").trim();
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

function getReplicateClient(): Replicate | null {
  const token = process.env.REPLICATE_API_TOKEN?.trim();
  if (!token) return null;
  return new Replicate({ auth: token });
}

export function logListingApiStatus(): void {
  const hasClaude = Boolean((process.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_KEY ?? "").trim());
  const hasReplicate = Boolean(process.env.REPLICATE_API_TOKEN?.trim());
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim());
  const hasGemini = Boolean((process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY ?? "").trim());
  console.log(
    "[Listing Builder] APIs:",
    hasGemini ? "Gemini ✓" : "Gemini —",
    hasClaude ? "Claude ✓" : "Claude —",
    hasReplicate ? "Replicate (Flux) ✓" : "Replicate —",
    hasOpenAI ? "OpenAI ✓" : "OpenAI —"
  );
}

export type ListingInput = {
  productName: string;
  description: string;
  keywords: string[];
  productImageUrl?: string;
};

export type ListingCopy = {
  title: string;
  bulletPoints: string[];
  productDescription: string;
  aPlusContentIdeas: string[];
  aPlusLayoutIdeas: { moduleTitle: string; bodyText: string; imageSuggestion: string }[];
};

export type ImagePromptSpec = {
  type: "white_background" | "lifestyle" | "infographic" | "detail" | "in_use" | "a_plus";
  prompt: string;
  negativePrompt?: string;
};

export type GeneratedImage = {
  type: string;
  prompt: string;
  url: string;
};

export type ListingResult = {
  ok: boolean;
  error?: string;
  step?: "basic_complete" | "full";
  copy: ListingCopy;
  imagePrompts: ImagePromptSpec[];
  generatedImages: GeneratedImage[];
  report?: Record<string, unknown>;
};

export type StyleOptions = {
  style?: "studio" | "lifestyle" | "outdoor" | "luxury" | "modern";
  primaryColor?: string;
  targetAudience?: string;
  layoutPreference?: "grid" | "stacked" | "mixed";
  background?: "home" | "nature" | "studio";
  vibe?: string;
};

export type ListingReportForStep2 = {
  product_image_url?: string;
  a_plus_layout_ideas?: { moduleTitle: string; bodyText: string; imageSuggestion: string }[];
};

const CLAUDE_LISTING_SYSTEM = `You are an Amazon SEO Expert. Generate a complete, ready-to-post Amazon listing.
OPTIMIZED TITLE (max 200 characters): Use high-volume PPC/search keywords; front-load primary keyword.
5 BULLET POINTS (exactly 5; each 150–200 chars): Benefits and features; optimize for Amazon ranking.
PRODUCT DESCRIPTION: Compelling narrative that drives sales.
A+ CONTENT: a_plus_content_ideas (3–5 strings), a_plus_layout_ideas (array of { moduleTitle, bodyText, imageSuggestion }).
Return valid JSON only. Keys: title, bullets (array of 5 strings), description, a_plus_content_ideas, a_plus_layout_ideas. Aliases: bullet_points, product_description.`;

type ImageInsights = {
  category?: string;
  colors?: string[];
  materials?: string[];
  shapes?: string[];
  style?: string;
  keyFeatures?: string[];
};

function buildListingUserPrompt(input: ListingInput, insights?: ImageInsights): string {
  const kw = input.keywords.slice(0, 10).join(", ");
  const hasPet =
    !!insights?.category?.toLowerCase().includes("pet") ||
    (insights?.keyFeatures ?? []).some((f) =>
      String(f).toLowerCase().match(/\b(cat|dog|kitten|puppy|pet)\b/)
    );

  const lines: string[] = [
    `Product name: ${input.productName}`,
    `Brief description: ${input.description}`,
    `Keywords: ${kw || "n/a"}`,
  ];
  if (insights) {
    lines.push(
      "",
      "Image-derived context:",
      `Category: ${insights.category ?? "unknown"}`,
      `Colors: ${(insights.colors ?? []).join(", ") || "n/a"}`,
      `Materials: ${(insights.materials ?? []).join(", ") || "n/a"}`,
      `Shapes: ${(insights.shapes ?? []).join(", ") || "n/a"}`,
      `Style: ${insights.style ?? "n/a"}`,
      `Key features: ${(insights.keyFeatures ?? []).join("; ") || "n/a"}`
    );
    if (hasPet) {
      lines.push(
        "",
        "Important: The image contains a pet (e.g. cat or dog). Emphasize PET SAFETY and COMFORT clearly in the title and at least one bullet point."
      );
    }
  }
  lines.push(
    "",
    "For Amazon SEO (A10):",
    "- Make sure the highest-priority keywords appear NATURALLY within the first 80 characters of the TITLE.",
    "- Also include at least one primary keyword naturally within the first 80 characters of the FIRST BULLET POINT.",
    "",
    "Return valid JSON: title (max 200 chars), bullets (array of exactly 5 strings), description, a_plus_content_ideas, a_plus_layout_ideas."
  );
  return lines.join("\n");
}

async function analyzeImageForListing(productImageUrl?: string): Promise<ImageInsights | null> {
  if (!productImageUrl) return null;
  const openai = getOpenAIClient();
  if (!openai) return null;
  try {
    const model = (process.env.OPENAI_VISION_MODEL || "gpt-4o").trim();
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a product image analyzer for Amazon listings. Extract e-commerce relevant attributes and return STRICT JSON only.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Look at this product image and extract: category, colors, materials, shapes, overall style, and 3–7 keyFeatures (short phrases). " +
                "Return JSON with fields: {\"category\": string, \"colors\": string[], \"materials\": string[], \"shapes\": string[], \"style\": string, \"keyFeatures\": string[]}. " +
                "DO NOT include any explanation outside of JSON.",
            },
            {
              type: "image_url",
              image_url: { url: productImageUrl },
            },
          ] as any,
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content?.toString().trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as any;
    const insights: ImageInsights = {
      category: typeof parsed.category === "string" ? parsed.category : undefined,
      colors: Array.isArray(parsed.colors) ? parsed.colors.map(String) : [],
      materials: Array.isArray(parsed.materials) ? parsed.materials.map(String) : [],
      shapes: Array.isArray(parsed.shapes) ? parsed.shapes.map(String) : [],
      style: typeof parsed.style === "string" ? parsed.style : undefined,
      keyFeatures: Array.isArray(parsed.keyFeatures) ? parsed.keyFeatures.map(String) : [],
    };
    return insights;
  } catch (err: unknown) {
    console.error("[Listing Builder] Image vision analysis error:", err instanceof Error ? err.message : err);
    return null;
  }
}

function parseListingCopyFromJson(parsed: Record<string, unknown>): ListingCopy {
  const toArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : typeof v === "string" ? [v] : [];
  const bulletsRaw = parsed.bullets ?? parsed.bullet_points;
  const bulletPoints = toArray(bulletsRaw).slice(0, 5);
  while (bulletPoints.length < 5) bulletPoints.push("");
  const descRaw = parsed.description ?? parsed.product_description;
  const productDescription = typeof descRaw === "string" ? descRaw : String(descRaw ?? "");
  const aPlusLayoutRaw = Array.isArray(parsed.a_plus_layout_ideas) ? parsed.a_plus_layout_ideas : [];
  const aPlusLayoutIdeas = aPlusLayoutRaw.slice(0, 5).map((item: unknown) => {
    const o = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};
    return {
      moduleTitle: String(o.moduleTitle ?? ""),
      bodyText: String(o.bodyText ?? ""),
      imageSuggestion: String(o.imageSuggestion ?? ""),
    };
  });
  return {
    title: typeof parsed.title === "string" ? parsed.title : String(parsed.title ?? ""),
    bulletPoints,
    productDescription,
    aPlusContentIdeas: toArray(parsed.a_plus_content_ideas).slice(0, 5),
    aPlusLayoutIdeas,
  };
}

async function generateListingCopy(input: ListingInput): Promise<ListingCopy | null> {
  const insights = (await analyzeImageForListing(input.productImageUrl)) ?? undefined;
  const anthropic = getAnthropicClient();
  if (anthropic) {
    try {
      const model = (process.env.ANTHROPIC_LISTING_MODEL ?? "claude-3-5-sonnet-20240620").trim();
      const msg = await anthropic.messages.create({
        model,
        max_tokens: 4096,
        system: CLAUDE_LISTING_SYSTEM,
        temperature: 0.8,
        messages: [{ role: "user", content: buildListingUserPrompt(input, insights) }],
      });
      const text = msg.content?.find((b) => b.type === "text")?.type === "text" ? (msg.content.find((b) => b.type === "text") as { type: "text"; text: string }).text : "";
      const raw = text?.trim();
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return parseListingCopyFromJson(parsed);
    } catch (err: unknown) {
      console.error("[Listing Builder] Claude error:", err instanceof Error ? err.message : err);
      return null;
    }
  }
  const openai = getOpenAIClient();
  if (!openai) return null;
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_LISTING_MODEL || "gpt-4o",
      messages: [
        { role: "system", content: CLAUDE_LISTING_SYSTEM },
        { role: "user", content: buildListingUserPrompt(input, insights) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });
    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return null;
    return parseListingCopyFromJson(JSON.parse(raw) as Record<string, unknown>);
  } catch (err: unknown) {
    console.error("[Listing Builder] OpenAI error:", err instanceof Error ? err.message : err);
    return null;
  }
}

const DEFAULT_NEGATIVE_PROMPT = "distorted text, extra limbs, deformed, blurry, low quality, cartoon, watermark.";
const EMPTY_COPY: ListingCopy = {
  title: "",
  bulletPoints: [],
  productDescription: "",
  aPlusContentIdeas: [],
  aPlusLayoutIdeas: [],
};

function envHint(): string {
  const hasGemini = Boolean((process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY ?? "").trim());
  const hasClaude = Boolean((process.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_KEY ?? "").trim());
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim());
  if (hasGemini) return "Check GEMINI_API_KEY and quota.";
  if (!hasClaude && !hasOpenAI) return "Set GEMINI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY in server .env.";
  return "Check API key and quota.";
}

/** Convert Gemini copy + optional A+ placeholders to ListingCopy. */
export function geminiCopyToListingCopy(
  gemini: { title: string; bullets: string[]; description: string }
): ListingCopy {
  const bullets = gemini.bullets.slice(0, 5);
  while (bullets.length < 5) bullets.push("");
  return {
    title: gemini.title,
    bulletPoints: bullets,
    productDescription: gemini.description,
    aPlusContentIdeas: [],
    aPlusLayoutIdeas: [],
  };
}

export async function runListingAgentBasic(input: ListingInput): Promise<ListingResult> {
  if (!input.productName?.trim()) {
    return { ok: false, error: "Product name is required.", copy: EMPTY_COPY, imagePrompts: [], generatedImages: [] };
  }
  const hasLLM = getAnthropicClient() || getOpenAIClient();
  if (!hasLLM) {
    return { ok: false, error: "Set GEMINI_API_KEY (preferred), ANTHROPIC_API_KEY, or OPENAI_API_KEY in server .env.", copy: EMPTY_COPY, imagePrompts: [], generatedImages: [] };
  }
  try {
    const copy = await generateListingCopy(input);
    if (!copy || (!copy.title?.trim() && !copy.bulletPoints?.some((b) => b?.trim()))) {
      return { ok: false, error: `Copy generation failed. ${envHint()}`, copy: EMPTY_COPY, imagePrompts: [], generatedImages: [] };
    }
    const report = {
      report_type: "listing" as const,
      product_name: input.productName,
      product_image_url: input.productImageUrl,
      title: copy.title,
      bullet_points: copy.bulletPoints,
      product_description: copy.productDescription,
      a_plus_content_ideas: copy.aPlusContentIdeas,
      a_plus_layout_ideas: copy.aPlusLayoutIdeas,
    };
    return {
      ok: true,
      step: "basic_complete",
      copy,
      imagePrompts: [],
      generatedImages: [],
      report,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ runListingAgentBasic:", message);
    return { ok: false, error: `Generation failed: ${message}. ${envHint()}`, copy: EMPTY_COPY, imagePrompts: [], generatedImages: [] };
  }
}

export async function regenerateBullet(
  report: { title?: string; bullet_points?: string[]; product_description?: string; product_name?: string },
  bulletIndex: number
): Promise<{ ok: boolean; error?: string; copy?: ListingCopy; report?: Record<string, unknown> }> {
  const copy = await generateListingCopy({
    productName: report.product_name ?? "Product",
    description: (report.product_description ?? "").slice(0, 500),
    keywords: [],
  });
  if (!copy) return { ok: false, error: "Regenerate failed." };
  const bullets = copy.bulletPoints ?? [];
  const idx = Math.max(0, Math.min(bulletIndex, 4));
  const existing = report.bullet_points ?? [];
  const newBullets = [...existing.slice(0, 5)];
  while (newBullets.length < 5) newBullets.push("");
  newBullets[idx] = bullets[idx] ?? newBullets[idx];
  const newReport = { ...report, bullet_points: newBullets };
  return { ok: true, copy: { ...copy, bulletPoints: newBullets }, report: newReport };
}

export async function runListingAgentStep2APlus(
  report: ListingReportForStep2,
  _styleOptions: StyleOptions
): Promise<{ ok: boolean; error?: string; generatedImages: GeneratedImage[] }> {
  const productImageUrl = report.product_image_url;
  if (!productImageUrl) return { ok: false, error: "No product image URL in report.", generatedImages: [] };
  const replicate = getReplicateClient();
  if (!replicate) return { ok: false, error: "REPLICATE_API_TOKEN not set.", generatedImages: [] };
  const model = (process.env.REPLICATE_FLUX_MODEL || "bxclib2/flux_img2img").trim();
  try {
    const output = await replicate.run(model as `${string}/${string}`, {
      input: {
        image: productImageUrl,
        prompt: "Pure white background RGB(255,255,255), professional product photography, 85% product coverage, Amazon main image compliant.",
        negative_prompt: DEFAULT_NEGATIVE_PROMPT,
      } as Record<string, unknown>,
    });
    const url = Array.isArray(output) ? output[0] : typeof output === "string" ? output : (output as { url?: string })?.url;
    if (url && typeof url === "string") {
      return { ok: true, generatedImages: [{ type: "a_plus", prompt: "white background", url }] };
    }
  } catch (err) {
    console.error("runListingAgentStep2APlus:", err);
  }
  return { ok: false, error: "A+ image generation failed.", generatedImages: [] };
}

export async function runListingAgentStep2Gallery(
  report: ListingReportForStep2,
  _styleOptions: StyleOptions
): Promise<{ ok: boolean; error?: string; generatedImages: GeneratedImage[] }> {
  const productImageUrl = report.product_image_url;
  if (!productImageUrl) return { ok: false, error: "No product image URL in report.", generatedImages: [] };
  const replicate = getReplicateClient();
  if (!replicate) return { ok: false, error: "REPLICATE_API_TOKEN not set.", generatedImages: [] };
  const model = (process.env.REPLICATE_FLUX_MODEL || "bxclib2/flux_img2img").trim();
  const prompts = [
    "Product in modern living room, natural lighting",
    "Product on kitchen counter, lifestyle",
    "Product in home office, clean background",
  ];
  const generatedImages: GeneratedImage[] = [];
  for (let i = 0; i < prompts.length; i++) {
    try {
      const output = await replicate.run(model as `${string}/${string}`, {
        input: { image: productImageUrl, prompt: prompts[i], negative_prompt: DEFAULT_NEGATIVE_PROMPT } as Record<string, unknown>,
      });
      const url = Array.isArray(output) ? output[0] : typeof output === "string" ? output : (output as { url?: string })?.url;
      if (url && typeof url === "string") generatedImages.push({ type: "lifestyle", prompt: prompts[i], url });
    } catch (_) {}
  }
  return { ok: generatedImages.length > 0, generatedImages };
}
