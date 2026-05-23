import Link from "next/link"
import { ArrowRight } from "lucide-react"

// ─── Hero ─────────────────────────────────────────────────────────────────────

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border/50">
      {/* Subtle grid background */}
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)`,
        backgroundSize: "32px 32px",
      }} />

      <div className="relative mx-auto max-w-[1200px] px-6 pb-20 pt-20 md:pb-28 md:pt-28">

        {/* Headline block */}
        <div className="max-w-[600px]">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-5">
            Operational monitoring for ecommerce
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl leading-[1.1] text-balance">
            Detect operational deterioration before it becomes expensive.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-[520px]">
            SellerMentor monitors your SKUs continuously — inventory, margin, ad efficiency, returns.
            It surfaces what&apos;s quietly getting worse, before it costs you money.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              Open Command Center
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/data"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-secondary/50 transition-colors"
            >
              Import your data
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card. Works with demo data instantly.
          </p>
        </div>

        {/* Live feed preview — styled like the real dashboard */}
        <div className="mt-16 max-w-[560px]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            What needs attention now
          </p>
          <div className="rounded-2xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-sm">
            {PREVIEW_ITEMS.map((item, i) => (
              <div key={i} className={`pl-4 pr-5 py-4 border-l-2 ${item.borderColor}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{item.sku}</span>
                    <span className="text-xs text-muted-foreground/40">·</span>
                    <span className="text-xs text-muted-foreground capitalize">{item.category}</span>
                  </div>
                  <span className={`text-xs font-semibold ${item.trajectoryColor}`}>{item.trajectory}</span>
                </div>
                <p className="text-sm font-semibold text-foreground leading-snug">{item.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.context}</p>
                {item.projection && (
                  <div className="mt-2 rounded-md bg-amber-50/80 border border-amber-200/60 px-2.5 py-1.5">
                    <p className="text-[11px] text-amber-800 leading-snug">
                      <span className="font-semibold">If nothing changes:</span> {item.projection}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground/60 mt-2.5 text-center">
            Sample data — your live business replaces this
          </p>
        </div>
      </div>
    </section>
  )
}

const PREVIEW_ITEMS = [
  {
    sku: "Bamboo Cutting Board",
    category: "stockout",
    trajectory: "↑ Accelerating",
    trajectoryColor: "text-red-600",
    borderColor: "border-l-red-500",
    headline: "Order now — 6 days of stock, lead time 28 days",
    context: "You are already past your reorder point. Any delay locks in a stockout gap.",
    projection: "A ~22-day gap costs approximately $6,900 in lost revenue. Rank recovery takes 2–4× the OOS duration.",
  },
  {
    sku: "Electric Coffee Grinder",
    category: "margin",
    trajectory: "Deteriorating",
    trajectoryColor: "text-orange-600",
    borderColor: "border-l-orange-400",
    headline: "Losing $270/mo — every sale costs you money",
    context: "At 53% ACoS and −3% net margin, ad spend alone puts this SKU in the red.",
    projection: "$810 destroyed in the next 90 days. Annualised: $3,240 if nothing changes.",
  },
  {
    sku: "Yoga Mat Premium",
    category: "returns",
    trajectory: "Stable",
    trajectoryColor: "text-yellow-600",
    borderColor: "border-l-yellow-400",
    headline: "Return rate 16% — 4× category average",
    context: "~34 returns/month at an estimated $44 cost per unit. Root cause unaddressed.",
    projection: undefined,
  },
]

// ─── Three Pillars ────────────────────────────────────────────────────────────

export function PillarsSection() {
  return (
    <section className="py-20 border-t border-border">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid md:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden border border-border">
          {PILLARS.map((pillar, i) => (
            <div key={i} className="bg-card px-8 py-8">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="text-base font-bold text-foreground mb-2 leading-snug">{pillar.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{pillar.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const PILLARS = [
  {
    title: "Monitors what's quietly deteriorating",
    body: "Stockout velocity, margin compression, PPC drift, return rate changes. Every active SKU, continuously. Issues surface the moment they cross operational thresholds — not after the month ends.",
  },
  {
    title: "Shows what happens if nothing changes",
    body: "Every alert carries a projected consequence — concrete estimates, not vague risk scores. Revenue gap from a stockout. Monthly loss from a negative-margin SKU. Storage burn from dead inventory.",
  },
  {
    title: "Remembers operational history",
    body: "Knows how long each issue has been active. Distinguishes a first occurrence from a chronic problem. A 12-session recurring issue is treated differently than something detected today.",
  },
]

// ─── CTA ──────────────────────────────────────────────────────────────────────

export function CTASection() {
  return (
    <section className="py-20 border-t border-border">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="rounded-2xl border border-border bg-card px-10 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="max-w-[480px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Start now</p>
            <h2 className="text-2xl font-bold text-foreground leading-snug text-balance">
              See what&apos;s quietly deteriorating in your business.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Open the command center with demo data. Or import your own SKU export — the risk engine runs in seconds.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Open Command Center
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/data"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-secondary/50 transition-colors"
            >
              Import my data
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Legacy exports (kept for any pages that still import them) ───────────────

export function SuccessFactorsSection() { return null }
export function WhyTrustSection()       { return null }
export function FAQSection()            { return null }
