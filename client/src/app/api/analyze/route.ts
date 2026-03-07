import { NextRequest, NextResponse } from "next/server"
import { normalizeAnalysisResponse } from "@/lib/analysisApi"

const BACKEND_URL = (process.env.ANALYZE_BACKEND_URL || "https://unresuscitable-unskirted-shaniqua.ngrok-free.dev").trim()

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
      return NextResponse.json(
        { error: errorData.error || `Backend returned ${res.status}` },
        { status: res.status }
      )
    }

    const raw = await res.json()
    // Normalize the response so the client always gets a consistent shape
    const normalized = normalizeAnalysisResponse(raw)
    return NextResponse.json(normalized ?? raw)
  } catch (error) {
    console.error("Analysis API error:", error)
    return NextResponse.json(
      { error: "Analysis failed — unable to reach engine" },
      { status: 502 }
    )
  }
}
