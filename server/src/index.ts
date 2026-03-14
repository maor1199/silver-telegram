import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { analyzeProduct } from "./agents/analyzeAgent";
import { getMarketData } from "./agents/marketDataProvider";
import { runListingAgentBasic, runListingAgentStep2APlus, runListingAgentStep2Gallery, regenerateBullet, logListingApiStatus } from "./agents/listingAgent";
import sharp from "sharp";
import { processAmazonMainImage } from "./services/amazonMainImage";
import { callPhomoly, PHOMOLY_ERROR_CODES, AMAZON_SPECS, buildStrategicPrompt, buildAmazonPrompt, buildNanoPrompt, type AnnotationItem, type DimensionsInput } from "./services/phomolyService";
import { generateWithClaid } from "./services/claidService";
import { generateListingWithGemini, type GeminiListingRequest } from "./services/geminiPromptService";
import { generateSeoCopyForImage } from "./services/openaiService";

export type VisualRequestType = "A_PLUS_CONTENT" | "LISTING_IMAGES";

/** Amazon resolution: aplus 1935×600, listing 2000×2000. Returns buffer suitable for upload. */
async function resizeToAmazonSpecs(buffer: Buffer, type: VisualRequestType): Promise<Buffer> {
  const spec = type === "A_PLUS_CONTENT" ? AMAZON_SPECS.aplus : AMAZON_SPECS.listing;
  try {
    if (type === "A_PLUS_CONTENT") {
      return await sharp(buffer)
        .resize(spec.width, spec.height, { fit: "inside", withoutEnlargement: false })
        .jpeg({ quality: 100 })
        .toBuffer();
    }
    return await sharp(buffer)
      .resize(spec.width, spec.height, { fit: "cover" })
      .jpeg({ quality: 100 })
      .toBuffer();
  } catch (e) {
    console.warn("[Upload] resizeToAmazonSpecs failed, using original:", e instanceof Error ? e.message : e);
    return buffer;
  }
}

/** Download-friendly item: url + suggested filename for anchor download or FileSaver. */
export type DownloadableImage = { url: string; filename: string };

/** Error payload for UI to show clear messages. */
export type UploadErrorPayload = { ok: false; error: string; code?: string };

/** Listing Images: 4 unique variations. A+ Content: 3 unique banners. */
const LISTING_VARIATION_COUNT = 4;
const A_PLUS_BANNER_COUNT = 3;

/** Calls Claid/Phomoly with vibe, placement, target from v0. Returns 4 variations for listing, 3 for aplus. */
async function generateVisualAssets(
  imageUrl: string,
  type: VisualRequestType,
  options: {
    vibe?: string;
    placement?: string;
    target?: string;
    productUSP?: string;
    environment?: string;
    brandColors?: string;
    referenceImageUrls?: string[];
  }
): Promise<string[] | { error: string; code: string }> {
  const claidType = type === "A_PLUS_CONTENT" ? ("aplus" as const) : ("listing" as const);
  const result = await callPhomoly({
    imageUrl,
    type: claidType,
    vibe: options.vibe,
    placement: options.placement,
    target: options.target,
    productUSP: options.productUSP,
    environment: options.environment,
    brandColors: options.brandColors,
    referenceImageUrls: options.referenceImageUrls,
  });
  if ("error" in result) return result;
  let urls = result.urls;
  const targetCount = type === "A_PLUS_CONTENT" ? A_PLUS_BANNER_COUNT : LISTING_VARIATION_COUNT;
  while (urls.length < targetCount) {
    urls = [...urls, `${urls[0] ?? imageUrl}${(urls[0] ?? "").includes("?") ? "&" : "?"}variant=${urls.length + 1}`];
  }
  return urls.slice(0, targetCount);
}

/** DownloadableImage with optional downloadUrl for force-download (Supabase ?download=filename). */
export type DownloadableImageWithDownload = DownloadableImage & { downloadUrl?: string };

/** Build download-friendly list. downloadUrl uses our proxy so the browser gets Content-Disposition: attachment. */
function toDownloadableImages(urls: string[], type: VisualRequestType, baseName: string): DownloadableImageWithDownload[] {
  const ext = "jpg";
  return urls.map((url, i) => {
    const filename = type === "A_PLUS_CONTENT" ? `${baseName}-aplus-${i + 1}.${ext}` : `${baseName}-listing-${i + 1}.${ext}`;
    return {
      url,
      filename,
      downloadUrl: `/api/listing-builder/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`,
    };
  });
}

dotenv.config();
logListingApiStatus();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB
const LISTING_UPLOAD_BUCKET = (process.env.SUPABASE_LISTING_BUCKET || "listing-images").trim();
const UPLOAD_TIMEOUT_MS = 180000; // 3 min so Phomoly has time; frontend can show "AI is thinking"
const MIN_IMAGE_WIDTH = 200;
const MIN_IMAGE_HEIGHT = 200;

/** Debug: last successful Gemini RAW JSON output (for GET /api/debug-last-run). */
let lastGeminiRaw: string | null = null;
/** Set while upload handler is running so frontend can poll and show "AI is thinking". */
let uploadProcessing = false;

const app = express();
const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;
if (supabase) {
  console.log("✅ Supabase: connected with Service Role Key (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).");
} else if (process.env.SUPABASE_URL || process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("⚠️ Supabase: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY; storage and reports will not be saved.");
}

// Global request logger so we can see every request that hits the server.
app.use((req, _res, next) => {
  console.log("--- NEW REQUEST ---");
  console.log("Method:", req.method);
  console.log("Path:", req.path);
  next();
});

// CORS first (v0, ngrok) — origin: '*' for tunnel/proxy
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning", "bypass-tunnel-reminder"],
}));

// Body parsers at the top — no strict validation, no Zod
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// POST /api/generate — HIBERNATED: image generation is currently disabled. Kept only for backward-compat logging.
app.post("/api/generate", async (req: express.Request, res: express.Response) => {
  console.log("-----------------------------------------");
  console.log("!!! INCOMING REQUEST !!!");
  console.log("Headers:", req.headers);
  console.log("Body:", JSON.stringify(req.body ?? {}).substring(0, 200) + "...");
  console.log("-----------------------------------------");
  console.log("Image generation is currently hibernated. Use /api/generate-listing for SEO text generation.");
  return res.status(200).json({
    success: false,
    error: "Image generation is temporarily disabled. Use /api/generate-listing for SEO listing text.",
    processedImages: [],
  });
});

app.get("/", (req, res) => {
  res.json({ ok: true, message: "AMZ Mentor AI Backend is running" });
});

app.get("/api/debug-last-run", (_req, res) => {
  if (lastGeminiRaw === null) {
    return res.json({ ok: false, message: "No successful Gemini run yet. Upload an image first." });
  }
  res.json({ ok: true, raw: lastGeminiRaw });
});

app.get("/api/listing-builder/health", (req, res) => {
  const hasGemini = Boolean((process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY ?? "").trim());
  const hasClaude = Boolean((process.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_KEY ?? "").trim());
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim());
  const ok = hasGemini || hasClaude || hasOpenAI;
  res.json({
    ok,
    gemini: hasGemini,
    anthropic: hasClaude,
    openai: hasOpenAI,
    message: ok ? "Listing API ready (Gemini preferred)." : "Set GEMINI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY in server .env",
  });
});

/** Processing state for upload: frontend can poll and show "AI is thinking" while status is 'processing'. */
app.get("/api/listing-builder/upload/status", (_req, res) => {
  res.json({ status: uploadProcessing ? "processing" as const : "idle" as const });
});

app.post("/api/analyze", async (req, res) => {
  try {
    const body = req.body || {};
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    const keyword = body.keyword ?? body.product ?? body.search_term ?? "cat cave";
    const sellingPrice = body.sellingPrice ?? body.price ?? 44;
    const unitCost = body.unitCost ?? body.cost ?? 4;
    const shippingCost = body.shippingCost ?? body.shipping ?? 2;

    const marketData = await getMarketData(keyword);

    const result = await analyzeProduct({
      keyword,
      sellingPrice,
      unitCost,
      shippingCost,
      fbaFee: body.fbaFee,
      assumedAcos: body.assumedAcos,
      stage: body.stage,
      complexity: body.complexity,
      differentiation: body.differentiation,
      marketData,
    });

    console.log("✅ /api/analyze keys:", Object.keys(result), marketData?.success ? "| real market data ✓" : "| fallback data");

    if (result.ok && supabase && accessToken && result.report) {
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      if (user?.id) {
        const analysisData = { ...result.report, report_type: "analysis" as const };
        const { error: insertErr } = await supabase
          .from("reports")
          .insert({
            user_id: user.id,
            product_name: keyword,
            analysis_data: analysisData,
          });
        if (insertErr) console.error("❌ Save report:", insertErr.message);
        else console.log("✅ Report saved for user", user.id);
      }
    }

    return res.json(result);
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error("❌ Analyze error:", msg);
    return res.status(500).json({ ok: false, error: msg ? `Analysis failed: ${msg}` : "Analysis failed" });
  }
});

function normalizeKeywords(keywords: unknown): string[] {
  if (Array.isArray(keywords)) return keywords.slice(0, 5).map((k) => String(k).trim()).filter(Boolean);
  if (typeof keywords === "string") return keywords.split(/[,;]/).map((k) => k.trim()).filter(Boolean).slice(0, 5);
  return [];
}

async function handleListingGenerate(
  body: Record<string, unknown>,
  accessToken: string | null,
  autoSave: boolean,
  productImageUrl?: string
): Promise<{ status: number; json: object }> {
  const productNameRaw = body.productName ?? body.product_name ?? (body as Record<string, unknown>).productname ?? "";
  const productName = String(productNameRaw).trim() || "Product";
  const description = String(body.description ?? "").trim();
  const keywords = normalizeKeywords(body.keywords ?? []);

  const result = await runListingAgentBasic({
    productName,
    description: description || "",
    keywords: keywords.length ? keywords : [productName],
    productImageUrl: productImageUrl || (body.productImageUrl as string) || undefined,
  });

    if (autoSave && result.ok && supabase && accessToken && result.report) {
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      if (user?.id) {
        const { error: insertErr } = await supabase
          .from("reports")
          .insert({
            user_id: user.id,
            product_name: result.report.product_name as string,
            analysis_data: result.report,
          });
        if (insertErr) console.error("❌ Save listing report:", insertErr.message);
        else console.log("✅ Listing report saved for user", user.id);
      }
    }

  return { status: 200, json: result };
}

app.post("/api/listing-generate", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const { status, json } = await handleListingGenerate(req.body || {}, accessToken, true);
    return res.status(status).json(json);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Listing generate error:", message);
    return res.status(500).json({ ok: false, error: "Listing generation failed" });
  }
});

app.post("/api/listing-builder", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const { status, json } = await handleListingGenerate(req.body || {}, accessToken, false);
    return res.status(status).json(json);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Listing builder error:", message);
    return res.status(500).json({ ok: false, error: "Listing generation failed" });
  }
});

/** Map v0 UI body to Claid params: vibe, placement, target, type (listing | aplus). */
function mapVisualParams(body: Record<string, unknown>): {
  vibe?: string;
  placement?: string;
  target?: string;
  productUSP?: string;
  environment?: string;
  brandColors?: string;
  referenceImageUrls?: string[];
} {
  const vibe = [body.vibe, body.vibes].find((v) => v != null && String(v).trim() !== "") as string | undefined;
  const placement = [body.placement].find((v) => v != null && String(v).trim() !== "") as string | undefined;
  const target = [body.target].find((v) => v != null && String(v).trim() !== "") as string | undefined;
  const productUSP = [body.productUSP, body.product_usp, body.productUsp].find((v) => v != null && String(v).trim() !== "") as string | undefined;
  const environment = [body.environment, body.env].find((v) => v != null && String(v).trim() !== "") as string | undefined;
  const brandColors = [body.brandColors, body.brand_colors].find((v) => v != null && String(v).trim() !== "") as string | undefined;
  return {
    vibe: vibe != null ? String(vibe).trim() : undefined,
    placement: placement != null ? String(placement).trim() : undefined,
    target: target != null ? String(target).trim() : undefined,
    productUSP: productUSP != null ? String(productUSP).trim() : undefined,
    environment: environment != null ? String(environment).trim() : undefined,
    brandColors: brandColors != null ? String(brandColors).trim() : undefined,
  };
}

/** Send JSON error with optional code for UI. */
function sendUploadError(res: express.Response, status: number, error: string, code?: string): void {
  res.setHeader("Content-Type", "application/json");
  res.status(status).json({ ok: false, error, ...(code ? { code } : {}) });
}

/** Sort files by quality (largest dimension product or size) so index 0 is the best base for photoshoot. */
async function sortFilesByQuality(files: Express.Multer.File[]): Promise<Express.Multer.File[]> {
  const withScore = await Promise.all(
    files.map(async (f) => {
      try {
        const meta = await sharp(f.buffer).metadata();
        const score = (meta.width ?? 0) * (meta.height ?? 0) || f.buffer.length;
        return { file: f, score };
      } catch {
        return { file: f, score: f.buffer.length };
      }
    })
  );
  withScore.sort((a, b) => b.score - a.score);
  return withScore.map((x) => x.file);
}

async function handleListingUpload(req: express.Request, res: express.Response): Promise<void> {
  req.setTimeout(UPLOAD_TIMEOUT_MS);
  res.setTimeout(UPLOAD_TIMEOUT_MS);
  uploadProcessing = true;
  const rawFiles = Array.isArray(req.files) ? req.files : [];
  let files = rawFiles.filter((f: { fieldname?: string }) => f.fieldname === "productImage").slice(0, 3);
  if (files.length === 0) files = rawFiles.slice(0, 3);

  const body: Record<string, unknown> = typeof req.body === "object" && req.body !== null ? req.body : {};
  const requestType = (body.type ?? body.requestType ?? "LISTING_IMAGES") as string;
  const isAPlus = String(requestType).toUpperCase() === "A_PLUS_CONTENT";
  const type: VisualRequestType = isAPlus ? "A_PLUS_CONTENT" : "LISTING_IMAGES";
  const visualParams = mapVisualParams(body);

  console.log("[AMZ-ENGINE] Starting Photoshoot for Amazon Compliance....");

  try {
    if (files.length === 0) {
      sendUploadError(res, 400, "At least one product image is required.", "MISSING_IMAGE");
      return;
    }
    if (!supabase) {
      sendUploadError(res, 503, "Image upload is not configured. Set Supabase and create a public 'listing-images' bucket.", "UPLOAD_NOT_CONFIGURED");
      return;
    }

    // Validate dimensions so UI can show "Image too small" instead of generic failure
    for (let i = 0; i < files.length; i++) {
      const file = files[i] as Express.Multer.File;
      try {
        const meta = await sharp(file.buffer).metadata();
        const w = meta.width ?? 0;
        const h = meta.height ?? 0;
        if (w < MIN_IMAGE_WIDTH || h < MIN_IMAGE_HEIGHT) {
          sendUploadError(res, 400, `Image too small. Use at least ${MIN_IMAGE_WIDTH}×${MIN_IMAGE_HEIGHT} pixels.`, "IMAGE_TOO_SMALL");
          return;
        }
      } catch {
        sendUploadError(res, 400, "Invalid or corrupted image. Please upload a valid JPEG or PNG.", "INVALID_IMAGE");
        return;
      }
    }

    files = await sortFilesByQuality(files as Express.Multer.File[]);

    const startTime = Date.now();
    const ts = startTime;
    const baseName = "amz-mentor";
    const originalUrls: string[] = [];
    const processedUrls: string[] = [];

    const spec = type === "A_PLUS_CONTENT" ? AMAZON_SPECS.aplus : AMAZON_SPECS.listing;
    const dimensionLabel = type === "A_PLUS_CONTENT" ? `${spec.width}×${spec.height} (A+ Content)` : `${spec.width}×${spec.height} (Listing 1:1)`;

    for (let i = 0; i < files.length; i++) {
      const file = files[i] as Express.Multer.File;
      const suffix = `${ts}-${i}-${Math.random().toString(36).slice(2)}`;

      const originalPath = `${suffix}-original.jpg`;
      const { error: origErr } = await supabase.storage.from(LISTING_UPLOAD_BUCKET).upload(originalPath, file.buffer, {
        contentType: file.mimetype || "image/jpeg",
        upsert: false,
      });
      if (origErr) {
        console.error("[Upload] Original save failed:", origErr.message);
        sendUploadError(res, 500, "Failed to store original image.", "STORAGE_ERROR");
        return;
      }
      const { data: origData } = supabase.storage.from(LISTING_UPLOAD_BUCKET).getPublicUrl(originalPath);
      originalUrls.push(origData.publicUrl);

      let processedBuffer = await processAmazonMainImage(file.buffer);
      if (!processedBuffer || processedBuffer.length === 0) {
        processedUrls.push(origData.publicUrl);
        continue;
      }
      processedBuffer = await resizeToAmazonSpecs(processedBuffer, type);
      const processedPath = `${suffix}-processed.jpg`;
      const { error: procErr } = await supabase.storage.from(LISTING_UPLOAD_BUCKET).upload(processedPath, processedBuffer, {
        contentType: "image/jpeg",
        upsert: false,
      });
      if (procErr) {
        console.error("[Upload] Processed save failed:", procErr.message);
        processedUrls.push(origData.publicUrl);
        continue;
      }
      const { data: procData } = supabase.storage.from(LISTING_UPLOAD_BUCKET).getPublicUrl(processedPath);
      processedUrls.push(procData.publicUrl);
    }

    // Phomoly: use all uploaded images — best quality as base, rest as reference for details/colors. Response must be NEW Phomoly URLs only.
    const baseUrl = processedUrls[0] ?? originalUrls[0];
    const referenceUrls = processedUrls.length > 1 ? processedUrls.slice(1) : originalUrls.length > 1 ? originalUrls.slice(1) : undefined;
    if (processedUrls.length > 1 || (originalUrls.length > 1 && !processedUrls.length)) {
      console.log(`[AMZ-ENGINE] Using ${1 + (referenceUrls?.length ?? 0)} uploaded image(s): 1 base + ${referenceUrls?.length ?? 0} reference(s).`);
    }

    if (type === "A_PLUS_CONTENT") {
      const visualResult = await generateVisualAssets(baseUrl, type, {
        ...visualParams,
        referenceImageUrls: referenceUrls,
      });
      if ("error" in visualResult) {
        const status =
          visualResult.code === PHOMOLY_ERROR_CODES.API_LIMIT_REACHED
            ? 429
            : visualResult.code === PHOMOLY_ERROR_CODES.PHOMOLY_NOT_CONFIGURED
              ? 503
              : 500;
        sendUploadError(res, status, visualResult.error, visualResult.code);
        return;
      }
      const processedImages = toDownloadableImages(visualResult, type, baseName);
      const originalImages = originalUrls.map((url, i) => {
        const filename = `${baseName}-original-${i + 1}.jpg`;
        return { url, filename, downloadUrl: `/api/listing-builder/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}` };
      });
      const processingTime = Date.now() - startTime;
      const firstUrl = processedImages[0]?.url ?? visualResult[0] ?? originalUrls[0];
      console.log(`[Upload] Image(s) generated successfully: ${dimensionLabel} — ${processedImages.length} asset(s), ${processingTime}ms`);
      res.setHeader("Content-Type", "application/json");
      res.json({
        ok: true,
        success: true,
        status: "image_ready",
        imageUrl: firstUrl,
        processingTime,
        originalUrls,
        processedUrls: visualResult,
        originalImages,
        processedImages,
      });
      return;
    }

    const visualResult = await generateVisualAssets(baseUrl, type, {
      ...visualParams,
      referenceImageUrls: referenceUrls,
    });
    if ("error" in visualResult) {
      const status =
        visualResult.code === PHOMOLY_ERROR_CODES.API_LIMIT_REACHED
          ? 429
          : visualResult.code === PHOMOLY_ERROR_CODES.PHOMOLY_NOT_CONFIGURED
            ? 503
            : 500;
      sendUploadError(res, status, visualResult.error, visualResult.code);
      return;
    }
    const finalUrls = visualResult;
    const processedImages = toDownloadableImages(finalUrls, type, baseName);
    const originalImages = originalUrls.map((url, i) => {
      const filename = `${baseName}-original-${i + 1}.jpg`;
      return { url, filename, downloadUrl: `/api/listing-builder/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}` };
    });
    const processingTime = Date.now() - startTime;
    const firstUrl = processedImages[0]?.url ?? finalUrls[0] ?? originalUrls[0];
    console.log(`[Upload] Image(s) generated successfully: ${dimensionLabel} — ${processedImages.length} asset(s), ${processingTime}ms`);
    res.setHeader("Content-Type", "application/json");
    res.json({
      ok: true,
      success: true,
      status: "image_ready",
      imageUrl: firstUrl,
      processingTime,
      originalUrls,
      processedUrls: finalUrls,
      originalImages,
      processedImages,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Upload error:", message);
    sendUploadError(res, 500, message, "SERVER_ERROR");
  } finally {
    uploadProcessing = false;
  }
}

// Force-download proxy: Content-Disposition attachment with professional filename (amazon-ready-[timestamp].jpg).
app.get("/api/listing-builder/download", async (req, res) => {
  const url = typeof req.query.url === "string" ? req.query.url : "";
  const filename =
    typeof req.query.filename === "string" && req.query.filename.trim() !== ""
      ? req.query.filename.trim()
      : `amazon-ready-${Date.now()}.jpg`;
  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ ok: false, error: "Missing or invalid url" });
  }
  try {
    const axios = (await import("axios")).default;
    const { data } = await axios.get(url, { responseType: "stream", timeout: 30000 });
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Content-Disposition", `attachment; filename="${filename.replace(/"/g, "%22")}"`);
    data.pipe(res);
  } catch (e) {
    console.error("[Download] proxy failed:", e instanceof Error ? e.message : e);
    res.status(502).json({ ok: false, error: "Download failed" });
  }
});

/** Safely parse annotations from v0 body — never throw; default to []. */
function safeAnnotations(body: Record<string, unknown>): AnnotationItem[] {
  try {
    const raw = body.annotations ?? body.annotation;
    if (raw == null) return [];
    if (!Array.isArray(raw)) return [];
    return raw.map((a: unknown) => {
      if (a == null || typeof a !== "object") return {};
      const o = a as Record<string, unknown>;
      return {
        label: o.label != null ? String(o.label) : undefined,
        subtext: o.subtext != null ? String(o.subtext) : undefined,
        position: o.position != null ? String(o.position) : undefined,
      };
    });
  } catch {
    return [];
  }
}

/** Safely parse dimensions from v0 body — never throw; default to {}. */
function safeDimensions(body: Record<string, unknown>): DimensionsInput {
  try {
    const raw = body.dimensions ?? body.dims;
    if (raw == null) return {};
    if (typeof raw !== "object" || Array.isArray(raw)) return {};
    const o = raw as Record<string, unknown>;
    const num = (v: unknown): number | undefined => (v != null && !Number.isNaN(Number(v)) ? Number(v) : undefined);
    return {
      H: num(o.H),
      W: num(o.W),
      D: num(o.D),
      height: num(o.height),
      width: num(o.width),
      depth: num(o.depth),
    };
  } catch {
    return {};
  }
}

// Listing upload: expose multiple paths so frontend works whether it calls /upload, /api/upload, or /api/listing-builder/upload.
app.post("/api/listing-builder/upload", upload.any(), (req, res) => handleListingUpload(req, res));
app.post("/api/upload", upload.any(), (req, res) => handleListingUpload(req, res));
app.post("/upload", upload.any(), (req, res) => handleListingUpload(req, res));

app.post("/api/listing-builder/regenerate-bullet", async (req, res) => {
  try {
    const body = req.body ?? {};
    const report = body.report ?? body;
    const bulletIndex = typeof body.bulletIndex === "number" ? body.bulletIndex : parseInt(String(body.bulletIndex ?? "0"), 10);
    const result = await regenerateBullet(report, bulletIndex);
    return res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ regenerate-bullet error:", message);
    return res.status(500).json({ ok: false, error: String(message) });
  }
});

// HIBERNATE image-based A+ & Gallery routes: keep handlers, but short-circuit with clear message.
app.post("/api/listing-builder/generate-a-plus", async (_req, res) => {
  console.log("A+ image generation is hibernated. Use /api/generate-listing for SEO text.");
  return res.status(200).json({ ok: false, error: "A+ image generation is temporarily disabled." });
});

app.post("/api/listing-builder/generate-gallery", async (_req, res) => {
  console.log("Gallery image generation is hibernated. Use /api/generate-listing for SEO text.");
  return res.status(200).json({ ok: false, error: "Gallery image generation is temporarily disabled." });
});

// NEW: POST /api/generate-listing — High-End Amazon SEO Listing Builder (text-only via Gemini)
app.post("/api/generate-listing", async (req: express.Request, res: express.Response) => {
  console.log("🚀 API ROUTE HIT!");
  console.log("-----------------------------------------");
  console.log("!!! INCOMING REQUEST !!!");
  console.log("Headers:", req.headers);
  console.log("Body:", JSON.stringify(req.body ?? {}).substring(0, 200) + "...");
  console.log("-----------------------------------------");

  console.log("--- REQ RECEIVED ---", req.body);

  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const productName = String(body.productName ?? "").trim();
    const productDescription = String(body.productDescription ?? "").trim();
    const keywordsRaw = body.keywords;
    const keywords: string[] = Array.isArray(keywordsRaw)
      ? keywordsRaw.map((k) => String(k ?? "").trim()).filter(Boolean)
      : typeof keywordsRaw === "string"
        ? keywordsRaw.split(/[,\n]/).map((k) => k.trim()).filter(Boolean)
        : [];
    const brandName = typeof body.brandName === "string" ? body.brandName.trim() : "";
    const marketData = body.marketData != null ? body.marketData : undefined;
    const financials = body.financials != null ? body.financials : undefined;

    const request: GeminiListingRequest = {
      productName,
      productDescription,
      keywords,
      ...(brandName && { brandName }),
      ...(marketData !== undefined && { marketData }),
      ...(financials !== undefined && { financials }),
    };
    const result = await generateListingWithGemini(request);
    const responsePayload = {
      title: result.title,
      bulletPoints: result.bulletPoints,
      description: result.description,
      seoNote: result.seoNote ?? "",
      backendSearchTerms: result.backendSearchTerms ?? "",
      marketReality: result.marketReality ?? "",
      strategicIntelligence: result.strategicIntelligence ?? "",
      executionPlan: result.executionPlan ?? "",
      risks: result.risks ?? "",
      opportunities: result.opportunities ?? "",
      estimatedMargin: result.estimatedMargin ?? "",
      verdict: result.verdict ?? "NO-GO",
    };
    console.log("Sending to Frontend:", responsePayload);
    return res.json(responsePayload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/generate-listing] Route Error:", message);
    return res.status(500).json({
      title: "",
      bulletPoints: [],
      description: "",
      error: message,
    });
  }
});

app.post("/api/listing-builder/save", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!supabase || !accessToken) {
      return res.status(401).json({ ok: false, error: "Sign in to save to My Analyses" });
    }
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user?.id) {
      return res.status(401).json({ ok: false, error: "Sign in to save to My Analyses" });
    }
    const payload = req.body?.report ?? req.body;
    const productName = (payload?.product_name ?? payload?.title ?? "Listing").toString().trim() || "Listing";
    const analysisData = typeof payload === "object" && payload !== null ? { ...payload, report_type: "listing" } : { report_type: "listing", product_name: productName };
    const { error: insertErr } = await supabase
      .from("reports")
      .insert({ user_id: user.id, product_name: productName, analysis_data: analysisData });
    if (insertErr) {
      console.error("❌ Save listing to reports:", insertErr.message);
      return res.status(500).json({ ok: false, error: "Failed to save" });
    }
    console.log("✅ Listing saved for user", user.id);
    return res.json({ ok: true, saved: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Listing builder save error:", message);
    return res.status(500).json({ ok: false, error: "Save failed" });
  }
});

// Always return JSON for unknown routes so the client never gets HTML (avoids "Unexpected token '<'").
app.use((_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(404).json({ ok: false, error: "Not found", code: "NOT_FOUND" });
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log("=========================================");
  console.log("🚀 Server running on http://localhost:" + PORT);
  console.log("✅ SERVER_READY_FOR_V0");
  console.log("=========================================");
});
// Backend must be reachable at http://localhost:3001 for POST /api/generate (frontend uses VITE_API_URL=http://localhost:3001).