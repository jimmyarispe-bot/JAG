import { buildLens, clamp, outlookFromScore, priorityFromScore, statusFromScore } from "@/lib/platform/intelligence/environmental/models";
import type {
  EnvironmentalArea, EnvironmentalAreaSuite, EnvironmentalBaseline, EnvironmentalDashboard,
  EnvironmentalForecastSuite, EnvironmentalHealthScore, EnvironmentalOpportunityRecord,
  EnvironmentalRecommendationRecord, EnvironmentalRiskRecord, EnvironmentalScenarioSuite,
  EnvironmentalScore, EnvironmentalAnalysisSuite,
} from "@/lib/platform/intelligence/environmental/types";
import { ENVIRONMENTAL_AREAS } from "@/lib/platform/intelligence/environmental/types";

export const score = (key: string, label: string, value: number): EnvironmentalScore => {
  const v = clamp(value);
  return { key, label, value: v, status: statusFromScore(v), band: priorityFromScore(v), narrative: `${label} is ${statusFromScore(v)} at ${Math.round(v)}.` };
};

const lens = (area: string, value: number) => buildLens({
  climateRisk: `${area} climate risk scored ${Math.round(value)}.`,
  facilityExposure: `Facility exposure linked to ${area}.`,
  infrastructureResilience: `Infrastructure resilience around ${area}.`,
  resourceAvailability: `Resource availability relative to ${area} conditions.`,
  sustainabilityImpact: `Sustainability reading for ${area}.`,
  regulatoryExposure: `Regulatory implications of ${area}.`,
  insuranceRisk: `Insurance pressure from ${area}.`,
  longTermEnvironmentalOutlook: `Timing window for ${area}-linked environmental action.`,
});

export class EnvironmentalIntelligence {
  composeScores(input: {
    baseline: EnvironmentalBaseline;
    areas: Record<EnvironmentalArea, EnvironmentalAreaSuite>;
    forecast: number;
    scenario: number;
    analysis: number;
    earlyWarning: number;
    climateRisk: number;
    disasterImpact: number;
  }) {
    const areaScores = Object.fromEntries(
      ENVIRONMENTAL_AREAS.map(a => [a, score(`environmental_${a}`, `${a} Environmental Score`, input.areas[a].score)])
    ) as Record<EnvironmentalArea, EnvironmentalScore>;
    const overall =
      ENVIRONMENTAL_AREAS.reduce((s, a) => s + areaScores[a].value, 0) / ENVIRONMENTAL_AREAS.length * .5 +
      input.baseline.sustainabilityMaturity * .1 +
      input.baseline.resourceAvailability * .1 +
      input.baseline.infrastructureResilience * .08 +
      input.forecast * .08 +
      input.scenario * .07 +
      input.earlyWarning * .04 +
      input.climateRisk * .03;
    return {
      healthScore: score("environmental_health", "Environmental Health Score", overall),
      areaScores,
      forecastScore: score("environmental_forecast", "Forecast Score", input.forecast),
      scenarioScore: score("environmental_scenario", "Scenario Score", input.scenario),
      analysisScore: score("environmental_analysis", "Analysis Score", input.analysis),
      earlyWarningScore: score("environmental_early_warning", "Early Warning Score", input.earlyWarning),
      climateRiskScore: score("environmental_climate_risk", "Climate Risk Score", input.climateRisk),
      disasterImpactScore: score("environmental_disaster_impact", "Disaster Impact Score", input.disasterImpact),
    };
  }
}

export class EnvironmentalRecommendationComposer {
  constructor(private createId: (prefix: string) => string) {}
  compose(
    areas: Record<EnvironmentalArea, EnvironmentalAreaSuite>,
    analysis: EnvironmentalAnalysisSuite,
    scenarios: EnvironmentalScenarioSuite,
    now: Date,
  ): EnvironmentalRecommendationRecord[] {
    return [...ENVIRONMENTAL_AREAS]
      .sort((a, b) => areas[a].score - areas[b].score)
      .slice(0, 6)
      .map((area, index) => ({
        id: this.createId("env-rec"),
        title: `Address ${area.replaceAll("_", " ")} environmental exposure`,
        priority: priorityFromScore(areas[area].score),
        evidenceRefs: analysis.analyses.slice(0, 2).map(a => a.id).concat(scenarios.scenarios.slice(0, 1).map(s => s.id)),
        confidenceScore: .68,
        owner: index ? "environmental-owner" : "executive-team",
        dueDate: new Date(now.getTime() + (30 + index * 14) * 86400000).toISOString(),
        rationale: areas[area].narrative,
        action: `Run an environmental response cycle for ${area.replaceAll("_", " ")}.`,
        lenses: lens(area, areas[area].score),
        narrative: `Prioritize ${area} environmental response.`,
      }));
  }
}

export function composeRisksOpportunities(
  areas: Record<EnvironmentalArea, EnvironmentalAreaSuite>,
  createId: (prefix: string) => string,
): { risks: EnvironmentalRiskRecord[]; opportunities: EnvironmentalOpportunityRecord[] } {
  const ordered = [...ENVIRONMENTAL_AREAS].sort((a, b) => areas[a].score - areas[b].score);
  return {
    risks: ordered.slice(0, 5).map(a => ({
      id: createId("env-risk"),
      title: `${a.replaceAll("_", " ")} environmental pressure`,
      area: a,
      severity: priorityFromScore(areas[a].score),
      score: 100 - areas[a].score,
      mitigation: `Strengthen monitoring and response playbooks for ${a.replaceAll("_", " ")}.`,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
    opportunities: ordered.slice(-5).reverse().map(a => ({
      id: createId("env-opp"),
      title: `Capture ${a.replaceAll("_", " ")} environmental advantage`,
      area: a,
      priority: priorityFromScore(100 - areas[a].score),
      score: areas[a].score,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
  };
}

export function composeHealth(
  scores: ReturnType<EnvironmentalIntelligence["composeScores"]>,
  baseline: EnvironmentalBaseline,
  forecasts: EnvironmentalForecastSuite,
): EnvironmentalHealthScore {
  const areaScores = Object.fromEntries(ENVIRONMENTAL_AREAS.map(a => [a, scores.areaScores[a].value])) as Record<EnvironmentalArea, number>;
  return {
    overallScore: scores.healthScore.value,
    status: scores.healthScore.status,
    outlook: forecasts.outlook,
    areaScores,
    climateScore: areaScores.climate,
    sustainabilityScore: areaScores.sustainability,
    infrastructureScore: baseline.infrastructureResilience,
    resourceScore: baseline.resourceAvailability,
    forecastScore: scores.forecastScore.value,
    scenarioScore: scores.scenarioScore.value,
    lenses: lens("organization", scores.healthScore.value),
    narrative: scores.healthScore.narrative,
  };
}

export function composeDashboard(
  now: Date,
  health: EnvironmentalHealthScore,
  baseline: EnvironmentalBaseline,
  risks: EnvironmentalRiskRecord[],
  opportunities: EnvironmentalOpportunityRecord[],
): EnvironmentalDashboard {
  return {
    generatedAt: now.toISOString(),
    headline: `Environmental health ${Math.round(health.overallScore)} — ${health.status} (${health.outlook})`,
    overall: health.overallScore,
    areaScores: health.areaScores,
    outlook: health.outlook,
    climateRisk: baseline.climateRisk,
    facilityExposure: baseline.facilityExposure,
    resourceAvailability: baseline.resourceAvailability,
    topRisks: risks.map(r => r.title),
    topOpportunities: opportunities.map(o => o.title),
    narrative: health.narrative,
  };
}

export function composeEnvironmentalHealth(
  scores: ReturnType<EnvironmentalIntelligence["composeScores"]>,
  baseline: EnvironmentalBaseline,
  forecasts: EnvironmentalForecastSuite,
) {
  return composeHealth(scores, baseline, forecasts);
}

export const environmentalLens = lens;
export { outlookFromScore };
