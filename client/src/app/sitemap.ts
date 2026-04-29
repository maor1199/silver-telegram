import type { MetadataRoute } from "next"
import { POSTS } from "@/lib/blog-posts"

const BASE_URL = "https://www.sellermentor.ai"

const GUIDE_CHAPTERS = [
  "chapter-1", "chapter-2", "chapter-3", "chapter-4", "chapter-5",
  "chapter-6", "chapter-7", "chapter-8", "chapter-9",
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const blogPosts: MetadataRoute.Sitemap = POSTS.map(post => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }))

  const guideChapters: MetadataRoute.Sitemap = GUIDE_CHAPTERS.map(slug => ({
    url: `${BASE_URL}/guide/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  return [
    // ── Core / High-priority ────────────────────────────────────────────
    { url: BASE_URL,                              lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE_URL}/analyze`,                 lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE_URL}/blog`,                    lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    // ── Guides ─────────────────────────────────────────────────────────
    { url: `${BASE_URL}/guide`,                   lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/research-guide`,          lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    // ── Tools ──────────────────────────────────────────────────────────
    { url: `${BASE_URL}/listing-builder`,         lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/keyword-tool`,            lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/listing-optimizer`,       lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/review-intelligence`,     lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/ppc-wizard`,              lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/launch-tracker`,          lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/studio`,                  lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    // ── Marketing / Acquisition ─────────────────────────────────────────
    { url: `${BASE_URL}/pricing`,                 lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/about`,                   lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/signup`,                  lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/login`,                   lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    // ── Legal ──────────────────────────────────────────────────────────
    { url: `${BASE_URL}/terms`,                   lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/privacy`,                 lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    // ── Guide chapters (9 chapters of the FBA beginner guide) ──────────
    ...guideChapters,
    // ── Blog posts ─────────────────────────────────────────────────────
    ...blogPosts,
  ]
}
