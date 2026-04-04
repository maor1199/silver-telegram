import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient, createClientWithToken } from "@/lib/supabase/server"

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
    const monitorId = (body.id ?? "").toString().trim()

    if (!monitorId) {
      return NextResponse.json({ error: "Monitor ID required." }, { status: 400 })
    }

    const { error } = await supabase
      .from("monitors")
      .update({ is_active: false })
      .eq("id", monitorId)
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: "Failed to remove monitor." }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
