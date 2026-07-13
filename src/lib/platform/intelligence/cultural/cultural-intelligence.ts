import { buildLens, clamp, priorityFromScore, statusFromScore } from "@/lib/platform/intelligence/cultural/models";
import type {
  CulturalArea, CulturalAreaSuite, CulturalBaseline, CulturalDashboard,
  CulturalForecastSuite, CulturalHealthScore, CulturalOpportunityRecord,
  CulturalRecommendationRecord, CulturalRiskRecord, CulturalScenarioSuite,
  CulturalScore, CulturalAnalysisSuite,
} from "@/lib/platform/intelligence/cultural/types";
import { CULTURAL_AREAS } from "@/lib/platform/intelligence/cultural/types";

export const score = (key: string, label: string, value: number): CulturalScore => {
  const v = clamp(value);
  return { key, label, value: v, status: statusFromScore(v), band: priorityFromScore(v), narrative: `${label} is ${statusFromScore(v)} at ${Math.round(v)}.` };
};

const lens = (area: string, value: number) => buildLens({
  missionAlignment: `${area} mission alignment scored ${Math.round(value)}.`,
  valuesAlignment: `Values alignment linked to ${area}.`,
  culturalHealth: `Cultural health around ${area}.`,
  collaborationQuality: `Collaboration quality relative to ${area} conditions.`,
  innovationReadiness: `Innovation readiness reading for ${area}.`,
  psychologicalSafety: `Psychological safety implications of ${area}.`,
  engagement: `Engagement pressure from ${area}.`,
  longTermCulturalOutlook: `Timing window for ${area}-linked cultural action.`,
});

export class CulturalIntelligence {
  composeScores(input: {
    baseline: CulturalBaseline;
    areas: Record<CulturalArea, CulturalAreaSuite>;
    forecast: number;
    scenario: number;
    analysis: number;
    earlyWarning: number;
    cultureMapping: number;
    engagement: number;
    missionAlignment: number;
    valuesAlignment: number;
  }) {
    const areaScores = Object.fromEntries(
      CULTURAL_AREAS.map(a => [a, score(`cultural_${a}`, `${a} Cultural Score`, input.areas[a].score)])
    ) as Record<CulturalArea, CulturalScore>;
    const overall =
      CULTURAL_AREAS.reduce((s, a) => s + areaScores[a].value, 0) / CULTURAL_AREAS.length * .5 +
      input.baseline.missionAlignment * .1 +
      input.baseline.engagement * .1 +
      input.baseline.psychologicalSafety * .08 +
      input.forecast * .08 +
      input.scenario * .07 +
      input.earlyWarning * .04 +
      input.cultureMapping * .03;
    return {
      healthScore: score("cultural_health", "Cultural Health Score", overall),
      areaScores,
      forecastScore: score("cultural_forecast", "Forecast Score", input.forecast),
      scenarioScore: score("cultural_scenario", "Scenario Score", input.scenario),
      analysisScore: score("cultural_analysis", "Analysis Score", input.analysis),
      earlyWarningScore: score("cultural_early_warning", "Early Warning Score", input.earlyWarning),
      cultureMappingScore: score("cultural_culture_mapping", "Culture Mapping Score", input.cultureMapping),
      engagementScore: score("cultural_engagement_engine", "Engagement Score", input.engagement),
      missionAlignmentScore: score("cultural_mission_alignment_engine", "Mission Alignment Score", input.missionAlignment),
      valuesAlignmentScore: score("cultural_values_alignment_engine", "Values Alignment Score", input.valuesAlignment),
    };
  }
}

export class CulturalRecommendationComposer {
  constructor(private createId: (prefix: string) => string) {}
  compose(
    areas: Record<CulturalArea, CulturalAreaSuite>,
    analysis: CulturalAnalysisSuite,
    scenarios: CulturalScenarioSuite,
    now: Date,
  ): CulturalRecommendationRecord[] {
    return [...CULTURAL_AREAS]
      .sort((a, b) => areas[a].score - areas[b].score)
      .slice(0, 6)
      .map((area, index) => ({
        id: this.createId("cul-rec"),
        title: `Address ${area.replaceAll("_", " ")} cultural exposure`,
        priority: priorityFromScore(areas[area].score),
        evidenceRefs: analysis.analyses.slice(0, 2).map(a => a.id).concat(scenarios.scenarios.slice(0, 1).map(s => s.id)),
        confidenceScore: .68,
        owner: index ? "cultural-owner" : "executive-team",
        dueDate: new Date(now.getTime() + (30 + index * 14) * 86400000).toISOString(),
        rationale: areas[area].narrative,
        action: `Run a cultural response cycle for ${area.replaceAll("_", " ")}.`,
        lenses: lens(area, areas[area].score),
        narrative: `Prioritize ${area} cultural response.`,
      }));
  }
}

export function composeRisksOpportunities(
  areas: Record<CulturalArea, CulturalAreaSuite>,
  createId: (prefix: string) => string,
): { risks: CulturalRiskRecord[]; opportunities: CulturalOpportunityRecord[] } {
  const ordered = [...CULTURAL_AREAS].sort((a, b) => areas[a].score - areas[b].score);
  return {
    risks: ordered.slice(0, 5).map(a => ({
      id: createId("cul-risk"),
      title: `${a.replaceAll("_", " ")} cultural pressure`,
      area: a,
      severity: priorityFromScore(areas[a].score),
      score: 100 - areas[a].score,
      mitigation: `Strengthen monitoring and culture playbooks for ${a.replaceAll("_", " ")}.`,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
    opportunities: ordered.slice(-5).reverse().map(a => ({
      id: createId("cul-opp"),
      title: `Capture ${a.replaceAll("_", " ")} cultural advantage`,
      area: a,
      priority: priorityFromScore(100 - areas[a].score),
      score: areas[a].score,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
  };
}

export function composeHealth(
  scores: ReturnType<CulturalIntelligence["composeScores"]>,
  baseline: CulturalBaseline,
  forecasts: CulturalForecastSuite,
): CulturalHealthScore {
  const areaScores = Object.fromEntries(CULTURAL_AREAS.map(a => [a, scores.areaScores[a].value])) as Record<CulturalArea, number>;
  return {
    overallScore: scores.healthScore.value,
    status: scores.healthScore.status,
    outlook: forecasts.outlook,
    areaScores,
    missionScore: scores.missionAlignmentScore.value,
    engagementScore: scores.engagementScore.value,
    collaborationScore: baseline.collaborationQuality,
    valuesScore: scores.valuesAlignmentScore.value,
    forecastScore: scores.forecastScore.value,
    scenarioScore: scores.scenarioScore.value,
    lenses: lens("organization", scores.healthScore.value),
    narrative: scores.healthScore.narrative,
  };
}

export function composeDashboard(
  now: Date,
  health: CulturalHealthScore,
  baseline: CulturalBaseline,
  risks: CulturalRiskRecord[],
  opportunities: CulturalOpportunityRecord[],
): CulturalDashboard {
  return {
    generatedAt: now.toISOString(),
    headline: `Executive Culture Overview: health ${Math.round(health.overallScore)}  -  ${health.status} (${health.outlook})`,
    overall: health.overallScore,
    areaScores: health.areaScores,
    outlook: health.outlook,
    missionAlignment: baseline.missionAlignment,
    valuesAlignment: baseline.valuesAlignment,
    engagement: baseline.engagement,
    topRisks: risks.map(r => r.title),
    topOpportunities: opportunities.map(o => o.title),
    narrative: health.narrative,
  };
}

export function composeCulturalHealth(
  scores: ReturnType<CulturalIntelligence["composeScores"]>,
  baseline: CulturalBaseline,
  forecasts: CulturalForecastSuite,
) {
  return composeHealth(scores, baseline, forecasts);
}

export const culturalLens = lens;
