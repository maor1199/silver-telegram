"use client"

import { useState, useEffect } from "react"
import type { SKU } from "./types"
import { MOCK_SKUS } from "./mock-data"

const STORAGE_KEY = "sellermentor_skus_v1"
const META_KEY    = "sellermentor_skus_meta_v1"

export type DataSource = "live" | "demo"

export type SkuMeta = {
  source: DataSource
  filename?: string
  uploadedAt?: string
  rowCount?: number
}

// ─── Persist ──────────────────────────────────────────────────────────────────

export function saveSkus(skus: SKU[], meta: SkuMeta): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(skus))
    localStorage.setItem(META_KEY, JSON.stringify(meta))
  } catch {
    // storage full or unavailable — silent fail
  }
}

export function loadSkus(): { skus: SKU[]; meta: SkuMeta } {
  if (typeof window === "undefined") return { skus: MOCK_SKUS, meta: { source: "demo" } }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const metaRaw = localStorage.getItem(META_KEY)
    if (raw) {
      const skus = JSON.parse(raw) as SKU[]
      const meta = metaRaw ? (JSON.parse(metaRaw) as SkuMeta) : { source: "live" as DataSource }
      return { skus, meta }
    }
  } catch {
    // corrupted — fall back to demo
  }
  return { skus: MOCK_SKUS, meta: { source: "demo" } }
}

export function clearSkus(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(META_KEY)
}

// ─── React hook ───────────────────────────────────────────────────────────────

export function useSkus() {
  const [skus, setSkus] = useState<SKU[]>(MOCK_SKUS)
  const [meta, setMeta] = useState<SkuMeta>({ source: "demo" })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const { skus: loaded, meta: loadedMeta } = loadSkus()
    setSkus(loaded)
    setMeta(loadedMeta)
    setHydrated(true)
  }, [])

  const update = (newSkus: SKU[], newMeta: SkuMeta) => {
    saveSkus(newSkus, newMeta)
    setSkus(newSkus)
    setMeta(newMeta)
  }

  const reset = () => {
    clearSkus()
    setSkus(MOCK_SKUS)
    setMeta({ source: "demo" })
  }

  return { skus, meta, hydrated, update, reset }
}
