"use client"

import { useState, useEffect, useRef } from "react"
import {
  Sparkles, Loader2, AlertTriangle, X, ArrowLeft,
  Wand2, FileText, List, AlignLeft, Copy, Check,
  Shield, ChevronRight, BarChart3, Lightbulb, Tag,
  ClipboardList, Hash,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { cn } from "@/lib/utils"
import { useRequireAuth } from "@/hooks/use-require-auth"

/* ── Config ── */
// Use the built-in Next.js API route — no external backend required
const NGROK_URL = `/api/generate-listing`

/* ── Types ── */
interface BulletPoint {
  header: string
  content: string
}

interface CopyResult {
  title: string
  bulletPoints: BulletPoint[]
  description: string
  seoNote: string
  backendSearchTerms: string
}

function bulletToText(b: unknown): { header: string; content: string } {
  if (typeof b === "object" && b !== null && "header" in b && "content" in b) {
    return { header: String((b as BulletPoint).header), content: String((b as BulletPoint).content) }
  }
  const str = String(b ?? "")
  const match = str.match(/^([A-Z][A-Z\s&/]+)([:\-–]\s?)([\s\S]+)$/)
  if (match) return { header: match[1].trim(), content: match[3].trim() }
  return { header: "", content: str }
}

export default function ListingBuilderPage() {
  const { loading: authLoading } = useRequireAuth()

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking sign-in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      {/* Top bar */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-foreground">AI Listing Copywriter</h1>
            <span className="hidden text-xs text-muted-foreground sm:block">
              Powered by Amazon Expert AI
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Pro Copywriter</span>
          </div>
        </div>
      </div>
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-10">
        <ListingCopywriter />
      </main>
      <Footer />
    </div>
  )
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied!" : label}
    </button>
  )
}

const THINKING_PHASES = [
  { text: "Analyzing market trends & competitors...", icon: BarChart3 },
  { text: "Identifying high-value keywords...", icon: Sparkles },
  { text: "Crafting A9-optimized title...", icon: FileText },
  { text: "Writing benefit-driven bullet points...", icon: List },
  { text: "Composing persuasive description...", icon: AlignLeft },
]

function ThinkingView({ productName }: { productName: string }) {
  const [phase, setPhase] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setPhase((p) => (p < THINKING_PHASES.length - 1 ? p + 1 : p))
    }, 3000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => {
        if (p < 50) return p + Math.random() * 4
        if (p < 80) return p + Math.random() * 2
        return Math.min(p + 0.3, 95)
      })
    }, 300)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-10 py-16 animate-in fade-in duration-500">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: "2s" }} />
        <div className="absolute inset-2 rounded-full border-2 border-dashed border-primary/20 animate-spin" style={{ animationDuration: "8s" }} />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-card shadow-2xl shadow-primary/25">
          <Wand2 className="h-7 w-7 text-primary animate-pulse" />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold text-foreground">Pro Copywriter is thinking...</h2>
        <span className="mt-1.5 block text-sm text-muted-foreground">
          Crafting the perfect listing for{" "}
          <span className="font-semibold text-foreground">
            {productName.slice(0, 50)}{productName.length > 50 ? "..." : ""}
          </span>
        </span>
      </div>
      <div className="w-full flex flex-col gap-2.5">
        {THINKING_PHASES.map((p, i) => {
          const Icon = p.icon
          const isActive = i === phase
          const isDone = i < phase
          return (
            <div
              key={p.text}
              className={cn(
                "flex items-center gap-3.5 rounded-xl px-5 py-3 transition-all duration-500",
                isActive && "bg-primary/5 border border-primary/20 shadow-sm",
                isDone && "opacity-40",
                !isActive && !isDone && "opacity-15",
              )}
            >
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
                isActive && "bg-primary/10",
                isDone && "bg-emerald-500/10",
              )}>
                {isDone ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                ) : (
                  <Icon className="h-4 w-4 text-muted-foreground/30" />
                )}
              </div>
              <span className={cn(
                "text-sm font-medium transition-colors",
                isActive && "text-foreground",
                isDone && "text-muted-foreground",
                !isActive && !isDone && "text-muted-foreground/40",
              )}>
                {p.text}
              </span>
            </div>
          )
        })}
      </div>
      <div className="w-full">
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progress, 95)}%` }}
          />
        </div>
        <span className="mt-2 block text-center text-xs text-muted-foreground/50 font-mono">
          {Math.round(Math.min(progress, 95))}%
        </span>
      </div>
    </div>
  )
}

/* ── Empty-state preview cards ── */
function EmptyStateCards() {
  const cards = [
    {
      icon: FileText,
      label: "Optimized Title",
      lines: ["Keyword-rich, within Amazon's 200-char limit,", "front-loaded with your primary search terms."],
    },
    {
      icon: List,
      label: "5 Bullet Points",
      lines: ["BENEFIT-DRIVEN HEADER: Supporting detail that", "converts browsers into buyers at a glance."],
    },
    {
      icon: AlignLeft,
      label: "Product Description",
      lines: ["Persuasive long-form copy that reinforces your", "value proposition and improves A9 ranking."],
    },
  ]

  return (
    <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <p className="col-span-full text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground/40">
        You will receive
      </p>
      {cards.map(({ icon: Icon, label, lines }) => (
        <div
          key={label}
          className="relative overflow-hidden rounded-2xl border border-dashed border-border bg-card/50 p-5 select-none"
        >
          {/* blurred overlay */}
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />
          <div className="relative flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/8 border border-primary/10">
                <Icon className="h-4 w-4 text-primary/40" />
              </div>
              <span className="text-xs font-bold text-foreground/40 uppercase tracking-wider">{label}</span>
            </div>
            <div className="space-y-1.5">
              {lines.map((line, i) => (
                <p key={i} className="text-xs text-muted-foreground/30 leading-relaxed">{line}</p>
              ))}
            </div>
            {/* fake content bars */}
            <div className="mt-1 space-y-1.5">
              <div className="h-2 w-full rounded-full bg-muted/30" />
              <div className="h-2 w-4/5 rounded-full bg-muted/20" />
              <div className="h-2 w-3/5 rounded-full bg-muted/15" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ListingCopywriter() {
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [productName, setProductName] = useState("")
  const [features, setFeatures] = useState("")
  const [brandName, setBrandName] = useState("")
  const [keywords, setKeywords] = useState("")
  const [result, setResult] = useState<CopyResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const descriptionRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setIsClient(true) }, [])

  const canGenerate = productName.trim().length > 0 && keywords.trim().length > 0

  const handleGenerate = async () => {
    if (!productName.trim()) { setError("Please enter a product name."); return }
    if (!keywords.trim()) { setError("Please enter at least one target keyword."); return }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch(NGROK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productName: productName.trim(),
          productDescription: features.trim(),
          brandName: brandName.trim() || undefined,
          keywords: keywords.trim(),
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Server ${res.status}: ${errText.slice(0, 200)}`)
      }

      const data = await res.json()
      const bullets: BulletPoint[] = Array.isArray(data.bulletPoints)
        ? data.bulletPoints.map((b: unknown) => bulletToText(b))
        : []

      setResult({
        title: String(data.title ?? ""),
        bulletPoints: bullets,
        description: String(data.description ?? ""),
        seoNote: String(data.seoNote ?? ""),
        backendSearchTerms: String(data.backendSearchTerms ?? ""),
      })
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Generation failed — unable to reach engine. Make sure the backend is running."
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (!isClient) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (isLoading) return <ThinkingView productName={productName} />

  /* ── RESULT VIEW ── */
  if (result) {
    const descriptionHasHtml = /<[a-z][\s\S]*>/i.test(result?.description ?? "")

    const copyAllText = [
      result?.title ?? "",
      "",
      "KEY FEATURES:",
      ...(result?.bulletPoints ?? []).map((b, i) => `${i + 1}. ${b?.header ? `${b.header.toUpperCase()}: ${b.content}` : (b?.content ?? "")}`),
      "",
      "DESCRIPTION:",
      (result?.description ?? "").replace(/<[^>]*>/g, ""),
      ...(result?.backendSearchTerms ? ["", "BACKEND SEARCH TERMS:", result.backendSearchTerms] : []),
    ].join("\n")

    return (
      <div className="mx-auto max-w-4xl flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* ── Result Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/20 shadow-sm">
              <Check className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Your Listing Is Ready</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5">
                  <Shield className="h-3 w-3 text-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">A9 Optimized</span>
                </div>
                <div className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Conversion Ready</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => { setResult(null); setError(null) }} variant="outline" size="sm" className="rounded-xl text-xs font-semibold">
              <ArrowLeft className="mr-1.5 h-3 w-3" /> Edit Inputs
            </Button>
            <Button onClick={handleGenerate} size="sm" className="rounded-xl text-xs font-semibold">
              <Wand2 className="mr-1.5 h-3 w-3" /> Re-Generate
            </Button>
            {/* Master Copy All */}
            <CopyButton text={copyAllText} label="Copy All" />
          </div>
        </div>

        {/* ── Optimized Title ── */}
        {result?.title && (
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><FileText className="h-4 w-4 text-primary" /></div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Product Title</h3>
                  <span className="text-[11px] text-muted-foreground">SEO-optimized, keyword-rich title</span>
                </div>
              </div>
              <CopyButton text={result.title} label="Copy Title" />
            </div>
            {/* Amazon-listing-style preview box */}
            <div className="px-6 py-5">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
                <div className="mb-2 flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-sm bg-[#FF9900]" />
                  <span className="text-[10px] font-bold text-[#FF9900] uppercase tracking-wider">Amazon Listing Preview</span>
                </div>
                <h2 className="text-base font-bold text-foreground leading-snug">{result.title}</h2>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">{result?.title?.length ?? 0} characters</span>
                {(result?.title?.length ?? 0) <= 200 && (
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">Within Amazon limit</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Bullet Points ── */}
        {(result?.bulletPoints?.length ?? 0) > 0 && (
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><List className="h-4 w-4 text-primary" /></div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Key Features</h3>
                  <span className="text-[11px] text-muted-foreground">{result?.bulletPoints?.length ?? 0} benefit-driven bullet points</span>
                </div>
              </div>
              <CopyButton text={(result?.bulletPoints ?? []).map((b) => b?.header ? `${b.header.toUpperCase()}: ${b.content}` : (b?.content ?? "")).join("\n")} label="Copy Bullets" />
            </div>
            <div className="flex flex-col divide-y divide-border/50">
              {(result?.bulletPoints ?? []).map((bullet, i) => (
                <div key={i} className="flex items-start gap-4 px-6 py-4 hover:bg-secondary/30 transition-colors group">
                  {/* Number badge */}
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                    <span className="text-[11px] font-bold text-primary">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-relaxed">
                      {bullet?.header && (
                        <strong className="font-extrabold text-foreground uppercase tracking-wide">
                          {bullet.header}
                          {": "}
                        </strong>
                      )}
                      <span className="font-normal">{bullet?.content ?? ""}</span>
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <CopyButton text={bullet?.header ? `${bullet.header.toUpperCase()}: ${bullet.content}` : (bullet?.content ?? "")} label="Copy" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Market Strategy ── */}
        {result?.title && (result?.bulletPoints?.length ?? 0) > 0 && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 border-b border-primary/10 px-6 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><BarChart3 className="h-4 w-4 text-primary" /></div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Market Strategy</h3>
                <span className="text-[11px] text-muted-foreground">SEO keyword coverage across your listing</span>
              </div>
            </div>
            <div className="px-6 py-5">
              <div className="flex flex-wrap gap-2">
                {[
                  ...(result?.title ?? "").split(/[\s,\-|]+/).filter((w) => w.length > 3),
                  ...(result?.bulletPoints ?? []).filter((b) => b?.header).map((b) => b.header),
                ].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 15).map((keyword, i) => (
                  <span key={i} className="rounded-full border border-primary/20 bg-card px-3 py-1 text-xs font-medium text-foreground">{keyword}</span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500" /><span>Title optimized</span></div>
                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500" /><span>{result?.bulletPoints?.length ?? 0} bullets</span></div>
                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500" /><span>A9 indexed</span></div>
              </div>
            </div>
          </div>
        )}

        {/* ── Description ── */}
        {result?.description && (
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><AlignLeft className="h-4 w-4 text-primary" /></div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Description</h3>
                  <span className="text-[11px] text-muted-foreground">Conversion-focused, A+ ready content</span>
                </div>
              </div>
              <CopyButton text={(result?.description ?? "").replace(/<[^>]*>/g, "")} label="Copy Description" />
            </div>
            <div className="px-6 py-5">
              <div className="rounded-xl border border-border bg-secondary/20 px-5 py-4">
                {descriptionHasHtml ? (
                  <div ref={descriptionRef} className="prose prose-sm max-w-none text-foreground [&_p]:mb-3 [&_p]:leading-relaxed [&_p]:text-sm [&_strong]:font-bold [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-3 [&_li]:text-sm [&_li]:leading-relaxed [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2" dangerouslySetInnerHTML={{ __html: result?.description ?? "" }} />
                ) : (
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{result?.description ?? ""}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Expert Analysis ── */}
        {result?.seoNote && (
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border px-6 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><Shield className="h-4 w-4 text-primary" /></div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Expert Analysis</h3>
                <span className="text-[11px] text-muted-foreground">A9 algorithm optimization notes</span>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-foreground leading-relaxed">{result?.seoNote ?? ""}</p>
            </div>
          </div>
        )}

        {/* ── Backend Search Terms ── */}
        {result?.backendSearchTerms && (
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><Hash className="h-4 w-4 text-primary" /></div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Backend Search Terms</h3>
                  <span className="text-[11px] text-muted-foreground">Hidden from customers — paste into Seller Central</span>
                </div>
              </div>
              <CopyButton text={result?.backendSearchTerms ?? ""} label="Copy Search Terms" />
            </div>
            <div className="px-6 py-5">
              <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3">
                <p className="text-sm text-foreground font-mono leading-relaxed break-words">{result?.backendSearchTerms ?? ""}</p>
              </div>
              <span className="mt-2 block text-[10px] text-muted-foreground/60">Amazon allows up to 249 bytes for backend search terms.</span>
            </div>
          </div>
        )}

        {/* ── Copy All bottom CTA ── */}
        <div className="flex items-center justify-center gap-3 py-2">
          <CopyButton text={copyAllText} label="Copy Entire Listing" />
          <span className="text-xs text-muted-foreground/40">Copies title, bullets, description, and search terms</span>
        </div>
      </div>
    )
  }

  /* ── FORM VIEW ── */
  return (
    <div className="mx-auto max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Hero header ── */}
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">Enterprise-Grade Amazon Copywriting</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          AI Listing Copywriter
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          Write your product name, add your key features, and we&apos;ll generate a full Amazon listing optimized for A9 search.
        </p>
      </div>

      {/* ── Form card ── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-6 py-5 bg-card">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Wand2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Product Details</h2>
            <span className="text-xs text-muted-foreground">Fill in the fields below — the more detail, the better your listing</span>
          </div>
        </div>

        <div className="flex flex-col gap-6 p-6">

          {/* Product Name */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-semibold text-foreground">
                Product Name <span className="text-destructive">*</span>
              </label>
              <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                {productName.length} chars
              </span>
            </div>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Bamboo Cutting Board with Juice Groove"
              className="w-full rounded-xl border border-border bg-secondary/20 px-4 py-3.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/40 transition-all"
            />
          </div>

          {/* Features */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-semibold text-foreground">
                Product Features &amp; Description
              </label>
              <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                {features.length} chars
              </span>
            </div>
            <textarea
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder={"e.g. Extra-thick bamboo, juice groove prevents spills, built-in handles, knife-friendly surface, includes hanging loop"}
              rows={5}
              className="w-full resize-none rounded-xl border border-border bg-secondary/20 px-4 py-3.5 text-sm text-foreground leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/40 transition-all"
            />
          </div>

          {/* Brand Name */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-foreground">Brand Name</label>
                <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">Optional</span>
              </div>
              <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                {brandName.length} chars
              </span>
            </div>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. HomeKraft (optional)"
              className="w-full rounded-xl border border-border bg-secondary/20 px-4 py-3.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/40 transition-all"
            />
          </div>

          {/* Target Keywords */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-semibold text-foreground">
                Target Keywords <span className="text-destructive">*</span>
              </label>
              <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                {keywords.length} chars
              </span>
            </div>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. bamboo cutting board, wood cutting board kitchen, large cutting board with juice groove"
              className="w-full rounded-xl border border-border bg-secondary/20 px-4 py-3.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/40 transition-all"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground/60">Separate multiple keywords with commas</p>
          </div>

          {/* Pro tip callout */}
          <div className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-4">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
              <strong className="font-bold">Pro tip:</strong> The more specific your features, the better your listing. Include material, dimensions, use cases, and what makes your product different.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
            <span className="flex-1 text-sm font-medium text-destructive">{error}</span>
            <button onClick={() => setError(null)} className="shrink-0 text-destructive/60 hover:text-destructive transition-colors"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}

        {/* Generate CTA */}
        <div className="border-t border-border p-6">
          {!canGenerate && (
            <div className="mb-3 text-center text-xs text-muted-foreground">
              {!productName.trim() ? "Enter a product name to get started" : "Add target keywords to enable generation"}
            </div>
          )}
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || isLoading}
            className={cn(
              "relative w-full rounded-xl px-6 py-5 text-sm font-bold shadow-lg transition-all overflow-hidden",
              canGenerate
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-primary/30 hover:shadow-primary/40 hover:brightness-110"
                : "bg-muted text-muted-foreground cursor-not-allowed shadow-none",
            )}
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating your listing...</>
            ) : (
              <><Wand2 className="mr-2 h-4 w-4" />Generate Full Amazon Listing</>
            )}
          </Button>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/60">
            <Shield className="h-3 w-3" />
            <span>Powered by AI Amazon Expert</span>
            <ChevronRight className="h-2.5 w-2.5" />
            <span>A9 Algorithm Optimized</span>
          </div>
        </div>
      </div>

      {/* ── Empty state preview cards ── */}
      <EmptyStateCards />

      {/* Feature strip */}
      <div className="mt-8 grid grid-cols-3 gap-3">
        {[
          { icon: Tag, label: "Optimized Title", desc: "200-char Amazon limit" },
          { icon: ClipboardList, label: "5 Bullet Points", desc: "Benefit-driven copy" },
          { icon: Hash, label: "Backend Keywords", desc: "Hidden search terms" },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card/50 px-3 py-3 text-center">
            <Icon className="h-4 w-4 text-primary/60" />
            <span className="text-[11px] font-bold text-foreground">{label}</span>
            <span className="text-[10px] text-muted-foreground/60">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
