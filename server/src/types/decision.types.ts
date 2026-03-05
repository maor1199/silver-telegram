export function decisionEngine(data: any) {

  const {
    profitAfterAds,
    avgReviews,
    dominantBrand,
    complexity
  } = data;

  let score = 0;

  // Profitability
  if (profitAfterAds > 8) score += 30;
  else if (profitAfterAds > 3) score += 18;
  else score += 5;

  // Competition
  if (avgReviews < 500) score += 20;
  else if (avgReviews < 2000) score += 10;
  else score += 5;

  // Dominant brand
  if (!dominantBrand) score += 10;

  // Complexity
  if (complexity === "low") score += 15;
  else if (complexity === "medium") score += 8;
  else score += 3;

  let verdict = "NO_GO";
  let confidence = 40;

  if (score >= 70) {
    verdict = "GO";
    confidence = 85;
  } else if (score >= 50) {
    verdict = "GO_BUT";
    confidence = 65;
  }

  return { score, verdict, confidence };
}