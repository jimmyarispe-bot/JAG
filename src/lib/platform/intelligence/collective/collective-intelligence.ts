import { buildLens, clamp, priorityFromScore, statusFromScore } from "@/lib/platform/intelligence/collective/models";
import type {
  CollectiveArea, CollectiveAreaSuite, CollectiveBaseline, CollectiveDashboard,
  CollectiveForecastSuite, CollectiveHealthScore, CollectiveOpportunityRecord,
  CollectiveRecommendationRecord, CollectiveRiskRecord, CollectiveScenarioSuite,
  CollectiveScore, CollectiveAnalysisSuite,
} from "@/lib/platform/intelligence/collective/types";
import { COLLECTIVE_AREAS } from "@/lib/platform/intelligence/collective/types";

export const score = (key: string, label: string, value: number): CollectiveScore => {
  const v = clamp(value);
  return { key, label, value: v, status: statusFromScore(v), band: priorityFromScore(v), narrative: `${label} is ${statusFromScore(v)} at ${Math.round(v)}.` };
};

const lens = (area: string, value: number) => buildLens({
  consensusStrength: `${area} consensus strength scored ${Math.round(value)}.`,
  expertiseCoverage: `Expertise coverage linked to ${area}.`,
  perspectiveDiversity: `Perspective diversity relative to ${area} conditions.`,
  crossDomainAgreement: `Cross-domain agreement reading for ${area}.`,
  organizationalAlignment: `Organizational alignment associated with ${area}.`,
  collaborationQuality: `Collaboration quality pressure from ${area}.`,
  collectiveConfidence: `Collective confidence in ${area}.`,
  longTermCollectiveValue: `Timing window for ${area}-linked collective intelligence action.`,
});

export class CollectiveIntelligence {
  composeScores(input: {
    baseline: CollectiveBaseline;
    areas: Record<CollectiveArea, CollectiveAreaSuite>;
    forecast: number;
    scenario: number;
    analysis: number;
    earlyWarning: number;
    consensusEngine: number;
    distributedExpertiseEngine: number;
    crossDomainSynthesis: number;
    collaborationEngine: number;
    conflictResolutionEngine: number;
  }) {
    const areaScores = Object.fromEntries(
      COLLECTIVE_AREAS.map(a => [a, score(`collective_${a}`, `${a} Collective Score`, input.areas[a].score)])
    ) as Record<CollectiveArea, CollectiveScore>;
    const overall =
      COLLECTIVE_AREAS.reduce((s, a) => s + areaScores[a].value, 0) / COLLECTIVE_AREAS.length * .5 +
      input.baseline.consensusStrength * .1 +
      input.baseline.collaborationQuality * .1 +
      input.baseline.collectiveConfidence * .08 +
      input.forecast * .08 +
      input.scenario * .07 +
      input.earlyWarning * .04 +
      input.consensusEngine * .03;
    return {
      healthScore: score("collective_health", "Collective Intelligence Health Score", overall),
      areaScores,
      forecastScore: score("collective_forecast", "Forecast Score", input.forecast),
      scenarioScore: score("collective_scenario", "Scenario Score", input.scenario),
      analysisScore: score("collective_analysis", "Analysis Score", input.analysis),
      earlyWarningScore: score("collective_early_warning", "Early Warning Score", input.earlyWarning),
      consensusEngineScore: score("collective_consensus_engine", "Consensus Engine Score", input.consensusEngine),
      distributedExpertiseEngineScore: score("collective_distributed_expertise_engine", "Distributed Expertise Engine Score", input.distributedExpertiseEngine),
      crossDomainSynthesisScore: score("collective_cross_domain_synthesis", "Cross Domain Synthesis Score", input.crossDomainSynthesis),
      collaborationEngineScore: score("collective_collaboration_engine", "Collaboration Engine Score", input.collaborationEngine),
      conflictResolutionEngineScore: score("collective_conflict_resolution_engine", "Conflict Resolution Engine Score", input.conflictResolutionEngine),
    };
  }
}

export class CollectiveRecommendationComposer {
  constructor(private createId: (prefix: string) => string) {}
  compose(
    areas: Record<CollectiveArea, CollectiveAreaSuite>,
    analysis: CollectiveAnalysisSuite,
    scenarios: CollectiveScenarioSuite,
    now: Date,
  ): CollectiveRecommendationRecord[] {
    return [...COLLECTIVE_AREAS]
      .sort((a, b) => areas[a].score - areas[b].score)
      .slice(0, 6)
      .map((area, index) => ({
        id: this.createId("col-rec"),
        title: `Address ${area.replaceAll("_", " ")} collective intelligence exposure`,
        priority: priorityFromScore(areas[area].score),
        evidenceRefs: analysis.analyses.slice(0, 2).map(a => a.id).concat(scenarios.scenarios.slice(0, 1).map(s => s.id)),
        confidenceScore: .68,
        owner: index ? "collective-owner" : "executive-team",
        dueDate: new Date(now.getTime() + (30 + index * 14) * 86400000).toISOString(),
        rationale: areas[area].narrative,
        action: `Run a collective intelligence response cycle for ${area.replaceAll("_", " ")}.`,
        lenses: lens(area, areas[area].score),
        narrative: `Prioritize ${area} collective intelligence response.`,
      }));
  }
}

export function composeRisksOpportunities(
  areas: Record<CollectiveArea, CollectiveAreaSuite>,
  createId: (prefix: string) => string,
): { risks: CollectiveRiskRecord[]; opportunities: CollectiveOpportunityRecord[] } {
  const ordered = [...COLLECTIVE_AREAS].sort((a, b) => areas[a].score - areas[b].score);
  return {
    risks: ordered.slice(0, 5).map(a => ({
      id: createId("col-risk"),
      title: `${a.replaceAll("_", " ")} collective intelligence pressure`,
      area: a,
      severity: priorityFromScore(areas[a].score),
      score: 100 - areas[a].score,
      mitigation: `Strengthen monitoring and collective playbooks for ${a.replaceAll("_", " ")}.`,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
    opportunities: ordered.slice(-5).reverse().map(a => ({
      id: createId("col-opp"),
      title: `Capture ${a.replaceAll("_", " ")} collective intelligence advantage`,
      area: a,
      priority: priorityFromScore(100 - areas[a].score),
      score: areas[a].score,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
  };
}

export function composeHealth(
  scores: ReturnType<CollectiveIntelligence["composeScores"]>,
  baseline: CollectiveBaseline,
  forecasts: CollectiveForecastSuite,
): CollectiveHealthScore {
  const areaScores = Object.fromEntries(COLLECTIVE_AREAS.map(a => [a, scores.areaScores[a].value])) as Record<CollectiveArea, number>;
  return {
    overallScore: scores.healthScore.value,
    status: scores.healthScore.status,
    outlook: forecasts.outlook,
    areaScores,
    consensusEngineScore: scores.consensusEngineScore.value,
    collaborationEngineScore: scores.collaborationEngineScore.value,
    crossDomainSynthesisScore: scores.crossDomainSynthesisScore.value,
    forecastScore: scores.forecastScore.value,
    scenarioScore: scores.scenarioScore.value,
    lenses: lens("organization", scores.healthScore.value),
    narrative: scores.healthScore.narrative,
  };
}

export function composeDashboard(
  now: Date,
  health: CollectiveHealthScore,
  baseline: CollectiveBaseline,
  risks: CollectiveRiskRecord[],
  opportunities: CollectiveOpportunityRecord[],
): CollectiveDashboard {
  return {
    generatedAt: now.toISOString(),
    headline: `Executive Collective Overview: health ${Math.round(health.overallScore)} - ${health.status} (${health.outlook})`,
    overall: health.overallScore,
    areaScores: health.areaScores,
    outlook: health.outlook,
    consensusStrength: baseline.consensusStrength,
    collaborationQuality: baseline.collaborationQuality,
    collectiveConfidence: baseline.collectiveConfidence,
    topRisks: risks.map(r => r.title),
    topOpportunities: opportunities.map(o => o.title),
    narrative: health.narrative,
  };
}

export const collectiveLens = lens;
