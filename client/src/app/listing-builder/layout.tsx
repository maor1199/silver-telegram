import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Listing Copywriter",
  description: "AI-powered Amazon listing copywriter. Generate keyword-rich titles, bullet points, and product descriptions optimized for Amazon search and conversion.",
  keywords: ["Amazon listing", "listing optimization", "Amazon SEO", "product title", "bullet points", "Amazon copywriting"],
  alternates: { canonical: "/listing-builder" },
  openGraph: {
    title: "Amazon Listing Copywriter — SellerMentor",
    description: "Generate optimized Amazon titles, bullet points, and descriptions with AI. Boost visibility and conversion from day one.",
    url: "/listing-builder",
  },
}

export default function ListingBuilderLayout({ children }: { children: React.ReactNode }) {
  return children
}
