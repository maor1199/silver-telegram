import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  HeroSection,
  SuccessFactorsSection,
  WhyTrustSection,
  FAQSection,
  CTASection,
} from "@/components/home-sections"

export const metadata: Metadata = {
  title: "SellerMentor — Expert Product Analysis for Amazon Sellers",
  description: "Know if your product will succeed before you invest. Get a GO / NO-GO verdict with profitability, competition, PPC pressure and risk analysis — built for Amazon FBA sellers.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "SellerMentor — Expert Product Analysis for Amazon Sellers",
    description: "GO / NO-GO verdict with real economics, competition signals & PPC analysis for Amazon FBA sellers.",
    url: "/",
  },
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <SuccessFactorsSection />
        <WhyTrustSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
