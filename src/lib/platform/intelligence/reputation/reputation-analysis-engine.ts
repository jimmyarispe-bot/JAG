import type { ReputationAnalysisEngineContract } from "@/lib/platform/intelligence/reputation/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/reputation/models";
import { REPUTATION_ANALYSIS_KINDS, type ReputationAnalysisSuite } from "@/lib/platform/intelligence/reputation/types";

export class ReputationAnalysisEngine implements ReputationAnalysisEngineContract {
  assess(input: Parameters<ReputationAnalysisEngineContract["assess"]>[0]): ReputationAnalysisSuite {
    const scoreFor = (kind: (typeof REPUTATION_ANALYSIS_KINDS)[number]) => {
      switch (kind) {
        case "trends": return clamp(70 - input.baseline.crisisRisk / 5);
        case "forecasts": return input.forecasts.maturityScore;
        case "scenario_planning": return input.baseline.scenarioMaturity;
        case "trust_assessment": return input.baseline.trustLevel;
        case "brand_strength": return input.baseline.brandStrength;
        case "media_exposure": return clamp(100 - input.baseline.mediaExposure);
        case "narrative_momentum": return input.baseline.narrativeMomentum;
        case "sentiment": return input.baseline.publicPerception;
        case "crisis_risk": return clamp(100 - input.baseline.crisisRisk);
        case "credibility": return input.baseline.credibilityIndex;
        case "reputation_recovery": return input.baseline.recoveryCapacity;
        case "early_warning": return clamp((input.baseline.scenarioMaturity + input.baseline.trustLevel) / 2);
      }
    };
    const analyses = REPUTATION_ANALYSIS_KINDS.map(kind => {
      const score = scoreFor(kind);
      return {
        id: input.createId("rep-analysis"),
        kind,
        title: `${kind.replaceAll("_", " ")} analysis`,
        score,
        status: score >= 75 ? "favorable" as const : score >= 60 ? "improving" as const : "at_risk" as const,
        lenses: buildLens({
          trustLevel: `${kind} score ${Math.round(score)}.`,
          publicPerception: `Perception lens through ${kind.replaceAll("_", " ")}.`,
          brandStrength: `Brand posture responds to ${kind.replaceAll("_", " ")}.`,
          mediaExposure: `Media implications of ${kind.replaceAll("_", " ")}.`,
          crisisRisk: `Crisis tracked through ${kind.replaceAll("_", " ")}.`,
          narrativeMomentum: `Narrative implications of ${kind.replaceAll("_", " ")}.`,
          credibility: `Credibility pressure under ${kind.replaceAll("_", " ")}.`,
          longTermReputationOutlook: `Use ${kind.replaceAll("_", " ")} insight to time reputation response.`,
        }),
        narrative: `${kind} analysis score ${Math.round(score)}.`,
      };
    });
    return {
      analyses,
      kindsCovered: [...REPUTATION_ANALYSIS_KINDS],
      maturityScore: analyses.reduce((s, a) => s + a.score, 0) / analyses.length,
      narrative: `Reputation analysis covers ${REPUTATION_ANALYSIS_KINDS.length} decision lenses.`,
    };
  }
}
