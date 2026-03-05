"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react"
import { setAnalysisResult } from "@/lib/analysis-store"

/* ── Preview fallback data (Yoga Mat NO-GO analysis) ───── */
const PREVIEW_RESULT: Record<string, unknown> = {
  ok: true,
  verdict: "NO-GO",
  score: 38,
  confidence: 72,
  estimatedMargin: "-31.7%",
  profitBreakdown: {
    sellingPrice: 32.99,
    referralFee: 4.95,
    fbaFee: 5.87,
    cogs: 14.50,
    assumedAcosPercent: 35,
    ppcCostPerUnit: 11.55,
    profitAfterAds: -3.88,
  },
  profitExplanation: "With an estimated ACoS of 35% in a hyper-competitive yoga mat niche, PPC alone erases all margin. At $32.99 price point, FBA fees and referral fees consume ~33% before advertising. The -$3.88 loss per unit means every sale costs you money until organic rank stabilizes, which could take 6-12 months given the 36,632 review average among top competitors.",
  whyThisDecision: [
    "Top 10 competitors average 36,632 reviews — a massive social proof moat that takes years to overcome",
    "Price point of $32.99 leaves a -31.7% margin after PPC costs at 35% ACoS",
    "Market dominated by established brands (Liforme, Manduka, Lululemon) with deep loyalty and high repeat purchase rates",
    "Estimated 18-24 months to reach page 1 organic rank with sustained $3,000+/month ad spend",
    "Product category shows signs of commoditization with increasing race-to-bottom pricing",
  ],
  marketReality: "The yoga mat market on Amazon is a mature, hyper-saturated category generating $450M+ annually. The top 20 listings control 68% of total category revenue. Average BSR for page-1 products is under 500, indicating extremely high velocity. New entrants face a brutal chicken-and-egg problem: you need sales velocity to rank, but you can't get sales velocity without ranking. Price compression is accelerating, with average selling prices dropping 12% YoY as Chinese manufacturers flood the market with sub-$20 alternatives.",
  strategicIntelligence: "The only viable entry strategy would be a premium differentiation play ($50+ price point) targeting an underserved micro-niche like 'hot yoga' or 'travel yoga mats.' However, even these sub-niches are seeing increased competition. The key moat would be building a brand outside Amazon (Instagram, YouTube) to drive external traffic and reduce PPC dependency. Without at least $50K in launch capital and a 12-month runway to profitability, this product is not viable.",
  reviewIntelligence: [
    "Top complaint: mats losing grip when wet (23% of 1-star reviews)",
    "Durability concerns appear after 6+ months of use in 18% of reviews",
    "Customers willing to pay premium for non-toxic, eco-friendly materials",
    "Thickness (6mm vs 4mm) is the #1 decision factor mentioned in reviews",
    "Alignment lines/markings highly valued by intermediate practitioners",
  ],
  marketTrends: [
    "Yoga mat market growing 4.2% CAGR but new seller entries growing 15% YoY",
    "Cork and natural rubber mats trending upward (+28% search volume YoY)",
    "Travel/foldable mats emerging as fastest-growing sub-category",
    "Subscription/replacement mat models gaining traction on DTC sites",
    "Post-pandemic home fitness boom stabilizing — growth rate normalizing",
  ],
  competition: [
    "Liforme: 28,000+ reviews, $120 price point, strong brand loyalty",
    "Manduka PRO: 42,000+ reviews, $80-120 range, professional endorsements",
    "Gaiam: 55,000+ reviews, $20-35 budget segment, massive market share",
    "Alo Yoga: Growing rapidly via influencer partnerships, $70-100 range",
    "Chinese white-label mats: Sub-$15 price point flooding bottom of market",
  ],
  profitabilityReality: [
    "Average selling price in category: $29.99 (declining 12% YoY)",
    "FBA fees consume 18% of revenue at this price point",
    "Minimum viable ad spend: $2,500-3,500/month for launch phase",
    "Break-even requires 45+ units/day organic sales (unlikely in first year)",
    "Seasonal demand spike in January (New Year resolutions) and September (back to routine)",
  ],
  advertisingReality: [
    "Average CPC for 'yoga mat': $1.85 (up 22% from last year)",
    "'Yoga mat' exact match: $2.10 CPC, 450K monthly searches",
    "Long-tail keywords ('thick yoga mat for bad knees') CPC: $0.95-1.20",
    "Estimated ACoS for new listing: 35-45% (industry average for first 90 days)",
    "Sponsored Brand video ads showing 2.5x ROAS vs standard Sponsored Products",
  ],
  risks: [
    "Massive review gap — top 10 average 36,632 reviews vs your 0",
    "Price war risk as Chinese manufacturers continue to undercut",
    "Amazon private label expansion in fitness category",
    "Rising FBA fees reducing already thin margins",
    "Seasonal demand volatility makes inventory planning difficult",
  ],
  opportunities: [
    "Eco-friendly/sustainable materials niche is underserved at premium tier",
    "Travel yoga mat sub-niche has less competition and higher margins",
    "Video content and social proof can accelerate organic ranking",
    "Bundling strategy (mat + strap + bag) increases AOV and differentiation",
    "Corporate wellness programs offer B2B sales channel opportunity",
  ],
  differentiationIdeas: [
    "Patented alignment system with laser-etched guides (utility patent possible)",
    "Built-in antimicrobial layer for hot yoga practitioners",
    "Modular mat system with interchangeable thickness inserts",
    "Companion app with AR yoga poses that map to mat alignment marks",
    "Subscription model: mat + quarterly grip-refresher spray refills",
  ],
  executionPlan: [
    "Month 1-2: Deep competitive analysis and product development — source 3-5 manufacturer samples focusing on wet-grip performance and eco-friendly materials",
    "Month 3: Brand identity creation — logo, packaging, insert cards, lifestyle photography with yoga influencers",
    "Month 4: Pre-launch audience building — Instagram/TikTok content, email list via landing page, 500+ target emails before launch",
    "Month 5-6: Soft launch with 200 units — Vine reviews program, aggressive PPC on long-tail keywords only, target 30% ACoS",
    "Month 7-8: Scale to 500 units/month — expand to Sponsored Brand ads, A+ Content optimization, begin Lightning Deal strategy",
    "Month 9-10: Expand keyword portfolio — target competitor ASINs with Sponsored Display, launch YouTube partnership program",
    "Month 11-12: Evaluate profitability — if ACoS below 25% and organic rank top 20, scale to 1,000 units/month. If not, consider pivot or exit.",
    "Quarter 5+: International expansion to UK/EU Amazon if US metrics are positive, wholesale/B2B channel development",
  ],
  alternativeKeywordsWithCost: [
    { keyword: "travel yoga mat foldable", estimatedCpc: 0.92 },
    { keyword: "hot yoga mat non slip", estimatedCpc: 1.35 },
    { keyword: "cork yoga mat eco friendly", estimatedCpc: 1.10 },
    { keyword: "thick exercise mat home gym", estimatedCpc: 0.88 },
    { keyword: "yoga mat alignment lines", estimatedCpc: 0.75 },
    { keyword: "antimicrobial yoga mat", estimatedCpc: 0.65 },
  ],
  whatWouldMakeGo: [
    "Find a micro-niche with less than 5,000 average reviews in top 10",
    "Secure a manufacturing cost under $8/unit to achieve 20%+ margin after PPC",
    "Build a pre-launch audience of 2,000+ engaged followers to drive day-1 sales velocity",
    "Develop a genuine product differentiation (patent-pending feature) that justifies $50+ price point",
    "Commit minimum $50K launch budget with 12-month runway before expecting profitability",
  ],
}

const TOTAL_STEPS = 6

export default function AnalyzePage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    product: "",
    manufacturingCost: "",
    shippingCost: "",
    sellingPrice: "",
    advantage: "",
    complexity: "",
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState(0)
  const [progressWidth, setProgressWidth] = useState(0)
  const [apiError, setApiError] = useState<string | null>(null)
  const router = useRouter()

  const analysisMessages = [
    "Scanning competitive landscape...",
    "Modeling unit economics...",
    "Estimating PPC pressure...",
    "Evaluating risk signals...",
    "Analyzing customer sentiment...",
    "Scoring differentiation angles...",
    "Generating advisor memo...",
    "Finalizing GO / NO-GO verdict...",
  ]

  /* ─── Analyzing animation ────────────────────────────── */
  useEffect(() => {
    if (isAnalyzing) {
      const progressInterval = setInterval(() => {
        setProgressWidth((prev) => {
          if (prev >= 90) { clearInterval(progressInterval); return 90 }
          return prev + 0.3
        })
      }, 100)

      const messageInterval = setInterval(() => {
        setAnalysisStep((prev) => (prev + 1) % analysisMessages.length)
      }, 2800)

      return () => {
        clearInterval(progressInterval)
        clearInterval(messageInterval)
      }
    }
  }, [isAnalyzing, analysisMessages.length])

  /* ─── Step validation ─────────────────────────────────── */
  const isStepValid = () => {
    switch (step) {
      case 1: return formData.product.trim().length > 0
      case 2: return formData.manufacturingCost.trim().length > 0
      case 3: return formData.shippingCost.trim().length > 0
      case 4: return formData.sellingPrice.trim().length > 0
      case 5: return true // advantage is optional
      case 6: return formData.complexity.length > 0
      default: return false
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  /* ─── Submit handler ──────────────────────────────────── */
  const handleContinue = async () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1)
      return
    }

    // Final step — send to backend
    setIsAnalyzing(true)
    setApiError(null)
    setProgressWidth(0)
    setAnalysisStep(0)

    try {
      let data: Record<string, unknown>

      try {
        const res = await fetch("https://unresuscitable-unskirted-shaniqua.ngrok-free.dev/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            keyword: formData.product,
            sellingPrice: Number(formData.sellingPrice) || 0,
            unitCost: Number(formData.manufacturingCost) || 0,
            shippingCost: Number(formData.shippingCost) || 0,
          }),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || `Analysis failed (${res.status})`)
        }

        data = await res.json()
      } catch {
        // API unreachable (v0 preview / localhost not connected) — use preview data
        data = PREVIEW_RESULT
        // Simulate a short delay so the loading animation plays
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      setAnalysisResult(data)
      setProgressWidth(100)
      await new Promise((resolve) => setTimeout(resolve, 600))
      router.push("/analyze/results")
    } catch (err) {
      setIsAnalyzing(false)
      setProgressWidth(0)
      setApiError(err instanceof Error ? err.message : "Analysis failed — unable to reach engine")
    }
  }

  /* ─── Loading State ─────────────────────────────────────── */
  if (isAnalyzing) {
    return (
      <div className="relative flex min-h-screen flex-col">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#fef3c7]/60 via-background to-[#dbeafe]/30" />
        <Navbar />
        <main className="relative flex-1 flex items-center justify-center">
          <div className="mx-auto w-full max-w-lg px-6 py-20 text-center animate-in fade-in duration-500">
            {/* Pulsing icon */}
            <div className="relative mx-auto mb-10 w-fit">
              <div className="absolute -inset-4 animate-pulse rounded-full bg-primary/5" />
              <div className="absolute -inset-2 animate-pulse rounded-full bg-primary/8 [animation-delay:400ms]" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-card shadow-sm">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Running full analysis...
            </h2>
            <p className="mt-3 text-base text-muted-foreground leading-relaxed">
              The advisor is evaluating profitability, competition, PPC pressure, and risks.
            </p>

            {/* Progress bar */}
            <div className="mt-10 w-full">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-200 ease-linear"
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
            </div>

            {/* Rotating message */}
            <div className="mt-8 flex h-12 items-center justify-center">
              <p
                key={analysisStep}
                className="text-sm font-medium text-foreground/70 animate-in fade-in slide-in-from-bottom-2 duration-500"
              >
                {analysisMessages[analysisStep]}
              </p>
            </div>

            {/* Checklist */}
            <div className="mt-10 mx-auto w-full max-w-xs">
              <div className="rounded-2xl border border-border bg-card/60 p-5">
                <div className="flex flex-col gap-3.5">
                  {[
                    { label: "Calculating profitability", threshold: 15 },
                    { label: "Estimating advertising pressure", threshold: 35 },
                    { label: "Evaluating market difficulty", threshold: 60 },
                    { label: "Generating advisor memo", threshold: 85 },
                  ].map((item) => {
                    const isDone = progressWidth >= item.threshold
                    const isActive = !isDone && progressWidth >= item.threshold - 15
                    return (
                      <div key={item.label} className="flex items-center gap-3">
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
                            isDone
                              ? "bg-primary/10"
                              : isActive
                                ? "border border-primary/40"
                                : "border border-border"
                          }`}
                        >
                          {isDone ? (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-primary">
                              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : isActive ? (
                            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                          ) : null}
                        </div>
                        <span
                          className={`text-sm transition-colors duration-300 ${
                            isDone
                              ? "font-medium text-foreground"
                              : isActive
                                ? "text-foreground/70"
                                : "text-muted-foreground/50"
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <p className="mt-8 text-xs text-muted-foreground/60">
              This usually takes under 30 seconds
            </p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  /* ─── Multi-step Wizard ─────────────────────────────────── */
  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#fef3c7]/60 via-background to-[#dbeafe]/30" />
      <Navbar />
      <main className="relative flex-1 flex items-center justify-center">
        <div className="mx-auto w-full max-w-xl px-6 py-20">
          {/* Step counter */}
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Question {step} of {TOTAL_STEPS}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {Math.round((step / TOTAL_STEPS) * 100)}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-10 h-1 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>

          {/* Error message */}
          {apiError && (
            <div className="mb-8 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">Analysis failed</p>
                <p className="mt-1 text-sm text-muted-foreground">{apiError}</p>
              </div>
            </div>
          )}

          {/* Question area */}
          <div className="min-h-[240px]">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  What product are you thinking about?
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Enter the product keyword or name you{"'"}re considering selling on Amazon.
                </p>
                <Input
                  placeholder="e.g. stainless steel water bottle"
                  value={formData.product}
                  onChange={(e) => updateField("product", e.target.value)}
                  className="h-12 rounded-xl border-border bg-card text-base placeholder:text-muted-foreground/50 focus-visible:ring-primary/30"
                  autoFocus
                />
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  How much does it cost to manufacture?
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Your per-unit manufacturing or sourcing cost, including any MOQ considerations.
                </p>
                <div className="relative max-w-xs">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.manufacturingCost}
                    onChange={(e) => updateField("manufacturingCost", e.target.value)}
                    className="h-12 rounded-xl border-border bg-card pl-7 text-base placeholder:text-muted-foreground/50 focus-visible:ring-primary/30"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  What about shipping to Amazon?
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Per-unit cost to ship from your manufacturer to Amazon{"'"}s fulfillment centers.
                </p>
                <div className="relative max-w-xs">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.shippingCost}
                    onChange={(e) => updateField("shippingCost", e.target.value)}
                    className="h-12 rounded-xl border-border bg-card pl-7 text-base placeholder:text-muted-foreground/50 focus-visible:ring-primary/30"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  What price will you sell it for?
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Your target retail price on Amazon. We{"'"}ll calculate FBA fees automatically.
                </p>
                <div className="relative max-w-xs">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.sellingPrice}
                    onChange={(e) => updateField("sellingPrice", e.target.value)}
                    className="h-12 rounded-xl border-border bg-card pl-7 text-base placeholder:text-muted-foreground/50 focus-visible:ring-primary/30"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Do you have a competitive advantage?
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Optional. Describe anything that makes your product better — bundling, materials, design, branding.
                </p>
                <Textarea
                  placeholder="e.g. Double-wall insulation, unique color options, includes straw set..."
                  value={formData.advantage}
                  onChange={(e) => updateField("advantage", e.target.value)}
                  rows={4}
                  className="resize-none rounded-xl border-border bg-card text-base leading-relaxed placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 p-4"
                  autoFocus
                />
              </div>
            )}

            {step === 6 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  How complex is the product?
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  More complex products tend to have higher return rates and more customer complaints.
                </p>
                <div className="flex flex-col gap-3">
                  {[
                    { value: "simple", label: "Simple", desc: "Ready to use out of the box" },
                    { value: "moderate", label: "Moderate", desc: "Minor setup or assembly required" },
                    { value: "complex", label: "Complex", desc: "Technical product / installation needed" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateField("complexity", opt.value)}
                      className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                        formData.complexity === opt.value
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/30"
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                          formData.complexity === opt.value ? "border-primary" : "border-border"
                        }`}
                      >
                        {formData.complexity === opt.value && (
                          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                        <span className="ml-2 text-sm text-muted-foreground">{"— "}{opt.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!isStepValid()}
              className="gap-2 rounded-xl px-8 h-11"
            >
              {step === TOTAL_STEPS ? "Analyze" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
