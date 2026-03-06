/**
 * Amazon Listing Copywriter — Title, 5 Bullets, Description only.
 * No market analysis, competitor charts, or strategic roadmap.
 */
import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Loader2, Sparkles, FileText } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

// In dev use relative /api so Vite proxy forwards to backend (avoids Failed to fetch)
const rawApi = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/$/, "");
const API_BASE = import.meta.env.DEV ? "" : (rawApi || "");
const GENERATE_URL = API_BASE ? `${API_BASE}/api/generate-listing` : "/api/generate-listing";

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

type CopyResult = {
  title: string;
  bulletPoints: string[];
  description: string;
};

export default function ListingBuilderPage() {
  const { isAuthConfigured, requireAuth } = useAuth();
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [brandName, setBrandName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copy, setCopy] = useState<CopyResult | null>(null);

  const doGenerate = async () => {
    if (!productName.trim()) {
      setError("Enter a product name.");
      return;
    }
    setLoading(true);
    setError(null);
    setCopy(null);
    try {
      const keywordsList = keywords
        .split(/[,\n]+/)
        .map((k) => k.trim())
        .filter(Boolean);
      const { data } = await axios.post<CopyResult & { bulletPoints?: { header?: string; content?: string }[] | string[] }>(GENERATE_URL, {
        productName: productName.trim(),
        productDescription: productDescription.trim() || productName.trim(),
        keywords: keywordsList,
        ...(brandName.trim() && { brandName: brandName.trim() }),
      });
      const rawBullets = data.bulletPoints;
      let bullets: string[] = [];
      if (Array.isArray(rawBullets)) {
        if (rawBullets.length > 0 && typeof rawBullets[0] === "object" && rawBullets[0] != null && "header" in (rawBullets[0] as object)) {
          bullets = (rawBullets as { header?: string; content?: string }[]).map((b) => {
            const h = String((b as { header?: string }).header ?? "").trim().toUpperCase();
            const c = String((b as { content?: string }).content ?? "").trim();
            return h ? `${h}: ${c}` : c;
          });
        } else {
          bullets = (rawBullets as string[]).slice(0, 5);
        }
      }
      while (bullets.length < 5) bullets.push("");
      setCopy({
        title: sanitizeTitle(typeof data.title === "string" ? data.title : ""),
        bulletPoints: bullets.slice(0, 5),
        description: typeof data.description === "string" ? data.description : "",
      });
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err && (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(typeof msg === "string" ? msg : (err instanceof Error ? err.message : "Listing generation failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    if (!isAuthConfigured) {
      doGenerate();
      return;
    }
    requireAuth(doGenerate, {
      title: "Sign in to generate content",
      message: "Sign in with Google to see the results.",
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="h-7 w-7 text-amber-500" />
          Amazon Listing Copywriter
        </h1>
        <Link to="/" className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10">
          ← Back
        </Link>
      </div>

      <p className="text-white/70 text-sm">
        High-converting copy only: Product Title, 5 Bullet Points, and Description. No strategy or market data here.
      </p>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-white/80">Product name *</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. Wireless Bluetooth Earbuds"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-white/80">Product description (optional)</label>
          <textarea
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            placeholder="Brief description or key benefits..."
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-white/80">Keywords (optional, comma-separated)</label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g. wireless earbuds, noise canceling, bluetooth 5.0"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-white/80">Brand name (optional)</label>
          <input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Leave empty to use [YOUR_BRAND]"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !productName.trim()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          {loading ? "Generating…" : "Generate listing copy"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
      )}

      {copy && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-500" />
            Ready-to-post listing
          </h2>
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-400/90">Title</h4>
              <p className="text-white/95 leading-relaxed">{copy.title || "—"}</p>
              <span className="text-xs text-white/50">{copy.title.length}/200</span>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-400/90">Bullet points</h4>
              <ul className="space-y-2">
                {copy.bulletPoints.slice(0, 5).map((b, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/90">
                    <span className="text-amber-500 shrink-0">•</span>
                    <span>{b?.trim() || "—"}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-400/90">Description</h4>
              <div className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: copy.description || "—" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
