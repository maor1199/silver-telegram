import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Amazon Keyword Research Tool — Find High-Volume Search Terms Free",
  description: "Enter any product idea and get Amazon search keywords ranked by priority — with exact placement guidance for title, bullets, and backend search terms. Powered by AI.",
  keywords: [
    "Amazon keyword research tool",
    "Amazon keyword tool free",
    "Amazon search terms",
    "Amazon keyword finder",
    "FBA keyword research",
    "Amazon product keywords",
    "Amazon backend keywords",
  ],
  alternates: { canonical: "/keyword-tool" },
  openGraph: {
    title: "Amazon Keyword Research Tool — Find High-Volume Search Terms Free",
    description: "Get AI-generated Amazon keywords ranked by priority with placement guidance. Free to start.",
    url: "/keyword-tool",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
