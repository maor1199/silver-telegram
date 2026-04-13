"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getPost, getRelatedPosts, type BlogPost, type ContentBlock } from "@/lib/blog-posts"
import {
  ArrowRight, Clock, Calendar, ArrowLeft,
  CheckCircle2, AlertTriangle, Lightbulb, BarChart3,
  Zap,
} from "lucide-react"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

// ─── Reading Progress Bar ──────────────────────────────────────────────
function ReadingProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const update = () => {
      const el = document.documentElement
      const scrolled = el.scrollTop
      const total = el.scrollHeight - el.clientHeight
      setProgress(total > 0 ? (scrolled / total) * 100 : 0)
    }
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [])
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-transparent">
      <div className="h-full bg-primary transition-all duration-75 ease-out" style={{ width: `${progress}%` }} />
    </div>
  )
}

// ─── Table of Contents ─────────────────────────────────────────────────
function TableOfContents({ post, activeId }: { post: BlogPost; activeId: string }) {
  return (
    <nav className="flex flex-col gap-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">On this page</p>
      {post.tocItems.map(item => (
        <a key={item.id} href={`#${item.id}`}
          className={`block text-[13px] leading-snug py-1 transition-colors border-l-2 pl-3 ${item.level === 3 ? "ml-3" : ""}
            ${activeId === item.id
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}>
          {item.text}
        </a>
      ))}
    </nav>
  )
}

// ─── Content Block Renderer ────────────────────────────────────────────
function Block({ block }: { block: ContentBlock }) {
  if (block.type === "h2") return (
    <h2 id={block.id} className="scroll-mt-24 mt-10 mb-4 text-2xl font-bold tracking-tight text-foreground">
      {block.text}
    </h2>
  )
  if (block.type === "h3") return (
    <h3 id={block.id} className="scroll-mt-24 mt-7 mb-3 text-lg font-bold text-foreground">
      {block.text}
    </h3>
  )
  if (block.type === "p") return (
    <p className="mb-4 text-[15px] text-foreground/85 leading-[1.85]">{block.text}</p>
  )
  if (block.type === "ul") return (
    <ul className="mb-5 flex flex-col gap-2">
      {block.items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[15px] text-foreground/85 leading-snug">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          {item}
        </li>
      ))}
    </ul>
  )
  if (block.type === "ol") return (
    <ol className="mb-5 flex flex-col gap-2">
      {block.items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-[15px] text-foreground/85 leading-snug">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
            {i + 1}
          </span>
          {item}
        </li>
      ))}
    </ol>
  )
  if (block.type === "quote") return (
    <blockquote className="my-6 border-l-4 border-primary pl-5 py-1">
      <p className="text-base italic text-foreground/75 leading-relaxed">{block.text}</p>
    </blockquote>
  )
  if (block.type === "divider") return (
    <hr className="my-8 border-border" />
  )
  if (block.type === "takeaways") return (
    <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/[0.04] p-6">
      <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Key Takeaways</p>
      <ul className="flex flex-col gap-2.5">
        {block.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-foreground leading-snug">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
  if (block.type === "callout") {
    const styles = {
      tip: { icon: <Lightbulb className="h-4 w-4 text-blue-600" />, bg: "bg-blue-50 border-blue-100", label: "text-blue-700" },
      warning: { icon: <AlertTriangle className="h-4 w-4 text-amber-600" />, bg: "bg-amber-50 border-amber-100", label: "text-amber-700" },
      stat: { icon: <BarChart3 className="h-4 w-4 text-violet-600" />, bg: "bg-violet-50 border-violet-100", label: "text-violet-700" },
    }
    const s = styles[block.variant]
    return (
      <div className={`my-6 rounded-2xl border p-5 flex items-start gap-4 ${s.bg}`}>
        <div className="shrink-0 mt-0.5">{s.icon}</div>
        <div>
          <p className={`text-[11px] font-bold uppercase tracking-widest mb-1.5 ${s.label}`}>{block.title}</p>
          <p className="text-sm text-foreground/85 leading-relaxed">{block.text}</p>
        </div>
      </div>
    )
  }
  if (block.type === "cta") return (
    <div className="my-8 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.06] to-transparent p-6">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-base font-bold text-foreground">{block.title}</p>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{block.text}</p>
          <Link href={block.buttonHref}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
            {block.buttonText} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
  return null
}

// ─── Page ──────────────────────────────────────────────────────────────
export default function BlogPostPage() {
  const params = useParams()
  const slug = typeof params.slug === "string" ? params.slug : params.slug?.[0] ?? ""
  const post = getPost(slug)
  const related = getRelatedPosts(slug)
  const [activeId, setActiveId] = useState("")
  const contentRef = useRef<HTMLDivElement>(null)

  // Intersection observer for TOC active state
  useEffect(() => {
    if (!post) return
    const headingIds = post.tocItems.map(t => t.id)
    const observers: IntersectionObserver[] = []

    headingIds.forEach(id => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(id) },
        { rootMargin: "-20% 0% -70% 0%" }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [post])

  if (!post) return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-2xl font-bold text-foreground">Article not found</p>
        <p className="text-muted-foreground">This article may have been moved or removed.</p>
        <Link href="/blog" className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-80">
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>
      </div>
      <Footer />
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ReadingProgress />
      <Navbar />

      <main className="flex-1">

        {/* ── Article Header ──────────────────────────────────────────── */}
        <div className="border-b border-border bg-gradient-to-b from-muted/30 to-background">
          <div className="mx-auto max-w-[1160px] px-6 py-12 md:py-16">
            <Link href="/blog" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Blog
            </Link>
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <span className={`rounded-xl border px-3 py-1 text-[11px] font-bold ${post.categoryColor}`}>
                  {post.category}
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl leading-tight">
                {post.title}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{post.readTime} min read</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{formatDate(post.publishedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Cover Image ─────────────────────────────────────────────── */}
        <div className="mx-auto max-w-[1160px] px-6 -mb-8">
          <div className="relative overflow-hidden rounded-2xl border border-border aspect-[21/7] shadow-sm">
            <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
          </div>
        </div>

        {/* ── Content + Sidebar ───────────────────────────────────────── */}
        <div className="mx-auto max-w-[1160px] px-6 pt-16 pb-16">
          <div className="flex gap-16">

            {/* Article Content */}
            <article className="flex-1 min-w-0" ref={contentRef}>
              {post.content.map((block, i) => (
                <Block key={i} block={block} />
              ))}

              {/* Tags */}
              <div className="mt-10 pt-8 border-t border-border flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span key={tag} className="rounded-lg bg-secondary border border-border px-3 py-1 text-[11px] font-medium text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Author */}
              <div className="mt-8 rounded-2xl border border-border bg-card p-6 flex items-start gap-4">
                <div className="h-12 w-12 shrink-0 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">S</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">SellerMentor Team</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Amazon FBA experts and the team behind SellerMentor — the AI-powered analysis tool for Amazon sellers.
                  </p>
                  <Link href="/about" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:opacity-75 transition-opacity">
                    About us <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </article>

            {/* Sticky Sidebar — TOC */}
            <aside className="hidden lg:block w-60 shrink-0">
              <div className="sticky top-24">
                <TableOfContents post={post} activeId={activeId} />

                {/* Mini CTA */}
                <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/[0.04] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Try it free</p>
                  <p className="text-xs font-bold text-foreground mb-1 leading-snug">GO / NO-GO on any product. 60 seconds.</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                    Real Amazon data. No guesswork. No signup required to try.
                  </p>
                  <Link href="/analyze"
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
                    Analyze My Product <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </aside>
          </div>

          {/* ── Related Posts ────────────────────────────────────────── */}
          {related.length > 0 && (
            <div className="mt-16 pt-10 border-t border-border">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-6">Continue Reading</p>
              <div className="grid sm:grid-cols-2 gap-5">
                {related.map(rp => (
                  <Link key={rp.slug} href={`/blog/${rp.slug}`} className="group flex gap-4 rounded-2xl border border-border bg-card p-4 hover:shadow-sm hover:-translate-y-0.5 transition-all">
                    <img src={rp.coverImage} alt={rp.title}
                      className="h-20 w-28 shrink-0 rounded-xl object-cover border border-border" />
                    <div className="flex-1 min-w-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${rp.categoryColor}`}>{rp.category}</span>
                      <h4 className="mt-1.5 text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {rp.title}
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />{rp.readTime} min
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
