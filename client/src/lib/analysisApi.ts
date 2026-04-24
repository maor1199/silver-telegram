export interface RunAnalysisParams {
  keyword: string
  sellingPrice: number
  unitCost: number
  shippingCost: number
  differentiation?: string
  complexity?: string
  /** Optional: provide a specific ASIN to fetch real Keepa data instead of top SERP result */
  asin?: string
}

export interface RunAnalysisOptions {
  /** Pass the user's access token so the API can enforce usage limits and save to My Reports. */
  accessToken?: string | null
}

/** Thrown when the user has reached the free tier analysis limit (403). */
export class UsageLimitError extends Error {
  readonly status = 403
  readonly code = "USAGE_LIMIT"
  constructor(message: string) {
    super(message)
    this.name = "UsageLimitError"
  }
}

/** Thrown when the request is not authenticated (401). */
export class AuthRequiredError extends Error {
  readonly status = 401
  readonly code = "UNAUTHORIZED"
  constructor(message: string = "Authentication required.") {
    super(message)
    this.name = "AuthRequiredError"
  }
}

export async function runAnalysis(
  params: RunAnalysisParams,
  options?: RunAnalysisOptions
): Promise<Record<string, unknown>> {
  const token = options?.accessToken?.trim()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch("/api/analyze", {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({
      keyword: params.keyword,
      sellingPrice: params.sellingPrice,
      unitCost: params.unitCost,
      shippingCost: params.shippingCost,
      ...(params.differentiation != null && { differentiation: params.differentiation }),
      ...(params.complexity != null && { complexity: params.complexity }),
      ...(params.asin?.trim() && { asin: params.asin.trim().toUpperCase() }),
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string; code?: string }
    if (res.status === 401 || err.code === "UNAUTHORIZED") {
      throw new AuthRequiredError(err.error ?? "Your session expired or you're not signed in. Please log in again.")
    }
    if (res.status === 403 && err.code === "USAGE_LIMIT") {
      throw new UsageLimitError(err.error ?? "Usage limit reached.")
    }
    throw new Error(err.error ?? `Analysis failed (${res.status})`)
  }

  return (await res.json()) as Record<string, unknown>
}

// 2. Merge normalized camelCase fields into full backend response (so War Room gets verdict, report, etc.)
export function normalizeAnalysisResponse(data: any): Record<string, unknown> {
  if (!data || typeof data !== "object") return typeof data === "object" ? { ...data } : {}
  const report = (data.report && typeof data.report === "object" ? data.report : data) as Record<string, unknown>
  return {
    ...data,
    viabilityScore: data.viability_score ?? data.viabilityScore ?? 0,
    netProfit: data.net_profit ?? data.netProfit ?? 0,
    riskLevel: data.risk_level ?? data.riskLevel ?? "Medium",
    executionRoadmap: data.execution_roadmap ?? data.executionRoadmap ?? [],
    marketReality: data.marketReality ?? data.market_reality ?? report?.market_reality_check ?? report?.market_reality,
    earlyStrategyGuidance: data.earlyStrategyGuidance ?? data.early_strategy_guidance ?? report?.early_strategy_guidance ?? report?.earlyStrategyGuidance,
    premiumRiskWarning: data.premiumRiskWarning ?? data.premium_risk_warning ?? report?.premium_risk_warning ?? report?.premiumRiskWarning,
    advisorImplicationWhyThisDecision: data.advisorImplicationWhyThisDecision ?? report?.advisor_implication_why_this_decision ?? report?.advisorImplicationWhyThisDecision,
    advisorImplicationExpertInsight: data.advisorImplicationExpertInsight ?? report?.advisor_implication_expert_insight ?? report?.advisorImplicationExpertInsight,
    advisorImplicationWhatMostSellersMiss: data.advisorImplicationWhatMostSellersMiss ?? report?.advisor_implication_what_most_sellers_miss ?? report?.advisorImplicationWhatMostSellersMiss,
    advisorImplicationMarketSignals: data.advisorImplicationMarketSignals ?? report?.advisor_implication_market_signals ?? report?.advisorImplicationMarketSignals,
    advisorImplicationEntryReality: data.advisorImplicationEntryReality ?? report?.advisor_implication_entry_reality ?? report?.advisorImplicationEntryReality,
    advisorImplicationMarketDominationAnalysis: data.advisorImplicationMarketDominationAnalysis ?? report?.advisor_implication_market_domination_analysis ?? report?.advisorImplicationMarketDominationAnalysis,
    advisorImplicationCompetitionReality: data.advisorImplicationCompetitionReality ?? report?.advisor_implication_competition_reality ?? report?.advisorImplicationCompetitionReality,
    advisorImplicationOpportunity: data.advisorImplicationOpportunity ?? report?.advisor_implication_opportunity ?? report?.advisorImplicationOpportunity,
    advisorImplicationEarlyStrategyGuidance: data.advisorImplicationEarlyStrategyGuidance ?? report?.advisor_implication_early_strategy_guidance ?? report?.advisorImplicationEarlyStrategyGuidance,
  } as Record<string, unknown>
}