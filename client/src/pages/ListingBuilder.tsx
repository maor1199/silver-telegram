import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Loader2,
  Sparkles,
  Type,
  List,
  LayoutGrid,
  FileText,
  Save,
  Upload,
  X,
  ArrowLeft,
  Lightbulb,
  Pencil,
  RotateCcw,
  Palette,
  ImagePlus,
} from "lucide-react";

// Use VITE_API_URL or relative path so Vite dev proxy can forward to backend (avoids "Failed to fetch").
const API = (import.meta.env.VITE_API_URL ?? "").trim() || "";

/** Strip technical/strategy jargon from title so Copywriter shows only clean, high-conversion copy. No A9, Golden 80, PPC, LSI, or strategy terms. */
function sanitizeTitle(title: string): string {
  if (!title || typeof title !== "string") return title;
  let t = title.trim();
  const remove = [
    /\s*[-–|]\s*Strong Variants\s*[-–|]?/gi,
    /\s*Strong Variants\s*/gi,
    /\s*A9\s+Algorithm\s*/gi,
    /\s*A9\s*/gi,
    /\s*Golden\s*80\s*(Indexing)?\s*/gi,
    /\s*Strategic\s+Intelligence\s*[:.]?\s*/gi,
    /\s*Market\s+Reality\s*[:.]?\s*/gi,
    /\s*\(?\s*SEO[^)]*\)?\s*/gi,
    /\s*\(?\s*LSI[^)]*\)?\s*/gi,
    /\s*\(?\s*PPC[^)]*\)?\s*/gi,
    /\s*—\s*Indexing[^|]*/gi,
    /\s*\bPPC\s+(?:Exact|Launch|keywords?)\s*/gi,
    /\s*\bLSI\s+(?:keywords?|terms?)\s*/gi,
  ];
  for (const r of remove) t = t.replace(r, " ");
  return t.replace(/\s+/g, " ").replace(/^\s*[-–|]\s*|\s*[-–|]\s*$/g, "").trim();
}

export type ListingResult = {
  ok: boolean;
  error?: string;
  /** Public Supabase URL for the processed hero image (prefer this). */
  heroImageUrl?: string;
  step?: "basic_complete" | "full";
  copy: {
    title: string;
    bulletPoints: string[];
    productDescription?: string;
    aPlusContentIdeas: string[];
    aPlusLayoutIdeas?: { moduleTitle: string; bodyText: string; imageSuggestion: string }[];
  };
  imagePrompts?: { type: string; prompt: string }[];
  generatedImages?: { type: string; prompt: string; url: string }[];
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

type ListingBuilderProps = {
  savedReport?: ListingResult | null;
  onClearSaved?: () => void;
  onSaved?: () => void;
  user?: { email?: string } | null;
};

export function ListingBuilder({ savedReport, onClearSaved, onSaved, user }: ListingBuilderProps) {
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productName, setProductName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ListingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [styleOptions, setStyleOptions] = useState<StyleOptions>({ style: "luxury", primaryColor: "#1a1a2e", targetAudience: "", layoutPreference: "grid", background: "home", vibe: "" });
  const [aPlusLoading, setAPlusLoading] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [visualStudioOpen, setVisualStudioOpen] = useState(false);
  const [visualTab, setVisualTab] = useState<"aplus" | "gallery">("aplus");
  const [bulletRegenerating, setBulletRegenerating] = useState<number | null>(null);
  const [listingEditMode, setListingEditMode] = useState(false);

  const displayResult = result ?? savedReport;
  const isBasicComplete = Boolean(displayResult?.ok && (displayResult as ListingResult).step === "basic_complete");
  const hasValidCopy = Boolean(displayResult?.ok && displayResult?.copy && (displayResult.copy.title?.trim() || (displayResult.copy.bulletPoints?.length && displayResult.copy.bulletPoints.some((b) => b?.trim()))));
  const getTitle = () => sanitizeTitle(String(displayResult?.copy?.title ?? (displayResult?.copy as Record<string, unknown>)?.title ?? ""));
  const getBullets = (): string[] => {
    const c = displayResult?.copy;
    if (!c) return [];
    const arr = c.bulletPoints ?? (c as Record<string, unknown>).bullet_points ?? (c as Record<string, unknown>).bullets;
    return Array.isArray(arr) ? arr.slice(0, 5) : [];
  };
  const getDescription = () => displayResult?.copy?.productDescription ?? (displayResult?.copy as Record<string, unknown>)?.product_description ?? (displayResult?.copy as Record<string, unknown>)?.description ?? "";

  const THINKING_STEPS = [
    { icon: "🔍", label: "Gemini: Analyzing image..." },
    { icon: "📊", label: "SEO copy & PPC keywords..." },
    { icon: "📸", label: "Imagen: Hero & lifestyle photos..." },
  ] as const;

  const THINKING_STEPS_APLUS = [
    { icon: "🎨", label: "Building A+ module prompts..." },
    { icon: "✨", label: "Generating A+ module images with Flux..." },
  ] as const;

  const THINKING_STEPS_GALLERY = [
    { icon: "🖼️", label: "Preparing lifestyle scenes..." },
    { icon: "✨", label: "Generating 5 gallery images with Flux..." },
  ] as const;

  const [aPlusThinkingStep, setAPlusThinkingStep] = useState(0);
  const [galleryThinkingStep, setGalleryThinkingStep] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setThinkingStep((s) => (s + 1) % 3), 2500);
    return () => clearInterval(t);
  }, [loading]);
  useEffect(() => {
    if (!aPlusLoading) return;
    const t = setInterval(() => setAPlusThinkingStep((s) => (s + 1) % 2), 2000);
    return () => clearInterval(t);
  }, [aPlusLoading]);
  useEffect(() => {
    if (!galleryLoading) return;
    const t = setInterval(() => setGalleryThinkingStep((s) => (s + 1) % 2), 2000);
    return () => clearInterval(t);
  }, [galleryLoading]);
  const keywordsList = keywords.split(/[,\n]+/).map((k) => k.trim()).filter(Boolean);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) setProductImage(file);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) setProductImage(file);
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSaveSuccess(false);
    if (onClearSaved) onClearSaved();

    if (!productImage) {
      setError("Please upload a high-quality photo of your product first. This is required for AI image generation.");
      setLoading(false);
      return;
    }

    try {
      const session = await (await import("../lib/supabase")).supabase?.auth.getSession();
      const token = session?.data?.session?.access_token;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const nameValue = (productName != null && String(productName).trim() !== "") ? String(productName).trim() : "Product";
      const form = new FormData();
      form.append("productName", nameValue);
      form.append("product_name", nameValue);
      form.append("description", description.trim());
      form.append("keywords", (keywordsList.length ? keywordsList : [nameValue]).join(","));
      form.append("productImage", productImage);
      // Wait for full server response (no streaming); server returns listing + copy + report.
      const res = await axios.post<ListingResult>(`${API}/api/listing-builder/upload`, form, {
        headers,
        validateStatus: () => true,
        responseType: "json",
      });
      const data = res.data;
      // Server may return HTML (e.g. SPA fallback or wrong host) instead of JSON — avoid "Unexpected token '<'" parse error.
      if (typeof data === "string" && (data as string).trim().startsWith("<")) {
        setError("Server returned a page instead of data. Is the backend running? (e.g. npm run dev in the server folder)");
        setResult(null);
        return;
      }
      if (data?.ok) {
        // Prefer listing object from server so Title, Bullets, Description map reliably (backend sends both copy and listing).
        const rawCopy = ((data as Record<string, unknown>).listing ?? data.copy ?? data) as Record<string, unknown> | undefined;
        const bulletsRaw = Array.isArray(rawCopy?.bulletPoints)
          ? rawCopy.bulletPoints as string[]
          : Array.isArray(rawCopy?.bullet_points)
            ? rawCopy.bullet_points as string[]
            : Array.isArray(rawCopy?.bullets)
              ? rawCopy.bullets as string[]
              : [];
        const bulletPoints = [...bulletsRaw.slice(0, 5)];
        while (bulletPoints.length < 5) bulletPoints.push("");
        const rawTitle = typeof rawCopy?.title === "string" ? rawCopy.title : String(rawCopy?.title ?? "").trim();
        const title = sanitizeTitle(rawTitle);
        const productDescription = typeof rawCopy?.productDescription === "string"
          ? rawCopy.productDescription
          : typeof rawCopy?.product_description === "string"
            ? rawCopy.product_description
            : typeof rawCopy?.description === "string"
              ? rawCopy.description
              : String(rawCopy?.productDescription ?? rawCopy?.product_description ?? rawCopy?.description ?? "").trim();
        const hasContent = title !== "" || bulletPoints.some((b) => (b ?? "").trim() !== "");
        if (!hasContent) {
          setError("API returned empty listing data. Check your backend response shape.");
          setResult(null);
        } else {
          const src = (data.copy ?? (data as Record<string, unknown>).listing) as Record<string, unknown> | undefined;
          const aPlusContentIdeas = Array.isArray(src?.aPlusContentIdeas) ? src.aPlusContentIdeas as string[] : Array.isArray(src?.a_plus_content_ideas) ? src.a_plus_content_ideas as string[] : [];
          const aPlusLayoutIdeas = Array.isArray(src?.aPlusLayoutIdeas) ? src.aPlusLayoutIdeas as { moduleTitle: string; bodyText: string; imageSuggestion: string }[] : Array.isArray(src?.a_plus_layout_ideas) ? src.a_plus_layout_ideas as { moduleTitle: string; bodyText: string; imageSuggestion: string }[] : [];
          const normalized: ListingResult = {
            ...data,
            ok: true,
            copy: { title, bulletPoints, productDescription, aPlusContentIdeas, aPlusLayoutIdeas },
            generatedImages: Array.isArray(data.generatedImages) ? data.generatedImages : (Array.isArray((data as Record<string, unknown>).generated_images) ? (data as Record<string, unknown>).generated_images as { type: string; prompt: string; url: string }[] : []),
            report: data.report ?? {},
          };
          setResult(normalized);
          setError(null);
          onSaved?.();
        }
      } else if (data?.ok && (data as Record<string, unknown>).status === "image_ready" && ((data as { processedUrls?: string[] }).processedUrls?.length || (data as { processedImages?: { url: string }[] }).processedImages?.length)) {
        const processedUrls = (data as { processedUrls?: string[] }).processedUrls ?? [];
        const processedImages = (data as { processedImages?: { url: string }[] }).processedImages ?? [];
        const heroUrl = processedUrls[0] ?? processedImages[0]?.url;
        const normalized: ListingResult = {
          ok: true,
          copy: { title: "", bulletPoints: [], productDescription: "", aPlusContentIdeas: [], aPlusLayoutIdeas: [] },
          generatedImages: heroUrl ? [{ type: "hero", prompt: "", url: heroUrl }] : [],
          report: { product_image_url: heroUrl },
        };
        setResult(normalized);
        setError(null);
        onSaved?.();
      } else {
        const serverError = (data as { error?: string })?.error ?? "Listing generation failed";
        setError(serverError === "Not found" ? "Server endpoint not found. Make sure the backend is running (e.g. npm run dev in the server folder)." : serverError);
        setResult(null);
      }
    } catch (err: unknown) {
      const res = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: { error?: string }; status?: number }; code?: string; message?: string }).response : undefined;
      const ax = err && typeof err === "object" ? (err as { code?: string; message?: string }) : null;
      const data = res?.data;
      const status = res?.status;
      const code = ax?.code ?? "";
      let msg = data && typeof data === "object" && data !== null && "error" in data
        ? String((data as { error?: string }).error)
        : res?.status === 400
          ? "Invalid request. Check that you uploaded an image and entered a product name."
          : ax?.message ?? (err instanceof Error ? err.message : "Listing generation failed");
      const full = `${code} ${msg}`.toLowerCase();
      if (status === 401) {
        msg = "Unauthorized (401). The server API key may be invalid. Check PHOMOLY_API_KEY in server .env.";
      } else if (code === "ECONNABORTED" || /timeout/i.test(full)) {
        msg = "Request timed out. The server took too long to respond. Try again or check the server.";
      } else if (/failed to fetch|network error|err_connection_refused|err_network|econnrefused|econnreset|net::err/i.test(full)) {
        msg = "Network error: could not reach the backend. Start the server (npm run dev in the server folder) and open this app at http://localhost:5173 (npm run dev in client).";
      } else if (/not valid json|unexpected token\s*['"]</i.test(full)) {
        msg = "Server returned a page instead of data. Is the backend running? (e.g. npm run dev in the server folder)";
      } else if (status === 404 || /not found|404/i.test(full)) {
        msg = "Server endpoint not found (404). Make sure the backend is running (e.g. npm run dev in the server folder).";
      }
      setError(msg);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const saveToMyAnalyses = async () => {
    if (!displayResult?.report) return;
    setSaveLoading(true);
    setSaveSuccess(false);
    setError(null);
    try {
      const session = await (await import("../lib/supabase")).supabase?.auth.getSession();
      const token = session?.data?.session?.access_token;
      if (!token) {
        setError("Sign in to save to My Analyses");
        setSaveLoading(false);
        return;
      }
      await axios.post(
        `${API}/api/listing-builder/save`,
        { report: displayResult.report },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSaveSuccess(true);
      onSaved?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaveLoading(false);
    }
  };

  const generateAPlus = async () => {
    const report = displayResult?.report ?? result?.report;
    if (!report || aPlusLoading) return;
    setAPlusLoading(true);
    setError(null);
    try {
      const { data } = await axios.post<{ ok: boolean; error?: string; generatedImages: { type: string; prompt: string; url: string }[] }>(
        `${API}/api/listing-builder/generate-a-plus`,
        { report, styleOptions },
        { validateStatus: () => true }
      );
      if (data?.ok && data.generatedImages?.length) {
        const base = result ?? displayResult;
        setResult(base ? {
          ...base,
          generatedImages: [...(base.generatedImages ?? []), ...data.generatedImages],
          report: { ...base.report, generated_images: [...(base.generatedImages ?? []), ...data.generatedImages] } as Record<string, unknown>,
        } as ListingResult : null);
      } else {
        setError((data as { error?: string })?.error ?? "A+ generation failed");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "A+ generation failed");
    } finally {
      setAPlusLoading(false);
    }
  };

  const updateCopy = (patch: { title?: string; bulletPoints?: string[]; productDescription?: string }) => {
    const next = displayResult ? { ...displayResult, copy: { ...displayResult.copy, ...patch }, report: { ...displayResult.report, title: patch.title ?? displayResult.copy?.title, bullet_points: patch.bulletPoints ?? displayResult.copy?.bulletPoints, product_description: patch.productDescription ?? displayResult.copy?.productDescription } as Record<string, unknown> } : null;
    if (next) setResult(next as ListingResult);
  };

  const regenerateSingleBullet = async (index: number) => {
    if (!displayResult?.report || bulletRegenerating !== null) return;
    setBulletRegenerating(index);
    setError(null);
    try {
      const report = displayResult.report as { title?: string; bullet_points?: string[]; product_description?: string; product_name?: string };
      const { data } = await axios.post<{ ok: boolean; error?: string; bulletPoint?: string }>(
        `${API}/api/listing-builder/regenerate-bullet`,
        { report, bulletIndex: index },
        { validateStatus: () => true }
      );
      if (data?.ok && data.bulletPoint) {
        const bullets = [...(displayResult.copy?.bulletPoints ?? [])];
        while (bullets.length < 5) bullets.push("");
        bullets[index] = data.bulletPoint;
        updateCopy({ bulletPoints: bullets });
      } else {
        setError((data as { error?: string })?.error ?? "Regenerate failed");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Regenerate failed");
    } finally {
      setBulletRegenerating(null);
    }
  };

  const generateGallery = async () => {
    const report = displayResult?.report ?? result?.report;
    if (!report || galleryLoading) return;
    setGalleryLoading(true);
    setError(null);
    try {
      const { data } = await axios.post<{ ok: boolean; error?: string; generatedImages: { type: string; prompt: string; url: string }[] }>(
        `${API}/api/listing-builder/generate-gallery`,
        { report, styleOptions },
        { validateStatus: () => true }
      );
      if (data?.ok && data.generatedImages?.length) {
        const base = result ?? displayResult;
        setResult(base ? {
          ...base,
          generatedImages: [...(base.generatedImages ?? []), ...data.generatedImages],
          report: { ...base.report, generated_images: [...(base.generatedImages ?? []), ...data.generatedImages] } as Record<string, unknown>,
        } as ListingResult : null);
      } else {
        setError((data as { error?: string })?.error ?? "Gallery generation failed");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gallery generation failed");
    } finally {
      setGalleryLoading(false);
    }
  };

  const phase = loading ? "thinking" : displayResult ? "results" : "form";

  return (
    <div className="relative min-h-[60vh] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-amber-950/20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:24px_24px]" aria-hidden />
      <div className="relative mx-auto max-w-5xl space-y-8 px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Analysis
        </Link>

        {/* Server/form error: show in Title-style box so it's unmissable */}
        {error && phase === "form" && (
          <div className="rounded-xl border-2 border-red-500/50 bg-red-500/15 p-4 shadow-lg" role="alert">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-400/90">Error (what failed)</h4>
            <p className="text-red-200 font-medium whitespace-pre-wrap break-words">{error}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === "thinking" && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-[50vh] rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl"
            >
              <h3 className="mb-2 text-center text-lg font-semibold text-white">Generating your listing</h3>
              <p className="mb-6 text-center text-sm text-white/60">{THINKING_STEPS[thinkingStep]?.label ?? "Preparing…"}</p>
              <div className="space-y-4">
                {THINKING_STEPS.map((step, i) => (
                  <motion.div
                    key={i}
                    className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition ${
                      i === thinkingStep
                        ? "border-amber-500/50 bg-amber-500/10 text-amber-100"
                        : "border-white/10 bg-white/5 text-white/70"
                    }`}
                    animate={i === thinkingStep ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <span className="text-2xl">{step.icon}</span>
                    <span className="text-sm font-medium">{step.label}</span>
                    {i === thinkingStep && <Loader2 className="ml-auto h-5 w-5 animate-spin text-amber-400" />}
                  </motion.div>
                ))}
              </div>
              <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-amber-500"
                  initial={{ width: "0%" }}
                  animate={{ width: ["0%", "70%", "90%", "70%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          )}

          {phase === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-8 lg:grid-cols-[1fr_320px]"
            >
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Sparkles className="h-5 w-5 text-amber-500" />
              AI Listing Builder
            </h2>
        <p className="mb-6 text-sm text-white/60">
          Upload a high-quality product photo first. We’ll generate Amazon-ready copy and photorealistic listing images.
        </p>

        {/* Mandatory image upload – drag and drop */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-white/70">
            Product photo <span className="text-amber-400">(required)</span>
          </label>
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`relative rounded-xl border-2 border-dashed p-8 text-center transition ${
              dragActive ? "border-amber-500/60 bg-amber-500/10" : "border-white/20 bg-white/5 hover:border-white/30"
            } ${productImage ? "border-emerald-500/40 bg-emerald-500/5" : ""}`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={onFileSelect}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            {productImage ? (
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <img
                  src={URL.createObjectURL(productImage)}
                  alt="Product"
                  className="h-28 w-28 rounded-lg object-cover border border-white/10"
                />
                <div className="text-left sm:text-center">
                  <p className="text-sm font-medium text-white">{productImage.name}</p>
                  <p className="text-xs text-white/50">{(productImage.size / 1024).toFixed(1)} KB</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setProductImage(null); }}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-10 w-10 text-white/40" />
                <p className="mt-2 text-sm text-white/80">Drag and drop your product photo here, or click to browse</p>
                <p className="mt-1 text-xs text-white/50">High-quality photo recommended. PNG or JPG, max 10MB.</p>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Product name</label>
            <div className="relative">
              <Type className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Organic Cat Cave Bed"
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Keywords</label>
            <div className="relative">
              <List className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. cat bed, organic, cave, pet"
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Product description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description: materials, key benefits..."
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>
          <button
            onClick={generate}
            disabled={loading || !productImage}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 font-semibold text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.35)] ring-2 ring-amber-400/40 transition hover:bg-amber-400 hover:shadow-[0_0_28px_rgba(245,158,11,0.45)] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
            {loading ? "Generating..." : "Generate AI Listing"}
          </button>
        </div>
          </div>

          <aside className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl lg:sticky lg:top-8 lg:self-start">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Pro Tips
            </h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex gap-2">
                <span className="text-amber-400">•</span>
                Use high-resolution photos (at least 1000px) for best AI image results.
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400">•</span>
                Include your target audience in keywords (e.g. &quot;gift for cat owners&quot;).
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400">•</span>
                Describe materials and key benefits in the description for stronger copy.
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400">•</span>
                Product on plain or white background works best for image generation.
              </li>
            </ul>
          </aside>
            </motion.div>
          )}

          {phase === "results" && displayResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Copy generation failed: show only error, no dashboard */}
            {!hasValidCopy && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                <p className="text-red-300 font-medium">Copy generation failed</p>
                <p className="mt-2 text-sm text-white/80">{(displayResult as ListingResult).error ?? "No copy was generated. Check your API keys and try again."}</p>
                <button
                  type="button"
                  onClick={() => { setResult(null); setError(null); if (onClearSaved) onClearSaved(); }}
                  className="mt-4 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
                >
                  Back to form
                </button>
              </div>
            )}

            {/* Phase 1: Listing Foundation (Copy Editor) – show when has valid copy and Visual Studio not open */}
            {hasValidCopy && !visualStudioOpen && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <FileText className="h-6 w-6 text-amber-500" />
                    Ready-to-Post Listing
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setListingEditMode((e) => !e)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white/90"
                      aria-label={listingEditMode ? "Done editing" : "Edit listing"}
                    >
                      <Pencil className="h-3.5 w-3.5" /> {listingEditMode ? "Done" : "Edit"}
                    </button>
                    {displayResult.report && (user || result) && (
                    <button
                      type="button"
                      onClick={saveToMyAnalyses}
                      disabled={saveLoading || !user}
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-400 hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {saveSuccess ? "Saved" : user ? "Save to My Analyses" : "Sign in to save"}
                    </button>
                    )}
                  </div>
                </div>

                {/* Step 2: Amazon Product Page layout – Hero left, Title + Bullets + Description right */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-sm">
                  <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                    {/* Left: Amazon Hero Image – uploaded image (Supabase) first, then AI-generated main */}
                    {(() => {
                      const uploadedHeroUrl = (displayResult as { heroImageUrl?: string }).heroImageUrl ?? (displayResult.report as { product_image_url?: string } | undefined)?.product_image_url;
                      const mainImage = displayResult.generatedImages?.find((img) => img.type === "white_background") ?? displayResult.generatedImages?.[0];
                      const heroUrl = uploadedHeroUrl ?? mainImage?.url;
                      if (!heroUrl) return <div className="rounded-xl border border-white/10 bg-white/5 p-4 min-h-[280px] flex items-center justify-center text-white/50 text-sm">No image</div>;
                      return (
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-400/90">Hero Image</h4>
                          <div className="overflow-hidden rounded-xl border border-white/10 bg-white">
                            <img src={heroUrl} alt="Product hero" className="w-full aspect-square object-contain" />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Right: Title, 5 Bullets, Description – formatted text by default; Edit toggles inputs */}
                    <div className="space-y-5">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400/90">Title</h4>
                          {listingEditMode && <span className="text-xs text-white/50">{String(getTitle()).length}/200</span>}
                        </div>
                        {listingEditMode ? (
                          <input
                            type="text"
                            value={String(getTitle())}
                            onChange={(e) => updateCopy({ title: e.target.value.slice(0, 200) })}
                            maxLength={200}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                            placeholder="Listing title"
                          />
                        ) : (
                          <p className="text-white/95 leading-relaxed">{String(getTitle() || "—")}</p>
                        )}
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-400/90">Bullet Points</h4>
                        {listingEditMode ? (
                          <ul className="space-y-3">
                            {[0, 1, 2, 3, 4].map((i) => {
                              const bullets = getBullets();
                              const bullet = bullets[i] ?? "";
                              return (
                                <li key={i} className="flex gap-2 items-start">
                                  <span className="text-amber-500 mt-2.5 shrink-0">•</span>
                                  <textarea
                                    value={bullet}
                                    onChange={(e) => {
                                      const next = [...bullets];
                                      while (next.length <= i) next.push("");
                                      next[i] = e.target.value;
                                      updateCopy({ bulletPoints: next });
                                    }}
                                    rows={2}
                                    className="flex-1 min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                                    placeholder={`Bullet ${i + 1}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => regenerateSingleBullet(i)}
                                    disabled={bulletRegenerating !== null}
                                    className="shrink-0 rounded-lg border border-white/20 bg-white/5 p-2 text-white/70 hover:bg-amber-500/20 hover:text-amber-400 disabled:opacity-50"
                                    title="Regenerate this bullet"
                                  >
                                    {bulletRegenerating === i ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <ul className="space-y-2">
                            {[0, 1, 2, 3, 4].map((i) => {
                              const bullets = getBullets();
                              const b = bullets[i]?.trim() ?? "";
                              return (
                                <li key={i} className="flex gap-2 text-sm text-white/90">
                                  <span className="text-amber-500 shrink-0">•</span>
                                  <span>{b || "—"}</span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-400/90">Product Description</h4>
                        {listingEditMode ? (
                          <textarea
                            value={String(getDescription())}
                            onChange={(e) => updateCopy({ productDescription: e.target.value })}
                            rows={6}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                            placeholder="Compelling product description..."
                          />
                        ) : (
                          <p className="text-white/90 leading-relaxed whitespace-pre-wrap text-sm">{String(getDescription() || "—")}</p>
                        )}
                      </div>

                      {(isBasicComplete || (displayResult as { heroImageUrl?: string }).heroImageUrl || (displayResult.report as { product_image_url?: string })?.product_image_url) && (
                        <button
                          type="button"
                          onClick={() => setVisualStudioOpen(true)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-semibold text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.35)] ring-2 ring-amber-400/40 transition hover:bg-amber-400 hover:shadow-[0_0_28px_rgba(245,158,11,0.45)]"
                        >
                          <Sparkles className="h-5 w-5" />
                          Next: Design Images
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Phase 2: Visual Studio – A+ Content Builder & Lifestyle Gallery Builder */}
            {hasValidCopy && visualStudioOpen && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Palette className="h-6 w-6 text-amber-500" />
                    Visual Studio
                  </h2>
                  <button
                    type="button"
                    onClick={() => setVisualStudioOpen(false)}
                    className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                  >
                    Back to Listing Foundation
                  </button>
                </div>

                <div className="flex gap-2 border-b border-white/10 pb-2">
                  <button
                    type="button"
                    onClick={() => setVisualTab("aplus")}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${visualTab === "aplus" ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}
                  >
                    <LayoutGrid className="inline h-4 w-4 mr-2 align-middle" />
                    A+ Content Builder
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisualTab("gallery")}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${visualTab === "gallery" ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}
                  >
                    <ImagePlus className="inline h-4 w-4 mr-2 align-middle" />
                    Lifestyle Gallery Builder
                  </button>
                </div>

                {/* Option A: A+ Content Builder */}
                {visualTab === "aplus" && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    {aPlusLoading ? (
                      <div className="min-h-[40vh] flex flex-col justify-center">
                        <h3 className="mb-4 text-center text-lg font-semibold text-white">Deep Thinking</h3>
                        {THINKING_STEPS_APLUS.map((step, i) => (
                          <div
                            key={i}
                            className={`flex items-center gap-4 rounded-xl border px-4 py-3 mb-3 ${i === aPlusThinkingStep ? "border-amber-500/50 bg-amber-500/10 text-amber-100" : "border-white/10 bg-white/5 text-white/70"}`}
                          >
                            <span className="text-2xl">{step.icon}</span>
                            <span className="text-sm font-medium">{step.label}</span>
                            {i === aPlusThinkingStep && <Loader2 className="ml-auto h-5 w-5 animate-spin text-amber-400" />}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <h3 className="mb-4 font-semibold text-white">A+ Content Builder</h3>
                        <p className="mb-4 text-sm text-white/60">Set style and brand, then generate 3–5 A+ module images. Flux is called only when you click Generate.</p>
                        <div className="grid gap-4 sm:grid-cols-3 mb-6">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-white/70">Style</label>
                            <select
                              value={styleOptions.style ?? "luxury"}
                              onChange={(e) => setStyleOptions((s) => ({ ...s, style: e.target.value as "luxury" | "modern" | "outdoor" }))}
                              className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-3 pr-4 text-white focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                            >
                              <option value="luxury">Luxury</option>
                              <option value="modern">Modern</option>
                              <option value="outdoor">Outdoor</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-white/70">Brand color</label>
                            <div className="flex gap-2 items-center">
                              <input
                                type="color"
                                value={styleOptions.primaryColor ?? "#1a1a2e"}
                                onChange={(e) => setStyleOptions((s) => ({ ...s, primaryColor: e.target.value }))}
                                className="h-10 w-14 cursor-pointer rounded border border-white/10 bg-white/5"
                              />
                              <input
                                type="text"
                                value={styleOptions.primaryColor ?? ""}
                                onChange={(e) => setStyleOptions((s) => ({ ...s, primaryColor: e.target.value }))}
                                placeholder="#hex"
                                className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-white text-sm placeholder-white/40"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-white/70">Layout preference</label>
                            <select
                              value={styleOptions.layoutPreference ?? "grid"}
                              onChange={(e) => setStyleOptions((s) => ({ ...s, layoutPreference: e.target.value as "grid" | "stacked" | "mixed" }))}
                              className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-3 pr-4 text-white focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                            >
                              <option value="grid">Grid</option>
                              <option value="stacked">Stacked</option>
                              <option value="mixed">Mixed</option>
                            </select>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={generateAPlus}
                          disabled={aPlusLoading || !(displayResult?.report ?? result?.report)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 font-medium text-slate-950 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <LayoutGrid className="h-4 w-4" />
                          Generate A+ Modules
                        </button>
                        {displayResult.generatedImages?.filter((img) => img.type === "a_plus").length ? (
                          <div className="mt-6">
                            <h4 className="mb-3 text-sm font-medium text-white/80">A+ module images</h4>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {displayResult.generatedImages.filter((img) => img.type === "a_plus").map((img, i) => (
                                <div key={i} className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                  <img src={img.url} alt={img.type} className="h-48 w-full object-contain bg-white" />
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                )}

                {/* Option B: Lifestyle Gallery Builder */}
                {visualTab === "gallery" && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    {galleryLoading ? (
                      <div className="min-h-[40vh] flex flex-col justify-center">
                        <h3 className="mb-4 text-center text-lg font-semibold text-white">Deep Thinking</h3>
                        {THINKING_STEPS_GALLERY.map((step, i) => (
                          <div
                            key={i}
                            className={`flex items-center gap-4 rounded-xl border px-4 py-3 mb-3 ${i === galleryThinkingStep ? "border-amber-500/50 bg-amber-500/10 text-amber-100" : "border-white/10 bg-white/5 text-white/70"}`}
                          >
                            <span className="text-2xl">{step.icon}</span>
                            <span className="text-sm font-medium">{step.label}</span>
                            {i === galleryThinkingStep && <Loader2 className="ml-auto h-5 w-5 animate-spin text-amber-400" />}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <h3 className="mb-4 font-semibold text-white">Lifestyle Gallery Builder</h3>
                        <p className="mb-4 text-sm text-white/60">Choose background and vibe; generate 5 distinct lifestyle images. Flux is called only when you click Generate.</p>
                        <div className="grid gap-4 sm:grid-cols-3 mb-6">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-white/70">Background</label>
                            <select
                              value={styleOptions.background ?? "home"}
                              onChange={(e) => setStyleOptions((s) => ({ ...s, background: e.target.value as "home" | "nature" | "studio" }))}
                              className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-3 pr-4 text-white focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                            >
                              <option value="home">Home</option>
                              <option value="nature">Nature</option>
                              <option value="studio">Studio</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-white/70">Target audience</label>
                            <input
                              type="text"
                              value={styleOptions.targetAudience ?? ""}
                              onChange={(e) => setStyleOptions((s) => ({ ...s, targetAudience: e.target.value }))}
                              placeholder="e.g. pet owners"
                              className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 px-3 text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-white/70">Vibe</label>
                            <input
                              type="text"
                              value={styleOptions.vibe ?? ""}
                              onChange={(e) => setStyleOptions((s) => ({ ...s, vibe: e.target.value }))}
                              placeholder="e.g. cozy, premium"
                              className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 px-3 text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={generateGallery}
                          disabled={galleryLoading || !(displayResult?.report ?? result?.report)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 font-medium text-slate-950 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ImagePlus className="h-4 w-4" />
                          Generate 5 Gallery Images
                        </button>
                        {displayResult.generatedImages?.filter((img) => img.type === "lifestyle").length ? (
                          <div className="mt-6">
                            <h4 className="mb-3 text-sm font-medium text-white/80">Gallery images</h4>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {displayResult.generatedImages.filter((img) => img.type === "lifestyle").map((img, i) => (
                                <div key={i} className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                  <img src={img.url} alt={img.type} className="h-48 w-full object-contain bg-white" />
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Legacy: show Save when in Visual Studio too */}
            {hasValidCopy && visualStudioOpen && displayResult.report && (user || result) && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={saveToMyAnalyses}
                  disabled={saveLoading || !user}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-400 hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saveSuccess ? "Saved" : user ? "Save to My Analyses" : "Sign in to save"}
                </button>
              </div>
            )}
          </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
