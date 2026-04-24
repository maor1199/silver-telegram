import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Listing Studio",
  description: "Create professional Amazon product images, lifestyle photos, and A+ content with AI. Stand out on the search results page and convert more buyers.",
  keywords: ["Amazon product images", "lifestyle photos", "A+ content", "Amazon listing images", "product photography AI"],
  alternates: { canonical: "/studio" },
  openGraph: {
    title: "Listing Studio — Amazon Product Images with AI — SellerMentor",
    description: "AI-generated product images, lifestyle photos, and A+ content for your Amazon listing. No photoshoot needed.",
    url: "/studio",
  },
}

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children
}
