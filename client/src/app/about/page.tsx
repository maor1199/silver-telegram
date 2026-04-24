import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "About",
  description: "SellerMentor is an AI-powered Amazon product analysis tool built to give new FBA sellers the same intelligence as a professional sourcing advisor — before they invest a dollar.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About SellerMentor",
    description: "AI-powered Amazon product analysis built for new FBA sellers. Real economics, competition signals, and expert verdicts.",
    url: "/about",
  },
}

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Header */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#fef3c7]/60 via-background to-[#dbeafe]/30" />
          <div className="relative mx-auto max-w-[1200px] px-6 py-20 text-center">
            <h1 className="text-4xl font-bold text-foreground text-balance md:text-5xl">
              Built by a seller who lost money first
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground leading-relaxed">
              The honest story behind SellerMentor.
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="mx-auto max-w-[700px] px-6 py-16">
          <div className="prose prose-lg">
            <div className="flex flex-col gap-8 text-muted-foreground leading-relaxed">
              <p className="text-lg">
                In 2019, I launched my first Amazon product — a premium kitchen gadget I was
                convinced would sell. I spent $12,000 on inventory, $3,000 on photography and
                listing optimization, and another $2,500 on PPC in the first month.
              </p>

              <p className="text-lg">
                Six months later, I had $4,200 in unsold inventory sitting in FBA, a negative ROI,
                and a hard lesson learned. The product wasn{"'"}t bad — the economics were. I entered a
                category with brutal PPC costs, entrenched competitors with thousands of reviews, and
                margins that couldn{"'"}t survive the ad spend required to rank.
              </p>

              <div className="rounded-2xl border border-border bg-card p-8">
                <p className="text-base font-semibold text-card-foreground italic">
                  {"\""}The problem wasn{"'"}t my product. It was that nobody told me the truth about the
                  numbers before I invested.{"\""}
                </p>
              </div>

              <p className="text-lg">
                I didn{"'"}t quit. I spent the next three years studying Amazon economics obsessively —
                analyzing hundreds of products, building spreadsheets, learning PPC inside out, and
                talking to every successful seller I could find.
              </p>

              <p className="text-lg">
                I found a pattern. The sellers who consistently won weren{"'"}t the ones with the best
                products. They were the ones who validated the economics first. They knew their
                break-even ACoS before they placed their first order. They understood competitive
                moats. They could spot a money pit from the listing data alone.
              </p>

              <p className="text-lg">
                I built SellerMentor to be the advisor I wish I{"'"}d had before that first $12,000
                mistake. It{"'"}s not a keyword tool. It{"'"}s not a product research tool. It{"'"}s an economics-first
                decision engine that gives you an expert GO or NO-GO verdict before you commit capital.
              </p>

              <p className="text-lg">
                Every analysis reads like a consultant memo — because that{"'"}s exactly what it is. The
                kind of advice that used to cost $500/hour, now available for every product idea you
                have.
              </p>

              <div className="rounded-2xl border border-border bg-card p-8">
                <p className="text-base text-card-foreground">
                  Today, SellerMentor has helped thousands of sellers make better decisions. Some of
                  the best outcomes weren{"'"}t GO verdicts — they were NO-GOs that saved sellers from
                  expensive mistakes.
                </p>
              </div>

              <p className="text-lg">
                I{"'"}m not here to hype you up or sell you dreams. I{"'"}m here to tell you the truth about
                your product idea — even when the truth is uncomfortable.
              </p>

              <p className="text-lg font-medium text-foreground">
                That{"'"}s the whole point.
              </p>

              <div className="mt-4 border-t border-border pt-8">
                <p className="text-sm text-muted-foreground">
                  — The team at SellerMentor
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="border-t border-border bg-secondary/30">
          <div className="mx-auto max-w-[1200px] px-6 py-20">
            <h2 className="text-center text-2xl font-bold text-foreground mb-12">What we believe</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="text-base font-semibold text-card-foreground">Honesty over hype</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  We{"'"}d rather give you an uncomfortable NO-GO than a false sense of confidence. Your
                  money deserves the truth.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="text-base font-semibold text-card-foreground">Economics first</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Trends fade. Demand fluctuates. But unit economics don{"'"}t lie. Every decision should
                  start with the numbers.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="text-base font-semibold text-card-foreground">Decisions, not data</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  You don{"'"}t need more data. You need a clear answer. GO or NO-GO. That{"'"}s what we
                  deliver.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How the Advisor Works */}
        <section className="bg-card">
          <div className="mx-auto max-w-[1200px] px-6 py-24">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF9900]/10">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#FF9900]">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#FF9900]">Methodology</p>
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                How the Advisor Works
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                SellerMentor combines multiple analytical dimensions into a single, unified verdict.
                The system simulates the decision process of an experienced Amazon consultant who has
                evaluated hundreds of product opportunities.
              </p>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                Every analysis synthesizes seven core intelligence layers to determine whether a
                product opportunity is worth your capital:
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Economic Modeling", desc: "Full unit economics including FBA fees, shipping, returns, and true landed cost." },
                  { label: "Competition Analysis", desc: "Listing quality, review velocity, brand saturation, and market concentration." },
                  { label: "PPC Pressure Estimation", desc: "Expected CPC, break-even ACoS, bid inflation trends, and launch budget." },
                  { label: "Risk Signal Detection", desc: "Regulatory barriers, seasonal fragility, return rate patterns, and supply chain risk." },
                  { label: "Differentiation Opportunities", desc: "Bundling potential, listing gaps, review weaknesses, and branding plays." },
                  { label: "Review Intelligence", desc: "Moat depth, sentiment analysis, rating distribution, and entry barriers." },
                  { label: "Market Indicators", desc: "Demand trajectory, category maturity, search volume trends, and seasonality." },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-border bg-background p-5">
                    <h3 className="text-sm font-semibold text-foreground">{item.label}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 rounded-2xl border border-[#FF9900]/20 bg-[#FF9900]/5 p-6">
                <p className="text-base font-medium text-foreground leading-relaxed">
                  The goal is singular: prevent expensive mistakes before inventory is ordered. Every
                  data point, every score, every recommendation exists to answer one question — should
                  you invest, or should you walk away?
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* AI Transparency */}
        <section className="border-y border-border bg-background">
          <div className="mx-auto max-w-[1200px] px-6 py-24">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3b82f6]/10">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#3b82f6]">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#3b82f6]">Responsible AI</p>
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                AI Transparency
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                SellerMentor uses artificial intelligence to analyze patterns across market data,
                competitive landscapes, and economic indicators. The advisor generates insights by
                processing publicly available information and applying decision frameworks trained on
                real Amazon selling outcomes.
              </p>

              <div className="mt-10 flex flex-col gap-5">
                {[
                  {
                    title: "Probabilistic, not deterministic",
                    text: "Every score, estimate, and recommendation is a probabilistic output. The advisor communicates confidence levels alongside verdicts because certainty in market analysis is impossible.",
                  },
                  {
                    title: "Market-dependent results",
                    text: "Outputs depend on current market conditions. A GO verdict today may become a NO-GO tomorrow if competitive dynamics shift. We recommend re-analyzing before major purchasing decisions.",
                  },
                  {
                    title: "Uncertainty is highlighted, not hidden",
                    text: "When the data is ambiguous or the risk is hard to quantify, the advisor says so. We believe that acknowledging uncertainty is more valuable than projecting false confidence.",
                  },
                  {
                    title: "Human judgment remains essential",
                    text: "The AI is designed to support human decision-making — not replace it. The advisor provides analysis and recommendations, but the final decision always belongs to you.",
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border border-border bg-card p-6">
                    <h3 className="text-base font-semibold text-card-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why Trust Our Analysis */}
        <section className="bg-card">
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
      </main>
      <Footer />
    </div>
  )
}
