import { NextRequest, NextResponse } from "next/server"
import { normalizeAnalysisResponse } from "@/lib/analysisApi"
import { createClient } from "@/lib/supabase/server"

const BACKEND_URL = (process.env.ANALYZE_BACKEND_URL || "http://localhost:3001").trim()

function backendUnavailableMessage(status: number): string {
  if (status === 502 || status === 503) {
    return "Analysis engine is unavailable. Start the backend (e.g. run the server in the project root or set ANALYZE_BACKEND_URL in client .env)."
  }
  return `Backend returned ${status}.`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

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

    // Save to Supabase analyses table if user is authenticated
    try {
      const supabase = await createClient()
      const authHeader = request.headers.get("Authorization")
      const accessToken = authHeader?.replace(/^Bearer\s+/i, "").trim()
      if (accessToken) {
        const { data: { user } } = await supabase.auth.getUser(accessToken)
        if (user?.id) {
          const product_name = typeof body?.keyword === "string" ? body.keyword.trim() : ""
          const { error: insertError } = await supabase.from("analyses").insert({
            user_id: user.id,
            product_name: product_name || "unknown",
            results: analysisData,
            created_at: new Date().toISOString(),
          })
          if (insertError) {
            console.error("Failed to save analysis to Supabase:", insertError.message)
          }
        }
      }
    } catch (saveErr) {
      console.error("Supabase save error:", saveErr)
      // Do not fail the response; analysis already succeeded
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
