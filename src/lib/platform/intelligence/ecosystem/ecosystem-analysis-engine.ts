import type { EcosystemAnalysisEngineContract } from "@/lib/platform/intelligence/ecosystem/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/ecosystem/models";
import { ECOSYSTEM_ANALYSIS_KINDS, type EcosystemAnalysisSuite } from "@/lib/platform/intelligence/ecosystem/types";

export class EcosystemAnalysisEngine implements EcosystemAnalysisEngineContract {
  assess(input: Parameters<EcosystemAnalysisEngineContract["assess"]>[0]): EcosystemAnalysisSuite {
    const scoreFor = (kind: (typeof ECOSYSTEM_ANALYSIS_KINDS)[number]) => {
      switch (kind) {
        case "trends": return clamp(70 - (100 - input.baseline.forecastMaturity) * .2);
        case "forecasts": return clamp(input.forecasts.maturityScore);
        case "scenario_planning": return clamp(input.baseline.scenarioMaturity);
        case "network_strength": return clamp(input.baseline.networkStrength);
        case "strategic_partnerships": return clamp(input.baseline.strategicPartnerships);
        case "ecosystem_health": return clamp(input.baseline.ecosystemHealth);
        case "collaboration_potential": return clamp(input.baseline.collaborationPotential);
        case "dependency_risk": return clamp(100 - input.baseline.dependencyRisk);
        case "network_effects": return clamp(input.baseline.networkEffects);
        case "strategic_position": return clamp(input.baseline.strategicPosition);
        case "ecosystem_risk": return clamp(input.baseline.areaScores.ecosystem_risk);
        case "early_warning": return clamp(input.baseline.longTermEcosystemOutlook);
        default: return 65;
      }
    };
    const analyses = ECOSYSTEM_ANALYSIS_KINDS.map((kind) => {
      const score = scoreFor(kind);
      return {
        id: input.createId("esm-analysis"),
        kind,
        title: `${kind.replaceAll("_", " ")} analysis`,
        score,
        status: score >= 75 ? "favorable" as const : score >= 60 ? "improving" as const : "at_risk" as const,
        lenses: buildLens({
          networkStrength: `Network strength through ${kind}.`,
          strategicPartnerships: `Strategic partnerships reading for ${kind}.`,
          ecosystemHealth: `Ecosystem health for ${kind}.`,
          collaborationPotential: `Collaboration potential around ${kind}.`,
          dependencyRisk: `Dependency risk of ${kind}.`,
          networkEffects: `Network effects in ${kind}.`,
          strategicPosition: `Strategic position for ${kind}.`,
          longTermEcosystemOutlook: `Long-term ecosystem outlook via ${kind}.`,
        }),
        narrative: `${kind} analysis scored ${Math.round(score)}.`,
      };
    });
    const maturityScore = clamp(analyses.reduce((s, a) => s + a.score, 0) / analyses.length);
    return {
      analyses,
      kindsCovered: [...ECOSYSTEM_ANALYSIS_KINDS],
      maturityScore,
      narrative: `Ecosystem analysis maturity ${Math.round(maturityScore)} across ${analyses.length} kinds.`,
    };
  }
}
