import type { MetadataRoute } from "next"

const BASE_URL = "https://www.sellermentor.ai"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/account",
          "/analyze/results",
          "/api/",
          "/login",
          "/signup",
          "/carcheck",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
