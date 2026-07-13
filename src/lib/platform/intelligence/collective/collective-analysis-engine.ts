import type { CollectiveAnalysisEngineContract } from "@/lib/platform/intelligence/collective/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/collective/models";
import { COLLECTIVE_ANALYSIS_KINDS, type CollectiveAnalysisSuite } from "@/lib/platform/intelligence/collective/types";

/** Primary analysis engine. */
export class CollectiveAnalysisEngine implements CollectiveAnalysisEngineContract {
  assess(input: Parameters<CollectiveAnalysisEngineContract["assess"]>[0]): CollectiveAnalysisSuite {
    const scoreFor = (kind: (typeof COLLECTIVE_ANALYSIS_KINDS)[number]) => {
      switch (kind) {
        case "trends": return clamp(70 - (100 - input.baseline.forecastMaturity) * .2);
        case "forecasts": return clamp(input.forecasts.maturityScore);
        case "scenario_planning": return clamp(input.baseline.scenarioMaturity);
        case "consensus_strength": return clamp(input.baseline.consensusStrength);
        case "expertise_coverage": return clamp(input.baseline.expertiseCoverage);
        case "perspective_diversity": return clamp(input.baseline.perspectiveDiversity);
        case "cross_domain_agreement": return clamp(input.baseline.crossDomainAgreement);
        case "organizational_alignment": return clamp(input.baseline.organizationalAlignment);
        case "collaboration_quality": return clamp(input.baseline.collaborationQuality);
        case "collective_confidence": return clamp(input.baseline.collectiveConfidence);
        case "long_term_collective_value": return clamp(input.baseline.longTermCollectiveValue);
        case "early_warning": return clamp(input.baseline.longTermCollectiveValue);
        default: return 65;
      }
    };
    const analyses = COLLECTIVE_ANALYSIS_KINDS.map((kind) => {
      const score = scoreFor(kind);
      return {
        id: input.createId("col-analysis"),
        kind,
        title: `${kind.replaceAll("_", " ")} analysis`,
        score,
        status: score >= 75 ? "favorable" as const : score >= 60 ? "improving" as const : "at_risk" as const,
        lenses: buildLens({
          consensusStrength: `Consensus strength through ${kind}.`,
          expertiseCoverage: `Expertise coverage reading for ${kind}.`,
          perspectiveDiversity: `Perspective diversity in ${kind}.`,
          crossDomainAgreement: `Cross-domain agreement for ${kind}.`,
          organizationalAlignment: `Organizational alignment of ${kind}.`,
          collaborationQuality: `Collaboration quality for ${kind}.`,
          collectiveConfidence: `Collective confidence via ${kind}.`,
          longTermCollectiveValue: `Long-term collective value via ${kind}.`,
        }),
        narrative: `${kind} analysis scored ${Math.round(score)}.`,
      };
    });
    const maturityScore = clamp(analyses.reduce((s, a) => s + a.score, 0) / analyses.length);
    return {
      analyses,
      kindsCovered: [...COLLECTIVE_ANALYSIS_KINDS],
      maturityScore,
      narrative: `Collective analysis maturity ${Math.round(maturityScore)} across ${analyses.length} kinds.`,
    };
  }
}
