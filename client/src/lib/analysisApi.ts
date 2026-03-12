export interface RunAnalysisParams {
  keyword: string
  sellingPrice: number
  unitCost: number
  shippingCost: number
  differentiation?: string
  complexity?: string
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
  return {
    ...data,
    viabilityScore: data.viability_score ?? data.viabilityScore ?? 0,
    netProfit: data.net_profit ?? data.netProfit ?? 0,
    riskLevel: data.risk_level ?? data.riskLevel ?? "Medium",
    executionRoadmap: data.execution_roadmap ?? data.executionRoadmap ?? [],
  } as Record<string, unknown>
}