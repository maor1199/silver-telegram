import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient, createClientWithToken } from "@/lib/supabase/server"
import OpenAI from "openai"

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

    // Get snapshots from the last 14 days
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    const { data: snapshots } = await supabase
      .from("monitor_snapshots")
      .select("*")
      .eq("monitor_id", monitor.id)
      .gte("created_at", fourteenDaysAgo)
      .order("created_at", { ascending: true })

    const { data: alerts } = await supabase
      .from("monitor_alerts")
      .select("*")
      .eq("monitor_id", monitor.id)
      .gte("created_at", fourteenDaysAgo)
      .order("created_at", { ascending: true })

    if (!snapshots?.length) {
      return NextResponse.json({ error: "Not enough data yet. Check back after the daily scan runs." }, { status: 400 })
    }

    const snapshotSummary = snapshots.map(s =>
      `${new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}: Price=$${s.price ?? "N/A"}, Rating=${s.rating ?? "N/A"}★, Reviews=${s.reviews_total ?? "N/A"}, BSR=#${s.rank ?? "N/A"}`
    ).join("\n")

    const alertsSummary = alerts?.length
      ? alerts.map(a => `${a.change_type.replace("_", " ")}: ${a.old_value} → ${a.new_value}`).join("\n")
      : "No significant changes triggered alerts this period."

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert Amazon FBA business analyst and virtual assistant. Generate a professional, actionable performance brief for a seller.`,
        },
        {
          role: "user",
          content: `Product: ${monitor.product_name}\nASIN: ${asin}\n\nSnapshot Data (chronological):\n${snapshotSummary}\n\nChange Alerts:\n${alertsSummary}\n\nGenerate a concise VA brief in JSON:\n{\n  "headline": "2-3 word status (e.g. 'Strong Week', 'Price Pressure', 'Growing Fast')",\n  "headline_type": "positive|negative|neutral",\n  "summary": "2-3 sentence executive summary of the product's performance",\n  "highlights": ["positive observation 1", "positive observation 2"],\n  "concerns": ["concern or risk 1"],\n  "action_items": ["specific action 1", "specific action 2", "specific action 3"],\n  "outlook": "1-sentence forward-looking recommendation"\n}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 700,
      temperature: 0.3,
    })

    const report = JSON.parse(completion.choices[0].message.content ?? "{}")

    return NextResponse.json({
      ok: true,
      asin,
      product_name: monitor.product_name,
      snapshots_analyzed: snapshots.length,
      alerts_count: alerts?.length ?? 0,
      ...report,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
