import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Listing Optimizer — SellerMentor",
  description:
    "Paste your Amazon listing and target keywords to get a score and specific improvement suggestions for title, bullets, and description — powered by AI.",
  alternates: { canonical: "/listing-optimizer" },
  openGraph: {
    title: "Listing Optimizer — SellerMentor",
    description:
      "Paste your Amazon listing and target keywords to get a score and specific improvement suggestions for title, bullets, and description — powered by AI.",
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
