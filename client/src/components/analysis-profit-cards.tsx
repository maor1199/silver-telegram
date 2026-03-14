"use client"

import { DollarSign, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ProfitBreakdown {
  sellingPrice: number
  referralFee: number
  fbaFee: number
  cogs: number
  ppcCostPerUnit: number
  assumedAcosPercent: number
  profitAfterAds: number
}

interface AnalysisProfitCardsProps {
  netProfit: number | null
  profitAfterAds: number | null
  profitBreakdown?: ProfitBreakdown
}

function Card({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  color?: "green" | "red" | "amber"
}) {
  const colorMap = {
    green: "text-emerald-600 dark:text-emerald-400",
    red: "text-red-600 dark:text-red-400",
    amber: "text-amber-600 dark:text-amber-400",
  }
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn("text-2xl font-black", color ? colorMap[color] : "text-foreground")}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export function AnalysisProfitCards({ netProfit, profitAfterAds, profitBreakdown }: AnalysisProfitCardsProps) {
  const profit = profitAfterAds ?? netProfit ?? (profitBreakdown?.profitAfterAds ?? null)
  const roiValue =
    profitBreakdown && profit != null
      ? (() => {
          const totalCost =
            (profitBreakdown.cogs || 0) +
            (profitBreakdown.fbaFee || 0) +
            (profitBreakdown.referralFee || 0) +
            (profitBreakdown.ppcCostPerUnit || 0)
          return totalCost > 0 ? (profit / totalCost) * 100 : 0
        })()
      : null
  const amazonFeesSum =
    profitBreakdown != null ? (profitBreakdown.fbaFee || 0) + (profitBreakdown.referralFee || 0) : 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {profit != null && !isNaN(profit) && (
        <Card
          label="Net Profit"
          value={`$${profit.toFixed(2)}`}
          sub="per unit after ads"
          icon={<DollarSign className="h-4 w-4" />}
          color={profit >= 0 ? "green" : undefined}
        />
      )}
      {roiValue != null && !isNaN(roiValue) && (
        <Card
          label="ROI"
          value={`${roiValue.toFixed(1)}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          color={roiValue >= 0 ? "green" : undefined}
        />
      )}
      {amazonFeesSum > 0 && (
        <Card
          label="Amazon Fees"
          value={`$${amazonFeesSum.toFixed(2)}`}
          sub="FBA + Referral"
          icon={<DollarSign className="h-4 w-4" />}
          color="amber"
        />
      )}
    </div>
  )
}
