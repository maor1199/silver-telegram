import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HeroSection, PillarsSection, CTASection } from "@/components/home-sections"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <PillarsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
