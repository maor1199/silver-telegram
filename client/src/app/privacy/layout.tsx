import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "SellerMentor privacy policy — how we collect, use, and protect your data.",
  alternates: { canonical: "/privacy" },
  robots: { index: false, follow: false },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
