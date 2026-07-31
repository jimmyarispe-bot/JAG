/**
 * Financial impact estimates derived from pattern strength (illustrative, evidence-weighted).
 */

import type { FinancialImpact, InnovationPattern, OpportunityScores } from "../types";

export function estimateFinancialImpact(input: {
  pattern: InnovationPattern;
  scores: OpportunityScores;
}): FinancialImpact {
  const s = input.scores.total / 100;
  const strength = input.pattern.strength / 100;

  let productivityGainHours = Math.round(80 + strength * 400 + s * 200);
  let costReduction = Math.round(productivityGainHours * 45);
  let revenueOpportunity = 0;
  let riskReduction = Math.round(5000 + strength * 25000);
  let customerImpact = Math.round(40 + s * 50);
  let ebitdaImprovement = 0;

  switch (input.pattern.kind) {
    case "workflow_bottleneck":
    case "operational_inefficiency":
      productivityGainHours = Math.round(200 + strength * 500);
      costReduction = Math.round(productivityGainHours * 55);
      break;
    case "training_gap":
      productivityGainHours = Math.round(120 + strength * 280);
      costReduction = Math.round(productivityGainHours * 40);
      customerImpact = Math.round(50 + s * 40);
      break;
    case "feature_abandonment":
      revenueOpportunity = Math.round(15000 + strength * 80000);
      customerImpact = Math.round(60 + s * 35);
      break;
    case "performance_degradation":
      riskReduction = Math.round(20000 + strength * 60000);
      costReduction = Math.round(8000 + strength * 20000);
      break;
    case "frequently_requested":
      revenueOpportunity = Math.round(10000 + strength * 50000);
      productivityGainHours = Math.round(100 + strength * 300);
      costReduction = Math.round(productivityGainHours * 50);
      break;
    case "emerging_opportunity":
      revenueOpportunity = Math.round(20000 + strength * 100000);
      productivityGainHours = Math.round(150 + strength * 250);
      break;
  }

  ebitdaImprovement = Math.round(
    revenueOpportunity * 0.35 + costReduction * 0.7 + riskReduction * 0.15
  );

  return {
    revenueOpportunity,
    costReduction,
    productivityGainHours,
    riskReduction,
    customerImpact,
    ebitdaImprovement,
    currency: "USD",
  };
}
