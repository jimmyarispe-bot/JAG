import type { EthicalAnalysisEngineContract } from "@/lib/platform/intelligence/ethical/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/ethical/models";
import { ETHICAL_ANALYSIS_KINDS, type EthicalAnalysisSuite } from "@/lib/platform/intelligence/ethical/types";

export class EthicalAnalysisEngine implements EthicalAnalysisEngineContract {
  assess(input: Parameters<EthicalAnalysisEngineContract["assess"]>[0]): EthicalAnalysisSuite {
    const scoreFor = (kind: (typeof ETHICAL_ANALYSIS_KINDS)[number]) => {
      switch (kind) {
        case "trends": return clamp(70 - (100 - input.baseline.forecastMaturity) * .2);
        case "forecasts": return clamp(input.forecasts.maturityScore);
        case "scenario_planning": return clamp(input.baseline.scenarioMaturity);
        case "values_alignment": return clamp(input.baseline.valuesAlignment);
        case "fairness": return clamp(input.baseline.fairness);
        case "transparency": return clamp(input.baseline.transparency);
        case "accountability": return clamp(input.baseline.accountability);
        case "human_impact": return clamp(input.baseline.humanImpact);
        case "bias_risk": return clamp(input.baseline.biasRisk);
        case "governance_integrity": return clamp(input.baseline.governanceIntegrity);
        case "ethical_risk": return clamp(input.baseline.areaScores.ethical_risk);
        case "early_warning": return clamp(input.baseline.longTermEthicalOutlook);
        default: return 65;
      }
    };
    const analyses = ETHICAL_ANALYSIS_KINDS.map((kind) => {
      const score = scoreFor(kind);
      return {
        id: input.createId("eth-analysis"),
        kind,
        title: `${kind.replaceAll("_", " ")} analysis`,
        score,
        status: score >= 75 ? "favorable" as const : score >= 60 ? "improving" as const : "at_risk" as const,
        lenses: buildLens({
          valuesAlignment: `Values alignment through ${kind}.`,
          fairness: `Fairness reading for ${kind}.`,
          transparency: `Transparency for ${kind}.`,
          accountability: `Accountability around ${kind}.`,
          humanImpact: `Human impact of ${kind}.`,
          biasRisk: `Bias risk in ${kind}.`,
          governanceIntegrity: `Governance integrity for ${kind}.`,
          longTermEthicalOutlook: `Long-term ethical outlook via ${kind}.`,
        }),
        narrative: `${kind} analysis scored ${Math.round(score)}.`,
      };
    });
    const maturityScore = clamp(analyses.reduce((s, a) => s + a.score, 0) / analyses.length);
    return {
      analyses,
      kindsCovered: [...ETHICAL_ANALYSIS_KINDS],
      maturityScore,
      narrative: `Ethical analysis maturity ${Math.round(maturityScore)} across ${analyses.length} kinds.`,
    };
  }
}
