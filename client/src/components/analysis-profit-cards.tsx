/**
 * v0-style metrics cards: Net Profit, ROI, Amazon Fees.
 * Used by app/analyze/results/page.tsx. Data from result.report or profitBreakdown.
 */
import { DollarSign, TrendingUp, Receipt } from "lucide-react";

export type ProfitBreakdown = {
  sellingPrice: number;
  referralFee: number;
  fbaFee: number;
  cogs: number;
  ppcCostPerUnit: number;
  assumedAcosPercent: number;
  profitAfterAds: number;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** ROI on total unit cost (COGS + FBA + referral + PPC). */
function computeROI(pb: ProfitBreakdown): number {
  const totalCost = pb.cogs + pb.fbaFee + pb.referralFee + pb.ppcCostPerUnit;
  if (totalCost <= 0) return 0;
  return (pb.profitAfterAds / totalCost) * 100;
}

export type AnalysisProfitCardsProps = {
  /** From result.report.netProfit (or profit calculation in report) */
  netProfit?: number | null;
  /** From result.report.roi */
  roi?: number | null;
  /** Sum of fbaFee + referralFee from result.report.profit_breakdown */
  amazonFees?: number | null;
  /** From analysis result; used when netProfit/roi/amazonFees not provided */
  profitBreakdown?: ProfitBreakdown | null;
  /** Fallback when no breakdown (e.g. displayResult.profitAfterAds only) */
  profitAfterAds?: number | null;
};

export function AnalysisProfitCards({
  netProfit,
  roi,
  amazonFees,
  profitBreakdown,
  profitAfterAds,
}: AnalysisProfitCardsProps) {
  const pb = profitBreakdown;
  const profit = netProfit ?? (pb ? pb.profitAfterAds : (profitAfterAds ?? 0));
  const roiValue = roi ?? (pb ? computeROI(pb) : 0);
  const amazonFeesSum = amazonFees ?? (pb ? pb.fbaFee + pb.referralFee : 0);
  const hasData = pb != null || netProfit != null || (profit !== 0 || roiValue > 0 || amazonFeesSum > 0);

  const cardClass = "rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm";
  const titleClass = "mb-4 text-sm font-bold uppercase tracking-widest text-amber-600";
  const metricCard = "flex flex-col gap-1.5 rounded-xl border-2 border-slate-200 bg-slate-50 p-5";
  const metricLabel = "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500";
  const metricValue = "text-2xl font-bold text-slate-900";

  return (
    <section className={cardClass}>
      <h2 className={titleClass}>Unit Economics — Net Profit, ROI & Amazon Fees</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={metricCard}>
          <div className={metricLabel}>
            <DollarSign className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
            Net Profit
          </div>
          <div className={metricValue}>{hasData ? formatCurrency(profit) : "—"}</div>
          <p className="text-xs text-slate-500">Per unit after all costs</p>
        </div>
        <div className={metricCard}>
          <div className={metricLabel}>
            <TrendingUp className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
            ROI
          </div>
          <div className={metricValue}>{hasData && roiValue > 0 ? `${roiValue.toFixed(1)}%` : "—"}</div>
          <p className="text-xs text-slate-500">Return on unit cost</p>
        </div>
        <div className={metricCard}>
          <div className={metricLabel}>
            <Receipt className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
            Amazon Fees
          </div>
          <div className={metricValue}>{hasData && amazonFeesSum > 0 ? formatCurrency(amazonFeesSum) : "—"}</div>
          <p className="text-xs text-slate-500">FBA + Referral fee</p>
        </div>
      </div>
    </section>
  );
}
