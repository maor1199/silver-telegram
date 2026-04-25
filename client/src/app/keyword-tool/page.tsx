"use client"

import { useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRequireAuth } from "@/hooks/use-require-auth"
import {
  Loader2,
  Search,
  Copy,
  Check,
  AlertTriangle,
  X,
  ArrowRight,
  Tag,
} from "lucide-react"

/* ── Types ── */

type KeywordType = "primary" | "secondary" | "longtail"
type Placement = "title" | "bullet" | "backend"
type FilterTab = "all" | KeywordType
type Status = "idle" | "loading" | "done" | "error"

interface KeywordItem {
  keyword: string
  type: KeywordType
  priority: number
  placement: Placement
}

/* ── Constants ── */

const CATEGORIES = [
  "Kitchen & Dining",
  "Sports & Outdoors",
  "Home & Garden",
  "Baby",
  "Pet Supplies",
  "Beauty",
  "Health",
  "Electronics",
  "Toys",
  "Other",
] as const

const TYPE_LABELS: Record<KeywordType, string> = {
  primary: "Primary",
  secondary: "Secondary",
  longtail: "Longtail",
}

const TYPE_COLORS: Record<KeywordType, string> = {
  primary: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/40",
  secondary: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/40",
  longtail: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/40",
}

const PLACEMENT_COLORS: Record<Placement, string> = {
  title: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  bullet: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  backend: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400",
}

const PRIORITY_BAR_COLORS: Record<KeywordType, string> = {
  primary: "bg-[#FF9900]",
  secondary: "bg-blue-500",
  longtail: "bg-purple-500",
}

/* ── Small copy button ── */

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
      aria-label="Copy keyword"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  )
}

/* ── Keyword row ── */

function KeywordRow({ item }: { item: KeywordItem }) {
  const barWidth = `${(item.priority / 10) * 100}%`

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:border-border/80 hover:shadow-sm transition-all duration-150">
      {/* Keyword text */}
      <span className="flex-1 min-w-0 text-sm font-semibold text-foreground truncate">{item.keyword}</span>

      {/* Type badge */}
      <span
        className={cn(
          "hidden sm:inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
          TYPE_COLORS[item.type]
        )}
      >
        {TYPE_LABELS[item.type]}
      </span>

      {/* Priority score bar */}
      <div className="hidden md:flex shrink-0 flex-col gap-0.5 w-24">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-wide">Priority</span>
          <span className="text-[10px] font-bold text-foreground tabular-nums">{item.priority}/10</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn("h-full rounded-full transition-all", PRIORITY_BAR_COLORS[item.type])}
            style={{ width: barWidth }}
          />
        </div>
      </div>

      {/* Placement chip */}
      <span
        className={cn(
          "hidden lg:inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10px] font-bold capitalize",
          PLACEMENT_COLORS[item.placement]
        )}
      >
        {item.placement}
      </span>

      {/* Copy button */}
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyBtn text={item.keyword} />
      </div>
    </div>
  )
}

/* ── Summary bar ── */

function SummaryBar({ keywords }: { keywords: KeywordItem[] }) {
  const counts: Record<KeywordType, number> = { primary: 0, secondary: 0, longtail: 0 }
  for (const kw of keywords) counts[kw.type]++

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground tabular-nums">{keywords.length}</span>
        <span className="text-sm text-muted-foreground">total keywords</span>
      </div>
      {(["primary", "secondary", "longtail"] as KeywordType[]).map((type) => (
        <div
          key={type}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
            TYPE_COLORS[type]
          )}
        >
          <span className="tabular-nums">{counts[type]}</span>
          <span>{TYPE_LABELS[type]}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Page ── */

export default function KeywordToolPage() {
  const { loading: authLoading } = useRequireAuth()

  const [productIdea, setProductIdea] = useState("")
  const [category, setCategory] = useState("Kitchen & Dining")
  const [status, setStatus] = useState<Status>("idle")
  const [keywords, setKeywords] = useState<KeywordItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<FilterTab>("all")
  const [allCopied, setAllCopied] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productIdea.trim()) return

    setStatus("loading")
    setError(null)
    setKeywords([])
    setActiveTab("all")

    try {
      const res = await fetch("/api/keyword-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIdea: productIdea.trim(), category }),
      })

      const data = await res.json() as { keywords?: KeywordItem[]; error?: string }

      if (!res.ok || data.error) {
        throw new Error(data.error ?? `Server ${res.status}`)
      }

      setKeywords(Array.isArray(data.keywords) ? data.keywords : [])
      setStatus("done")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setStatus("error")
    }
  }

  const filteredKeywords =
    activeTab === "all" ? keywords : keywords.filter((kw) => kw.type === activeTab)

  const handleCopyAll = async () => {
    const text = keywords.map((kw) => kw.keyword).join(", ")
    await navigator.clipboard.writeText(text)
    setAllCopied(true)
    setTimeout(() => setAllCopied(false), 2000)
  }

  const tabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "primary", label: "Primary" },
    { id: "secondary", label: "Secondary" },
    { id: "longtail", label: "Longtail" },
  ]

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#fef3c7]/60 via-background to-[#dbeafe]/30" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      <Navbar />

      <main className="relative flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-[900px] px-6 pb-10 pt-16 md:pt-20">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Search className="h-3.5 w-3.5" />
              AI-Powered • Amazon Keywords
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl text-balance leading-[1.1]">
              Find the right keywords before you list
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground leading-relaxed">
              Enter your product idea and get 24 AI-generated Amazon search keywords, ranked by priority with suggested placements for title, bullets, and backend fields.
            </p>
          </div>
        </section>

        {/* Form + Results */}
        <section className="mx-auto max-w-[900px] px-6 pb-24">

          {/* Form card */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
          >
            <div className="flex items-center gap-3 border-b border-border px-6 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Product Details</h2>
                <span className="text-xs text-muted-foreground">Describe what you&apos;re selling to get the most relevant keywords</span>
              </div>
            </div>

            <div className="flex flex-col gap-5 p-6">
              {/* Product idea input */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Product idea / niche <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={productIdea}
                  onChange={(e) => setProductIdea(e.target.value)}
                  placeholder="e.g. silicone ice cube tray"
                  required
                  className="w-full rounded-xl border border-border bg-secondary/20 px-4 py-3.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/40 transition-all"
                />
              </div>

              {/* Category select */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Product category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-border bg-secondary/20 px-4 py-3.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error */}
            {(status === "error" && error) && (
              <div className="mx-6 mb-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
                <span className="flex-1 text-sm font-medium text-destructive">{error}</span>
                <button
                  type="button"
                  onClick={() => { setError(null); setStatus("idle") }}
                  className="shrink-0 text-destructive/60 hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Submit */}
            <div className="border-t border-border px-6 py-5">
              <Button
                type="submit"
                disabled={!productIdea.trim() || status === "loading"}
                className={cn(
                  "relative w-full rounded-xl px-6 py-5 text-sm font-bold shadow-lg transition-all overflow-hidden",
                  productIdea.trim()
                    ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-primary/30 hover:shadow-primary/40 hover:brightness-110"
                    : "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
                )}
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating keywords...
                  </>
                ) : (
                  <>Generate Keywords &rarr;</>
                )}
              </Button>
            </div>
          </form>

          {/* Results */}
          {status === "done" && keywords.length > 0 && (
            <div className="mt-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Summary bar */}
              <SummaryBar keywords={keywords} />

              {/* Filter tabs */}
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm font-semibold transition-all",
                      activeTab === tab.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    )}
                  >
                    {tab.label}
                    {tab.id !== "all" && (
                      <span className="ml-1.5 tabular-nums text-xs opacity-70">
                        ({keywords.filter((kw) => kw.type === tab.id).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Keyword list */}
              <div className="flex flex-col gap-2">
                {filteredKeywords.map((kw, i) => (
                  <KeywordRow key={`${kw.keyword}-${i}`} item={kw} />
                ))}
              </div>

              {/* Bottom CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  type="button"
                  onClick={handleCopyAll}
                  variant="outline"
                  className="h-10 rounded-xl border-border px-5 text-sm font-semibold hover:border-primary/40 hover:bg-primary/5"
                >
                  {allCopied ? (
                    <><Check className="mr-2 h-4 w-4 text-emerald-500" />Copied!</>
                  ) : (
                    <><Copy className="mr-2 h-4 w-4" />Copy All Keywords</>
                  )}
                </Button>

                <Button
                  className="h-10 rounded-xl bg-[#FF9900] px-5 text-sm font-semibold text-white hover:bg-[#FF9900]/90 shadow-sm"
                  asChild
                >
                  <Link href="/listing-builder">
                    Use in Listing Builder
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>

      <div className="relative z-10 bg-background">
        <Footer />
      </div>
    </div>
  )
}
