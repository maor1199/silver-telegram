"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

type SharePayload = {
  product?: string
  verdict?: string
  score?: number | null
  margin?: string
  date?: string
}

function ShareCard() {
  const params = useSearchParams()
  const raw = params.get("d")

  let payload: SharePayload = {}
  try {
    if (raw) {
      payload = JSON.parse(decodeURIComponent(escape(atob(raw)))) as SharePayload
    }
  } catch {
    // malformed link — show generic
  }

  const { product, verdict, score, margin, date } = payload

  const isGo      = verdict === "GO"
  const isNoGo    = verdict === "NO-GO"
  const isBorder  = verdict === "BORDERLINE"

  const verdictLabel = isGo ? "GO" : isNoGo ? "NO-GO" : verdict ?? "PENDING"
  const verdictBg    = isGo ? "bg-emerald-600" : isNoGo ? "bg-red-600" : "bg-amber-500"
  const verdictIcon  = isGo
    ? <CheckCircle2 className="h-8 w-8 text-white" />
    : isNoGo
      ? <XCircle className="h-8 w-8 text-white" />
      : <AlertTriangle className="h-8 w-8 text-white" />

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#fef3c7]/50 via-background to-[#dbeafe]/20" />
      <Navbar />
      <main className="relative flex-1 flex items-center justify-center px-6 py-16">
        <div className="mx-auto w-full max-w-md">

          {/* Shared badge */}
          <div className="mb-6 flex justify-center">
            <span className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground">
              📤 Shared via SellerMentor
            </span>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-border bg-card shadow-xl overflow-hidden">

            {/* Verdict header */}
            <div className={cn("flex flex-col items-center gap-3 px-8 py-10 text-center", verdictBg)}>
              {verdictIcon}
              <div>
                <p className="text-4xl font-black text-white tracking-tight">{verdictLabel}</p>
                {product && (
                  <p className="mt-1 text-sm font-medium text-white/80 capitalize">
                    {product}
                  </p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="px-6 py-6">
              <div className="grid grid-cols-2 gap-3">
                {score != null && (
                  <div className="flex flex-col gap-0.5 rounded-xl border border-border bg-secondary/40 p-4 text-center">
                    <p className="text-2xl font-black text-foreground">{score}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Viability score</p>
                  </div>
                )}
                {margin && (
                  <div className="flex flex-col gap-0.5 rounded-xl border border-border bg-secondary/40 p-4 text-center">
                    <p className="text-2xl font-black text-foreground">{margin}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Est. margin</p>
                  </div>
                )}
              </div>

              {date && (
                <p className="mt-3 text-center text-[11px] text-muted-foreground/50">
                  Analyzed {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              )}
            </div>

            {/* CTA */}
            <div className="border-t border-border bg-secondary/30 px-6 py-5">
              <p className="text-sm font-semibold text-foreground text-center mb-1">
                Validate your own product idea
              </p>
              <p className="text-xs text-muted-foreground text-center mb-4 leading-relaxed">
                GO / NO-GO verdict with full profit math, competition score & advisor memo. Free to start.
              </p>
              <Button className="w-full h-11 rounded-xl font-semibold" asChild>
                <Link href="/analyze">
                  Run my free analysis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="mt-2.5 text-center text-[11px] text-muted-foreground/60">
                No credit card · 5 free analyses · 45 seconds
              </p>
            </div>
          </div>

          {/* Powered by */}
          <p className="mt-6 text-center text-xs text-muted-foreground/50">
            Powered by{" "}
            <Link href="/" className="text-primary hover:underline font-medium">
              SellerMentor
            </Link>
            {" "}— Expert Amazon product analysis
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function SharePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <ShareCard />
    </Suspense>
  )
}
