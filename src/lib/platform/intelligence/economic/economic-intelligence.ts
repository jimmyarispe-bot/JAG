import { buildLens, clamp, outlookFromScore, priorityFromScore, statusFromScore } from "@/lib/platform/intelligence/economic/models";
import type {
  EconomicArea, EconomicAreaSuite, EconomicBaseline, EconomicDashboard, EconomicForecastSuite,
  EconomicHealthScore, EconomicOpportunityRecord, EconomicRecommendationRecord, EconomicRiskRecord,
  EconomicScenarioSuite, EconomicScore, EconomicAnalysisSuite,
} from "@/lib/platform/intelligence/economic/types";
import { ECONOMIC_AREAS } from "@/lib/platform/intelligence/economic/types";

export const score = (key: string, label: string, value: number): EconomicScore => {
  const v = clamp(value);
  return { key, label, value: v, status: statusFromScore(v), band: priorityFromScore(v), narrative: `${label} is ${statusFromScore(v)} at ${Math.round(v)}.` };
};

const lens = (area: string, value: number) => buildLens({
  economicForces: `${area} economic force scored ${Math.round(value)}.`,
  evidenceSupports: "Area indicators, forecasts, scenarios, and upstream soft signals.",
  confidenceLevel: "medium",
  organizationalAreas: "Strategy, pricing, staffing, funding, and operations.",
  financialImplications: `Financial exposure linked to ${area} movement.`,
  operationalImplications: `Operating posture adjusts to ${area} conditions.`,
  strategicOptions: `Hedge, reprice, staff, fund, or monitor based on ${area}.`,
  scenariosToMonitor: `${area}-linked macroeconomic scenarios.`,
});

export class EconomicIntelligence {
  composeScores(input: {
    baseline: EconomicBaseline;
    areas: Record<EconomicArea, EconomicAreaSuite>;
    forecast: number;
    scenario: number;
    analysis: number;
  }) {
    const areaScores = Object.fromEntries(
      ECONOMIC_AREAS.map(a => [a, score(`economic_${a}`, `${a} Economic Score`, input.areas[a].score)])
    ) as Record<EconomicArea, EconomicScore>;
    const overall =
      ECONOMIC_AREAS.reduce((s, a) => s + areaScores[a].value, 0) / ECONOMIC_AREAS.length * .55 +
      (100 - input.baseline.costPressure) * .1 +
      input.baseline.laborAvailability * .1 +
      input.baseline.fundingEnvironment * .1 +
      input.forecast * .08 +
      input.scenario * .07;
    return {
      healthScore: score("economic_health", "Economic Health Score", overall),
      areaScores,
      forecastScore: score("economic_forecast", "Forecast Score", input.forecast),
      scenarioScore: score("economic_scenario", "Scenario Score", input.scenario),
      analysisScore: score("economic_analysis", "Analysis Score", input.analysis),
    };
  }
}

export class EconomicRecommendationComposer {
  constructor(private createId: (prefix: string) => string) {}
  compose(
    areas: Record<EconomicArea, EconomicAreaSuite>,
    analysis: EconomicAnalysisSuite,
    scenarios: EconomicScenarioSuite,
    now: Date,
  ): EconomicRecommendationRecord[] {
    return [...ECONOMIC_AREAS]
      .sort((a, b) => areas[a].score - areas[b].score)
      .slice(0, 6)
      .map((area, index) => ({
        id: this.createId("eco-rec"),
        title: `Address ${area.replaceAll("_", " ")} economic exposure`,
        priority: priorityFromScore(areas[area].score),
        evidenceRefs: analysis.analyses.slice(0, 2).map(a => a.id).concat(scenarios.scenarios.slice(0, 1).map(s => s.id)),
        confidenceScore: .68,
        owner: index ? "economic-owner" : "executive-team",
        dueDate: new Date(now.getTime() + (30 + index * 14) * 86400000).toISOString(),
        rationale: areas[area].narrative,
        action: `Run a strategic response cycle for ${area.replaceAll("_", " ")}.`,
        lenses: lens(area, areas[area].score),
        narrative: `Prioritize ${area} macroeconomic response.`,
      }));
  }
}

export function composeRisksOpportunities(
  areas: Record<EconomicArea, EconomicAreaSuite>,
  createId: (prefix: string) => string,
): { risks: EconomicRiskRecord[]; opportunities: EconomicOpportunityRecord[] } {
  const ordered = [...ECONOMIC_AREAS].sort((a, b) => areas[a].score - areas[b].score);
  return {
    risks: ordered.slice(0, 5).map(a => ({
      id: createId("eco-risk"),
      title: `${a.replaceAll("_", " ")} economic pressure`,
      area: a,
      severity: priorityFromScore(areas[a].score),
      score: 100 - areas[a].score,
      mitigation: `Strengthen monitoring and contingency plans for ${a.replaceAll("_", " ")}.`,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
    opportunities: ordered.slice(-5).reverse().map(a => ({
      id: createId("eco-opp"),
      title: `Capture ${a.replaceAll("_", " ")} economic advantage`,
      area: a,
      priority: priorityFromScore(100 - areas[a].score),
      score: areas[a].score,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
  };
}

export function composeHealth(
  scores: ReturnType<EconomicIntelligence["composeScores"]>,
  baseline: EconomicBaseline,
  forecasts: EconomicForecastSuite,
): EconomicHealthScore {
  const areaScores = Object.fromEntries(ECONOMIC_AREAS.map(a => [a, scores.areaScores[a].value])) as Record<EconomicArea, number>;
  return {
    overallScore: scores.healthScore.value,
    status: scores.healthScore.status,
    outlook: forecasts.outlook,
    areaScores,
    inflationScore: areaScores.inflation,
    laborScore: (areaScores.labor_market + areaScores.employment + areaScores.wage_trends) / 3,
    costPressureScore: clamp(100 - baseline.costPressure),
    fundingScore: baseline.fundingEnvironment,
    forecastScore: scores.forecastScore.value,
    scenarioScore: scores.scenarioScore.value,
    lenses: lens("organization", scores.healthScore.value),
    narrative: scores.healthScore.narrative,
  };
}

export function composeDashboard(
  now: Date,
  health: EconomicHealthScore,
  baseline: EconomicBaseline,
  risks: EconomicRiskRecord[],
  opportunities: EconomicOpportunityRecord[],
): EconomicDashboard {
  return {
    generatedAt: now.toISOString(),
    headline: `Economic health ${Math.round(health.overallScore)} — ${health.status} (${health.outlook})`,
    overall: health.overallScore,
    areaScores: health.areaScores,
    outlook: health.outlook,
    costPressure: baseline.costPressure,
    laborAvailability: baseline.laborAvailability,
    fundingEnvironment: baseline.fundingEnvironment,
    topRisks: risks.map(r => r.title),
    topOpportunities: opportunities.map(o => o.title),
    narrative: health.narrative,
  };
}

export function composeEconomicHealth(
  scores: ReturnType<EconomicIntelligence["composeScores"]>,
  baseline: EconomicBaseline,
  forecasts: EconomicForecastSuite,
) {
  return composeHealth(scores, baseline, forecasts);
}

export const economicLens = lens;
export { outlookFromScore };
