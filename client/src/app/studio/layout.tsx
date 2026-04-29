import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Amazon Listing Studio — AI Product Images & A+ Content Generator",
  description: "Create professional Amazon product images, lifestyle photos, and A+ content with AI. No photoshoot needed — generate scroll-stopping visuals and convert more buyers.",
  keywords: [
    "Amazon product image generator",
    "Amazon A+ content creator",
    "Amazon listing images AI",
    "Amazon lifestyle photos generator",
    "Amazon product photography",
    "FBA listing visuals",
    "Amazon image studio",
  ],
  alternates: { canonical: "/studio" },
  openGraph: {
    title: "Amazon Listing Studio — AI Product Images & A+ Content Generator",
    description: "AI-generated product images, lifestyle photos, and A+ content for your Amazon listing. No photoshoot needed.",
    url: "/studio",
  },
}

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children
}
