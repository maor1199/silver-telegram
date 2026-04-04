import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient, createClientWithToken } from "@/lib/supabase/server"

const FREE_TIER_MONITOR_LIMIT = 5
const RAINFOREST_API_KEY = process.env.RAINFOREST_API_KEY
const RAINFOREST_DOMAIN = process.env.RAINFOREST_DOMAIN || "amazon.com"

async function fetchProductByAsin(asin: string) {
  if (!RAINFOREST_API_KEY) return null
  try {
    const params = new URLSearchParams({
      api_key: RAINFOREST_API_KEY,
      type: "product",
      asin,
      amazon_domain: RAINFOREST_DOMAIN,
    })
    const res = await fetch(`https://api.rainforestapi.com/request?${params}`, {
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const p = data?.product
    if (!p) return null
    const price = p.buybox_winner?.price?.value ?? p.price?.value ?? p.prices?.[0]?.value ?? null
    const rank = p.bestsellers_rank?.[0]?.rank ?? null
    return {
      title: p.title ?? null,
      image: p.main_image?.link ?? null,
      price: price ? Number(price) : null,
      rating: p.rating ? Number(p.rating) : null,
      reviews_total: p.ratings_total ? Number(p.ratings_total) : null,
      rank: rank ? Number(rank) : null,
    }
  } catch {
    return null
  }
}

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
      return NextResponse.json({ error: "Authentication required.", code: "UNAUTHORIZED" }, { status: 401 })
    }

    const supabaseAnon = await createClient()
    const { data: { user } } = await supabaseAnon.auth.getUser(accessToken)
    if (!user?.id) {
      return NextResponse.json({ error: "Invalid or expired session.", code: "UNAUTHORIZED" }, { status: 401 })
    }

    const supabase = createClientWithToken(accessToken)
    const asin = (body.asin ?? "").toString().trim().toUpperCase()

    if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
      return NextResponse.json({ error: "Invalid ASIN. Must be 10 alphanumeric characters.", code: "INVALID_ASIN" }, { status: 400 })
    }

    const { count } = await supabase
      .from("monitors")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_active", true)

    if ((count ?? 0) >= FREE_TIER_MONITOR_LIMIT) {
      return NextResponse.json({ error: `Free tier limit: ${FREE_TIER_MONITOR_LIMIT} monitored products. Upgrade to PRO for unlimited.`, code: "MONITOR_LIMIT" }, { status: 403 })
    }

    const { data: existing } = await supabase
      .from("monitors")
      .select("id")
      .eq("user_id", user.id)
      .eq("asin", asin)
      .eq("is_active", true)
      .single()

    if (existing) {
      return NextResponse.json({ error: "You are already monitoring this ASIN.", code: "DUPLICATE" }, { status: 409 })
    }

    // Fetch product data immediately from Rainforest
    const product = await fetchProductByAsin(asin)

    const { data: monitor, error: insertError } = await supabase
      .from("monitors")
      .insert({
        user_id: user.id,
        asin,
        product_name: product?.title ?? asin,
        image_url: product?.image ?? null,
        last_checked_at: product ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: "Failed to add monitor.", code: "DB_ERROR" }, { status: 500 })
    }

    // Save first snapshot immediately if we got data
    if (product && monitor) {
      await supabase.from("monitor_snapshots").insert({
        monitor_id: monitor.id,
        price: product.price,
        rating: product.rating,
        reviews_total: product.reviews_total,
        rank: product.rank,
      })
    }

    return NextResponse.json({ ok: true, monitor })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
