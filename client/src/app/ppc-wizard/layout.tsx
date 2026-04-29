import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Amazon PPC Campaign Builder — Set Up Your First Ad in 4 Steps",
  description: "Build your first Amazon PPC campaign in 4 steps. Get a complete campaign blueprint with exact match types, bid recommendations, budgets, and a 30-day action plan — free.",
  keywords: [
    "Amazon PPC campaign setup",
    "Amazon PPC wizard",
    "Amazon ads campaign builder",
    "Amazon PPC for beginners",
    "Amazon sponsored products setup",
    "FBA PPC strategy",
    "Amazon advertising guide",
  ],
  alternates: { canonical: "/ppc-wizard" },
  openGraph: {
    title: "Amazon PPC Campaign Builder — Set Up Your First Ad in 4 Steps",
    description: "Get a complete Amazon PPC blueprint with match types, bids, budgets, and a 30-day action plan. Free, no signup needed.",
    url: "/ppc-wizard",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
