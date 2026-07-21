import type {
  AnalyzerOutput,
  RootCauseAnalysis,
  SynthesisRecommendation,
  SynthesisScores,
} from "@/lib/platform/intelligence/synthesis/types";
import { proposeExecutiveActions } from "@/lib/platform/intelligence/synthesis/recommendations/executive-actions";
import { estimateRecommendationImpact } from "@/lib/platform/intelligence/synthesis/recommendations/impact-estimator";

export function buildRecommendations(
  rootCause: RootCauseAnalysis,
  scores: SynthesisScores,
  analyzerOutput: AnalyzerOutput,
  createId: (prefix: string) => string
): SynthesisRecommendation[] {
  const actions = proposeExecutiveActions(rootCause, scores);
  return [
    {
      id: createId("rec"),
      executiveSummary: rootCause.likelyCause,
      supportingEvidence: rootCause.supportingEvidence,
      recommendedActions: actions,
      expectedImpact: estimateRecommendationImpact(scores),
      estimatedEffort:
        scores.priority === "critical" || scores.priority === "high" ? "high" : scores.priority === "medium" ? "medium" : "low",
      confidence: rootCause.confidence,
      dependencies: rootCause.affectedDomains,
      risks: [
        ...analyzerOutput.risks.slice(0, 3).map((r) => r.title),
        ...(analyzerOutput.contradictions.length
          ? ["Unresolved contradictory signals may invalidate a single-threaded plan"]
          : []),
      ],
    },
  ];
}
