import { NextResponse } from "next/server"
import axios from "axios"
import { createServiceClient } from "@/lib/supabase/server"

const RAINFOREST_API_KEY = process.env.RAINFOREST_API_KEY
const RAINFOREST_DOMAIN = process.env.RAINFOREST_DOMAIN || "amazon.com"
const CRON_SECRET = process.env.CRON_SECRET

async function fetchProductByAsin(asin: string): Promise<{
  title?: string
  price?: number
  rating?: number
  reviews_total?: number
  rank?: number
  image?: string
} | null> {
  if (!RAINFOREST_API_KEY) return null
  try {
    const response = await axios.get("https://api.rainforestapi.com/request", {
      params: {
        api_key: RAINFOREST_API_KEY,
        type: "product",
        asin,
        amazon_domain: RAINFOREST_DOMAIN,
      },
      timeout: 20000,
    })
    const product = response.data?.product
    if (!product) return null

    const price =
      product.buybox_winner?.price?.value ??
      product.price?.value ??
      product.prices?.[0]?.value ??
      null

    const rank = product.bestsellers_rank?.[0]?.rank ?? null

    return {
      title: product.title,
      price: price ? Number(price) : undefined,
      rating: product.rating ? Number(product.rating) : undefined,
      reviews_total: product.ratings_total ? Number(product.ratings_total) : undefined,
      rank: rank ? Number(rank) : undefined,
      image: product.main_image?.link,
    }
  } catch (err) {
    console.error(`[Monitor] Failed to fetch ASIN ${asin}:`, err instanceof Error ? err.message : err)
    return null
  }
}

function detectChanges(
  monitorId: string,
  userId: string,
  prev: Record<string, unknown> | null,
  curr: Record<string, unknown>
): Array<{ monitor_id: string; user_id: string; change_type: string; old_value: string; new_value: string }> {
  if (!prev) return []
  const alerts = []

  // Price change (more than $0.50)
  if (prev.price != null && curr.price != null) {
    const diff = Number(curr.price) - Number(prev.price)
    if (Math.abs(diff) >= 0.5) {
      alerts.push({
        monitor_id: monitorId,
        user_id: userId,
        change_type: diff > 0 ? "price_increase" : "price_drop",
        old_value: `$${Number(prev.price).toFixed(2)}`,
        new_value: `$${Number(curr.price).toFixed(2)}`,
      })
    }
  }

  // Reviews change (more than 10)
  if (prev.reviews_total != null && curr.reviews_total != null) {
    const diff = Number(curr.reviews_total) - Number(prev.reviews_total)
    if (Math.abs(diff) >= 10) {
      alerts.push({
        monitor_id: monitorId,
        user_id: userId,
        change_type: "reviews_change",
        old_value: String(prev.reviews_total),
        new_value: String(curr.reviews_total),
      })
    }
  }

  // Rating change
  if (prev.rating != null && curr.rating != null) {
    const diff = Math.abs(Number(curr.rating) - Number(prev.rating))
    if (diff >= 0.1) {
      alerts.push({
        monitor_id: monitorId,
        user_id: userId,
        change_type: "rating_change",
        old_value: String(prev.rating),
        new_value: String(curr.rating),
      })
    }
  }

  return alerts
}

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("Authorization")
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    // Allow Vercel cron (no auth) but block others
    const isVercelCron = req.headers.get("x-vercel-cron") === "1"
    if (!isVercelCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const supabase = createServiceClient()
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
  }

  // Get all active monitors
  const { data: monitors } = await supabase
    .from("monitors")
    .select("*")
    .eq("is_active", true)

  if (!monitors?.length) {
    return NextResponse.json({ ok: true, checked: 0 })
  }

  let checked = 0
  let alertsCreated = 0

  for (const monitor of monitors) {
    // Get latest snapshot
    const { data: lastSnapshot } = await supabase
      .from("monitor_snapshots")
      .select("*")
      .eq("monitor_id", monitor.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    // Fetch current data from Rainforest
    const current = await fetchProductByAsin(monitor.asin)
    if (!current) continue

    // Update product name if we got a title
    if (current.title && current.title !== monitor.product_name) {
      await supabase
        .from("monitors")
        .update({ product_name: current.title, image_url: current.image, last_checked_at: new Date().toISOString() })
        .eq("id", monitor.id)
    } else {
      await supabase
        .from("monitors")
        .update({ last_checked_at: new Date().toISOString(), image_url: current.image })
        .eq("id", monitor.id)
    }

    // Save snapshot
    await supabase.from("monitor_snapshots").insert({
      monitor_id: monitor.id,
      price: current.price ?? null,
      rating: current.rating ?? null,
      reviews_total: current.reviews_total ?? null,
      rank: current.rank ?? null,
    })

    // Detect changes and create alerts
    const changes = detectChanges(monitor.id, monitor.user_id, lastSnapshot, current as Record<string, unknown>)
    if (changes.length > 0) {
      await supabase.from("monitor_alerts").insert(changes)
      alertsCreated += changes.length
    }

    checked++
  }

  return NextResponse.json({ ok: true, checked, alerts_created: alertsCreated })
}
