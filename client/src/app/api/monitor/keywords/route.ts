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

    const params = new URLSearchParams({
      api_key: RAINFOREST_API_KEY,
      type: "product",
      asin,
      amazon_domain: RAINFOREST_DOMAIN,
    })

    const res = await fetch(`https://api.rainforestapi.com/request?${params}`, {
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch product data." }, { status: 500 })
    }

    const data = await res.json()
    const product = data?.product

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 })
    }

    const title = product.title ?? monitor.product_name
    const bullets = (product.feature_bullets ?? []).slice(0, 5).join("\n")
    const category = product.categories?.[0]?.name ?? product.main_category ?? "General"

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a senior Amazon PPC strategist. Generate high-converting sponsored ads keywords with buyer intent focus.`,
        },
        {
          role: "user",
          content: `Product Title: ${title}\nCategory: ${category}\nKey Features:\n${bullets || "N/A"}\n\nGenerate PPC keyword strategy in JSON:\n{\n  "exact": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],\n  "phrase": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],\n  "broad": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],\n  "competitor_targets": ["brand or product 1", "brand or product 2", "brand or product 3"],\n  "negative": ["irrelevant term 1", "irrelevant term 2", "irrelevant term 3"],\n  "tip": "One specific high-impact PPC strategy tip for this product"\n}\n\nFocus on buyer-intent keywords (people ready to purchase). Avoid overly generic terms.`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 700,
      temperature: 0.3,
    })

    const keywords = JSON.parse(completion.choices[0].message.content ?? "{}")

    return NextResponse.json({
      ok: true,
      asin,
      product_name: monitor.product_name,
      ...keywords,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
