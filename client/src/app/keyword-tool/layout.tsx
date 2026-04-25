import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Keyword Tool — SellerMentor",
  description:
    "Enter a product idea and get an AI-generated list of Amazon search keywords, ranked by priority with suggested placements for title, bullets, and backend fields.",
  alternates: { canonical: "/keyword-tool" },
  openGraph: {
    title: "Keyword Tool — SellerMentor",
    description:
      "Enter a product idea and get an AI-generated list of Amazon search keywords, ranked by priority with suggested placements for title, bullets, and backend fields.",
    url: "/keyword-tool",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
