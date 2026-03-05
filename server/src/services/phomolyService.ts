/**
 * Claid.ai (Phomoly) API integration for Amazon Growth Suite.
 * Uses PHOMOLY_API_KEY from .env with https://api.claid.ai/v1.
 * Accepts vibe, placement, target, type from v0 UI. Handles 202 + task_id polling.
 */
import axios, { AxiosError } from "axios";
import FormData from "form-data";
import fetch, { Response as FetchResponse } from "node-fetch";

const LOG = "[Phomoly/Claid]";
const CLAID_BASE_URL = (process.env.PHOMOLY_API_URL ?? process.env.CLAID_API_URL ?? "https://api.claid.ai/v1").replace(/\/$/, "");
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 90;

/** Error codes for UI. */
export const PHOMOLY_ERROR_CODES = {
  API_LIMIT_REACHED: "API_LIMIT_REACHED",
  API_ERROR: "API_ERROR",
  TIMEOUT: "TIMEOUT",
  PHOMOLY_NOT_CONFIGURED: "PHOMOLY_NOT_CONFIGURED",
  NO_GENERATED_IMAGE: "NO_GENERATED_IMAGE",
} as const;

export type PhomolyResult = { urls: string[] } | { error: string; code: string };

function getApiKey(): string | null {
  const key = (process.env.PHOMOLY_API_KEY ?? "").trim();
  return key || null;
}

/** type from v0: 'listing' | 'aplus' → internal. */
export type ClaidType = "listing" | "aplus";

/** Amazon resolutions: listing 2000×2000, aplus 1935×600. */
export const AMAZON_SPECS: Record<ClaidType, { width: number; height: number }> = {
  listing: { width: 2000, height: 2000 },
  aplus: { width: 1935, height: 600 },
};

/** Annotation for infographic callouts: label, subtext, position. */
export type AnnotationItem = { label?: string; subtext?: string; position?: string };
/** Dimensions H/W/D for dimension lines. */
export type DimensionsInput = { H?: number; W?: number; D?: number; height?: number; width?: number; depth?: number };

export type PhomolyOptions = {
  imageUrl: string;
  type?: ClaidType;
  vibe?: string;
  placement?: string;
  target?: string;
  /** Strategic UI: narrative + strategy for Cinematic / Brand-focused. */
  narrative?: string;
  story_text?: string;
  strategy?: string;
  targetAudience?: string;
  competitiveEdge?: string;
  productName?: string;
  /** Override prompt (Strategic Creative Director). When set, buildClaidPrompt is skipped. */
  promptOverride?: string;
  /** Graphic layer / infographic: brand color, annotations, dimensions. */
  brandColor?: string;
  annotations?: AnnotationItem[];
  dimensions?: DimensionsInput;
  /** Legacy / fallback */
  productUSP?: string;
  environment?: string;
  brandColors?: string;
  referenceImageUrls?: string[];
};

/**
 * Strategic Creative Director: transform raw input into professional Amazon Infographics and A+ Storytelling.
 * Listing (2000x2000): infographic layout, dimension lines, callouts. A+ (1935x600): cinematic brand story, typography space.
 */
export function buildStrategicPrompt(options: {
  format: ClaidType;
  narrative?: string;
  brandColor?: string;
  annotations?: AnnotationItem[];
  dimensions?: DimensionsInput;
}): string {
  const format = options.format ?? "listing";
  const narrative = (options.narrative ?? "").trim();
  const brandColor = (options.brandColor ?? "").trim() || "brand accent";
  const annotations = Array.isArray(options.annotations) ? options.annotations : [];
  const dims = options.dimensions ?? {};
  const H = dims.H ?? dims.height;
  const W = dims.W ?? dims.width;
  const D = dims.D ?? dims.depth;
  const hasDimensions = H != null || W != null || D != null;
  const dimLine = [H != null ? `H=${H}` : "", W != null ? `W=${W}` : "", D != null ? `D=${D}` : ""].filter(Boolean).join(", ");

  if (format === "aplus") {
    const typographySide = "Right";
    return `Create a cinematic, widescreen brand story banner. Focus on the emotional narrative: ${narrative || "premium lifestyle story"}. Leave empty space on the ${typographySide} for high-end typography. Ensure the style is premium and lifestyle-oriented. 1935x600px.`;
  }

  if (format === "listing" && (hasDimensions || annotations.length > 0)) {
    const callouts = annotations
      .slice(0, 6)
      .map((a) => {
        const label = (a.label ?? "").trim();
        const subtext = (a.subtext ?? "").trim();
        const pos = (a.position ?? "").trim() || "product";
        return `${label}${subtext ? `: ${subtext}` : ""} at ${pos}`;
      })
      .filter(Boolean);
    const calloutLine = callouts.length > 0 ? ` Place callout text: ${callouts.join("; ")}.` : "";
    const dimLineInstruction = hasDimensions ? ` Add clean, architectural dimension lines for ${dimLine}.` : "";
    return `Create a professional infographic layout. Use ${brandColor} for graphic elements (arrows, lines).${dimLineInstruction}${calloutLine} 2000x2000px.`;
  }

  return `Amazon Hero Image. Professional product shot. Use ${brandColor} for accents. 2000x2000px.`;
}

/**
 * Listing (Claid): High-quality product cutouts, shadows, clean infographics, pixel-perfect product.
 */
export function buildAmazonPrompt(options: {
  format?: ClaidType;
  scene?: string;
  highlight?: string;
  visualContent?: string;
  overlayText?: string;
  brandColor?: string;
  style?: string;
  narrative?: string;
  keywords?: string | string[];
  /** @deprecated use highlight */
  highlightText?: string;
}): string {
  const scene = (options.scene ?? "").trim() || "the product in a professional setting";
  const highlight = (options.highlight ?? options.highlightText ?? "").trim() || "the main product";
  const overlayText = (options.overlayText ?? "").trim();
  const brandColor = (options.brandColor ?? "").trim() || "professional accent";
  const style = (options.style ?? "").trim() || "clean, professional";
  const overlayPart = overlayText ? ` Include a clear text overlay: "${overlayText}".` : "";
  return `High-quality product cutout with soft shadows and clean infographic layout. Scene: ${scene}. Highlight: ${highlight}. Keep the product pixel-perfect and recognizable. Use ${brandColor} for graphic elements and accents.${overlayPart} Style: ${style}. Professional Amazon listing image, 2000x2000px.`;
}

/**
 * A+ (Nano Banana): Descriptive cinematic prompt — product as style/structure reference, creative freedom.
 */
export function buildNanoPrompt(options: {
  scene?: string;
  highlight?: string;
  visualContent?: string;
}): string {
  const product = (options.highlight ?? "").trim() || "the product";
  const visualContent = (options.visualContent ?? "").trim();
  const scene = (options.scene ?? "").trim() || "lifestyle";
  const parts = [
    `A cinematic lifestyle shot of ${product}`,
    visualContent ? visualContent : "",
    `${scene} background`,
    "8k resolution",
    "premium Amazon A+ widescreen style",
  ].filter(Boolean);
  return parts.join(", ") + ".";
}

/**
 * Strategic integration: narrative + strategy → Cinematic and Brand-focused Claid prompt.
 * Format (type) drives dimensions: A+ → 1935×600, Listing → 2000×2000.
 */
export function buildClaidPrompt(options: {
  type?: ClaidType;
  vibe?: string;
  placement?: string;
  target?: string;
  targetAudience?: string;
  narrative?: string;
  story_text?: string;
  strategy?: string;
  competitiveEdge?: string;
  productName?: string;
}): string {
  const type = options.type ?? "listing";
  const narrative = (options.narrative ?? options.story_text ?? "").trim();
  const strategy = (options.strategy ?? "").trim();
  const vibe = (options.vibe ?? "").trim() || "professional studio";
  const target = (options.target ?? options.targetAudience ?? "").trim() || "Amazon buyers";
  const competitiveEdge = (options.competitiveEdge ?? "").trim() || "quality and lifestyle";
  const productName = (options.productName ?? "").trim() || "Product";
  const brandStory = [narrative, strategy].filter(Boolean).join(". ") || "professional product story";

  if (type === "aplus") {
    return `Amazon A+ Cinematic Banner. Brand-focused, cinematic. Story: ${brandStory}. Vibe: ${vibe}. Target: ${target}. 1935x600px.`;
  }
  return `Amazon Hero Image. Brand-focused. Product: ${productName}. Strategy: ${strategy || competitiveEdge}. Scene: ${narrative || "professional studio"}. Lighting: Studio 5500K. 2000x2000px.`;
}

/**
 * Poll Claid for task result until output.url is ready. Returns URL or null.
 */
async function pollTaskUntilReady(
  taskId: string,
  apiKey: string,
  spec: { width: number; height: number }
): Promise<string[] | null> {
  const url = `${CLAID_BASE_URL}/tasks/${taskId}`;
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    try {
      const res = await axios.get<{
        status?: string;
        output?: string | { url?: string };
        result?: { url?: string; urls?: string[] };
        data?: { url?: string; urls?: string[] };
      }>(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 15000,
        validateStatus: () => true,
      });
      console.log(`${LOG} Poll #${attempt + 1} response:`, JSON.stringify(res.data, null, 2));
      if (res.status !== 200) continue;
      const d = res.data;
      const status = (d as { status?: string }).status;
      if (status === "failed" || status === "error") {
        console.error(`${LOG} Task ${taskId} failed:`, d);
        return null;
      }
      const outUrl =
        typeof d?.output === "string"
          ? d.output
          : (d?.output as { url?: string })?.url ??
            (d?.result as { url?: string })?.url ??
            (d?.data as { url?: string })?.url;
      const outUrls = (d?.result as { urls?: string[] })?.urls ?? (d?.data as { urls?: string[] })?.urls;
      if (outUrl) return [outUrl];
      if (Array.isArray(outUrls) && outUrls.length > 0) return outUrls.filter((u): u is string => typeof u === "string");
      if (status === "completed" || status === "done") break;
    } catch (e) {
      console.warn(`${LOG} Poll error:`, e instanceof Error ? e.message : e);
    }
  }
  return null;
}

/**
 * Call Claid API. Uses PHOMOLY_API_KEY with https://api.claid.ai/v1.
 * If Claid returns 202 Accepted with task_id, polls every 2s until output.url is ready.
 * Resolutions: listing 2000×2000, aplus 1935×600. JPEG 100% quality.
 */
export async function callPhomoly(options: PhomolyOptions): Promise<PhomolyResult> {
  console.log("[Phomoly/Claid] API Key exists:", !!process.env.PHOMOLY_API_KEY);

  const {
    imageUrl,
    type = "listing",
    promptOverride,
    vibe,
    placement,
    target,
    targetAudience,
    narrative,
    story_text,
    strategy,
    competitiveEdge,
    productName,
    productUSP,
    environment,
    brandColors,
    referenceImageUrls,
  } = options;
  const apiKey = getApiKey();
  const spec = AMAZON_SPECS[type];
  const prompt =
    promptOverride?.trim() ||
    buildClaidPrompt({
      type,
      vibe,
      placement,
      target,
      targetAudience,
      narrative,
      story_text,
      strategy,
      competitiveEdge,
      productName,
    });
  const typeLabel = type === "listing" ? "listing" : "aplus";

  if (!apiKey) {
    console.error(`${LOG} PHOMOLY_API_KEY is null or missing. Set PHOMOLY_API_KEY in server .env.`);
    return {
      error: "API Key Configuration Missing",
      code: PHOMOLY_ERROR_CODES.PHOMOLY_NOT_CONFIGURED,
    };
  }

  // Allow either public URL (http/https) or data URL (Base64). Reject obvious placeholders.
  const isHttpUrl = /^https?:\/\//i.test(imageUrl ?? "");
  const isDataUrl = /^data:image\//i.test(imageUrl ?? "");
  if (!imageUrl || (!isHttpUrl && !isDataUrl)) {
    console.error(
      `${LOG} Invalid imageUrl for Claid. Expected http/https URL or data:image Base64, received:`,
      imageUrl
    );
    return {
      error: "Invalid imageUrl for Claid. It must be an http/https URL or a data:image Base64 string.",
      code: PHOMOLY_ERROR_CODES.API_ERROR,
    };
  }

  if (isHttpUrl && /^https?:\/\/(?:www\.)?example\.com\//i.test(imageUrl)) {
    console.error(`${LOG} example.com placeholder URL detected. Claid will reject this URL.`, imageUrl);
    return {
      error: "Please upload a real image file (example.com is a placeholder and cannot be processed).",
      code: PHOMOLY_ERROR_CODES.API_ERROR,
    };
  }

  const maskedInput =
    isDataUrl ? `${imageUrl.slice(0, 50)}...` : imageUrl;
  console.log(
    `🚀 Generating ${typeLabel} for Amazon: ${spec.width}x${spec.height} | Vibe: ${vibe ?? "(default)"} | imageUrl:`,
    maskedInput
  );
  console.log("[Phomoly/Claid] Final Prompt sent to AI:", prompt);

  try {
    // Claid 422 + Base64 fix:
    // - Use image/edit endpoint with multipart/form-data (form-data library).
    // - Send the image as a real file (Buffer) instead of a huge Base64 JSON string.
    // - Send operations as a stringified JSON object field (not a file).

    // Prepare image buffer and metadata.
    let fileBuffer: Buffer;
    let fileName = "image.jpg";
    let mimeType = "image/jpeg";

    if (isDataUrl) {
      // data:image/<type>;base64,<data>
      try {
        const [meta, base64Data] = imageUrl.split(",", 2);
        const mimeMatch = /^data:(image\/[a-zA-Z0-9+.-]+);base64$/i.exec(meta);
        mimeType = mimeMatch?.[1] || mimeType;
        fileBuffer = Buffer.from(base64Data, "base64");
        fileName = `upload.${mimeType.split("/")[1] || "jpg"}`;
      } catch {
        console.error(`${LOG} Failed to parse data URL for Claid.`);
        return {
          error: "Invalid data:image Base64 format for Claid.",
          code: PHOMOLY_ERROR_CODES.API_ERROR,
        };
      }
    } else {
      try {
        const imgResp = await axios.get<ArrayBuffer>(imageUrl, { responseType: "arraybuffer" });
        const ct = imgResp.headers["content-type"];
        if (typeof ct === "string" && ct.startsWith("image/")) {
          mimeType = ct;
        }
        fileBuffer = Buffer.from(imgResp.data);
        fileName = `upload.${(mimeType.split("/")[1] || "jpg").split(";")[0]}`;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`${LOG} Failed to download source image for Claid:`, msg);
        return {
          error: "Could not download source image for Claid. Check that imageUrl is publicly accessible.",
          code: PHOMOLY_ERROR_CODES.API_ERROR,
        };
      }
    }

    // Build multipart/form-data body using form-data (Node.js)
    const buffer = fileBuffer;
    const form = new FormData();
    form.append("file", buffer, {
      filename: fileName,
      contentType: mimeType,
    });

    const operationsValue = JSON.stringify({
      background: {
        prompt,
      },
    });
    // Append operations as a plain JSON string field (not a file)
    form.append("operations", operationsValue);

    const url = `${CLAID_BASE_URL}/image/edit`;
    console.log(`${LOG} Claid request URL:`, url);
    console.log(
      `${LOG} Claid request payload (summary):`,
      JSON.stringify({ file: fileName, operations: JSON.parse(operationsValue) }, null, 2)
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        // CRITICAL: let form-data set correct Content-Type + boundary
        ...form.getHeaders(),
      },
      body: form as any,
    });

    const status = response.status;
    let data: any = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    console.log(`${LOG} Claid full response (for debugging):`, JSON.stringify(data, null, 2));

    if (status === 429) {
      console.warn(`${LOG} Rate limit (429) or credit limit.`);
      return { error: "API limit reached. Please try again in a few minutes.", code: PHOMOLY_ERROR_CODES.API_LIMIT_REACHED };
    }

    if (status === 202 && data?.task_id) {
      console.log(`${LOG} 202 Accepted, polling task_id: ${data.task_id}`);
      const urls = await pollTaskUntilReady(data.task_id, apiKey, spec);
      if (urls?.length) {
        console.log(`${LOG} Claid returned ${urls.length} high-res URL(s) (${spec.width}x${spec.height}).`);
        return { urls };
      }
      return {
        error: "Image generation did not complete in time or task failed.",
        code: PHOMOLY_ERROR_CODES.NO_GENERATED_IMAGE,
      };
    }

    if (status !== 200) {
      const msg = data?.message ?? data?.error ?? `API returned ${status}`;
      console.warn(`${LOG} ${msg}`);
      return { error: msg, code: PHOMOLY_ERROR_CODES.API_ERROR };
    }

    const urls: string[] = Array.isArray(data?.urls)
      ? data.urls
      : data?.url
        ? [data.url]
        : typeof data?.output === "string"
          ? [data.output]
          : (data?.output as { url?: string })?.url
            ? [(data.output as { url: string }).url]
            : (data?.result as { url?: string })?.url
              ? [(data.result as { url: string }).url]
              : (data?.result as { urls?: string[] })?.urls
                ? (data.result as { urls: string[] }).urls
                : (data?.data as { url?: string })?.url
                  ? [(data.data as { url: string }).url]
                  : (data?.data as { urls?: string[] })?.urls
                    ? (data.data as { urls: string[] }).urls
                    : [];
    const out = urls.filter((u): u is string => typeof u === "string" && u.length > 0);
    if (out.length > 0) {
      console.log(`${LOG} Claid returned ${out.length} high-res URL(s) (${spec.width}x${spec.height}).`);
      return { urls: out };
    }
    console.error(`${LOG} API 200 but no image URL in response.`);
    return {
      error: "Image generation did not return a result. Please try again or check the API.",
      code: PHOMOLY_ERROR_CODES.NO_GENERATED_IMAGE,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${LOG} Request failed:`, { message, full: err });
    return { error: message, code: PHOMOLY_ERROR_CODES.API_ERROR };
  }
}
