import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient, createClientWithToken } from "@/lib/supabase/server"

const FREE_TIER_MONITOR_LIMIT = 5

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
    const productName = (body.product_name ?? "").toString().trim()

    if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
      return NextResponse.json({ error: "Invalid ASIN. Must be 10 alphanumeric characters.", code: "INVALID_ASIN" }, { status: 400 })
    }

    // Check limit
    const { count } = await supabase
      .from("monitors")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_active", true)

    if ((count ?? 0) >= FREE_TIER_MONITOR_LIMIT) {
      return NextResponse.json({ error: `Free tier limit: ${FREE_TIER_MONITOR_LIMIT} monitored products. Upgrade to PRO for unlimited.`, code: "MONITOR_LIMIT" }, { status: 403 })
    }

    // Check duplicate
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

    const { data: monitor, error: insertError } = await supabase
      .from("monitors")
      .insert({ user_id: user.id, asin, product_name: productName || asin })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: "Failed to add monitor.", code: "DB_ERROR" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, monitor })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
