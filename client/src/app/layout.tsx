import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const BASE_URL = "https://www.sellermentor.ai"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'SellerMentor — Expert Product Analysis for Amazon Sellers',
    template: '%s — SellerMentor',
  },
  description: 'Know if your product will succeed before you invest. Get a GO / NO-GO verdict with profitability, competition, PPC pressure and risk analysis — built for Amazon FBA sellers.',
  keywords: ['Amazon FBA', 'product research', 'Amazon seller tools', 'FBA calculator', 'product validation', 'GO NO-GO', 'Amazon PPC', 'listing optimization'],
  authors: [{ name: 'SellerMentor', url: BASE_URL }],
  creator: 'SellerMentor',
  publisher: 'SellerMentor',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'SellerMentor',
    title: 'SellerMentor — Expert Product Analysis for Amazon Sellers',
    description: 'Know if your product will succeed before you invest. GO / NO-GO verdict with real economics, competition signals & PPC analysis.',
    url: BASE_URL,
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'SellerMentor — Amazon Product Analysis' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SellerMentor — Expert Product Analysis for Amazon Sellers',
    description: 'GO / NO-GO verdict with real economics, competition signals & PPC analysis for Amazon FBA sellers.',
    images: ['/og-default.png'],
  },
  alternates: {
    canonical: BASE_URL,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}

