import { NextRequest, NextResponse } from "next/server"
import { normalizeAnalysisResponse } from "@/lib/analysisApi"
import { createClient, createClientWithToken } from "@/lib/supabase/server"

const BACKEND_URL = (process.env.ANALYZE_BACKEND_URL || "http://localhost:3001").trim()
const FREE_TIER_ANALYSIS_LIMIT = 5

function backendUnavailableMessage(status: number): string {
  if (status === 502 || status === 503) {
    return "Analysis engine is unavailable. Start the backend (e.g. run the server in the project root or set ANALYZE_BACKEND_URL in client .env)."
  }
  return `Backend returned ${status}.`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const authHeader = request.headers.get("Authorization")
    const accessToken = authHeader?.replace(/^Bearer\s+/i, "").trim()

    // Require auth for usage tracking and limit check
    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required.", code: "UNAUTHORIZED" },
        { status: 401 }
      )
    }

    const supabaseAnon = await createClient()
    const { data: { user } } = await supabaseAnon.auth.getUser(accessToken)
    if (!user?.id) {
      return NextResponse.json(
        { error: "Invalid or expired session.", code: "UNAUTHORIZED" },
        { status: 401 }
      )
    }

    const supabase = createClientWithToken(accessToken)

    // Check usage limit (create record if missing)
    const { data: usageRow } = await supabase
      .from("user_usage")
      .select("analysis_count")
      .eq("user_id", user.id)
      .single()

    const currentCount = usageRow?.analysis_count ?? 0
    if (currentCount >= FREE_TIER_ANALYSIS_LIMIT) {
      return NextResponse.json(
        {
          error: "You have reached the free tier limit of 5 analyses. Upgrade to PRO for unlimited analyses.",
          code: "USAGE_LIMIT",
        },
        { status: 403 }
      )
    }

    const res = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      const message =
        (errorData as { error?: string }).error ||
        backendUnavailableMessage(res.status)
      return NextResponse.json({ error: message }, { status: res.status })
    }

    const raw = await res.json()
    const normalized = normalizeAnalysisResponse(raw)
    const analysisData = normalized ?? raw

    // Increment usage (create row if not exists)
    const newCount = currentCount + 1
    const { error: upsertError } = await supabase.from("user_usage").upsert(
      {
        user_id: user.id,
        analysis_count: newCount,
        last_updated: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    if (upsertError) {
      console.error("Failed to update user_usage:", upsertError.message)
      // Do not fail the response; analysis already succeeded
    }

    // Save to Supabase analyses table
    try {
      const product_name = typeof body?.keyword === "string" ? body.keyword.trim() : ""
      const { error: insertError } = await supabase.from("analyses").insert({
        user_id: user.id,
        product_name: product_name || "unknown",
        analysis_data: analysisData,
        created_at: new Date().toISOString(),
      })
      if (insertError) {
        console.error("Failed to save analysis to Supabase:", insertError.message)
      }
    } catch (saveErr) {
      console.error("Supabase save error:", saveErr)
    }

    return NextResponse.json(analysisData)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("Analysis API error:", msg)
    const isNetwork =
      /fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|network/i.test(msg)
    return NextResponse.json(
      {
        error: isNetwork
          ? "Cannot reach the analysis engine. Ensure the backend is running (e.g. in server folder or via ngrok) and ANALYZE_BACKEND_URL points to it."
          : "Analysis failed — unable to reach engine.",
      },
      { status: 502 }
    )
  }
}
