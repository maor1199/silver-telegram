export interface RunAnalysisParams {
  keyword: string
  sellingPrice: number
  unitCost: number
  shippingCost: number
  differentiation?: string
  complexity?: string
}

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
