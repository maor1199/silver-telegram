import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  HeroSection,
  SuccessFactorsSection,
  WhyTrustSection,
  FAQSection,
  CTASection,
} from "@/components/home-sections"

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
