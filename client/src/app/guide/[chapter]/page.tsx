import { notFound } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { getChapter, CHAPTERS_DATA } from "../chapters-content"

export function generateStaticParams() {
  return CHAPTERS_DATA.map((ch) => ({ chapter: ch.slug }))
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ chapter: string }>
}) {
  const { chapter } = await params
  const data = getChapter(chapter)
  if (!data) notFound()

  const isFinal = data.num === 9

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main
        className="flex-1"
        style={{
          backgroundColor: "#F8F9FB",
          backgroundImage: "radial-gradient(circle, #e2e8f0 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      >
        <div className="mx-auto max-w-[780px] px-5 py-10 pb-20">
          {/* ── Article card ── */}
          <div
            className="bg-white border border-border rounded-2xl"
            style={{ padding: "48px 52px", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)" }}
          >
            {/* Progress */}
            <div className="mb-7">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 bg-[#fff8eb] text-[#b45309] border border-[#fde68a] rounded-full px-3 py-1 text-xs font-semibold">
                  <svg width="10" height="10" fill="#FF9900" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  Chapter {data.num} of 9{isFinal ? " · Final" : ""}
                </span>
                <span className="text-xs text-slate-400 font-medium">{data.progress}% complete</span>
              </div>
              <div className="bg-secondary rounded-full h-1 overflow-hidden">
                <div
                  className="bg-primary h-1 rounded-full transition-all duration-500"
                  style={{ width: `${data.progress}%` }}
                />
              </div>
            </div>

            {/* Header */}
            <div className="mb-7 pb-6 border-b border-secondary">
              <h1
                className="text-[2rem] font-black text-foreground leading-[1.15] mb-2.5"
                style={{ letterSpacing: "-0.04em" }}
              >
                {data.title}
              </h1>
              <p className="text-base text-muted-foreground leading-[1.7] m-0">{data.subtitle}</p>
            </div>

            {/* Content */}
            {data.content}

            {/* Final CTA (chapter 9 only) */}
            {isFinal && (
              <div
                className="mt-10 rounded-2xl p-8 flex flex-wrap items-center justify-between gap-5"
                style={{
                  background: "linear-gradient(135deg,#fff8eb 0%,#fff 55%,#eff6ff 100%)",
                  border: "1px solid #E2E8F0",
                }}
              >
                <div>
                  <h3 className="text-[1.1rem] font-black text-foreground mb-1.5" style={{ letterSpacing: "-0.02em" }}>
                    Ready to run the numbers on your product?
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed m-0">
                    Plug in your product, price, and cost. SellerMentor will tell you if the margin works — before you spend a dollar on inventory.
                  </p>
                </div>
                <Button
                  className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/20 whitespace-nowrap"
                  asChild
                >
                  <Link href="/analyze">
                    Analyze My Product Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}

            {/* Chapter navigation */}
            <div className="flex items-center justify-between flex-wrap gap-3 mt-12 pt-6 border-t border-secondary">
              {data.prevSlug ? (
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
                  <Link href={`/guide/${data.prevSlug}`}>
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    {data.prevTitle}
                  </Link>
                </Button>
              ) : (
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
                  <Link href="/guide">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    All Chapters
                  </Link>
                </Button>
              )}

              {data.nextSlug ? (
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-md shadow-primary/20"
                  asChild
                >
                  <Link href={`/guide/${data.nextSlug}`}>
                    Chapter {data.num + 1}: {data.nextTitle}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              ) : (
                <Button variant="ghost" size="sm" style={{ color: "#FF9900" }} asChild>
                  <Link href="/guide">↑ Back to all chapters</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
