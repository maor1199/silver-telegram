# Integrating real analysis into v0-amz-mentor-ai

This guide explains how to keep the **v0-amz-mentor-ai** UI design and wire the **Analyze** button to the real backend (Gemini, Rainforest, OpenAI) using the logic from this repo.

## 1. Where the logic lives

There is **no** `v0-amz-mentor-ai` folder in this workspace. To inject the logic:

- **Option A:** Copy the portable module from this repo into your v0-amz-mentor-ai project.
- **Option B:** Add the v0-amz-mentor-ai project into this workspace (e.g. as a sibling folder or subfolder) and we can wire it there.

## 2. Portable module to copy

Copy this file into your v0-amz-mentor-ai app:

- **`client/src/integration/analysisApi.ts`**

It exports:

- `getAnalyzeApiBase()` – in dev returns `""` (so `/api` uses your proxy); in prod returns `VITE_API_URL`.
- `AnalyzeParams` – keyword, sellingPrice, unitCost, shippingCost, differentiation?, complexity?, etc.
- `AnalysisResult` – full result type (verdict, profitBreakdown, whyThisDecision, executionPlan, etc.).
- `normalizeAnalysisResponse(raw)` – normalizes API response (camelCase or snake_case).
- `runAnalysis(params, options?)` – calls `POST /api/analyze` and returns a normalized `AnalysisResult` (optional `accessToken` for saving reports).

## 3. Wire the Analyze button (v0-amz-mentor-ai)

In the screen where the user enters keyword, price, cost, etc.:

1. On **Analyze** click:
   - Build params: `{ keyword, sellingPrice, unitCost, shippingCost, differentiation?, complexity? }`.
   - Call `runAnalysis(params, { accessToken: session?.access_token })`.
   - On success: navigate to your results page with the result in state, e.g.  
     `navigate("/analyze/results", { state: { result } })`.
   - On error: show the thrown message (e.g. "Analysis failed" or status text).

2. **Results page:**
   - Read `location.state.result` (type: `AnalysisResult`).
   - Render verdict, profit cards (Net Profit, ROI, Amazon Fees from `result.profitBreakdown`), “Why This Decision” from `result.whyThisDecision`, and any other sections your v0 design uses.

## 4. Backend and env

- The **same** amz-mentor-ai server must serve `POST /api/analyze`. It already uses:
  - **Rainforest** (when `RAINFOREST_API_KEY` is set) for market data.
  - **OpenAI** for AI insights (e.g. “why this decision”).
  - **Gemini** is used in this repo for the Listing Builder; the analyze endpoint does not call Gemini directly but the analysis pipeline is the “real” one.
- In v0-amz-mentor-ai:
  - **Dev:** Use relative `/api` and proxy to the server (e.g. Vite `proxy: { '/api': 'http://localhost:3001' }`).
  - **Prod:** Set `VITE_API_URL` to your deployed server (e.g. `https://your-api.vercel.app`).

## 5. Request/response contract

**Request:** `POST /api/analyze`

```json
{
  "keyword": "cat cave",
  "sellingPrice": 44,
  "unitCost": 4,
  "shippingCost": 2,
  "differentiation": "optional",
  "complexity": "optional"
}
```

Optional header: `Authorization: Bearer <access_token>` to save the report for the user.

**Response:** Same shape as `AnalysisResult` (possibly with snake_case inside `report`). Use `normalizeAnalysisResponse(data)` so the UI always gets camelCase.

## 6. Summary

- Keep the v0-amz-mentor-ai design as-is.
- Add the analysis logic by copying `client/src/integration/analysisApi.ts` and calling `runAnalysis()` on Analyze, then passing `result` to your results page via navigation state.
- Point the frontend at the same backend (dev proxy + prod `VITE_API_URL`) so Analyze uses real Gemini, Rainforest, and OpenAI through the existing server.
