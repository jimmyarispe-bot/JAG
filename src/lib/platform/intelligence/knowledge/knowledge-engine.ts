/**
 * Knowledge Intelligence — KnowledgeIntelligenceEngine (Sprint 040 / 0.2.0).
 *
 * Orchestrates artifact catalog, provenance, knowledge graph, semantic search,
 * quality intelligence, organizational memory, reasoning, gaps, expertise,
 * evolution, and decision traceability for institutional memory.
 *
 * Distinct from foundation IntelligenceKnowledgeService, OIOS Organizational
 * Knowledge Graph, and Human Capital KnowledgeTransfer.
 */

import type {
  DecisionTraceabilityEngine as DecisionTraceabilityEngineContract,
  ExpertiseMapEngine as ExpertiseMapEngineContract,
  ExecutiveKnowledgeBriefGenerator as ExecutiveKnowledgeBriefGeneratorContract,
  KnowledgeCaptureEngine as KnowledgeCaptureEngineContract,
  KnowledgeDashboard as KnowledgeDashboardContract,
  KnowledgeDependencies,
  KnowledgeEvolutionEngine as KnowledgeEvolutionEngineContract,
  KnowledgeGapEngine as KnowledgeGapEngineContract,
  KnowledgeGraphEngine as KnowledgeGraphEngineContract,
  KnowledgeHealth as KnowledgeHealthContract,
  KnowledgeIntelligence as KnowledgeIntelligenceContract,
  KnowledgeIntelligenceEngine as KnowledgeIntelligenceEngineContract,
  KnowledgeOpportunityAnalyzer as KnowledgeOpportunityAnalyzerContract,
  KnowledgeProjection as KnowledgeProjectionContract,
  KnowledgeProvenanceEngine as KnowledgeProvenanceEngineContract,
  KnowledgeQualityEngine as KnowledgeQualityEngineContract,
  KnowledgeQueries as KnowledgeQueriesContract,
  KnowledgeReasoner as KnowledgeReasonerContract,
  KnowledgeRecommendationComposer as KnowledgeRecommendationComposerContract,
  KnowledgeRegistry as KnowledgeRegistryContract,
  KnowledgeRepository as KnowledgeRepositoryContract,
  KnowledgeRiskAnalyzer as KnowledgeRiskAnalyzerContract,
  KnowledgeSearchEngine as KnowledgeSearchEngineContract,
  OrganizationalMemoryEngine as OrganizationalMemoryEngineContract,
} from "@/lib/platform/intelligence/knowledge/contracts";
import { KnowledgeCaptureEngine } from "@/lib/platform/intelligence/knowledge/capture-intelligence";
import { KnowledgeEvolutionEngine } from "@/lib/platform/intelligence/knowledge/evolution-intelligence";
import {
  KnowledgeGraphEngine,
  KnowledgeSearchEngine,
} from "@/lib/platform/intelligence/knowledge/graph-search-intelligence";
import {
  defaultKnowledgeConfidence,
  ExecutiveKnowledgeBriefGenerator,
  KnowledgeDashboard,
  KnowledgeHealth,
  KnowledgeIntelligence,
  KnowledgeOpportunityAnalyzer,
  KnowledgeRecommendationComposer,
  KnowledgeRiskAnalyzer,
} from "@/lib/platform/intelligence/knowledge/knowledge-intelligence";
import { KnowledgeRegistryStore } from "@/lib/platform/intelligence/knowledge/knowledge-registry";
import { OrganizationalMemoryEngine } from "@/lib/platform/intelligence/knowledge/memory-intelligence";
import {
  KnowledgeProjection,
  KnowledgeQueries,
} from "@/lib/platform/intelligence/knowledge/projection";
import { KnowledgeProvenanceEngine } from "@/lib/platform/intelligence/knowledge/provenance-intelligence";
import { KnowledgeQualityEngine } from "@/lib/platform/intelligence/knowledge/quality-intelligence";
import {
  ExpertiseMapEngine,
  KnowledgeGapEngine,
  KnowledgeReasoner,
} from "@/lib/platform/intelligence/knowledge/reason-gap-intelligence";
import { KnowledgeRepositoryStore } from "@/lib/platform/intelligence/knowledge/repository";
import { DecisionTraceabilityEngine } from "@/lib/platform/intelligence/knowledge/traceability-intelligence";
import {
  defaultCreateId,
  defaultPeriodLabel,
  deriveKnowledgeBaseline,
  emptyKnowledgeScope,
} from "@/lib/platform/intelligence/knowledge/models";
import {
  KNOWLEDGE_INTELLIGENCE_VERSION,
  type KnowledgeRequest,
  type KnowledgeResult,
} from "@/lib/platform/intelligence/knowledge/types";

export interface KnowledgeEngineDependencies extends KnowledgeDependencies {}

/**
 * KnowledgeIntelligenceEngine — core orchestrator for knowledge outputs.
 */
export class KnowledgeIntelligenceEngineImpl
  implements KnowledgeIntelligenceEngineContract
{
  private readonly knowledgeIntelligence: KnowledgeIntelligenceContract;
  private readonly knowledgeDashboard: KnowledgeDashboardContract;
  private readonly knowledgeHealth: KnowledgeHealthContract;
  private readonly knowledgeCaptureEngine: KnowledgeCaptureEngineContract;
  private readonly knowledgeGraphEngine: KnowledgeGraphEngineContract;
  private readonly knowledgeSearchEngine: KnowledgeSearchEngineContract;
  private readonly knowledgeReasoner: KnowledgeReasonerContract;
  private readonly knowledgeGapEngine: KnowledgeGapEngineContract;
  private readonly expertiseMapEngine: ExpertiseMapEngineContract;
  private readonly knowledgeProvenanceEngine: KnowledgeProvenanceEngineContract;
  private readonly knowledgeQualityEngine: KnowledgeQualityEngineContract;
  private readonly organizationalMemoryEngine: OrganizationalMemoryEngineContract;
  private readonly knowledgeEvolutionEngine: KnowledgeEvolutionEngineContract;
  private readonly decisionTraceabilityEngine: DecisionTraceabilityEngineContract;
  private readonly knowledgeRiskAnalyzer: KnowledgeRiskAnalyzerContract;
  private readonly knowledgeOpportunityAnalyzer: KnowledgeOpportunityAnalyzerContract;
  private readonly knowledgeRecommendationComposer: KnowledgeRecommendationComposerContract;
  private readonly briefGenerator: ExecutiveKnowledgeBriefGeneratorContract;
  private readonly projectionEngine: KnowledgeProjectionContract;
  readonly queries: KnowledgeQueriesContract;
  readonly registry: KnowledgeRegistryContract;
  readonly repository: KnowledgeRepositoryContract;
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  constructor(d: KnowledgeEngineDependencies = {}) {
    this.createId = d.createId ?? defaultCreateId;
    this.now = d.now ?? (() => new Date());
    this.knowledgeIntelligence =
      d.knowledgeIntelligence ?? new KnowledgeIntelligence();
    this.knowledgeDashboard = d.knowledgeDashboard ?? new KnowledgeDashboard();
    this.knowledgeHealth = d.knowledgeHealth ?? new KnowledgeHealth();
    this.knowledgeCaptureEngine =
      d.knowledgeCaptureEngine ?? new KnowledgeCaptureEngine(this.createId);
    this.knowledgeGraphEngine =
      d.knowledgeGraphEngine ?? new KnowledgeGraphEngine(this.createId);
    this.knowledgeSearchEngine =
      d.knowledgeSearchEngine ?? new KnowledgeSearchEngine();
    this.knowledgeReasoner =
      d.knowledgeReasoner ?? new KnowledgeReasoner(this.createId);
    this.knowledgeGapEngine = d.knowledgeGapEngine ?? new KnowledgeGapEngine();
    this.expertiseMapEngine = d.expertiseMapEngine ?? new ExpertiseMapEngine();
    this.knowledgeProvenanceEngine =
      d.knowledgeProvenanceEngine ?? new KnowledgeProvenanceEngine();
    this.knowledgeQualityEngine =
      d.knowledgeQualityEngine ??
      new KnowledgeQualityEngine({
        createId: this.createId,
        validation: d.knowledgeValidation,
        freshness: d.knowledgeFreshness,
        completeness: d.knowledgeCompleteness,
        accuracy: d.knowledgeAccuracy,
        consistency: d.knowledgeConsistency,
        conflictDetection: d.knowledgeConflictDetection,
        redundancyDetection: d.knowledgeRedundancyDetection,
        coverageAnalysis: d.knowledgeCoverageAnalysis,
        lifecycleManagement: d.knowledgeLifecycleManagement,
      });
    this.organizationalMemoryEngine =
      d.organizationalMemoryEngine ??
      new OrganizationalMemoryEngine(this.createId);
    this.knowledgeEvolutionEngine =
      d.knowledgeEvolutionEngine ??
      new KnowledgeEvolutionEngine(this.createId);
    this.decisionTraceabilityEngine =
      d.decisionTraceabilityEngine ?? new DecisionTraceabilityEngine();
    this.knowledgeRiskAnalyzer =
      d.knowledgeRiskAnalyzer ?? new KnowledgeRiskAnalyzer(this.createId);
    this.knowledgeOpportunityAnalyzer =
      d.knowledgeOpportunityAnalyzer ??
      new KnowledgeOpportunityAnalyzer(this.createId);
    this.knowledgeRecommendationComposer =
      d.knowledgeRecommendationComposer ??
      new KnowledgeRecommendationComposer(this.createId);
    this.briefGenerator =
      d.briefGenerator ?? new ExecutiveKnowledgeBriefGenerator();
    this.projectionEngine = d.projection ?? new KnowledgeProjection();
    this.queries = d.queries ?? new KnowledgeQueries();
    this.registry = d.registry ?? new KnowledgeRegistryStore();
    this.repository = d.repository ?? new KnowledgeRepositoryStore();
  }

  build(request: KnowledgeRequest): KnowledgeResult {
    const now = this.now();
    const scope = request.scope ?? emptyKnowledgeScope();
    const dna = request.dna ?? request.dnaResult?.dna ?? null;

    // 1. Baseline
    const baseline = deriveKnowledgeBaseline(
      dna,
      request.oiosResult,
      request.analysis,
      request.graphInput,
      request.predictionResult,
      request.customerResult,
      request.operationsResult,
      request.humanCapitalResult,
      request.baselineOverrides
    );

    // 2. Catalog + provenance
    const catalog = this.knowledgeCaptureEngine.catalog({ baseline, now });
    const provenance = this.knowledgeProvenanceEngine.assess({
      baseline,
      catalog,
      now,
    });

    // 3. Graph + search
    const graph = this.knowledgeGraphEngine.build({ baseline, catalog, now });
    const search = this.knowledgeSearchEngine.index({
      baseline,
      catalog,
      graph,
      now,
    });

    // 4. Quality + organizational memory
    const quality = this.knowledgeQualityEngine.assess({
      baseline,
      catalog,
      graph,
      search,
      now,
    });
    const organizationalMemory = this.organizationalMemoryEngine.capture({
      baseline,
      catalog,
      provenance,
      now,
    });

    // 5. Reasoning + gaps + expertise
    const reasoning = this.knowledgeReasoner.reason({
      baseline,
      catalog,
      graph,
      search,
      question: request.question,
      now,
    });
    const gaps = this.knowledgeGapEngine.analyze({
      baseline,
      catalog,
      graph,
      reasoning,
      now,
    });
    const expertiseMap = this.expertiseMapEngine.map({
      baseline,
      catalog,
      now,
    });

    // 6. Evolution
    const evolution = this.knowledgeEvolutionEngine.evolve({
      baseline,
      catalog,
      quality,
      gaps,
      reasoning,
      expertiseMap,
      organizationalMemory,
      now,
    });

    // 7. Risks + opportunities + recommendations + decision traceability
    const risks = this.knowledgeRiskAnalyzer.analyze({
      baseline,
      catalog,
      graph,
      search,
      gaps,
      expertiseMap,
      now,
    });
    const opportunities = this.knowledgeOpportunityAnalyzer.analyze({
      baseline,
      catalog,
      graph,
      gaps,
      expertiseMap,
      now,
    });
    const recommendations = this.knowledgeRecommendationComposer.compose({
      opportunities,
      risks,
      catalog,
      gaps,
      provenance,
      now,
    });
    const decisionTraceability = this.decisionTraceabilityEngine.trace({
      recommendations,
      catalog,
      provenance,
      now,
    });

    // 8. Scores + health + dashboard
    const scores = this.knowledgeIntelligence.composeScores({
      baseline,
      catalog,
      graph,
      search,
      reasoning,
      gaps,
      expertiseMap,
      provenance,
      quality,
      organizationalMemory,
      evolution,
      decisionTraceability,
      risks,
      opportunities,
    });
    const knowledgeHealth = this.knowledgeHealth.assess({
      baseline,
      scores,
      catalog,
      graph,
    });
    const dashboard = this.knowledgeDashboard.compose({
      scores,
      baseline,
      risks,
      opportunities,
      now,
    });

    // 9. Brief, projection, confidence, history → persist
    const confidence = defaultKnowledgeConfidence(
      baseline,
      catalog,
      graph,
      search
    );
    const brief = this.briefGenerator.generate({
      request,
      baseline,
      scores,
      risks,
      opportunities,
      catalog,
      recommendations,
      confidence,
      now,
    });
    const projection = this.projectionEngine.project({
      request,
      healthScore: scores.healthScore,
      coverageScore: scores.coverageScore,
      graphScore: scores.graphScore,
      searchScore: scores.searchScore,
      gapScore: scores.gapScore,
      expertiseScore: scores.expertiseScore,
      qualityScore: scores.qualityScore,
      provenanceScore: scores.provenanceScore,
      memoryScore: scores.memoryScore,
      evolutionScore: scores.evolutionScore,
      catalog,
      graph,
      search,
      reasoning,
      gaps,
      expertiseMap,
      provenance,
      quality,
      organizationalMemory,
      evolution,
      decisionTraceability,
      brief,
      confidence,
      dashboard,
      baseline,
    });

    const historyRecord = {
      id: this.createId("know-history"),
      requestId: request.requestId,
      scope,
      status: "generated" as const,
      healthScore: scores.healthScore.value,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: KnowledgeResult = {
      requestId: request.requestId,
      version: KNOWLEDGE_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? defaultPeriodLabel(now),
      scope,
      baseline,
      healthScore: scores.healthScore,
      coverageScore: scores.coverageScore,
      graphScore: scores.graphScore,
      searchScore: scores.searchScore,
      gapScore: scores.gapScore,
      expertiseScore: scores.expertiseScore,
      qualityScore: scores.qualityScore,
      provenanceScore: scores.provenanceScore,
      memoryScore: scores.memoryScore,
      evolutionScore: scores.evolutionScore,
      riskScore: scores.riskScore,
      knowledgeHealth,
      catalog,
      graph,
      search,
      reasoning,
      gaps,
      expertiseMap,
      provenance,
      quality,
      organizationalMemory,
      evolution,
      decisionTraceability,
      dashboard,
      risks,
      opportunities,
      brief,
      projection,
      confidence,
      recommendations,
      historyRecord,
      metadata: {
        ...(request.metadata ?? {}),
        registryPublishers: this.registry.list().length,
        decisionAligned: Boolean(request.decisionResult),
        predictionAligned: Boolean(request.predictionResult),
      },
    };

    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

/** Aliases matching Sprint naming. */
export { KnowledgeIntelligenceEngineImpl as KnowledgeIntelligenceEngine };
export { KnowledgeIntelligenceEngineImpl as KnowledgeEngine };
export { KnowledgeIntelligenceEngineImpl as KnowledgeEngineImpl };
