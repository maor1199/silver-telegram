"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Rocket,
  Package,
  Megaphone,
  TrendingUp,
  BarChart3,
  Trophy,
  ArrowRight,
  Zap,
} from "lucide-react"

/* ─── Types ───────────────────────────────────────────────── */

interface ChecklistItem {
  id: string
  title: string
  why: string
  toolHref?: string
  toolLabel?: string
}

interface Phase {
  id: string
  number: number
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  items: ChecklistItem[]
}

/* ─── Data ────────────────────────────────────────────────── */

const PHASES: Phase[] = [
  {
    id: "phase-1",
    number: 1,
    title: "Product & Business Case Locked",
    subtitle: "Before you spend a dollar on inventory, these must be confirmed.",
    icon: Package,
    items: [
      {
        id: "p1-1",
        title: "Run a GO/NO-GO analysis",
        why: "Validate the product economics before committing capital. A gut feeling isn't a business plan.",
        toolHref: "/analyze",
        toolLabel: "Run Analysis →",
      },
      {
        id: "p1-2",
        title: "Confirm unit economics",
        why: "Verify: selling price minus FBA fee, referral fee (15%), COGS, and shipping leaves at least 25% net margin.",
      },
      {
        id: "p1-3",
        title: "Get quotes from 3+ suppliers",
        why: "Never negotiate with one supplier. Get 3 quotes minimum on Alibaba, compare MOQ, lead time, and customization options.",
      },
      {
        id: "p1-4",
        title: "Order and test samples",
        why: "Pay for samples. Test every aspect: packaging, durability, dimensions, smell. Most quality issues appear here, not after 500 units arrive.",
      },
      {
        id: "p1-5",
        title: "Confirm differentiation angle",
        why: "Read the top 50 one-star reviews of your main competitor. Your differentiation must solve at least one recurring complaint.",
        toolHref: "/analyze",
        toolLabel: "Check Competitor Reviews →",
      },
      {
        id: "p1-6",
        title: "Calculate total launch capital",
        why: "Inventory + 90 days PPC + Vine enrollment + Amazon account fees + buffer. If you don't have 1.5× this amount liquid, reconsider.",
      },
    ],
  },
  {
    id: "phase-2",
    number: 2,
    title: "Listing Ready to Launch",
    subtitle: "Your listing is your store. It must be perfect before the first visitor arrives.",
    icon: Zap,
    items: [
      {
        id: "p2-1",
        title: "Write optimized title",
        why: "Primary keyword in first 5 words. Include main benefit and one differentiator. Keep under 200 characters. Do NOT stuff keywords.",
        toolHref: "/listing-builder",
        toolLabel: "Use Listing Copywriter →",
      },
      {
        id: "p2-2",
        title: "Write 5 benefit-driven bullet points",
        why: "Each bullet: CAPS hook → specific benefit → why it matters. Never list features without explaining the outcome for the buyer.",
      },
      {
        id: "p2-3",
        title: "Write product description",
        why: "Tell the story. Who is this for, what problem does it solve, why is your version better. This is your A+ content foundation.",
      },
      {
        id: "p2-4",
        title: "Generate all 7 listing images",
        why: "Image 1: white bg, product only. Images 2-7: lifestyle, infographic, comparison, feature close-ups, size reference, packaging. All 2000×2000px.",
        toolHref: "/studio",
        toolLabel: "Generate Images →",
      },
      {
        id: "p2-5",
        title: "Collect backend search terms",
        why: "200 characters of keywords that didn't fit in title/bullets. No commas, no repetition, no brand names. Prioritize high-volume long-tails.",
      },
      {
        id: "p2-6",
        title: "Set up FBA shipment in Seller Central",
        why: "Create the shipment plan, print labels, pack to Amazon's requirements. Measure exact box weight — Amazon charges for miscalculations.",
      },
    ],
  },
  {
    id: "phase-3",
    number: 3,
    title: "Launch Day",
    subtitle: "Launch day sets the velocity for the next 30 days. Execute these in order.",
    icon: Rocket,
    items: [
      {
        id: "p3-1",
        title: "Listing live — verify Buy Box is yours",
        why: "Log in, search your main keyword, confirm your listing appears and the Buy Box is active. Do this from a different device/browser.",
      },
      {
        id: "p3-2",
        title: "Confirm listing is indexed",
        why: "Search your exact product title in Amazon. If your ASIN appears, you're indexed. If not, check for listing suppression alerts.",
      },
      {
        id: "p3-3",
        title: "Launch Auto PPC campaign",
        why: "Campaign type: Sponsored Products. Targeting: Automatic. Budget: $20–30/day. Bid strategy: Dynamic bids – down only. Let it run for 7 days untouched.",
        toolHref: "/ppc-wizard",
        toolLabel: "Build Your First Campaign →",
      },
      {
        id: "p3-4",
        title: "Apply for Vine (if Brand Registered)",
        why: "Enroll 30 units in Vine immediately. You pay ~$200 per ASIN. In return, verified reviewers get your product free and leave honest reviews. Worth it.",
      },
      {
        id: "p3-5",
        title: "Set price 5–8% below your target",
        why: "Slightly lower price in week 1 increases conversion rate, which boosts organic rank. Raise price to target after you hit 15+ reviews.",
      },
      {
        id: "p3-6",
        title: "Share listing link for initial velocity",
        why: "Friends, family, social followers. Every real purchase helps the A9 algorithm understand your product. Never incentivize reviews — only purchases.",
      },
    ],
  },
  {
    id: "phase-4",
    number: 4,
    title: "First Two Weeks",
    subtitle: "The algorithm is watching. These actions turn data into rank.",
    icon: TrendingUp,
    items: [
      {
        id: "p4-1",
        title: "Day 7: Download PPC Search Term Report",
        why: "Go to Campaign Manager → Reports → Search Term. Download and open in Excel. This shows what real shoppers searched that triggered your ad.",
      },
      {
        id: "p4-2",
        title: "Identify wasted spend keywords",
        why: "Sort by clicks with zero orders. Any keyword with 10+ clicks and 0 orders is burning money. Add as Negative Exact in your auto campaign.",
      },
      {
        id: "p4-3",
        title: "Identify winning keywords",
        why: "Any search term with 3+ orders at your target ACoS is a winner. Move these to a new Manual Exact campaign with a bid 20% higher than auto paid.",
      },
      {
        id: "p4-4",
        title: "Monitor BSR daily",
        why: "Your BSR should be improving (number getting lower) week over week. If it's stable or rising, your conversion rate is the problem — check listing images.",
      },
      {
        id: "p4-5",
        title: "Respond to every review",
        why: "Reply to all negative reviews within 24 hours — professionally, with a solution. Buyers read seller responses. It signals you care about quality.",
      },
      {
        id: "p4-6",
        title: "Check for hijackers",
        why: "Search your ASIN directly. If the Buy Box shows a different seller or price, you have a hijacker. Report to Amazon Brand Registry immediately.",
      },
    ],
  },
  {
    id: "phase-5",
    number: 5,
    title: "Month 1 Wrap-Up",
    subtitle: "The data is in. Now make decisions based on reality, not hope.",
    icon: BarChart3,
    items: [
      {
        id: "p5-1",
        title: "Calculate actual ACoS vs target",
        why: "Total ad spend ÷ total ad revenue × 100. If actual ACoS > target ACoS, your bids are too high or your conversion rate is too low.",
      },
      {
        id: "p5-2",
        title: "Calculate actual net profit per unit",
        why: "Selling price minus: FBA fee, referral fee, COGS, shipping, PPC spend per unit, returns. Compare to your pre-launch projection.",
      },
      {
        id: "p5-3",
        title: "Assess BSR trend",
        why: "Is BSR improving? Stable? Declining? If declining after 30 days with active PPC, the market may be more competitive than expected — revisit analysis.",
      },
      {
        id: "p5-4",
        title: "Calculate days of inventory remaining",
        why: "Current units in FBA ÷ average daily sales. If under 45 days, place your reorder NOW — supplier lead time + shipping takes 6-10 weeks.",
      },
      {
        id: "p5-5",
        title: "Document what worked and what didn't",
        why: "Write down: top 3 performing keywords, actual margin, launch capital used, days to first review. This is your playbook for product #2.",
      },
      {
        id: "p5-6",
        title: "Set optimization goals for Month 2",
        why: "Pick ONE metric to improve: ACoS, conversion rate, or review count. Focus beats multitasking for new sellers.",
      },
    ],
  },
]

const TOTAL_ITEMS = PHASES.reduce((sum, p) => sum + p.items.length, 0)
const LS_KEY = "sellermentor_launch_tracker"

/* ─── Helpers ─────────────────────────────────────────────── */

function loadChecked(): Record<string, boolean> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, boolean>
    }
    return {}
  } catch {
    return {}
  }
}

function saveChecked(data: Record<string, boolean>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data))
  } catch {
    /* ignore storage errors */
  }
}

function phaseCheckedCount(phase: Phase, checked: Record<string, boolean>): number {
  return phase.items.filter((item) => checked[item.id]).length
}

function isPhaseComplete(phase: Phase, checked: Record<string, boolean>): boolean {
  return phaseCheckedCount(phase, checked) === phase.items.length
}

function findNextAction(checked: Record<string, boolean>): ChecklistItem | null {
  for (const phase of PHASES) {
    for (const item of phase.items) {
      if (!checked[item.id]) return item
    }
  }
  return null
}

/* ─── Sub-components ──────────────────────────────────────── */

function ItemRow({
  item,
  checked,
  onToggle,
}: {
  item: ChecklistItem
  checked: boolean
  onToggle: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={cn(
        "group rounded-xl border transition-all duration-200",
        checked
          ? "border-amber-200/60 bg-amber-50/40 dark:border-amber-800/30 dark:bg-amber-950/20"
          : "border-border bg-background hover:border-border/80 hover:shadow-sm"
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Checkbox */}
        <button
          type="button"
          onClick={() => onToggle(item.id)}
          aria-label={checked ? `Uncheck: ${item.title}` : `Check: ${item.title}`}
          className="mt-0.5 shrink-0 transition-transform active:scale-95"
        >
          {checked ? (
            <CheckCircle2 className="h-5 w-5 text-amber-500" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "text-sm font-semibold leading-snug transition-all duration-200",
                checked ? "text-muted-foreground line-through" : "text-foreground"
              )}
            >
              {item.title}
            </span>
            {item.toolHref && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 rounded-lg px-2.5 text-xs font-medium border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40"
                asChild
              >
                <Link href={item.toolHref}>
                  <ExternalLink className="mr-1 h-3 w-3" />
                  {item.toolLabel}
                </Link>
              </Button>
            )}
          </div>

          {/* Expandable why */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            <span>{expanded ? "Hide explanation" : "Why this matters"}</span>
          </button>

          {expanded && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
              {item.why}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function PhaseCard({
  phase,
  checked,
  onToggle,
}: {
  phase: Phase
  checked: Record<string, boolean>
  onToggle: (id: string) => void
}) {
  const doneCount = phaseCheckedCount(phase, checked)
  const complete = isPhaseComplete(phase, checked)
  const Icon = phase.icon

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card transition-all duration-300",
        complete ? "border-emerald-400/60 shadow-sm shadow-emerald-100/50 dark:shadow-emerald-950/30" : "border-border"
      )}
    >
      {/* Phase header */}
      <div className="flex items-start gap-4 p-6 pb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/80 dark:bg-amber-900/30">
          <Icon className="h-5 w-5 text-[#FF9900]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
              Phase {phase.number}
            </span>
            {complete && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Complete
              </span>
            )}
          </div>
          <h2 className="mt-1.5 text-lg font-bold text-foreground leading-snug">{phase.title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">{phase.subtitle}</p>
        </div>
        <div className="shrink-0 text-right">
          <span className={cn("text-sm font-semibold tabular-nums", complete ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
            {doneCount}/{phase.items.length}
          </span>
          <p className="text-xs text-muted-foreground">done</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-6 mb-4 h-1 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            complete ? "bg-emerald-500" : "bg-[#FF9900]"
          )}
          style={{ width: `${(doneCount / phase.items.length) * 100}%` }}
        />
      </div>

      {/* Items */}
      <div className="flex flex-col gap-2 px-6 pb-6">
        {phase.items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            checked={!!checked[item.id]}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  )
}

function Sidebar({
  checked,
  nextAction,
}: {
  checked: Record<string, boolean>
  nextAction: ChecklistItem | null
}) {
  const totalDone = Object.values(checked).filter(Boolean).length
  const pct = Math.round((totalDone / TOTAL_ITEMS) * 100)

  return (
    <div className="flex flex-col gap-4">
      {/* Overall progress */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Overall Progress</p>
        <div className="flex items-end justify-between mb-2">
          <span className="text-3xl font-bold text-foreground tabular-nums">{totalDone}</span>
          <span className="text-sm text-muted-foreground mb-1">/ {TOTAL_ITEMS} items</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-[#FF9900] transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{pct}% complete</p>
      </div>

      {/* Phase dots */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Phases</p>
        <div className="flex flex-col gap-3">
          {PHASES.map((phase) => {
            const complete = isPhaseComplete(phase, checked)
            const done = phaseCheckedCount(phase, checked)
            const inProgress = done > 0 && !complete
            return (
              <div key={phase.id} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                    complete
                      ? "border-emerald-500 bg-emerald-500"
                      : inProgress
                        ? "border-[#FF9900] bg-[#FF9900]/10"
                        : "border-border bg-background"
                  )}
                >
                  {complete ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  ) : inProgress ? (
                    <div className="h-2 w-2 rounded-full bg-[#FF9900]" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-medium truncate", complete ? "text-foreground" : inProgress ? "text-foreground" : "text-muted-foreground")}>
                    {phase.title}
                  </p>
                  {!complete && (
                    <p className="text-xs text-muted-foreground/60">{done}/{phase.items.length}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Next action */}
      {nextAction && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Next Action</p>
          <p className="text-sm font-medium text-foreground leading-snug">{nextAction.title}</p>
          {nextAction.toolHref && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 h-8 w-full rounded-xl text-xs border-primary/20 text-primary hover:bg-primary/5"
              asChild
            >
              <Link href={nextAction.toolHref}>
                {nextAction.toolLabel}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function MobileProgressBar({ checked }: { checked: Record<string, boolean> }) {
  const totalDone = Object.values(checked).filter(Boolean).length
  const pct = Math.round((totalDone / TOTAL_ITEMS) * 100)

  return (
    <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm lg:hidden">
      <div className="mx-auto max-w-[1200px] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {PHASES.map((phase) => {
              const complete = isPhaseComplete(phase, checked)
              const inProgress = phaseCheckedCount(phase, checked) > 0 && !complete
              return (
                <div
                  key={phase.id}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all duration-300",
                    complete ? "bg-emerald-500" : inProgress ? "bg-[#FF9900]" : "bg-secondary"
                  )}
                />
              )
            })}
          </div>
          <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-[#FF9900] transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground tabular-nums whitespace-nowrap">
            {totalDone}/{TOTAL_ITEMS}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────────── */

export default function LaunchTrackerPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)

  // Load from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    setChecked(loadChecked())
    setMounted(true)
  }, [])

  const handleToggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      saveChecked(next)
      return next
    })
  }, [])

  const totalDone = Object.values(checked).filter(Boolean).length
  const completedPhases = PHASES.filter((p) => isPhaseComplete(p, checked)).length
  const allDone = totalDone === TOTAL_ITEMS
  const nextAction = findNextAction(checked)

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#fef3c7]/60 via-background to-[#dbeafe]/30" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      <Navbar />

      {/* Mobile sticky progress */}
      {mounted && <MobileProgressBar checked={checked} />}

      <main className="relative flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-[1200px] px-6 pb-10 pt-16 md:pt-20">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Rocket className="h-3.5 w-3.5" />
              Step-by-step launch system
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl text-balance leading-[1.1]">
              Your Amazon Launch Tracker
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground leading-relaxed">
              Follow every step in order. Each phase unlocks the next. Nothing is skipped.
            </p>

            {/* Hero progress summary */}
            {mounted && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
                  <div className="h-2 w-2 rounded-full bg-[#FF9900]" />
                  <span className="text-sm font-medium text-foreground">
                    <span className="tabular-nums">{completedPhases}</span> of 5 phases complete
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-[#FF9900]" />
                  <span className="text-sm font-medium text-foreground">
                    <span className="tabular-nums">{totalDone}</span> of {TOTAL_ITEMS} items checked
                  </span>
                </div>
              </div>
            )}

            {/* Hero progress bar */}
            {mounted && (
              <div className="mx-auto mt-5 max-w-md">
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700 ease-out",
                      allDone ? "bg-emerald-500" : "bg-[#FF9900]"
                    )}
                    style={{ width: `${(totalDone / TOTAL_ITEMS) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Main content + sidebar */}
        <section className="mx-auto max-w-[1200px] px-6 pb-24">
          <div className="flex gap-8 items-start">
            {/* Phase cards */}
            <div className="flex-1 min-w-0 flex flex-col gap-6">
              {PHASES.map((phase) => (
                <PhaseCard
                  key={phase.id}
                  phase={phase}
                  checked={checked}
                  onToggle={handleToggle}
                />
              ))}

              {/* Celebration card */}
              {mounted && allDone && (
                <div className="rounded-2xl border-2 border-emerald-400/60 bg-emerald-50/60 dark:bg-emerald-950/20 p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/40">
                      <Trophy className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Launch Complete!
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-muted-foreground leading-relaxed">
                    You have finished every step. Month 1 is behind you. Now it is time to optimize — track your Month 2 performance with a fresh analysis.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <Button
                      className="h-11 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200/50"
                      asChild
                    >
                      <Link href="/analyze">
                        Track Month 2 Performance
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 rounded-xl px-6 text-sm font-semibold"
                      onClick={() => {
                        setChecked({})
                        saveChecked({})
                      }}
                    >
                      Reset Tracker
                    </Button>
                  </div>
                </div>
              )}

              {/* Bottom CTA (non-complete state) */}
              {mounted && !allDone && (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">Need help validating your product first?</p>
                      <p className="mt-1 text-sm text-muted-foreground">Run a GO/NO-GO analysis before committing to inventory.</p>
                    </div>
                    <Button
                      className="h-10 shrink-0 rounded-xl bg-[#FF9900] px-5 text-sm font-semibold text-white hover:bg-[#FF9900]/90 shadow-sm"
                      asChild
                    >
                      <Link href="/analyze">
                        Run Analysis
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky sidebar (desktop only) */}
            {mounted && (
              <aside className="hidden lg:block w-72 shrink-0 sticky top-6">
                <Sidebar checked={checked} nextAction={nextAction} />
              </aside>
            )}
          </div>
        </section>

        {/* Mobile bottom bar */}
        {mounted && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 backdrop-blur-sm shadow-lg">
            <div className="mx-auto max-w-[1200px] px-4 py-3">
              {nextAction ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">Next Action</p>
                    <p className="text-sm font-medium text-foreground truncate">{nextAction.title}</p>
                  </div>
                  {nextAction.toolHref && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 h-8 rounded-xl text-xs border-primary/20 text-primary hover:bg-primary/5"
                      asChild
                    >
                      <Link href={nextAction.toolHref}>
                        <ExternalLink className="mr-1 h-3 w-3" />
                        {nextAction.toolLabel}
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 py-0.5">
                  <Trophy className="h-4 w-4 text-emerald-500" />
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">All steps complete!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Extra padding for mobile bottom bar */}
        <div className="h-16 lg:hidden" />
      </main>

      <div className="relative z-10 bg-background">
        <Footer />
      </div>
    </div>
  )
}
