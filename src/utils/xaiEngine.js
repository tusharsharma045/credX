/**
 * Dynamic XAI Counterfactual Simulator Helper Engine
 * Recalculates SHAP feature values and default probability based on user slider adjustments.
 */

export function calculateCounterfactualRisk(borrower, adjustedValues) {
  const {
    monthlyMobileInflow,
    supplierPunctuality,
    macroInflationShock,
    cashReserveMonths
  } = adjustedValues;

  const baseInflow = borrower.counterfactuals.monthlyMobileInflow;
  const basePunctuality = borrower.counterfactuals.supplierPunctuality;
  const baseMacroShock = borrower.counterfactuals.macroInflationShock;
  const baseReserve = borrower.counterfactuals.cashReserveMonths;

  // Calculate percentage deviations from baseline
  const inflowRatio = monthlyMobileInflow / baseInflow;
  const punctualityDelta = supplierPunctuality - basePunctuality; // in percentage points
  const macroShockRatio = macroInflationShock / (baseMacroShock || 1);
  const reserveDelta = cashReserveMonths - baseReserve;

  // Impact on Default Probability (Lower = Better)
  let defaultProbDelta = 0;

  // Inflow change: higher inflow reduces default risk
  defaultProbDelta -= (inflowRatio - 1) * 4.5;

  // Punctuality change: higher punctuality reduces default risk
  defaultProbDelta -= (punctualityDelta / 10) * 1.8;

  // Macro inflation shock: higher shock increases default risk
  defaultProbDelta += (macroShockRatio - 1) * 3.5;

  // Cash reserve: higher reserve buffer reduces default risk
  defaultProbDelta -= (reserveDelta) * 1.2;

  // Dynamic adjusted Default Probability (bounded between 0.5% and 45.0%)
  const rawProb = borrower.defaultProbability + defaultProbDelta;
  const adjustedDefaultProb = Math.max(0.5, Math.min(45.0, Number(rawProb.toFixed(1))));

  // Dynamic CredX AI Score (scale 300 to 950)
  // Approx mapping: 1% default = ~910 score, 20% default = ~550 score
  const adjustedCredxScore = Math.max(350, Math.min(950, Math.round(920 - (adjustedDefaultProb * 18.5))));

  // Update SHAP values dynamically for visualization
  const adjustedShapFeatures = borrower.shapFeatures.map(feat => {
    let newVal = feat.shapValue;

    if (feat.name.includes('Mobile Money') || feat.name.includes('POS') || feat.name.includes('UPI')) {
      newVal = feat.shapValue * inflowRatio;
    } else if (feat.name.includes('Supplier')) {
      newVal = feat.shapValue * (1 + punctualityDelta / 100);
    } else if (feat.name.includes('Volatility') || feat.name.includes('Inflation') || feat.name.includes('Devaluation')) {
      newVal = feat.shapValue * macroShockRatio;
    } else if (feat.name.includes('Reserve') || feat.name.includes('Collateral')) {
      newVal = feat.shapValue + (reserveDelta * 1.5);
    }

    return {
      ...feat,
      shapValue: Number(newVal.toFixed(1)),
      impact: newVal >= 0 ? 'positive' : 'negative'
    };
  });

  // Dynamic Underwriting Status
  let action = borrower.recommendation.action;
  if (adjustedDefaultProb <= 8.5) {
    action = 'APPROVE';
  } else if (adjustedDefaultProb <= 18.0) {
    action = 'CONDITIONAL APPROVAL';
  } else {
    action = 'DECLINE';
  }

  // Dynamic Interest Rate Adjustment
  const baseRate = borrower.recommendation.interestRatePct;
  const rateDelta = (adjustedDefaultProb - borrower.defaultProbability) * 0.45;
  const adjustedInterestRate = Math.max(7.5, Math.min(28.0, Number((baseRate + rateDelta).toFixed(1))));

  return {
    adjustedDefaultProb,
    adjustedCredxScore,
    adjustedShapFeatures,
    action,
    adjustedInterestRate
  };
}
