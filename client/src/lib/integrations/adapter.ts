// ─── DataAdapter Interface ────────────────────────────────────────────────────
// Every integration implements this contract.
// The rest of the intelligence layer is never aware of channel specifics.

import type { AdapterResult, IntegrationChannel, IntegrationConfig } from "./types"

// ─── Interface ────────────────────────────────────────────────────────────────

export interface DataAdapter<TRaw = unknown> {
  /** Channel this adapter handles */
  readonly channel: IntegrationChannel

  /** Human-readable name for UI display */
  readonly displayName: string

  /** Whether this adapter supports live API connections */
  readonly supportsLive: boolean

  /**
   * Parse raw channel data into normalized SKU[].
   * Must be pure — no side effects, no network calls.
   * Missing optional fields should use sensible defaults, not throw.
   */
  parse(raw: TRaw[]): AdapterResult

  /**
   * Validate that raw data is structurally complete enough to parse.
   * Returns list of problems found (empty = OK to proceed).
   */
  validate(raw: TRaw[]): string[]

  /**
   * Configuration for this integration instance.
   * Used by UI to display connection state.
   */
  getConfig(): IntegrationConfig
}

// ─── Registry ─────────────────────────────────────────────────────────────────
// Simple map of channel → adapter.
// Add new adapters here when ready.

const _registry = new Map<IntegrationChannel, DataAdapter>()

export function registerAdapter(adapter: DataAdapter): void {
  _registry.set(adapter.channel, adapter)
}

export function getAdapter(channel: IntegrationChannel): DataAdapter | null {
  return _registry.get(channel) ?? null
}

export function listAdapters(): DataAdapter[] {
  return [..._registry.values()]
}

// ─── Upcoming channels (stub placeholders) ────────────────────────────────────
// These constants document which integrations are planned.
// Implementations live in adapters/<channel>.ts as they are built.

export const PLANNED_INTEGRATIONS: Record<string, { name: string; eta: string }> = {
  amazon_seller_central: { name: "Amazon Seller Central",  eta: "Q3 2026" },
  shopify:               { name: "Shopify",                eta: "Q3 2026" },
  sellerboard:           { name: "Sellerboard",            eta: "Q4 2026" },
}
