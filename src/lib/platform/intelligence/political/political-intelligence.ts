import { buildLens, clamp, outlookFromScore, priorityFromScore, statusFromScore } from "@/lib/platform/intelligence/political/models";
import type {
  PoliticalArea, PoliticalAreaSuite, PoliticalBaseline, PoliticalDashboard,
  PoliticalForecastSuite, PoliticalHealthScore, PoliticalOpportunityRecord,
  PoliticalRecommendationRecord, PoliticalRiskRecord, PoliticalScenarioSuite,
  PoliticalScore, PoliticalAnalysisSuite,
} from "@/lib/platform/intelligence/political/types";
import { POLITICAL_AREAS } from "@/lib/platform/intelligence/political/types";

export const score = (key: string, label: string, value: number): PoliticalScore => {
  const v = clamp(value);
  return { key, label, value: v, status: statusFromScore(v), band: priorityFromScore(v), narrative: `${label} is ${statusFromScore(v)} at ${Math.round(v)}.` };
};

const lens = (area: string, value: number) => buildLens({
  legislativeImpact: `${area} legislative force scored ${Math.round(value)}.`,
  regulatoryRisk: `Regulatory exposure linked to ${area}.`,
  governmentFundingOpportunity: `Funding opportunity around ${area}.`,
  taxExposure: `Tax exposure relative to ${area} conditions.`,
  politicalStability: `Stability reading for ${area}.`,
  tradeImpact: `Trade implications of ${area}.`,
  compliancePressure: `Compliance pressure from ${area}.`,
  strategicTiming: `Timing window for ${area}-linked action.`,
});

export class PoliticalIntelligence {
  composeScores(input: {
    baseline: PoliticalBaseline;
    areas: Record<PoliticalArea, PoliticalAreaSuite>;
    forecast: number;
    scenario: number;
    analysis: number;
    earlyWarning: number;
    politicalRisk: number;
  }) {
    const areaScores = Object.fromEntries(
      POLITICAL_AREAS.map(a => [a, score(`political_${a}`, `${a} Political Score`, input.areas[a].score)])
    ) as Record<PoliticalArea, PoliticalScore>;
    const overall =
      POLITICAL_AREAS.reduce((s, a) => s + areaScores[a].value, 0) / POLITICAL_AREAS.length * .5 +
      input.baseline.politicalStability * .1 +
      input.baseline.fundingOpportunity * .1 +
      (100 - input.baseline.geopoliticalRisk) * .08 +
      input.forecast * .08 +
      input.scenario * .07 +
      input.earlyWarning * .04 +
      input.politicalRisk * .03;
    return {
      healthScore: score("political_health", "Political Health Score", overall),
      areaScores,
      forecastScore: score("political_forecast", "Forecast Score", input.forecast),
      scenarioScore: score("political_scenario", "Scenario Score", input.scenario),
      analysisScore: score("political_analysis", "Analysis Score", input.analysis),
      earlyWarningScore: score("political_early_warning", "Early Warning Score", input.earlyWarning),
      politicalRiskScore: score("political_risk", "Political Risk Score", input.politicalRisk),
    };
  }
}

export class PoliticalRecommendationComposer {
  constructor(private createId: (prefix: string) => string) {}
  compose(
    areas: Record<PoliticalArea, PoliticalAreaSuite>,
    analysis: PoliticalAnalysisSuite,
    scenarios: PoliticalScenarioSuite,
    now: Date,
  ): PoliticalRecommendationRecord[] {
    return [...POLITICAL_AREAS]
      .sort((a, b) => areas[a].score - areas[b].score)
      .slice(0, 6)
      .map((area, index) => ({
        id: this.createId("pol-rec"),
        title: `Address ${area.replaceAll("_", " ")} political exposure`,
        priority: priorityFromScore(areas[area].score),
        evidenceRefs: analysis.analyses.slice(0, 2).map(a => a.id).concat(scenarios.scenarios.slice(0, 1).map(s => s.id)),
        confidenceScore: .68,
        owner: index ? "political-owner" : "executive-team",
        dueDate: new Date(now.getTime() + (30 + index * 14) * 86400000).toISOString(),
        rationale: areas[area].narrative,
        action: `Run a policy response cycle for ${area.replaceAll("_", " ")}.`,
        lenses: lens(area, areas[area].score),
        narrative: `Prioritize ${area} political response.`,
      }));
  }
}

export function composeRisksOpportunities(
  areas: Record<PoliticalArea, PoliticalAreaSuite>,
  createId: (prefix: string) => string,
): { risks: PoliticalRiskRecord[]; opportunities: PoliticalOpportunityRecord[] } {
  const ordered = [...POLITICAL_AREAS].sort((a, b) => areas[a].score - areas[b].score);
  return {
    risks: ordered.slice(0, 5).map(a => ({
      id: createId("pol-risk"),
      title: `${a.replaceAll("_", " ")} political pressure`,
      area: a,
      severity: priorityFromScore(areas[a].score),
      score: 100 - areas[a].score,
      mitigation: `Strengthen monitoring and response playbooks for ${a.replaceAll("_", " ")}.`,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
    opportunities: ordered.slice(-5).reverse().map(a => ({
      id: createId("pol-opp"),
      title: `Capture ${a.replaceAll("_", " ")} political advantage`,
      area: a,
      priority: priorityFromScore(100 - areas[a].score),
      score: areas[a].score,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
  };
}

export function composeHealth(
  scores: ReturnType<PoliticalIntelligence["composeScores"]>,
  baseline: PoliticalBaseline,
  forecasts: PoliticalForecastSuite,
): PoliticalHealthScore {
  const areaScores = Object.fromEntries(POLITICAL_AREAS.map(a => [a, scores.areaScores[a].value])) as Record<PoliticalArea, number>;
  return {
    overallScore: scores.healthScore.value,
    status: scores.healthScore.status,
    outlook: forecasts.outlook,
    areaScores,
    legislativeScore: areaScores.legislative,
    regulatoryScore: areaScores.regulatory,
    fundingScore: baseline.fundingOpportunity,
    geopoliticalScore: 100 - baseline.geopoliticalRisk,
    forecastScore: scores.forecastScore.value,
    scenarioScore: scores.scenarioScore.value,
    lenses: lens("organization", scores.healthScore.value),
    narrative: scores.healthScore.narrative,
  };
}

export function composeDashboard(
  now: Date,
  health: PoliticalHealthScore,
  baseline: PoliticalBaseline,
  risks: PoliticalRiskRecord[],
  opportunities: PoliticalOpportunityRecord[],
): PoliticalDashboard {
  return {
    generatedAt: now.toISOString(),
    headline: `Political health ${Math.round(health.overallScore)} — ${health.status} (${health.outlook})`,
    overall: health.overallScore,
    areaScores: health.areaScores,
    outlook: health.outlook,
    legislativePressure: baseline.legislativePressure,
    regulatoryBurden: baseline.regulatoryBurden,
    fundingOpportunity: baseline.fundingOpportunity,
    topRisks: risks.map(r => r.title),
    topOpportunities: opportunities.map(o => o.title),
    narrative: health.narrative,
  };
}

export function composePoliticalHealth(
  scores: ReturnType<PoliticalIntelligence["composeScores"]>,
  baseline: PoliticalBaseline,
  forecasts: PoliticalForecastSuite,
) {
  return composeHealth(scores, baseline, forecasts);
}

export const politicalLens = lens;
export { outlookFromScore };
