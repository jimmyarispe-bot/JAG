import { buildLens, clamp, priorityFromScore, statusFromScore } from "@/lib/platform/intelligence/reputation/models";
import type {
  ReputationArea, ReputationAreaSuite, ReputationBaseline, ReputationDashboard,
  ReputationForecastSuite, ReputationHealthScore, ReputationOpportunityRecord,
  ReputationRecommendationRecord, ReputationRiskRecord, ReputationScenarioSuite,
  ReputationScore, ReputationAnalysisSuite,
} from "@/lib/platform/intelligence/reputation/types";
import { REPUTATION_AREAS } from "@/lib/platform/intelligence/reputation/types";

export const score = (key: string, label: string, value: number): ReputationScore => {
  const v = clamp(value);
  return { key, label, value: v, status: statusFromScore(v), band: priorityFromScore(v), narrative: `${label} is ${statusFromScore(v)} at ${Math.round(v)}.` };
};

const lens = (area: string, value: number) => buildLens({
  trustLevel: `${area} trust level scored ${Math.round(value)}.`,
  publicPerception: `Public perception linked to ${area}.`,
  brandStrength: `Brand strength around ${area}.`,
  mediaExposure: `Media exposure relative to ${area} conditions.`,
  crisisRisk: `Crisis risk reading for ${area}.`,
  narrativeMomentum: `Narrative implications of ${area}.`,
  credibility: `Credibility pressure from ${area}.`,
  longTermReputationOutlook: `Timing window for ${area}-linked reputation action.`,
});

export class ReputationIntelligence {
  composeScores(input: {
    baseline: ReputationBaseline;
    areas: Record<ReputationArea, ReputationAreaSuite>;
    forecast: number;
    scenario: number;
    analysis: number;
    earlyWarning: number;
    trust: number;
    sentiment: number;
    media: number;
    crisis: number;
  }) {
    const areaScores = Object.fromEntries(
      REPUTATION_AREAS.map(a => [a, score(`reputation_${a}`, `${a} Reputation Score`, input.areas[a].score)])
    ) as Record<ReputationArea, ReputationScore>;
    const overall =
      REPUTATION_AREAS.reduce((s, a) => s + areaScores[a].value, 0) / REPUTATION_AREAS.length * .5 +
      input.baseline.trustLevel * .1 +
      input.baseline.brandStrength * .1 +
      (100 - input.baseline.crisisRisk) * .08 +
      input.forecast * .08 +
      input.scenario * .07 +
      input.earlyWarning * .04 +
      input.media * .03;
    return {
      healthScore: score("reputation_health", "Reputation Health Score", overall),
      areaScores,
      forecastScore: score("reputation_forecast", "Forecast Score", input.forecast),
      scenarioScore: score("reputation_scenario", "Scenario Score", input.scenario),
      analysisScore: score("reputation_analysis", "Analysis Score", input.analysis),
      earlyWarningScore: score("reputation_early_warning", "Early Warning Score", input.earlyWarning),
      trustScore: score("reputation_trust", "Trust Score", input.trust),
      sentimentScore: score("reputation_sentiment", "Sentiment Score", input.sentiment),
      mediaScore: score("reputation_media", "Media Score", input.media),
      crisisScore: score("reputation_crisis", "Crisis Score", input.crisis),
    };
  }
}

export class ReputationRecommendationComposer {
  constructor(private createId: (prefix: string) => string) {}
  compose(
    areas: Record<ReputationArea, ReputationAreaSuite>,
    analysis: ReputationAnalysisSuite,
    scenarios: ReputationScenarioSuite,
    now: Date,
  ): ReputationRecommendationRecord[] {
    return [...REPUTATION_AREAS]
      .sort((a, b) => areas[a].score - areas[b].score)
      .slice(0, 6)
      .map((area, index) => ({
        id: this.createId("rep-rec"),
        title: `Address ${area.replaceAll("_", " ")} reputation exposure`,
        priority: priorityFromScore(areas[area].score),
        evidenceRefs: analysis.analyses.slice(0, 2).map(a => a.id).concat(scenarios.scenarios.slice(0, 1).map(s => s.id)),
        confidenceScore: .68,
        owner: index ? "reputation-owner" : "executive-team",
        dueDate: new Date(now.getTime() + (30 + index * 14) * 86400000).toISOString(),
        rationale: areas[area].narrative,
        action: `Run a reputation response cycle for ${area.replaceAll("_", " ")}.`,
        lenses: lens(area, areas[area].score),
        narrative: `Prioritize ${area} reputation response.`,
      }));
  }
}

export function composeRisksOpportunities(
  areas: Record<ReputationArea, ReputationAreaSuite>,
  createId: (prefix: string) => string,
): { risks: ReputationRiskRecord[]; opportunities: ReputationOpportunityRecord[] } {
  const ordered = [...REPUTATION_AREAS].sort((a, b) => areas[a].score - areas[b].score);
  return {
    risks: ordered.slice(0, 5).map(a => ({
      id: createId("rep-risk"),
      title: `${a.replaceAll("_", " ")} reputation pressure`,
      area: a,
      severity: priorityFromScore(areas[a].score),
      score: 100 - areas[a].score,
      mitigation: `Strengthen monitoring and recovery playbooks for ${a.replaceAll("_", " ")}.`,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
    opportunities: ordered.slice(-5).reverse().map(a => ({
      id: createId("rep-opp"),
      title: `Capture ${a.replaceAll("_", " ")} reputation advantage`,
      area: a,
      priority: priorityFromScore(100 - areas[a].score),
      score: areas[a].score,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
  };
}

export function composeHealth(
  scores: ReturnType<ReputationIntelligence["composeScores"]>,
  baseline: ReputationBaseline,
  forecasts: ReputationForecastSuite,
): ReputationHealthScore {
  const areaScores = Object.fromEntries(REPUTATION_AREAS.map(a => [a, scores.areaScores[a].value])) as Record<ReputationArea, number>;
  return {
    overallScore: scores.healthScore.value,
    status: scores.healthScore.status,
    outlook: forecasts.outlook,
    areaScores,
    trustScore: scores.trustScore.value,
    brandScore: baseline.brandStrength,
    mediaScore: scores.mediaScore.value,
    crisisScore: scores.crisisScore.value,
    forecastScore: scores.forecastScore.value,
    scenarioScore: scores.scenarioScore.value,
    lenses: lens("organization", scores.healthScore.value),
    narrative: scores.healthScore.narrative,
  };
}

export function composeDashboard(
  now: Date,
  health: ReputationHealthScore,
  baseline: ReputationBaseline,
  risks: ReputationRiskRecord[],
  opportunities: ReputationOpportunityRecord[],
): ReputationDashboard {
  return {
    generatedAt: now.toISOString(),
    headline: `Executive Reputation Overview: health ${Math.round(health.overallScore)} — ${health.status} (${health.outlook})`,
    overall: health.overallScore,
    areaScores: health.areaScores,
    outlook: health.outlook,
    trustLevel: baseline.trustLevel,
    brandStrength: baseline.brandStrength,
    crisisRisk: baseline.crisisRisk,
    topRisks: risks.map(r => r.title),
    topOpportunities: opportunities.map(o => o.title),
    narrative: health.narrative,
  };
}

export function composeReputationHealth(
  scores: ReturnType<ReputationIntelligence["composeScores"]>,
  baseline: ReputationBaseline,
  forecasts: ReputationForecastSuite,
) {
  return composeHealth(scores, baseline, forecasts);
}

export const reputationLens = lens;
