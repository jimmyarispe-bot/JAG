import type { BehavioralAnalysisEngineContract } from "@/lib/platform/intelligence/behavioral/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/behavioral/models";
import { BEHAVIORAL_ANALYSIS_KINDS, type BehavioralAnalysisSuite } from "@/lib/platform/intelligence/behavioral/types";

export class BehavioralAnalysisEngine implements BehavioralAnalysisEngineContract {
  assess(input: Parameters<BehavioralAnalysisEngineContract["assess"]>[0]): BehavioralAnalysisSuite {
    const scoreFor = (kind: (typeof BEHAVIORAL_ANALYSIS_KINDS)[number]) => {
      switch (kind) {
        case "trends": return clamp(70 - input.baseline.changeResistance / 5);
        case "forecasts": return input.forecasts.maturityScore;
        case "scenario_planning": return input.baseline.scenarioMaturity;
        case "decision_modeling": return input.baseline.decisionConfidence;
        case "cognitive_bias": return clamp(100 - input.baseline.cognitiveBiasRisk);
        case "motivation_alignment": return input.baseline.motivationAlignment;
        case "adoption_probability": return input.baseline.adoptionProbability;
        case "collaboration_impact": return input.baseline.collaborationImpact;
        case "change_resistance": return clamp(100 - input.baseline.changeResistance);
        case "leadership_readiness": return input.baseline.leadershipReadiness;
        case "behavioral_risk": return clamp(100 - input.baseline.cognitiveBiasRisk);
        case "early_warning": return clamp((input.baseline.scenarioMaturity + input.baseline.decisionConfidence) / 2);
      }
    };
    const analyses = BEHAVIORAL_ANALYSIS_KINDS.map(kind => {
      const score = scoreFor(kind);
      return {
        id: input.createId("beh-analysis"),
        kind,
        title: `${kind.replaceAll("_", " ")} analysis`,
        score,
        status: score >= 75 ? "favorable" as const : score >= 60 ? "improving" as const : "at_risk" as const,
        lenses: buildLens({
          decisionConfidence: `${kind} score ${Math.round(score)}.`,
          cognitiveBiasRisk: `Bias lens through ${kind.replaceAll("_", " ")}.`,
          motivationAlignment: `Motivation posture responds to ${kind.replaceAll("_", " ")}.`,
          adoptionProbability: `Adoption implications of ${kind.replaceAll("_", " ")}.`,
          collaborationImpact: `Collaboration implications of ${kind.replaceAll("_", " ")}.`,
          changeResistance: `Resistance tracked through ${kind.replaceAll("_", " ")}.`,
          leadershipReadiness: `Leadership pressure under ${kind.replaceAll("_", " ")}.`,
          longTermBehavioralOutlook: `Use ${kind.replaceAll("_", " ")} insight to time behavioral response.`,
        }),
        narrative: `${kind} analysis score ${Math.round(score)}.`,
      };
    });
    return {
      analyses,
      kindsCovered: [...BEHAVIORAL_ANALYSIS_KINDS],
      maturityScore: analyses.reduce((s, a) => s + a.score, 0) / analyses.length,
      narrative: `Behavioral analysis covers ${BEHAVIORAL_ANALYSIS_KINDS.length} decision lenses.`,
    };
  }
}
