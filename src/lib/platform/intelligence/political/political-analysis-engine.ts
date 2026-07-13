import type { PoliticalAnalysisEngineContract } from "@/lib/platform/intelligence/political/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/political/models";
import { POLITICAL_ANALYSIS_KINDS, type PoliticalAnalysisSuite } from "@/lib/platform/intelligence/political/types";

/** PolicyAnalysisEngine covers policy_analysis and related analysis kinds. */
export class PoliticalAnalysisEngine implements PoliticalAnalysisEngineContract {
  assess(input: Parameters<PoliticalAnalysisEngineContract["assess"]>[0]): PoliticalAnalysisSuite {
    const scoreFor = (kind: (typeof POLITICAL_ANALYSIS_KINDS)[number]) => {
      switch (kind) {
        case "trends": return clamp(70 - input.baseline.legislativePressure / 5);
        case "forecasts": return input.forecasts.maturityScore;
        case "scenario_planning": return input.baseline.scenarioMaturity;
        case "policy_analysis": return clamp((input.areas.government_policy.score + input.areas.legislative.score) / 2);
        case "legislative_tracking": return input.areas.legislative.score;
        case "regulatory_impact": return clamp(100 - input.baseline.regulatoryBurden);
        case "political_risk": return clamp(100 - input.baseline.geopoliticalRisk);
        case "government_funding": return input.baseline.fundingOpportunity;
        case "early_warning": return clamp(input.baseline.evidenceCoverage);
        case "compliance_pressure": return clamp(100 - input.baseline.compliancePressure);
        case "political_opportunity": return clamp((input.baseline.fundingOpportunity + input.baseline.politicalStability) / 2);
        case "strategic_timing": return clamp((input.baseline.scenarioMaturity + input.baseline.politicalStability) / 2);
      }
    };
    const analyses = POLITICAL_ANALYSIS_KINDS.map(kind => {
      const score = scoreFor(kind);
      return {
        id: input.createId("pol-analysis"),
        kind,
        title: `${kind.replaceAll("_", " ")} analysis`,
        score,
        status: score >= 75 ? "favorable" as const : score >= 60 ? "improving" as const : "at_risk" as const,
        lenses: buildLens({
          legislativeImpact: `${kind} score ${Math.round(score)}.`,
          regulatoryRisk: `Regulatory lens through ${kind.replaceAll("_", " ")}.`,
          governmentFundingOpportunity: `Funding posture responds to ${kind.replaceAll("_", " ")}.`,
          taxExposure: `Fiscal implications of ${kind.replaceAll("_", " ")}.`,
          politicalStability: `Stability tracked through ${kind.replaceAll("_", " ")}.`,
          tradeImpact: `Trade implications of ${kind.replaceAll("_", " ")}.`,
          compliancePressure: `Compliance pressure under ${kind.replaceAll("_", " ")}.`,
          strategicTiming: `Use ${kind.replaceAll("_", " ")} insight to time political response.`,
        }),
        narrative: `${kind} analysis score ${Math.round(score)}.`,
      };
    });
    return {
      analyses,
      kindsCovered: [...POLITICAL_ANALYSIS_KINDS],
      maturityScore: analyses.reduce((s, a) => s + a.score, 0) / analyses.length,
      narrative: `Political analysis covers ${POLITICAL_ANALYSIS_KINDS.length} decision lenses.`,
    };
  }
}

export { PoliticalAnalysisEngine as PolicyAnalysisEngine };
