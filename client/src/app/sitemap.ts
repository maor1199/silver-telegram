import type { MetadataRoute } from "next"
import { POSTS } from "@/lib/blog-posts"

const BASE_URL = "https://www.sellermentor.ai"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const blogPosts: MetadataRoute.Sitemap = POSTS.map(post => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }))

  return [
    { url: BASE_URL,                              lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE_URL}/analyze`,                 lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE_URL}/blog`,                    lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE_URL}/research-guide`,          lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/listing-builder`,         lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/studio`,                  lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/launch-tracker`,          lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/ppc-wizard`,              lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/pricing`,                 lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/about`,                   lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/signup`,                  lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/login`,                   lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/terms`,                   lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/privacy`,                 lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    ...blogPosts,
  ]
}
