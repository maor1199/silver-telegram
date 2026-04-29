import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { normalizeAnalysisResponse } from "@/lib/analysisApi"
import { createClient, createClientWithToken } from "@/lib/supabase/server"
import { analyzeProduct } from "@/lib/analyze/analyzeAgent"
import { getMarginThreshold } from "@/lib/analyze/openaiService"
import { getMarketData } from "@/lib/analyze/marketDataProvider"
import { getKeepaData } from "@/lib/keepa/keepaService"
import { getDataForSEOData, getRelatedKeywords } from "@/lib/dataforseo/dataForSeoService"

const FREE_TIER_ANALYSIS_LIMIT = 5
/** Emails that bypass the free-tier limit (unlimited analyses). */
const UNLIMITED_ANALYSIS_EMAILS = new Set(
  (process.env.UNLIMITED_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
)

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    let accessToken = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim()

    if (!accessToken) {
      const cookieStore = await cookies()
      const supabaseFromCookies = await createClient(cookieStore)
      const { data: { session } } = await supabaseFromCookies.auth.getSession()
      accessToken = session?.access_token?.trim() ?? undefined
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required.", code: "UNAUTHORIZED" },
        { status: 401, headers: { "X-Auth-Failure": "no-token" } }
      )
    }

    const supabaseAnon = await createClient()
    const { data: { user } } = await supabaseAnon.auth.getUser(accessToken)
    if (!user?.id) {
      return NextResponse.json(
        { error: "Invalid or expired session.", code: "UNAUTHORIZED" },
        { status: 401, headers: { "X-Auth-Failure": "invalid-token" } }
      )
    }

    const supabase = createClientWithToken(accessToken)

    const { data: usageRow } = await supabase
      .from("user_usage")
      .select("analysis_count")
      .eq("user_id", user.id)
      .single()

    const currentCount = usageRow?.analysis_count ?? 0
    const hasUnlimited = user?.email && UNLIMITED_ANALYSIS_EMAILS.has(user.email.toLowerCase())
    if (!hasUnlimited && currentCount >= FREE_TIER_ANALYSIS_LIMIT) {
      return NextResponse.json(
        {
          error: "You have reached the free tier limit of 5 analyses. Upgrade to PRO for unlimited analyses.",
          code: "USAGE_LIMIT",
        },
        { status: 403 }
      )
    }

    const keyword = body.keyword ?? body.product ?? body.search_term ?? "cat cave"
    const sellingPrice = Number(body.sellingPrice ?? body.price ?? 44) || 44
    const unitCost = Number(body.unitCost ?? body.cost ?? 4) || 4
    const shippingCost = Number(body.shippingCost ?? body.shipping ?? 2) || 2
    // Supplier fields — optional, improve launch capital accuracy
    const moq = body.moq != null && Number(body.moq) > 0 ? Number(body.moq) : undefined
    const leadTimeWeeks = body.leadTimeWeeks != null && Number(body.leadTimeWeeks) > 0 ? Number(body.leadTimeWeeks) : undefined
    const sampleCost = body.sampleCost != null && Number(body.sampleCost) > 0 ? Number(body.sampleCost) : undefined
    // ASIN override: if user provides a specific ASIN, use it for Keepa (more accurate than SERP top result)
    const userAsin = typeof body.asin === "string" && /^[A-Z0-9]{10}$/.test(body.asin.trim()) ? body.asin.trim() : null

    const marketData = await getMarketData(typeof keyword === "string" ? keyword : "cat cave")
    if (!marketData.success) {
      console.warn("[Analyze] Using stub market data — new fields will show placeholders. Check Vercel → Logs after running analysis to see why.")
    }

    const marginThreshold = getMarginThreshold(
      body.differentiation ?? "",
      marketData?.topTitles ?? [],
      marketData?.painPoints ?? []
    )

    // Fetch Keepa + DataForSEO in parallel — both feed into the verdict.
    // Priority for Keepa: user-provided ASIN > top ASIN from SERP results.
    const keepaAsin = userAsin ?? marketData?.topAsins?.[0]
    const kwStr = typeof keyword === "string" ? keyword : "cat cave"
    const [keepaResult, dataForSEOResult, relatedKwResult] = await Promise.allSettled([
      keepaAsin ? getKeepaData(keepaAsin) : Promise.resolve(null),
      getDataForSEOData(kwStr),
      getRelatedKeywords(kwStr, 8),
    ])
    const keepaData       = keepaResult.status === "fulfilled"      ? keepaResult.value       : null
    const dataForSEOData  = dataForSEOResult.status === "fulfilled"  ? dataForSEOResult.value  : null
    const relatedKeywords = relatedKwResult.status === "fulfilled"   ? relatedKwResult.value   : []
    if (keepaAsin) {
      console.log(`[Keepa] ASIN ${keepaAsin}${userAsin ? " (user)" : " (SERP)"}:`, keepaData ? `BSR trend: ${keepaData.bsrTrend}, est. sales: ${keepaData.estimatedMonthlySales}` : "null")
    }
    if (keepaResult.status === "rejected") console.warn("[Keepa] Fetch failed:", keepaResult.reason)
    if (dataForSEOResult.status === "rejected") console.warn("[DataForSEO] Fetch failed:", dataForSEOResult.reason)

    const [result, _unused] = await Promise.allSettled([
      analyzeProduct({
      keyword: typeof keyword === "string" ? keyword : "cat cave",
      sellingPrice,
      unitCost,
      shippingCost,
      fbaFee: body.fbaFee,
      assumedAcos: body.assumedAcos,
      stage: body.stage,
      complexity: body.complexity,
      differentiation: body.differentiation,
      marketData,
      marginThreshold,
      keepaData,
      dataForSEO: dataForSEOData,
      moq,
      leadTimeWeeks,
      sampleCost,
      relatedKeywords: relatedKeywords?.length ? relatedKeywords.map(k => typeof k === "string" ? k : k.keyword).filter(Boolean) : undefined,
    }),
      Promise.resolve(null), // placeholder to keep destructuring
    ])

    // Unwrap the analyzeProduct result from Promise.allSettled
    if (result.status === "rejected") {
      throw result.reason instanceof Error ? result.reason : new Error(String(result.reason))
    }
    const analysisResult = result.value

    // Log advisor_implication_why_this_decision from analyze result (before normalize)
    const resultObj = (analysisResult && typeof analysisResult === "object" ? analysisResult : {}) as Record<string, unknown>
    const advisorWhyFromResult = resultObj.advisorImplicationWhyThisDecision ?? resultObj.advisor_implication_why_this_decision ?? (resultObj.report as Record<string, unknown>)?.advisor_implication_why_this_decision
    console.log("[Analyze API] advisor_implication_why_this_decision present:", advisorWhyFromResult != null)
    console.log("[Analyze API] advisor_implication_why_this_decision value:", advisorWhyFromResult === undefined || advisorWhyFromResult === null ? String(advisorWhyFromResult) : String(advisorWhyFromResult).slice(0, 200))

    const raw = resultObj
    const normalized = normalizeAnalysisResponse(raw)
    const analysisData = normalized ?? raw
    const reportWhyFromResponse =
      (analysisData as Record<string, unknown>)?.report &&
      typeof (analysisData as Record<string, unknown>).report === "object"
        ? ((analysisData as Record<string, unknown>).report as Record<string, unknown>)?.why_this_decision
        : (analysisData as Record<string, unknown>)?.why_this_decision
    console.log("STEP 3 - API RESPONSE WHY:", reportWhyFromResponse)

    const newCount = currentCount + 1
    const { error: upsertError } = await supabase.from("user_usage").upsert(
      {
        user_id: user.id,
        analysis_count: newCount,
        last_updated: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    if (upsertError) console.error("Usage tracking failed:", upsertError.message)

    const product_name = typeof body?.keyword === "string" ? body.keyword.trim() : ""
    await supabase.from("analyses").insert({
      user_id: user.id,
      product_name: product_name || "unknown",
      analysis_data: analysisData as Record<string, unknown>,
      created_at: new Date().toISOString(),
    }).then(({ error }) => {
      if (error) console.error("Failed to save analysis to Supabase:", error.message)
    })

    // Merge keepaData + dataForSEOData + relatedKeywords into response
    const finalResponse = {
      ...(analysisData as Record<string, unknown>),
      ...(keepaData       ? { keepaData }       : {}),
      ...(dataForSEOData  ? { dataForSEOData }  : {}),
      ...(relatedKeywords?.length ? { relatedKeywords } : {}),
    }

    return NextResponse.json(finalResponse)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    const msg = err.message
    const stack = err.stack
    console.error("Analysis API error:", msg)
    if (stack) console.error(stack)
    const safeMessage = (msg || "").slice(0, 300)
    return NextResponse.json(
      {
        error: `Analysis failed: ${safeMessage || "unable to run engine."}`,
        ...(process.env.NODE_ENV !== "production" && stack && { detail: stack }),
      },
      { status: 500 }
    )
  }
}
