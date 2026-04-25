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
            Used by 2,000+ new Amazon sellers
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl text-balance leading-[1.1]">
            Know if your product will make money — before you order a single unit.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            SellerMentor runs the same analysis a $500/hour Amazon consultant would run. GO verdict means real profit. NO-GO means you just saved your launch budget.
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

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="font-medium text-foreground">Avg. analysis time: 45 sec</span>
            </span>
            <span className="text-border hidden sm:inline">{"·"}</span>
            <span className="flex items-center gap-1.5">
              <span className="font-medium text-foreground">Full unit economics</span>
              <span className="text-muted-foreground">(FBA, PPC, COGS)</span>
            </span>
            <span className="text-border hidden md:inline">{"·"}</span>
            <span className="hidden md:flex items-center gap-1.5">
              <span className="font-medium text-foreground">Free to start</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

const tabData: Record<string, { icon: typeof DollarSign; title: string; description: string; bullets: string[] }> = {
  profitability: {
    icon: DollarSign,
    title: "Profit Math — the number that actually matters",
    description: "Most sellers calculate margin on product cost alone. They get to launch and discover FBA fees, PPC, and returns eat half the profit. We model the full unit economics so the number you see is the number you'll actually keep.",
    bullets: [
      "Full FBA fee breakdown including storage, removals, and oversize surcharges",
      "Landed cost modeling with real freight and customs estimates",
      "PPC spend modeled into true per-unit net profit",
      "Return rate deductions using category-specific benchmarks",
    ],
  },
  competition: {
    icon: BarChart3,
    title: "Competition — know who you're actually fighting",
    description: "The search results page is a battlefield. We score every competitor on the dimensions that decide whether a new listing can gain traction — not just review count, but listing quality, brand moat, and aggregator presence.",
    bullets: [
      "Listing quality score across the top-20 results",
      "Review velocity — how fast incumbents are widening the gap",
      "Brand dominance and Amazon aggregator presence flags",
      "Market saturation index with real entry-window scoring",
    ],
  },
  ppc: {
    icon: TrendingUp,
    title: "PPC Cost — your real cost to rank",
    description: "PPC is the hidden tax on every Amazon launch. We model your customer acquisition cost, break-even ACoS, and bid inflation trends before you've spent a dollar — so the ad budget doesn't blindside you after sourcing.",
    bullets: [
      "Customer acquisition cost (CAC) per keyword cluster",
      "Break-even ACoS calculated at your price point and margin",
      "Bid inflation trajectory over the trailing 12 months",
      "Estimated launch spend to reach page-one organic rank",
    ],
  },
  moat: {
    icon: Shield,
    title: "Review Wall — is the door already closed?",
    description: "A category where the top listings have 10,000 reviews is not a market — it's a fortress. We measure the height of the review wall and tell you honestly whether there's a crack in it or not.",
    bullets: [
      "Average review count across the top-10 listings",
      "Review gap between new entrants and established players",
      "Rating distribution and sentiment vulnerability signals",
      "Vine and early-reviewer program viability by category",
    ],
  },
  risk: {
    icon: AlertTriangle,
    title: "Risk Signals — the surprises that bankrupt launches",
    description: "Compliance issues, seasonal cliffs, return nightmares — these don't show up in a spreadsheet. We surface the category-specific traps that blindsided sellers who looked at the same numbers you're looking at now.",
    bullets: [
      "Regulatory and compliance barriers flagged by category",
      "Seasonal demand fragility and off-peak revenue exposure",
      "Return rate benchmarks versus your category norm",
      "Supply chain concentration and sourcing risk scoring",
    ],
  },
}

export function SuccessFactorsSection() {
  return (
    <section className="bg-card">
      <div className="mx-auto max-w-[1200px] px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl text-balance">
            Five forces that decide if your product lives or dies
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Gut feel is not a strategy. SellerMentor quantifies every force that determines whether a product is a business or a bill.
          </p>
        </div>

        <Tabs defaultValue="profitability" className="mt-16">
          <TabsList className="mx-auto flex h-auto w-full max-w-2xl justify-center gap-1 rounded-2xl border border-border bg-secondary/60 p-1.5">
            <TabsTrigger
              value="profitability"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Profit Math
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
              PPC Cost
            </TabsTrigger>
            <TabsTrigger
              value="moat"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Review Wall
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

          {/* Stat banner */}
          <div className="mb-14 grid grid-cols-1 gap-px rounded-2xl border border-border bg-border sm:grid-cols-3 overflow-hidden">
            <div className="bg-background px-8 py-6 text-center">
              <p className="text-3xl font-bold text-foreground">67%</p>
              <p className="mt-1 text-sm text-muted-foreground">of first products fail</p>
            </div>
            <div className="bg-background px-8 py-6 text-center">
              <p className="text-3xl font-bold text-foreground">$4,200</p>
              <p className="mt-1 text-sm text-muted-foreground">average loss per failed launch</p>
            </div>
            <div className="bg-background px-8 py-6 text-center">
              <p className="text-3xl font-bold text-foreground">#1 cause</p>
              <p className="mt-1 text-sm text-muted-foreground">wrong product, not wrong execution</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16a34a]/10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#16a34a]">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#16a34a]">Why trust us</p>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Built by someone who lost money the hard way
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            SellerMentor was not built in a lab by consultants who read about e-commerce. It was built by someone who shipped inventory, absorbed the financial hit of a failed launch, and spent years reverse-engineering exactly why products fail — so you don{"'"}t have to pay for that education yourself.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16a34a]/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#16a34a]">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-foreground">Catches the traps basic tools miss</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Hidden PPC inflation, review moats, seasonal revenue cliffs, and margin compression from return rates — these are the real killers. Every risk signal in SellerMentor exists because it took down a real seller{"'"}s launch.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16a34a]/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#16a34a]">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-foreground">Unit economics first, always</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We don{"'"}t lead with trends or demand volume. Every analysis starts with the unit P&L — because a product that can{"'"}t make money at 500 units/month will never make money at 5,000. Numbers before narrative, every time.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16a34a]/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#16a34a]">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-foreground">Optimized for businesses that last</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We flag products with durable competitive advantages — not launches that spike at month two and collapse when a Chinese competitor undercuts your price. A GO verdict means sustainable, not just profitable on paper.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16a34a]/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#16a34a]">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-foreground">Every NO-GO is money protected</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A NO-GO verdict is not a failure. It is the system working exactly as designed. Every risk signal, every trigger, every model parameter exists because a real seller spent real money on a product that looked fine in a spreadsheet.
              </p>
            </div>
          </div>

          <div className="mt-12 rounded-2xl border border-[#16a34a]/20 bg-[#16a34a]/5 p-8 text-center">
            <p className="text-lg font-semibold text-foreground leading-relaxed">
              The $500/hour consultant would tell you the same thing. We just made it accessible for $0 to start.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              5 free analyses. No credit card. The first GO / NO-GO verdict pays for itself.
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
    answer: "We combine real-time Amazon data with an economics-first model that evaluates profitability, competitive density, PPC pressure, review moat depth, and category-specific risk factors. The verdict is the bottom-line recommendation a senior consultant would give you — with the full reasoning behind it, not just a score.",
  },
  {
    question: "Is this just another product research tool?",
    answer: "No. Most research tools show you data. SellerMentor interprets the data and gives you a direct recommendation — with the reasoning behind it. Think of it as the difference between a spreadsheet and a consultant memo. Data is not a decision. We make the decision.",
  },
  {
    question: "What marketplaces do you support?",
    answer: "We currently support Amazon US (.com). Support for Amazon UK, DE, and other European marketplaces is on the roadmap.",
  },
  {
    question: "How accurate is the profit calculation?",
    answer: "We model FBA fees, referral fees, estimated shipping, PPC costs, return rates, and storage fees. Our margin estimates are within ±6% of actual results based on backtesting against live seller data. We show you the assumptions so you can adjust for your specific sourcing costs.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes. All plans are month-to-month with no long-term commitment. You can cancel from your account settings and retain access until the end of your billing period.",
  },
  {
    question: "How is this different from just using a spreadsheet?",
    answer: "A spreadsheet shows what you put into it. SellerMentor pulls live market data, Keepa BSR history, real competitor review counts, and PPC pressure signals — then interprets it all through an economics model. The difference is the interpretation, not the data.",
  },
  {
    question: "What if the product I want to sell isn't on Amazon yet?",
    answer: "That's actually the hardest case. No competitors means no demand signal. Run an analysis anyway — we model the closest category analogues and tell you what launch capital you'd need to create a new market vs. entering an existing one.",
  },
]

export function FAQSection() {
  return (
    <section className="bg-card">
      <div className="mx-auto max-w-[1200px] px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground text-balance">Frequently asked questions</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            The questions every serious seller asks before their first analysis.
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
            Stop guessing. Start with a verdict.
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            5 free analyses. No credit card. Takes 45 seconds. Most sellers save their launch budget on the first GO / NO-GO.
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
