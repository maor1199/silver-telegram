import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.ANALYZE_BACKEND_URL ||
  "https://unresuscitable-unskirted-shaniqua.ngrok-free.dev"

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

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Analysis API error:", error)
    return NextResponse.json(
      { error: "Analysis failed — unable to reach engine" },
      { status: 502 }
    )
  }
}
