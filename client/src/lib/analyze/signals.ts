type BuildSignalsInput = {
  profitAfterAds?: number
  estimatedMarginPercent?: number
  avgTop10Reviews?: number
  brandShareTop3?: number
  sponsoredTop10?: number
  keywordSaturation?: number
  sellingPrice?: number
  avgPrice?: number
  userDifferentiation?: string
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

export function buildSignals(input: BuildSignalsInput = {}) {
  const profitAfterAds = toNumber(input.profitAfterAds, 0)
  const estimatedMarginPercent = toNumber(input.estimatedMarginPercent, 0)
  const avgTop10Reviews = toNumber(input.avgTop10Reviews, 0)
  const brandShareTop3 = toNumber(input.brandShareTop3, 0)
  const sponsoredTop10 = toNumber(input.sponsoredTop10, 0)
  const keywordSaturation = toNumber(input.keywordSaturation, 1)
  const sellingPrice = toNumber(input.sellingPrice, 0)
  const avgPrice = toNumber(input.avgPrice, 0)
  const userDifferentiation = toString(input.userDifferentiation, "")

  const profit_signal =
    profitAfterAds <= 0 ? "negative" :
    profitAfterAds < 8 ? "weak" :
    profitAfterAds < 15 ? "moderate" :
    "strong"

  const margin_signal =
    estimatedMarginPercent < 12 ? "low" :
    estimatedMarginPercent < 20 ? "ok" :
    "high"

  const review_barrier =
    avgTop10Reviews > 1000 ? "very_high" :
    avgTop10Reviews > 500 ? "high" :
    avgTop10Reviews > 200 ? "medium" :
    "low"

  const brand_pressure =
    brandShareTop3 > 0.6 ? "high" :
    brandShareTop3 > 0.4 ? "medium" :
    "low"

  const market_locked = review_barrier === "very_high" && brand_pressure === "high"

  const ppc_pressure =
    sponsoredTop10 > 7 ? "high" :
    sponsoredTop10 > 4 ? "medium" :
    "low"

  const price_position =
    sellingPrice < avgPrice * 0.9 ? "low" :
    sellingPrice > avgPrice * 1.1 ? "high" :
    "competitive"

  const can_compete_price = price_position === "low" || price_position === "competitive"

  const keyword_opportunity =
    keywordSaturation < 0.3 ? "high" :
    keywordSaturation < 0.6 ? "medium" :
    "low"

  const has_diff = Boolean(userDifferentiation && userDifferentiation.trim().length > 0)
  const diff_gap = has_diff ? "covered" : "missing"

  const has_win_path =
    has_diff ||
    keyword_opportunity === "high" ||
    can_compete_price

  return {
    profit_signal,
    margin_signal,
    review_barrier,
    brand_pressure,
    market_locked,
    ppc_pressure,
    price_position,
    can_compete_price,
    keyword_opportunity,
    has_diff,
    diff_gap,
    has_win_path,
  }
}
