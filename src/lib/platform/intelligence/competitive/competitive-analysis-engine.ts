import type { CompetitiveAnalysisEngineContract } from "@/lib/platform/intelligence/competitive/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/competitive/models";
import { COMPETITIVE_ANALYSIS_KINDS, type CompetitiveAnalysisSuite } from "@/lib/platform/intelligence/competitive/types";

export class CompetitiveAnalysisEngine implements CompetitiveAnalysisEngineContract {
  assess(input: Parameters<CompetitiveAnalysisEngineContract["assess"]>[0]): CompetitiveAnalysisSuite {
    const scoreFor = (kind: (typeof COMPETITIVE_ANALYSIS_KINDS)[number]) => {
      switch (kind) {
        case "trends": return clamp(70 - input.baseline.competitivePressure / 5);
        case "forecasts": return input.forecasts.maturityScore;
        case "scenario_planning": return input.baseline.scenarioMaturity;
        case "threat_mapping": return clamp(100 - input.baseline.threatLevel);
        case "differentiation": return input.baseline.differentiationStrength;
        case "win_loss": return clamp((input.baseline.marketSharePosition + input.areas.enrollment_admissions_dynamics.score) / 2);
        case "battlecards": return clamp((input.baseline.differentiationStrength + input.baseline.brandStrength) / 2);
        case "signal_monitoring": return clamp(input.baseline.evidenceCoverage);
        case "response_playbooks": return clamp((input.baseline.scenarioMaturity + input.baseline.differentiationStrength) / 2);
        case "moat_analysis": return clamp((input.baseline.differentiationStrength + input.baseline.brandStrength + input.baseline.marketSharePosition) / 3);
        case "market_share": return input.baseline.marketSharePosition;
        case "competitive_risk": return clamp(100 - (input.baseline.competitivePressure + input.baseline.threatLevel) / 2);
        case "competitive_opportunity": return clamp((input.baseline.differentiationStrength + input.baseline.opportunityIndex) / 2);
      }
    };
    const analyses = COMPETITIVE_ANALYSIS_KINDS.map(kind => {
      const score = scoreFor(kind);
      return {
        id: input.createId("cmp-analysis"),
        kind,
        title: `${kind.replaceAll("_", " ")} analysis`,
        score,
        status: score >= 75 ? "favorable" as const : score >= 60 ? "improving" as const : "at_risk" as const,
        lenses: buildLens({
          competitiveThreatExists: `${kind} score ${Math.round(score)}.`,
          evidenceSupports: `${input.forecasts.narrative} ${input.scenarios.narrative}`,
          competitorsInvolved: `Peers and substitutes in ${kind.replaceAll("_", " ")} lens.`,
          ourDifferentiation: `Differentiation tracked through ${kind.replaceAll("_", " ")}.`,
          enrollmentOrRevenueImpact: `Enrollment posture responds to ${kind.replaceAll("_", " ")}.`,
          responseOptions: `Use ${kind.replaceAll("_", " ")} insight to reallocate competitive focus.`,
          organizationalCapabilitiesRequired: `Strategy, marketing, admissions, and academic capabilities.`,
          signalsToMonitor: input.scenarios.primaryScenario,
        }),
        narrative: `${kind} analysis score ${Math.round(score)}.`,
      };
    });
    return {
      analyses,
      kindsCovered: [...COMPETITIVE_ANALYSIS_KINDS],
      maturityScore: analyses.reduce((s, a) => s + a.score, 0) / analyses.length,
      narrative: `Competitive analysis covers ${COMPETITIVE_ANALYSIS_KINDS.length} decision lenses.`,
    };
  }
}
