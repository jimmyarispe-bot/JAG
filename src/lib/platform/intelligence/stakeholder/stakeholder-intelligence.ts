import { buildLens, clamp, outlookFromScore, priorityFromScore, statusFromScore } from "@/lib/platform/intelligence/stakeholder/models";
import type {
  StakeholderArea, StakeholderAreaSuite, StakeholderBaseline, StakeholderDashboard,
  StakeholderForecastSuite, StakeholderHealthScore, StakeholderOpportunityRecord,
  StakeholderRecommendationRecord, StakeholderRiskRecord, StakeholderScenarioSuite,
  StakeholderScore, StakeholderAnalysisSuite,
} from "@/lib/platform/intelligence/stakeholder/types";
import { STAKEHOLDER_AREAS } from "@/lib/platform/intelligence/stakeholder/types";

export const score = (key: string, label: string, value: number): StakeholderScore => {
  const v = clamp(value);
  return { key, label, value: v, status: statusFromScore(v), band: priorityFromScore(v), narrative: `${label} is ${statusFromScore(v)} at ${Math.round(v)}.` };
};

const lens = (area: string, value: number) => buildLens({
  influence: `${area} influence scored ${Math.round(value)}.`,
  interest: `Interest posture linked to ${area}.`,
  trust: `Trust around ${area}.`,
  engagement: `Engagement quality relative to ${area} conditions.`,
  satisfaction: `Satisfaction reading for ${area}.`,
  relationshipStrength: `Relationship implications of ${area}.`,
  collaborationOpportunity: `Collaboration pressure from ${area}.`,
  strategicImportance: `Timing window for ${area}-linked stakeholder action.`,
});

export class StakeholderIntelligence {
  composeScores(input: {
    baseline: StakeholderBaseline;
    areas: Record<StakeholderArea, StakeholderAreaSuite>;
    forecast: number;
    scenario: number;
    analysis: number;
    earlyWarning: number;
    influence: number;
    relationship: number;
    sentiment: number;
  }) {
    const areaScores = Object.fromEntries(
      STAKEHOLDER_AREAS.map(a => [a, score(`stakeholder_${a}`, `${a} Stakeholder Score`, input.areas[a].score)])
    ) as Record<StakeholderArea, StakeholderScore>;
    const overall =
      STAKEHOLDER_AREAS.reduce((s, a) => s + areaScores[a].value, 0) / STAKEHOLDER_AREAS.length * .5 +
      input.baseline.trustLevel * .1 +
      input.baseline.engagementQuality * .1 +
      input.baseline.relationshipStrength * .08 +
      input.forecast * .08 +
      input.scenario * .07 +
      input.earlyWarning * .04 +
      input.influence * .03;
    return {
      healthScore: score("stakeholder_health", "Stakeholder Health Score", overall),
      areaScores,
      forecastScore: score("stakeholder_forecast", "Forecast Score", input.forecast),
      scenarioScore: score("stakeholder_scenario", "Scenario Score", input.scenario),
      analysisScore: score("stakeholder_analysis", "Analysis Score", input.analysis),
      earlyWarningScore: score("stakeholder_early_warning", "Early Warning Score", input.earlyWarning),
      influenceScore: score("stakeholder_influence", "Influence Score", input.influence),
      relationshipScore: score("stakeholder_relationship", "Relationship Score", input.relationship),
      sentimentScore: score("stakeholder_sentiment", "Sentiment Score", input.sentiment),
    };
  }
}

export class StakeholderRecommendationComposer {
  constructor(private createId: (prefix: string) => string) {}
  compose(
    areas: Record<StakeholderArea, StakeholderAreaSuite>,
    analysis: StakeholderAnalysisSuite,
    scenarios: StakeholderScenarioSuite,
    now: Date,
  ): StakeholderRecommendationRecord[] {
    return [...STAKEHOLDER_AREAS]
      .sort((a, b) => areas[a].score - areas[b].score)
      .slice(0, 6)
      .map((area, index) => ({
        id: this.createId("stk-rec"),
        title: `Address ${area.replaceAll("_", " ")} stakeholder exposure`,
        priority: priorityFromScore(areas[area].score),
        evidenceRefs: analysis.analyses.slice(0, 2).map(a => a.id).concat(scenarios.scenarios.slice(0, 1).map(s => s.id)),
        confidenceScore: .68,
        owner: index ? "stakeholder-owner" : "executive-team",
        dueDate: new Date(now.getTime() + (30 + index * 14) * 86400000).toISOString(),
        rationale: areas[area].narrative,
        action: `Run a stakeholder response cycle for ${area.replaceAll("_", " ")}.`,
        lenses: lens(area, areas[area].score),
        narrative: `Prioritize ${area} stakeholder response.`,
      }));
  }
}

export function composeRisksOpportunities(
  areas: Record<StakeholderArea, StakeholderAreaSuite>,
  createId: (prefix: string) => string,
): { risks: StakeholderRiskRecord[]; opportunities: StakeholderOpportunityRecord[] } {
  const ordered = [...STAKEHOLDER_AREAS].sort((a, b) => areas[a].score - areas[b].score);
  return {
    risks: ordered.slice(0, 5).map(a => ({
      id: createId("stk-risk"),
      title: `${a.replaceAll("_", " ")} stakeholder pressure`,
      area: a,
      severity: priorityFromScore(areas[a].score),
      score: 100 - areas[a].score,
      mitigation: `Strengthen monitoring and engagement playbooks for ${a.replaceAll("_", " ")}.`,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
    opportunities: ordered.slice(-5).reverse().map(a => ({
      id: createId("stk-opp"),
      title: `Capture ${a.replaceAll("_", " ")} stakeholder advantage`,
      area: a,
      priority: priorityFromScore(100 - areas[a].score),
      score: areas[a].score,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
  };
}

export function composeHealth(
  scores: ReturnType<StakeholderIntelligence["composeScores"]>,
  baseline: StakeholderBaseline,
  forecasts: StakeholderForecastSuite,
): StakeholderHealthScore {
  const areaScores = Object.fromEntries(STAKEHOLDER_AREAS.map(a => [a, scores.areaScores[a].value])) as Record<StakeholderArea, number>;
  return {
    overallScore: scores.healthScore.value,
    status: scores.healthScore.status,
    outlook: forecasts.outlook,
    areaScores,
    influenceScore: scores.influenceScore.value,
    trustScore: baseline.trustLevel,
    engagementScore: baseline.engagementQuality,
    relationshipScore: scores.relationshipScore.value,
    forecastScore: scores.forecastScore.value,
    scenarioScore: scores.scenarioScore.value,
    lenses: lens("organization", scores.healthScore.value),
    narrative: scores.healthScore.narrative,
  };
}

export function composeDashboard(
  now: Date,
  health: StakeholderHealthScore,
  baseline: StakeholderBaseline,
  risks: StakeholderRiskRecord[],
  opportunities: StakeholderOpportunityRecord[],
): StakeholderDashboard {
  return {
    generatedAt: now.toISOString(),
    headline: `Executive Stakeholder Overview: health ${Math.round(health.overallScore)} — ${health.status} (${health.outlook})`,
    overall: health.overallScore,
    areaScores: health.areaScores,
    outlook: health.outlook,
    influencePressure: baseline.influencePressure,
    trustLevel: baseline.trustLevel,
    engagementQuality: baseline.engagementQuality,
    topRisks: risks.map(r => r.title),
    topOpportunities: opportunities.map(o => o.title),
    narrative: health.narrative,
  };
}

export function composeStakeholderHealth(
  scores: ReturnType<StakeholderIntelligence["composeScores"]>,
  baseline: StakeholderBaseline,
  forecasts: StakeholderForecastSuite,
) {
  return composeHealth(scores, baseline, forecasts);
}

export const stakeholderLens = lens;
export { outlookFromScore };
