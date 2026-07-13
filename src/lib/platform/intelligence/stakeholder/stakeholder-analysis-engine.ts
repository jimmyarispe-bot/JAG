import type { StakeholderAnalysisEngineContract } from "@/lib/platform/intelligence/stakeholder/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/stakeholder/models";
import { STAKEHOLDER_ANALYSIS_KINDS, type StakeholderAnalysisSuite } from "@/lib/platform/intelligence/stakeholder/types";

export class StakeholderAnalysisEngine implements StakeholderAnalysisEngineContract {
  assess(input: Parameters<StakeholderAnalysisEngineContract["assess"]>[0]): StakeholderAnalysisSuite {
    const scoreFor = (kind: (typeof STAKEHOLDER_ANALYSIS_KINDS)[number]) => {
      switch (kind) {
        case "trends": return clamp(70 - input.baseline.influencePressure / 5);
        case "forecasts": return input.forecasts.maturityScore;
        case "scenario_planning": return input.baseline.scenarioMaturity;
        case "influence_mapping": return clamp(100 - input.baseline.influencePressure);
        case "interest_alignment": return input.baseline.interestAlignment;
        case "relationship_strength": return input.baseline.relationshipStrength;
        case "engagement_quality": return input.baseline.engagementQuality;
        case "sentiment": return input.baseline.satisfactionIndex;
        case "conflict_risk": return clamp(100 - (100 - input.baseline.trustLevel) * .6);
        case "collaboration_opportunity": return input.baseline.collaborationPotential;
        case "strategic_importance": return input.baseline.strategicImportance;
        case "early_warning": return clamp((input.baseline.scenarioMaturity + input.baseline.trustLevel) / 2);
      }
    };
    const analyses = STAKEHOLDER_ANALYSIS_KINDS.map(kind => {
      const score = scoreFor(kind);
      return {
        id: input.createId("stk-analysis"),
        kind,
        title: `${kind.replaceAll("_", " ")} analysis`,
        score,
        status: score >= 75 ? "favorable" as const : score >= 60 ? "improving" as const : "at_risk" as const,
        lenses: buildLens({
          influence: `${kind} score ${Math.round(score)}.`,
          interest: `Interest lens through ${kind.replaceAll("_", " ")}.`,
          trust: `Trust posture responds to ${kind.replaceAll("_", " ")}.`,
          engagement: `Engagement implications of ${kind.replaceAll("_", " ")}.`,
          satisfaction: `Satisfaction tracked through ${kind.replaceAll("_", " ")}.`,
          relationshipStrength: `Relationship implications of ${kind.replaceAll("_", " ")}.`,
          collaborationOpportunity: `Collaboration pressure under ${kind.replaceAll("_", " ")}.`,
          strategicImportance: `Use ${kind.replaceAll("_", " ")} insight to time stakeholder response.`,
        }),
        narrative: `${kind} analysis score ${Math.round(score)}.`,
      };
    });
    return {
      analyses,
      kindsCovered: [...STAKEHOLDER_ANALYSIS_KINDS],
      maturityScore: analyses.reduce((s, a) => s + a.score, 0) / analyses.length,
      narrative: `Stakeholder analysis covers ${STAKEHOLDER_ANALYSIS_KINDS.length} decision lenses.`,
    };
  }
}
