import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Amazon FBA Launch Checklist — 5-Phase Product Launch Tracker",
  description: "Interactive step-by-step checklist for launching your first Amazon FBA product. 5 phases, 30+ steps — from product validation to Month 1 review. Never miss a launch task.",
  keywords: [
    "Amazon FBA launch checklist",
    "Amazon product launch tracker",
    "FBA launch strategy",
    "Amazon FBA launch steps",
    "how to launch Amazon product",
    "Amazon new product launch",
    "FBA product launch plan",
  ],
  alternates: { canonical: "/launch-tracker" },
  openGraph: {
    title: "Amazon FBA Launch Checklist — 5-Phase Product Launch Tracker",
    description: "Interactive 30-step checklist for launching your Amazon FBA product across 5 phases. From product selection to Month 1 wrap-up.",
    url: "/launch-tracker",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
