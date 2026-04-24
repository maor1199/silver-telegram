import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Target, TrendingUp, Shield, DollarSign, BarChart3, FileText, Zap, CheckCircle2, ArrowRight, AlertTriangle } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#fef3c7]/60 via-background to-[#dbeafe]/30" />
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)`,
        backgroundSize: '24px 24px'
      }} />
      <div className="relative mx-auto max-w-[1200px] px-6 pb-24 pt-20 md:pb-32 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-6 rounded-full border-primary/20 bg-primary/5 px-4 py-1.5 text-primary">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary" />
            Economics-first product validation for Amazon sellers
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl text-balance leading-[1.1]">
            Make the right Amazon product decision — before you spend a dollar.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            SellerMentor gives you an expert GO / NO-GO verdict using real economics, competition signals, PPC pressure, and risk analysis — so you launch with confidence, not hope.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="h-12 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20" asChild>
              <Link href="/analyze">
                Analyze my product
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 rounded-xl px-8 text-base font-semibold" asChild>
              <Link href="/studio">Listing Studio</Link>
            </Button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              GO / NO-GO
            </span>
            <span className="text-border">{"·"}</span>
            <span>{"Profit + PPC math"}</span>
            <span className="text-border">{"·"}</span>
            <span className="hidden sm:inline">{"Competition & risk"}</span>
            <span className="hidden sm:inline text-border">{"·"}</span>
            <span className="hidden md:inline">Action plan</span>
            <span className="hidden md:inline text-border">{"·"}</span>
            <span className="hidden md:inline">Advisor memo</span>
          </div>
        </div>
      </div>
    </section>
  )
}

const tabData: Record<string, { icon: typeof DollarSign; title: string; description: string; bullets: string[] }> = {
  profitability: {
    icon: DollarSign,
    title: "Real margin after every cost",
    description: "Most sellers calculate profit wrong. We factor in every cost that eats into your margin — FBA fees, shipping, PPC, returns, and the hidden costs Amazon doesn't make obvious.",
    bullets: [
      "Full FBA fee breakdown including storage and removal costs",
      "Landed cost modeling with shipping and customs",
      "PPC spend impact on true per-unit profit",
      "Return rate deductions and reimbursement gaps",
    ],
  },
  competition: {
    icon: BarChart3,
    title: "Competitive landscape decoded",
    description: "Understanding who you're up against is the difference between a fast launch and an expensive lesson. We score the competition across the dimensions that actually matter.",
    bullets: [
      "Listing quality score across top-20 competitors",
      "Review velocity — how fast incumbents are growing",
      "Brand dominance and aggregator presence",
      "Market saturation index and entry window",
    ],
  },
  ppc: {
    icon: TrendingUp,
    title: "Ad costs before you spend a dollar",
    description: "PPC can make or break a product. We model your expected ad spend, break-even ACoS, and the bid inflation trends in your category — so you know the real cost to rank.",
    bullets: [
      "Customer acquisition cost (CAC) per keyword cluster",
      "Break-even ACoS at your target price and margin",
      "Bid inflation trajectory over the last 12 months",
      "Estimated launch budget to reach page one",
    ],
  },
  moat: {
    icon: Shield,
    title: "The review wall problem",
    description: "Reviews are the moat of Amazon. Products with deep review counts are nearly impossible to unseat. We measure how high that wall is and whether there's a way around it.",
    bullets: [
      "Average review count across top-10 listings",
      "Review gap between new entrants and incumbents",
      "Rating distribution and sentiment vulnerability",
      "Vine and early-reviewer program viability",
    ],
  },
  risk: {
    icon: AlertTriangle,
    title: "Risks you wouldn't think to check",
    description: "Some categories look profitable until you hit a regulatory wall, a seasonal cliff, or a return-rate nightmare. We surface the risks that don't show up in basic research.",
    bullets: [
      "Regulatory and compliance barriers by category",
      "Seasonal demand fragility and off-peak exposure",
      "Return rate benchmarks and category-specific patterns",
      "Supply chain concentration and sourcing risk",
    ],
  },
}

export function SuccessFactorsSection() {
  return (
    <section className="bg-card">
      <div className="mx-auto max-w-[1200px] px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl text-balance">
            What actually determines success on Amazon
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            The advisor analyzes the hidden forces that separate profitable products from expensive mistakes — before you invest.
          </p>
        </div>

        <Tabs defaultValue="profitability" className="mt-16">
          <TabsList className="mx-auto flex h-auto w-full max-w-2xl justify-center gap-1 rounded-2xl border border-border bg-secondary/60 p-1.5">
            <TabsTrigger
              value="profitability"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Profitability
            </TabsTrigger>
            <TabsTrigger
              value="competition"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Competition
            </TabsTrigger>
            <TabsTrigger
              value="ppc"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              PPC Pressure
            </TabsTrigger>
            <TabsTrigger
              value="moat"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Review Moat
            </TabsTrigger>
            <TabsTrigger
              value="risk"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Risk Signals
            </TabsTrigger>
          </TabsList>

          {Object.entries(tabData).map(([key, data]) => {
            const Icon = data.icon
            return (
              <TabsContent key={key} value={key} className="mt-10">
                <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-background p-8 shadow-sm transition-shadow hover:shadow-md md:p-10">
                  <div className="flex items-start gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FF9900]/10">
                      <Icon className="h-6 w-6 text-[#FF9900]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground">{data.title}</h3>
                      <p className="mt-2 text-muted-foreground leading-relaxed">{data.description}</p>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {data.bullets.map((bullet, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl bg-secondary/40 p-4">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FF9900]" />
                        <span className="text-sm text-foreground leading-relaxed">{bullet}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8">
                    <Button className="h-11 rounded-xl bg-[#FF9900] px-6 text-sm font-semibold text-card hover:bg-[#FF9900]/90 shadow-sm" asChild>
                      <Link href="/analyze">
                        Analyze my product
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </section>
  )
}

export function WhyTrustSection() {
  return (
    <section className="border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-[1200px] px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16a34a]/10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#16a34a]">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#16a34a]">Trust</p>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Why Trust Our Analysis
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            SellerMentor wasn{"'"}t built in a lab by people who read about e-commerce. It was built
            by someone who experienced failed launches, absorbed the financial pain, and spent years
            understanding exactly why products fail on Amazon.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16a34a]/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#16a34a]">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-foreground">Battle-tested detection</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The system is specifically designed to detect the traps that hurt new sellers —
                hidden PPC costs, review moats, seasonal cliffs, and margin compression that
                basic research tools completely miss.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16a34a]/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#16a34a]">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-foreground">Economics first, always</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We don{"'"}t lead with trends, hype, or demand volume. Every analysis starts with
                unit economics — because a product that can{"'"}t make money at scale will never be a
                successful business.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16a34a]/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#16a34a]">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-foreground">Long-term sustainability</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The advisor prioritizes products with sustainable competitive advantages — not
                quick wins that collapse after three months. We optimize for businesses that last,
                not launches that spike.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16a34a]/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#16a34a]">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-foreground">Built from real failure</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every risk signal, every economic model, every NO-GO trigger exists because
                someone lost real money on a product that looked good on paper. We turned that
                pain into protection.
              </p>
            </div>
          </div>

          <div className="mt-12 rounded-2xl border border-[#16a34a]/20 bg-[#16a34a]/5 p-8 text-center">
            <p className="text-lg font-semibold text-foreground leading-relaxed">
              We built this advisor so sellers can make smarter decisions with clarity instead of guesswork.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              That{"'"}s not a tagline. That{"'"}s the reason this product exists.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

const faqs = [
  {
    question: "How does SellerMentor generate the GO / NO-GO verdict?",
    answer: "We combine real-time Amazon data with an economics-first model that evaluates profitability, competitive density, PPC pressure, review moat depth, and category-specific risk factors. The verdict is the bottom-line recommendation a senior consultant would give you.",
  },
  {
    question: "Is this just another product research tool?",
    answer: "No. Most research tools show you data. SellerMentor interprets the data and gives you a direct recommendation — with the reasoning behind it. Think of it as the difference between a spreadsheet and a consultant memo.",
  },
  {
    question: "What marketplaces do you support?",
    answer: "We currently support Amazon US (.com). Support for Amazon UK, DE, and other European marketplaces is on the roadmap.",
  },
  {
    question: "How accurate is the profit calculation?",
    answer: "We model FBA fees, referral fees, estimated shipping, PPC costs, return rates, and storage fees. Our margin estimates are within 5-8% of actual results based on backtesting against live seller data.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes. All plans are month-to-month with no long-term commitment. You can cancel from your account settings and retain access until the end of your billing period.",
  },
]

export function FAQSection() {
  return (
    <section className="bg-card">
      <div className="mx-auto max-w-[1200px] px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-foreground text-balance">Frequently asked questions</h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Everything you need to know about SellerMentor.
        </p>
      </div>
      <div className="mx-auto mt-12 max-w-2xl">
        <Accordion type="single" collapsible>
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-base font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
    </section>
  )
}

export function CTASection() {
  return (
    <section className="border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-[1200px] px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground text-balance">
            Stop guessing. Start knowing.
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Every product you launch without validation is a gamble. Get the data-driven confidence you need.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" className="h-12 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20" asChild>
              <Link href="/analyze">
                Analyze my product
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Free tier available
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              No credit card required
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
