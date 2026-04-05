"use client"

import { useState, useRef } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useSession } from "@/hooks/use-session"
import {
  ImagePlay, Loader2, Sparkles, Upload, X, Download,
  Lightbulb, LayoutTemplate, Image as ImageIcon,
  ChevronRight, CheckCircle2, AlertCircle, RefreshCw,
  Wand2, Star, ZoomIn,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────
type ImageStrategyItem = {
  slot: number; type: string; title: string
  description: string; amazon_role: string; prompt: string
  overlay_text: string | null
}
type ImageStrategy = {
  images: ImageStrategyItem[]
  strategy_notes: string
  priority_order: number[]
}
type GeneratedImage = {
  slot: number; url: string; title: string; type: string; loading?: boolean; error?: string
}
type AplusModule = {
  brand_story: { headline: string; body: string }
  feature_modules: { icon_suggestion: string; headline: string; body: string }[]
  comparison_chart: { headline: string; rows: { feature: string; ours: string; theirs: string }[] }
  hero_banner: { headline: string; subheadline: string; cta: string }
  faq_module: { question: string; answer: string }[]
}

type TabId = "strategy" | "images" | "aplus"

const IMAGE_STYLES = [
  { id: "clean",     label: "Clean White",   desc: "Amazon main image standard" },
  { id: "lifestyle", label: "Lifestyle",     desc: "In-use, aspirational" },
  { id: "dark",      label: "Premium Dark",  desc: "Luxury, high-contrast" },
  { id: "gradient",  label: "Soft Gradient", desc: "Modern, minimal" },
]

const TYPE_COLORS: Record<string, string> = {
  hero:            "bg-blue-50 text-blue-700 border-blue-100",
  lifestyle:       "bg-emerald-50 text-emerald-700 border-emerald-100",
  feature:         "bg-violet-50 text-violet-700 border-violet-100",
  infographic:     "bg-orange-50 text-orange-700 border-orange-100",
  problem_solution:"bg-red-50 text-red-700 border-red-100",
  comparison:      "bg-yellow-50 text-yellow-700 border-yellow-100",
}

// ─── Shared helpers ───────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">{children}</p>
}

function AiLoading({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-14 flex flex-col items-center gap-3">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: "2s" }} />
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Wand2 className="h-5 w-5 text-primary animate-pulse" />
        </div>
      </div>
      <p className="text-sm font-medium text-foreground">{text}</p>
    </div>
  )
}

// ─── Tab 1: Strategy ──────────────────────────────────────────────────
function TabStrategy({
  token, onStrategyReady,
}: {
  token: string | null
  onStrategyReady: (s: ImageStrategy) => void
}) {
  const [productName, setProductName] = useState("")
  const [features, setFeatures] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [strategy, setStrategy] = useState<ImageStrategy | null>(null)

  const run = async () => {
    if (!token || !productName.trim()) return
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/studio/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productName, features, targetAudience, category }),
      })
      const data = await res.json()
      if (data.ok) { setStrategy(data); onStrategyReady(data) }
      else setError(data.error ?? "Failed to generate strategy.")
    } catch { setError("Network error.") }
    finally { setLoading(false) }
  }

  if (loading) return <AiLoading text="Analyzing product and building image strategy..." />

  if (strategy) return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground">Image Strategy Ready</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{strategy.strategy_notes}</p>
        </div>
        <button onClick={() => setStrategy(null)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="h-3 w-3" /> Regenerate
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {strategy.images.map((img) => (
          <div key={img.slot} className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg border ${TYPE_COLORS[img.type] ?? "bg-secondary text-muted-foreground border-border"}`}>
                {img.type.replace("_", " ")}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground/60">Slot {img.slot}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{img.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{img.description}</p>
            </div>
            <div className="rounded-xl bg-primary/[0.04] border border-primary/10 px-3 py-2">
              <p className="text-[11px] text-primary font-medium leading-relaxed">{img.amazon_role}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 px-5 py-4 flex items-start gap-3">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <p className="text-sm text-foreground">
          Strategy complete. Head to the <strong>Generate Images</strong> tab to create each image.
        </p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-6 py-5">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Image Strategy Generator</h3>
            <p className="text-xs text-muted-foreground">Tell us about your product — we&apos;ll plan the perfect set of listing images.</p>
          </div>
        </div>

        <div className="flex flex-col gap-5 p-6">
          <div>
            <label className="mb-2 block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Product Name <span className="text-destructive">*</span>
            </label>
            <input type="text" value={productName} onChange={e => setProductName(e.target.value)}
              placeholder='e.g. "Self-Cleaning Dog Brush with Ergonomic Handle"'
              className="w-full rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/40 transition-all" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
              <input type="text" value={category} onChange={e => setCategory(e.target.value)}
                placeholder='e.g. "Pet Supplies", "Kitchen", "Sports"'
                className="w-full rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/40 transition-all" />
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Target Audience</label>
              <input type="text" value={targetAudience} onChange={e => setTargetAudience(e.target.value)}
                placeholder='e.g. "Dog owners, 25–45, USA"'
                className="w-full rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/40 transition-all" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Key Features & Benefits</label>
            <textarea value={features} onChange={e => setFeatures(e.target.value)} rows={4}
              placeholder={"Describe what makes this product special.\n\ne.g. Self-cleaning button, removes 95% of loose fur, ergonomic non-slip grip, works on all coat types..."}
              className="w-full resize-none rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm text-foreground leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/40 transition-all" />
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-4 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="border-t border-border p-6">
          <Button onClick={run} disabled={!productName.trim() || loading}
            className="w-full rounded-xl py-3 text-sm font-bold gap-2">
            <Sparkles className="h-4 w-4" /> Generate Image Strategy
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Tab 2: Generate Images ───────────────────────────────────────────
function TabImages({
  token, strategy,
}: {
  token: string | null
  strategy: ImageStrategy | null
}) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState("clean")
  const [generated, setGenerated] = useState<GeneratedImage[]>([])
  const [lightbox, setLightbox] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedFile(file)
    const reader = new FileReader()
    reader.onload = ev => setUploadedPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const generateImage = async (img: ImageStrategyItem) => {
    if (!token) return

    setGenerated(prev => {
      const exists = prev.find(g => g.slot === img.slot)
      if (exists) return prev.map(g => g.slot === img.slot ? { ...g, loading: true, error: undefined } : g)
      return [...prev, { slot: img.slot, url: "", title: img.title, type: img.type, loading: true }]
    })

    try {
      const fd = new FormData()
      fd.append("prompt", img.prompt)
      fd.append("type", img.type)
      fd.append("style", selectedStyle)
      if (uploadedFile) fd.append("image", uploadedFile)

      const res = await fetch("/api/studio/generate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const data = await res.json()

      setGenerated(prev => prev.map(g =>
        g.slot === img.slot
          ? { ...g, loading: false, url: data.url ?? "", error: data.ok ? undefined : (data.error ?? "Failed") }
          : g
      ))
    } catch {
      setGenerated(prev => prev.map(g =>
        g.slot === img.slot ? { ...g, loading: false, error: "Network error." } : g
      ))
    }
  }

  const generateAll = async () => {
    if (!strategy) return
    for (const img of strategy.images) {
      await generateImage(img)
    }
  }

  const images = strategy?.images ?? []

  return (
    <div className="flex flex-col gap-6">

      {/* Upload + Style */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Upload */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <SectionLabel>Product Photo (Optional)</SectionLabel>
          <p className="text-xs text-muted-foreground mb-4">
            Upload a clean product photo for background replacement. Without it, we&apos;ll generate from scratch.
          </p>
          {uploadedPreview ? (
            <div className="relative">
              <img src={uploadedPreview} alt="Uploaded" className="w-full h-40 object-contain rounded-xl border border-border bg-white" />
              <button onClick={() => { setUploadedFile(null); setUploadedPreview(null) }}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background border border-border flex items-center justify-center hover:bg-destructive/10 transition-colors">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/30 transition-colors py-8 flex flex-col items-center gap-2">
              <Upload className="h-6 w-6 text-muted-foreground/40" />
              <span className="text-xs text-muted-foreground">Click to upload product image</span>
              <span className="text-[10px] text-muted-foreground/50">PNG, JPG — white background preferred</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Style */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <SectionLabel>Image Style</SectionLabel>
          <div className="flex flex-col gap-2">
            {IMAGE_STYLES.map(s => (
              <button key={s.id} onClick={() => setSelectedStyle(s.id)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                  selectedStyle === s.id
                    ? "border-primary/30 bg-primary/[0.04] shadow-sm"
                    : "border-border hover:border-border hover:bg-muted/30"
                }`}>
                <div>
                  <p className={`text-sm font-semibold ${selectedStyle === s.id ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{s.desc}</p>
                </div>
                {selectedStyle === s.id && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Image Grid */}
      {!strategy ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 py-16 flex flex-col items-center gap-3 text-center">
          <Lightbulb className="h-7 w-7 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-foreground">Run Image Strategy first</p>
          <p className="text-xs text-muted-foreground max-w-xs">Go to the Strategy tab, fill in your product details, and generate a strategy — then come back here to create images.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">{images.length} Images to Generate</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Generate individually or all at once</p>
            </div>
            <Button onClick={generateAll} size="sm" className="rounded-xl gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Generate All
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map(img => {
              const gen = generated.find(g => g.slot === img.slot)
              return (
                <div key={img.slot} className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
                  {/* Image area */}
                  <div className="relative bg-muted/30 aspect-square flex items-center justify-center">
                    {gen?.loading && (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <p className="text-xs text-muted-foreground">Generating...</p>
                      </div>
                    )}
                    {gen?.url && !gen.loading && (
                      <>
                        <img src={gen.url} alt={img.title} className="w-full h-full object-cover" />
                        <button onClick={() => setLightbox(gen.url)}
                          className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition-colors">
                          <ZoomIn className="h-3.5 w-3.5 text-foreground" />
                        </button>
                      </>
                    )}
                    {gen?.error && !gen.loading && (
                      <div className="flex flex-col items-center gap-1.5 px-4 text-center">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <p className="text-xs text-destructive">{gen.error}</p>
                      </div>
                    )}
                    {!gen && (
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/20" />
                      </div>
                    )}
                    <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${TYPE_COLORS[img.type] ?? "bg-secondary text-muted-foreground border-border"}`}>
                      {img.type.replace("_", " ")}
                    </span>
                  </div>

                  {/* Card footer */}
                  <div className="p-4 flex flex-col gap-3">
                    <div>
                      <p className="text-sm font-bold text-foreground">{img.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{img.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs h-8" onClick={() => generateImage(img)}>
                        {gen?.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : gen?.url ? <><RefreshCw className="h-3 w-3 mr-1" />Redo</> : <><Wand2 className="h-3 w-3 mr-1" />Generate</>}
                      </Button>
                      {gen?.url && (
                        <a href={gen.url} download={`slot-${img.slot}-${img.type}.jpg`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="rounded-xl h-8 w-8 p-0" title="Download">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
          <img src={lightbox} alt="Preview" className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}

// ─── Tab 3: A+ Content ────────────────────────────────────────────────
function TabAplus({ token }: { token: string | null }) {
  const [productName, setProductName] = useState("")
  const [brandName, setBrandName] = useState("")
  const [usp, setUsp] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  const [features, setFeatures] = useState("")
  const [tone, setTone] = useState("professional")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AplusModule | null>(null)

  const run = async () => {
    if (!token || !productName.trim()) return
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/studio/aplus", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productName, brandName, usp, targetAudience, features, tone }),
      })
      const data = await res.json()
      if (data.ok) setResult(data)
      else setError(data.error ?? "Failed to generate A+ content.")
    } catch { setError("Network error.") }
    finally { setLoading(false) }
  }

  if (loading) return <AiLoading text="Building your A+ content modules..." />

  if (result) return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">A+ Content Ready</h3>
        <button onClick={() => setResult(null)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="h-3 w-3" /> Regenerate
        </button>
      </div>

      {/* Hero Banner */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.05] to-transparent p-6">
        <SectionLabel>Hero Banner</SectionLabel>
        <h2 className="text-2xl font-bold text-foreground leading-tight">{result.hero_banner.headline}</h2>
        <p className="text-sm text-muted-foreground mt-2">{result.hero_banner.subheadline}</p>
        <span className="mt-3 inline-block rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">{result.hero_banner.cta}</span>
      </div>

      {/* Brand Story */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <SectionLabel>Brand Story Module</SectionLabel>
        <p className="text-sm font-bold text-foreground mb-2">{result.brand_story.headline}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{result.brand_story.body}</p>
      </div>

      {/* Feature Modules */}
      <div>
        <SectionLabel>Feature Modules</SectionLabel>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {result.feature_modules.map((f, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2">
              <span className="text-2xl">{f.icon_suggestion}</span>
              <p className="text-sm font-bold text-foreground">{f.headline}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <SectionLabel>Comparison Chart</SectionLabel>
          <p className="text-sm font-bold text-foreground">{result.comparison_chart.headline}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Feature</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-emerald-600">Ours</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50">Generic</th>
              </tr>
            </thead>
            <tbody>
              {result.comparison_chart.rows.map((row, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 text-sm font-semibold text-foreground">{row.feature}</td>
                  <td className="px-5 py-3 text-sm text-emerald-600 font-medium">{row.ours}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground/60">{row.theirs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <SectionLabel>FAQ Module</SectionLabel>
        <div className="flex flex-col gap-4">
          {result.faq_module.map((faq, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-5 w-5 shrink-0 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                <span className="text-[10px] font-bold text-primary">Q</span>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{faq.question}</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-6 py-5">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
            <LayoutTemplate className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">A+ Content Builder</h3>
            <p className="text-xs text-muted-foreground">Generate all A+ modules — hero, features, comparison, FAQ</p>
          </div>
        </div>

        <div className="flex flex-col gap-5 p-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Product Name <span className="text-destructive">*</span>
              </label>
              <input type="text" value={productName} onChange={e => setProductName(e.target.value)}
                placeholder='e.g. "Dog Grooming Brush"'
                className="w-full rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/40 transition-all" />
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Brand Name</label>
              <input type="text" value={brandName} onChange={e => setBrandName(e.target.value)}
                placeholder='e.g. "PetPro"'
                className="w-full rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/40 transition-all" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Unique Selling Proposition
            </label>
            <input type="text" value={usp} onChange={e => setUsp(e.target.value)}
              placeholder='e.g. "Self-cleaning button that removes fur in one click"'
              className="w-full rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/40 transition-all" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Target Audience</label>
              <input type="text" value={targetAudience} onChange={e => setTargetAudience(e.target.value)}
                placeholder='e.g. "Dog owners, 25–45"'
                className="w-full rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/40 transition-all" />
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tone</label>
              <select value={tone} onChange={e => setTone(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all">
                <option value="professional">Professional & Trustworthy</option>
                <option value="friendly">Friendly & Approachable</option>
                <option value="premium">Premium & Luxurious</option>
                <option value="fun">Fun & Energetic</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Key Features</label>
            <textarea value={features} onChange={e => setFeatures(e.target.value)} rows={3}
              placeholder="List your main product features and benefits..."
              className="w-full resize-none rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/40 transition-all" />
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-4 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="border-t border-border p-6">
          <Button onClick={run} disabled={!productName.trim() || loading}
            className="w-full rounded-xl py-3 text-sm font-bold gap-2">
            <LayoutTemplate className="h-4 w-4" /> Generate A+ Content
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────
export default function StudioPage() {
  const { loading: authLoading } = useRequireAuth()
  const { session } = useSession()
  const [activeTab, setActiveTab] = useState<TabId>("strategy")
  const [strategy, setStrategy] = useState<ImageStrategy | null>(null)

  const token = session?.access_token ?? null

  const TABS: { id: TabId; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: "strategy", label: "Image Strategy",   icon: <Lightbulb className="h-4 w-4" />,      desc: "AI plans your 6-image listing set" },
    { id: "images",   label: "Generate Images",  icon: <ImagePlay className="h-4 w-4" />,      desc: "Create each image with AI" },
    { id: "aplus",    label: "A+ Content",        icon: <LayoutTemplate className="h-4 w-4" />, desc: "All modules, copy & layout" },
  ]

  if (authLoading) return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-[1200px] px-6 py-8">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <ImagePlay className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Listing Studio</h1>
              <span className="rounded-xl border border-primary/20 bg-primary/[0.06] px-2.5 py-0.5 text-[11px] font-bold text-primary">
                AI-Powered
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-lg">
              From one product photo to a complete set of Amazon listing images, lifestyle shots, and A+ content — all in minutes.
            </p>
          </div>

          {/* Flow Steps */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
            {TABS.map((tab, i) => (
              <div key={tab.id} className="flex items-center gap-2 shrink-0">
                <button onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 transition-all ${
                    activeTab === tab.id
                      ? "border-primary/25 bg-primary/[0.04] shadow-sm"
                      : "border-border bg-card hover:border-border hover:bg-muted/30"
                  }`}>
                  <div className={`h-8 w-8 shrink-0 rounded-xl flex items-center justify-center ${activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {tab.icon}
                  </div>
                  <div className="text-left">
                    <p className={`text-xs font-bold ${activeTab === tab.id ? "text-foreground" : "text-muted-foreground"}`}>
                      <span className="text-muted-foreground/50 mr-1">{i + 1}.</span>{tab.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{tab.desc}</p>
                  </div>
                  {tab.id === "strategy" && strategy && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 ml-1" />
                  )}
                </button>
                {i < TABS.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />}
              </div>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === "strategy" && (
              <TabStrategy token={token} onStrategyReady={(s) => { setStrategy(s); setActiveTab("images") }} />
            )}
            {activeTab === "images" && (
              <TabImages token={token} strategy={strategy} />
            )}
            {activeTab === "aplus" && (
              <TabAplus token={token} />
            )}
          </div>

          {/* PRO Note */}
          <div className="mt-10 rounded-2xl border border-border bg-card px-6 py-5 flex items-start gap-4">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-yellow-50 border border-yellow-100 flex items-center justify-center">
              <Star className="h-4 w-4 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Image quality improves with your product photo</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Upload a clean photo of your product (white background preferred) in the Generate Images tab for best results.
                All generated images are 1024×1024px — ready for Amazon listing upload.
              </p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
