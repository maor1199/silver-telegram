"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { type BlogPost, type ContentBlock } from "@/lib/blog-posts"
import {
  ArrowRight, Clock, Calendar, ArrowLeft,
  CheckCircle2, AlertTriangle, Lightbulb, BarChart3,
  Zap, ChevronDown, Mail, X,
} from "lucide-react"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

// ─── Reading Progress Bar ──────────────────────────────────────────────
export function ReadingProgress() {
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
      <div className="h-full bg-primary transition-[width] duration-75 ease-out" style={{ width: `${progress}%` }} />
    </div>
  )
}

// ─── Table of Contents ─────────────────────────────────────────────────
export function TableOfContents({ post }: { post: BlogPost }) {
  const [activeId, setActiveId] = useState("")

  useEffect(() => {
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

  return (
    <nav className="flex flex-col gap-0.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">On this page</p>
      {post.tocItems.map(item => (
        <a key={item.id} href={`#${item.id}`}
          className={`block text-[13px] leading-snug py-1.5 transition-colors border-l-2 pl-3 ${item.level === 3 ? "ml-3" : ""}
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

// ─── Sticky Mobile CTA ────────────────────────────────────────────────
export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      if (!dismissed) setVisible(window.scrollY > 300)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [dismissed])

  if (!visible || dismissed) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 flex items-center gap-3 shadow-lg">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground leading-tight">GO / NO-GO on your product</p>
          <p className="text-[11px] text-muted-foreground">60 seconds. Real Amazon data.</p>
        </div>
        <Link
          href="/analyze"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
          Analyze Free <ArrowRight className="h-3 w-3" />
        </Link>
        <button
          onClick={() => { setDismissed(true); setVisible(false) }}
          className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Email Capture Box ─────────────────────────────────────────────────
export function EmailCapture() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="my-10 rounded-2xl border border-border bg-gradient-to-br from-primary/[0.05] to-transparent p-6">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Weekly Amazon Tips</p>
          <p className="text-base font-bold text-foreground leading-snug">Get the edge. Every week.</p>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Actionable FBA strategies, product research frameworks, and market signals — straight to your inbox.
          </p>
          {submitted ? (
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary">
              <CheckCircle2 className="h-4 w-4" /> You&apos;re on the list — we&apos;ll be in touch soon!
            </div>
          ) : (
            <div className="mt-4 flex gap-2">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 min-w-0 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
              <button
                onClick={() => { if (email.includes("@")) setSubmitted(true) }}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
                Subscribe
              </button>
            </div>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground">No spam. Unsubscribe any time.</p>
        </div>
      </div>
    </div>
  )
}

// ─── FAQ Accordion ─────────────────────────────────────────────────────
function FaqAccordion({ items }: { items: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="flex flex-col gap-2 mt-10">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Frequently Asked Questions</p>
      {items.map((item, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
          >
            <span className="text-sm font-semibold text-foreground leading-snug">{item.question}</span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
          </button>
          {open === i && (
            <div className="px-5 pb-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground leading-relaxed pt-3">{item.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Content Block Renderer ────────────────────────────────────────────
function Block({ block }: { block: ContentBlock }) {
  if (block.type === "h2") return (
    <h2 id={block.id} className="scroll-mt-24 mt-10 mb-4 text-2xl font-bold tracking-tight text-foreground">{block.text}</h2>
  )
  if (block.type === "h3") return (
    <h3 id={block.id} className="scroll-mt-24 mt-7 mb-3 text-lg font-bold text-foreground">{block.text}</h3>
  )
  if (block.type === "p") return (
    <p className="mb-4 text-[15px] text-foreground/85 leading-[1.85]">{block.text}</p>
  )
  if (block.type === "ul") return (
    <ul className="mb-5 flex flex-col gap-2.5">
      {block.items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-[15px] text-foreground/85 leading-snug">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{item}
        </li>
      ))}
    </ul>
  )
  if (block.type === "ol") return (
    <ol className="mb-5 flex flex-col gap-2.5">
      {block.items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-[15px] text-foreground/85 leading-snug">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</span>
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
  if (block.type === "divider") return <hr className="my-8 border-border" />
  if (block.type === "takeaways") return (
    <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/[0.04] p-6">
      <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Key Takeaways</p>
      <ul className="flex flex-col gap-2.5">
        {block.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-foreground leading-snug">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />{item}
          </li>
        ))}
      </ul>
    </div>
  )
  if (block.type === "faq") return <FaqAccordion items={block.items} />
  if (block.type === "callout") {
    const styles = {
      tip:     { icon: <Lightbulb className="h-4 w-4 text-blue-600" />,   bg: "bg-blue-50 border-blue-100",   label: "text-blue-700" },
      warning: { icon: <AlertTriangle className="h-4 w-4 text-amber-600" />, bg: "bg-amber-50 border-amber-100", label: "text-amber-700" },
      stat:    { icon: <BarChart3 className="h-4 w-4 text-violet-600" />, bg: "bg-violet-50 border-violet-100", label: "text-violet-700" },
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

// ─── Full Article Client Component ─────────────────────────────────────
export function PostClient({ post, related }: { post: BlogPost; related: BlogPost[] }) {
  return (
    <>
      <ReadingProgress />
      <StickyMobileCTA />

      {/* Article Header */}
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

      {/* Cover Image */}
      <div className="mx-auto max-w-[1160px] px-6 -mb-8">
        <div className="relative overflow-hidden rounded-2xl border border-border aspect-[21/7] shadow-sm">
          <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
        </div>
      </div>

      {/* Content + Sidebar */}
      <div className="mx-auto max-w-[1160px] px-6 pt-16 pb-16">
        <div className="flex gap-16">

          {/* Article */}
          <article className="flex-1 min-w-0">
            {post.content.map((block, i) => (
              <div key={i}>
                <Block block={block} />
                {i === 3 && <EmailCapture />}
              </div>
            ))}

            {/* FAQ Accordion */}
            <FaqAccordion items={post.faqSchema} />

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
                <p className="text-xs text-muted-foreground mt-0.5">Amazon FBA experts and the team behind SellerMentor — the AI-powered analysis tool for Amazon sellers.</p>
                <Link href="/about" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:opacity-75 transition-opacity">
                  About us <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </article>

          {/* Sticky Sidebar */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-24">
              <TableOfContents post={post} />
              <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/[0.04] p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Try it free</p>
                <p className="text-xs font-bold text-foreground mb-1 leading-snug">GO / NO-GO on any product. 60 seconds.</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                  Real Amazon data. No guesswork.
                </p>
                <Link href="/analyze"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
                  Analyze My Product <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {/* Related Posts */}
        {related.length > 0 && (
          <div className="mt-16 pt-10 border-t border-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-6">Continue Reading</p>
            <div className="grid sm:grid-cols-2 gap-5">
              {related.map(rp => (
                <Link key={rp.slug} href={`/blog/${rp.slug}`}
                  className="group flex gap-4 rounded-2xl border border-border bg-card p-4 hover:shadow-sm hover:-translate-y-0.5 transition-all">
                  <img src={rp.coverImage} alt={rp.title}
                    className="h-20 w-28 shrink-0 rounded-xl object-cover border border-border" />
                  <div className="flex-1 min-w-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${rp.categoryColor}`}>{rp.category}</span>
                    <h4 className="mt-1.5 text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">{rp.title}</h4>
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
    </>
  )
}
