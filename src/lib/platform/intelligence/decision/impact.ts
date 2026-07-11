/**
 * Decision Intelligence — impact estimation.
 */

import {
  DECISION_IMPACT_DIMENSIONS,
  type DecisionAlternative,
  type DecisionImpactAssessment,
  type DecisionImpactDimension,
  type DecisionImpactScore,
  type DecisionRecommendation,
  type DecisionRequest,
  type DecisionRisksResult,
} from "@/lib/platform/intelligence/decision/types";

/**
 * Estimates multi-dimensional decision impact.
 */
export class DecisionImpact {
  assess(
    request: DecisionRequest,
    recommendation: DecisionRecommendation,
    risks: DecisionRisksResult,
    recommendedAlternative: DecisionAlternative | null
  ): DecisionImpactAssessment {
    const scores: DecisionImpactScore[] = DECISION_IMPACT_DIMENSIONS.map((dimension) => {
      const base = recommendedAlternative?.score ?? recommendation.confidence.value;
      const riskPenalty = riskPenaltyFor(dimension, risks);
      const score = Math.max(
        0,
        Math.min(1, Number((base * dimensionWeight(dimension, request) - riskPenalty).toFixed(4)))
      );
      return {
        dimension,
        score,
        rationale: `${dimension} impact estimated from recommended option and risk posture`,
      };
    });

    const overallScore =
      scores.length === 0
        ? 0
        : Number(
            (scores.reduce((sum, s) => sum + s.score, 0) / scores.length).toFixed(4)
          );

    const primaryDimensions = scores
      .filter((s) => s.score >= 0.5)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.dimension);

    return {
      requestId: request.requestId,
      scores,
      overallScore,
      primaryDimensions,
      summary: primaryDimensions.length
        ? `Primary impact dimensions: ${primaryDimensions.join(", ")} (overall ${overallScore}).`
        : `Diffuse impact (overall ${overallScore}).`,
      metadata: request.metadata,
    };
  }
}

function dimensionWeight(dimension: DecisionImpactDimension, request: DecisionRequest): number {
  const corpus = `${request.subject} ${request.description ?? ""}`.toLowerCase();
  const boosts: Record<DecisionImpactDimension, string[]> = {
    financial: ["cash", "budget", "revenue", "cost"],
    operational: ["operations", "process", "execution"],
    academic: ["academic", "learning", "student"],
    mission: ["mission", "equity", "impact"],
    community: ["community", "partner"],
    customer: ["family", "parent", "customer"],
    employee: ["staff", "teacher", "hiring", "retention"],
  };
  const hits = boosts[dimension].filter((c) => corpus.includes(c)).length;
  return 0.85 + Math.min(0.2, hits * 0.05);
}

function riskPenaltyFor(
  dimension: DecisionImpactDimension,
  risks: DecisionRisksResult
): number {
  const map: Partial<Record<DecisionImpactDimension, string>> = {
    financial: "financial",
    operational: "operational",
    academic: "academic",
    mission: "mission",
    customer: "customer",
    employee: "staffing",
  };
  const category = map[dimension];
  if (!category) return 0;
  const hit = risks.risks.find((r) => r.category === category);
  if (!hit) return 0;
  return hit.likelihood * 0.15;
}
