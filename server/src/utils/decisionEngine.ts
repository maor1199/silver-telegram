import { DecisionResponse } from "../types/decision.types";

type DecisionInput = {
  sellingPrice: number;
  unitCost: number;
  shippingCost: number;
  avgPrice?: number;
  avgReviews?: number;
  dominantBrand?: boolean;
};

export function runDecisionEngine(input: DecisionInput): DecisionResponse {
  const totalCost = input.unitCost + input.shippingCost;
  const netProfit = input.sellingPrice - totalCost;
  const marginPercent = (netProfit / input.sellingPrice) * 100;

  let verdict: "GO" | "CAUTION" | "NO_GO" = "CAUTION";

  if (marginPercent >= 30) verdict = "GO";
  if (marginPercent < 15) verdict = "NO_GO";

  return {
    decision: {
      verdict,
      confidenceScore: Math.min(Math.max(Math.round(marginPercent * 2), 40), 90),
      reason:
        verdict === "GO"
          ? "Healthy margin with acceptable risk for a new seller."
          : verdict === "NO_GO"
          ? "Margins are too low to safely cover ads, returns, and mistakes."
          : "Margins exist, but risk factors require careful validation."
    },

    profitability: {
      sellingPrice: input.sellingPrice,
      unitCost: input.unitCost,
      shippingCost: input.shippingCost,
      totalCost,
      netProfit,
      marginPercent: Math.round(marginPercent * 10) / 10
    },

    market: {
      avgPrice: input.avgPrice ?? input.sellingPrice,
      avgRating: 4.2,
      avgReviews: input.avgReviews ?? 350,
      competitionLevel:
        (input.avgReviews ?? 0) > 1000 ? "HIGH" : "MEDIUM",
      dominantBrand: input.dominantBrand ?? false
    },

    insights: {
      riskLevel:
        verdict === "NO_GO" ? "HIGH" : verdict === "GO" ? "LOW" : "MEDIUM",
      keyRisks: [
        "Advertising costs may reduce net margins",
        "Review acquisition may take longer than expected"
      ],
      opportunities: [
        "Bundle differentiation opportunity",
        "Improved listing visuals can outperform competitors"
      ],
      differentiationIdeas: [
        "Add accessory or bonus item",
        "Improve packaging experience",
        "Target a clearer niche keyword"
      ],
      beginnerFit:
        verdict === "GO" ? "GOOD" : verdict === "CAUTION" ? "OK" : "BAD"
    },

    recommendation: {
      summary:
        verdict === "GO"
          ? "This product shows strong potential for a first launch."
          : verdict === "NO_GO"
          ? "This product is not recommended without major changes."
          : "Proceed only after validating demand and ad costs.",
      nextSteps: [
        "Validate keyword demand",
        "Estimate PPC costs",
        "Analyze top 5 competitors manually",
        "Confirm landed cost accuracy"
      ]
    }
  };
}