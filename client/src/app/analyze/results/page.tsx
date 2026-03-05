/**
 * Analysis Results — v0-styled layout.
 * Route: /analyze/results (see App.tsx). Uses runAnalysis() when state.analyzeParams present; else state.result or fallback.
 */
import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  AlertTriangle,
  Download,
  Loader2,
} from "lucide-react";
import { runAnalysis, type AnalysisResult, type AnalyzeParams as ApiAnalyzeParams } from "../../../integration/analysisApi";
import { AnalysisProfitCards } from "../../../components/analysis-profit-cards";

/** Params to trigger real analysis from this page (e.g. passed via navigate state). */
export type AnalyzeParams = {
  keyword?: string;
  sellingPrice?: number;
  unitCost?: number;
  shippingCost?: number;
  fbaFee?: number;
  assumedAcos?: number;
  complexity?: string;
  differentiation?: string;
};

/** Map normalized AnalysisResult (from runAnalysis) to WarRoomResult for display. */
function analysisResultToWarRoom(r: AnalysisResult): WarRoomResult {
  return {
    ok: r.ok,
    verdict: r.verdict,
    score: r.score,
    profitAfterAds: r.profitAfterAds,
    hasRealMarketData: r.hasRealMarketData,
    estimatedMargin: r.estimatedMargin,
    financialStressTest: r.financialStressTest,
    strategicIntelligence: r.strategicIntelligence,
    marketRealityCheck: r.marketRealityCheck,
    consultantSecret: r.consultantSecret,
    launchCapitalRequired: r.launchCapitalRequired,
    launchAdCostPerUnit: r.launchAdCostPerUnit,
    launchCapitalBreakdown: r.launchCapitalBreakdown,
    launchCapitalConsultantInsight: r.launchCapitalConsultantInsight,
    differentiationScore: r.differentiationScore,
    differentiationGapTip: r.differentiationGapTip,
    honeymoonRoadmap: r.honeymoonRoadmap,
    executionPlan: r.executionPlan,
    netProfit: r.profitAfterAds,
    roi: undefined,
    profitBreakdown: r.profitBreakdown,
    profitExplanation: r.profitExplanation,
    marginThresholdPct: r.marginThresholdPct,
    liveMarketComparison: r.liveMarketComparison,
    marketSnapshot: r.marketSnapshot,
    whatWouldMakeGo: r.whatWouldMakeGo,
    alternativeKeywordsWithCost: r.alternativeKeywordsWithCost,
    alternativeKeywords: r.alternativeKeywords,
    whyThisDecision: r.whyThisDecision,
    reviewIntelligence: r.reviewIntelligence,
    marketTrends: r.marketTrends,
    differentiationIdeas: r.differentiationIdeas,
    advertisingReality: r.advertisingReality,
    competition: r.competition,
    profitabilityReality: r.profitabilityReality,
    beginnerFit: r.beginnerFit,
    risks: r.risks,
    opportunities: r.opportunities,
    sectionHelp: r.sectionHelp,
    operationalRiskBuffer: r.operationalRiskBuffer,
    ppcCompetitionFloor: r.ppcCompetitionFloor,
    premiumRiskWarning: r.premiumRiskWarning,
  };
}

export type WarRoomResult = {
  ok: boolean;
  verdict?: "GO" | "NO_GO";
  score?: number;
  profitAfterAds?: number;
  hasRealMarketData?: boolean;
  estimatedMargin?: string;
  financialStressTest?: string;
  strategicIntelligence?: string;
  marketRealityCheck?: string;
  consultantSecret?: string;
  launchCapitalRequired?: number;
  launchAdCostPerUnit?: number;
  launchCapitalBreakdown?: { inventory: number; ppcMarketing: number; vineAndMisc: number; total: number };
  launchCapitalConsultantInsight?: string;
  differentiationScore?: "Weak" | "Strong";
  differentiationGapTip?: string;
  honeymoonRoadmap?: string[];
  executionPlan?: string[];
  /** From result.report.netProfit (or profit calculation in report) */
  netProfit?: number;
  /** From result.report.roi */
  roi?: number;
  profitBreakdown?: {
    sellingPrice: number;
    referralFee: number;
    fbaFee: number;
    cogs: number;
    ppcCostPerUnit: number;
    assumedAcosPercent: number;
    profitAfterAds: number;
  };
  profitExplanation?: string;
  marginThresholdPct?: number;
  liveMarketComparison?: {
    avgPrice?: number;
    avgRating?: number;
    avgReviews?: number;
    topCompetitors?: { position: number; title: string; price: number; ratingsTotal: number }[];
    painPoints?: string[];
    marketDensity?: string;
    acosFloorUsed?: number;
  };
  marketSnapshot?: { avgPrice?: number; avgRating?: number; avgReviews?: number };
  whatWouldMakeGo?: string[];
  alternativeKeywordsWithCost?: { keyword: string; estimatedCpc: string; estimatedCpcDisplay?: string }[];
  alternativeKeywords?: string[];
  whyThisDecision?: string[];
  reviewIntelligence?: string[];
  marketTrends?: string[];
  differentiationIdeas?: string[];
  advertisingReality?: string[];
  competition?: string[];
  profitabilityReality?: string[];
  beginnerFit?: string[];
  risks?: string[];
  opportunities?: string[];
  sectionHelp?: Record<string, string>;
  operationalRiskBuffer?: number;
  ppcCompetitionFloor?: number;
  premiumRiskWarning?: string;
};

/** Baseline (Yoga Mat) data when location.state.result is missing. This page NEVER fetches — state or fallback only. */
const BASELINE_FALLBACK: WarRoomResult = {
  ok: true,
  verdict: "NO_GO",
  score: 45,
  profitAfterAds: 1.85,
  estimatedMargin: "12–18%",
  financialStressTest: "Yoga mat segment: thin margins; 15% net margin rule suggests GO only with strong differentiation or lower COGS.",
  strategicIntelligence: "Yoga mat market is crowded. Golden 80: place 'yoga mat', 'non-slip', 'eco-friendly' in first 80 chars. A9 synergy: focus on thickness (6mm) and material in bullets.",
  marketRealityCheck: "Competitive space; average price $18–28. Differentiation via material (TPE/NBR), thickness, and carrying strap drives conversion.",
  consultantSecret: "Lead with thickness and 'non-slip' in the main image and first bullet — that's where this category gets returned.",
  launchCapitalRequired: 4200,
  launchAdCostPerUnit: 4.2,
  honeymoonRoadmap: ["Week 1: Vine enrollment; 2 units for reviews.", "Week 2–3: Manual exact PPC on 'yoga mat', 'non slip yoga mat'.", "Week 4: Green coupon 10% to spike velocity."],
  differentiationScore: "Weak",
  differentiationGapTip: "Add specific material (e.g. TPE) and thickness in title; align with pain points from top 10 titles.",
  executionPlan: ["Enroll in Vine; send 2 units.", "Launch manual exact on top 3 keywords.", "Add Green Coupon after first reviews."],
  whyThisDecision: ["Margin meets 15% at current inputs.", "Market is competitive; differentiation needed."],
  reviewIntelligence: ["Buyers mention 'slipping' and 'thickness'; address in bullets."],
  marketTrends: ["Eco materials trending.", "6mm+ thickness preferred."],
  differentiationIdeas: ["TPE material vs NBR.", "Carry strap.", "Alignment lines."],
  advertisingReality: ["CPC ~$0.80–1.20 for 'yoga mat'."],
  profitabilityReality: ["FBA + referral ~$8–10 per unit at $22."],
  risks: ["Saturation; price pressure."],
  opportunities: ["Premium TPE segment under-served."],
};

function downloadReport(displayResult: WarRoomResult) {
  const lines: string[] = [
    "# Product Analysis Report (War Room)",
    "",
    `**Verdict:** ${displayResult.verdict ?? "—"} · Score: ${displayResult.score ?? "—"}/100`,
    `**Profit after ads:** $${Number(displayResult.profitAfterAds ?? 0).toFixed(2)}`,
    displayResult.estimatedMargin != null ? `**Net margin:** ${displayResult.estimatedMargin}` : "",
    "",
    "## Financial Stress Test",
    displayResult.financialStressTest ?? "—",
    "",
    "## Strategic Intelligence",
    displayResult.strategicIntelligence ?? "—",
  ];
  if (displayResult.premiumRiskWarning) lines.push("", "## Premium Risk", displayResult.premiumRiskWarning);
  if (displayResult.marketRealityCheck) lines.push("", "## Market Reality Check", displayResult.marketRealityCheck);
  if (displayResult.consultantSecret) lines.push("", "## Insider Tip", displayResult.consultantSecret);
  if (displayResult.operationalRiskBuffer != null || displayResult.ppcCompetitionFloor != null) {
    lines.push("", "## Professional Audit Adjustments");
    if (displayResult.operationalRiskBuffer != null) lines.push(`Operational Risk Buffer: +$${displayResult.operationalRiskBuffer.toFixed(2)}`);
    if (displayResult.ppcCompetitionFloor != null) lines.push(`PPC Competition Floor: ${(displayResult.ppcCompetitionFloor * 100).toFixed(0)}% ACoS`);
  }
  const lmc = displayResult.liveMarketComparison;
  if (lmc) {
    lines.push("", "## Live Market Comparison", `Market avg price: $${lmc.avgPrice?.toFixed(2) ?? "—"} · Avg reviews: ${lmc.avgReviews?.toLocaleString() ?? "—"}`);
    if (lmc.topCompetitors?.length) {
      lines.push("### Top competitors");
      lmc.topCompetitors.forEach((c) => lines.push(`- $${c.price?.toFixed(2)} · ${c.ratingsTotal?.toLocaleString()} reviews — ${String(c.title).slice(0, 60)}…`));
    }
    if (lmc.painPoints?.length) lines.push("", "Pain points: " + lmc.painPoints.join(", "));
  }
  lines.push("", "---", "Why this decision:", ...((displayResult.whyThisDecision ?? []).map((s) => `- ${s}`)));
  const blob = new Blob([lines.filter(Boolean).join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `war-room-report-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyzeResultsPage() {
  const location = useLocation();
  const [hasMounted, setHasMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [displayResult, setDisplayResult] = useState<WarRoomResult | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [intelTab, setIntelTab] = useState<"Review Intelligence" | "Market Trends" | "Competition">("Review Intelligence");

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Use state.result if present; else if state.analyzeParams, call /api/analyze (loading until done); else BASELINE_FALLBACK.
  useEffect(() => {
    if (!hasMounted) return;
    let cancelled = false;
    setLoading(true);

    const stateResult = (location.state as { result?: AnalysisResult | WarRoomResult })?.result;
    const analyzeParams = (location.state as { analyzeParams?: AnalyzeParams })?.analyzeParams;

    if (stateResult && stateResult.ok !== false) {
      setDisplayResult(analysisResultToWarRoom(stateResult as AnalysisResult));
      setUsedFallback(false);
      setLoading(false);
      return;
    }

    if (analyzeParams) {
      (async () => {
        try {
          const { supabase } = await import("../../../lib/supabase");
          const session = supabase ? (await supabase.auth.getSession()).data.session : null;
          const params: ApiAnalyzeParams = {
            keyword: (analyzeParams.keyword ?? "").trim(),
            sellingPrice: Number(analyzeParams.sellingPrice) || 0,
            unitCost: Number(analyzeParams.unitCost) || 0,
            shippingCost: Number(analyzeParams.shippingCost) || 0,
            fbaFee: analyzeParams.fbaFee,
            assumedAcos: analyzeParams.assumedAcos,
            complexity: analyzeParams.complexity,
            differentiation: analyzeParams.differentiation?.trim(),
          };
          const result = await runAnalysis(params, { accessToken: session?.access_token ?? undefined });
          if (cancelled) return;
          setDisplayResult(analysisResultToWarRoom(result));
          setUsedFallback(false);
        } catch {
          if (!cancelled) {
            setDisplayResult(BASELINE_FALLBACK);
            setUsedFallback(true);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    setDisplayResult(BASELINE_FALLBACK);
    setUsedFallback(true);
    setLoading(false);
  }, [hasMounted, location.state]);

  if (!hasMounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-2xl space-y-6 p-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-amber-500" aria-hidden />
            <p className="mt-4 text-slate-600">Calculating… server is running your analysis.</p>
            <Link to="/" className="mt-4 inline-block rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Back to Analysis
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!displayResult) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-2xl space-y-6 p-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">Data not found. Run an analysis from the home page.</p>
            <Link to="/" className="mt-4 inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">
              Back to Analysis
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pb = displayResult.profitBreakdown;
  const lmc = displayResult.liveMarketComparison ?? displayResult.marketSnapshot;
  const avgPrice = lmc?.avgPrice ?? displayResult.marketSnapshot?.avgPrice;
  const avgRating = lmc?.avgRating ?? displayResult.marketSnapshot?.avgRating;
  const avgReviews = lmc?.avgReviews ?? displayResult.marketSnapshot?.avgReviews;

  // White/Light War Room — layout, fonts, colors preserved; all data from /api/analyze
  const cardClass = "rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm";
  const cardTitleClass = "mb-4 text-sm font-bold uppercase tracking-widest text-amber-600";
  const metricLabelClass = "text-xs font-semibold uppercase tracking-wider text-slate-500";

  return (
    <div key="war-room-light" className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl space-y-8 p-6">
        {/* Header — War Room white */}
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-t-2xl border-2 border-b-2 border-slate-200 border-b-amber-500/40 bg-white px-6 pb-4 pt-6 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">War Room — Strategic Intelligence</h1>
          <div className="flex items-center gap-3">
            {displayResult.hasRealMarketData && (
              <span className="rounded-full border border-emerald-400 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">LIVE DATA</span>
            )}
            <button type="button" onClick={() => downloadReport(displayResult)} className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Download className="h-4 w-4" /> Download
            </button>
            <Link to="/" className="rounded-lg border-2 border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">← Back</Link>
          </div>
        </header>

        {usedFallback && (
          <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-50 p-4 text-center">
            <p className="text-sm font-medium text-amber-800">Data not found (e.g. page refreshed). Showing baseline. Run analysis for your product.</p>
            <Link to="/" className="mt-2 inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600">Run Analysis</Link>
          </div>
        )}

        {/* 1. Verdict + key metrics — server data */}
        <section className={cardClass}>
          <h2 className={cardTitleClass}>The Verdict</h2>
          <div className="flex flex-wrap items-center gap-6">
            <div className={`rounded-xl border-2 px-8 py-4 text-2xl font-bold tracking-tight ${(displayResult.verdict ?? "NO_GO") === "GO" ? "border-emerald-500 bg-emerald-600 text-white" : "border-red-500 bg-red-600 text-white"}`}>
              {(displayResult.verdict ?? "NO_GO") === "GO" ? "GO" : "NO-GO"}
            </div>
            <div className="rounded-xl border-2 border-amber-500/50 bg-amber-50 px-6 py-3">
              <div className="text-2xl font-bold text-amber-700">{Number(displayResult.score) ?? 0}/100</div>
              <div className={metricLabelClass}>Survival Score</div>
            </div>
            <div className="rounded-xl border-2 border-slate-200 bg-slate-50 px-6 py-3">
              <div className="text-xl font-bold text-slate-900">{typeof displayResult.launchCapitalRequired === "number" ? `$${displayResult.launchCapitalRequired.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "—"}</div>
              <div className={metricLabelClass}>Launch Capital</div>
            </div>
            <div className="rounded-xl border-2 border-slate-200 bg-slate-50 px-6 py-3">
              <div className="text-xl font-bold text-slate-900">{typeof displayResult.launchAdCostPerUnit === "number" ? `$${displayResult.launchAdCostPerUnit.toFixed(2)}` : "—"}</div>
              <div className={metricLabelClass}>Ad Cost/Unit</div>
            </div>
            {displayResult.estimatedMargin != null && displayResult.estimatedMargin !== "" && (
              <div className="rounded-xl border-2 border-slate-200 bg-slate-50 px-6 py-3">
                <div className="text-xl font-bold text-slate-900">Net margin {displayResult.estimatedMargin}</div>
              </div>
            )}
          </div>
        </section>

        {/* 2. Net Profit / ROI / Amazon Fees — from result.report */}
        <AnalysisProfitCards
          netProfit={displayResult.netProfit ?? displayResult.profitAfterAds}
          roi={displayResult.roi}
          amazonFees={displayResult.profitBreakdown ? displayResult.profitBreakdown.fbaFee + displayResult.profitBreakdown.referralFee : undefined}
          profitBreakdown={displayResult.profitBreakdown}
          profitAfterAds={displayResult.profitAfterAds}
        />

        {/* 3. Why This Decision — real Gemini insights from server (why_this_decision) */}
        <section className={cardClass}>
          <h2 className={cardTitleClass}>Why This Decision — The Mentor&apos;s Take</h2>
          <ul className="space-y-2 text-sm font-medium text-slate-800">
            {(displayResult.whyThisDecision ?? []).map((item, i) => (
              <li key={i} className="flex gap-2"><span className="text-amber-500">•</span>{item}</li>
            ))}
          </ul>
          {displayResult.premiumRiskWarning != null && displayResult.premiumRiskWarning !== "" && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border-2 border-amber-500 bg-amber-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-700">Premium Risk (Price vs Market)</div>
                <p className="mt-1 text-sm text-slate-800">{displayResult.premiumRiskWarning}</p>
              </div>
            </div>
          )}
          <div className="mt-4 rounded-xl border-2 border-red-600 bg-red-50 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-red-700">A9 Algorithm Synergy — <span className="font-extrabold">The Death Spiral</span></div>
            <p className="mt-1 text-sm font-medium text-slate-800">High price → lower conversion rate → rank drop → fewer impressions → fewer sales. Break the spiral with clear differentiation and conversion-focused copy.</p>
          </div>
        </section>

        {/* 4. Profit table — Selling Price, Fees, Net Profit from server (profit_breakdown) */}
        <section className={cardClass}>
          <h2 className={cardTitleClass}>Profit Breakdown — Unit Economics</h2>
          {pb ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-200">
                    <tr><td className="py-2 text-slate-600">Selling Price</td><td className="py-2 text-right font-bold text-slate-900">${pb.sellingPrice.toFixed(2)}</td></tr>
                    <tr><td className="py-2 text-slate-600">− Fees (Referral 15% + FBA)</td><td className="py-2 text-right font-medium text-slate-800">${(pb.referralFee + pb.fbaFee).toFixed(2)}</td></tr>
                    <tr><td className="py-2 text-slate-600">− COGS</td><td className="py-2 text-right font-medium text-slate-800">${pb.cogs.toFixed(2)}</td></tr>
                    <tr><td className="py-2 text-slate-600">− PPC (ACoS {pb.assumedAcosPercent}%)</td><td className="py-2 text-right font-medium text-slate-800">${pb.ppcCostPerUnit.toFixed(2)}</td></tr>
                    <tr className="border-t-2 border-amber-500/50"><td className="py-3 font-bold text-amber-700">Net Profit</td><td className="py-3 text-right text-lg font-bold text-amber-700">${pb.profitAfterAds.toFixed(2)}</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 rounded-xl border-2 border-amber-500/30 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-800">Profit fragility: a 2% drop in conversion rate can erase this margin. Protect CR with strong main image and first bullet.</p>
              </div>
              {displayResult.profitExplanation != null && displayResult.profitExplanation !== "" && (
                <p className="mt-3 text-xs text-slate-600">{displayResult.profitExplanation}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">Run an analysis with price and COGS to see unit economics.</p>
          )}
        </section>

        {/* 5. Market Reality */}
        <section className={`${cardClass} overflow-hidden`}>
          <h2 className="border-b-2 border-slate-200 p-4 text-sm font-bold uppercase tracking-widest text-amber-600">Market Reality — The Intel</h2>
          {(avgPrice != null || avgReviews != null || avgRating != null) && (
            <div className="grid grid-cols-3 gap-4 border-b border-slate-200 p-4">
              <div className="rounded-lg border-2 border-slate-200 bg-slate-50 p-3 text-center">
                <div className="text-lg font-bold text-slate-900">${avgPrice?.toFixed(2) ?? "—"}</div>
                <div className={metricLabelClass}>Avg Price</div>
              </div>
              <div className="rounded-lg border-2 border-slate-200 bg-slate-50 p-3 text-center">
                <div className="text-lg font-bold text-slate-900">{avgRating != null ? avgRating.toFixed(1) : "—"}</div>
                <div className={metricLabelClass}>Avg Rating</div>
              </div>
              <div className="rounded-lg border-2 border-slate-200 bg-slate-50 p-3 text-center">
                <div className="text-lg font-bold text-slate-900">{avgReviews != null ? avgReviews.toLocaleString() : "—"}</div>
                <div className={metricLabelClass}>Avg Reviews</div>
              </div>
            </div>
          )}
          <div className="flex border-b border-slate-200">
            {(["Review Intelligence", "Market Trends", "Competition"] as const).map((tab) => (
              <button key={tab} type="button" onClick={() => setIntelTab(tab)} className={`flex-1 px-4 py-3 text-sm font-bold transition ${intelTab === tab ? "border-b-2 border-amber-500 bg-amber-50/50 text-slate-900" : "text-slate-500 hover:bg-slate-50"}`}>{tab}</button>
            ))}
          </div>
          <div className="min-h-[140px] p-6">
            {intelTab === "Review Intelligence" && (
              <ul className="space-y-2 text-sm text-slate-700">{(displayResult.reviewIntelligence ?? []).map((item, i) => <li key={i} className="flex gap-2"><span className="text-amber-500">•</span>{item}</li>)}</ul>
            )}
            {intelTab === "Market Trends" && (
              <ul className="space-y-2 text-sm text-slate-700">{(displayResult.marketTrends ?? []).map((item, i) => <li key={i} className="flex gap-2"><span className="text-amber-500">•</span>{item}</li>)}</ul>
            )}
            {intelTab === "Competition" && (
              <div className="space-y-3">
                {(displayResult.competition ?? []).length > 0 ? (displayResult.competition ?? []).map((item, i) => <p key={i} className="text-sm text-slate-700">• {item}</p>) : null}
                {(displayResult.liveMarketComparison?.topCompetitors?.length ?? 0) > 0 && (
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    {(displayResult.liveMarketComparison?.topCompetitors ?? []).slice(0, 5).map((c: { position: number; title: string; price: number; ratingsTotal: number }, i: number) => (
                      <li key={i}>{c.position}. ${c.price?.toFixed(2)} · {c.ratingsTotal?.toLocaleString()} reviews — {String(c.title).slice(0, 50)}…</li>
                    ))}
                  </ul>
                )}
                {!displayResult.competition?.length && !displayResult.liveMarketComparison?.topCompetitors?.length && <p className="text-sm text-slate-500">No competition data. Run analysis with live data.</p>}
              </div>
            )}
          </div>
        </section>

        {/* 6. Strategic Intelligence */}
        <section className={cardClass}>
          <h2 className={cardTitleClass}>Strategic Intelligence — The Moat</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border-2 border-red-500/40 bg-red-50 p-4">
              <div className="mb-2 text-xs font-bold uppercase text-red-700">Risks</div>
              <ul className="space-y-1 text-sm text-slate-800">{(displayResult.risks ?? []).map((item, i) => <li key={i}>• {item}</li>)}</ul>
            </div>
            <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-50 p-4">
              <div className="mb-2 text-xs font-bold uppercase text-emerald-700">Opportunities</div>
              <ul className="space-y-1 text-sm text-slate-800">{(displayResult.opportunities ?? []).map((item, i) => <li key={i}>• {item}</li>)}</ul>
            </div>
          </div>
          <div className="mt-4 rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase text-slate-600">Differentiation</div>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">{(displayResult.differentiationIdeas ?? []).map((item, i) => <li key={i}>• {item}</li>)}</ul>
            {displayResult.differentiationGapTip != null && displayResult.differentiationGapTip !== "" && (
              <p className="mt-2 text-sm text-slate-600">{displayResult.differentiationGapTip}</p>
            )}
          </div>
          {displayResult.consultantSecret != null && displayResult.consultantSecret !== "" && (
            <div className="mt-4 flex gap-3 rounded-xl border-2 border-amber-500/40 bg-amber-50 p-4">
              <span className="shrink-0 text-2xl" aria-hidden>💡</span>
              <div>
                <div className="text-xs font-bold uppercase text-amber-700">Insider Wisdom</div>
                <p className="mt-1 text-sm italic text-amber-900/90">{displayResult.consultantSecret}</p>
              </div>
            </div>
          )}
        </section>

        {/* 7. Execution Plan */}
        <section className={cardClass}>
          <h2 className={cardTitleClass}>Execution Plan — The Tactical Roadmap (Day 1–30)</h2>
          <ol className="space-y-4">
            {(displayResult.honeymoonRoadmap ?? displayResult.executionPlan ?? []).slice(0, 3).map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-amber-500/50 bg-amber-50 text-sm font-bold text-amber-700">{i + 1}</span>
                <span className="pt-1.5 text-sm font-medium text-slate-800">{step}</span>
              </li>
            ))}
          </ol>
          {!(displayResult.honeymoonRoadmap?.length || displayResult.executionPlan?.length) && (
            <p className="text-sm text-slate-500">Vine → Exact Match PPC → Green Coupons. Run analysis for your product roadmap.</p>
          )}
        </section>

        {/* 8. What Would Make GO & Alt Keywords */}
        <section className={cardClass}>
          <h2 className={cardTitleClass}>What Would Make This a GO & Alt Keywords</h2>
          {(displayResult.whatWouldMakeGo?.length ?? 0) > 0 && (
            <div className="mb-4">
              <ul className="space-y-2 text-sm font-medium text-slate-800">{(displayResult.whatWouldMakeGo ?? []).map((item, i) => <li key={i} className="flex gap-2"><span className="text-amber-500">•</span>{item}</li>)}</ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {(displayResult.alternativeKeywordsWithCost ?? displayResult.alternativeKeywords?.map((kw) => ({ keyword: kw, estimatedCpc: "" })) ?? []).map((item, i) => {
              const cpc = (item as { estimatedCpcDisplay?: string }).estimatedCpcDisplay ?? item.estimatedCpc;
              return (
                <span key={i} className="rounded-lg border-2 border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">{item.keyword}{cpc ? ` · ${cpc}` : ""}</span>
              );
            })}
          </div>
          {!(displayResult.alternativeKeywordsWithCost?.length || displayResult.alternativeKeywords?.length) && !(displayResult.whatWouldMakeGo?.length) && (
            <p className="text-sm text-slate-500">Run analysis to see what would make this a GO and alternative keywords.</p>
          )}
        </section>
      </div>
    </div>
  );
}
