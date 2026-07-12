/**
 * Executive Decision Intelligence — DecisionProjection (Sprint 026).
 */

import type { DecisionProjection as DecisionProjectionContract } from "@/lib/platform/intelligence/executive-decision/contracts";
import type {
  DecisionConfidenceScore,
  DecisionProjectionResult,
  ExecutiveDecisionRecommendation,
  ExecutiveDecisionRequest,
  ScenarioSimulationResult,
} from "@/lib/platform/intelligence/executive-decision/types";

export interface DecisionProjectionDependencies {
  now?: () => Date;
}

/**
 * DecisionProjection — flattens decision results for executive briefings / UI.
 */
export class DecisionProjectionEngine implements DecisionProjectionContract {
  private readonly now: () => Date;

  constructor(dependencies: DecisionProjectionDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
  }

  project(input: {
    request: ExecutiveDecisionRequest;
    recommendations: ExecutiveDecisionRecommendation[];
    simulations: ScenarioSimulationResult[];
    confidence: DecisionConfidenceScore;
  }): DecisionProjectionResult {
    const { request, recommendations, simulations, confidence } = input;
    const top = recommendations[0] ?? null;
    const rois = recommendations.map((r) => r.expectedRoi);
    const averageRoi =
      rois.length === 0 ? 0 : rois.reduce((s, v) => s + v, 0) / rois.length;
    const highestRoi = rois.length === 0 ? 0 : Math.max(...rois);

    const headline = top
      ? `Decision: ${top.action}`
      : `Decision analysis ready for: ${request.question}`;

    return {
      generatedAt: this.now().toISOString(),
      headline,
      question: request.question,
      topRecommendation: top,
      recommendations,
      scenarios: simulations.map((s) => ({
        scenarioId: s.scenario.id,
        title: s.scenario.title,
        kind: s.scenario.kind,
        netFinancialDelta: s.forecast.financial.netDelta,
        confidence: s.confidence.level,
        summary: s.summary,
      })),
      overallConfidence: confidence,
      keyRisks: recommendations.flatMap((r) => r.risks).slice(0, 5),
      keyDependencies: recommendations.flatMap((r) => r.dependencies).slice(0, 5),
      metrics: {
        scenarioCount: simulations.length,
        recommendationCount: recommendations.length,
        averageRoi,
        highestRoi,
      },
    };
  }
}

/** Alias matching Sprint 026 naming. */
export { DecisionProjectionEngine as DecisionProjection };
