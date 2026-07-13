import { buildLens, clamp, outlookFromScore, priorityFromScore, statusFromScore } from "@/lib/platform/intelligence/competitive/models";
import type {
  CompetitiveArea, CompetitiveAreaSuite, CompetitiveBaseline, CompetitiveDashboard,
  CompetitiveForecastSuite, CompetitiveHealthScore, CompetitiveOpportunityRecord,
  CompetitiveRecommendationRecord, CompetitiveRiskRecord, CompetitiveScenarioSuite,
  CompetitiveScore, CompetitiveAnalysisSuite,
} from "@/lib/platform/intelligence/competitive/types";
import { COMPETITIVE_AREAS } from "@/lib/platform/intelligence/competitive/types";

export const score = (key: string, label: string, value: number): CompetitiveScore => {
  const v = clamp(value);
  return { key, label, value: v, status: statusFromScore(v), band: priorityFromScore(v), narrative: `${label} is ${statusFromScore(v)} at ${Math.round(v)}.` };
};

const lens = (area: string, value: number) => buildLens({
  competitiveThreatExists: `${area} competitive force scored ${Math.round(value)}.`,
  evidenceSupports: "Area indicators, forecasts, scenarios, and upstream soft signals.",
  competitorsInvolved: `Peer institutions and substitutes active in ${area}.`,
  ourDifferentiation: `Our differentiation advantage relative to ${area} conditions.`,
  enrollmentOrRevenueImpact: `Enrollment and revenue exposure linked to ${area} movement.`,
  responseOptions: `Monitor, differentiate, reposition, or partner based on ${area}.`,
  organizationalCapabilitiesRequired: `Strategy, marketing, admissions, and academic capabilities.`,
  signalsToMonitor: `${area}-linked competitive scenarios.`,
});

export class CompetitiveIntelligence {
  composeScores(input: {
    baseline: CompetitiveBaseline;
    areas: Record<CompetitiveArea, CompetitiveAreaSuite>;
    forecast: number;
    scenario: number;
    analysis: number;
  }) {
    const areaScores = Object.fromEntries(
      COMPETITIVE_AREAS.map(a => [a, score(`competitive_${a}`, `${a} Competitive Score`, input.areas[a].score)])
    ) as Record<CompetitiveArea, CompetitiveScore>;
    const overall =
      COMPETITIVE_AREAS.reduce((s, a) => s + areaScores[a].value, 0) / COMPETITIVE_AREAS.length * .55 +
      input.baseline.differentiationStrength * .1 +
      input.baseline.marketSharePosition * .1 +
      input.baseline.brandStrength * .1 +
      input.forecast * .08 +
      input.scenario * .07;
    return {
      healthScore: score("competitive_health", "Competitive Health Score", overall),
      areaScores,
      forecastScore: score("competitive_forecast", "Forecast Score", input.forecast),
      scenarioScore: score("competitive_scenario", "Scenario Score", input.scenario),
      analysisScore: score("competitive_analysis", "Analysis Score", input.analysis),
    };
  }
}

export class CompetitiveRecommendationComposer {
  constructor(private createId: (prefix: string) => string) {}
  compose(
    areas: Record<CompetitiveArea, CompetitiveAreaSuite>,
    analysis: CompetitiveAnalysisSuite,
    scenarios: CompetitiveScenarioSuite,
    now: Date,
  ): CompetitiveRecommendationRecord[] {
    return [...COMPETITIVE_AREAS]
      .sort((a, b) => areas[a].score - areas[b].score)
      .slice(0, 6)
      .map((area, index) => ({
        id: this.createId("cmp-rec"),
        title: `Address ${area.replaceAll("_", " ")} competitive exposure`,
        priority: priorityFromScore(areas[area].score),
        evidenceRefs: analysis.analyses.slice(0, 2).map(a => a.id).concat(scenarios.scenarios.slice(0, 1).map(s => s.id)),
        confidenceScore: .68,
        owner: index ? "competitive-owner" : "executive-team",
        dueDate: new Date(now.getTime() + (30 + index * 14) * 86400000).toISOString(),
        rationale: areas[area].narrative,
        action: `Run a strategic response cycle for ${area.replaceAll("_", " ")}.`,
        lenses: lens(area, areas[area].score),
        narrative: `Prioritize ${area} competitive response.`,
      }));
  }
}

export function composeRisksOpportunities(
  areas: Record<CompetitiveArea, CompetitiveAreaSuite>,
  createId: (prefix: string) => string,
): { risks: CompetitiveRiskRecord[]; opportunities: CompetitiveOpportunityRecord[] } {
  const ordered = [...COMPETITIVE_AREAS].sort((a, b) => areas[a].score - areas[b].score);
  return {
    risks: ordered.slice(0, 5).map(a => ({
      id: createId("cmp-risk"),
      title: `${a.replaceAll("_", " ")} competitive pressure`,
      area: a,
      severity: priorityFromScore(areas[a].score),
      score: 100 - areas[a].score,
      mitigation: `Strengthen monitoring and response playbooks for ${a.replaceAll("_", " ")}.`,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
    opportunities: ordered.slice(-5).reverse().map(a => ({
      id: createId("cmp-opp"),
      title: `Capture ${a.replaceAll("_", " ")} competitive advantage`,
      area: a,
      priority: priorityFromScore(100 - areas[a].score),
      score: areas[a].score,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
  };
}

export function composeHealth(
  scores: ReturnType<CompetitiveIntelligence["composeScores"]>,
  baseline: CompetitiveBaseline,
  forecasts: CompetitiveForecastSuite,
): CompetitiveHealthScore {
  const areaScores = Object.fromEntries(COMPETITIVE_AREAS.map(a => [a, scores.areaScores[a].value])) as Record<CompetitiveArea, number>;
  return {
    overallScore: scores.healthScore.value,
    status: scores.healthScore.status,
    outlook: forecasts.outlook,
    areaScores,
    threatScore: clamp(100 - baseline.threatLevel),
    differentiationScore: baseline.differentiationStrength,
    marketShareScore: baseline.marketSharePosition,
    brandScore: baseline.brandStrength,
    forecastScore: scores.forecastScore.value,
    scenarioScore: scores.scenarioScore.value,
    lenses: lens("organization", scores.healthScore.value),
    narrative: scores.healthScore.narrative,
  };
}

export function composeDashboard(
  now: Date,
  health: CompetitiveHealthScore,
  baseline: CompetitiveBaseline,
  risks: CompetitiveRiskRecord[],
  opportunities: CompetitiveOpportunityRecord[],
): CompetitiveDashboard {
  return {
    generatedAt: now.toISOString(),
    headline: `Competitive health ${Math.round(health.overallScore)} — ${health.status} (${health.outlook})`,
    overall: health.overallScore,
    areaScores: health.areaScores,
    outlook: health.outlook,
    competitivePressure: baseline.competitivePressure,
    differentiationStrength: baseline.differentiationStrength,
    marketSharePosition: baseline.marketSharePosition,
    topRisks: risks.map(r => r.title),
    topOpportunities: opportunities.map(o => o.title),
    narrative: health.narrative,
  };
}

export function composeCompetitiveHealth(
  scores: ReturnType<CompetitiveIntelligence["composeScores"]>,
  baseline: CompetitiveBaseline,
  forecasts: CompetitiveForecastSuite,
) {
  return composeHealth(scores, baseline, forecasts);
}

export const competitiveLens = lens;
export { outlookFromScore };
