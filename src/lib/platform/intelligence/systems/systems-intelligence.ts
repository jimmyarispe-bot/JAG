import { buildLens, clamp, priorityFromScore, statusFromScore } from "@/lib/platform/intelligence/systems/models";
import type {
  SystemsArea, SystemsAreaSuite, SystemsBaseline, SystemsDashboard,
  SystemsForecastSuite, SystemsHealthScore, SystemsOpportunityRecord,
  SystemsRecommendationRecord, SystemsRiskRecord, SystemsScenarioSuite,
  SystemsScore, SystemsAnalysisSuite,
} from "@/lib/platform/intelligence/systems/types";
import { SYSTEMS_AREAS } from "@/lib/platform/intelligence/systems/types";

export const score = (key: string, label: string, value: number): SystemsScore => {
  const v = clamp(value);
  return { key, label, value: v, status: statusFromScore(v), band: priorityFromScore(v), narrative: `${label} is ${statusFromScore(v)} at ${Math.round(v)}.` };
};

const lens = (area: string, value: number) => buildLens({
  dependencyImpact: `${area} dependency impact scored ${Math.round(value)}.`,
  bottleneckRisk: `Bottleneck risk linked to ${area}.`,
  feedbackStability: `Feedback stability around ${area}.`,
  systemComplexity: `System complexity relative to ${area} conditions.`,
  resourceFlow: `Resource flow reading for ${area}.`,
  cascadingRisk: `Cascading risk implications of ${area}.`,
  adaptability: `Adaptability pressure from ${area}.`,
  longTermSystemHealth: `Timing window for ${area}-linked systems action.`,
});

export class SystemsIntelligence {
  composeScores(input: {
    baseline: SystemsBaseline;
    areas: Record<SystemsArea, SystemsAreaSuite>;
    forecast: number;
    scenario: number;
    analysis: number;
    earlyWarning: number;
    dependency: number;
    feedbackLoop: number;
    constraint: number;
    bottleneck: number;
    networkDynamics: number;
  }) {
    const areaScores = Object.fromEntries(
      SYSTEMS_AREAS.map(a => [a, score(`systems_${a}`, `${a} Systems Score`, input.areas[a].score)])
    ) as Record<SystemsArea, SystemsScore>;
    const overall =
      SYSTEMS_AREAS.reduce((s, a) => s + areaScores[a].value, 0) / SYSTEMS_AREAS.length * .5 +
      input.baseline.dependencyImpact * .1 +
      input.baseline.bottleneckRisk * .1 +
      input.baseline.adaptability * .08 +
      input.forecast * .08 +
      input.scenario * .07 +
      input.earlyWarning * .04 +
      input.networkDynamics * .03;
    return {
      healthScore: score("systems_health", "Systems Health Score", overall),
      areaScores,
      forecastScore: score("systems_forecast", "Forecast Score", input.forecast),
      scenarioScore: score("systems_scenario", "Scenario Score", input.scenario),
      analysisScore: score("systems_analysis", "Analysis Score", input.analysis),
      earlyWarningScore: score("systems_early_warning", "Early Warning Score", input.earlyWarning),
      dependencyScore: score("systems_dependency", "Dependency Score", input.dependency),
      feedbackLoopScore: score("systems_feedback_loop", "Feedback Loop Score", input.feedbackLoop),
      bottleneckScore: score("systems_bottleneck", "Bottleneck Score", input.bottleneck),
      networkDynamicsScore: score("systems_network_dynamics", "Network Dynamics Score", input.networkDynamics),
      constraintScore: score("systems_constraint", "Constraint Score", input.constraint),
    };
  }
}

export class SystemsRecommendationComposer {
  constructor(private createId: (prefix: string) => string) {}
  compose(
    areas: Record<SystemsArea, SystemsAreaSuite>,
    analysis: SystemsAnalysisSuite,
    scenarios: SystemsScenarioSuite,
    now: Date,
  ): SystemsRecommendationRecord[] {
    return [...SYSTEMS_AREAS]
      .sort((a, b) => areas[a].score - areas[b].score)
      .slice(0, 6)
      .map((area, index) => ({
        id: this.createId("sys-rec"),
        title: `Address ${area.replaceAll("_", " ")} systems exposure`,
        priority: priorityFromScore(areas[area].score),
        evidenceRefs: analysis.analyses.slice(0, 2).map(a => a.id).concat(scenarios.scenarios.slice(0, 1).map(s => s.id)),
        confidenceScore: .68,
        owner: index ? "systems-owner" : "executive-team",
        dueDate: new Date(now.getTime() + (30 + index * 14) * 86400000).toISOString(),
        rationale: areas[area].narrative,
        action: `Run a systems response cycle for ${area.replaceAll("_", " ")}.`,
        lenses: lens(area, areas[area].score),
        narrative: `Prioritize ${area} systems response.`,
      }));
  }
}

export function composeRisksOpportunities(
  areas: Record<SystemsArea, SystemsAreaSuite>,
  createId: (prefix: string) => string,
): { risks: SystemsRiskRecord[]; opportunities: SystemsOpportunityRecord[] } {
  const ordered = [...SYSTEMS_AREAS].sort((a, b) => areas[a].score - areas[b].score);
  return {
    risks: ordered.slice(0, 5).map(a => ({
      id: createId("sys-risk"),
      title: `${a.replaceAll("_", " ")} systems pressure`,
      area: a,
      severity: priorityFromScore(areas[a].score),
      score: 100 - areas[a].score,
      mitigation: `Strengthen monitoring and systems playbooks for ${a.replaceAll("_", " ")}.`,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
    opportunities: ordered.slice(-5).reverse().map(a => ({
      id: createId("sys-opp"),
      title: `Capture ${a.replaceAll("_", " ")} systems advantage`,
      area: a,
      priority: priorityFromScore(100 - areas[a].score),
      score: areas[a].score,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
  };
}

export function composeHealth(
  scores: ReturnType<SystemsIntelligence["composeScores"]>,
  baseline: SystemsBaseline,
  forecasts: SystemsForecastSuite,
): SystemsHealthScore {
  const areaScores = Object.fromEntries(SYSTEMS_AREAS.map(a => [a, scores.areaScores[a].value])) as Record<SystemsArea, number>;
  return {
    overallScore: scores.healthScore.value,
    status: scores.healthScore.status,
    outlook: forecasts.outlook,
    areaScores,
    dependencyScore: scores.dependencyScore.value,
    bottleneckScore: scores.bottleneckScore.value,
    adaptiveScore: scores.areaScores.adaptive_capacity.value,
    complexityScore: scores.areaScores.organizational_complexity.value,
    forecastScore: scores.forecastScore.value,
    scenarioScore: scores.scenarioScore.value,
    lenses: lens("organization", scores.healthScore.value),
    narrative: scores.healthScore.narrative,
  };
}

export function composeDashboard(
  now: Date,
  health: SystemsHealthScore,
  baseline: SystemsBaseline,
  risks: SystemsRiskRecord[],
  opportunities: SystemsOpportunityRecord[],
): SystemsDashboard {
  return {
    generatedAt: now.toISOString(),
    headline: `Executive Systems Overview: health ${Math.round(health.overallScore)}  -  ${health.status} (${health.outlook})`,
    overall: health.overallScore,
    areaScores: health.areaScores,
    outlook: health.outlook,
    dependencyImpact: baseline.dependencyImpact,
    bottleneckRisk: baseline.bottleneckRisk,
    adaptability: baseline.adaptability,
    topRisks: risks.map(r => r.title),
    topOpportunities: opportunities.map(o => o.title),
    narrative: health.narrative,
  };
}

export function composeSystemsHealth(
  scores: ReturnType<SystemsIntelligence["composeScores"]>,
  baseline: SystemsBaseline,
  forecasts: SystemsForecastSuite,
) {
  return composeHealth(scores, baseline, forecasts);
}

export const systemsLens = lens;
