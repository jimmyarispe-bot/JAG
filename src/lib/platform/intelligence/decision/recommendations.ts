/**
 * Decision Intelligence — recommendations.
 */

import type {
  DecisionAlternativesResult,
  DecisionAnalysisResult,
  DecisionRecommendation,
  DecisionRequest,
  DecisionRisksResult,
} from "@/lib/platform/intelligence/decision/types";

/**
 * Ranks alternatives and recommends the top option.
 */
export class DecisionRecommendations {
  recommend(
    request: DecisionRequest,
    analysis: DecisionAnalysisResult,
    alternatives: DecisionAlternativesResult,
    risks: DecisionRisksResult
  ): DecisionRecommendation {
    const ranked = [...alternatives.alternatives].sort((a, b) => b.score - a.score);
    const top = ranked[0];
    if (!top) {
      return {
        recommendationId: `${request.requestId}:recommendation`,
        requestId: request.requestId,
        priority: analysis.priority,
        confidence: analysis.confidence,
        expectedValue: "No alternatives available",
        recommendedAlternativeId: "",
        recommendedOption: "No recommendation",
        rankedAlternativeIds: [],
        rationale: ["No alternatives were generated"],
        metadata: request.metadata,
      };
    }

    const rationale = [
      `Selected "${top.title}" with score ${top.score}`,
      `Priority ${analysis.priority} based on decision framing`,
      risks.primaryRisk
        ? `Primary risk considered: ${risks.primaryRisk.title}`
        : "No primary risk flagged",
      `Expected impact: ${top.expectedImpact}`,
    ];

    return {
      recommendationId: `${request.requestId}:recommendation`,
      requestId: request.requestId,
      priority: analysis.priority,
      confidence: {
        value: Number(
          ((top.confidence.value * 0.6 + analysis.confidence.value * 0.4)).toFixed(4)
        ),
        level: top.confidence.level,
        factors: [
          ...top.confidence.factors,
          {
            key: "analysis_confidence",
            label: "Analysis Confidence",
            contribution: analysis.confidence.value,
          },
        ],
      },
      expectedValue: top.expectedImpact,
      recommendedAlternativeId: top.alternativeId,
      recommendedOption: top.title,
      rankedAlternativeIds: ranked.map((a) => a.alternativeId),
      rationale,
      metadata: request.metadata,
    };
  }
}
