import type { EconomicAnalysisEngineContract } from "@/lib/platform/intelligence/economic/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/economic/models";
import { ECONOMIC_ANALYSIS_KINDS, type EconomicAnalysisSuite } from "@/lib/platform/intelligence/economic/types";

export class EconomicAnalysisEngine implements EconomicAnalysisEngineContract {
  assess(input: Parameters<EconomicAnalysisEngineContract["assess"]>[0]): EconomicAnalysisSuite {
    const scoreFor = (kind: (typeof ECONOMIC_ANALYSIS_KINDS)[number]) => {
      switch (kind) {
        case "trends": return clamp(70 - input.baseline.costPressure / 5);
        case "forecasts": return input.forecasts.maturityScore;
        case "scenario_planning": return input.baseline.scenarioMaturity;
        case "cost_pressure": return clamp(100 - input.baseline.costPressure);
        case "labor_availability": return input.baseline.laborAvailability;
        case "funding_environment": return input.baseline.fundingEnvironment;
        case "purchasing_power": return input.baseline.purchasingPower;
        case "pricing_pressure": return clamp(100 - input.baseline.pricingPressure);
        case "economic_risk": return clamp(100 - (input.baseline.costPressure + input.baseline.inflationPressure) / 2);
        case "economic_opportunity": return clamp((input.baseline.fundingEnvironment + input.baseline.purchasingPower) / 2);
        case "economic_sensitivity": return clamp(input.baseline.evidenceCoverage);
      }
    };
    const analyses = ECONOMIC_ANALYSIS_KINDS.map(kind => {
      const score = scoreFor(kind);
      return {
        id: input.createId("eco-analysis"),
        kind,
        title: `${kind.replaceAll("_", " ")} analysis`,
        score,
        status: score >= 75 ? "favorable" as const : score >= 60 ? "improving" as const : "at_risk" as const,
        lenses: buildLens({
          economicForces: `${kind} score ${Math.round(score)}.`,
          evidenceSupports: `${input.forecasts.narrative} ${input.scenarios.narrative}`,
          confidenceLevel: input.baseline.evidenceCoverage >= 70 ? "high" : "medium",
          organizationalAreas: "Strategy, finance, operations, and workforce.",
          financialImplications: `Financial posture responds to ${kind.replaceAll("_", " ")}.`,
          operationalImplications: `Operating model absorbs ${kind.replaceAll("_", " ")} findings.`,
          strategicOptions: `Use ${kind.replaceAll("_", " ")} insight to reallocate focus.`,
          scenariosToMonitor: input.scenarios.primaryScenario,
        }),
        narrative: `${kind} analysis score ${Math.round(score)}.`,
      };
    });
    return {
      analyses,
      kindsCovered: [...ECONOMIC_ANALYSIS_KINDS],
      maturityScore: analyses.reduce((s, a) => s + a.score, 0) / analyses.length,
      narrative: `Economic analysis covers ${ECONOMIC_ANALYSIS_KINDS.length} decision lenses.`,
    };
  }
}
