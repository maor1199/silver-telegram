import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Amazon Launch Tracker",
  description:
    "Step-by-step interactive checklist for launching your first Amazon FBA product. 5 phases, 30 steps, from product selection to Month 1 wrap-up.",
  alternates: { canonical: "/launch-tracker" },
  openGraph: {
    title: "Amazon Launch Tracker — SellerMentor",
    description:
      "Step-by-step interactive checklist for launching your first Amazon FBA product. 5 phases, 30 steps, from product selection to Month 1 wrap-up.",
    url: "/launch-tracker",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
