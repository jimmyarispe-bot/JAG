import { buildLens, clamp, priorityFromScore, statusFromScore } from "@/lib/platform/intelligence/institutional-memory/models";
import type {
  InstitutionalMemoryArea, InstitutionalMemoryAreaSuite, InstitutionalMemoryBaseline, InstitutionalMemoryDashboard,
  InstitutionalMemoryForecastSuite, InstitutionalMemoryHealthScore, InstitutionalMemoryOpportunityRecord,
  InstitutionalMemoryRecommendationRecord, InstitutionalMemoryRiskRecord, InstitutionalMemoryScenarioSuite,
  InstitutionalMemoryScore, InstitutionalMemoryAnalysisSuite,
} from "@/lib/platform/intelligence/institutional-memory/types";
import { INSTITUTIONAL_MEMORY_AREAS } from "@/lib/platform/intelligence/institutional-memory/types";

export const score = (key: string, label: string, value: number): InstitutionalMemoryScore => {
  const v = clamp(value);
  return { key, label, value: v, status: statusFromScore(v), band: priorityFromScore(v), narrative: `${label} is ${statusFromScore(v)} at ${Math.round(v)}.` };
};

const lens = (area: string, value: number) => buildLens({
  knowledgeConfidence: `${area} knowledge confidence scored ${Math.round(value)}.`,
  evidenceStrength: `Evidence strength linked to ${area}.`,
  institutionalMemoryCoverage: `Institutional memory coverage around ${area}.`,
  knowledgeFreshness: `Knowledge freshness relative to ${area} conditions.`,
  expertiseAvailability: `Expertise availability reading for ${area}.`,
  knowledgeGaps: `Knowledge gaps implications of ${area}.`,
  knowledgeQuality: `Knowledge quality pressure from ${area}.`,
  longTermLearningValue: `Timing window for ${area}-linked institutional memory action.`,
});

export class InstitutionalMemoryIntelligence {
  composeScores(input: {
    baseline: InstitutionalMemoryBaseline;
    areas: Record<InstitutionalMemoryArea, InstitutionalMemoryAreaSuite>;
    forecast: number;
    scenario: number;
    analysis: number;
    earlyWarning: number;
    knowledgeGraph: number;
    semanticSearch: number;
    expertise: number;
    knowledgeValidation: number;
    knowledgeEvolution: number;
  }) {
    const areaScores = Object.fromEntries(
      INSTITUTIONAL_MEMORY_AREAS.map(a => [a, score(`institutional_memory_${a}`, `${a} Institutional Memory Score`, input.areas[a].score)])
    ) as Record<InstitutionalMemoryArea, InstitutionalMemoryScore>;
    const overall =
      INSTITUTIONAL_MEMORY_AREAS.reduce((s, a) => s + areaScores[a].value, 0) / INSTITUTIONAL_MEMORY_AREAS.length * .5 +
      input.baseline.knowledgeConfidence * .1 +
      input.baseline.institutionalMemoryCoverage * .1 +
      input.baseline.knowledgeQuality * .08 +
      input.forecast * .08 +
      input.scenario * .07 +
      input.earlyWarning * .04 +
      input.knowledgeGraph * .03;
    return {
      healthScore: score("institutional_memory_health", "Institutional Memory Health Score", overall),
      areaScores,
      forecastScore: score("institutional_memory_forecast", "Forecast Score", input.forecast),
      scenarioScore: score("institutional_memory_scenario", "Scenario Score", input.scenario),
      analysisScore: score("institutional_memory_analysis", "Analysis Score", input.analysis),
      earlyWarningScore: score("institutional_memory_early_warning", "Early Warning Score", input.earlyWarning),
      knowledgeGraphEngineScore: score("institutional_memory_knowledge_graph", "Knowledge Graph Score", input.knowledgeGraph),
      semanticSearchEngineScore: score("institutional_memory_semantic_search", "Semantic Search Score", input.semanticSearch),
      expertiseScore: score("institutional_memory_expertise", "Expertise Score", input.expertise),
      knowledgeValidationEngineScore: score("institutional_memory_validation", "Knowledge Validation Score", input.knowledgeValidation),
      knowledgeEvolutionEngineScore: score("institutional_memory_evolution", "Knowledge Evolution Score", input.knowledgeEvolution),
    };
  }
}

export class InstitutionalMemoryRecommendationComposer {
  constructor(private createId: (prefix: string) => string) {}
  compose(
    areas: Record<InstitutionalMemoryArea, InstitutionalMemoryAreaSuite>,
    analysis: InstitutionalMemoryAnalysisSuite,
    scenarios: InstitutionalMemoryScenarioSuite,
    now: Date,
  ): InstitutionalMemoryRecommendationRecord[] {
    return [...INSTITUTIONAL_MEMORY_AREAS]
      .sort((a, b) => areas[a].score - areas[b].score)
      .slice(0, 6)
      .map((area, index) => ({
        id: this.createId("imm-rec"),
        title: `Address ${area.replaceAll("_", " ")} institutional memory exposure`,
        priority: priorityFromScore(areas[area].score),
        evidenceRefs: analysis.analyses.slice(0, 2).map(a => a.id).concat(scenarios.scenarios.slice(0, 1).map(s => s.id)),
        confidenceScore: .68,
        owner: index ? "knowledge-owner" : "executive-team",
        dueDate: new Date(now.getTime() + (30 + index * 14) * 86400000).toISOString(),
        rationale: areas[area].narrative,
        action: `Run an institutional memory response cycle for ${area.replaceAll("_", " ")}.`,
        lenses: lens(area, areas[area].score),
        narrative: `Prioritize ${area} institutional memory response.`,
      }));
  }
}

export function composeRisksOpportunities(
  areas: Record<InstitutionalMemoryArea, InstitutionalMemoryAreaSuite>,
  createId: (prefix: string) => string,
): { risks: InstitutionalMemoryRiskRecord[]; opportunities: InstitutionalMemoryOpportunityRecord[] } {
  const ordered = [...INSTITUTIONAL_MEMORY_AREAS].sort((a, b) => areas[a].score - areas[b].score);
  return {
    risks: ordered.slice(0, 5).map(a => ({
      id: createId("imm-risk"),
      title: `${a.replaceAll("_", " ")} institutional memory pressure`,
      area: a,
      severity: priorityFromScore(areas[a].score),
      score: 100 - areas[a].score,
      mitigation: `Strengthen monitoring and institutional memory playbooks for ${a.replaceAll("_", " ")}.`,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
    opportunities: ordered.slice(-5).reverse().map(a => ({
      id: createId("imm-opp"),
      title: `Capture ${a.replaceAll("_", " ")} institutional memory advantage`,
      area: a,
      priority: priorityFromScore(100 - areas[a].score),
      score: areas[a].score,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
  };
}

export function composeHealth(
  scores: ReturnType<InstitutionalMemoryIntelligence["composeScores"]>,
  baseline: InstitutionalMemoryBaseline,
  forecasts: InstitutionalMemoryForecastSuite,
): InstitutionalMemoryHealthScore {
  const areaScores = Object.fromEntries(INSTITUTIONAL_MEMORY_AREAS.map(a => [a, scores.areaScores[a].value])) as Record<InstitutionalMemoryArea, number>;
  return {
    overallScore: scores.healthScore.value,
    status: scores.healthScore.status,
    outlook: forecasts.outlook,
    areaScores,
    knowledgeGraphScore: scores.knowledgeGraphEngineScore.value,
    expertiseScore: scores.expertiseScore.value,
    validationScore: scores.knowledgeValidationEngineScore.value,
    evolutionScore: scores.knowledgeEvolutionEngineScore.value,
    forecastScore: scores.forecastScore.value,
    scenarioScore: scores.scenarioScore.value,
    lenses: lens("organization", scores.healthScore.value),
    narrative: scores.healthScore.narrative,
  };
}

export function composeDashboard(
  now: Date,
  health: InstitutionalMemoryHealthScore,
  baseline: InstitutionalMemoryBaseline,
  risks: InstitutionalMemoryRiskRecord[],
  opportunities: InstitutionalMemoryOpportunityRecord[],
): InstitutionalMemoryDashboard {
  return {
    generatedAt: now.toISOString(),
    headline: `Executive Knowledge Overview: health ${Math.round(health.overallScore)}  -  ${health.status} (${health.outlook})`,
    overall: health.overallScore,
    areaScores: health.areaScores,
    outlook: health.outlook,
    knowledgeConfidence: baseline.knowledgeConfidence,
    evidenceStrength: baseline.evidenceStrength,
    institutionalMemoryCoverage: baseline.institutionalMemoryCoverage,
    topRisks: risks.map(r => r.title),
    topOpportunities: opportunities.map(o => o.title),
    narrative: health.narrative,
  };
}

export function composeInstitutionalMemoryHealth(
  scores: ReturnType<InstitutionalMemoryIntelligence["composeScores"]>,
  baseline: InstitutionalMemoryBaseline,
  forecasts: InstitutionalMemoryForecastSuite,
) {
  return composeHealth(scores, baseline, forecasts);
}

export const institutionalMemoryLens = lens;
