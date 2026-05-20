import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle,
  AlertCircle,
  Package,
  BarChart3,
  Zap,
  ArrowRight,
  CheckCircle2,
  TrendingDown,
  DollarSign,
  Activity,
  Shield,
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

// ─── Hero ─────────────────────────────────────────────────────────────────────

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-background to-blue-50/30" />
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.025) 1px, transparent 0)`,
        backgroundSize: "28px 28px",
      }} />

      <div className="relative mx-auto max-w-[1200px] px-6 pb-24 pt-20 md:pb-32 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-6 rounded-full border-primary/20 bg-primary/5 px-4 py-1.5 text-primary">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary" />
            AI-powered operational intelligence for ecommerce sellers
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl text-balance leading-[1.1]">
            Know what&apos;s about to hurt your business — before it happens.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            SellerMentor monitors your inventory, margins, PPC, and operational signals across every SKU — then tells you exactly what needs attention, why it matters, and what to do next.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="h-12 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20" asChild>
              <Link href="/dashboard">
                Open Command Center
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 rounded-xl px-8 text-base font-semibold" asChild>
              <Link href="/analyze">Validate a Product</Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Inventory Risk · Profit Intelligence · Margin Alerts · AI Advisor · Product Validator
          </p>
        </div>

        {/* ── Mock risk cards preview ──────────────────────────────────────── */}
        <div className="mx-auto mt-16 max-w-2xl space-y-3">
          {[
            {
              severity: "Critical",
              color: "border-red-200 bg-red-50",
              badge: "bg-red-100 text-red-700 border-red-200",
              dot: "bg-red-500 animate-pulse",
              icon: AlertCircle,
              iconColor: "text-red-500",
              iconBg: "bg-red-100",
              sku: "Bamboo Cutting Board",
              title: "Reorder today — stockout in 6 days, lead time 28 days",
              impact: "-$1,680 in lost revenue",
            },
            {
              severity: "Critical",
              color: "border-red-200 bg-red-50",
              badge: "bg-red-100 text-red-700 border-red-200",
              dot: "bg-red-500",
              icon: AlertCircle,
              iconColor: "text-red-500",
              iconBg: "bg-red-100",
              sku: "Electric Coffee Grinder",
              title: "Negative margin — losing $1.80/unit at 53% ACoS",
              impact: "-$270/month and worsening",
            },
            {
              severity: "High",
              color: "border-orange-200 bg-orange-50",
              badge: "bg-orange-100 text-orange-700 border-orange-200",
              dot: "bg-orange-500",
              icon: AlertTriangle,
              iconColor: "text-orange-500",
              iconBg: "bg-orange-100",
              sku: "Yoga Mat Premium",
              title: "Return rate 16% — 4× category average, margin at 9.8%",
              impact: "-$1,511/month in returns",
            },
          ].map((card, i) => (
            <div key={i} className={`rounded-2xl border p-4 ${card.color}`}>
              <div className="flex items-start gap-3">
                <div className={`rounded-lg p-1.5 flex-shrink-0 ${card.iconBg}`}>
                  <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${card.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${card.dot}`} />
                      {card.severity}
                    </span>
                    <span className="rounded-full bg-white/70 border border-gray-200 px-2 py-0.5 text-[10px] text-gray-600">{card.sku}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-snug">{card.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">Estimated impact: <span className="font-semibold text-red-600">{card.impact}</span></p>
                </div>
              </div>
            </div>
          ))}
          <p className="text-center text-xs text-muted-foreground pt-2">Sample data — your live business signals replace this</p>
        </div>
      </div>
    </section>
  )
}

// ─── Intelligence Modules ─────────────────────────────────────────────────────

export function SuccessFactorsSection() {
  const modules = [
    {
      icon: Activity,
      title: "Command Center",
      href: "/dashboard",
      desc: "One screen. Every risk that needs attention today — sorted by severity, with estimated impact and recommended action.",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Package,
      title: "Inventory Risk",
      href: "/inventory",
      desc: "Stockout and overstock tracking per SKU. Reorder signals based on real sales velocity and supplier lead time.",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      icon: BarChart3,
      title: "Profit & Margin",
      href: "/profit",
      desc: "True profitability after every cost — fees, PPC, returns, storage. Per-SKU margin with erosion alerts.",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      icon: Zap,
      title: "AI Advisor",
      href: "/advisor",
      desc: "Ask operational questions in plain language. Which SKU to reorder, where margin is leaking, what threatens cashflow.",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      icon: CheckCircle2,
      title: "Product Validator",
      href: "/analyze",
      desc: "Before you commit capital — GO / NO-GO verdict with real profit math, competition score, and market intelligence.",
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      icon: Shield,
      title: "Listing Intelligence",
      href: "/listing-builder",
      desc: "AI-generated Amazon titles, bullets, and descriptions optimized for A9 — paste directly into Seller Central.",
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
  ]

  return (
    <section className="py-20 border-t border-border">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Intelligence Modules</p>
          <h2 className="text-3xl font-bold text-foreground text-balance">
            Everything an ecommerce operator needs to see.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            SellerMentor replaces 5 separate tools with one operational brain — connected, contextual, and always pointing to what matters next.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map(m => (
            <Link key={m.href} href={m.href} className="group rounded-2xl border border-border bg-card p-6 hover:shadow-md hover:border-primary/20 transition-all">
              <div className={`inline-flex rounded-xl p-2.5 mb-4 ${m.bg}`}>
                <m.icon className={`h-5 w-5 ${m.color}`} />
              </div>
              <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{m.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Open module <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Why Trust ────────────────────────────────────────────────────────────────

export function WhyTrustSection() {
  const problems = [
    { title: "You find out about stockouts after they happen", solution: "SellerMentor flags stockout risk 30+ days in advance, factoring in your supplier lead time." },
    { title: "PPC costs are rising but you don't notice until end of month", solution: "ACoS alerts trigger the moment ad spend outpaces revenue — per SKU, not at portfolio level." },
    { title: "Margin erosion is invisible until the P&L is already damaged", solution: "Per-unit profit tracked continuously. Margin drop below threshold = immediate alert with root cause." },
    { title: "You don't know which SKU to prioritize today", solution: "The Command Center ranks every risk by severity and estimated $ impact. The top action is always clear." },
  ]

  return (
    <section className="py-20 border-t border-border bg-muted/20">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">The Problem We Solve</p>
            <h2 className="text-3xl font-bold text-foreground text-balance leading-tight">
              Most ecommerce losses are preventable. They just weren&apos;t visible in time.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              The average seller uses 4–7 tools and checks them reactively. By the time the data shows a problem, the damage is done. SellerMentor runs continuously in the background, reading your signals and surfacing risks before they become losses.
            </p>
          </div>
          <div className="space-y-4">
            {problems.map((p, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-red-600">✕</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1.5">{p.title}</p>
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{p.solution}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export function FAQSection() {
  const faqs = [
    {
      q: "Who is SellerMentor for?",
      a: "Ecommerce sellers operating on Amazon, Shopify, eBay, Walmart, or multiple channels — especially those past the early stage who are managing multiple SKUs and need operational visibility, not just product research."
    },
    {
      q: "How does the risk engine work?",
      a: "The risk engine evaluates each SKU across inventory velocity, margin, PPC performance, and return rates. It generates alerts ranked by severity (Critical, High, Medium) with estimated $ impact and recommended actions. Every alert explains what's happening, why it matters, and what to do."
    },
    {
      q: "Do I need to connect my Amazon account?",
      a: "For the MVP, the product works with sample data that you can replace with a CSV upload. Direct Amazon SP-API integration is on the roadmap. The risk engine and AI advisor are fully functional with any data source."
    },
    {
      q: "What makes this different from Sellerboard or Jungle Scout?",
      a: "Sellerboard is a P&L tracker — it shows you what happened. Jungle Scout is a product research tool — it helps you find products. SellerMentor is an operational intelligence layer — it monitors what is happening right now and tells you what needs action before it damages the business. The difference is proactive vs. reactive."
    },
    {
      q: "What does the AI Advisor actually do?",
      a: "The AI Advisor reads your live SKU data — inventory levels, margins, PPC performance, return rates, and active risk alerts — and answers operational questions in plain language. Not 'you should consider reviewing your margins' but 'SKU B002 ACoS is at 42% and trending up — reducing bids by 15% would recover ~$400/month in margin'."
    },
    {
      q: "Is the product validator still available?",
      a: "Yes. The GO / NO-GO product validator is available at /analyze. It's now part of the broader platform — use it before you commit capital on a new product, then use the rest of SellerMentor to manage it once it's live."
    },
  ]

  return (
    <section className="py-20 border-t border-border">
      <div className="mx-auto max-w-[800px] px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">Questions</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="rounded-2xl border border-border bg-card px-6 data-[state=open]:bg-muted/30 transition-colors">
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-4 text-left">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

export function CTASection() {
  return (
    <section className="py-20 border-t border-border">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-background to-background p-12 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Start Now</p>
          <h2 className="text-3xl font-bold text-foreground text-balance">
            Your operating brain is ready.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto leading-relaxed">
            Stop finding out about problems after they&apos;ve already cost you money. Open the Command Center and see your business risks in real time.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="h-12 rounded-xl bg-primary px-8 text-base font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20" asChild>
              <Link href="/dashboard">
                Open Command Center <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 rounded-xl px-8 text-base font-semibold" asChild>
              <Link href="/signup">Create Free Account</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
