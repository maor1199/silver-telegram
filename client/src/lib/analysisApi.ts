export interface RunAnalysisParams {
  keyword: string
  sellingPrice: number
  unitCost: number
  shippingCost: number
  differentiation?: string
  complexity?: string
}

// 1. הפונקציה שמושכת את הנתונים מה-API
export async function runAnalysis(params: RunAnalysisParams): Promise<Record<string, unknown>> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? `Analysis failed (${res.status})`)
  }

  return (await res.json()) as Record<string, unknown>
}

// 2. הפונקציה שהייתה חסרה - ה-"גשר" ל-UI
export function normalizeAnalysisResponse(data: any) {
  // כאן אנחנו מוודאים שהנתונים מה-Backend הופכים למבנה שה-UI של ה-V0 מצפה לו
  return {
    viabilityScore: data.viability_score ?? data.viabilityScore ?? 0,
    netProfit: data.net_profit ?? data.netProfit ?? 0,
    riskLevel: data.risk_level ?? data.riskLevel ?? "Medium",
    executionRoadmap: data.execution_roadmap ?? data.executionRoadmap ?? [],
  }
}