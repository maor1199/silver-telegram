import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "SellerMentor terms of service — the rules and conditions for using our platform.",
  alternates: { canonical: "/terms" },
  robots: { index: false, follow: false },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
