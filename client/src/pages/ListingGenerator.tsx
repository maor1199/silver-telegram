import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Loader2,
  Sparkles,
  Type,
  List,
  Image as ImageIcon,
  LayoutGrid,
} from "lucide-react";

const API = (import.meta.env.VITE_API_URL ?? "").trim() || "";

export type ListingResult = {
  ok: boolean;
  copy: {
    title: string;
    bulletPoints: string[];
    aPlusContentIdeas: string[];
  };
  imagePrompts: { type: string; prompt: string }[];
};

type ListingGeneratorProps = {
  savedReport?: ListingResult | null;
  onClearSaved?: () => void;
  onSaved?: () => void;
};

export function ListingGenerator({ savedReport, onClearSaved, onSaved }: ListingGeneratorProps) {
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ListingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayResult = savedReport ?? result;

  const generate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    if (onClearSaved) onClearSaved();
    try {
      const session = await (await import("../lib/supabase")).supabase?.auth.getSession();
      const token = session?.data?.session?.access_token;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const { data } = await axios.post<ListingResult>(
        `${API}/api/listing-generate`,
        {
          productName: productName.trim() || "Product",
          description: description.trim(),
          keywords: keywords.trim(),
        },
        { headers }
      );
      setResult(data);
      if (data?.ok) onSaved?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Listing generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <Sparkles className="h-5 w-5 text-amber-500" />
          AI Listing & Visual Generator
        </h2>
        <p className="mb-6 text-sm text-white/60">
          Enter your product details to generate Amazon-ready copy and image prompts.
        </p>

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
            <label className="mb-1 block text-sm font-medium text-white/70">Brief description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the product, materials, key benefits..."
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Keywords (comma-separated)</label>
            <div className="relative">
              <List className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. cat bed, pet cave, washable"
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              />
            </div>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
            {loading ? "Generating..." : "Generate Listing & Image Prompts"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Loading state for results area */}
      {loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-12">
          <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
          <p className="mt-3 text-sm text-white/60">Creating your Amazon listing and image prompts...</p>
        </div>
      )}

      <AnimatePresence>
        {!loading && displayResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
                <Type className="h-5 w-5 text-amber-500" />
                Title
              </h3>
              <p className="text-white/90 leading-relaxed">{displayResult.copy.title || "—"}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
                <List className="h-5 w-5 text-amber-500" />
                5 Bullet Points
              </h3>
              <ul className="space-y-2">
                {(displayResult.copy.bulletPoints || []).map((bullet, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/90">
                    <span className="text-amber-500">•</span>
                    <span>{bullet || "—"}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
                <LayoutGrid className="h-5 w-5 text-amber-500" />
                A+ Content ideas
              </h3>
              <ul className="space-y-1.5 text-sm text-white/80">
                {(displayResult.copy.aPlusContentIdeas || []).map((idea, i) => (
                  <li key={i}>• {idea}</li>
                ))}
              </ul>
            </div>

            {(displayResult.imagePrompts?.length ?? 0) > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
                  <ImageIcon className="h-5 w-5 text-amber-500" />
                  AI Image prompts (for DALL·E / Midjourney)
                </h3>
                <p className="mb-3 text-xs text-white/50">
                  These are logged on the server; plug in your image API to generate assets.
                </p>
                <ul className="space-y-3">
                  {displayResult.imagePrompts.map((p, i) => (
                    <li key={i} className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <span className="text-xs font-medium uppercase text-amber-400/90">{p.type.replace(/_/g, " ")}</span>
                      <p className="mt-1 text-sm text-white/80">{p.prompt}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
