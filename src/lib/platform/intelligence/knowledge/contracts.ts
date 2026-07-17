/**
 * Knowledge Intelligence — contracts / interfaces only (Sprint 040).
 *
 * Leaf module: no imports from engine implementations (avoids cycles).
 */

import type * as T from "@/lib/platform/intelligence/knowledge/types";

/** Core orchestration engine. */
export interface KnowledgeIntelligenceEngine {
  build(request: T.KnowledgeRequest): T.KnowledgeResult;
}

/** Alias matching Sprint naming for the core engine. */
export type KnowledgeEngine = KnowledgeIntelligenceEngine;

/** Scores + health composer. */
export interface KnowledgeIntelligence {
  composeScores(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    graph: T.KnowledgeGraphResult;
    search: T.KnowledgeSearchResult;
    reasoning: T.KnowledgeReasoningResult;
    gaps: T.KnowledgeGapResult;
    expertiseMap: T.ExpertiseMapResult;
    provenance: T.KnowledgeProvenanceSuite;
    quality: T.KnowledgeQualitySuite;
    organizationalMemory: T.OrganizationalMemorySuite;
    evolution: T.KnowledgeEvolutionResult;
    decisionTraceability: T.DecisionTraceabilityResult;
    risks: T.KnowledgeRiskRecord[];
    opportunities: T.KnowledgeOpportunityRecord[];
  }): {
    healthScore: T.KnowledgeScore;
    coverageScore: T.KnowledgeScore;
    graphScore: T.KnowledgeScore;
    searchScore: T.KnowledgeScore;
    gapScore: T.KnowledgeScore;
    expertiseScore: T.KnowledgeScore;
    qualityScore: T.KnowledgeScore;
    provenanceScore: T.KnowledgeScore;
    memoryScore: T.KnowledgeScore;
    evolutionScore: T.KnowledgeScore;
    riskScore: T.KnowledgeScore;
  };
}

export interface KnowledgeDashboard {
  compose(input: {
    scores: {
      healthScore: T.KnowledgeScore;
      coverageScore: T.KnowledgeScore;
      graphScore: T.KnowledgeScore;
      searchScore: T.KnowledgeScore;
      gapScore: T.KnowledgeScore;
      expertiseScore: T.KnowledgeScore;
      qualityScore: T.KnowledgeScore;
      provenanceScore: T.KnowledgeScore;
      memoryScore: T.KnowledgeScore;
      evolutionScore: T.KnowledgeScore;
    };
    baseline: T.KnowledgeBaseline;
    risks: T.KnowledgeRiskRecord[];
    opportunities: T.KnowledgeOpportunityRecord[];
    now: Date;
  }): T.KnowledgeDashboardResult;
}

export interface KnowledgeHealth {
  assess(input: {
    baseline: T.KnowledgeBaseline;
    scores: {
      healthScore: T.KnowledgeScore;
      coverageScore: T.KnowledgeScore;
      graphScore: T.KnowledgeScore;
      searchScore: T.KnowledgeScore;
      gapScore: T.KnowledgeScore;
      expertiseScore: T.KnowledgeScore;
      qualityScore: T.KnowledgeScore;
      provenanceScore: T.KnowledgeScore;
      memoryScore: T.KnowledgeScore;
      evolutionScore: T.KnowledgeScore;
      riskScore: T.KnowledgeScore;
    };
    catalog: T.KnowledgeCatalogResult;
    graph: T.KnowledgeGraphResult;
  }): T.KnowledgeHealthResult;
}

export interface KnowledgeCaptureEngine {
  catalog(input: {
    baseline: T.KnowledgeBaseline;
    now: Date;
  }): T.KnowledgeCatalogResult;
}

export interface KnowledgeGraphEngine {
  build(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    now: Date;
  }): T.KnowledgeGraphResult;
}

export interface KnowledgeSearchEngine {
  index(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    graph: T.KnowledgeGraphResult;
    now: Date;
  }): T.KnowledgeSearchResult;
}

export interface KnowledgeReasoner {
  reason(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    graph: T.KnowledgeGraphResult;
    search: T.KnowledgeSearchResult;
    question?: string;
    now: Date;
  }): T.KnowledgeReasoningResult;
}

export interface KnowledgeGapEngine {
  analyze(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    graph: T.KnowledgeGraphResult;
    reasoning: T.KnowledgeReasoningResult;
    now: Date;
  }): T.KnowledgeGapResult;
}

export interface ExpertiseMapEngine {
  map(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    now: Date;
  }): T.ExpertiseMapResult;
}

/** Enrich and summarize provenance retained on every artifact. */
export interface KnowledgeProvenanceEngine {
  assess(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    now: Date;
  }): T.KnowledgeProvenanceSuite;
}

export interface KnowledgeValidation {
  assess(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    now: Date;
  }): T.KnowledgeValidationResult;
}

export interface KnowledgeFreshness {
  assess(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    now: Date;
  }): T.KnowledgeFreshnessResult;
}

export interface KnowledgeCompleteness {
  assess(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    now: Date;
  }): T.KnowledgeCompletenessResult;
}

export interface KnowledgeAccuracy {
  assess(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    now: Date;
  }): T.KnowledgeAccuracyResult;
}

export interface KnowledgeConsistency {
  assess(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    graph: T.KnowledgeGraphResult;
    now: Date;
  }): T.KnowledgeConsistencyResult;
}

export interface KnowledgeConflictDetection {
  detect(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    graph: T.KnowledgeGraphResult;
    now: Date;
  }): T.KnowledgeConflictDetectionResult;
}

export interface KnowledgeRedundancyDetection {
  detect(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    search: T.KnowledgeSearchResult;
    now: Date;
  }): T.KnowledgeRedundancyDetectionResult;
}

export interface KnowledgeCoverageAnalysis {
  analyze(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    now: Date;
  }): T.KnowledgeCoverageAnalysisResult;
}

export interface KnowledgeLifecycleManagement {
  manage(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    now: Date;
  }): T.KnowledgeLifecycleManagementResult;
}

/** Composes all quality sub-analyzers into a KnowledgeQualitySuite. */
export interface KnowledgeQualityEngine {
  assess(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    graph: T.KnowledgeGraphResult;
    search: T.KnowledgeSearchResult;
    now: Date;
  }): T.KnowledgeQualitySuite;
}

/** Capture and preserve organizational institutional memory. */
export interface OrganizationalMemoryEngine {
  capture(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    provenance: T.KnowledgeProvenanceSuite;
    now: Date;
  }): T.OrganizationalMemorySuite;
}

/** Continuously evolve knowledge: stale, conflicts, updates, gaps, expertise. */
export interface KnowledgeEvolutionEngine {
  evolve(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    quality: T.KnowledgeQualitySuite;
    gaps: T.KnowledgeGapResult;
    reasoning: T.KnowledgeReasoningResult;
    expertiseMap: T.ExpertiseMapResult;
    organizationalMemory: T.OrganizationalMemorySuite;
    now: Date;
  }): T.KnowledgeEvolutionResult;
}

/** Trace every recommendation back to knowledge, confidence, source, validation. */
export interface DecisionTraceabilityEngine {
  trace(input: {
    recommendations: T.KnowledgeRecommendationRecord[];
    catalog: T.KnowledgeCatalogResult;
    provenance: T.KnowledgeProvenanceSuite;
    now: Date;
  }): T.DecisionTraceabilityResult;
}

export interface KnowledgeRiskAnalyzer {
  analyze(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    graph: T.KnowledgeGraphResult;
    search: T.KnowledgeSearchResult;
    gaps: T.KnowledgeGapResult;
    expertiseMap: T.ExpertiseMapResult;
    now: Date;
  }): T.KnowledgeRiskRecord[];
}

export interface KnowledgeOpportunityAnalyzer {
  analyze(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    graph: T.KnowledgeGraphResult;
    gaps: T.KnowledgeGapResult;
    expertiseMap: T.ExpertiseMapResult;
    now: Date;
  }): T.KnowledgeOpportunityRecord[];
}

export interface KnowledgeRecommendationComposer {
  compose(input: {
    opportunities: T.KnowledgeOpportunityRecord[];
    risks: T.KnowledgeRiskRecord[];
    catalog: T.KnowledgeCatalogResult;
    gaps: T.KnowledgeGapResult;
    provenance: T.KnowledgeProvenanceSuite;
    now: Date;
  }): T.KnowledgeRecommendationRecord[];
}

export interface ExecutiveKnowledgeBriefGenerator {
  generate(input: {
    request: T.KnowledgeRequest;
    baseline: T.KnowledgeBaseline;
    scores: {
      healthScore: T.KnowledgeScore;
      coverageScore: T.KnowledgeScore;
      graphScore: T.KnowledgeScore;
      searchScore: T.KnowledgeScore;
      gapScore: T.KnowledgeScore;
      expertiseScore: T.KnowledgeScore;
      qualityScore: T.KnowledgeScore;
      provenanceScore: T.KnowledgeScore;
      memoryScore: T.KnowledgeScore;
      evolutionScore: T.KnowledgeScore;
    };
    risks: T.KnowledgeRiskRecord[];
    opportunities: T.KnowledgeOpportunityRecord[];
    catalog: T.KnowledgeCatalogResult;
    recommendations: T.KnowledgeRecommendationRecord[];
    confidence: T.KnowledgeConfidenceScore;
    now: Date;
  }): T.ExecutiveKnowledgeBrief;
}

export interface KnowledgeProjection {
  project(input: {
    request: T.KnowledgeRequest;
    healthScore: T.KnowledgeScore;
    coverageScore: T.KnowledgeScore;
    graphScore: T.KnowledgeScore;
    searchScore: T.KnowledgeScore;
    gapScore: T.KnowledgeScore;
    expertiseScore: T.KnowledgeScore;
    qualityScore: T.KnowledgeScore;
    provenanceScore: T.KnowledgeScore;
    memoryScore: T.KnowledgeScore;
    evolutionScore: T.KnowledgeScore;
    catalog: T.KnowledgeCatalogResult;
    graph: T.KnowledgeGraphResult;
    search: T.KnowledgeSearchResult;
    reasoning: T.KnowledgeReasoningResult;
    gaps: T.KnowledgeGapResult;
    expertiseMap: T.ExpertiseMapResult;
    provenance: T.KnowledgeProvenanceSuite;
    quality: T.KnowledgeQualitySuite;
    organizationalMemory: T.OrganizationalMemorySuite;
    evolution: T.KnowledgeEvolutionResult;
    decisionTraceability: T.DecisionTraceabilityResult;
    brief: T.ExecutiveKnowledgeBrief;
    confidence: T.KnowledgeConfidenceScore;
    dashboard: T.KnowledgeDashboardResult;
    baseline: T.KnowledgeBaseline;
  }): T.KnowledgeProjectionResult;
}

export interface KnowledgeQueries {
  ask(
    result: T.KnowledgeResult,
    request: T.KnowledgeQueryRequest
  ): T.KnowledgeQueryResult;
}

export interface KnowledgeRepository {
  save(result: T.KnowledgeResult): T.KnowledgeResult;
  get(requestId: string): T.KnowledgeResult | null;
  list(scope?: Partial<T.GraphScope>): T.KnowledgeResult[];
  remove(requestId: string): boolean;
  saveHistory(
    record: T.KnowledgeHistoryRecord
  ): T.KnowledgeHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.KnowledgeHistoryRecord[];
  clear(): void;
}

export interface KnowledgeRegistry {
  register(domain: string, capability: string): void;
  list(): T.KnowledgePublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}

export interface KnowledgeIntelligenceService {
  build(request: T.KnowledgeRequest): T.KnowledgeResult;
  query(
    result: T.KnowledgeResult,
    request: T.KnowledgeQueryRequest
  ): T.KnowledgeQueryResult;
  repository(): KnowledgeRepository;
}

/** Alias matching Sprint naming. */
export type KnowledgeService = KnowledgeIntelligenceService;

/** DI bag for the full Knowledge Intelligence stack. */
export interface KnowledgeDependencies {
  engine?: KnowledgeIntelligenceEngine;
  knowledgeIntelligence?: KnowledgeIntelligence;
  knowledgeDashboard?: KnowledgeDashboard;
  knowledgeHealth?: KnowledgeHealth;
  knowledgeCaptureEngine?: KnowledgeCaptureEngine;
  knowledgeGraphEngine?: KnowledgeGraphEngine;
  knowledgeSearchEngine?: KnowledgeSearchEngine;
  knowledgeReasoner?: KnowledgeReasoner;
  knowledgeGapEngine?: KnowledgeGapEngine;
  expertiseMapEngine?: ExpertiseMapEngine;
  knowledgeProvenanceEngine?: KnowledgeProvenanceEngine;
  knowledgeValidation?: KnowledgeValidation;
  knowledgeFreshness?: KnowledgeFreshness;
  knowledgeCompleteness?: KnowledgeCompleteness;
  knowledgeAccuracy?: KnowledgeAccuracy;
  knowledgeConsistency?: KnowledgeConsistency;
  knowledgeConflictDetection?: KnowledgeConflictDetection;
  knowledgeRedundancyDetection?: KnowledgeRedundancyDetection;
  knowledgeCoverageAnalysis?: KnowledgeCoverageAnalysis;
  knowledgeLifecycleManagement?: KnowledgeLifecycleManagement;
  knowledgeQualityEngine?: KnowledgeQualityEngine;
  organizationalMemoryEngine?: OrganizationalMemoryEngine;
  knowledgeEvolutionEngine?: KnowledgeEvolutionEngine;
  decisionTraceabilityEngine?: DecisionTraceabilityEngine;
  knowledgeRiskAnalyzer?: KnowledgeRiskAnalyzer;
  knowledgeOpportunityAnalyzer?: KnowledgeOpportunityAnalyzer;
  knowledgeRecommendationComposer?: KnowledgeRecommendationComposer;
  briefGenerator?: ExecutiveKnowledgeBriefGenerator;
  projection?: KnowledgeProjection;
  queries?: KnowledgeQueries;
  registry?: KnowledgeRegistry;
  repository?: KnowledgeRepository;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
