import { buildLens, clamp, priorityFromScore, statusFromScore } from "@/lib/platform/intelligence/wisdom/models";
import type {
  WisdomArea, WisdomAreaSuite, WisdomBaseline, WisdomDashboard,
  WisdomForecastSuite, WisdomHealthScore, WisdomOpportunityRecord,
  WisdomRecommendationRecord, WisdomRiskRecord, WisdomScenarioSuite,
  WisdomScore, WisdomAnalysisSuite,
} from "@/lib/platform/intelligence/wisdom/types";
import { WISDOM_AREAS } from "@/lib/platform/intelligence/wisdom/types";

export const score = (key: string, label: string, value: number): WisdomScore => {
  const v = clamp(value);
  return { key, label, value: v, status: statusFromScore(v), band: priorityFromScore(v), narrative: `${label} is ${statusFromScore(v)} at ${Math.round(v)}.` };
};

const lens = (area: string, value: number) => buildLens({
  strategicValue: `${area} strategic value scored ${Math.round(value)}.`,
  longTermImpact: `Long-term impact linked to ${area}.`,
  confidenceLevel: `Confidence level relative to ${area} conditions.`,
  evidenceQuality: `Evidence quality reading for ${area}.`,
  tradeOffBalance: `Trade-off balance associated with ${area}.`,
  organizationalAlignment: `Organizational alignment pressure from ${area}.`,
  ethicalIntegrity: `Ethical integrity in ${area}.`,
  wisdomScore: `Timing window for ${area}-linked wisdom intelligence action.`,
});

export class WisdomIntelligence {
  composeScores(input: {
    baseline: WisdomBaseline;
    areas: Record<WisdomArea, WisdomAreaSuite>;
    forecast: number;
    scenario: number;
    analysis: number;
    earlyWarning: number;
    strategicReasoningEngine: number;
    crossDomainSynthesisEngine: number;
    tradeOffEngine: number;
    uncertaintyEngine: number;
    executiveJudgmentEngine: number;
    confidenceEngine: number;
  }) {
    const areaScores = Object.fromEntries(
      WISDOM_AREAS.map(a => [a, score(`wisdom_${a}`, `${a} Wisdom Score`, input.areas[a].score)])
    ) as Record<WisdomArea, WisdomScore>;
    const overall =
      WISDOM_AREAS.reduce((s, a) => s + areaScores[a].value, 0) / WISDOM_AREAS.length * .5 +
      input.baseline.strategicValue * .1 +
      input.baseline.longTermImpact * .1 +
      input.baseline.wisdomScore * .08 +
      input.forecast * .08 +
      input.scenario * .07 +
      input.earlyWarning * .04 +
      input.executiveJudgmentEngine * .03;
    return {
      healthScore: score("wisdom_health", "Wisdom Intelligence Health Score", overall),
      areaScores,
      forecastScore: score("wisdom_forecast", "Forecast Score", input.forecast),
      scenarioScore: score("wisdom_scenario", "Scenario Score", input.scenario),
      analysisScore: score("wisdom_analysis", "Analysis Score", input.analysis),
      earlyWarningScore: score("wisdom_early_warning", "Early Warning Score", input.earlyWarning),
      strategicReasoningEngineScore: score("wisdom_strategic_reasoning_engine", "Strategic Reasoning Engine Score", input.strategicReasoningEngine),
      crossDomainSynthesisEngineScore: score("wisdom_cross_domain_synthesis_engine", "Cross Domain Synthesis Engine Score", input.crossDomainSynthesisEngine),
      tradeOffEngineScore: score("wisdom_trade_off_engine", "Trade Off Engine Score", input.tradeOffEngine),
      uncertaintyEngineScore: score("wisdom_uncertainty_engine", "Uncertainty Engine Score", input.uncertaintyEngine),
      executiveJudgmentEngineScore: score("wisdom_executive_judgment_engine", "Executive Judgment Engine Score", input.executiveJudgmentEngine),
      confidenceEngineScore: score("wisdom_confidence_engine", "Confidence Engine Score", input.confidenceEngine),
    };
  }
}

export class WisdomRecommendationComposer {
  constructor(private createId: (prefix: string) => string) {}
  compose(
    areas: Record<WisdomArea, WisdomAreaSuite>,
    analysis: WisdomAnalysisSuite,
    scenarios: WisdomScenarioSuite,
    now: Date,
  ): WisdomRecommendationRecord[] {
    return [...WISDOM_AREAS]
      .sort((a, b) => areas[a].score - areas[b].score)
      .slice(0, 6)
      .map((area, index) => ({
        id: this.createId("wis-rec"),
        title: `Address ${area.replaceAll("_", " ")} wisdom intelligence exposure`,
        priority: priorityFromScore(areas[area].score),
        evidenceRefs: analysis.analyses.slice(0, 2).map(a => a.id).concat(scenarios.scenarios.slice(0, 1).map(s => s.id)),
        confidenceScore: .68,
        owner: index ? "wisdom-owner" : "executive-team",
        dueDate: new Date(now.getTime() + (30 + index * 14) * 86400000).toISOString(),
        rationale: areas[area].narrative,
        action: `Run a wisdom intelligence response cycle for ${area.replaceAll("_", " ")}.`,
        lenses: lens(area, areas[area].score),
        narrative: `Prioritize ${area} wisdom intelligence response.`,
      }));
  }
}

export function composeRisksOpportunities(
  areas: Record<WisdomArea, WisdomAreaSuite>,
  createId: (prefix: string) => string,
): { risks: WisdomRiskRecord[]; opportunities: WisdomOpportunityRecord[] } {
  const ordered = [...WISDOM_AREAS].sort((a, b) => areas[a].score - areas[b].score);
  return {
    risks: ordered.slice(0, 5).map(a => ({
      id: createId("wis-risk"),
      title: `${a.replaceAll("_", " ")} wisdom intelligence pressure`,
      area: a,
      severity: priorityFromScore(areas[a].score),
      score: 100 - areas[a].score,
      mitigation: `Strengthen monitoring and wisdom playbooks for ${a.replaceAll("_", " ")}.`,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
    opportunities: ordered.slice(-5).reverse().map(a => ({
      id: createId("wis-opp"),
      title: `Capture ${a.replaceAll("_", " ")} wisdom intelligence advantage`,
      area: a,
      priority: priorityFromScore(100 - areas[a].score),
      score: areas[a].score,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
  };
}

export function composeHealth(
  scores: ReturnType<WisdomIntelligence["composeScores"]>,
  baseline: WisdomBaseline,
  forecasts: WisdomForecastSuite,
): WisdomHealthScore {
  const areaScores = Object.fromEntries(WISDOM_AREAS.map(a => [a, scores.areaScores[a].value])) as Record<WisdomArea, number>;
  return {
    overallScore: scores.healthScore.value,
    status: scores.healthScore.status,
    outlook: forecasts.outlook,
    areaScores,
    executiveJudgmentScore: scores.executiveJudgmentEngineScore.value,
    strategicReasoningScore: scores.strategicReasoningEngineScore.value,
    crossDomainSynthesisScore: scores.crossDomainSynthesisEngineScore.value,
    forecastScore: scores.forecastScore.value,
    scenarioScore: scores.scenarioScore.value,
    lenses: lens("organization", scores.healthScore.value),
    narrative: scores.healthScore.narrative,
  };
}

export function composeDashboard(
  now: Date,
  health: WisdomHealthScore,
  baseline: WisdomBaseline,
  risks: WisdomRiskRecord[],
  opportunities: WisdomOpportunityRecord[],
): WisdomDashboard {
  return {
    generatedAt: now.toISOString(),
    headline: `Executive Wisdom Overview: health ${Math.round(health.overallScore)} - ${health.status} (${health.outlook})`,
    overall: health.overallScore,
    areaScores: health.areaScores,
    outlook: health.outlook,
    strategicValue: baseline.strategicValue,
    longTermImpact: baseline.longTermImpact,
    wisdomScore: baseline.wisdomScore,
    topRisks: risks.map(r => r.title),
    topOpportunities: opportunities.map(o => o.title),
    narrative: health.narrative,
  };
}

export const wisdomLens = lens;
