import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getKeepaData } from "@/lib/keepa/keepaService"

export async function GET(req: Request) {
  try {
    // Auth check
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const asin = searchParams.get("asin")?.trim().toUpperCase()

    if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
      return NextResponse.json({ error: "Invalid ASIN. Must be 10 alphanumeric characters." }, { status: 400 })
    }

    const data = await getKeepaData(asin)
    if (!data) {
      return NextResponse.json({ error: "No Keepa data found for this ASIN." }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Failed to fetch market history: ${msg}` }, { status: 500 })
  }
}
