/**
 * Portable analysis API logic for v0-amz-mentor-ai (or any frontend).
 * Copy this file into your v0 project and wire the "Analyze" button to runAnalysis().
 * Backend: same amz-mentor-ai server (Gemini, Rainforest, OpenAI).
 */

export type AnalysisResult = {
  ok: boolean;
  verdict: "GO" | "NO_GO";
  score: number;
  confidence: number;
  profitAfterAds: number;
  hasRealMarketData: boolean;
  marketSnapshot?: {
    avgPrice: number;
    avgRating: number;
    avgReviews: number;
    dominantBrand: boolean;
    topTitles?: string[];
    topPrices?: number[];
  };
  scoreBreakdown?: Record<string, string>;
  alternativeKeywords?: string[];
  whatWouldMakeGo?: string[];
  whyThisDecision: string[];
  reviewIntelligence: string[];
  marketTrends: string[];
  competition?: string[];
  differentiationIdeas: string[];
  advertisingReality: string[];
  profitabilityReality: string[];
  beginnerFit?: string[];
  risks?: string[];
  opportunities?: string[];
  executionPlan: string[];
  alternativeKeywordsWithCost?: { keyword: string; estimatedCpc: string; estimatedCpcDisplay?: string }[];
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
  sectionHelp?: Record<string, string>;
  clientConfig?: { showDebugPanel?: boolean };
  estimatedMargin?: string;
  financialStressTest?: string;
  strategicIntelligence?: string;
  premiumRiskWarning?: string;
  marketRealityCheck?: string;
  liveMarketComparison?: {
    avgPrice: number;
    avgReviews: number;
    topCompetitors?: { position: number; title: string; price: number; ratingsTotal: number }[];
    painPoints?: string[];
    marketDensity?: string;
    acosFloorUsed?: number;
    premiumRiskWarning?: string;
    marketRealityCheck?: string;
  };
  marketDensity?: string;
  acosFloorUsed?: number;
  marginThresholdPct?: number;
  operationalRiskBuffer?: number;
  ppcCompetitionFloor?: number;
  consultantSecret?: string;
  launchCapitalRequired?: number;
  launchCapitalBreakdown?: { inventory: number; ppcMarketing: number; vineAndMisc: number; total: number };
  launchCapitalConsultantInsight?: string;
  launchAdCostPerUnit?: number;
  differentiationScore?: "Weak" | "Strong";
  differentiationGapTip?: string;
  honeymoonRoadmap?: string[];
};

/** Form params for POST /api/analyze (matches server and client). */
export type AnalyzeParams = {
  keyword: string;
  sellingPrice: number;
  unitCost: number;
  shippingCost: number;
  differentiation?: string;
  complexity?: string;
  fbaFee?: number;
  assumedAcos?: number;
  stage?: string;
};

/** Return the base URL for the analyze API. Uses NEXT_PUBLIC_API_URL if set, otherwise falls back to ngrok dev URL. */
export function getAnalyzeApiBase(): string {
  const fallback = "https://unresuscitable-unskirted-shaniqua.ngrok-free.dev";
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.trim();
  }
  return fallback;
}

/** Normalize API response: accept top-level camelCase or report snake_case. */
export function normalizeAnalysisResponse(raw: unknown): AnalysisResult | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const report = (o.report ?? o) as Record<string, unknown>;
  const get = (camel: string, snake: string): unknown => o[camel] ?? report[camel] ?? report[snake] ?? o[snake];
  const arr = (x: unknown): string[] => (Array.isArray(x) ? x.map(String) : []);
  const rawVerdict = get("verdict", "verdict");
  const verdict: "GO" | "NO_GO" = rawVerdict === "GO" ? "GO" : "NO_GO";
  const score = Number(get("score", "score")) || 0;
  return {
    ok: o.ok !== false,
    verdict,
    score,
    confidence: Number(get("confidence", "confidence")) || 0,
    profitAfterAds: Number(get("profitAfterAds", "profit_after_ads")) || 0,
    hasRealMarketData: Boolean(get("hasRealMarketData", "has_real_market_data")),
    marketSnapshot: (get("marketSnapshot", "market_snapshot") ?? report.market_snapshot) as AnalysisResult["marketSnapshot"],
    scoreBreakdown: (get("scoreBreakdown", "score_breakdown") ?? report.score_breakdown) as Record<string, string>,
    alternativeKeywords: arr(get("alternativeKeywords", "alternative_keywords") ?? report.alternative_keywords),
    alternativeKeywordsWithCost: (get("alternativeKeywordsWithCost", "alternative_keywords_with_cost") ?? report.alternative_keywords_with_cost) as AnalysisResult["alternativeKeywordsWithCost"],
    whatWouldMakeGo: arr(get("whatWouldMakeGo", "what_would_make_go") ?? report.what_would_make_go),
    whyThisDecision: arr(get("whyThisDecision", "why_this_decision") ?? report.why_this_decision),
    reviewIntelligence: arr(get("reviewIntelligence", "review_intelligence") ?? report.review_intelligence),
    marketTrends: arr(get("marketTrends", "market_trends") ?? report.market_trends),
    competition: arr(get("competition", "competition") ?? report.competition),
    differentiationIdeas: arr(get("differentiationIdeas", "differentiation") ?? report.differentiation),
    advertisingReality: arr(get("advertisingReality", "advertising") ?? report.advertising),
    profitabilityReality: arr(get("profitabilityReality", "profitability") ?? report.profitability),
    beginnerFit: arr(get("beginnerFit", "beginner_fit") ?? report.beginner_fit),
    risks: arr(get("risks", "risks") ?? report.risks),
    opportunities: arr(get("opportunities", "opportunities") ?? report.opportunities),
    executionPlan: arr(get("executionPlan", "execution_plan") ?? report.execution_plan),
    profitBreakdown: (get("profitBreakdown", "profit_breakdown") ?? report.profit_breakdown) as AnalysisResult["profitBreakdown"],
    profitExplanation: (get("profitExplanation", "profit_explanation") ?? report.profit_explanation) as string,
    sectionHelp: (get("sectionHelp", "section_help") ?? report.section_help ?? {}) as Record<string, string>,
    clientConfig: (get("clientConfig", "client_config") ?? {}) as { showDebugPanel?: boolean },
    estimatedMargin: (get("estimatedMargin", "estimated_margin") ?? report.estimated_margin) as string | undefined,
    financialStressTest: (get("financialStressTest", "financial_stress_test") ?? report.financial_stress_test) as string | undefined,
    strategicIntelligence: (get("strategicIntelligence", "strategic_intelligence") ?? report.strategic_intelligence) as string | undefined,
    premiumRiskWarning: (get("premiumRiskWarning", "premium_risk_warning") ?? report.premium_risk_warning) as string | undefined,
    marketRealityCheck: (get("marketRealityCheck", "market_reality_check") ?? report.market_reality_check) as string | undefined,
    liveMarketComparison: (get("liveMarketComparison", "live_market_comparison") ?? report.live_market_comparison) as AnalysisResult["liveMarketComparison"],
    marketDensity: (get("marketDensity", "market_density") ?? report.market_density) as string | undefined,
    acosFloorUsed: typeof get("acosFloorUsed", "acos_floor_used") === "number" ? (get("acosFloorUsed", "acos_floor_used") as number) : undefined,
    marginThresholdPct: typeof get("marginThresholdPct", "margin_threshold_pct") === "number" ? (get("marginThresholdPct", "margin_threshold_pct") as number) : undefined,
    operationalRiskBuffer: typeof get("operationalRiskBuffer", "operational_risk_buffer") === "number" ? (get("operationalRiskBuffer", "operational_risk_buffer") as number) : undefined,
    ppcCompetitionFloor: typeof get("ppcCompetitionFloor", "ppc_competition_floor") === "number" ? (get("ppcCompetitionFloor", "ppc_competition_floor") as number) : undefined,
    consultantSecret: (get("consultantSecret", "consultant_secret") ?? report.consultant_secret) as string | undefined,
    launchCapitalRequired: typeof get("launchCapitalRequired", "launch_capital_required") === "number" ? (get("launchCapitalRequired", "launch_capital_required") as number) : undefined,
    launchCapitalBreakdown: (get("launchCapitalBreakdown", "launch_capital_breakdown") ?? report.launch_capital_breakdown) as AnalysisResult["launchCapitalBreakdown"],
    launchCapitalConsultantInsight: (get("launchCapitalConsultantInsight", "launch_capital_consultant_insight") ?? report.launch_capital_consultant_insight) as string | undefined,
    launchAdCostPerUnit: typeof get("launchAdCostPerUnit", "launch_ad_cost_per_unit") === "number" ? (get("launchAdCostPerUnit", "launch_ad_cost_per_unit") as number) : undefined,
    differentiationScore: (get("differentiationScore", "differentiation_score") ?? report.differentiation_score) as "Weak" | "Strong" | undefined,
    differentiationGapTip: (get("differentiationGapTip", "differentiation_gap_tip") ?? report.differentiation_gap_tip) as string | undefined,
    honeymoonRoadmap: Array.isArray(get("honeymoonRoadmap", "honeymoon_roadmap") ?? report.honeymoon_roadmap) ? ((get("honeymoonRoadmap", "honeymoon_roadmap") ?? report.honeymoon_roadmap) as string[]).map(String) : undefined,
  };
}

export type RunAnalysisOptions = {
  /** Optional Supabase (or other) access token for saving report. */
  accessToken?: string | null;
};

/**
 * Call the real backend POST /api/analyze (Gemini, Rainforest, OpenAI).
 * Use this when the user clicks "Analyze" on the main site.
 */
export async function runAnalysis(
  params: AnalyzeParams,
  options?: RunAnalysisOptions
): Promise<AnalysisResult> {
  const base = getAnalyzeApiBase();
  const url = `${base}/api/analyze`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options?.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;

  const body = {
    keyword: params.keyword.trim(),
    sellingPrice: Number(params.sellingPrice) || 0,
    unitCost: Number(params.unitCost) || 0,
    shippingCost: Number(params.shippingCost) || 0,
    differentiation: params.differentiation?.trim() || undefined,
    complexity: params.complexity || undefined,
    fbaFee: params.fbaFee,
    assumedAcos: params.assumedAcos,
    stage: params.stage,
  };

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(res.statusText || "Analysis failed");
  const data: unknown = await res.json();
  const normalized = normalizeAnalysisResponse(data);
  if (normalized) return normalized;
  return data as AnalysisResult;
}
