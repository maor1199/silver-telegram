import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ArrowRight } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="border-b border-border/50">
          <div className="mx-auto max-w-[1200px] px-6 py-20">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">
              Our story
            </p>
            <h1 className="text-4xl font-bold text-foreground leading-tight text-balance md:text-5xl max-w-[640px]">
              Built by a seller who learned the hard way.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-[520px]">
              The honest story behind SellerMentor — and why operational awareness matters more than any product research tool.
            </p>
          </div>
        </section>

        {/* ── Story ─────────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[700px] px-6 py-16">
          <div className="flex flex-col gap-7 text-muted-foreground leading-relaxed">

            <p className="text-lg">
              In 2019, I launched my first Amazon product — a premium kitchen gadget I was convinced
              would sell. I spent $12,000 on inventory, $3,000 on photography, and another $2,500 on
              PPC in the first month.
            </p>

            <p className="text-lg">
              Six months later, I had $4,200 in unsold inventory sitting in FBA and a hard lesson
              learned. For a long time I thought I just chose the wrong product.
            </p>

            <p className="text-lg">
              That was wrong. The product wasn&apos;t the problem. <strong className="text-foreground font-semibold">Operational blindness was.</strong>
            </p>

            <div className="rounded-2xl border border-border bg-card p-7">
              <p className="text-base font-medium text-foreground leading-relaxed italic">
                &quot;For months, my inventory was approaching stockout. My ACoS was drifting. My margin
                was compressing under fees I hadn&apos;t properly modelled. The signals were there — buried
                in Seller Central reports I didn&apos;t know to look at.&quot;
              </p>
            </div>

            <p className="text-lg">
              I rebuilt. Three years of failed SKUs, successful launches, and a close education in
              what actually determines whether an ecommerce business survives.
            </p>

            <p className="text-lg">
              The sellers who last aren&apos;t the ones with the best products. They&apos;re the ones who
              notice problems early — while there&apos;s still time to act. A stockout caught three weeks
              before it happens is manageable. Noticed the day you go out of stock, it costs you
              rank, revenue, and recovery time.
            </p>

            <p className="text-lg">
              SellerMentor exists because of that lesson. It monitors your active portfolio —
              inventory pressure, margin erosion, ad efficiency, return rate patterns — and surfaces
              what&apos;s quietly deteriorating before it becomes expensive.
            </p>

            <div className="rounded-2xl border border-border bg-card p-7">
              <p className="text-base text-foreground leading-relaxed">
                We help ecommerce operators notice business problems before they become expensive.
                Not after the month closes. Not after revenue drops. Early — while something can
                still be done about it.
              </p>
            </div>

            <p className="text-lg font-medium text-foreground">
              That&apos;s the whole point.
            </p>

            <div className="border-t border-border pt-6">
              <p className="text-sm text-muted-foreground">— The team at SellerMentor</p>
            </div>
          </div>
        </section>

        {/* ── What we believe ───────────────────────────────────────────────── */}
        <section className="border-t border-border bg-secondary/30">
          <div className="mx-auto max-w-[1200px] px-6 py-20">
            <h2 className="text-2xl font-bold text-foreground mb-10">What we believe</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  title: "Early warning over post-mortem",
                  body: "Issues surface while there's still time to act — not after the month closes, not after revenue drops. The value of monitoring is timing.",
                },
                {
                  title: "Consequences, not risk scores",
                  body: "Every alert carries what happens if nothing changes. Concrete estimates — lost revenue, margin drain, storage cost — not abstract indicators.",
                },
                {
                  title: "Signal, not noise",
                  body: "Not every metric movement is operationally meaningful. The system filters for what matters and ranks by severity. You shouldn't have to decide what to look at first.",
                },
              ].map(v => (
                <div key={v.title} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="text-base font-semibold text-foreground mb-3">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────────── */}
        <section className="border-t border-border bg-card">
          <div className="mx-auto max-w-[1200px] px-6 py-20">
            <div className="max-w-[640px]">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Methodology</p>
              <h2 className="text-2xl font-bold text-foreground mb-4">How the system works</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-10">
                SellerMentor watches your SKUs continuously and surfaces issues that cross operational
                thresholds — not every fluctuation, only what matters.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 max-w-[860px]">
              {[
                {
                  label: "Inventory velocity monitoring",
                  desc: "Tracks days-until-stockout against supplier lead time. Surfaces reorder signals before the window closes.",
                },
                {
                  label: "Margin trend analysis",
                  desc: "Measures true profitability per SKU after all costs — fees, PPC, returns, storage. Detects compression early.",
                },
                {
                  label: "Ad efficiency tracking",
                  desc: "Monitors ACoS, TACoS, and ad spend trends. Flags when ad efficiency is pushing a SKU toward net negative.",
                },
                {
                  label: "Return rate patterns",
                  desc: "Detects return rate drift and compares against category norms. Flags listing-level signals before suppression risk.",
                },
                {
                  label: "Confidence filtering",
                  desc: "Not every signal is surfaced. Issues must cross a confidence threshold before appearing in your feed — reducing false positives.",
                },
                {
                  label: "Consequence projection",
                  desc: "Every surfaced issue carries a forward-looking estimate: what happens financially if nothing changes in 30, 60, or 90 days.",
                },
              ].map(item => (
                <div key={item.label} className="rounded-xl border border-border bg-background p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">{item.label}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── System transparency ───────────────────────────────────────────── */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-[1200px] px-6 py-20">
            <div className="max-w-[640px]">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Transparency</p>
              <h2 className="text-2xl font-bold text-foreground mb-4">How we use AI</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-8">
                The risk engine uses deterministic rules grounded in operational data — inventory math,
                margin calculations, lead time logic. The AI Advisor layer uses language models to help
                operators interpret signals and reason through decisions.
              </p>
            </div>

            <div className="flex flex-col gap-4 max-w-[640px]">
              {[
                {
                  title: "Probabilistic, not deterministic",
                  text: "Impact projections are estimates based on current trajectory, not guarantees. Every consequence estimate includes a confidence range.",
                },
                {
                  title: "Uncertainty is shown, not hidden",
                  text: "When data is incomplete or signals are ambiguous, the system says so. Low-confidence issues are filtered out rather than surfaced with false precision.",
                },
                {
                  title: "Human judgment is always final",
                  text: "The system surfaces, ranks, and projects — but decisions belong to you. We're an early warning system, not an autopilot.",
                },
              ].map(item => (
                <div key={item.title} className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────────── */}
        <section className="border-t border-border bg-secondary/30">
          <div className="mx-auto max-w-[1200px] px-6 py-16 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3 text-balance">
              See what&apos;s quietly deteriorating in your business.
            </h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-[420px] mx-auto leading-relaxed">
              Open the Command Center with demo data. Or import your SKU export — the risk engine runs in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Open Command Center
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/data"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
              >
                Import my data
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
