/**
 * Knowledge Intelligence — public API (Sprint 040 / 0.2.0).
 *
 * Continuously capture, organize, connect, retrieve, reason over, preserve,
 * and evolve organizational institutional memory.
 *
 * Distinct from foundation IntelligenceKnowledgeService (re-exported below).
 */

export {
  IntelligenceKnowledgeService,
  type IntelligenceKnowledgeNode,
  type IntelligenceKnowledgeQuery,
  type IntelligenceKnowledgeResult,
  type UpsertIntelligenceKnowledgeInput,
} from "@/lib/platform/intelligence/knowledge/foundation";

export {
  EXPERTISE_DOMAINS,
  KNOWLEDGE_APPROVAL_STATUSES,
  KNOWLEDGE_ARTIFACT_STATUSES,
  KNOWLEDGE_CONFIDENCE_LEVELS,
  KNOWLEDGE_EVOLUTION_ACTIONS,
  KNOWLEDGE_GAP_CATEGORIES,
  KNOWLEDGE_HEALTH_STATUSES,
  KNOWLEDGE_INTELLIGENCE_VERSION,
  KNOWLEDGE_PRIORITY_BANDS,
  KNOWLEDGE_QUALITY_DIMENSIONS,
  KNOWLEDGE_RELATION_KINDS,
  KNOWLEDGE_SOURCES,
  KNOWLEDGE_SOURCE_TYPES,
  KNOWLEDGE_TYPES,
  ORGANIZATIONAL_MEMORY_KINDS,
  type CustomerResultLight,
  type DecisionTraceabilityResult,
  type ExecutiveKnowledgeBrief,
  type ExpertiseDomain,
  type ExpertiseDomainRecord,
  type ExpertiseMapResult,
  type GraphScope,
  type HumanCapitalResultLight,
  type KnowledgeApprovalStatus,
  type KnowledgeArtifactRecord,
  type KnowledgeArtifactStatus,
  type KnowledgeBaseline,
  type KnowledgeCatalogResult,
  type KnowledgeConfidenceLevel,
  type KnowledgeConfidenceScore,
  type KnowledgeConflictDetectionResult,
  type KnowledgeConflictRecord,
  type KnowledgeCoverageAnalysisResult,
  type KnowledgeDashboardResult,
  type KnowledgeDecisionTrace,
  type KnowledgeEvolutionAction,
  type KnowledgeEvolutionActionRecord,
  type KnowledgeEvolutionResult,
  type KnowledgeFreshnessResult,
  type KnowledgeGapCategory,
  type KnowledgeGapRecord,
  type KnowledgeGapResult,
  type KnowledgeGraphEdge,
  type KnowledgeGraphNode,
  type KnowledgeGraphResult,
  type KnowledgeHealthResult,
  type KnowledgeHealthStatus,
  type KnowledgeHistoryRecord,
  type KnowledgeLensImpact,
  type KnowledgeLifecycleManagementResult,
  type KnowledgeMetadata,
  type KnowledgeOpportunityRecord,
  type KnowledgePriorityBand,
  type KnowledgeProjectionResult,
  type KnowledgeProvenanceRecord,
  type KnowledgeProvenanceSuite,
  type KnowledgePublisher,
  type KnowledgeQualityDimension,
  type KnowledgeQualityDimensionRecord,
  type KnowledgeQualitySuite,
  type KnowledgeQueryRequest,
  type KnowledgeQueryResult,
  type KnowledgeRecommendationRecord,
  type KnowledgeRedundancyDetectionResult,
  type KnowledgeRelationKind,
  type KnowledgeRequest,
  type KnowledgeResult,
  type KnowledgeRiskRecord,
  type KnowledgeScore,
  type KnowledgeSearchHit,
  type KnowledgeSearchResult,
  type KnowledgeSource,
  type KnowledgeSourceType,
  type KnowledgeType,
  type KnowledgeAccuracyResult,
  type KnowledgeCompletenessResult,
  type KnowledgeConsistencyResult,
  type KnowledgeReasoningResult,
  type KnowledgeValidationResult,
  type KnowledgeVersionEntry,
  type OperationsResultLight,
  type OrganizationalMemoryKind,
  type OrganizationalMemoryRecord,
  type OrganizationalMemorySuite,
} from "@/lib/platform/intelligence/knowledge/types";

export type {
  DecisionTraceabilityEngine as DecisionTraceabilityEngineContract,
  ExpertiseMapEngine as ExpertiseMapEngineContract,
  ExecutiveKnowledgeBriefGenerator as ExecutiveKnowledgeBriefGeneratorContract,
  KnowledgeAccuracy as KnowledgeAccuracyContract,
  KnowledgeCaptureEngine as KnowledgeCaptureEngineContract,
  KnowledgeCompleteness as KnowledgeCompletenessContract,
  KnowledgeConflictDetection as KnowledgeConflictDetectionContract,
  KnowledgeConsistency as KnowledgeConsistencyContract,
  KnowledgeCoverageAnalysis as KnowledgeCoverageAnalysisContract,
  KnowledgeDashboard as KnowledgeDashboardContract,
  KnowledgeDependencies,
  KnowledgeEngine as KnowledgeEngineContract,
  KnowledgeEvolutionEngine as KnowledgeEvolutionEngineContract,
  KnowledgeFreshness as KnowledgeFreshnessContract,
  KnowledgeGapEngine as KnowledgeGapEngineContract,
  KnowledgeGraphEngine as KnowledgeGraphEngineContract,
  KnowledgeHealth as KnowledgeHealthContract,
  KnowledgeIntelligence as KnowledgeIntelligenceContract,
  KnowledgeIntelligenceEngine as KnowledgeIntelligenceEngineContract,
  KnowledgeIntelligenceService as KnowledgeIntelligenceServiceContract,
  KnowledgeLifecycleManagement as KnowledgeLifecycleManagementContract,
  KnowledgeOpportunityAnalyzer as KnowledgeOpportunityAnalyzerContract,
  KnowledgeProjection as KnowledgeProjectionContract,
  KnowledgeProvenanceEngine as KnowledgeProvenanceEngineContract,
  KnowledgeQualityEngine as KnowledgeQualityEngineContract,
  KnowledgeQueries as KnowledgeQueriesContract,
  KnowledgeReasoner as KnowledgeReasonerContract,
  KnowledgeRecommendationComposer as KnowledgeRecommendationComposerContract,
  KnowledgeRedundancyDetection as KnowledgeRedundancyDetectionContract,
  KnowledgeRegistry as KnowledgeRegistryContract,
  KnowledgeRepository as KnowledgeRepositoryContract,
  KnowledgeRiskAnalyzer as KnowledgeRiskAnalyzerContract,
  KnowledgeSearchEngine as KnowledgeSearchEngineContract,
  KnowledgeService as KnowledgeServiceContract,
  KnowledgeValidation as KnowledgeValidationContract,
  OrganizationalMemoryEngine as OrganizationalMemoryEngineContract,
} from "@/lib/platform/intelligence/knowledge/contracts";

export {
  buildConfidence,
  buildLenses,
  clamp,
  clamp01,
  defaultCreateId,
  defaultKnowledgeBaseline,
  defaultPeriodLabel,
  deriveKnowledgeBaseline,
  emptyKnowledgeScope,
  knowledgeModels,
  KnowledgeModels,
  levelFromValue,
  priorityFromRisk,
  priorityFromScore,
  scoreNarrative,
  statusFromScore,
} from "@/lib/platform/intelligence/knowledge/models";

export { KnowledgeCaptureEngine } from "@/lib/platform/intelligence/knowledge/capture-intelligence";

export { KnowledgeProvenanceEngine } from "@/lib/platform/intelligence/knowledge/provenance-intelligence";

export {
  KnowledgeAccuracy,
  KnowledgeCompleteness,
  KnowledgeConflictDetection,
  KnowledgeConsistency,
  KnowledgeCoverageAnalysis,
  KnowledgeFreshness,
  KnowledgeLifecycleManagement,
  KnowledgeQualityEngine,
  KnowledgeRedundancyDetection,
  KnowledgeValidation,
} from "@/lib/platform/intelligence/knowledge/quality-intelligence";

export { OrganizationalMemoryEngine } from "@/lib/platform/intelligence/knowledge/memory-intelligence";

export { KnowledgeEvolutionEngine } from "@/lib/platform/intelligence/knowledge/evolution-intelligence";

export { DecisionTraceabilityEngine } from "@/lib/platform/intelligence/knowledge/traceability-intelligence";

export {
  KnowledgeGraphEngine,
  KnowledgeSearchEngine,
} from "@/lib/platform/intelligence/knowledge/graph-search-intelligence";

export {
  ExpertiseMapEngine,
  KnowledgeGapEngine,
  KnowledgeReasoner,
} from "@/lib/platform/intelligence/knowledge/reason-gap-intelligence";

export {
  KnowledgeRegistry,
  KnowledgeRegistryStore,
} from "@/lib/platform/intelligence/knowledge/knowledge-registry";

export {
  defaultKnowledgeConfidence,
  ExecutiveKnowledgeBriefGenerator,
  KnowledgeDashboard,
  KnowledgeHealth,
  KnowledgeIntelligence,
  KnowledgeOpportunityAnalyzer,
  KnowledgeRecommendationComposer,
  KnowledgeRiskAnalyzer,
} from "@/lib/platform/intelligence/knowledge/knowledge-intelligence";

export {
  KnowledgeProjection,
  KnowledgeQueries,
} from "@/lib/platform/intelligence/knowledge/projection";

export {
  KnowledgeRepository,
  KnowledgeRepositoryStore,
} from "@/lib/platform/intelligence/knowledge/repository";

export {
  KnowledgeEngine,
  KnowledgeEngineImpl,
  KnowledgeIntelligenceEngine,
  KnowledgeIntelligenceEngineImpl,
} from "@/lib/platform/intelligence/knowledge/knowledge-engine";

export {
  KnowledgeIntelligenceService,
  KnowledgeIntelligenceServiceImpl,
  KnowledgeService,
  KnowledgeServiceImpl,
} from "@/lib/platform/intelligence/knowledge/service";

import { KnowledgeIntelligenceEngine } from "@/lib/platform/intelligence/knowledge/knowledge-engine";
import type { KnowledgeDependencies } from "@/lib/platform/intelligence/knowledge/contracts";
import { KnowledgeIntelligenceService } from "@/lib/platform/intelligence/knowledge/service";
import {
  createOiosOperatingSystem,
  type CreateOiosOptions,
  type OiosStack,
} from "@/lib/platform/oios";
import {
  createOrganizationDnaIntelligence,
  type CreateOrganizationDnaOptions,
  type OrganizationDnaStack,
} from "@/lib/platform/intelligence/organization-dna";

/** Wired Knowledge Intelligence stack. */
export interface KnowledgeStack {
  service: KnowledgeIntelligenceService;
  engine: KnowledgeIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateKnowledgeOptions extends KnowledgeDependencies {
  /** Attach / create Organizational DNA stack. */
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  /** When true (default), auto-wire createOrganizationDnaIntelligence if not provided. */
  wireOrganizationDna?: boolean;
  /** Attach / create OIOS Core stack. */
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  /** When true (default), auto-wire createOiosOperatingSystem if not provided. */
  wireOios?: boolean;
}

/**
 * Create a fully wired Knowledge Intelligence stack (DI entry point).
 */
export function createKnowledgeIntelligence(
  options: CreateKnowledgeOptions = {}
): KnowledgeStack {
  const wireDna = options.wireOrganizationDna !== false;
  const wireOios = options.wireOios !== false;

  const organizationDna =
    options.organizationDna ??
    (wireDna
      ? createOrganizationDnaIntelligence({
          ...(options.organizationDnaOptions ?? {}),
          wireGraphAnalyzer: false,
          wireDecision: false,
          wirePredictive: false,
          wireBoardGovernance: false,
        })
      : null);

  const oios =
    options.oios ??
    (wireOios
      ? createOiosOperatingSystem({
          ...(options.oiosOptions ?? {}),
          organizationDnaStack:
            options.oiosOptions?.organizationDnaStack ??
            organizationDna ??
            undefined,
          wireOrganizationDna: false,
        })
      : null);

  const engine = new KnowledgeIntelligenceEngine(options);
  const service = new KnowledgeIntelligenceService({
    ...options,
    engine,
  });

  return {
    service,
    engine,
    organizationDna,
    oios,
  };
}
