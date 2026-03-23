import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"

const CHAPTERS = [
  {
    num: 1, slug: "chapter-1",
    title: "How Amazon FBA Works",
    desc: "Fees, flow, account setup — and what Amazon actually handles for you.",
    icon: <svg width="19" height="19" fill="none" stroke="#FF9900" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  },
  {
    num: 2, slug: "chapter-2",
    title: "Finances & Profit Math",
    desc: "The exact numbers you must know before ordering a single unit.",
    icon: <svg width="19" height="19" fill="none" stroke="#FF9900" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  },
  {
    num: 3, slug: "chapter-3",
    title: "Product Research",
    desc: "How to find the right niche — demand, competition, and margin filters.",
    icon: <svg width="19" height="19" fill="none" stroke="#FF9900" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  },
  {
    num: 4, slug: "chapter-4",
    title: "Suppliers & Sourcing",
    desc: "Manufacturing, MOQ negotiation, QC, and getting inventory to Amazon.",
    icon: <svg width="19" height="19" fill="none" stroke="#FF9900" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  },
  {
    num: 5, slug: "chapter-5",
    title: "Listing Optimization",
    desc: "Writing to convert — title, bullets, images, and A+ content.",
    icon: <svg width="19" height="19" fill="none" stroke="#FF9900" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  },
  {
    num: 6, slug: "chapter-6",
    title: "Brand Building & Protection",
    desc: "Trademarks, Brand Registry, and insurance — before it's too late.",
    icon: <svg width="19" height="19" fill="none" stroke="#FF9900" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  },
  {
    num: 7, slug: "chapter-7",
    title: "Launch Strategy",
    desc: "The first 30 days playbook — reviews, rank, and velocity.",
    icon: <svg width="19" height="19" fill="none" stroke="#FF9900" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  },
  {
    num: 8, slug: "chapter-8",
    title: "PPC Advertising",
    desc: "Buying data and traffic — how to set up, budget, and not lose money.",
    icon: <svg width="19" height="19" fill="none" stroke="#FF9900" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  },
  {
    num: 9, slug: "chapter-9",
    title: "Scaling & Next Steps",
    desc: "Avoid the out-of-stock trap, add SKUs, and build long-term equity.",
    icon: <svg width="19" height="19" fill="none" stroke="#FF9900" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  },
]

export default function GuidePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#fef3c7]/60 via-background to-[#dbeafe]/30" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative mx-auto max-w-[1200px] px-6 pb-20 pt-16 md:pb-24 md:pt-20">
            <div className="mx-auto max-w-2xl text-center">
              <Badge
                variant="outline"
                className="mb-5 rounded-full border-primary/20 bg-primary/5 px-4 py-1.5 text-primary text-sm"
              >
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary" />
                Step-by-step. No experience needed.
              </Badge>
              <h1 className="text-4xl font-black text-foreground md:text-5xl leading-[1.1]" style={{ letterSpacing: "-0.04em" }}>
                Amazon FBA Starter Guide
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground leading-relaxed">
                9 chapters. Everything a new seller needs to launch, grow, and profit on Amazon in 2026 — written clearly, no fluff.
              </p>
              <div className="mt-8">
                <Button
                  size="lg"
                  className="h-12 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                  asChild
                >
                  <Link href="/guide/chapter-1">
                    Start Chapter 1
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Cards ── */}
        <section className="mx-auto max-w-[1200px] px-6 py-12">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em] mb-5">
            Course Chapters
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {CHAPTERS.map((ch) => (
              <Link
                key={ch.num}
                href={`/guide/${ch.slug}`}
                className="group flex gap-3.5 items-start bg-card border border-border rounded-[14px] p-[22px] hover:shadow-[0_8px_30px_rgba(255,153,0,0.13)] hover:-translate-y-0.5 hover:border-yellow-300 transition-all duration-200 no-underline"
              >
                <div className="w-10 h-10 rounded-[10px] bg-[#fff8eb] border border-[#fde68a] flex items-center justify-center flex-shrink-0">
                  {ch.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-[0.08em] block">
                    Chapter {ch.num}
                  </span>
                  <h3 className="text-[0.95rem] font-bold text-foreground mt-1 mb-1.5 leading-snug">
                    {ch.title}
                  </h3>
                  <p className="text-[0.82rem] text-muted-foreground leading-[1.55] m-0">{ch.desc}</p>
                </div>
                <svg className="w-[15px] h-[15px] flex-shrink-0 mt-0.5" style={{ stroke: "#FF9900" }} fill="none" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>

          {/* ── Bottom CTA ── */}
          <div className="mt-12 bg-gradient-to-br from-[#fff8eb] via-white to-[#eff6ff] border border-border rounded-2xl p-8 flex flex-wrap items-center justify-between gap-5">
            <div>
              <h3 className="text-lg font-black text-foreground mb-1.5" style={{ letterSpacing: "-0.02em" }}>
                Ready to validate your product idea?
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                After reading the guide, run a free analysis on SellerMentor to see if your numbers actually work.
              </p>
            </div>
            <Button
              className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/20 whitespace-nowrap"
              asChild
            >
              <Link href="/analyze">
                Analyze My Product Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
