import { buildLens, clamp, priorityFromScore, statusFromScore } from "@/lib/platform/intelligence/resilience/models";
import type {
  ResilienceArea, ResilienceAreaSuite, ResilienceBaseline, ResilienceDashboard,
  ResilienceForecastSuite, ResilienceHealthScore, ResilienceOpportunityRecord,
  ResilienceRecommendationRecord, ResilienceRiskRecord, ResilienceScenarioSuite,
  ResilienceScore, ResilienceAnalysisSuite,
} from "@/lib/platform/intelligence/resilience/types";
import { RESILIENCE_AREAS } from "@/lib/platform/intelligence/resilience/types";

export const score = (key: string, label: string, value: number): ResilienceScore => {
  const v = clamp(value);
  return { key, label, value: v, status: statusFromScore(v), band: priorityFromScore(v), narrative: `${label} is ${statusFromScore(v)} at ${Math.round(v)}.` };
};

const lens = (area: string, value: number) => buildLens({
  organizationalReadiness: `${area} organizational readiness scored ${Math.round(value)}.`,
  recoveryCapability: `Recovery capability linked to ${area}.`,
  operationalStability: `Operational stability around ${area}.`,
  financialStability: `Financial stability relative to ${area} conditions.`,
  workforceStability: `Workforce stability reading for ${area}.`,
  infrastructureReadiness: `Infrastructure readiness implications of ${area}.`,
  adaptiveCapacity: `Adaptive capacity pressure from ${area}.`,
  longTermResilienceOutlook: `Timing window for ${area}-linked resilience action.`,
});

export class ResilienceIntelligence {
  composeScores(input: {
    baseline: ResilienceBaseline;
    areas: Record<ResilienceArea, ResilienceAreaSuite>;
    forecast: number;
    scenario: number;
    analysis: number;
    earlyWarning: number;
    stressTest: number;
    recovery: number;
    continuity: number;
    adaptiveCapacity: number;
  }) {
    const areaScores = Object.fromEntries(
      RESILIENCE_AREAS.map(a => [a, score(`resilience_${a}`, `${a} Resilience Score`, input.areas[a].score)])
    ) as Record<ResilienceArea, ResilienceScore>;
    const overall =
      RESILIENCE_AREAS.reduce((s, a) => s + areaScores[a].value, 0) / RESILIENCE_AREAS.length * .5 +
      input.baseline.organizationalReadiness * .1 +
      input.baseline.recoveryCapability * .1 +
      input.baseline.adaptiveCapacity * .08 +
      input.forecast * .08 +
      input.scenario * .07 +
      input.earlyWarning * .04 +
      input.stressTest * .03;
    return {
      healthScore: score("resilience_health", "Resilience Health Score", overall),
      areaScores,
      forecastScore: score("resilience_forecast", "Forecast Score", input.forecast),
      scenarioScore: score("resilience_scenario", "Scenario Score", input.scenario),
      analysisScore: score("resilience_analysis", "Analysis Score", input.analysis),
      earlyWarningScore: score("resilience_early_warning", "Early Warning Score", input.earlyWarning),
      stressTestScore: score("resilience_stress_test", "Stress Test Score", input.stressTest),
      recoveryScore: score("resilience_recovery", "Recovery Score", input.recovery),
      continuityScore: score("resilience_continuity", "Continuity Score", input.continuity),
      adaptiveCapacityScore: score("resilience_adaptive_capacity", "Adaptive Capacity Score", input.adaptiveCapacity),
    };
  }
}

export class ResilienceRecommendationComposer {
  constructor(private createId: (prefix: string) => string) {}
  compose(
    areas: Record<ResilienceArea, ResilienceAreaSuite>,
    analysis: ResilienceAnalysisSuite,
    scenarios: ResilienceScenarioSuite,
    now: Date,
  ): ResilienceRecommendationRecord[] {
    return [...RESILIENCE_AREAS]
      .sort((a, b) => areas[a].score - areas[b].score)
      .slice(0, 6)
      .map((area, index) => ({
        id: this.createId("rsl-rec"),
        title: `Address ${area.replaceAll("_", " ")} resilience exposure`,
        priority: priorityFromScore(areas[area].score),
        evidenceRefs: analysis.analyses.slice(0, 2).map(a => a.id).concat(scenarios.scenarios.slice(0, 1).map(s => s.id)),
        confidenceScore: .68,
        owner: index ? "resilience-owner" : "executive-team",
        dueDate: new Date(now.getTime() + (30 + index * 14) * 86400000).toISOString(),
        rationale: areas[area].narrative,
        action: `Run a resilience response cycle for ${area.replaceAll("_", " ")}.`,
        lenses: lens(area, areas[area].score),
        narrative: `Prioritize ${area} resilience response.`,
      }));
  }
}

export function composeRisksOpportunities(
  areas: Record<ResilienceArea, ResilienceAreaSuite>,
  createId: (prefix: string) => string,
): { risks: ResilienceRiskRecord[]; opportunities: ResilienceOpportunityRecord[] } {
  const ordered = [...RESILIENCE_AREAS].sort((a, b) => areas[a].score - areas[b].score);
  return {
    risks: ordered.slice(0, 5).map(a => ({
      id: createId("rsl-risk"),
      title: `${a.replaceAll("_", " ")} resilience pressure`,
      area: a,
      severity: priorityFromScore(areas[a].score),
      score: 100 - areas[a].score,
      mitigation: `Strengthen monitoring and resilience playbooks for ${a.replaceAll("_", " ")}.`,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
    opportunities: ordered.slice(-5).reverse().map(a => ({
      id: createId("rsl-opp"),
      title: `Capture ${a.replaceAll("_", " ")} resilience advantage`,
      area: a,
      priority: priorityFromScore(100 - areas[a].score),
      score: areas[a].score,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
  };
}

export function composeHealth(
  scores: ReturnType<ResilienceIntelligence["composeScores"]>,
  baseline: ResilienceBaseline,
  forecasts: ResilienceForecastSuite,
): ResilienceHealthScore {
  const areaScores = Object.fromEntries(RESILIENCE_AREAS.map(a => [a, scores.areaScores[a].value])) as Record<ResilienceArea, number>;
  return {
    overallScore: scores.healthScore.value,
    status: scores.healthScore.status,
    outlook: forecasts.outlook,
    areaScores,
    continuityScore: scores.continuityScore.value,
    recoveryScore: scores.recoveryScore.value,
    adaptiveScore: scores.adaptiveCapacityScore.value,
    stressTestScore: scores.stressTestScore.value,
    forecastScore: scores.forecastScore.value,
    scenarioScore: scores.scenarioScore.value,
    lenses: lens("organization", scores.healthScore.value),
    narrative: scores.healthScore.narrative,
  };
}

export function composeDashboard(
  now: Date,
  health: ResilienceHealthScore,
  baseline: ResilienceBaseline,
  risks: ResilienceRiskRecord[],
  opportunities: ResilienceOpportunityRecord[],
): ResilienceDashboard {
  return {
    generatedAt: now.toISOString(),
    headline: `Executive Resilience Overview: health ${Math.round(health.overallScore)}  -  ${health.status} (${health.outlook})`,
    overall: health.overallScore,
    areaScores: health.areaScores,
    outlook: health.outlook,
    organizationalReadiness: baseline.organizationalReadiness,
    recoveryCapability: baseline.recoveryCapability,
    adaptiveCapacity: baseline.adaptiveCapacity,
    topRisks: risks.map(r => r.title),
    topOpportunities: opportunities.map(o => o.title),
    narrative: health.narrative,
  };
}

export function composeResilienceHealth(
  scores: ReturnType<ResilienceIntelligence["composeScores"]>,
  baseline: ResilienceBaseline,
  forecasts: ResilienceForecastSuite,
) {
  return composeHealth(scores, baseline, forecasts);
}

export const resilienceLens = lens;
