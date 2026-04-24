import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Analyze Your Product",
  description: "Run a full GO / NO-GO analysis on any Amazon FBA product. Get profitability, PPC cost, competition score, review barrier, and Keepa market intelligence in under 60 seconds.",
  alternates: { canonical: "/analyze" },
  openGraph: {
    title: "Analyze Your Amazon Product — SellerMentor",
    description: "GO / NO-GO verdict with real economics, PPC pressure, review barrier, and Keepa market data. Built for new Amazon FBA sellers.",
    url: "/analyze",
  },
}

export default function AnalyzeLayout({ children }: { children: React.ReactNode }) {
  return children
}
