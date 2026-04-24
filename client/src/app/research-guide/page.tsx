import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Amazon FBA Product Research Checklist — 9-Step Framework",
  description:
    "The exact 9-step product research framework professional Amazon FBA advisors use. Niche selection, market size, sourcing, review intelligence, and GO / NO-GO validation.",
  keywords: [
    "Amazon FBA product research",
    "product research checklist",
    "Amazon FBA checklist",
    "how to find products to sell on Amazon",
    "FBA product validation",
  ],
  alternates: { canonical: "/research-guide" },
  openGraph: {
    title: "Amazon FBA Product Research Checklist — 9-Step Framework",
    description:
      "The exact framework professional advisors use. 9 steps from niche to GO / NO-GO.",
    url: "/research-guide",
  },
}

// ─── Step data ───────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: 1,
    id: "step-1",
    title: "Niche & Category Selection",
    icon: (
      <svg width="20" height="20" fill="none" stroke="#FF9900" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    description:
      "Before opening Amazon, identify a category that is broad enough to have real demand but specific enough that you can compete without a huge budget. Most beginners pick niches that are either too general (phone cases) or too tiny (left-handed scissors for toddlers).",
    lookFor: [
      "Multiple sub-niches within the category (signals depth of demand)",
      "Prices between $20–$70 (enough margin, not too expensive to produce)",
      "Products that can be differentiated — color, material, bundle, size",
      "No single brand owning more than 40% of search results",
    ],
    redFlags: [
      "Category requires approval from Amazon (supplements, beauty, grocery)",
      "Only one or two search keywords exist for the entire niche",
      "Seasonal demand only (e.g. Christmas ornaments, Halloween costumes)",
      "Products that are easily patented or trademarked",
    ],
  },
  {
    num: 2,
    id: "step-2",
    title: "Amazon Search Results Analysis",
    icon: (
      <svg width="20" height="20" fill="none" stroke="#FF9900" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h10M4 18h10" />
      </svg>
    ),
    description:
      "Open Amazon and search your main keyword. The first page tells you almost everything about the competitive landscape — who's winning, at what price, with how many reviews, and whether Amazon itself is selling.",
    lookFor: [
      "At least 8–10 different sellers on page 1 (not one brand dominating)",
      "Most results are FBA sellers, not Amazon's own listing",
      "Price spread of at least $10–$15 between cheapest and most expensive (room to position)",
      "Some listings with under 500 reviews ranking on page 1 (weak competition)",
    ],
    redFlags: [
      "Amazon itself has a listing — you will almost never beat it on the Buy Box",
      "Top 3 results all have 10,000+ reviews — the review barrier is too high for a new seller",
      "All top results are from one brand with consistent branding — brand loyalty is entrenched",
      "Sponsored ads take up most of page 1 — organic ranking will be expensive to achieve",
    ],
  },
  {
    num: 3,
    id: "step-3",
    title: "Market Size & Sales Volume",
    icon: (
      <svg width="20" height="20" fill="none" stroke="#FF9900" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    description:
      "You need to estimate how many units the top sellers are moving each month. A healthy market means page-1 sellers each make meaningful sales — not just the #1 listing doing all the volume while everyone else struggles.",
    lookFor: [
      "The top 5–10 listings each sell at least 150–300 units/month",
      "Combined monthly revenue on page 1 exceeds $50,000",
      "Sales are spread across multiple sellers (no single listing dominating)",
      "BSR (Best Seller Rank) below 50,000 in the main category",
    ],
    redFlags: [
      "The #1 listing does 90% of sales — the market doesn't distribute",
      "Average BSR above 100,000 (low search demand, low sales)",
      "Most competitors are frequently out of stock — supply problems signal low margin",
      "Revenue is concentrated in a single price point with no room to differentiate",
    ],
  },
  {
    num: 4,
    id: "step-4",
    title: "Keyword Demand",
    icon: (
      <svg width="20" height="20" fill="none" stroke="#FF9900" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 6h6M13 12h6M13 18h6M5 18h.01" />
      </svg>
    ),
    description:
      "Your product only sells if people are searching for it. Use Amazon's own search bar autocomplete, Google Keyword Planner (free), or Google Trends to estimate how many people per month are searching for your main keyword and its variations.",
    lookFor: [
      "Main keyword has at least 5,000–10,000 monthly searches",
      "5+ related keywords you could realistically rank for",
      "Search trend is stable or growing (Google Trends)",
      "Multiple ways to describe the product (synonym keywords = broader reach)",
    ],
    redFlags: [
      "Fewer than 2,000 monthly searches on the main keyword — the market is too small",
      "All search volume is concentrated on one exact phrase with no variations",
      "Google Trends shows a sharp decline over the past 2 years",
      "The keyword is highly seasonal with only 2–3 strong months per year",
    ],
  },
  {
    num: 5,
    id: "step-5",
    title: "Launch Quantity Estimate",
    icon: (
      <svg width="20" height="20" fill="none" stroke="#FF9900" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    description:
      "How many units do you need for your first order? Order too few and you go out of stock before you build rank. Order too many and your capital is locked in slow-moving inventory. A simple formula: (average daily sales of page-1 competitors) × 60 days × 0.3 (your realistic share during launch).",
    lookFor: [
      "First order between 200–500 units is manageable for most new sellers",
      "Lead time from supplier + shipping leaves 3–4 weeks of buffer stock",
      "Your launch budget covers the inventory AND 60–90 days of advertising",
    ],
    redFlags: [
      "Page-1 leaders sell 1,000+ units/day — you'd need $200K+ to compete meaningfully",
      "Minimum order quantity (MOQ) from suppliers is higher than your safe launch quantity",
      "Storage fees for slow-moving inventory could wipe your margins if launch doesn't go as planned",
    ],
  },
  {
    num: 6,
    id: "step-6",
    title: "Alibaba Sourcing Check",
    icon: (
      <svg width="20" height="20" fill="none" stroke="#FF9900" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l3-1m6 1H7m6 0l3-1m-3 1v-1m3 1l3-8.5H17" />
      </svg>
    ),
    description:
      "Search your product on Alibaba and request quotes from at least 3–5 suppliers. The unit cost you get here determines whether this product can ever be profitable. Don't fall in love with a product idea that has no margin.",
    lookFor: [
      "Unit cost is 15–25% of your target selling price (leaves room for fees, ads, profit)",
      "At least 3 suppliers can produce the product (competition among suppliers = better negotiation)",
      "Sample cost is reasonable ($30–$100) — the supplier is serious",
      "Supplier communicates clearly and responds within 24–48 hours",
    ],
    redFlags: [
      "Unit cost exceeds 35–40% of selling price — profit margin will be crushed by FBA fees",
      "Every supplier is showing the identical product with no option for customization",
      "MOQ is 1,000+ units for a first order — too much capital risk before validating the market",
      "Supplier won't provide a sample or rushes you to order without seeing the product",
    ],
  },
  {
    num: 7,
    id: "step-7",
    title: "FBA Fee & Profitability Calculation",
    icon: (
      <svg width="20" height="20" fill="none" stroke="#FF9900" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    description:
      "Use Amazon's free FBA Revenue Calculator to see exactly how much Amazon takes from every sale. FBA fees depend on size and weight — a product that looks profitable at $30 can become a loser once you factor in fees, referral commission, advertising, and returns.",
    lookFor: [
      "Net margin after FBA fee, referral fee (15%), and COGS above 25–30%",
      "FBA fee below 25% of selling price",
      "Return rate is low in the category (fragile or personal-fit items = high returns)",
      "Advertising budget of 15–25% of revenue still leaves a profitable unit",
    ],
    redFlags: [
      "Product is oversize — FBA fees jump dramatically and often make the product unviable",
      "Net margin below 20% after all costs — one bad PPC month wipes profitability",
      "Referral fee category is 15%+ (jewelry 20%, clothing 17%) — check your category",
      "The product requires hazmat approval (batteries, liquids) — extra storage fees and restrictions",
    ],
  },
  {
    num: 8,
    id: "step-8",
    title: "Competitor Review Intelligence",
    icon: (
      <svg width="20" height="20" fill="none" stroke="#FF9900" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    description:
      "Read the 1-star and 5-star reviews of your top 3 competitors. This is the single highest-value research you can do. 1-star reviews tell you exactly what the market is waiting for someone to fix. 5-star reviews tell you what buyers love and what you must preserve in your version.",
    lookFor: [
      "1-star complaints are about fixable issues — packaging, smell, durability, size — not the core product concept",
      "A clear, recurring theme in complaints (e.g. \"falls apart after 2 weeks\") — this is your differentiation brief",
      "5-star reviews mention specific features buyers love (your baseline to meet or exceed)",
      "Competitors with 3.5–4.2 average ratings — room to win on quality",
    ],
    redFlags: [
      "1-star reviews complain about the fundamental product concept — the market doesn't want this",
      "Top competitors all have 4.7–4.9 stars — they've solved the product, you can't differentiate on quality",
      "Average review count above 5,000 across top listings — the review barrier is too high for a new seller",
      "Complaints are about things you can't fix (Amazon's return policy, shipping speed, price expectations)",
    ],
  },
  {
    num: 9,
    id: "step-9",
    title: "Final GO / NO-GO Validation",
    icon: (
      <svg width="20" height="20" fill="none" stroke="#FF9900" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    description:
      "If you've reached step 9 and everything checks out, it's time to run the final economic validation before committing capital. This means checking all the numbers together — not just individually — because a product can pass every single step but still fail when you model the full launch economics.",
    lookFor: [
      "Profit after FBA fees, ads (15–25% ACoS), referral, COGS, shipping: at least $5–$8/unit",
      "Launch capital you need is within your budget (inventory + 90 days of PPC + unexpected costs)",
      "Your differentiation angle clearly addresses the #1 complaint from step 8",
      "You have a plan for reviews — Vine, insert cards, follow-up sequences",
    ],
    redFlags: [
      "Any of steps 1–8 raised a hard stop you haven't resolved",
      "Your profit only works at optimistic ACoS — real ACoS during launch is always higher",
      "You're emotionally attached to the product and rationalizing the red flags",
      "You haven't modeled the out-of-stock scenario (going out of stock = losing all rank overnight)",
    ],
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResearchGuidePage() {
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
              <span className="inline-flex items-center gap-2 mb-5 rounded-full border border-[#fde68a] bg-[#fff8eb] px-4 py-1.5 text-xs font-semibold text-[#b45309]">
                <svg width="10" height="10" fill="#FF9900" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Professional framework · No tools required
              </span>
              <h1
                className="text-4xl font-black text-foreground md:text-5xl leading-[1.1]"
                style={{ letterSpacing: "-0.04em" }}
              >
                The Amazon FBA Product Research Checklist
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground leading-relaxed">
                A 9-step framework used by professional sourcing advisors. Follow it before you invest a dollar.
              </p>
            </div>
          </div>
        </section>

        {/* ── Article ── */}
        <div
          className="flex-1"
          style={{
            backgroundColor: "#F8F9FB",
            backgroundImage: "radial-gradient(circle, #e2e8f0 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        >
          <div className="mx-auto max-w-[780px] px-5 py-10 pb-20">
            <div
              className="bg-white border border-border rounded-2xl"
              style={{ padding: "48px 52px", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)" }}
            >

              {/* ── Intro ── */}
              <p className="text-base text-muted-foreground leading-[1.75] mb-8">
                Most Amazon sellers fail not because they can't sell — they fail because they chose the wrong product.
                This checklist walks you through the exact nine validation gates professionals run before committing
                capital to any new product. No third-party subscriptions required. Just a browser, a spreadsheet,
                and this framework.
              </p>

              {/* ── Table of contents ── */}
              <div className="mb-10 rounded-xl border border-border bg-[#FAFAFA] px-6 py-5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em] mb-3">
                  In this guide
                </p>
                <ol className="space-y-2 m-0 pl-0 list-none">
                  {STEPS.map((step) => (
                    <li key={step.id} className="flex items-baseline gap-2.5">
                      <span
                        className="flex-shrink-0 text-[0.68rem] font-bold text-[#b45309] bg-[#fff8eb] border border-[#fde68a] rounded-full w-5 h-5 flex items-center justify-center"
                        style={{ lineHeight: 1 }}
                      >
                        {step.num}
                      </span>
                      <a
                        href={`#${step.id}`}
                        className="text-sm text-foreground hover:text-[#FF9900] transition-colors no-underline font-medium leading-snug"
                      >
                        {step.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>

              {/* ── Steps ── */}
              <div className="space-y-0">
                {STEPS.map((step, idx) => (
                  <div key={step.id}>
                    {/* Step block */}
                    <div id={step.id} className="scroll-mt-6">

                      {/* Step header */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-flex items-center gap-1.5 bg-[#fff8eb] text-[#b45309] border border-[#fde68a] rounded-full px-3 py-1 text-xs font-bold">
                          Step {step.num}
                        </span>
                      </div>

                      {/* Title row */}
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#fff8eb] border border-[#fde68a] flex items-center justify-center">
                          {step.icon}
                        </div>
                        <h2
                          className="text-[1.25rem] font-black text-foreground leading-snug m-0"
                          style={{ letterSpacing: "-0.025em" }}
                        >
                          {step.title}
                        </h2>
                      </div>

                      {/* Description */}
                      <p className="text-base text-muted-foreground leading-[1.75] mb-5">
                        {step.description}
                      </p>

                      {/* What to look for */}
                      <div className="mb-4">
                        <p className="text-xs font-bold text-foreground uppercase tracking-[0.08em] mb-2.5">
                          What to look for
                        </p>
                        <ul className="space-y-2 m-0 pl-0 list-none">
                          {step.lookFor.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-[1.65]">
                              <span className="flex-shrink-0 mt-0.5">✅</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Red flags */}
                      <div className="mb-1">
                        <p className="text-xs font-bold text-foreground uppercase tracking-[0.08em] mb-2.5">
                          Red flags
                        </p>
                        <ul className="space-y-2 m-0 pl-0 list-none">
                          {step.redFlags.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-[1.65]">
                              <span className="flex-shrink-0 mt-0.5">🚫</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Divider between steps (not after last) */}
                    {idx < STEPS.length - 1 && (
                      <div className="my-8 border-t border-dashed border-border" />
                    )}
                  </div>
                ))}
              </div>

              {/* ── Bottom CTA ── */}
              <div
                className="mt-10 rounded-2xl p-8 flex flex-wrap items-center justify-between gap-5"
                style={{
                  background: "linear-gradient(135deg,#fff8eb 0%,#fff 55%,#eff6ff 100%)",
                  border: "1px solid #E2E8F0",
                }}
              >
                <div>
                  <h3
                    className="text-[1.1rem] font-black text-foreground mb-1.5"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    Run the full economic validation in 60 seconds
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed m-0">
                    SellerMentor checks all 5 profit gates — FBA fee, PPC pressure, review barrier,
                    differentiation, and market fluidity — and gives you a GO&nbsp;/ NO-GO verdict
                    with the exact numbers.
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

            </div>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  )
}
