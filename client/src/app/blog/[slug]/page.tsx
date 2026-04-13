import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getPost, getRelatedPosts } from "@/lib/blog-posts"
import { PostClient } from "./post-client"
import type { Metadata } from "next"

const BASE_URL = "https://www.sellermentor.ai"

// ─── generateMetadata (per-post SEO) ──────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return { title: "Article Not Found — SellerMentor" }

  return {
    title: `${post.title} — SellerMentor`,
    description: post.excerpt,
    keywords: post.tags.join(", "),
    authors: [{ name: "SellerMentor Team", url: BASE_URL }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      authors: ["SellerMentor Team"],
      images: [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }],
      url: `${BASE_URL}/blog/${post.slug}`,
      siteName: "SellerMentor",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
    alternates: {
      canonical: `${BASE_URL}/blog/${post.slug}`,
    },
  }
}

// ─── JSON-LD Schemas ───────────────────────────────────────────────────
function ArticleSchema({ post }: { post: ReturnType<typeof getPost> }) {
  if (!post) return null
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.coverImage,
    "datePublished": post.publishedAt,
    "dateModified": post.publishedAt,
    "author": {
      "@type": "Organization",
      "name": "SellerMentor",
      "url": BASE_URL,
    },
    "publisher": {
      "@type": "Organization",
      "name": "SellerMentor",
      "url": BASE_URL,
      "logo": { "@type": "ImageObject", "url": `${BASE_URL}/icon.png` },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${BASE_URL}/blog/${post.slug}`,
    },
    "keywords": post.tags.join(", "),
    "articleSection": post.category,
    "timeRequired": `PT${post.readTime}M`,
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

function BreadcrumbSchema({ post }: { post: ReturnType<typeof getPost> }) {
  if (!post) return null
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${BASE_URL}/blog` },
      { "@type": "ListItem", "position": 3, "name": post.title, "item": `${BASE_URL}/blog/${post.slug}` },
    ],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

function FaqSchema({ post }: { post: ReturnType<typeof getPost> }) {
  if (!post || !post.faqSchema?.length) return null
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": post.faqSchema.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ─── Page ──────────────────────────────────────────────────────────────
export default async function BlogPostPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const related = getRelatedPosts(slug)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* JSON-LD structured data */}
      <ArticleSchema post={post} />
      <BreadcrumbSchema post={post} />
      <FaqSchema post={post} />

      <Navbar />
      <main className="flex-1">
        <PostClient post={post} related={related} />
      </main>
      <Footer />
    </div>
  )
}
