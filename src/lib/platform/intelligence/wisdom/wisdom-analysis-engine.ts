import type { WisdomAnalysisEngineContract } from "@/lib/platform/intelligence/wisdom/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/wisdom/models";
import { WISDOM_ANALYSIS_KINDS, type WisdomAnalysisSuite } from "@/lib/platform/intelligence/wisdom/types";

/** Primary analysis engine. */
export class WisdomAnalysisEngine implements WisdomAnalysisEngineContract {
  assess(input: Parameters<WisdomAnalysisEngineContract["assess"]>[0]): WisdomAnalysisSuite {
    const scoreFor = (kind: (typeof WISDOM_ANALYSIS_KINDS)[number]) => {
      switch (kind) {
        case "trends": return clamp(70 - (100 - input.baseline.forecastMaturity) * .2);
        case "forecasts": return clamp(input.forecasts.maturityScore);
        case "scenario_planning": return clamp(input.baseline.scenarioMaturity);
        case "strategic_value": return clamp(input.baseline.strategicValue);
        case "long_term_impact": return clamp(input.baseline.longTermImpact);
        case "confidence_level": return clamp(input.baseline.confidenceLevel);
        case "evidence_quality": return clamp(input.baseline.evidenceQuality);
        case "trade_off_balance": return clamp(input.baseline.tradeOffBalance);
        case "organizational_alignment": return clamp(input.baseline.organizationalAlignment);
        case "ethical_integrity": return clamp(input.baseline.ethicalIntegrity);
        case "wisdom_score": return clamp(input.baseline.wisdomScore);
        case "early_warning": return clamp(input.baseline.wisdomScore);
        default: return 65;
      }
    };
    const analyses = WISDOM_ANALYSIS_KINDS.map((kind) => {
      const score = scoreFor(kind);
      return {
        id: input.createId("wis-analysis"),
        kind,
        title: `${kind.replaceAll("_", " ")} analysis`,
        score,
        status: score >= 75 ? "favorable" as const : score >= 60 ? "improving" as const : "at_risk" as const,
        lenses: buildLens({
          strategicValue: `Strategic value through ${kind}.`,
          longTermImpact: `Long-term impact reading for ${kind}.`,
          confidenceLevel: `Confidence level in ${kind}.`,
          evidenceQuality: `Evidence quality for ${kind}.`,
          tradeOffBalance: `Trade-off balance of ${kind}.`,
          organizationalAlignment: `Organizational alignment for ${kind}.`,
          ethicalIntegrity: `Ethical integrity via ${kind}.`,
          wisdomScore: `Wisdom score via ${kind}.`,
        }),
        narrative: `${kind} analysis scored ${Math.round(score)}.`,
      };
    });
    const maturityScore = clamp(analyses.reduce((s, a) => s + a.score, 0) / analyses.length);
    return {
      analyses,
      kindsCovered: [...WISDOM_ANALYSIS_KINDS],
      maturityScore,
      narrative: `Wisdom analysis maturity ${Math.round(maturityScore)} across ${analyses.length} kinds.`,
    };
  }
}
