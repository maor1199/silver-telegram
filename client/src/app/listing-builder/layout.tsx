import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Amazon Listing Builder — AI-Optimized Title, Bullets & Description",
  description: "Generate keyword-rich Amazon product listings with AI. Get an A9-optimized title, 5 conversion-focused bullet points, and a product description — ready to paste into Seller Central.",
  keywords: [
    "Amazon listing builder",
    "Amazon listing optimization",
    "Amazon product title generator",
    "Amazon bullet points generator",
    "A9 optimization",
    "Amazon listing copywriter",
    "Amazon SEO tool",
  ],
  alternates: { canonical: "/listing-builder" },
  openGraph: {
    title: "Amazon Listing Builder — AI-Optimized Title, Bullets & Description",
    description: "Generate A9-optimized Amazon titles, bullet points, and descriptions in seconds. Paste directly into Seller Central.",
    url: "/listing-builder",
  },
}

export default function ListingBuilderLayout({ children }: { children: React.ReactNode }) {
  return children
}
