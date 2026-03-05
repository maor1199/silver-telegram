/**
 * Production-ready hero image: Vision-guided crop → Remove.bg → Sharp #FFFFFF.
 * - Vision: identify product region (ignore infographic/text) and crop before Remove.bg.
 * - Remove.bg: type=product, semitransparency=false, roi=full.
 * - Sharp: flatten to #FFFFFF, high-quality JPEG.
 *
 * API KEYS (server/.env): REMOVE_BG_API_KEY, OPENAI_API_KEY (for vision crop).
 */
import axios, { AxiosError } from "axios";
import OpenAI from "openai";
import sharp from "sharp";

const LOG_PREFIX = "[Remove.bg]";
const REMOVE_BG_URL = "https://api.remove.bg/v1.0/removebg";
const PURE_WHITE_HEX = "#FFFFFF";
const PURE_WHITE_RGB = { r: 255, g: 255, b: 255 };

function getRemoveBgApiKey(): string | null {
  const key = (process.env.REMOVE_BG_API_KEY ?? process.env.REMOVEBG_API_KEY ?? "").trim();
  return key || null;
}

/** Normalized 0–1 region: { left, top, width, height }. */
export type ProductRegion = { left: number; top: number; width: number; height: number };

/** Crop image to normalized region (0–1). Returns cropped buffer or original if invalid. */
export async function cropBufferToRegion(imageBuffer: Buffer, region: ProductRegion): Promise<Buffer> {
  try {
    const { left, top, width, height } = region;
    const L = Math.max(0, Math.min(1, left));
    const T = Math.max(0, Math.min(1, top));
    const W = Math.max(0.1, Math.min(1, width));
    const H = Math.max(0.1, Math.min(1, height));
    const meta = await sharp(imageBuffer).metadata();
    const Wpx = meta.width ?? 1000;
    const Hpx = meta.height ?? 1000;
    const x = Math.round(L * Wpx);
    const y = Math.round(T * Hpx);
    const w = Math.round(W * Wpx);
    const h = Math.round(H * Hpx);
    if (w < 50 || h < 50) return imageBuffer;
    return sharp(imageBuffer).extract({ left: x, top: y, width: w, height: h }).toBuffer();
  } catch {
    return imageBuffer;
  }
}

/**
 * Vision-guided crop: ask GPT-4o to identify the main product region (ignore text/infographic), then crop.
 * Returns cropped buffer or original if Vision unavailable/invalid.
 */
async function cropToProductRegion(imageBuffer: Buffer): Promise<Buffer> {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (!openaiKey) {
    console.log(`${LOG_PREFIX} [Vision] OPENAI_API_KEY not set; skipping vision-guided crop.`);
    return imageBuffer;
  }
  try {
    const openai = new OpenAI({ apiKey: openaiKey });
    const model = (process.env.OPENAI_VISION_MODEL || "gpt-4o").trim();
    const b64 = imageBuffer.toString("base64");
    const dataUrl = `data:image/jpeg;base64,${b64}`;

    console.log(`${LOG_PREFIX} [Vision] Asking for product region (ignore text/infographic)...`);
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an image analyzer. Return only valid JSON with no explanation.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Look at this image. Identify the MAIN PRODUCT only (the physical item for sale). " +
                "Ignore any text, logos, infographics, or decorative borders. " +
                "Return JSON: {\"product_region\": {\"left\": 0-1, \"top\": 0-1, \"width\": 0-1, \"height\": 0-1}} " +
                "where the region is the tight bounding box of the product. If the whole image is the product, return left:0, top:0, width:1, height:1.",
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ] as OpenAI.Chat.Completions.ChatCompletionContentPart[],
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return imageBuffer;
    const parsed = JSON.parse(raw) as { product_region?: ProductRegion };
    const r = parsed?.product_region;
    if (!r || typeof r.left !== "number" || typeof r.top !== "number" || typeof r.width !== "number" || typeof r.height !== "number") {
      console.log(`${LOG_PREFIX} [Vision] No valid product_region in response; using full image.`);
      return imageBuffer;
    }
    const left = Math.max(0, Math.min(1, r.left));
    const top = Math.max(0, Math.min(1, r.top));
    const width = Math.max(0.1, Math.min(1, r.width));
    const height = Math.max(0.1, Math.min(1, r.height));
    if (left + width > 1) return imageBuffer;
    if (top + height > 1) return imageBuffer;

    const meta = await sharp(imageBuffer).metadata();
    const W = meta.width ?? 1000;
    const H = meta.height ?? 1000;
    const x = Math.round(left * W);
    const y = Math.round(top * H);
    const w = Math.round(width * W);
    const h = Math.round(height * H);
    if (w < 50 || h < 50) {
      console.log(`${LOG_PREFIX} [Vision] Region too small; using full image.`);
      return imageBuffer;
    }
    const cropped = await sharp(imageBuffer).extract({ left: x, top: y, width: w, height: h }).toBuffer();
    console.log(`${LOG_PREFIX} [Vision] Cropped to product region (${w}x${h}).`);
    return cropped;
  } catch (err: unknown) {
    console.warn(`${LOG_PREFIX} [Vision] Crop failed:`, err instanceof Error ? err.message : err);
    return imageBuffer;
  }
}

export type ProcessImageResult =
  | { ok: true; buffer: Buffer; mimeType: string }
  | { ok: false; error: string; step: "api_key" | "network" | "api_response" | "sharp" | "unknown" };

/**
 * Flatten transparent PNG onto solid #FFFFFF. Amazon standard; removes ghost edges.
 */
async function flattenOntoWhite(transparentBuffer: Buffer): Promise<{ buffer: Buffer } | { error: string }> {
  console.log(`${LOG_PREFIX} Step 2: Flattening onto solid white (${PURE_WHITE_HEX}) with Sharp...`);
  try {
    const meta = await sharp(transparentBuffer).metadata();
    const w = meta.width ?? 1000;
    const h = meta.height ?? 1000;
    const whiteJpeg = await sharp(transparentBuffer)
      .flatten({ background: PURE_WHITE_RGB })
      .jpeg({ quality: 95 })
      .toBuffer();
    console.log(`${LOG_PREFIX} Step 2 OK: White-background JPEG (${whiteJpeg.length} bytes, ${w}x${h}).`);
    return { buffer: whiteJpeg };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${LOG_PREFIX} Step 2 FAILED: Sharp error. ${msg}`);
    return { error: msg };
  }
}

/**
 * Remove.bg API — production params: type=product, semitransparency=false, roi=0% 0% 100% 100%.
 * On failure, logs the EXACT API body (Balance vs Image issue).
 */
async function removeBackground(imageBuffer: Buffer): Promise<Buffer | { error: string; apiBody: string }> {
  const apiKey = getRemoveBgApiKey();
  if (!apiKey) {
    console.error(`${LOG_PREFIX} Step 1 FAILED: REMOVE_BG_API_KEY not set in server/.env`);
    return { error: "REMOVE_BG_API_KEY not set.", apiBody: "" };
  }
  console.log(`${LOG_PREFIX} Step 1: Sending POST (type=product, semitransparency=false, roi=full)... (${imageBuffer.length} bytes)`);

  try {
    const FormData = (await import("form-data")).default;
    const form = new FormData();
    form.append("image_file", imageBuffer, { filename: "image.jpg", contentType: "image/jpeg" });
    form.append("size", "full");
    form.append("type", "product");
    form.append("semitransparency", "false");
    form.append("roi", "0% 0% 100% 100%");

    const response = await axios.post<ArrayBuffer>(REMOVE_BG_URL, form, {
      headers: {
        "X-Api-Key": apiKey,
        ...form.getHeaders(),
      },
      responseType: "arraybuffer",
      timeout: 60000,
      maxContentLength: 50 * 1024 * 1024,
      maxBodyLength: 50 * 1024 * 1024,
      validateStatus: () => true,
    });

    const rawBody = response.data != null ? Buffer.from(response.data).toString("utf8") : "";
    if (response.status !== 200) {
      console.error(`${LOG_PREFIX} Step 1 FAILED: API returned status ${response.status}. EXACT API body below (Balance vs Image issue):`);
      console.error(`${LOG_PREFIX} --- API BODY START ---`);
      console.error(rawBody || "(empty)");
      console.error(`${LOG_PREFIX} --- API BODY END ---`);
      let errMsg = `Remove.bg API error: ${response.status}`;
      try {
        const json = JSON.parse(rawBody);
        if (json.errors?.[0]?.title) errMsg = json.errors[0].title;
        else if (typeof json.error === "string") errMsg = json.error;
      } catch (_) {}
      return { error: errMsg, apiBody: rawBody };
    }

    const png = Buffer.from(response.data);
    if (png.length === 0) {
      console.error(`${LOG_PREFIX} Step 1 FAILED: API returned empty body. EXACT body: ${rawBody || "(empty)"}`);
      return { error: "Remove.bg returned empty image.", apiBody: rawBody };
    }
    console.log(`${LOG_PREFIX} Step 1 OK: Got transparent PNG (${png.length} bytes).`);
    return png;
  } catch (err: unknown) {
    const ax = err as AxiosError<ArrayBuffer>;
    const status = ax.response?.status;
    const body = ax.response?.data != null ? Buffer.from(ax.response.data).toString("utf8") : "";
    console.error(`${LOG_PREFIX} Step 1 FAILED: Network/request error. Status: ${status ?? "N/A"}. Message: ${ax.message ?? err}. EXACT API body below:`);
    console.error(`${LOG_PREFIX} --- API BODY START ---`);
    console.error(body || "(empty)");
    console.error(`${LOG_PREFIX} --- API BODY END ---`);
    return {
      error: status ? `Network/API error: ${status}` : (err instanceof Error ? err.message : "Network error"),
      apiBody: body,
    };
  }
}

/**
 * Production pipeline: optional region crop → Remove.bg → Sharp #FFFFFF.
 */
export async function processImageToWhiteBackground(input: {
  imageBuffer?: Buffer;
  imageUrl?: string;
  /** When set (e.g. from Gemini), crop to this region before Remove.bg instead of calling vision. */
  productRegion?: ProductRegion;
}): Promise<ProcessImageResult> {
  const { imageBuffer, imageUrl, productRegion } = input;

  console.log(`${LOG_PREFIX} Step 0: Starting (Remove.bg primary, white #FFFFFF).`);

  if (!imageBuffer && !imageUrl) {
    console.error(`${LOG_PREFIX} Step 0 FAILED: No imageBuffer or imageUrl provided.`);
    return { ok: false, error: "No image provided.", step: "unknown" };
  }

  let bufferToUse: Buffer;
  if (imageBuffer && imageBuffer.length > 0) {
    bufferToUse = imageBuffer;
  } else if (imageUrl) {
    console.log(`${LOG_PREFIX} Step 0: Fetching image from URL...`);
    try {
      const res = await axios.get<ArrayBuffer>(imageUrl, { responseType: "arraybuffer", timeout: 15000 });
      bufferToUse = Buffer.from(res.data);
      if (bufferToUse.length === 0) throw new Error("Empty response");
      console.log(`${LOG_PREFIX} Step 0 OK: Fetched ${bufferToUse.length} bytes.`);
    } catch (err) {
      console.error(`${LOG_PREFIX} Step 0 FAILED: Could not fetch image URL. ${err instanceof Error ? err.message : err}`);
      return { ok: false, error: "Failed to fetch image from URL.", step: "network" };
    }
  } else {
    console.error(`${LOG_PREFIX} Step 0 FAILED: No valid image data.`);
    return { ok: false, error: "No image data.", step: "unknown" };
  }

  // Crop: use Gemini/product_region when provided, else vision-guided crop.
  const croppedBuffer = productRegion
    ? await cropBufferToRegion(bufferToUse, productRegion)
    : await cropToProductRegion(bufferToUse);
  const noBg = await removeBackground(croppedBuffer);
  if (Buffer.isBuffer(noBg)) {
    const flat = await flattenOntoWhite(noBg);
    if ("error" in flat) return { ok: false, error: flat.error, step: "sharp" };
    console.log(`${LOG_PREFIX} Done: Hero image ready (white #FFFFFF).`);
    return { ok: true, buffer: flat.buffer, mimeType: "image/jpeg" };
  }

  const step = !getRemoveBgApiKey() ? "api_key" : "api_response";
  console.error(`${LOG_PREFIX} Fallthrough: Remove.bg failed. Error: ${noBg.error}. Check logs above for EXACT API body (Balance vs Image).`);
  return { ok: false, error: noBg.error, step };
}

/**
 * Process uploaded image: optional region crop → Remove.bg → Sharp #FFFFFF.
 * Returns final JPEG or original buffer on failure.
 */
export async function processAmazonMainImage(
  inputBuffer: Buffer,
  productRegion?: ProductRegion
): Promise<Buffer> {
  const result = await processImageToWhiteBackground({
    imageBuffer: inputBuffer,
    productRegion,
  });
  if (result.ok && result.buffer.length > 0) return result.buffer;
  if (result.ok && result.buffer.length === 0) {
    console.warn(`${LOG_PREFIX} processAmazonMainImage: processed buffer empty; uploading original.`);
    return inputBuffer;
  }
  console.warn(`${LOG_PREFIX} processAmazonMainImage: ${result.step} — ${result.error}; uploading original.`);
  return inputBuffer;
}
