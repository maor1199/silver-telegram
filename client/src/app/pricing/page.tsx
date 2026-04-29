import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Minus, Zap, Shield, Users, ArrowRight, Star } from "lucide-react"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Pricing — Free Amazon FBA Product Research Tool | SellerMentor",
  description: "SellerMentor is free to start — 5 full analyses, no credit card. Upgrade to PRO for unlimited Amazon product research, Keepa 12-month intelligence, and expert GO / NO-GO verdicts.",
  keywords: [
    "Amazon FBA tool pricing",
    "free Amazon product research",
    "Amazon seller tool free",
    "FBA product validator price",
  ],
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing — Free Amazon FBA Product Research Tool | SellerMentor",
    description: "Free to start. 5 analyses, no card. Upgrade to PRO for unlimited research and Keepa intelligence.",
    url: "/pricing",
  },
}

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Validate your first product idea. No credit card required.",
    cta: "Start free — no card",
    href: "/signup",
    highlighted: false,
    badge: null,
    features: [
      { text: "5 analyses (lifetime)", included: true },
      { text: "GO / NO-GO verdict", included: true },
      { text: "Full profit breakdown", included: true },
      { text: "Competition score", included: true },
      { text: "PPC cost estimate", included: true },
      { text: "Keepa market intelligence", included: false },
      { text: "Advisor memo", included: false },
      { text: "Save & history", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$49",
    period: "/ month",
    description: "For sellers who take research seriously before committing capital.",
    cta: "Start Pro — 3 days free",
    href: "/signup",
    highlighted: true,
    badge: "Most popular",
    features: [
      { text: "Unlimited analyses", included: true },
      { text: "GO / NO-GO verdict", included: true },
      { text: "Full profit breakdown", included: true },
      { text: "Competition & PPC analysis", included: true },
      { text: "Keepa 12-month market intelligence", included: true },
      { text: "FBA fee from real dimensions", included: true },
      { text: "Seasonal demand calendar", included: true },
      { text: "Advisor memo", included: true },
      { text: "Save & export analyses", included: true },
      { text: "Priority support", included: true },
    ],
  },
  {
    name: "Agency",
    price: "$149",
    period: "/ month",
    description: "For sourcing agencies and teams managing multiple seller accounts.",
    cta: "Contact us",
    href: "mailto:hello@sellermentor.ai",
    highlighted: false,
    badge: null,
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Team members (up to 10)", included: true },
      { text: "Bulk analysis mode", included: true },
      { text: "API access", included: true },
      { text: "White-label reports", included: true },
      { text: "Custom branding", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Early access to features", included: true },
    ],
  },
]

const comparisonFeatures = [
  { feature: "Analyses", free: "5 lifetime", pro: "Unlimited", agency: "Unlimited" },
  { feature: "GO / NO-GO verdict", free: true, pro: true, agency: true },
  { feature: "Profit & margin breakdown", free: "Full", pro: "Full", agency: "Full" },
  { feature: "PPC cost estimate (range)", free: true, pro: true, agency: true },
  { feature: "Keepa BSR & sales history", free: false, pro: true, agency: true },
  { feature: "FBA fee from real dimensions", free: false, pro: true, agency: true },
  { feature: "FBA seller count (csv[7])", free: false, pro: true, agency: true },
  { feature: "Seasonal demand calendar", free: false, pro: true, agency: true },
  { feature: "Real review-based pain points", free: false, pro: true, agency: true },
  { feature: "Advisor memo", free: false, pro: true, agency: true },
  { feature: "Save & export analyses", free: false, pro: true, agency: true },
  { feature: "Team members", free: false, pro: false, agency: "Up to 10" },
  { feature: "Bulk analysis", free: false, pro: false, agency: true },
  { feature: "API access", free: false, pro: false, agency: true },
  { feature: "White-label reports", free: false, pro: false, agency: true },
  { feature: "Support", free: "Community", pro: "Priority", agency: "Dedicated" },
]

const faqs = [
  {
    q: "Can I really run 5 full analyses for free?",
    a: "Yes. No credit card, no trial period. Your first 5 analyses are completely free and include the full GO / NO-GO verdict, profit breakdown, competition score, and PPC estimate. After that, upgrade to Pro for unlimited analyses.",
  },
  {
    q: "What exactly is Keepa market intelligence?",
    a: "Keepa tracks every Amazon product's BSR (Best Seller Rank), price, review count, and seller count over time. Pro users get 12 months of this data for the top competitor in their niche — including real FBA fees from actual product dimensions, seasonal demand patterns, and FBA seller count. Free users get market data from Amazon search results only.",
  },
  {
    q: "Is the Pro trial really free?",
    a: "Yes. Start Pro with a 3-day free trial. You get full Pro access immediately with no charge. Cancel before day 3 and you won't be billed anything.",
  },
  {
    q: "What if I only need to validate one product?",
    a: "Use Free. 5 analyses is enough to validate 1–2 serious product ideas with multiple parameter tests. If you're validating more than that, you're a serious seller and Pro pays for itself on the first product you avoid.",
  },
  {
    q: "How accurate is the profit calculation?",
    a: "Our margin estimates are within 5–8% of actual results. We model FBA fees (from real dimensions when an ASIN is provided), referral fees, estimated PPC, returns, and storage. The biggest variable is your actual ACoS — we give a range based on category data.",
  },
]

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#fef3c7]/60 via-background to-[#dbeafe]/30" />
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }} />
          <div className="relative mx-auto max-w-[1200px] px-6 pb-16 pt-20 text-center">
            <Badge variant="outline" className="mb-5 rounded-full border-primary/20 bg-primary/5 px-4 py-1.5 text-primary text-sm">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary" />
              One product saved = subscription paid for a year
            </Badge>
            <h1 className="text-4xl font-black text-foreground text-balance md:text-5xl leading-[1.1]" style={{ letterSpacing: "-0.03em" }}>
              Start free. Upgrade when<br className="hidden sm:block" /> you need the depth.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground leading-relaxed">
              Five free analyses with no credit card. Pro unlocks Keepa intelligence, unlimited research, and the advisor memo that tells you exactly what to do next.
            </p>

            {/* Social proof strip */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                No credit card for Free
              </span>
              <span className="text-border">·</span>
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                3-day Pro trial included
              </span>
              <span className="text-border">·</span>
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                2,000+ sellers
              </span>
            </div>
          </div>
        </section>

        {/* ── Plans ── */}
        <section className="mx-auto max-w-[1200px] px-6 pb-20 -mt-2">
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-8 transition-all duration-200",
                  plan.highlighted
                    ? "border-2 border-primary bg-card shadow-2xl shadow-primary/10 scale-[1.02]"
                    : "border-border bg-card hover:shadow-md hover:-translate-y-0.5"
                )}
              >
                {plan.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 text-xs font-bold tracking-wide">
                    {plan.badge}
                  </Badge>
                )}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">{plan.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-foreground" style={{ letterSpacing: "-0.03em" }}>{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
                </div>

                <div className="mt-6 flex flex-col gap-2.5">
                  {plan.features.map((feature) => (
                    <div key={feature.text} className="flex items-center gap-2.5">
                      {feature.included ? (
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <Minus className="h-4 w-4 shrink-0 text-muted-foreground/30" />
                      )}
                      <span className={cn(
                        "text-sm leading-relaxed",
                        feature.included ? "text-foreground" : "text-muted-foreground/50"
                      )}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 mt-auto pt-6">
                  <Button
                    className={cn(
                      "w-full h-11 rounded-xl font-semibold gap-2",
                      plan.highlighted
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                    asChild
                  >
                    <Link href={plan.href}>
                      {plan.cta}
                      {plan.highlighted && <ArrowRight className="h-4 w-4" />}
                    </Link>
                  </Button>
                  {plan.highlighted && (
                    <p className="mt-2.5 text-center text-xs text-muted-foreground">3-day free trial · Cancel anytime</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Value proposition band ── */}
        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-[1200px] px-6 py-12">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 text-center">
              {[
                { stat: "45 sec", label: "Avg. analysis time" },
                { stat: "±6%", label: "Profit accuracy" },
                { stat: "31%", label: "GO rate (most products fail)" },
                { stat: "$4,200", label: "Avg. bad launch cost avoided" },
              ].map((item) => (
                <div key={item.stat} className="flex flex-col gap-1">
                  <p className="text-3xl font-black text-foreground" style={{ letterSpacing: "-0.03em" }}>{item.stat}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Social Proof ── */}
        <section className="border-y border-border bg-background">
          <div className="mx-auto max-w-[1200px] px-6 py-16">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-10">What sellers say</p>
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                {
                  quote: "I almost sourced a $6,000 inventory run on a product that came back NO-GO. The margin after FBA fees was 4%. Saved my entire launch budget.",
                  name: "Daniel R.",
                  role: "First-time FBA seller",
                  verdict: "NO-GO saved",
                },
                {
                  quote: "The Fix-It Calculator is insane. It told me I needed to raise price $3 to flip the verdict to GO. I checked the market — competitors are already at that price. Done.",
                  name: "Sarah M.",
                  role: "Private label seller, 2 years",
                  verdict: "GO after fix",
                },
                {
                  quote: "I use it before every sourcing call. Takes 45 seconds and tells me if the numbers work. Keepa data in the same report is worth it alone.",
                  name: "James T.",
                  role: "Multi-product seller",
                  verdict: "PRO user",
                },
              ].map(({ quote, name, role, verdict }) => (
                <div key={name} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed flex-1">
                    &ldquo;{quote}&rdquo;
                  </p>
                  <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{name}</p>
                      <p className="text-[11px] text-muted-foreground">{role}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">{verdict}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Comparison Table ── */}
        <section className="bg-secondary/30">
          <div className="mx-auto max-w-[1200px] px-6 py-20">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-black text-foreground" style={{ letterSpacing: "-0.02em" }}>Everything, compared</h2>
              <p className="mt-2 text-muted-foreground text-sm">Every feature, every plan. No surprises.</p>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-4 text-left font-semibold text-foreground">Feature</th>
                    <th className="px-6 py-4 text-center font-semibold text-muted-foreground">Free</th>
                    <th className="px-6 py-4 text-center font-semibold text-primary bg-primary/[0.03]">Pro</th>
                    <th className="px-6 py-4 text-center font-semibold text-muted-foreground">Agency</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((row, i) => (
                    <tr key={row.feature} className={cn("transition-colors hover:bg-secondary/20", i < comparisonFeatures.length - 1 && "border-b border-border")}>
                      <td className="px-6 py-3.5 text-muted-foreground font-medium">{row.feature}</td>
                      <td className="px-6 py-3.5 text-center"><FeatureValue value={row.free} /></td>
                      <td className="px-6 py-3.5 text-center bg-primary/[0.02]"><FeatureValue value={row.pro} highlighted /></td>
                      <td className="px-6 py-3.5 text-center"><FeatureValue value={row.agency} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="border-t border-border bg-card">
          <div className="mx-auto max-w-[800px] px-6 py-20">
            <h2 className="text-2xl font-black text-foreground text-center mb-10" style={{ letterSpacing: "-0.02em" }}>Pricing questions</h2>
            <div className="flex flex-col gap-6">
              {faqs.map((faq) => (
                <div key={faq.q} className="rounded-2xl border border-border bg-background p-6">
                  <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="border-t border-border bg-secondary/30">
          <div className="mx-auto max-w-[1200px] px-6 py-20 text-center">
            <h2 className="text-3xl font-black text-foreground text-balance" style={{ letterSpacing: "-0.03em" }}>
              One NO-GO verdict pays for a year of Pro.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground leading-relaxed">
              The average bad Amazon launch costs $4,200. A Pro subscription costs $49/month. The math isn&apos;t complicated.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-12 rounded-xl bg-primary px-8 font-semibold shadow-lg shadow-primary/20 gap-2" asChild>
                <Link href="/signup">
                  Start free — 5 analyses included
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 rounded-xl px-8 font-semibold" asChild>
                <Link href="/analyze">Try an analysis first</Link>
              </Button>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}

function FeatureValue({ value, highlighted = false }: { value: boolean | string; highlighted?: boolean }) {
  if (value === true) return <Check className={cn("mx-auto h-4 w-4", highlighted ? "text-primary" : "text-emerald-500")} />
  if (value === false) return <Minus className="mx-auto h-4 w-4 text-muted-foreground/30" />
  return <span className={cn("text-sm", highlighted ? "font-semibold text-primary" : "text-muted-foreground")}>{value}</span>
}
