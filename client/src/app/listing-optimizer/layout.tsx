import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Amazon Listing Optimizer — Score & Improve Your Listing with AI",
  description: "Paste your Amazon listing and target keywords to get an SEO score and specific AI improvement suggestions for title, bullet points, and description. Rank higher on Amazon A9.",
  keywords: [
    "Amazon listing optimizer",
    "Amazon listing score",
    "Amazon SEO checker",
    "Amazon listing audit",
    "Amazon title optimizer",
    "Amazon bullet point optimizer",
    "A9 listing optimization",
  ],
  alternates: { canonical: "/listing-optimizer" },
  openGraph: {
    title: "Amazon Listing Optimizer — Score & Improve Your Listing with AI",
    description: "Get an SEO score and AI-powered suggestions to improve your Amazon title, bullets, and description. Rank higher on A9.",
    url: "/listing-optimizer",
  },
}

export default function ListingOptimizerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
