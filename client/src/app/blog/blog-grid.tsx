"use client"

import { useState } from "react"
import Link from "next/link"
import { type BlogPost } from "@/lib/blog-posts"
import { ArrowRight, Clock, Calendar } from "lucide-react"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

const CATEGORIES = ["All", "Product Research", "Listing Optimization", "Copywriting"]

export function BlogGrid({ posts }: { posts: BlogPost[] }) {
  const [active, setActive] = useState("All")

  const filtered = active === "All" ? posts : posts.filter(p => p.category === active)

  return (
    <div>
      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
              active === cat
                ? "bg-primary border-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/30"
            }`}
          >
            {cat}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-muted-foreground">
          {filtered.length} article{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center text-sm text-muted-foreground">No articles in this category yet.</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(post => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5"
            >
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
      )}
    </div>
  )
}
