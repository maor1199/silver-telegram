import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Amazon Review Analyzer — Find Competitor Weaknesses with AI",
  description: "Paste Amazon competitor reviews and get an AI breakdown of customer pain points, sentiment themes, and listing copy angles — turn negative reviews into your competitive advantage.",
  keywords: [
    "Amazon review analyzer",
    "Amazon competitor review analysis",
    "Amazon review intelligence",
    "FBA competitor research",
    "Amazon customer sentiment analysis",
    "Amazon review scraper AI",
    "Amazon listing copy angles",
  ],
  alternates: { canonical: "/review-intelligence" },
  openGraph: {
    title: "Amazon Review Analyzer — Find Competitor Weaknesses with AI",
    description: "Paste competitor reviews and get an AI breakdown of pain points, sentiment themes, and copy angles. Turn bad reviews into your listing's edge.",
    url: "/review-intelligence",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
