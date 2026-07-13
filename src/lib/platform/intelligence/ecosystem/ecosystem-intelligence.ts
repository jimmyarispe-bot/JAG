import { buildLens, clamp, priorityFromScore, statusFromScore } from "@/lib/platform/intelligence/ecosystem/models";
import type {
  EcosystemArea, EcosystemAreaSuite, EcosystemBaseline, EcosystemDashboard,
  EcosystemForecastSuite, EcosystemHealthScore, EcosystemOpportunityRecord,
  EcosystemRecommendationRecord, EcosystemRiskRecord, EcosystemScenarioSuite,
  EcosystemScore, EcosystemAnalysisSuite,
} from "@/lib/platform/intelligence/ecosystem/types";
import { ECOSYSTEM_AREAS } from "@/lib/platform/intelligence/ecosystem/types";

export const score = (key: string, label: string, value: number): EcosystemScore => {
  const v = clamp(value);
  return { key, label, value: v, status: statusFromScore(v), band: priorityFromScore(v), narrative: `${label} is ${statusFromScore(v)} at ${Math.round(v)}.` };
};

const lens = (area: string, value: number) => buildLens({
  networkStrength: `${area} network strength scored ${Math.round(value)}.`,
  strategicPartnerships: `Strategic partnerships linked to ${area}.`,
  ecosystemHealth: `Ecosystem health around ${area}.`,
  collaborationPotential: `Collaboration potential relative to ${area} conditions.`,
  dependencyRisk: `Dependency risk reading for ${area}.`,
  networkEffects: `Network effects implications of ${area}.`,
  strategicPosition: `Strategic position pressure from ${area}.`,
  longTermEcosystemOutlook: `Timing window for ${area}-linked ecosystem action.`,
});

export class EcosystemIntelligence {
  composeScores(input: {
    baseline: EcosystemBaseline;
    areas: Record<EcosystemArea, EcosystemAreaSuite>;
    forecast: number;
    scenario: number;
    analysis: number;
    earlyWarning: number;
    networkMapping: number;
    partnership: number;
    dependency: number;
    collaboration: number;
    networkEffect: number;
  }) {
    const areaScores = Object.fromEntries(
      ECOSYSTEM_AREAS.map(a => [a, score(`ecosystem_${a}`, `${a} Ecosystem Score`, input.areas[a].score)])
    ) as Record<EcosystemArea, EcosystemScore>;
    const overall =
      ECOSYSTEM_AREAS.reduce((s, a) => s + areaScores[a].value, 0) / ECOSYSTEM_AREAS.length * .5 +
      input.baseline.networkStrength * .1 +
      input.baseline.strategicPartnerships * .1 +
      input.baseline.ecosystemHealth * .08 +
      input.forecast * .08 +
      input.scenario * .07 +
      input.earlyWarning * .04 +
      input.networkMapping * .03;
    return {
      healthScore: score("ecosystem_health", "Ecosystem Health Score", overall),
      areaScores,
      forecastScore: score("ecosystem_forecast", "Forecast Score", input.forecast),
      scenarioScore: score("ecosystem_scenario", "Scenario Score", input.scenario),
      analysisScore: score("ecosystem_analysis", "Analysis Score", input.analysis),
      earlyWarningScore: score("ecosystem_early_warning", "Early Warning Score", input.earlyWarning),
      networkMappingScore: score("ecosystem_network_mapping", "Network Mapping Score", input.networkMapping),
      partnershipScore: score("ecosystem_partnership", "Partnership Score", input.partnership),
      dependencyScore: score("ecosystem_dependency", "Dependency Score", input.dependency),
      collaborationScore: score("ecosystem_collaboration", "Collaboration Score", input.collaboration),
      networkEffectScore: score("ecosystem_network_effect", "Network Effect Score", input.networkEffect),
    };
  }
}

export class EcosystemRecommendationComposer {
  constructor(private createId: (prefix: string) => string) {}
  compose(
    areas: Record<EcosystemArea, EcosystemAreaSuite>,
    analysis: EcosystemAnalysisSuite,
    scenarios: EcosystemScenarioSuite,
    now: Date,
  ): EcosystemRecommendationRecord[] {
    return [...ECOSYSTEM_AREAS]
      .sort((a, b) => areas[a].score - areas[b].score)
      .slice(0, 6)
      .map((area, index) => ({
        id: this.createId("esm-rec"),
        title: `Address ${area.replaceAll("_", " ")} ecosystem exposure`,
        priority: priorityFromScore(areas[area].score),
        evidenceRefs: analysis.analyses.slice(0, 2).map(a => a.id).concat(scenarios.scenarios.slice(0, 1).map(s => s.id)),
        confidenceScore: .68,
        owner: index ? "ecosystem-owner" : "executive-team",
        dueDate: new Date(now.getTime() + (30 + index * 14) * 86400000).toISOString(),
        rationale: areas[area].narrative,
        action: `Run an ecosystem response cycle for ${area.replaceAll("_", " ")}.`,
        lenses: lens(area, areas[area].score),
        narrative: `Prioritize ${area} ecosystem response.`,
      }));
  }
}

export function composeRisksOpportunities(
  areas: Record<EcosystemArea, EcosystemAreaSuite>,
  createId: (prefix: string) => string,
): { risks: EcosystemRiskRecord[]; opportunities: EcosystemOpportunityRecord[] } {
  const ordered = [...ECOSYSTEM_AREAS].sort((a, b) => areas[a].score - areas[b].score);
  return {
    risks: ordered.slice(0, 5).map(a => ({
      id: createId("esm-risk"),
      title: `${a.replaceAll("_", " ")} ecosystem pressure`,
      area: a,
      severity: priorityFromScore(areas[a].score),
      score: 100 - areas[a].score,
      mitigation: `Strengthen monitoring and ecosystem playbooks for ${a.replaceAll("_", " ")}.`,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
    opportunities: ordered.slice(-5).reverse().map(a => ({
      id: createId("esm-opp"),
      title: `Capture ${a.replaceAll("_", " ")} ecosystem advantage`,
      area: a,
      priority: priorityFromScore(100 - areas[a].score),
      score: areas[a].score,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
  };
}

export function composeHealth(
  scores: ReturnType<EcosystemIntelligence["composeScores"]>,
  baseline: EcosystemBaseline,
  forecasts: EcosystemForecastSuite,
): EcosystemHealthScore {
  const areaScores = Object.fromEntries(ECOSYSTEM_AREAS.map(a => [a, scores.areaScores[a].value])) as Record<EcosystemArea, number>;
  return {
    overallScore: scores.healthScore.value,
    status: scores.healthScore.status,
    outlook: forecasts.outlook,
    areaScores,
    partnershipScore: scores.partnershipScore.value,
    dependencyScore: scores.dependencyScore.value,
    networkEffectScore: scores.networkEffectScore.value,
    collaborationScore: scores.collaborationScore.value,
    forecastScore: scores.forecastScore.value,
    scenarioScore: scores.scenarioScore.value,
    lenses: lens("organization", scores.healthScore.value),
    narrative: scores.healthScore.narrative,
  };
}

export function composeDashboard(
  now: Date,
  health: EcosystemHealthScore,
  baseline: EcosystemBaseline,
  risks: EcosystemRiskRecord[],
  opportunities: EcosystemOpportunityRecord[],
): EcosystemDashboard {
  return {
    generatedAt: now.toISOString(),
    headline: `Executive Ecosystem Overview: health ${Math.round(health.overallScore)}  -  ${health.status} (${health.outlook})`,
    overall: health.overallScore,
    areaScores: health.areaScores,
    outlook: health.outlook,
    networkStrength: baseline.networkStrength,
    strategicPartnerships: baseline.strategicPartnerships,
    ecosystemHealth: baseline.ecosystemHealth,
    topRisks: risks.map(r => r.title),
    topOpportunities: opportunities.map(o => o.title),
    narrative: health.narrative,
  };
}

export function composeEcosystemHealth(
  scores: ReturnType<EcosystemIntelligence["composeScores"]>,
  baseline: EcosystemBaseline,
  forecasts: EcosystemForecastSuite,
) {
  return composeHealth(scores, baseline, forecasts);
}

export const ecosystemLens = lens;
