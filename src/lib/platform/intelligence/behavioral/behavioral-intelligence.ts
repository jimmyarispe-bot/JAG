import { buildLens, clamp, priorityFromScore, statusFromScore } from "@/lib/platform/intelligence/behavioral/models";
import type {
  BehavioralArea, BehavioralAreaSuite, BehavioralBaseline, BehavioralDashboard,
  BehavioralForecastSuite, BehavioralHealthScore, BehavioralOpportunityRecord,
  BehavioralRecommendationRecord, BehavioralRiskRecord, BehavioralScenarioSuite,
  BehavioralScore, BehavioralAnalysisSuite,
} from "@/lib/platform/intelligence/behavioral/types";
import { BEHAVIORAL_AREAS } from "@/lib/platform/intelligence/behavioral/types";

export const score = (key: string, label: string, value: number): BehavioralScore => {
  const v = clamp(value);
  return { key, label, value: v, status: statusFromScore(v), band: priorityFromScore(v), narrative: `${label} is ${statusFromScore(v)} at ${Math.round(v)}.` };
};

const lens = (area: string, value: number) => buildLens({
  decisionConfidence: `${area} decision confidence scored ${Math.round(value)}.`,
  cognitiveBiasRisk: `Cognitive bias risk linked to ${area}.`,
  motivationAlignment: `Motivation alignment around ${area}.`,
  adoptionProbability: `Adoption probability relative to ${area} conditions.`,
  collaborationImpact: `Collaboration impact reading for ${area}.`,
  changeResistance: `Change resistance implications of ${area}.`,
  leadershipReadiness: `Leadership readiness pressure from ${area}.`,
  longTermBehavioralOutlook: `Timing window for ${area}-linked behavioral action.`,
});

export class BehavioralIntelligence {
  composeScores(input: {
    baseline: BehavioralBaseline;
    areas: Record<BehavioralArea, BehavioralAreaSuite>;
    forecast: number;
    scenario: number;
    analysis: number;
    earlyWarning: number;
    decisionModeling: number;
    motivation: number;
    collaboration: number;
    changeAdoption: number;
  }) {
    const areaScores = Object.fromEntries(
      BEHAVIORAL_AREAS.map(a => [a, score(`behavioral_${a}`, `${a} Behavioral Score`, input.areas[a].score)])
    ) as Record<BehavioralArea, BehavioralScore>;
    const overall =
      BEHAVIORAL_AREAS.reduce((s, a) => s + areaScores[a].value, 0) / BEHAVIORAL_AREAS.length * .5 +
      input.baseline.decisionConfidence * .1 +
      input.baseline.motivationAlignment * .1 +
      (100 - input.baseline.changeResistance) * .08 +
      input.forecast * .08 +
      input.scenario * .07 +
      input.earlyWarning * .04 +
      input.decisionModeling * .03;
    return {
      healthScore: score("behavioral_health", "Behavioral Health Score", overall),
      areaScores,
      forecastScore: score("behavioral_forecast", "Forecast Score", input.forecast),
      scenarioScore: score("behavioral_scenario", "Scenario Score", input.scenario),
      analysisScore: score("behavioral_analysis", "Analysis Score", input.analysis),
      earlyWarningScore: score("behavioral_early_warning", "Early Warning Score", input.earlyWarning),
      decisionModelingScore: score("behavioral_decision_modeling", "Decision Modeling Score", input.decisionModeling),
      motivationScore: score("behavioral_motivation_engine", "Motivation Score", input.motivation),
      collaborationScore: score("behavioral_collaboration_engine", "Collaboration Score", input.collaboration),
      changeAdoptionScore: score("behavioral_change_adoption", "Change Adoption Score", input.changeAdoption),
    };
  }
}

export class BehavioralRecommendationComposer {
  constructor(private createId: (prefix: string) => string) {}
  compose(
    areas: Record<BehavioralArea, BehavioralAreaSuite>,
    analysis: BehavioralAnalysisSuite,
    scenarios: BehavioralScenarioSuite,
    now: Date,
  ): BehavioralRecommendationRecord[] {
    return [...BEHAVIORAL_AREAS]
      .sort((a, b) => areas[a].score - areas[b].score)
      .slice(0, 6)
      .map((area, index) => ({
        id: this.createId("beh-rec"),
        title: `Address ${area.replaceAll("_", " ")} behavioral exposure`,
        priority: priorityFromScore(areas[area].score),
        evidenceRefs: analysis.analyses.slice(0, 2).map(a => a.id).concat(scenarios.scenarios.slice(0, 1).map(s => s.id)),
        confidenceScore: .68,
        owner: index ? "behavioral-owner" : "executive-team",
        dueDate: new Date(now.getTime() + (30 + index * 14) * 86400000).toISOString(),
        rationale: areas[area].narrative,
        action: `Run a behavioral response cycle for ${area.replaceAll("_", " ")}.`,
        lenses: lens(area, areas[area].score),
        narrative: `Prioritize ${area} behavioral response.`,
      }));
  }
}

export function composeRisksOpportunities(
  areas: Record<BehavioralArea, BehavioralAreaSuite>,
  createId: (prefix: string) => string,
): { risks: BehavioralRiskRecord[]; opportunities: BehavioralOpportunityRecord[] } {
  const ordered = [...BEHAVIORAL_AREAS].sort((a, b) => areas[a].score - areas[b].score);
  return {
    risks: ordered.slice(0, 5).map(a => ({
      id: createId("beh-risk"),
      title: `${a.replaceAll("_", " ")} behavioral pressure`,
      area: a,
      severity: priorityFromScore(areas[a].score),
      score: 100 - areas[a].score,
      mitigation: `Strengthen monitoring and adoption playbooks for ${a.replaceAll("_", " ")}.`,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
    opportunities: ordered.slice(-5).reverse().map(a => ({
      id: createId("beh-opp"),
      title: `Capture ${a.replaceAll("_", " ")} behavioral advantage`,
      area: a,
      priority: priorityFromScore(100 - areas[a].score),
      score: areas[a].score,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
  };
}

export function composeHealth(
  scores: ReturnType<BehavioralIntelligence["composeScores"]>,
  baseline: BehavioralBaseline,
  forecasts: BehavioralForecastSuite,
): BehavioralHealthScore {
  const areaScores = Object.fromEntries(BEHAVIORAL_AREAS.map(a => [a, scores.areaScores[a].value])) as Record<BehavioralArea, number>;
  return {
    overallScore: scores.healthScore.value,
    status: scores.healthScore.status,
    outlook: forecasts.outlook,
    areaScores,
    decisionScore: scores.decisionModelingScore.value,
    motivationScore: scores.motivationScore.value,
    collaborationScore: scores.collaborationScore.value,
    adoptionScore: scores.changeAdoptionScore.value,
    forecastScore: scores.forecastScore.value,
    scenarioScore: scores.scenarioScore.value,
    lenses: lens("organization", scores.healthScore.value),
    narrative: scores.healthScore.narrative,
  };
}

export function composeDashboard(
  now: Date,
  health: BehavioralHealthScore,
  baseline: BehavioralBaseline,
  risks: BehavioralRiskRecord[],
  opportunities: BehavioralOpportunityRecord[],
): BehavioralDashboard {
  return {
    generatedAt: now.toISOString(),
    headline: `Executive Behavioral Overview: health ${Math.round(health.overallScore)}  -  ${health.status} (${health.outlook})`,
    overall: health.overallScore,
    areaScores: health.areaScores,
    outlook: health.outlook,
    decisionConfidence: baseline.decisionConfidence,
    motivationAlignment: baseline.motivationAlignment,
    changeResistance: baseline.changeResistance,
    topRisks: risks.map(r => r.title),
    topOpportunities: opportunities.map(o => o.title),
    narrative: health.narrative,
  };
}

export function composeBehavioralHealth(
  scores: ReturnType<BehavioralIntelligence["composeScores"]>,
  baseline: BehavioralBaseline,
  forecasts: BehavioralForecastSuite,
) {
  return composeHealth(scores, baseline, forecasts);
}

export const behavioralLens = lens;
