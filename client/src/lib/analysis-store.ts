/**
 * Client-side store for analysis results.
 * Used by War Room when navigating directly (e.g. /analyze/results without state).
 */
let cachedResult: Record<string, unknown> | null = null;

export function getAnalysisResult(): Record<string, unknown> | null {
  return cachedResult;
}

export function setAnalysisResult(result: Record<string, unknown> | null) {
  cachedResult = result;
}
