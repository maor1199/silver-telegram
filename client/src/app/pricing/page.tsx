import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Pricing",
  description: "Start free with 5 analyses. Upgrade to SellerMentor PRO for unlimited Amazon product research, Keepa intelligence, and expert GO / NO-GO verdicts.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing — SellerMentor",
    description: "Start free with 5 analyses. Upgrade to PRO for unlimited Amazon product research and expert verdicts.",
    url: "/pricing",
  },
}

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try SellerMentor with no commitment.",
    cta: "Start free",
    href: "/signup",
    highlighted: false,
    features: [
      "3 analyses per month",
      "GO / NO-GO verdict",
      "Basic profit breakdown",
      "Competition score",
      "Community support",
    ],
  },
  {
    name: "Standard",
    price: "$39",
    period: "/ month",
    description: "For active sellers validating multiple products.",
    cta: "Choose Standard",
    href: "/signup",
    highlighted: true,
    features: [
      "30 analyses per month",
      "GO / NO-GO verdict",
      "Full profit breakdown",
      "Competition & PPC analysis",
      "Risk assessment",
      "Differentiation ideas",
      "Advisor memo",
      "Save & export analyses",
      "Priority support",
    ],
  },
  {
    name: "Pro",
    price: "$79",
    period: "/ month",
    description: "For serious sellers and agencies managing portfolios.",
    cta: "Upgrade to Pro",
    href: "/signup",
    highlighted: false,
    features: [
      "Unlimited analyses",
      "Everything in Standard",
      "Bulk analysis mode",
      "API access",
      "Custom report branding",
      "Team members (up to 5)",
      "Dedicated support",
      "Early access to features",
    ],
  },
]

const comparisonFeatures = [
  { feature: "Analyses per month", free: "3", standard: "30", pro: "Unlimited" },
  { feature: "GO / NO-GO verdict", free: true, standard: true, pro: true },
  { feature: "Profit breakdown", free: "Basic", standard: "Full", pro: "Full" },
  { feature: "Competition analysis", free: false, standard: true, pro: true },
  { feature: "PPC pressure index", free: false, standard: true, pro: true },
  { feature: "Risk assessment", free: false, standard: true, pro: true },
  { feature: "Differentiation ideas", free: false, standard: true, pro: true },
  { feature: "Advisor memo", free: false, standard: true, pro: true },
  { feature: "Save analyses", free: false, standard: true, pro: true },
  { feature: "Export PDF", free: false, standard: true, pro: true },
  { feature: "Bulk analysis", free: false, standard: false, pro: true },
  { feature: "API access", free: false, standard: false, pro: true },
  { feature: "Team members", free: false, standard: false, pro: "Up to 5" },
  { feature: "Custom branding", free: false, standard: false, pro: true },
  { feature: "Support", free: "Community", standard: "Priority", pro: "Dedicated" },
]

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Header */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#fef3c7]/60 via-background to-[#dbeafe]/30" />
          <div className="relative mx-auto max-w-[1200px] px-6 py-20 text-center">
            <h1 className="text-4xl font-bold text-foreground text-balance md:text-5xl">
              Simple, honest pricing
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground leading-relaxed">
              Start free. Upgrade when you need more analyses and deeper insights. No hidden fees.
            </p>
          </div>
        </section>

        {/* Plans */}
        <section className="mx-auto max-w-[1200px] px-6 pb-20 -mt-4">
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
                <div className="mt-8 flex flex-col gap-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 mt-auto pt-4">
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

        {/* Comparison Table */}
        <section className="border-t border-border bg-secondary/30">
          <div className="mx-auto max-w-[1200px] px-6 py-20">
            <h2 className="text-center text-2xl font-bold text-foreground mb-10">Feature comparison</h2>
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-4 text-left font-semibold text-card-foreground">Feature</th>
                    <th className="px-6 py-4 text-center font-semibold text-card-foreground">Free</th>
                    <th className="px-6 py-4 text-center font-semibold text-primary">
                      Standard
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-card-foreground">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((row, i) => (
                    <tr key={row.feature} className={i < comparisonFeatures.length - 1 ? "border-b border-border" : ""}>
                      <td className="px-6 py-3.5 text-muted-foreground">{row.feature}</td>
                      <td className="px-6 py-3.5 text-center">
                        <FeatureValue value={row.free} />
                      </td>
                      <td className="px-6 py-3.5 text-center bg-primary/[0.02]">
                        <FeatureValue value={row.standard} />
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <FeatureValue value={row.pro} />
                      </td>
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
  if (value === true) {
    return <Check className="mx-auto h-4 w-4 text-primary" />
  }
  if (value === false) {
    return <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
  }
  return <span className="text-sm text-muted-foreground">{value}</span>
}
