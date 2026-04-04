import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient, createClientWithToken } from "@/lib/supabase/server"
import OpenAI from "openai"

const RAINFOREST_API_KEY = process.env.RAINFOREST_API_KEY
const RAINFOREST_DOMAIN = process.env.RAINFOREST_DOMAIN || "amazon.com"
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

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
      return NextResponse.json({ error: "Authentication required." }, { status: 401 })
    }

    const supabaseAnon = await createClient()
    const { data: { user } } = await supabaseAnon.auth.getUser(accessToken)
    if (!user?.id) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 })
    }

    const supabase = createClientWithToken(accessToken)
    const asin = (body.asin ?? "").toString().trim().toUpperCase()

    if (!asin) {
      return NextResponse.json({ error: "ASIN required." }, { status: 400 })
    }

    // Verify user owns this monitor
    const { data: monitor } = await supabase
      .from("monitors")
      .select("id, product_name")
      .eq("user_id", user.id)
      .eq("asin", asin)
      .eq("is_active", true)
      .single()

    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found." }, { status: 404 })
    }

    if (!RAINFOREST_API_KEY) {
      return NextResponse.json({ error: "Rainforest API not configured." }, { status: 500 })
    }

    // Fetch reviews from Rainforest
    const params = new URLSearchParams({
      api_key: RAINFOREST_API_KEY,
      type: "reviews",
      asin,
      amazon_domain: RAINFOREST_DOMAIN,
      sort_by: "most_critical",
    })

    const res = await fetch(`https://api.rainforestapi.com/request?${params}`, {
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch reviews." }, { status: 500 })
    }

    const data = await res.json()
    const reviews: Array<{ title?: string; body?: string; rating?: number }> = data?.reviews ?? []

    if (!reviews.length) {
      return NextResponse.json({ error: "No reviews found for this ASIN." }, { status: 404 })
    }

    // Take up to 20 reviews for analysis
    const reviewTexts = reviews.slice(0, 20).map((r, i) =>
      `Review ${i + 1} (${r.rating}★): ${r.title ?? ""} — ${r.body ?? ""}`
    ).join("\n\n")

    // Analyze with GPT-4o
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an Amazon product analyst. Analyze customer reviews and extract actionable insights for a seller.`,
        },
        {
          role: "user",
          content: `Product: ${monitor.product_name}\nASIN: ${asin}\n\nReviews:\n${reviewTexts}\n\nProvide:\n1. Top 3 customer complaints (specific, not generic)\n2. Top 2 things customers love\n3. One specific recommendation for the seller to improve their listing or product\n\nRespond in JSON: { "complaints": ["...", "...", "..."], "positives": ["...", "..."], "recommendation": "..." }`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.3,
    })

    const analysis = JSON.parse(completion.choices[0].message.content ?? "{}")

    return NextResponse.json({
      ok: true,
      asin,
      product_name: monitor.product_name,
      reviews_analyzed: Math.min(reviews.length, 20),
      complaints: analysis.complaints ?? [],
      positives: analysis.positives ?? [],
      recommendation: analysis.recommendation ?? "",
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
