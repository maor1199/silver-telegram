import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { POSTS } from "@/lib/blog-posts"
import { ArrowRight, Clock, Calendar } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Amazon FBA Blog — SellerMentor",
  description: "Expert guides on Amazon product research, listing optimization, and FBA strategy. Everything new sellers need to launch and grow on Amazon in 2026.",
  openGraph: {
    title: "Amazon FBA Blog — SellerMentor",
    description: "Expert guides on Amazon product research, listing optimization, and FBA strategy.",
    type: "website",
  },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

export default function BlogPage() {
  const featured = POSTS.find(p => p.featured)
  const rest = POSTS.filter(p => !p.featured)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">

        {/* ── Hero Header ─────────────────────────────────────────────── */}
        <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/[0.04] via-background to-background">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.08),transparent)]" />
          <div className="relative mx-auto max-w-[1160px] px-6 py-16 md:py-20">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-primary">Amazon FBA Knowledge Base</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                Learn to sell smarter<br />
                <span className="text-primary">on Amazon</span>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                Practical guides on product research, listing optimization, and FBA strategy — written for sellers who want to win, not just learn.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1160px] px-6 py-14">

          {/* ── Featured Post ──────────────────────────────────────────── */}
          {featured && (
            <div className="mb-14">
              <p className="mb-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Featured Article</p>
              <Link href={`/blog/${featured.slug}`} className="group block">
                <div className="grid md:grid-cols-2 gap-0 rounded-3xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Image */}
                  <div className="relative overflow-hidden bg-muted aspect-[4/3] md:aspect-auto">
                    <img
                      src={featured.coverImage}
                      alt={featured.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <span className={`absolute top-4 left-4 rounded-xl border px-3 py-1 text-[11px] font-bold ${featured.categoryColor}`}>
                      {featured.category}
                    </span>
                  </div>
                  {/* Content */}
                  <div className="flex flex-col justify-center p-8 md:p-10">
                    <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{featured.readTime} min read</span>
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                      <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{formatDate(featured.publishedAt)}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {featured.title}
                    </h2>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {featured.excerpt}
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-primary">
                      Read article
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* ── Rest of Posts ──────────────────────────────────────────── */}
          <div>
            <p className="mb-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">All Articles</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map(post => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5">
                  {/* Cover */}
                  <div className="relative overflow-hidden aspect-video bg-muted">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className={`absolute top-3 left-3 rounded-lg border px-2.5 py-0.5 text-[10px] font-bold ${post.categoryColor}`}>
                      {post.category}
                    </span>
                  </div>
                  {/* Body */}
                  <div className="flex flex-col flex-1 p-5">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime} min</span>
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                      <span>{formatDate(post.publishedAt)}</span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                      {post.excerpt}
                    </p>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary">
                      Read more <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── CTA Banner ─────────────────────────────────────────────── */}
          <div className="mt-16 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent p-10 text-center">
            <h2 className="text-2xl font-bold text-foreground">Ready to analyze your first product?</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Stop reading — start doing. SellerMentor gives you a GO / NO-GO decision on any Amazon product in under 60 seconds.
            </p>
            <Link href="/analyze"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
              Analyze a Product Free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
