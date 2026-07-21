import type {
  AnalyzerOutput,
  ExecutiveBrief,
  SynthesisRequest,
  SynthesisRecommendation,
  SynthesizedInsight,
} from "@/lib/platform/intelligence/synthesis/types";
import { SYNTHESIS_INTELLIGENCE_VERSION } from "@/lib/platform/intelligence/synthesis/types";
import { buildOvernightSummary } from "@/lib/platform/intelligence/synthesis/briefing/overnight-summary";

export function generateExecutiveBrief(input: {
  request: SynthesisRequest;
  insights: SynthesizedInsight[];
  analyzerOutput: AnalyzerOutput;
  recommendations: SynthesisRecommendation[];
  createId: (prefix: string) => string;
  now: () => Date;
}): ExecutiveBrief {
  const { request, insights, analyzerOutput, recommendations, createId, now } = input;
  const byDomain: Record<string, number> = {};
  for (const s of request.signals ?? []) {
    byDomain[s.domain] = s.score ?? s.healthScore?.value ?? 50;
  }

  const topInsight = insights[0];
  const executiveSummary =
    topInsight?.summary ??
    (request.signals?.length
      ? "Cross-domain signals were reviewed; no dominant synthesized narrative exceeded confidence thresholds."
      : "No domain signals were supplied — synthesis returned an empty executive brief.");

  return {
    id: createId("brief"),
    generatedAt: now().toISOString(),
    scope: request.scope,
    executiveSummary,
    topRisks: analyzerOutput.risks.slice(0, 5),
    topOpportunities: analyzerOutput.opportunities.slice(0, 5),
    decisionsNeeded: recommendations.flatMap((r) => r.recommendedActions).slice(0, 5),
    criticalAlerts: analyzerOutput.risks
      .filter((r) => r.severity >= 70)
      .map((r) => r.title)
      .slice(0, 5),
    emergingTrends: analyzerOutput.trends.slice(0, 5),
    crossDomainCorrelations: analyzerOutput.correlations.slice(0, 5),
    recommendedActions: recommendations.flatMap((r) => r.recommendedActions).slice(0, 8),
    confidenceSummary: {
      overall: topInsight?.scores.confidence ?? 35,
      byDomain,
    },
    insights,
    overnightSummary: buildOvernightSummary(insights),
    version: SYNTHESIS_INTELLIGENCE_VERSION,
  };
}
