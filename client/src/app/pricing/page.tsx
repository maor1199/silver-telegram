import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Explore with demo data. No commitment required.",
    cta: "Start free",
    href: "/signup",
    highlighted: false,
    features: [
      "Command Center (demo portfolio)",
      "Priority risk feed",
      "Inventory & margin tracking",
      "AI Advisor (demo data)",
      "Community support",
    ],
  },
  {
    name: "Standard",
    price: "$39",
    period: "/ month",
    description: "For operators actively monitoring their own portfolio.",
    cta: "Get started",
    href: "/signup",
    highlighted: true,
    features: [
      "Everything in Free",
      "Import your own SKU data",
      "Full portfolio monitoring",
      "Unlimited AI Advisor queries",
      "Alert history & trends",
      "Daily briefing",
      "Priority support",
    ],
  },
  {
    name: "Pro",
    price: "$79",
    period: "/ month",
    description: "For operators managing multiple brands or agencies.",
    cta: "Upgrade to Pro",
    href: "/signup",
    highlighted: false,
    features: [
      "Everything in Standard",
      "Unlimited SKUs",
      "API access",
      "Team members (up to 5)",
      "Custom alert thresholds",
      "Dedicated support",
      "Early access to features",
    ],
  },
]

const comparisonFeatures = [
  { feature: "Command Center",          free: true,           standard: true,        pro: true         },
  { feature: "Demo portfolio",          free: true,           standard: true,        pro: true         },
  { feature: "Import your own data",    free: false,          standard: true,        pro: true         },
  { feature: "SKUs monitored",          free: "Demo only",    standard: "Up to 100", pro: "Unlimited"  },
  { feature: "Priority risk feed",      free: true,           standard: true,        pro: true         },
  { feature: "Inventory risk tracking", free: true,           standard: true,        pro: true         },
  { feature: "Margin & profit analysis",free: true,           standard: true,        pro: true         },
  { feature: "AI Advisor",              free: "Demo only",    standard: "Unlimited", pro: "Unlimited"  },
  { feature: "Alert history & trends",  free: false,          standard: true,        pro: true         },
  { feature: "Daily briefing",          free: false,          standard: true,        pro: true         },
  { feature: "API access",              free: false,          standard: false,       pro: true         },
  { feature: "Team members",            free: false,          standard: false,       pro: "Up to 5"    },
  { feature: "Custom alert thresholds", free: false,          standard: false,       pro: true         },
  { feature: "Support",                 free: "Community",    standard: "Priority",  pro: "Dedicated"  },
]

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <section className="border-b border-border/50">
          <div className="mx-auto max-w-[1200px] px-6 py-20">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Pricing</p>
            <h1 className="text-4xl font-bold text-foreground text-balance md:text-5xl max-w-[560px]">
              Simple, honest pricing.
            </h1>
            <p className="mt-4 max-w-[480px] text-lg text-muted-foreground leading-relaxed">
              Start free with demo data. Upgrade when you&apos;re ready to monitor your own business.
              No hidden fees.
            </p>
          </div>
        </section>

        {/* ── Plans ───────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[1200px] px-6 py-16">
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-8 transition-all",
                  plan.highlighted
                    ? "border-2 border-primary bg-card shadow-xl shadow-primary/10"
                    : "border-border bg-card hover:shadow-md"
                )}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 text-xs">
                    Most popular
                  </Badge>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-card-foreground">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
                </div>
                <div className="mt-8 flex flex-col gap-3 flex-1">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-4">
                  <Button
                    className={cn(
                      "w-full h-11 rounded-xl font-semibold",
                      plan.highlighted
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                    asChild
                  >
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Comparison table ────────────────────────────────────────────── */}
        <section className="border-t border-border bg-secondary/30">
          <div className="mx-auto max-w-[1200px] px-6 py-20">
            <h2 className="text-xl font-bold text-foreground mb-8">Full comparison</h2>
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-4 text-left font-semibold text-card-foreground">Feature</th>
                    <th className="px-6 py-4 text-center font-semibold text-card-foreground">Free</th>
                    <th className="px-6 py-4 text-center font-semibold text-primary">Standard</th>
                    <th className="px-6 py-4 text-center font-semibold text-card-foreground">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={i < comparisonFeatures.length - 1 ? "border-b border-border" : ""}
                    >
                      <td className="px-6 py-3.5 text-muted-foreground">{row.feature}</td>
                      <td className="px-6 py-3.5 text-center"><FeatureValue value={row.free} /></td>
                      <td className="px-6 py-3.5 text-center bg-primary/[0.02]"><FeatureValue value={row.standard} /></td>
                      <td className="px-6 py-3.5 text-center"><FeatureValue value={row.pro} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true)  return <Check className="mx-auto h-4 w-4 text-primary" />
  if (value === false) return <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
  return <span className="text-sm text-muted-foreground">{value}</span>
}
