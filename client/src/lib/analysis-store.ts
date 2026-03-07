/**
 * Client-side store for analysis results.
 * Persisted to sessionStorage so the last result survives refresh and new tabs.
 */
const STORAGE_KEY = "amz-mentor-analysis-result";

function readStored(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

let cachedResult: Record<string, unknown> | null = null;

export function getAnalysisResult(): Record<string, unknown> | null {
  if (cachedResult != null) return cachedResult;
  cachedResult = readStored();
  return cachedResult;
}

export function setAnalysisResult(result: Record<string, unknown> | null) {
  cachedResult = result;
  if (typeof window === "undefined") return;
  try {
    if (result == null) sessionStorage.removeItem(STORAGE_KEY);
    else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch {
    // ignore quota / private mode
  }
}
