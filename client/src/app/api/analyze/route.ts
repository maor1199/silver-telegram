import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { normalizeAnalysisResponse } from "@/lib/analysisApi"
import { createClient, createClientWithToken } from "@/lib/supabase/server"
import { analyzeProduct } from "@/lib/analyze/analyzeAgent"
import { getMarketData } from "@/lib/analyze/marketDataProvider"

const FREE_TIER_ANALYSIS_LIMIT = 5
/** Emails that bypass the free-tier limit (unlimited analyses). */
const UNLIMITED_ANALYSIS_EMAILS = new Set(["pardilov11@gmail.com"].map((e) => e.toLowerCase()))

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

    const marketData = await getMarketData(typeof keyword === "string" ? keyword : "cat cave")
    if (!marketData.success) {
      console.warn("[Analyze] Using stub market data — new fields will show placeholders. Check Vercel → Logs after running analysis to see why.")
    }

    const result = await analyzeProduct({
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
    })

    const raw = (result && typeof result === "object" ? result : {}) as Record<string, unknown>
    const normalized = normalizeAnalysisResponse(raw)
    const analysisData = normalized ?? raw

    const newCount = currentCount + 1
    await supabase.from("user_usage").upsert(
      {
        user_id: user.id,
        analysis_count: newCount,
        last_updated: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

    const product_name = typeof body?.keyword === "string" ? body.keyword.trim() : ""
    await supabase.from("analyses").insert({
      user_id: user.id,
      product_name: product_name || "unknown",
      analysis_data: analysisData as Record<string, unknown>,
      created_at: new Date().toISOString(),
    }).then(({ error }) => {
      if (error) console.error("Failed to save analysis to Supabase:", error.message)
    })

    return NextResponse.json(analysisData)
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
