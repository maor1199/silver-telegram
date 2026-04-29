/**
 * DataForSEO Keywords Data API — dual-endpoint strategy
 *
 * Primary:  /v3/keywords_data/amazon/search_volume/live
 *   → Real Amazon.com monthly search volume (same source as Helium 10 / Jungle Scout)
 *
 * Supplemental: /v3/keywords_data/google_ads/search_volume/live
 *   → Google Ads CPC + competition level (reliable bid-pressure proxy for Amazon PPC)
 *
 * Both calls run in parallel (Promise.allSettled).
 * Amazon volume takes priority; Google Ads fills in CPC + competition where Amazon lacks it.
 * Either failure is silent — analysis always continues without DataForSEO.
 *
 * Auth: HTTP Basic (DATAFORSEO_LOGIN:DATAFORSEO_PASSWORD)
 * Cost: ~$0.0003 per keyword per endpoint — negligible per analysis.
 */

const DATAFORSEO_BASE = "https://api.dataforseo.com/v3"

export type DataForSEOMonthlySearch = {
  year: number
  month: number
  search_volume: number
}

export type DataForSEOKeywordData = {
  keyword: string
  /** Real Amazon.com monthly search volume (US) — same data source as Helium 10 */
  searchVolume: number | null
  /** Source of the search volume figure */
  searchVolumeSource: "amazon" | "google_ads" | null
  /** Average Google Ads CPC in USD — reliable Amazon PPC bid-pressure proxy */
  cpcUsd: number | null
  /** Google Ads competition level */
  competitionLevel: "LOW" | "MEDIUM" | "HIGH" | null
  /** Competition index 0–100 */
  competitionIndex: number | null
  /** Last 12 months of monthly search volume */
  monthlySearches: DataForSEOMonthlySearch[]
  /** Derived from last 3 months vs first 3 months */
  searchTrend: "growing" | "declining" | "stable"
  hasData: boolean
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function computeSearchTrend(
  monthly: DataForSEOMonthlySearch[]
): "growing" | "declining" | "stable" {
  if (monthly.length < 6) return "stable"
  const sorted = [...monthly].sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  )
  const recent = sorted.slice(-3).reduce((s, m) => s + m.search_volume, 0) / 3
  const older  = sorted.slice(0, 3).reduce((s, m) => s + m.search_volume, 0) / 3
  if (older === 0) return "stable"
  const change = (recent - older) / older
  return change > 0.15 ? "growing" : change < -0.15 ? "declining" : "stable"
}

function twelveMonthsAgoDate(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 12)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
}

function parseMonthly(row: Record<string, unknown>): DataForSEOMonthlySearch[] {
  return Array.isArray(row.monthly_searches)
    ? (row.monthly_searches as Array<Record<string, unknown>>).map((m) => ({
        year:          Number(m.year)          || 0,
        month:         Number(m.month)         || 0,
        search_volume: Number(m.search_volume) || 0,
      }))
    : []
}

/** POST a single-keyword task to one DataForSEO endpoint. Returns the first result row, or null. */
async function fetchEndpoint(
  endpoint: string,
  kw: string,
  auth: string
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${DATAFORSEO_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization:  `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          keywords:      [kw],
          location_code: 2840,   // United States
          language_code: "en",
          date_from:     twelveMonthsAgoDate(),
        },
      ]),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      console.warn(`[DataForSEO] ${endpoint} HTTP ${res.status} ${res.statusText}`)
      return null
    }

    const body = (await res.json()) as Record<string, unknown>
    const task = (body?.tasks as Array<Record<string, unknown>> | undefined)?.[0]

    if (!task || task.status_code !== 20000) {
      console.warn(`[DataForSEO] ${endpoint} task error:`, task?.status_message)
      return null
    }

    const row = (task.result as Array<Record<string, unknown>> | undefined)?.[0] ?? null
    if (!row) console.warn(`[DataForSEO] ${endpoint} empty result for "${kw}"`)
    return row
  } catch (err) {
    console.warn(`[DataForSEO] ${endpoint} failed:`, err instanceof Error ? err.message : String(err))
    return null
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Fetch real keyword data for one keyword.
 * Calls Amazon + Google Ads endpoints in parallel and merges results.
 * Returns null (silently) if credentials are missing.
 * Partial data (one endpoint fails) is still returned.
 */
export async function getDataForSEOData(
  keyword: string
): Promise<DataForSEOKeywordData | null> {
  const login    = process.env.DATAFORSEO_LOGIN?.trim()
  const password = process.env.DATAFORSEO_PASSWORD?.trim()

  if (!login || !password) {
    console.warn("[DataForSEO] DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD not set — skipping")
    return null
  }

  const auth = Buffer.from(`${login}:${password}`).toString("base64")
  const kw   = keyword.trim().toLowerCase()

  // ── Parallel fetch: Amazon (volume) + Google Ads (CPC / competition) ────────
  const [amazonResult, googleResult] = await Promise.allSettled([
    fetchEndpoint("/keywords_data/amazon/search_volume/live",       kw, auth),
    fetchEndpoint("/keywords_data/google_ads/search_volume/live",   kw, auth),
  ])

  const amazonRow = amazonResult.status === "fulfilled" ? amazonResult.value : null
  const googleRow = googleResult.status === "fulfilled" ? googleResult.value : null

  // At least one must succeed for us to return data
  if (!amazonRow && !googleRow) {
    console.warn("[DataForSEO] Both endpoints returned no data for:", kw)
    return null
  }

  // ── Amazon: real Amazon search volume + monthly trend ───────────────────────
  let searchVolume: number | null = null
  let searchVolumeSource: "amazon" | "google_ads" | null = null
  let monthlySearches: DataForSEOMonthlySearch[] = []

  if (amazonRow) {
    const vol = amazonRow.search_volume != null ? Number(amazonRow.search_volume) : null
    if (vol != null && vol > 0) {
      searchVolume       = vol
      searchVolumeSource = "amazon"
      monthlySearches    = parseMonthly(amazonRow)
    }
  }

  // Fallback: if Amazon returned 0 or null, try Google Ads volume as a rough proxy
  if (searchVolume == null && googleRow) {
    const vol = googleRow.search_volume != null ? Number(googleRow.search_volume) : null
    if (vol != null && vol > 0) {
      searchVolume       = vol
      searchVolumeSource = "google_ads"
      monthlySearches    = parseMonthly(googleRow)
    }
  }

  // ── Google Ads: CPC + competition (Amazon lacks these fields) ───────────────
  let cpcUsd:           number | null                    = null
  let competitionLevel: "LOW" | "MEDIUM" | "HIGH" | null = null
  let competitionIndex: number | null                    = null

  if (googleRow) {
    cpcUsd           = googleRow.cpc != null ? Math.round(Number(googleRow.cpc) * 100) / 100 : null
    competitionLevel = (googleRow.competition_level as "LOW" | "MEDIUM" | "HIGH") ?? null
    const raw        = googleRow.competition != null ? Number(googleRow.competition) : null
    competitionIndex = raw != null ? Math.round(raw * 100) : null
  }

  const searchTrend = computeSearchTrend(monthlySearches)

  console.log(
    `[DataForSEO] "${kw}": Amazon volume=${searchVolume ?? "n/a"} (${searchVolumeSource ?? "-"}),` +
    ` cpc=$${cpcUsd ?? "n/a"}, competition=${competitionLevel ?? "n/a"}, trend=${searchTrend}`
  )

  return {
    keyword: String(amazonRow?.keyword ?? googleRow?.keyword ?? kw),
    searchVolume,
    searchVolumeSource,
    cpcUsd,
    competitionLevel,
    competitionIndex,
    monthlySearches,
    searchTrend,
    hasData: true,
  }
}

// ── Related Keywords ──────────────────────────────────────────────────────────

export type RelatedKeyword = {
  keyword: string
  searchVolume: number | null
  /** Relevance rank (1 = most relevant) */
  rank: number
}

/**
 * Fetch the top related Amazon keywords for a seed keyword.
 * Uses DataForSEO Labs Amazon Related Keywords endpoint.
 * Returns up to `limit` keywords sorted by search volume (desc).
 * Returns [] silently on any failure.
 */
export async function getRelatedKeywords(
  keyword: string,
  limit = 8
): Promise<RelatedKeyword[]> {
  const login    = process.env.DATAFORSEO_LOGIN?.trim()
  const password = process.env.DATAFORSEO_PASSWORD?.trim()

  if (!login || !password) return []

  const auth = Buffer.from(`${login}:${password}`).toString("base64")
  const kw   = keyword.trim().toLowerCase()

  try {
    const res = await fetch(
      `${DATAFORSEO_BASE}/dataforseo_labs/amazon/related_keywords/live`,
      {
        method: "POST",
        headers: {
          Authorization:  `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            keyword:       kw,
            location_code: 2840,  // United States
            language_code: "en",
            limit,
            depth:         1,
          },
        ]),
        signal: AbortSignal.timeout(10_000),
      }
    )

    if (!res.ok) {
      console.warn(`[DataForSEO][related] HTTP ${res.status} ${res.statusText}`)
      return []
    }

    const body = (await res.json()) as Record<string, unknown>
    const task = (body?.tasks as Array<Record<string, unknown>> | undefined)?.[0]

    if (!task || task.status_code !== 20000) {
      console.warn("[DataForSEO][related] Task error:", task?.status_message)
      return []
    }

    const items = (task.result as Array<Record<string, unknown>> | undefined)?.[0]
    const relItems = items?.items as Array<Record<string, unknown>> | undefined
    if (!relItems?.length) return []

    return relItems
      .slice(0, limit)
      .map((item, idx) => {
        const kwData = item.keyword_data as Record<string, unknown> | undefined
        return {
          keyword:      String(item.keyword ?? kwData?.keyword ?? ""),
          searchVolume: kwData?.search_volume != null ? Number(kwData.search_volume) : null,
          rank:         idx + 1,
        }
      })
      .filter((k) => k.keyword && k.keyword !== kw)
      .sort((a, b) => (b.searchVolume ?? 0) - (a.searchVolume ?? 0))
  } catch (err) {
    console.warn("[DataForSEO][related] Failed:", err instanceof Error ? err.message : String(err))
    return []
  }
}
