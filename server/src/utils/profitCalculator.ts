export function calculateProfitability(
  price: number,
  unitCost: number,
  shippingCost: number
) {
  const amazonFeeRate = 0.15;
  const amazonFee = price * amazonFeeRate;

  const totalCost = unitCost + shippingCost + amazonFee;
  const grossProfit = price - totalCost;
  const marginPercent = (grossProfit / price) * 100;

  return {
    price,
    unitCost,
    shippingCost,
    amazonFee: Number(amazonFee.toFixed(2)),
    grossProfit: Number(grossProfit.toFixed(2)),
    marginPercent: Number(marginPercent.toFixed(1)),
  };
}