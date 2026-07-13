/**
 * Part 3: composers, engine, service, index, docs for Institutional Memory Intelligence.
 */
import fs from "node:fs";
import path from "node:path";

const DEST = path.resolve("src/lib/platform/intelligence/institutional-memory");
const w = (name, content) => fs.writeFileSync(path.join(DEST, name), content, "utf8");
const PKG = "@/lib/platform/intelligence/institutional-memory";

const AREAS = [
  ["organizational_memory", "OrganizationalMemoryIntelligence"],
  ["knowledge_graph", "KnowledgeGraphIntelligence"],
  ["knowledge_mapping", "KnowledgeMappingIntelligence"],
  ["expertise_intelligence", "ExpertiseIntelligence"],
  ["institutional_memory", "InstitutionalMemoryAreaIntelligence"],
  ["lessons_learned", "LessonsLearnedIntelligence"],
  ["decision_history", "DecisionHistoryIntelligence"],
  ["policy_knowledge", "PolicyKnowledgeIntelligence"],
  ["process_knowledge", "ProcessKnowledgeIntelligence"],
  ["relationship_knowledge", "RelationshipKnowledgeIntelligence"],
  ["semantic_search", "SemanticSearchIntelligence"],
  ["knowledge_validation", "KnowledgeValidationIntelligence"],
  ["knowledge_evolution", "KnowledgeEvolutionIntelligence"],
  ["knowledge_gap_detection", "KnowledgeGapDetectionIntelligence"],
  ["knowledge_transfer", "KnowledgeTransferIntelligence"],
  ["knowledge_quality", "KnowledgeQualityIntelligence"],
  ["knowledge_synthesis", "KnowledgeSynthesisIntelligence"],
];
const AREA_KEYS = AREAS.map(([a]) => a);
const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const areaFile = (area) =>
  area === "institutional_memory" ? "institutional-memory-area-intelligence" : area.replaceAll("_", "-") + "-intelligence";

w("institutional-memory-intelligence.ts", `import { buildLens, clamp, priorityFromScore, statusFromScore } from "${PKG}/models";
import type {
  InstitutionalMemoryArea, InstitutionalMemoryAreaSuite, InstitutionalMemoryBaseline, InstitutionalMemoryDashboard,
  InstitutionalMemoryForecastSuite, InstitutionalMemoryHealthScore, InstitutionalMemoryOpportunityRecord,
  InstitutionalMemoryRecommendationRecord, InstitutionalMemoryRiskRecord, InstitutionalMemoryScenarioSuite,
  InstitutionalMemoryScore, InstitutionalMemoryAnalysisSuite,
} from "${PKG}/types";
import { INSTITUTIONAL_MEMORY_AREAS } from "${PKG}/types";

export const score = (key: string, label: string, value: number): InstitutionalMemoryScore => {
  const v = clamp(value);
  return { key, label, value: v, status: statusFromScore(v), band: priorityFromScore(v), narrative: \`\${label} is \${statusFromScore(v)} at \${Math.round(v)}.\` };
};

const lens = (area: string, value: number) => buildLens({
  knowledgeConfidence: \`\${area} knowledge confidence scored \${Math.round(value)}.\`,
  evidenceStrength: \`Evidence strength linked to \${area}.\`,
  institutionalMemoryCoverage: \`Institutional memory coverage around \${area}.\`,
  knowledgeFreshness: \`Knowledge freshness relative to \${area} conditions.\`,
  expertiseAvailability: \`Expertise availability reading for \${area}.\`,
  knowledgeGaps: \`Knowledge gaps implications of \${area}.\`,
  knowledgeQuality: \`Knowledge quality pressure from \${area}.\`,
  longTermLearningValue: \`Timing window for \${area}-linked institutional memory action.\`,
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
      INSTITUTIONAL_MEMORY_AREAS.map(a => [a, score(\`institutional_memory_\${a}\`, \`\${a} Institutional Memory Score\`, input.areas[a].score)])
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
      knowledgeGraphScore: score("institutional_memory_knowledge_graph", "Knowledge Graph Score", input.knowledgeGraph),
      semanticSearchScore: score("institutional_memory_semantic_search", "Semantic Search Score", input.semanticSearch),
      expertiseScore: score("institutional_memory_expertise", "Expertise Score", input.expertise),
      knowledgeValidationScore: score("institutional_memory_validation", "Knowledge Validation Score", input.knowledgeValidation),
      knowledgeEvolutionScore: score("institutional_memory_evolution", "Knowledge Evolution Score", input.knowledgeEvolution),
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
        title: \`Address \${area.replaceAll("_", " ")} institutional memory exposure\`,
        priority: priorityFromScore(areas[area].score),
        evidenceRefs: analysis.analyses.slice(0, 2).map(a => a.id).concat(scenarios.scenarios.slice(0, 1).map(s => s.id)),
        confidenceScore: .68,
        owner: index ? "knowledge-owner" : "executive-team",
        dueDate: new Date(now.getTime() + (30 + index * 14) * 86400000).toISOString(),
        rationale: areas[area].narrative,
        action: \`Run an institutional memory response cycle for \${area.replaceAll("_", " ")}.\`,
        lenses: lens(area, areas[area].score),
        narrative: \`Prioritize \${area} institutional memory response.\`,
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
      title: \`\${a.replaceAll("_", " ")} institutional memory pressure\`,
      area: a,
      severity: priorityFromScore(areas[a].score),
      score: 100 - areas[a].score,
      mitigation: \`Strengthen monitoring and institutional memory playbooks for \${a.replaceAll("_", " ")}.\`,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
    opportunities: ordered.slice(-5).reverse().map(a => ({
      id: createId("imm-opp"),
      title: \`Capture \${a.replaceAll("_", " ")} institutional memory advantage\`,
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
    knowledgeGraphScore: scores.knowledgeGraphScore.value,
    expertiseScore: scores.expertiseScore.value,
    validationScore: scores.knowledgeValidationScore.value,
    evolutionScore: scores.knowledgeEvolutionScore.value,
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
    headline: \`Executive Knowledge Overview: health \${Math.round(health.overallScore)}  -  \${health.status} (\${health.outlook})\`,
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
`);

const areaImports = AREAS.map(([area, cls]) =>
  `import { ${cls} } from "${PKG}/${areaFile(area)}";`
).join("\n");
const areaInit = AREAS.map(([area, cls]) => `      ${area}: new ${cls}(),`).join("\n");
const areaScoreAssign = AREA_KEYS.map(a =>
  `      ${snakeToCamel(a)}Score: scores.areaScores.${a},`
).join("\n");

w("institutional-memory-engine.ts", `import type { InstitutionalMemoryDependencies, InstitutionalMemoryEngine as Contract } from "${PKG}/contracts";
import { defaultCreateId, defaultPeriodLabel, deriveInstitutionalMemoryBaseline, emptyInstitutionalMemoryScope, buildConfidence } from "${PKG}/models";
import { INSTITUTIONAL_MEMORY_AREAS, INSTITUTIONAL_MEMORY_INTELLIGENCE_VERSION, type InstitutionalMemoryArea, type InstitutionalMemoryAreaSuite, type InstitutionalMemoryRequest, type InstitutionalMemoryResult } from "${PKG}/types";
${areaImports}
import { InstitutionalMemoryForecastEngine } from "${PKG}/institutional-memory-forecast-engine";
import { InstitutionalMemoryScenarioEngine } from "${PKG}/institutional-memory-scenario-engine";
import { InstitutionalMemoryTrendEngine } from "${PKG}/institutional-memory-trend-engine";
import { InstitutionalMemoryAnalysisEngine } from "${PKG}/institutional-memory-analysis-engine";
import { KnowledgeGraphEngine } from "${PKG}/knowledge-graph-engine";
import { SemanticSearchEngine } from "${PKG}/semantic-search-engine";
import { ExpertiseEngine } from "${PKG}/expertise-engine";
import { KnowledgeValidationEngine } from "${PKG}/knowledge-validation-engine";
import { KnowledgeEvolutionEngine } from "${PKG}/knowledge-evolution-engine";
import { EarlyWarningEngine } from "${PKG}/early-warning-engine";
import { InstitutionalMemoryKnowledgeContributionEngine } from "${PKG}/knowledge-contribution";
import { ClosedLearningLoop } from "${PKG}/closed-learning-loop";
import { InstitutionalMemoryReasoner } from "${PKG}/institutional-memory-reasoner";
import {
  InstitutionalMemoryIntelligence, InstitutionalMemoryRecommendationComposer, composeDashboard, composeHealth,
  composeRisksOpportunities, institutionalMemoryLens,
} from "${PKG}/institutional-memory-intelligence";
import { InstitutionalMemoryProjection } from "${PKG}/projection";
import { InstitutionalMemoryRepositoryStore } from "${PKG}/repository";
import { InstitutionalMemoryRegistryStore } from "${PKG}/institutional-memory-registry";
import { InstitutionalMemoryQueries } from "${PKG}/projection";

export class InstitutionalMemoryIntelligenceEngineImpl implements Contract {
  readonly repository; readonly registry; readonly queries;
  private now; private createId; private areas; private forecasts; private scenarios; private trends; private analysis;
  private knowledgeGraph; private semanticSearch; private expertise; private knowledgeValidation; private knowledgeEvolution; private earlyWarning; private reasoner;

  constructor(d: InstitutionalMemoryDependencies = {}) {
    this.now = d.now ?? (() => new Date());
    this.createId = d.createId ?? defaultCreateId;
    this.repository = d.repository ?? new InstitutionalMemoryRepositoryStore();
    this.registry = d.registry ?? new InstitutionalMemoryRegistryStore();
    this.queries = new InstitutionalMemoryQueries();
    this.areas = {
${areaInit}
      ...d.areaIntelligence,
    };
    this.forecasts = d.forecastEngine ?? new InstitutionalMemoryForecastEngine();
    this.scenarios = d.scenarioEngine ?? new InstitutionalMemoryScenarioEngine();
    this.trends = d.trendEngine ?? new InstitutionalMemoryTrendEngine();
    this.analysis = d.analysisEngine ?? new InstitutionalMemoryAnalysisEngine();
    this.knowledgeGraph = d.knowledgeGraphEngine ?? new KnowledgeGraphEngine();
    this.semanticSearch = d.semanticSearchEngine ?? new SemanticSearchEngine();
    this.expertise = d.expertiseEngine ?? new ExpertiseEngine();
    this.knowledgeValidation = d.knowledgeValidationEngine ?? new KnowledgeValidationEngine();
    this.knowledgeEvolution = d.knowledgeEvolutionEngine ?? new KnowledgeEvolutionEngine();
    this.earlyWarning = d.earlyWarningEngine ?? new EarlyWarningEngine();
    this.reasoner = d.reasoner ?? new InstitutionalMemoryReasoner();
  }

  build(request: InstitutionalMemoryRequest): InstitutionalMemoryResult {
    const now = this.now();
    const baseline = deriveInstitutionalMemoryBaseline(request);
    const createId = this.createId;
    const scope = request.scope ?? emptyInstitutionalMemoryScope();
    const areaSuites = Object.fromEntries(
      INSTITUTIONAL_MEMORY_AREAS.map(area => [area, this.areas[area]!.assess({ baseline, now, createId })])
    ) as Record<InstitutionalMemoryArea, InstitutionalMemoryAreaSuite>;

    const trendSuite = this.trends.assess({ baseline, areas: areaSuites, now, createId });
    const forecastSuite = this.forecasts.assess({ baseline, areas: areaSuites, now, createId });
    const scenarioSuite = this.scenarios.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, now, createId });
    const analysisSuite = this.analysis.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const knowledgeGraphSuite = this.knowledgeGraph.assess({ baseline, areas: areaSuites, now, createId });
    const semanticSearchSuite = this.semanticSearch.assess({ baseline, areas: areaSuites, now, createId });
    const expertiseSuite = this.expertise.assess({ baseline, areas: areaSuites, now, createId });
    const knowledgeValidationSuite = this.knowledgeValidation.assess({ baseline, areas: areaSuites, now, createId });
    const knowledgeEvolutionSuite = this.knowledgeEvolution.assess({ baseline, areas: areaSuites, now, createId });
    const earlyWarningSuite = this.earlyWarning.assess({ baseline, trends: trendSuite, scenarios: scenarioSuite, now, createId });
    const knowledgeContribution = new InstitutionalMemoryKnowledgeContributionEngine().contribute({ forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const confidence = buildConfidence([
      { key: "evidence", label: "Evidence coverage", contribution: baseline.evidenceCoverage / 100 },
      { key: "forecast", label: "Forecast maturity", contribution: forecastSuite.maturityScore / 100 },
      { key: "scenario", label: "Scenario maturity", contribution: baseline.scenarioMaturity / 100 },
    ]);
    const reasoning = this.reasoner.reason({ request, trends: trendSuite, forecasts: forecastSuite, scenarios: scenarioSuite, confidence });
    const intelligence = new InstitutionalMemoryIntelligence();
    const scores = intelligence.composeScores({
      baseline,
      areas: areaSuites,
      forecast: forecastSuite.maturityScore,
      scenario: baseline.scenarioMaturity,
      analysis: analysisSuite.maturityScore,
      earlyWarning: earlyWarningSuite.score,
      knowledgeGraph: knowledgeGraphSuite.score,
      semanticSearch: semanticSearchSuite.score,
      expertise: expertiseSuite.score,
      knowledgeValidation: knowledgeValidationSuite.score,
      knowledgeEvolution: knowledgeEvolutionSuite.score,
    });
    const { risks, opportunities } = composeRisksOpportunities(areaSuites, createId);
    const recommendations = new InstitutionalMemoryRecommendationComposer(createId).compose(areaSuites, analysisSuite, scenarioSuite, now);
    const health = composeHealth(scores, baseline, forecastSuite);
    const dashboard = composeDashboard(now, health, baseline, risks, opportunities);
    const commonLens = institutionalMemoryLens("organization", health.overallScore);

    const knowledgeGraphDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Knowledge graph index \${Math.round(knowledgeGraphSuite.graphIndex)}\`,
      score: knowledgeGraphSuite.score,
      graphIndex: knowledgeGraphSuite.graphIndex,
      signals: knowledgeGraphSuite.records.slice(0, 4).map(r => r.title),
      narrative: knowledgeGraphSuite.narrative,
    };
    const organizationalMemoryDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Organizational memory \${Math.round(areaSuites.organizational_memory.score)}\`,
      score: areaSuites.organizational_memory.score,
      memoryIndex: areaSuites.organizational_memory.score,
      signals: areaSuites.organizational_memory.records.map(r => r.signal),
      narrative: areaSuites.organizational_memory.narrative,
    };
    const expertiseMapDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Expertise map index \${Math.round(expertiseSuite.expertiseIndex)}\`,
      score: expertiseSuite.score,
      expertiseIndex: expertiseSuite.expertiseIndex,
      signals: expertiseSuite.records.map(r => r.narrative),
      narrative: expertiseSuite.narrative,
    };
    const lessonsLearnedDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Lessons learned \${Math.round(areaSuites.lessons_learned.score)}\`,
      score: areaSuites.lessons_learned.score,
      lessonsIndex: areaSuites.lessons_learned.score,
      signals: areaSuites.lessons_learned.records.map(r => r.signal),
      narrative: areaSuites.lessons_learned.narrative,
    };
    const knowledgeQualityDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Knowledge quality \${Math.round(areaSuites.knowledge_quality.score)}\`,
      score: areaSuites.knowledge_quality.score,
      qualityIndex: areaSuites.knowledge_quality.score,
      signals: areaSuites.knowledge_quality.records.map(r => r.signal),
      narrative: areaSuites.knowledge_quality.narrative,
    };
    const knowledgeGapsDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Knowledge gaps \${Math.round(baseline.knowledgeGaps)}\`,
      score: baseline.knowledgeGaps,
      gapsIndex: baseline.knowledgeGaps,
      signals: areaSuites.knowledge_gap_detection.records.map(r => r.signal),
      narrative: \`Knowledge gaps index \${Math.round(baseline.knowledgeGaps)}; gap detection \${Math.round(areaSuites.knowledge_gap_detection.score)}.\`,
    };
    const forecastDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Institutional Memory Forecast: \${forecastSuite.outlook}\`,
      score: forecastSuite.maturityScore,
      outlook: forecastSuite.outlook,
      signals: forecastSuite.forecasts.slice(0, 4).map(f => f.narrative),
      narrative: forecastSuite.narrative,
    };
    const brief = {
      generatedAt: now.toISOString(),
      headline: dashboard.headline,
      summary: \`\${forecastSuite.narrative} \${scenarioSuite.narrative}\`,
      healthScore: health.overallScore,
      outlook: forecastSuite.outlook,
      topRecommendations: recommendations.map(r => r.title),
      topRisks: risks.map(r => r.title),
      lenses: commonLens,
      narrative: dashboard.narrative,
    };
    const boardReport = {
      generatedAt: now.toISOString(),
      headline: \`Board Report: \${dashboard.headline}\`,
      assuranceSummary: \`Evidence coverage \${Math.round(baseline.evidenceCoverage)}; primary scenario \${scenarioSuite.primaryScenario.replaceAll("_", " ")}.\`,
      healthScore: health.overallScore,
      outlook: forecastSuite.outlook,
      knowledgeGraphScore: knowledgeGraphSuite.score,
      expertiseScore: expertiseSuite.score,
      knowledgeQualityScore: areaSuites.knowledge_quality.score,
      recommendations: recommendations.map(r => r.title),
      lenses: commonLens,
      narrative: "Board assurance on institutional memory coverage, expertise availability, knowledge quality, and long-term learning value.",
    };
    const closedLearningLoop = new ClosedLearningLoop().contribute({ trends: trendSuite, scenarios: scenarioSuite, recommendations, now, createId });
    const projection = new InstitutionalMemoryProjection().project({
      generatedAt: now.toISOString(),
      headline: brief.headline,
      healthScore: health.overallScore,
      areaScores: health.areaScores,
      outlook: forecastSuite.outlook,
      dashboard,
      brief,
      overallConfidence: confidence,
    });
    const historyRecord = {
      id: createId("imm-history"),
      requestId: request.requestId,
      scope,
      status: "assessed" as const,
      healthScore: health.overallScore,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: InstitutionalMemoryResult = {
      requestId: request.requestId,
      version: INSTITUTIONAL_MEMORY_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? defaultPeriodLabel(now),
      scope,
      baseline,
      healthScore: scores.healthScore,
${areaScoreAssign}
      forecastScore: scores.forecastScore,
      scenarioScore: scores.scenarioScore,
      analysisScore: scores.analysisScore,
      earlyWarningScore: scores.earlyWarningScore,
      knowledgeGraphScore: scores.knowledgeGraphScore,
      semanticSearchScore: scores.semanticSearchScore,
      expertiseScore: scores.expertiseScore,
      knowledgeValidationScore: scores.knowledgeValidationScore,
      knowledgeEvolutionScore: scores.knowledgeEvolutionScore,
      health,
      dashboard,
      knowledgeGraphDashboard,
      organizationalMemoryDashboard,
      expertiseMapDashboard,
      lessonsLearnedDashboard,
      knowledgeQualityDashboard,
      knowledgeGapsDashboard,
      forecastDashboard,
      brief,
      boardReport,
      recommendations,
      risks,
      opportunities,
      areaSuites,
      trendSuite,
      forecastSuite,
      scenarioSuite,
      analysisSuite,
      knowledgeGraphSuite,
      semanticSearchSuite,
      expertiseSuite,
      knowledgeValidationSuite,
      knowledgeEvolutionSuite,
      earlyWarningSuite,
      knowledgeContribution,
      closedLearningLoop,
      reasoning,
      projection,
      historyRecord,
      confidence,
      requestMetadata: { ...(request.metadata ?? {}), registryPublishers: this.registry.list().length },
    };

    this.registry.register("institutional-memory", "institutional_memory_intelligence");
    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

export {
  InstitutionalMemoryIntelligenceEngineImpl as InstitutionalMemoryIntelligenceEngine,
  InstitutionalMemoryIntelligenceEngineImpl as InstitutionalMemoryEngine,
  InstitutionalMemoryIntelligenceEngineImpl as InstitutionalMemoryEngineImpl,
};
`);

w("projection.ts", `import { buildConfidence, outlookFromScore } from "${PKG}/models";
import type { InstitutionalMemoryProjectionResult, InstitutionalMemoryQueryRequest, InstitutionalMemoryQueryResult, InstitutionalMemoryResult } from "${PKG}/types";

export class InstitutionalMemoryProjection {
  project(input: Omit<InstitutionalMemoryProjectionResult, "forecast">): InstitutionalMemoryProjectionResult {
    const outlookBoost = input.outlook === "learning" ? 6 : input.outlook === "eroding" ? -4 : input.outlook === "stable" ? 2 : 0;
    return { ...input, forecast: Math.min(100, input.healthScore + outlookBoost) };
  }
}

export class InstitutionalMemoryQueries {
  ask(result: InstitutionalMemoryResult, request: InstitutionalMemoryQueryRequest): InstitutionalMemoryQueryResult {
    const focus = request.focus ?? "general";
    const max = request.maxResults ?? 5;
    let answer = result.brief.headline;
    let references: string[] = result.recommendations.slice(0, max).map(r => r.title);
    if (focus === "trends") { answer = result.trendSuite.narrative; references = result.trendSuite.trends.slice(0, max).map(t => t.title); }
    else if (focus === "forecasts") { answer = result.forecastSuite.narrative; references = result.forecastSuite.forecasts.slice(0, max).map(f => f.narrative); }
    else if (focus === "scenarios") { answer = result.scenarioSuite.narrative; references = result.scenarioSuite.scenarios.slice(0, max).map(s => s.title); }
    else if (focus === "analysis") { answer = result.analysisSuite.narrative; references = result.analysisSuite.analyses.slice(0, max).map(a => a.title); }
    else if (focus === "reasoning") { answer = result.reasoning.answer; references = result.reasoning.connectedForces.slice(0, max); }
    else if (focus === "learning") { answer = result.closedLearningLoop.narrative; references = result.closedLearningLoop.lessons.slice(0, max); }
    else if (focus === "early_warning") { answer = result.earlyWarningSuite.narrative; references = result.earlyWarningSuite.alerts.slice(0, max).map(a => a.title); }
    else if (focus === "recommendations") { answer = \`\${result.recommendations.length} institutional memory recommendations.\`; }
    else if (focus in result.areaSuites) {
      const suite = result.areaSuites[focus as keyof typeof result.areaSuites];
      answer = suite.narrative;
      references = suite.records.slice(0, max).map(r => r.title);
    }
    return {
      question: request.question,
      focus,
      answer,
      references,
      confidence: buildConfidence([
        { key: "result", label: "Result confidence", contribution: result.confidence.value },
        { key: "focus", label: "Focus specificity", contribution: focus === "general" ? .6 : .85 },
      ]),
    };
  }
}

void outlookFromScore;
`);

w("repository.ts", `import type { InstitutionalMemoryRepository } from "${PKG}/contracts";
import type { InstitutionalMemoryHistoryRecord, InstitutionalMemoryResult, GraphScope } from "${PKG}/types";

export class InstitutionalMemoryRepositoryStore implements InstitutionalMemoryRepository {
  private results = new Map<string, InstitutionalMemoryResult>();
  private history: InstitutionalMemoryHistoryRecord[] = [];

  save(result: InstitutionalMemoryResult): InstitutionalMemoryResult {
    this.results.set(result.requestId, result);
    return result;
  }
  get(requestId: string): InstitutionalMemoryResult | null {
    return this.results.get(requestId) ?? null;
  }
  list(scope?: Partial<GraphScope>): InstitutionalMemoryResult[] {
    const all = [...this.results.values()];
    if (!scope) return all;
    return all.filter(r =>
      (scope.organizationId == null || r.scope.organizationId === scope.organizationId) &&
      (scope.schoolId == null || r.scope.schoolId === scope.schoolId)
    );
  }
  remove(requestId: string): boolean {
    return this.results.delete(requestId);
  }
  saveHistory(record: InstitutionalMemoryHistoryRecord): InstitutionalMemoryHistoryRecord {
    this.history.push(record);
    return record;
  }
  listHistory(scope?: Partial<GraphScope>): InstitutionalMemoryHistoryRecord[] {
    if (!scope) return [...this.history];
    return this.history.filter(r =>
      (scope.organizationId == null || r.scope.organizationId === scope.organizationId) &&
      (scope.schoolId == null || r.scope.schoolId === scope.schoolId)
    );
  }
  clear(): void {
    this.results.clear();
    this.history = [];
  }
}
`);

w("institutional-memory-registry.ts", `import type { InstitutionalMemoryRegistry } from "${PKG}/contracts";
import type { InstitutionalMemoryPublisher } from "${PKG}/types";

export class InstitutionalMemoryRegistryStore implements InstitutionalMemoryRegistry {
  private publishers: InstitutionalMemoryPublisher[] = [];

  register(domain: string, capability: string): void {
    if (!this.publishers.some(p => p.domain === domain && p.capability === capability)) {
      this.publishers.push({ domain, capability });
    }
  }
  list(): InstitutionalMemoryPublisher[] {
    return [...this.publishers];
  }
  isRegistered(domain: string): boolean {
    return this.publishers.some(p => p.domain === domain);
  }
  clear(): void {
    this.publishers = [];
  }
}
`);

w("service.ts", `import type { InstitutionalMemoryDependencies, InstitutionalMemoryIntelligenceService as Contract, InstitutionalMemoryRepository as Repository } from "${PKG}/contracts";
import { InstitutionalMemoryIntelligenceEngineImpl } from "${PKG}/institutional-memory-engine";
import type { InstitutionalMemoryQueryRequest, InstitutionalMemoryQueryResult, InstitutionalMemoryRequest, InstitutionalMemoryResult } from "${PKG}/types";

export interface InstitutionalMemoryServiceDependencies extends InstitutionalMemoryDependencies {}

export class InstitutionalMemoryIntelligenceServiceImpl implements Contract {
  private engine: InstitutionalMemoryIntelligenceEngineImpl;
  constructor(d: InstitutionalMemoryServiceDependencies = {}) {
    this.engine = (d.engine as InstitutionalMemoryIntelligenceEngineImpl | undefined) ?? new InstitutionalMemoryIntelligenceEngineImpl(d);
  }
  build(request: InstitutionalMemoryRequest): InstitutionalMemoryResult { return this.engine.build(request); }
  query(result: InstitutionalMemoryResult, request: InstitutionalMemoryQueryRequest): InstitutionalMemoryQueryResult { return this.engine.queries.ask(result, request); }
  repository(): Repository { return this.engine.repository; }
}

export {
  InstitutionalMemoryIntelligenceServiceImpl as InstitutionalMemoryIntelligenceService,
  InstitutionalMemoryIntelligenceServiceImpl as InstitutionalMemoryService,
  InstitutionalMemoryIntelligenceServiceImpl as InstitutionalMemoryServiceImpl,
};
`);

const areaExports = AREA_KEYS.map(a =>
  `export * from "${PKG}/${areaFile(a)}";`
).join("\n");

w("index.ts", `export * from "${PKG}/types";
export type {
  InstitutionalMemoryDependencies,
  InstitutionalMemoryAreaIntelligence as InstitutionalMemoryAreaIntelligenceContract,
  InstitutionalMemoryForecastEngineContract,
  InstitutionalMemoryScenarioEngineContract,
  InstitutionalMemoryTrendEngineContract,
  InstitutionalMemoryAnalysisEngineContract,
  KnowledgeAnalysisEngineContract,
  KnowledgeGraphEngineContract,
  SemanticSearchEngineContract,
  ExpertiseEngineContract,
  KnowledgeValidationEngineContract,
  KnowledgeEvolutionEngineContract,
  EarlyWarningEngineContract,
  InstitutionalMemoryReasonerContract,
  InstitutionalMemoryRegistry as InstitutionalMemoryRegistryContract,
  InstitutionalMemoryRepository as InstitutionalMemoryRepositoryContract,
  InstitutionalMemoryEngine as InstitutionalMemoryEngineContract,
  InstitutionalMemoryIntelligenceEngine as InstitutionalMemoryIntelligenceEngineContract,
  InstitutionalMemoryIntelligenceService as InstitutionalMemoryIntelligenceServiceContract,
  InstitutionalMemoryService as InstitutionalMemoryServiceContract,
} from "${PKG}/contracts";
export * from "${PKG}/models";
export * from "${PKG}/area-factory";
${areaExports}
export * from "${PKG}/institutional-memory-forecast-engine";
export * from "${PKG}/institutional-memory-scenario-engine";
export * from "${PKG}/institutional-memory-trend-engine";
export * from "${PKG}/institutional-memory-analysis-engine";
export * from "${PKG}/knowledge-graph-engine";
export * from "${PKG}/semantic-search-engine";
export * from "${PKG}/expertise-engine";
export * from "${PKG}/knowledge-validation-engine";
export * from "${PKG}/knowledge-evolution-engine";
export * from "${PKG}/early-warning-engine";
export * from "${PKG}/knowledge-contribution";
export * from "${PKG}/closed-learning-loop";
export * from "${PKG}/institutional-memory-reasoner";
export * from "${PKG}/institutional-memory-intelligence";
export * from "${PKG}/projection";
export * from "${PKG}/institutional-memory-registry";
export * from "${PKG}/repository";
export * from "${PKG}/institutional-memory-engine";
export * from "${PKG}/service";

import type { InstitutionalMemoryDependencies } from "${PKG}/contracts";
import { InstitutionalMemoryIntelligenceEngine } from "${PKG}/institutional-memory-engine";
import { InstitutionalMemoryIntelligenceService } from "${PKG}/service";
import {
  createOrganizationDnaIntelligence,
  type CreateOrganizationDnaOptions,
  type OrganizationDnaStack,
} from "@/lib/platform/intelligence/organization-dna";
import {
  createOiosOperatingSystem,
  type CreateOiosOptions,
  type OiosStack,
} from "@/lib/platform/oios";

export interface InstitutionalMemoryStack {
  service: InstitutionalMemoryIntelligenceService;
  engine: InstitutionalMemoryIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateInstitutionalMemoryOptions extends InstitutionalMemoryDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createInstitutionalMemoryIntelligence(options: CreateInstitutionalMemoryOptions = {}): InstitutionalMemoryStack {
  const organizationDna =
    options.organizationDna ??
    (options.wireOrganizationDna === false
      ? null
      : createOrganizationDnaIntelligence({
          ...options.organizationDnaOptions,
          wireGraphAnalyzer: false,
          wireDecision: false,
          wirePredictive: false,
          wireBoardGovernance: false,
        }));
  const oios =
    options.oios ??
    (options.wireOios === false
      ? null
      : createOiosOperatingSystem({
          ...options.oiosOptions,
          organizationDnaStack: options.oiosOptions?.organizationDnaStack ?? organizationDna ?? undefined,
          wireOrganizationDna: false,
        }));
  const engine = new InstitutionalMemoryIntelligenceEngine(options);
  const service = new InstitutionalMemoryIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
`);

w("README.md", `# Institutional Memory Intelligence (Sprint 058)

**Version:** 0.1.0 | **Domain key:** \`institutional-memory\` | **ID prefix:** \`imm-\`

Terminal institutional memory layer after Ecosystem that soft-reads Knowledge (Sprint 040) and upstream domains so JAG can synthesize, validate, and redistribute organizational learning.

## Critical freeze note

Sprint 040 already shipped Knowledge Intelligence at \`src/lib/platform/intelligence/knowledge/\` (domain key \`knowledge\`, mid-pipeline after customer). That package remains **frozen**. Sprint 058 fulfills the Knowledge Intelligence evolution brief (institutional memory layer) as this **new** terminal domain. Soft-read existing \`knowledge\` via \`KnowledgeResultLight\` only. Do not regenerate or modify \`knowledge/\`.

## Areas (17)

organizational_memory, knowledge_graph, knowledge_mapping, expertise_intelligence, institutional_memory, lessons_learned, decision_history, policy_knowledge, process_knowledge, relationship_knowledge, semantic_search, knowledge_validation, knowledge_evolution, knowledge_gap_detection, knowledge_transfer, knowledge_quality, knowledge_synthesis

## Entry point

\`\`\`ts
import { createInstitutionalMemoryIntelligence } from "@/lib/platform/intelligence/institutional-memory";

const { service } = createInstitutionalMemoryIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({ requestId: "imm-1", scope: { organizationId: "org-1", schoolId: "school-1" } });
\`\`\`

## Lens (8 fields)

knowledgeConfidence · evidenceStrength · institutionalMemoryCoverage · knowledgeFreshness · expertiseAvailability · knowledgeGaps · knowledgeQuality · longTermLearningValue

## Hard DAG

\`["ecosystem"]\` - terminal platform module after Ecosystem Intelligence.

## Layer

Terminal institutional memory layer after Ecosystem External network - how the organization remembers, validates, and redistributes learning across domains.
`);

w("ARCHITECTURE.md", `# Institutional Memory Intelligence Architecture

## Placement

- Domain key: \`institutional-memory\`
- Package: \`src/lib/platform/intelligence/institutional-memory/\`
- Pipeline: terminal after \`ecosystem\`
- Hard DAG: \`["ecosystem"]\`
- OIOS hard deps: \`["organization-dna", "ecosystem"]\`
- Soft reads: knowledge (Sprint 040 frozen), ecosystem, resilience, systems, stakeholder, cultural, ethical, opportunity, executive-decision, predictive, plus market, competitive, behavioral, operations, customer, human-capital

## Freeze boundary

Sprint 040 \`knowledge/\` remains frozen mid-pipeline. This package is the Knowledge Intelligence evolution brief implemented as a separate terminal domain. Soft-read only via \`KnowledgeResultLight\`. No circular imports. Leaf types/contracts.

## Package layout

Leaf-safe \`types\` / \`contracts\`, \`models\`, area factory + 17 area modules, specialized engines (KnowledgeGraph, SemanticSearch, Expertise, KnowledgeValidation, KnowledgeEvolution, EarlyWarning), standard forecast/trend/scenario/analysis engines (InstitutionalMemoryAnalysisEngine / KnowledgeAnalysisEngine), composers, projection, repository, registry, service, \`createInstitutionalMemoryIntelligence\`.

## Suites on InstitutionalMemoryResult

knowledgeGraphSuite, semanticSearchSuite, expertiseSuite, knowledgeValidationSuite, knowledgeEvolutionSuite, earlyWarningSuite, plus trend/forecast/scenario/analysis suites.

## Closed learning

Primary institutional memory destination that redistributes validated insights via soft contribution records.

Destinations: knowledge, ecosystem, opportunity, executive-decision, predictive, organizational-improvement, stakeholder.
`);

w("VERIFICATION.md", `# Institutional Memory Intelligence Verification

## Commands

\`\`\`
npx tsc --noEmit
npx vitest run tests/unit/intelligence/institutional-memory.test.ts tests/unit/intelligence/ecosystem.test.ts tests/unit/intelligence/resilience.test.ts tests/unit/intelligence/infrastructure.test.ts tests/unit/intelligence/oios-core.test.ts
\`\`\`

## Checks

1. Result version is 0.1.0 with all area and engine scores populated.
2. Analysis kinds and scenarios cover INSTITUTIONAL_MEMORY_ANALYSIS_KINDS / INSTITUTIONAL_MEMORY_SCENARIOS.
3. Recommendations carry the eight-field InstitutionalMemoryLens; IDs use \`imm-\` prefix.
4. Closed learning destinations match the seven redistribution domains.
5. Platform module order ends \`resilience\`, \`ecosystem\`, \`institutional-memory\`.
6. Sprint 040 \`knowledge/\` source is unmodified.
`);

w("CHANGELOG.md", `# Institutional Memory Intelligence Changelog

## 0.1.0 - Sprint 058

- Initial Institutional Memory Intelligence package (17 areas, 10 scenarios, 12 analysis kinds).
- Fulfills the Knowledge Intelligence evolution brief as a terminal layer; Sprint 040 knowledge remains frozen mid-pipeline.
- Specialized engines: KnowledgeGraph, SemanticSearch, Expertise, KnowledgeValidation, KnowledgeEvolution, EarlyWarning.
- Soft integrations from knowledge, ecosystem, resilience, systems, stakeholder, cultural, ethical, opportunity, decision, predictive, and additional domain lights.
- Terminal platform module after Ecosystem Intelligence.
- Closed learning redistributes validated insights to knowledge, ecosystem, opportunity, executive-decision, predictive, organizational-improvement, stakeholder.
`);

console.log("Part 3 complete. Files:", fs.readdirSync(DEST).length);
