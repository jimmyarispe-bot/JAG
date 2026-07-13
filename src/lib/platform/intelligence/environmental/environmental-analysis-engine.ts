import type { EnvironmentalAnalysisEngineContract } from "@/lib/platform/intelligence/environmental/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/environmental/models";
import { ENVIRONMENTAL_ANALYSIS_KINDS, type EnvironmentalAnalysisSuite } from "@/lib/platform/intelligence/environmental/types";

export class EnvironmentalAnalysisEngine implements EnvironmentalAnalysisEngineContract {
  assess(input: Parameters<EnvironmentalAnalysisEngineContract["assess"]>[0]): EnvironmentalAnalysisSuite {
    const scoreFor = (kind: (typeof ENVIRONMENTAL_ANALYSIS_KINDS)[number]) => {
      switch (kind) {
        case "trends": return clamp(70 - input.baseline.climateRisk / 5);
        case "forecasts": return input.forecasts.maturityScore;
        case "scenario_planning": return input.baseline.scenarioMaturity;
        case "climate_risk": return clamp(100 - input.baseline.climateRisk);
        case "disaster_impact": return clamp(100 - input.baseline.facilityExposure);
        case "sustainability": return input.baseline.sustainabilityMaturity;
        case "infrastructure_resilience": return input.baseline.infrastructureResilience;
        case "resource_availability": return input.baseline.resourceAvailability;
        case "regulatory_exposure": return clamp(100 - input.baseline.regulatoryExposure);
        case "insurance_risk": return clamp(100 - input.baseline.insurancePressure);
        case "environmental_opportunity": return clamp((input.baseline.sustainabilityMaturity + input.baseline.resourceAvailability) / 2);
        case "long_term_outlook": return clamp((input.baseline.scenarioMaturity + input.baseline.infrastructureResilience) / 2);
      }
    };
    const analyses = ENVIRONMENTAL_ANALYSIS_KINDS.map(kind => {
      const score = scoreFor(kind);
      return {
        id: input.createId("env-analysis"),
        kind,
        title: `${kind.replaceAll("_", " ")} analysis`,
        score,
        status: score >= 75 ? "favorable" as const : score >= 60 ? "improving" as const : "at_risk" as const,
        lenses: buildLens({
          climateRisk: `${kind} score ${Math.round(score)}.`,
          facilityExposure: `Facility lens through ${kind.replaceAll("_", " ")}.`,
          infrastructureResilience: `Infrastructure posture responds to ${kind.replaceAll("_", " ")}.`,
          resourceAvailability: `Resource implications of ${kind.replaceAll("_", " ")}.`,
          sustainabilityImpact: `Sustainability tracked through ${kind.replaceAll("_", " ")}.`,
          regulatoryExposure: `Regulatory implications of ${kind.replaceAll("_", " ")}.`,
          insuranceRisk: `Insurance pressure under ${kind.replaceAll("_", " ")}.`,
          longTermEnvironmentalOutlook: `Use ${kind.replaceAll("_", " ")} insight to time environmental response.`,
        }),
        narrative: `${kind} analysis score ${Math.round(score)}.`,
      };
    });
    return {
      analyses,
      kindsCovered: [...ENVIRONMENTAL_ANALYSIS_KINDS],
      maturityScore: analyses.reduce((s, a) => s + a.score, 0) / analyses.length,
      narrative: `Environmental analysis covers ${ENVIRONMENTAL_ANALYSIS_KINDS.length} decision lenses.`,
    };
  }
}
