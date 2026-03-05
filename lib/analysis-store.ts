// Simple in-memory store to pass analysis results between pages
// This avoids URL params for large payloads and works with client-side navigation

type AnalysisResult = Record<string, unknown>

let storedResult: AnalysisResult | null = null

export function setAnalysisResult(result: AnalysisResult) {
  storedResult = result
  // Also persist to sessionStorage for page refreshes
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("amz_analysis_result", JSON.stringify(result))
    } catch {
      // Ignore storage errors
    }
  }
}

export function getAnalysisResult(): AnalysisResult | null {
  if (storedResult) return storedResult
  // Try sessionStorage fallback
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem("amz_analysis_result")
      if (stored) {
        storedResult = JSON.parse(stored)
        return storedResult
      }
    } catch {
      // Ignore parse errors
    }
  }
  return null
}

export function clearAnalysisResult() {
  storedResult = null
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem("amz_analysis_result")
    } catch {
      // Ignore storage errors
    }
  }
}
