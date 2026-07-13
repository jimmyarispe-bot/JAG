import type { SystemsAnalysisEngineContract } from "@/lib/platform/intelligence/systems/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/systems/models";
import { SYSTEMS_ANALYSIS_KINDS, type SystemsAnalysisSuite } from "@/lib/platform/intelligence/systems/types";

export class SystemsAnalysisEngine implements SystemsAnalysisEngineContract {
  assess(input: Parameters<SystemsAnalysisEngineContract["assess"]>[0]): SystemsAnalysisSuite {
    const scoreFor = (kind: (typeof SYSTEMS_ANALYSIS_KINDS)[number]) => {
      switch (kind) {
        case "trends": return clamp(70 - (100 - input.baseline.forecastMaturity) * .2);
        case "forecasts": return clamp(input.forecasts.maturityScore);
        case "scenario_planning": return clamp(input.baseline.scenarioMaturity);
        case "dependency_impact": return clamp(input.baseline.dependencyImpact);
        case "bottleneck_risk": return clamp(input.baseline.bottleneckRisk);
        case "feedback_stability": return clamp(input.baseline.feedbackStability);
        case "system_complexity": return clamp(input.baseline.systemComplexity);
        case "resource_flow": return clamp(input.baseline.resourceFlow);
        case "cascading_risk": return clamp(input.baseline.cascadingRisk);
        case "adaptability": return clamp(input.baseline.adaptability);
        case "leverage_points": return clamp(input.baseline.areaScores.leverage_point_identification);
        case "early_warning": return clamp(input.baseline.longTermSystemHealth);
        default: return 65;
      }
    };
    const analyses = SYSTEMS_ANALYSIS_KINDS.map((kind) => {
      const score = scoreFor(kind);
      return {
        id: input.createId("sys-analysis"),
        kind,
        title: `${kind.replaceAll("_", " ")} analysis`,
        score,
        status: score >= 75 ? "favorable" as const : score >= 60 ? "improving" as const : "at_risk" as const,
        lenses: buildLens({
          dependencyImpact: `Dependency impact through ${kind}.`,
          bottleneckRisk: `Bottleneck risk reading for ${kind}.`,
          feedbackStability: `Feedback stability for ${kind}.`,
          systemComplexity: `System complexity around ${kind}.`,
          resourceFlow: `Resource flow of ${kind}.`,
          cascadingRisk: `Cascading risk in ${kind}.`,
          adaptability: `Adaptability for ${kind}.`,
          longTermSystemHealth: `Long-term system health via ${kind}.`,
        }),
        narrative: `${kind} analysis scored ${Math.round(score)}.`,
      };
    });
    const maturityScore = clamp(analyses.reduce((s, a) => s + a.score, 0) / analyses.length);
    return {
      analyses,
      kindsCovered: [...SYSTEMS_ANALYSIS_KINDS],
      maturityScore,
      narrative: `Systems analysis maturity ${Math.round(maturityScore)} across ${analyses.length} kinds.`,
    };
  }
}
