/**
 * Innovation analytics snapshot.
 */

import { getLastScanAt, listOpportunities, listPatterns, listSignals } from "../store";

export function getInnovationAnalytics(organizationId?: string) {
  const opportunities = listOpportunities({ limit: 100 });
  const patterns = listPatterns(50);
  const signals = listSignals({ organizationId, limit: 200 });
  const byKind: Record<string, number> = {};
  for (const p of patterns) {
    byKind[p.kind] = (byKind[p.kind] ?? 0) + 1;
  }
  return {
    generatedAt: new Date().toISOString(),
    lastScanAt: getLastScanAt(),
    signalCount: signals.length,
    patternCount: patterns.length,
    opportunityCount: opportunities.length,
    patternsByKind: Object.freeze(byKind),
    averageConfidence:
      opportunities.length === 0
        ? 0
        : Math.round(
            opportunities.reduce((a, o) => a + o.confidence, 0) /
              opportunities.length
          ),
    totalEbitdaEstimate: opportunities.reduce(
      (a, o) => a + o.financial.ebitdaImprovement,
      0
    ),
  };
}
