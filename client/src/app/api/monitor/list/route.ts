import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient, createClientWithToken } from "@/lib/supabase/server"

export async function GET(req: Request) {
  try {
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

    const { data: monitors } = await supabase
      .from("monitors")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    // For each monitor, get the latest 2 snapshots to detect changes
    const monitorsWithData = await Promise.all(
      (monitors ?? []).map(async (monitor: Record<string, unknown>) => {
        const { data: snapshots } = await supabase
          .from("monitor_snapshots")
          .select("*")
          .eq("monitor_id", monitor.id)
          .order("created_at", { ascending: false })
          .limit(14)

        const { data: alerts } = await supabase
          .from("monitor_alerts")
          .select("*")
          .eq("monitor_id", monitor.id)
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(10)

        return {
          ...monitor,
          latest_snapshot: snapshots?.[0] ?? null,
          previous_snapshot: snapshots?.[1] ?? null,
          snapshots: (snapshots ?? []).slice().reverse(),
          unread_alerts: alerts ?? [],
        }
      })
    )

    // Get total unread alerts count
    const { count: unreadCount } = await supabase
      .from("monitor_alerts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    return NextResponse.json({ ok: true, monitors: monitorsWithData, unread_count: unreadCount ?? 0 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
