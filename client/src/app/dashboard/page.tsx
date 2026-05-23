"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Zap, Upload, ChevronDown, X } from "lucide-react"
import { useSkus } from "@/lib/intelligence/store"
import { generateRiskAlerts } from "@/lib/intelligence/risk-engine"
import { getBusinessHealthScore } from "@/lib/intelligence/health-score"
import type { BusinessHealthScore } from "@/lib/intelligence/health-score"
import { computeDeltas, DEMO_YESTERDAY_SCORE, loadYesterdayScore } from "@/lib/intelligence/delta-engine"
import type { DeltaChange } from "@/lib/intelligence/delta-engine"
import { getPriorityFeed } from "@/lib/intelligence/priority-feed"
import type { PriorityItem, Trajectory } from "@/lib/intelligence/priority-feed"
import { buildDailyBrief, saveFeedSnapshot } from "@/lib/intelligence/daily-brief"
import type { DailyBrief } from "@/lib/intelligence/daily-brief"
import type { AlertRecord } from "@/lib/intelligence/persistence-tracker"
import {
  trackFeedVisit,
  trackFeedRendered,
  trackAlertExpanded,
  trackAlertCollapsed,
  trackAiClicked,
  trackFeedback,
  trackSessionSurvey,
  type FeedbackValue,
  type SurveyValue,
} from "@/lib/intelligence/engagement-tracker"
import { cn } from "@/lib/utils"

// ─── First-Run Overlay ────────────────────────────────────────────────────────

const INTRO_KEY = "sellermentor_intro_v1"

const INTRO_STEPS = [
  {
    icon: "📡",
    title: "Monitors operational deterioration",
    body: "SellerMentor watches your SKUs continuously — inventory, margin, ad efficiency, returns. It surfaces issues before they become expensive problems.",
  },
  {
    icon: "📉",
    title: "Shows what happens if nothing changes",
    body: "Every alert carries a projected impact. Not vague warnings — concrete estimates of what drifts away if the issue goes unaddressed.",
  },
  {
    icon: "🎯",
    title: "Helps you decide what to act on first",
    body: "Issues are ranked by severity and trajectory. Expand any card to see the causal chain, confidence level, and a precise recommended action.",
  },
]

function FirstRunOverlay({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const isLast  = step === INTRO_STEPS.length - 1
  const current = INTRO_STEPS[step]

  function handleNext() {
    if (isLast) {
      try { localStorage.setItem(INTRO_KEY, "1") } catch { /* ignore */ }
      onDone()
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-[400px] rounded-2xl border border-border bg-card shadow-2xl px-8 py-8">
        <div className="flex items-center gap-1.5 mb-6">
          {INTRO_STEPS.map((_, i) => (
            <div key={i} className={cn("h-1.5 rounded-full transition-all duration-300", i === step ? "w-6 bg-primary" : "w-1.5 bg-border")} />
          ))}
        </div>
        <div className="text-3xl mb-4">{current.icon}</div>
        <h2 className="text-[17px] font-bold text-foreground leading-snug mb-2">{current.title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">{current.body}</p>
        <button onClick={handleNext} className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors">
          {isLast ? "Got it — show me the feed" : "Next →"}
        </button>
        {!isLast && (
          <button
            onClick={() => { try { localStorage.setItem(INTRO_KEY, "1") } catch { /* ignore */ } onDone() }}
            className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip intro
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Session Survey ───────────────────────────────────────────────────────────

const SURVEY_OPTIONS: { value: SurveyValue; label: string }[] = [
  { value: "yes",      label: "Yes"      },
  { value: "somewhat", label: "Somewhat" },
  { value: "no",       label: "No"       },
]

function SessionSurvey({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<SurveyValue | null>(null)

  function handleSelect(value: SurveyValue) {
    if (selected) return
    setSelected(value)
    trackSessionSurvey(value)
    setTimeout(onClose, 1800)
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[280px] rounded-2xl border border-border bg-card shadow-xl px-5 py-4">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-semibold text-foreground leading-snug">
          Did SellerMentor help you understand what needs attention?
        </p>
        <button onClick={onClose} className="ml-3 shrink-0 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {selected ? (
        <p className="text-[11px] text-muted-foreground">Thanks for the feedback.</p>
      ) : (
        <div className="flex gap-2">
          {SURVEY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className="flex-1 rounded-lg border border-border bg-background hover:border-primary/40 hover:text-foreground px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Daily Check-In Brief ─────────────────────────────────────────────────────
// Makes the system feel alive and aware of business movement.

function DailyBriefBanner({ brief }: { brief: DailyBrief }) {
  if (brief.isFirstVisit || !brief.message) return null

  const borderColor =
    brief.tone === "critical" ? "border-red-200 bg-red-50/60"       :
    brief.tone === "warning"  ? "border-orange-200 bg-orange-50/60" :
    brief.tone === "positive" ? "border-green-200 bg-green-50/60"   :
                                "border-border bg-muted/30"

  const textColor =
    brief.tone === "critical" ? "text-red-800"    :
    brief.tone === "warning"  ? "text-orange-800" :
    brief.tone === "positive" ? "text-green-800"  :
                                "text-muted-foreground"

  const dot =
    brief.tone === "critical" ? "bg-red-500"    :
    brief.tone === "warning"  ? "bg-orange-500" :
    brief.tone === "positive" ? "bg-green-500"  : "bg-muted-foreground/50"

  return (
    <div className={cn("rounded-xl border px-4 py-3 mb-6 flex items-start gap-3", borderColor)}>
      <div className={cn("mt-1.5 h-1.5 w-1.5 rounded-full shrink-0", dot)} />
      <p className={cn("text-xs leading-relaxed", textColor)}>{brief.message}</p>
    </div>
  )
}

// ─── Operational State Bar ────────────────────────────────────────────────────

function deriveOperationalState(
  health: BusinessHealthScore,
  feed:   PriorityItem[],
  deltas: DeltaChange[]
) {
  const criticalCount     = feed.filter(f => f.severity === "critical").length
  const acceleratingCount = feed.filter(f => f.trajectory === "accelerating").length

  const stabilityLabel =
    health.overall >= 68 ? "Stable"   :
    health.overall >= 52 ? "Weak"     :
    health.overall >= 38 ? "Fragile"  : "Critical"
  const stabilityColor =
    health.overall >= 68 ? "text-green-700" :
    health.overall >= 52 ? "text-orange-600" : "text-red-600"

  const riskLabel =
    criticalCount > 0                     ? "Elevated" :
    feed.some(f => f.severity === "high") ? "Moderate" : "Managed"
  const riskColor =
    criticalCount > 0                     ? "text-red-600"    :
    feed.some(f => f.severity === "high") ? "text-orange-600" : "text-green-700"

  const marginLabel =
    health.profit.score < 52 ? "Increasing" :
    health.profit.score < 68 ? "Present"    : "Stable"
  const marginColor =
    health.profit.score < 52 ? "text-red-600"    :
    health.profit.score < 68 ? "text-orange-600" : "text-green-700"

  const trajectoryLabel =
    acceleratingCount > 0 ? "Deteriorating" :
    deltas.length > 2     ? "Shifting"      :
    deltas.length > 0     ? "In motion"     : "Holding"

  return { stabilityLabel, stabilityColor, riskLabel, riskColor, marginLabel, marginColor, trajectoryLabel }
}

function OperationalStateBar({ health, feed, deltas, yesterdayScore }: {
  health: BusinessHealthScore; feed: PriorityItem[]
  deltas: DeltaChange[]; yesterdayScore: number | null
}) {
  const state      = deriveOperationalState(health, feed, deltas)
  const scoreDelta = yesterdayScore !== null ? health.overall - yesterdayScore : null

  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-5 mb-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex gap-8 flex-wrap">
          {[
            { label: "Business Stability", value: state.stabilityLabel, color: state.stabilityColor },
            { label: "Operational Risk",   value: state.riskLabel,      color: state.riskColor      },
            { label: "Margin Pressure",    value: state.marginLabel,    color: state.marginColor    },
          ].map(s => (
            <div key={s.label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">{s.label}</p>
              <p className={cn("text-xl font-bold leading-none", s.color)}>{s.value}</p>
            </div>
          ))}
        </div>
        <div className="text-right text-xs space-y-0.5">
          {feed.length > 0 && (
            <p className="font-semibold text-foreground">{feed.length} issue{feed.length !== 1 ? "s" : ""} need attention</p>
          )}
          {deltas.length > 0 && (
            <p className="text-orange-600 font-medium">
              {deltas.length} change{deltas.length !== 1 ? "s" : ""} since yesterday · {state.trajectoryLabel}
            </p>
          )}
          {scoreDelta !== null && scoreDelta !== 0 && (
            <p className={cn("tabular-nums", scoreDelta > 0 ? "text-green-600" : "text-red-500")}>
              Health {scoreDelta > 0 ? "+" : ""}{scoreDelta} vs yesterday
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Since Yesterday ──────────────────────────────────────────────────────────

function DeltaRow({ change }: { change: DeltaChange }) {
  const isWorse =
    change.delta < 0 || change.type === "acos_spike" || change.type === "return_spike"
  const arrowColor =
    change.severity === "critical" ? "text-red-500"    :
    change.severity === "high"     ? "text-orange-500" : "text-yellow-500"
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <span className={cn("text-sm font-bold leading-tight mt-0.5 shrink-0", arrowColor)}>
        {isWorse ? "↓" : "↑"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground leading-snug">{change.headline}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{change.detail}</p>
      </div>
    </div>
  )
}

function SinceYesterdayCard({ deltas }: { deltas: DeltaChange[] }) {
  if (deltas.length === 0) return null
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-5 mb-6">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
        Changes since yesterday
      </p>
      {deltas.map(d => <DeltaRow key={`${d.skuId}-${d.type}`} change={d} />)}
    </div>
  )
}

// ─── Priority Feed ────────────────────────────────────────────────────────────

const TRAJECTORY_CONFIG: Record<Trajectory, { label: string; color: string }> = {
  accelerating:  { label: "↑ Accelerating", color: "text-red-600"    },
  deteriorating: { label: "Deteriorating",  color: "text-orange-600" },
  stabilizing:   { label: "Stabilizing",    color: "text-yellow-600" },
  recovering:    { label: "Recovering",     color: "text-green-600"  },
}

// ─── Issue Timeline ────────────────────────────────────────────────────────────
// Compact operational history inside the expanded detail panel.

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString([], { month: "short", day: "numeric" })
}

function daysAgo(isoDate: string): number {
  return Math.max(1, Math.round((Date.now() - new Date(isoDate).getTime()) / 86_400_000))
}

function estimateDateAt(lastSeenAt: string, sessionCount: number, targetSession: number): string {
  // Estimate date of targetSession by counting backwards from lastSeenAt
  const sessionsAgo = sessionCount - targetSession
  return new Date(new Date(lastSeenAt).getTime() - sessionsAgo * 86_400_000).toISOString()
}

type TimelineEntry = { date: string; label: string; sub?: string; isCurrent?: boolean }

function buildTimelineEntries(record: AlertRecord, currentSeverity: string): TimelineEntry[] {
  const entries: TimelineEntry[] = []
  const n = record.sessionCount

  // Entry 1: First detected
  entries.push({
    date:  formatDate(record.firstSeenAt),
    label: `First detected`,
    sub:   `${daysAgo(record.firstSeenAt)} days ago · initial severity: ${record.lastSeverity}`,
  })

  // Entry 2: Confirmed recurring (around session 3-4)
  if (n >= 4) {
    const confirmedAt = estimateDateAt(record.lastSeenAt, n, 3)
    entries.push({
      date:  formatDate(confirmedAt),
      label: "Confirmed recurring",
      sub:   "Issue persisted across 3 consecutive check-ins",
    })
  }

  // Entry 3: Reached persistent threshold (session 7+)
  if (n >= 7) {
    const persistedAt = estimateDateAt(record.lastSeenAt, n, 7)
    entries.push({
      date:  formatDate(persistedAt),
      label: "Classified as persistent",
      sub:   "7 sessions without resolution — compounding risk",
    })
  }

  // Entry 4: Current state
  entries.push({
    date:     "Today",
    label:    `Still active`,
    sub:      `${n} session${n !== 1 ? "s" : ""} observed · current severity: ${currentSeverity}`,
    isCurrent: true,
  })

  return entries
}

function IssueTimeline({ record, severity }: { record: AlertRecord; severity: string }) {
  const entries = buildTimelineEntries(record, severity)

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Issue Timeline</p>
      <div className="relative flex flex-col gap-0">
        {entries.map((entry, i) => (
          <div key={i} className="flex gap-3 pb-3 last:pb-0">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center shrink-0 pt-0.5">
              <div className={cn(
                "h-2 w-2 rounded-full shrink-0",
                entry.isCurrent ? "bg-foreground" : "bg-border"
              )} />
              {i < entries.length - 1 && (
                <div className="w-px flex-1 mt-1 bg-border/50" style={{ minHeight: "16px" }} />
              )}
            </div>
            {/* Content */}
            <div className="pb-0 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  entry.isCurrent ? "text-foreground" : "text-muted-foreground"
                )}>
                  {entry.date}
                </span>
                <span className="text-xs text-foreground">{entry.label}</span>
              </div>
              {entry.sub && (
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{entry.sub}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Expanded Detail Panel ────────────────────────────────────────────────────

function DetailSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">{label}</p>
      {children}
    </div>
  )
}

// ─── Feedback widget ──────────────────────────────────────────────────────────

const FEEDBACK_OPTIONS: { value: FeedbackValue; label: string }[] = [
  { value: "useful",       label: "Useful"       },
  { value: "not_useful",   label: "Not useful"   },
  { value: "too_obvious",  label: "Too obvious"  },
  { value: "not_accurate", label: "Not accurate" },
]

function FeedbackWidget({ item }: { item: PriorityItem }) {
  const [selected, setSelected] = useState<FeedbackValue | null>(null)

  function handleFeedback(value: FeedbackValue) {
    if (selected) return
    setSelected(value)
    trackFeedback(item.alertId, item.category, value)
  }

  return (
    <div className="mt-3 pt-3 border-t border-border/30">
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Was this useful?</p>
      {selected ? (
        <p className="text-[11px] text-muted-foreground">Recorded — thanks.</p>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {FEEDBACK_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleFeedback(opt.value)}
              className="text-[11px] rounded-md border border-border bg-background hover:border-primary/30 hover:text-foreground px-2.5 py-1 text-muted-foreground transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Expanded detail (full panel) ─────────────────────────────────────────────

function ExpandedDetail({
  item,
  persistRecord,
}: {
  item:          PriorityItem
  persistRecord: AlertRecord | undefined
}) {
  const hasCausal = item.causedBy || item.impacts || item.chainLabel

  return (
    <div className="mt-4 pt-4 border-t border-border/50 flex flex-col gap-4">

      {/* Causal chain */}
      {hasCausal && (
        <DetailSection label="Causal Chain">
          {item.chainLabel && (
            <p className="text-xs font-semibold text-foreground mb-1.5">{item.chainLabel}</p>
          )}
          {item.causedBy && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-foreground/70 font-medium">← Driven by:</span> {item.causedBy}
            </p>
          )}
          {item.impacts && (
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              <span className="text-foreground/70 font-medium">→ Compounding:</span> {item.impacts}
            </p>
          )}
        </DetailSection>
      )}

      {/* Issue timeline — shown when we have persistence data */}
      {persistRecord && persistRecord.sessionCount > 1 && (
        <IssueTimeline record={persistRecord} severity={item.severity} />
      )}

      {/* Signal quality */}
      <DetailSection label="Signal Quality">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">{item.confidence}% confidence</span> — {item.confidenceReason}
        </p>
      </DetailSection>

      {/* Quantified impact */}
      <DetailSection label="Quantified Impact">
        <p className="text-xs text-muted-foreground leading-relaxed">{item.impact}</p>
      </DetailSection>

      {/* Feedback */}
      <FeedbackWidget item={item} />

    </div>
  )
}

// ─── Priority Item Card ───────────────────────────────────────────────────────

// Shared persistence map — populated by the page and passed down
type PersistMap = Map<string, AlertRecord>

function PriorityItemCard({
  item,
  persistMap,
  onInteract,
}: {
  item:        PriorityItem
  persistMap:  PersistMap
  onInteract:  () => void
}) {
  const router                  = useRouter()
  const [expanded, setExpanded] = useState(false)

  const borderColor =
    item.severity === "critical" ? "border-l-red-500"    :
    item.severity === "high"     ? "border-l-orange-400" :
                                   "border-l-yellow-400"

  const traj = TRAJECTORY_CONFIG[item.trajectory]

  const showPersistence =
    item.persistenceLabel &&
    item.persistenceColorClass !== "text-muted-foreground"

  // Look up the raw AlertRecord for the timeline
  const persistKey = `${item.skuId}-${item.category}`
  const persistRecord = persistMap.get(persistKey)

  function handleToggle() {
    const next = !expanded
    setExpanded(next)
    if (next) {
      trackAlertExpanded(item.alertId, item.category, item.severity, item.trajectory, item.rank)
      onInteract()
    } else {
      trackAlertCollapsed(item.alertId)
    }
  }

  function handleAiClick() {
    trackAiClicked(item.alertId, item.category, item.rank)
    onInteract()
    router.push(`/advisor?q=${encodeURIComponent(item.advisorQ)}`)
  }

  return (
    <div className={cn("border-l-2 pl-5 py-5 border-b border-border/60 last:border-b-0", borderColor)}>

      {/* Meta: SKU · category | trajectory */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{item.skuName}</span>
          <span className="text-xs text-muted-foreground/40">·</span>
          <span className="text-xs text-muted-foreground capitalize">{item.category}</span>
          {item.state === "new" && (
            <span className="text-[10px] font-bold uppercase tracking-wide text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-1.5 py-0.5">
              New
            </span>
          )}
        </div>
        <span className={cn("text-xs font-semibold", traj.color)}>{traj.label}</span>
      </div>

      {/* Headline */}
      <p className="text-[15px] font-bold text-foreground leading-snug mb-1.5">{item.headline}</p>

      {/* Context */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{item.context}</p>

      {/* Projected impact */}
      {item.projectedImpact && (
        <div className="mb-3 rounded-lg bg-amber-50/70 border border-amber-200/60 px-3 py-2">
          <p className="text-[11px] text-amber-800 leading-snug">
            <span className="font-semibold">If nothing changes:</span> {item.projectedImpact}
          </p>
        </div>
      )}

      {/* Causal surface (collapsed only) */}
      {item.causedBy && !expanded && (
        <p className="text-[11px] text-muted-foreground mb-3 leading-snug">
          <span className="font-semibold text-foreground/80">Driven by:</span> {item.causedBy}
        </p>
      )}

      {/* Action row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug">→ {item.action}</p>
          {showPersistence && !expanded && (
            <p className={cn("text-[11px] mt-1.5 leading-snug", item.persistenceColorClass)}>
              {item.persistenceLabel}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleToggle}
            className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label={expanded ? "Collapse detail" : "Expand detail"}
          >
            Details
            <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", expanded && "rotate-180")} />
          </button>
          <button
            onClick={handleAiClick}
            className="text-xs font-medium text-primary hover:text-primary/70 transition-colors whitespace-nowrap"
          >
            Ask AI →
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && <ExpandedDetail item={item} persistRecord={persistRecord} />}

    </div>
  )
}

// ─── Priority Feed ────────────────────────────────────────────────────────────

function PriorityFeed({
  items,
  suppressedCount,
  persistMap,
  onInteract,
}: {
  items:          PriorityItem[]
  suppressedCount: number
  persistMap:     PersistMap
  onInteract:     () => void
}) {
  if (items.length === 0) {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    return (
      <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center">
        <div className="mx-auto mb-3 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-base">✓</div>
        <p className="text-sm font-semibold text-foreground">No material deterioration detected</p>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-[320px] mx-auto">
          {suppressedCount > 0
            ? `${suppressedCount} minor signal${suppressedCount !== 1 ? "s" : ""} filtered automatically — none exceeded the confidence threshold.`
            : "We'll surface issues when something becomes operationally meaningful."
          }
        </p>
        <p className="text-[11px] text-muted-foreground/60 mt-3">Last checked: {now}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card px-6">
      {items.map(item => (
        <PriorityItemCard
          key={item.id}
          item={item}
          persistMap={persistMap}
          onInteract={onInteract}
        />
      ))}
    </div>
  )
}

// ─── Test with your business CTA ─────────────────────────────────────────────

function TestCTA() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-border bg-card px-6 py-6 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="text-sm font-semibold text-foreground">Test this with your business</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Upload your SKU export — the risk engine runs on your real data.
        </p>
      </div>
      <Link
        href="/data"
        className="inline-flex items-center gap-1.5 rounded-xl bg-foreground text-background px-4 py-2 text-sm font-semibold hover:bg-foreground/80 transition-colors shrink-0"
      >
        <Upload className="h-3.5 w-3.5" />
        Import my data
      </Link>
    </div>
  )
}

// ─── KPI Strip ────────────────────────────────────────────────────────────────

function KpiStrip({ revenue, profit, adSpend }: {
  revenue: number; profit: number; adSpend: number
}) {
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0
  return (
    <div className="flex items-center gap-8 mt-8 pt-6 border-t border-border/50">
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Revenue</p>
        <p className="text-base font-bold text-foreground">
          ${revenue.toLocaleString()}<span className="text-xs font-normal text-muted-foreground ml-1">/mo</span>
        </p>
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Net Profit</p>
        <p className={cn("text-base font-bold", profit >= 0 ? "text-green-700" : "text-red-600")}>
          {profit >= 0 ? "$" : "-$"}{Math.abs(Math.round(profit)).toLocaleString()}
          <span className="text-xs font-normal text-muted-foreground ml-1">{margin.toFixed(1)}%</span>
        </p>
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Ad Spend</p>
        <p className="text-base font-bold text-foreground">
          ${adSpend.toLocaleString()}<span className="text-xs font-normal text-muted-foreground ml-1">/mo</span>
        </p>
      </div>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="rounded-2xl bg-muted/40 h-24" />
      {[...Array(3)].map((_, i) => <div key={i} className="rounded-2xl bg-muted/40 h-28" />)}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { skus, meta, hydrated } = useSkus()

  const isDemo = meta.source === "demo"

  const alerts = hydrated ? generateRiskAlerts(skus) : []
  const health = hydrated ? getBusinessHealthScore(skus, alerts) : null
  const deltas = hydrated ? computeDeltas(skus, isDemo) : []

  const feedResult = hydrated ? getPriorityFeed(skus, alerts, isDemo) : { items: [], suppressedCount: 0, candidateCount: 0 }
  const feed            = feedResult.items
  const suppressedCount = feedResult.suppressedCount

  const yesterdayScore = hydrated
    ? isDemo ? DEMO_YESTERDAY_SCORE : loadYesterdayScore()
    : null

  const activeSkus   = skus.filter(s => s.status === "active")
  const totalRevenue = activeSkus.reduce((s, k) => s + k.monthlyRevenue,   0)
  const totalProfit  = activeSkus.reduce((s, k) => s + k.netProfitMonthly, 0)
  const totalAdSpend = activeSkus.reduce((s, k) => s + k.monthlyAdSpend,   0)

  // ─── Persistence map for timeline (rebuild from feed enrichment) ───────────
  // We need the raw AlertRecord map to pass to timeline components.
  // Re-derive it from alerts here (updatePersistence is idempotent for demo).
  const [persistMap, setPersistMap] = useState<PersistMap>(new Map())

  useEffect(() => {
    if (!hydrated) return
    // Dynamically import to avoid SSR issues
    import("@/lib/intelligence/persistence-tracker").then(({ updatePersistence }) => {
      setPersistMap(updatePersistence(alerts, isDemo))
    })
  }, [hydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Daily brief ──────────────────────────────────────────────────────────
  const [brief, setBrief] = useState<DailyBrief | null>(null)
  const didSaveSnapshot = useRef(false)

  useEffect(() => {
    if (!hydrated) return
    const b = buildDailyBrief(feed, isDemo)
    setBrief(b)
    // Save current feed as new snapshot after computing brief
    if (!didSaveSnapshot.current && !isDemo) {
      saveFeedSnapshot(feed)
      didSaveSnapshot.current = true
    } else if (!didSaveSnapshot.current && isDemo) {
      // For demo, save after first view so subsequent visits show "no change"
      // But only save if we have a real comparison (not using demo baseline)
      // This lets demo users see the "worsened" message once, then "no change"
      saveFeedSnapshot(feed)
      didSaveSnapshot.current = true
    }
  }, [hydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Intro overlay ────────────────────────────────────────────────────────
  const [showIntro, setShowIntro] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (isDemo) {
      try {
        if (!localStorage.getItem(INTRO_KEY)) setShowIntro(true)
      } catch { /* ignore */ }
    }
  }, [isDemo])

  // ─── Session survey ───────────────────────────────────────────────────────
  const interactionCount = useRef(0)
  const surveyScheduled  = useRef(false)
  const [showSurvey, setShowSurvey] = useState(false)
  const [surveyDone, setSurveyDone] = useState(false)

  function handleInteract() {
    interactionCount.current += 1
    if (interactionCount.current >= 2 && !surveyScheduled.current && !surveyDone) {
      surveyScheduled.current = true
      setTimeout(() => setShowSurvey(true), 3000)
    }
  }

  function handleSurveyClose() {
    setShowSurvey(false)
    setSurveyDone(true)
  }

  // ─── Trust instrumentation ────────────────────────────────────────────────
  const didTrackRender = useRef(false)
  useEffect(() => {
    if (!hydrated) return
    trackFeedVisit()
    if (feed.length > 0 && !didTrackRender.current) {
      trackFeedRendered(feed.map(i => ({ alertId: i.alertId, category: i.category, severity: i.severity })))
      didTrackRender.current = true
    }
  }, [hydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen flex-col bg-background">

      {showIntro && <FirstRunOverlay onDone={() => setShowIntro(false)} />}
      {showSurvey && !surveyDone && <SessionSurvey onClose={handleSurveyClose} />}

      <Navbar />

      {/* Data source banners */}
      {hydrated && isDemo && (
        <div className="border-b border-yellow-200 bg-yellow-50 px-6 py-2.5">
          <div className="mx-auto max-w-[1200px] flex items-center justify-between">
            <p className="text-xs text-yellow-800">
              <span className="font-semibold">Demo data</span> — Upload your CSV to run the risk engine on your real SKUs
            </p>
            <Link href="/data" className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-900 underline underline-offset-2 hover:text-yellow-700">
              <Upload className="h-3 w-3" />
              Import my data
            </Link>
          </div>
        </div>
      )}
      {hydrated && meta.source === "live" && (
        <div className="border-b border-green-200 bg-green-50 px-6 py-2.5">
          <div className="mx-auto max-w-[1200px]">
            <p className="text-xs text-green-800">
              <span className="font-semibold">Live data</span>
              {meta.filename && ` — ${meta.filename}`}
              {meta.rowCount && ` · ${meta.rowCount} SKUs`}
            </p>
          </div>
        </div>
      )}

      <main className="flex-1">
        <div className="mx-auto max-w-[1200px] px-6 py-8">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {!hydrated
                  ? "Loading your business state..."
                  : isDemo
                  ? `Demo portfolio · ${activeSkus.length} SKUs`
                  : `${activeSkus.length} active SKU${activeSkus.length !== 1 ? "s" : ""}${meta.filename ? ` · ${meta.filename}` : ""}`
                }
              </p>
            </div>
            <Link
              href="/advisor"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Zap className="h-4 w-4" />
              Ask AI Advisor
            </Link>
          </div>

          {!hydrated && <LoadingSkeleton />}

          {hydrated && (
            <>
              {/* Daily brief — the "since your last visit" intelligence */}
              {brief && <DailyBriefBanner brief={brief} />}

              {health && (
                <OperationalStateBar
                  health={health}
                  feed={feed}
                  deltas={deltas}
                  yesterdayScore={yesterdayScore}
                />
              )}

              <SinceYesterdayCard deltas={deltas} />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-bold text-foreground uppercase tracking-widest">
                    What needs attention now
                  </h2>
                  <div className="flex items-center gap-4">
                    {suppressedCount > 0 && (
                      <span className="text-[10px] text-muted-foreground/60">
                        {suppressedCount} signal{suppressedCount !== 1 ? "s" : ""} filtered
                      </span>
                    )}
                    {feed.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {feed.length} action{feed.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <PriorityFeed
                  items={feed}
                  suppressedCount={suppressedCount}
                  persistMap={persistMap}
                  onInteract={handleInteract}
                />
              </div>

              {isDemo && <TestCTA />}

              <KpiStrip revenue={totalRevenue} profit={totalProfit} adSpend={totalAdSpend} />
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
