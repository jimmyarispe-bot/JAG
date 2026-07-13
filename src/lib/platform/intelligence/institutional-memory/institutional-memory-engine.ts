import type { InstitutionalMemoryDependencies, InstitutionalMemoryEngine as Contract } from "@/lib/platform/intelligence/institutional-memory/contracts";
import { defaultCreateId, defaultPeriodLabel, deriveInstitutionalMemoryBaseline, emptyInstitutionalMemoryScope, buildConfidence } from "@/lib/platform/intelligence/institutional-memory/models";
import { INSTITUTIONAL_MEMORY_AREAS, INSTITUTIONAL_MEMORY_INTELLIGENCE_VERSION, type InstitutionalMemoryArea, type InstitutionalMemoryAreaSuite, type InstitutionalMemoryRequest, type InstitutionalMemoryResult } from "@/lib/platform/intelligence/institutional-memory/types";
import { OrganizationalMemoryIntelligence } from "@/lib/platform/intelligence/institutional-memory/organizational-memory-intelligence";
import { KnowledgeGraphIntelligence } from "@/lib/platform/intelligence/institutional-memory/knowledge-graph-intelligence";
import { KnowledgeMappingIntelligence } from "@/lib/platform/intelligence/institutional-memory/knowledge-mapping-intelligence";
import { ExpertiseIntelligence } from "@/lib/platform/intelligence/institutional-memory/expertise-intelligence-intelligence";
import { InstitutionalMemoryAreaIntelligence } from "@/lib/platform/intelligence/institutional-memory/institutional-memory-area-intelligence";
import { LessonsLearnedIntelligence } from "@/lib/platform/intelligence/institutional-memory/lessons-learned-intelligence";
import { DecisionHistoryIntelligence } from "@/lib/platform/intelligence/institutional-memory/decision-history-intelligence";
import { PolicyKnowledgeIntelligence } from "@/lib/platform/intelligence/institutional-memory/policy-knowledge-intelligence";
import { ProcessKnowledgeIntelligence } from "@/lib/platform/intelligence/institutional-memory/process-knowledge-intelligence";
import { RelationshipKnowledgeIntelligence } from "@/lib/platform/intelligence/institutional-memory/relationship-knowledge-intelligence";
import { SemanticSearchIntelligence } from "@/lib/platform/intelligence/institutional-memory/semantic-search-intelligence";
import { KnowledgeValidationIntelligence } from "@/lib/platform/intelligence/institutional-memory/knowledge-validation-intelligence";
import { KnowledgeEvolutionIntelligence } from "@/lib/platform/intelligence/institutional-memory/knowledge-evolution-intelligence";
import { KnowledgeGapDetectionIntelligence } from "@/lib/platform/intelligence/institutional-memory/knowledge-gap-detection-intelligence";
import { KnowledgeTransferIntelligence } from "@/lib/platform/intelligence/institutional-memory/knowledge-transfer-intelligence";
import { KnowledgeQualityIntelligence } from "@/lib/platform/intelligence/institutional-memory/knowledge-quality-intelligence";
import { KnowledgeSynthesisIntelligence } from "@/lib/platform/intelligence/institutional-memory/knowledge-synthesis-intelligence";
import { InstitutionalMemoryForecastEngine } from "@/lib/platform/intelligence/institutional-memory/institutional-memory-forecast-engine";
import { InstitutionalMemoryScenarioEngine } from "@/lib/platform/intelligence/institutional-memory/institutional-memory-scenario-engine";
import { InstitutionalMemoryTrendEngine } from "@/lib/platform/intelligence/institutional-memory/institutional-memory-trend-engine";
import { InstitutionalMemoryAnalysisEngine } from "@/lib/platform/intelligence/institutional-memory/institutional-memory-analysis-engine";
import { KnowledgeGraphEngine } from "@/lib/platform/intelligence/institutional-memory/knowledge-graph-engine";
import { SemanticSearchEngine } from "@/lib/platform/intelligence/institutional-memory/semantic-search-engine";
import { ExpertiseEngine } from "@/lib/platform/intelligence/institutional-memory/expertise-engine";
import { KnowledgeValidationEngine } from "@/lib/platform/intelligence/institutional-memory/knowledge-validation-engine";
import { KnowledgeEvolutionEngine } from "@/lib/platform/intelligence/institutional-memory/knowledge-evolution-engine";
import { EarlyWarningEngine } from "@/lib/platform/intelligence/institutional-memory/early-warning-engine";
import { InstitutionalMemoryKnowledgeContributionEngine } from "@/lib/platform/intelligence/institutional-memory/knowledge-contribution";
import { ClosedLearningLoop } from "@/lib/platform/intelligence/institutional-memory/closed-learning-loop";
import { InstitutionalMemoryReasoner } from "@/lib/platform/intelligence/institutional-memory/institutional-memory-reasoner";
import {
  InstitutionalMemoryIntelligence, InstitutionalMemoryRecommendationComposer, composeDashboard, composeHealth,
  composeRisksOpportunities, institutionalMemoryLens,
} from "@/lib/platform/intelligence/institutional-memory/institutional-memory-intelligence";
import { InstitutionalMemoryProjection } from "@/lib/platform/intelligence/institutional-memory/projection";
import { InstitutionalMemoryRepositoryStore } from "@/lib/platform/intelligence/institutional-memory/repository";
import { InstitutionalMemoryRegistryStore } from "@/lib/platform/intelligence/institutional-memory/institutional-memory-registry";
import { InstitutionalMemoryQueries } from "@/lib/platform/intelligence/institutional-memory/projection";

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
      organizational_memory: new OrganizationalMemoryIntelligence(),
      knowledge_graph: new KnowledgeGraphIntelligence(),
      knowledge_mapping: new KnowledgeMappingIntelligence(),
      expertise_intelligence: new ExpertiseIntelligence(),
      institutional_memory: new InstitutionalMemoryAreaIntelligence(),
      lessons_learned: new LessonsLearnedIntelligence(),
      decision_history: new DecisionHistoryIntelligence(),
      policy_knowledge: new PolicyKnowledgeIntelligence(),
      process_knowledge: new ProcessKnowledgeIntelligence(),
      relationship_knowledge: new RelationshipKnowledgeIntelligence(),
      semantic_search: new SemanticSearchIntelligence(),
      knowledge_validation: new KnowledgeValidationIntelligence(),
      knowledge_evolution: new KnowledgeEvolutionIntelligence(),
      knowledge_gap_detection: new KnowledgeGapDetectionIntelligence(),
      knowledge_transfer: new KnowledgeTransferIntelligence(),
      knowledge_quality: new KnowledgeQualityIntelligence(),
      knowledge_synthesis: new KnowledgeSynthesisIntelligence(),
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
      headline: `Knowledge graph index ${Math.round(knowledgeGraphSuite.graphIndex)}`,
      score: knowledgeGraphSuite.score,
      graphIndex: knowledgeGraphSuite.graphIndex,
      signals: knowledgeGraphSuite.records.slice(0, 4).map(r => r.title),
      narrative: knowledgeGraphSuite.narrative,
    };
    const organizationalMemoryDashboard = {
      generatedAt: now.toISOString(),
      headline: `Organizational memory ${Math.round(areaSuites.organizational_memory.score)}`,
      score: areaSuites.organizational_memory.score,
      memoryIndex: areaSuites.organizational_memory.score,
      signals: areaSuites.organizational_memory.records.map(r => r.signal),
      narrative: areaSuites.organizational_memory.narrative,
    };
    const expertiseMapDashboard = {
      generatedAt: now.toISOString(),
      headline: `Expertise map index ${Math.round(expertiseSuite.expertiseIndex)}`,
      score: expertiseSuite.score,
      expertiseIndex: expertiseSuite.expertiseIndex,
      signals: expertiseSuite.records.map(r => r.narrative),
      narrative: expertiseSuite.narrative,
    };
    const lessonsLearnedDashboard = {
      generatedAt: now.toISOString(),
      headline: `Lessons learned ${Math.round(areaSuites.lessons_learned.score)}`,
      score: areaSuites.lessons_learned.score,
      lessonsIndex: areaSuites.lessons_learned.score,
      signals: areaSuites.lessons_learned.records.map(r => r.signal),
      narrative: areaSuites.lessons_learned.narrative,
    };
    const knowledgeQualityDashboard = {
      generatedAt: now.toISOString(),
      headline: `Knowledge quality ${Math.round(areaSuites.knowledge_quality.score)}`,
      score: areaSuites.knowledge_quality.score,
      qualityIndex: areaSuites.knowledge_quality.score,
      signals: areaSuites.knowledge_quality.records.map(r => r.signal),
      narrative: areaSuites.knowledge_quality.narrative,
    };
    const knowledgeGapsDashboard = {
      generatedAt: now.toISOString(),
      headline: `Knowledge gaps ${Math.round(baseline.knowledgeGaps)}`,
      score: baseline.knowledgeGaps,
      gapsIndex: baseline.knowledgeGaps,
      signals: areaSuites.knowledge_gap_detection.records.map(r => r.signal),
      narrative: `Knowledge gaps index ${Math.round(baseline.knowledgeGaps)}; gap detection ${Math.round(areaSuites.knowledge_gap_detection.score)}.`,
    };
    const forecastDashboard = {
      generatedAt: now.toISOString(),
      headline: `Institutional Memory Forecast: ${forecastSuite.outlook}`,
      score: forecastSuite.maturityScore,
      outlook: forecastSuite.outlook,
      signals: forecastSuite.forecasts.slice(0, 4).map(f => f.narrative),
      narrative: forecastSuite.narrative,
    };
    const brief = {
      generatedAt: now.toISOString(),
      headline: dashboard.headline,
      summary: `${forecastSuite.narrative} ${scenarioSuite.narrative}`,
      healthScore: health.overallScore,
      outlook: forecastSuite.outlook,
      topRecommendations: recommendations.map(r => r.title),
      topRisks: risks.map(r => r.title),
      lenses: commonLens,
      narrative: dashboard.narrative,
    };
    const boardReport = {
      generatedAt: now.toISOString(),
      headline: `Board Report: ${dashboard.headline}`,
      assuranceSummary: `Evidence coverage ${Math.round(baseline.evidenceCoverage)}; primary scenario ${scenarioSuite.primaryScenario.replaceAll("_", " ")}.`,
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
      organizationalMemoryScore: scores.areaScores.organizational_memory,
      knowledgeGraphScore: scores.areaScores.knowledge_graph,
      knowledgeMappingScore: scores.areaScores.knowledge_mapping,
      expertiseIntelligenceScore: scores.areaScores.expertise_intelligence,
      institutionalMemoryScore: scores.areaScores.institutional_memory,
      lessonsLearnedScore: scores.areaScores.lessons_learned,
      decisionHistoryScore: scores.areaScores.decision_history,
      policyKnowledgeScore: scores.areaScores.policy_knowledge,
      processKnowledgeScore: scores.areaScores.process_knowledge,
      relationshipKnowledgeScore: scores.areaScores.relationship_knowledge,
      semanticSearchScore: scores.areaScores.semantic_search,
      knowledgeValidationScore: scores.areaScores.knowledge_validation,
      knowledgeEvolutionScore: scores.areaScores.knowledge_evolution,
      knowledgeGapDetectionScore: scores.areaScores.knowledge_gap_detection,
      knowledgeTransferScore: scores.areaScores.knowledge_transfer,
      knowledgeQualityScore: scores.areaScores.knowledge_quality,
      knowledgeSynthesisScore: scores.areaScores.knowledge_synthesis,
      forecastScore: scores.forecastScore,
      scenarioScore: scores.scenarioScore,
      analysisScore: scores.analysisScore,
      earlyWarningScore: scores.earlyWarningScore,
      knowledgeGraphEngineScore: scores.knowledgeGraphEngineScore,
      semanticSearchEngineScore: scores.semanticSearchEngineScore,
      expertiseScore: scores.expertiseScore,
      knowledgeValidationEngineScore: scores.knowledgeValidationEngineScore,
      knowledgeEvolutionEngineScore: scores.knowledgeEvolutionEngineScore,
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
