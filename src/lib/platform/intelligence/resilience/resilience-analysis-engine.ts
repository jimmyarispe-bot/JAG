import type { ResilienceAnalysisEngineContract } from "@/lib/platform/intelligence/resilience/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/resilience/models";
import { RESILIENCE_ANALYSIS_KINDS, type ResilienceAnalysisSuite } from "@/lib/platform/intelligence/resilience/types";

export class ResilienceAnalysisEngine implements ResilienceAnalysisEngineContract {
  assess(input: Parameters<ResilienceAnalysisEngineContract["assess"]>[0]): ResilienceAnalysisSuite {
    const scoreFor = (kind: (typeof RESILIENCE_ANALYSIS_KINDS)[number]) => {
      switch (kind) {
        case "trends": return clamp(70 - (100 - input.baseline.forecastMaturity) * .2);
        case "forecasts": return clamp(input.forecasts.maturityScore);
        case "scenario_planning": return clamp(input.baseline.scenarioMaturity);
        case "organizational_readiness": return clamp(input.baseline.organizationalReadiness);
        case "recovery_capability": return clamp(input.baseline.recoveryCapability);
        case "operational_stability": return clamp(input.baseline.operationalStability);
        case "financial_stability": return clamp(input.baseline.financialStability);
        case "workforce_stability": return clamp(input.baseline.workforceStability);
        case "infrastructure_readiness": return clamp(input.baseline.infrastructureReadiness);
        case "adaptive_capacity": return clamp(input.baseline.adaptiveCapacity);
        case "stress_testing": return clamp(input.baseline.areaScores.stress_testing);
        case "early_warning": return clamp(input.baseline.longTermResilienceOutlook);
        default: return 65;
      }
    };
    const analyses = RESILIENCE_ANALYSIS_KINDS.map((kind) => {
      const score = scoreFor(kind);
      return {
        id: input.createId("rsl-analysis"),
        kind,
        title: `${kind.replaceAll("_", " ")} analysis`,
        score,
        status: score >= 75 ? "favorable" as const : score >= 60 ? "improving" as const : "at_risk" as const,
        lenses: buildLens({
          organizationalReadiness: `Organizational readiness through ${kind}.`,
          recoveryCapability: `Recovery capability reading for ${kind}.`,
          operationalStability: `Operational stability for ${kind}.`,
          financialStability: `Financial stability around ${kind}.`,
          workforceStability: `Workforce stability of ${kind}.`,
          infrastructureReadiness: `Infrastructure readiness in ${kind}.`,
          adaptiveCapacity: `Adaptive capacity for ${kind}.`,
          longTermResilienceOutlook: `Long-term resilience outlook via ${kind}.`,
        }),
        narrative: `${kind} analysis scored ${Math.round(score)}.`,
      };
    });
    const maturityScore = clamp(analyses.reduce((s, a) => s + a.score, 0) / analyses.length);
    return {
      analyses,
      kindsCovered: [...RESILIENCE_ANALYSIS_KINDS],
      maturityScore,
      narrative: `Resilience analysis maturity ${Math.round(maturityScore)} across ${analyses.length} kinds.`,
    };
  }
}
