import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "PPC Campaign Wizard — SellerMentor",
  description:
    "Build your first Amazon PPC campaign in 4 steps. Enter your product details and get a complete campaign blueprint with exact settings, bids, and a 30-day action plan.",
  alternates: { canonical: "/ppc-wizard" },
  openGraph: {
    title: "PPC Campaign Wizard — SellerMentor",
    description:
      "Build your first Amazon PPC campaign in 4 steps. Enter your product details and get a complete campaign blueprint with exact settings, bids, and a 30-day action plan.",
    url: "/ppc-wizard",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
