import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Amazon FBA Product Validator — GO / NO-GO Analysis in 45 Seconds",
  description: "Enter your product, price, and cost. Get a data-driven GO / NO-GO verdict with real profit math, PPC cost estimate, competition score, and Keepa market intelligence — free, no card required.",
  keywords: [
    "Amazon product validator",
    "FBA product analysis",
    "Amazon GO NO-GO",
    "FBA profit calculator",
    "Amazon product research tool",
    "FBA viability test",
    "Amazon product checker",
  ],
  alternates: { canonical: "/analyze" },
  openGraph: {
    title: "Amazon FBA Product Validator — GO / NO-GO in 45 Seconds",
    description: "Real profit math, PPC estimate, competition score, and Keepa market data. Free. No credit card. Built for Amazon FBA sellers.",
    url: "/analyze",
  },
}

export default function AnalyzeLayout({ children }: { children: React.ReactNode }) {
  return children
}
