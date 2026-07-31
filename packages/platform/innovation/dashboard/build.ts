/**
 * Executive innovation dashboard.
 */

import { buildMrJagHighlights } from "../recommendations/mr-jag";
import { buildInnovationPortfolio } from "../portfolio/build";
import {
  getLastScanAt,
  listOpportunities,
  listPatterns,
  listSignals,
} from "../store";
import type { InnovationDashboard } from "../types";

export function buildInnovationDashboard(organizationId?: string): InnovationDashboard {
  const pipeline = listOpportunities({ limit: 50 });
  const patterns = listPatterns(24);
  const signals = listSignals({ organizationId, limit: 200 });
  const portfolio = buildInnovationPortfolio();

  const highestValue = [...pipeline]
    .sort((a, b) => b.scores.businessValue - a.scores.businessValue)
    .slice(0, 8);
  const highestConfidence = [...pipeline]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8);
  const quickWins = pipeline.filter(
    (o) => o.portfolioCategory === "Quick Wins"
  );
  const strategicInvestments = pipeline.filter(
    (o) => o.portfolioCategory === "Strategic Investments"
  );
  const expectedRoi = Math.round(
    pipeline.reduce(
      (a, o) =>
        a +
        o.financial.ebitdaImprovement *
          (o.scores.confidence / 100) *
          (o.scores.total / 100),
      0
    )
  );

  void getLastScanAt;

  return {
    generatedAt: new Date().toISOString(),
    pipeline,
    highestValue: Object.freeze(highestValue),
    highestConfidence: Object.freeze(highestConfidence),
    quickWins: Object.freeze(quickWins),
    strategicInvestments: Object.freeze(strategicInvestments),
    expectedRoi,
    portfolioMix: portfolio.mix,
    patterns,
    signalCount: signals.length,
    mrJagHighlights: buildMrJagHighlights(pipeline, patterns),
  };
}
