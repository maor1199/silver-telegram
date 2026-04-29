import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  HeroSection,
  SuccessFactorsSection,
  HowWereDifferentSection,
  WhyTrustSection,
  FAQSection,
  CTASection,
} from "@/components/home-sections"

const BASE_URL = "https://www.sellermentor.ai"

export const metadata: Metadata = {
  title: "SellerMentor — Amazon FBA Product Research & GO/NO-GO Validator",
  description: "Know if your Amazon FBA product will succeed before you invest. Get a data-driven GO / NO-GO verdict with real profitability math, competition signals, PPC pressure and risk analysis — free for new sellers.",
  keywords: [
    "Amazon FBA product research tool",
    "Amazon product validator",
    "FBA product analysis",
    "Amazon GO NO-GO verdict",
    "FBA profit calculator",
    "Amazon seller tool 2026",
    "product research Amazon",
    "FBA competition analysis",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "SellerMentor — Amazon FBA Product Research & GO/NO-GO Validator",
    description: "Know if your Amazon product will succeed before you invest. GO / NO-GO verdict with real economics, competition signals & PPC analysis.",
    url: BASE_URL,
    type: "website",
    siteName: "SellerMentor",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "SellerMentor — Amazon Product Analysis" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SellerMentor — Amazon FBA Product Research & GO/NO-GO Validator",
    description: "Know if your Amazon product will succeed before you invest. Free GO / NO-GO verdict in 45 seconds.",
    images: ["/opengraph-image"],
  },
}

// ── JSON-LD Structured Data ────────────────────────────────────────────────
function SoftwareApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "SellerMentor",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "url": BASE_URL,
    "description": "AI-powered Amazon FBA product research tool. Get a GO / NO-GO verdict with profitability math, competition signals, PPC analysis and Keepa market intelligence — free to start.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "5 free analyses. Upgrade for unlimited.",
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "127",
    },
    "featureList": [
      "GO / NO-GO product verdict",
      "Real-time Amazon market data",
      "Keepa 12-month BSR & price history",
      "FBA profit calculator",
      "PPC launch cost estimation",
      "Competition & review analysis",
      "Month-by-month P&L projection",
    ],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "SellerMentor",
    "url": BASE_URL,
    "logo": `${BASE_URL}/icon.png`,
    "description": "SellerMentor helps Amazon FBA sellers validate product ideas with real market data before investing.",
    "sameAs": [],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

function WebSiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "SellerMentor",
    "url": BASE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${BASE_URL}/analyze?keyword={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

function HomeFaqSchema() {
  const faqs = [
    {
      q: "Is SellerMentor free to use?",
      a: "Yes — you get 5 free product analyses with no credit card required. Each analysis includes a full GO / NO-GO verdict, profit math, competition score, and an AI advisor memo.",
    },
    {
      q: "How accurate is the GO / NO-GO verdict?",
      a: "The verdict is built from real Amazon SERP data (up to 30 first-page listings), 12-month Keepa BSR and price history, and a 7-layer scoring engine that checks economic viability, market fluidity, PPC saturation, and differentiation strength.",
    },
    {
      q: "What data sources does SellerMentor use?",
      a: "SellerMentor pulls live Amazon search results via Rainforest API, 12-month historical market data from Keepa, keyword search volume and CPC from DataForSEO, and generates AI analysis using GPT-4o.",
    },
    {
      q: "Who is SellerMentor built for?",
      a: "New and intermediate Amazon FBA sellers who want to validate a product idea before investing $5,000–$15,000 in inventory. No spreadsheets or guesswork needed.",
    },
  ]
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(({ q, a }) => ({
      "@type": "Question",
      "name": q,
      "acceptedAnswer": { "@type": "Answer", "text": a },
    })),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default function HomePage() {
  return (
    <>
      <SoftwareApplicationSchema />
      <OrganizationSchema />
      <WebSiteSchema />
      <HomeFaqSchema />
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <HeroSection />
          <SuccessFactorsSection />
          <HowWereDifferentSection />
          <WhyTrustSection />
          <FAQSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  )
}
