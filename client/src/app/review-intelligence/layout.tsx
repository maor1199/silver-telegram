import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Review Intelligence — SellerMentor",
  description:
    "Paste competitor reviews and get an AI-powered breakdown of customer pain points, sentiment themes, and listing copy angles to outperform the competition.",
  alternates: { canonical: "/review-intelligence" },
  openGraph: {
    title: "Review Intelligence — SellerMentor",
    description:
      "Paste competitor reviews and get an AI-powered breakdown of customer pain points, sentiment themes, and listing copy angles to outperform the competition.",
    url: "/review-intelligence",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
