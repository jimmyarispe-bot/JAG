/**
 * Document Intelligence — public API (Sprint 041 / 0.1.0).
 */

export {
  DOCUMENT_ARTIFACT_STATUSES,
  DOCUMENT_CAPABILITIES,
  DOCUMENT_COMPLIANCE_TAGS,
  DOCUMENT_CONFIDENCE_LEVELS,
  DOCUMENT_HEALTH_STATUSES,
  DOCUMENT_INTELLIGENCE_VERSION,
  DOCUMENT_PRIORITY_BANDS,
  DOCUMENT_RELATION_KINDS,
  DOCUMENT_RISK_CATEGORIES,
  DOCUMENT_TYPES,
  type BoardGovernanceResultLight,
  type ComplianceDashboardResult,
  type ContractDashboardResult,
  type CustomerResultLight,
  type DecisionResultLight,
  type DocumentArtifactStatus,
  type DocumentBaseline,
  type DocumentCapability,
  type DocumentCatalogResult,
  type DocumentClauseRecord,
  type DocumentClauseSuite,
  type DocumentClassificationResult,
  type DocumentComplianceSuite,
  type DocumentComplianceTag,
  type DocumentConfidenceLevel,
  type DocumentConfidenceScore,
  type DocumentDashboardResult,
  type DocumentDuplicateCluster,
  type DocumentDuplicateSuite,
  type DocumentEntityRecord,
  type DocumentEntitySuite,
  type DocumentExpirationSuite,
  type DocumentHealthResult,
  type DocumentHealthStatus,
  type DocumentHistoryRecord,
  type DocumentKnowledgeContribution,
  type DocumentKnowledgeDraft,
  type DocumentLensImpact,
  type DocumentMetadata,
  type DocumentMetadataSuite,
  type DocumentOpportunityRecord,
  type DocumentParseResult,
  type DocumentPriorityBand,
  type DocumentProjectionResult,
  type DocumentPublisher,
  type DocumentQueryRequest,
  type DocumentQueryResult,
  type DocumentReasoningResult,
  type DocumentRecommendationRecord,
  type DocumentRecord,
  type DocumentRelationKind,
  type DocumentRelationshipRecord,
  type DocumentRelationshipSuite,
  type DocumentRequest,
  type DocumentResult,
  type DocumentRiskCategory,
  type DocumentRiskFlag,
  type DocumentRiskRecord,
  type DocumentRiskSuite,
  type DocumentScore,
  type DocumentSummarizationSuite,
  type DocumentSummaryRecord,
  type DocumentType,
  type DocumentVersionComparison,
  type DocumentVersionSuite,
  type ExecutiveDocumentBrief,
  type FundingResultLight,
  type GrantDashboardResult,
  type GraphScope,
  type HumanCapitalResultLight,
  type KnowledgeResultLight,
  type OperationsResultLight,
  type PolicyDashboardResult,
  type RevenueResultLight,
} from "@/lib/platform/intelligence/document/types";

export type {
  DocumentClassifier as DocumentClassifierContract,
  DocumentDashboard as DocumentDashboardContract,
  DocumentDependencies,
  DocumentEngine as DocumentEngineContract,
  DocumentEntityRelationshipIntelligence as DocumentEntityRelationshipIntelligenceContract,
  DocumentExpirationIntelligence as DocumentExpirationIntelligenceContract,
  DocumentHealth as DocumentHealthContract,
  DocumentIntelligence as DocumentIntelligenceContract,
  DocumentIntelligenceEngine as DocumentIntelligenceEngineContract,
  DocumentIntelligenceService as DocumentIntelligenceServiceContract,
  DocumentKnowledgeContributionEngine as DocumentKnowledgeContributionEngineContract,
  DocumentMetadataIntelligence as DocumentMetadataIntelligenceContract,
  DocumentOpportunityAnalyzer as DocumentOpportunityAnalyzerContract,
  DocumentParser as DocumentParserContract,
  DocumentProjection as DocumentProjectionContract,
  DocumentQueries as DocumentQueriesContract,
  DocumentReasoner as DocumentReasonerContract,
  DocumentRecommendationComposer as DocumentRecommendationComposerContract,
  DocumentRegistry as DocumentRegistryContract,
  DocumentRepository as DocumentRepositoryContract,
  DocumentRiskAnalyzer as DocumentRiskAnalyzerContract,
  DocumentRiskComplianceIntelligence as DocumentRiskComplianceIntelligenceContract,
  DocumentService as DocumentServiceContract,
  DocumentSpecializedDashboards as DocumentSpecializedDashboardsContract,
  DocumentSummarizationClauseIntelligence as DocumentSummarizationClauseIntelligenceContract,
  DocumentVersionDuplicateIntelligence as DocumentVersionDuplicateIntelligenceContract,
  ExecutiveDocumentBriefGenerator as ExecutiveDocumentBriefGeneratorContract,
} from "@/lib/platform/intelligence/document/contracts";

export {
  buildConfidence,
  buildLenses,
  clamp,
  clamp01,
  defaultCreateId,
  defaultDocumentBaseline,
  defaultPeriodLabel,
  deriveDocumentBaseline,
  documentModels,
  DocumentModels,
  emptyDocumentScope,
  levelFromValue,
  priorityFromRisk,
  priorityFromScore,
  scoreNarrative,
  statusFromScore,
} from "@/lib/platform/intelligence/document/models";

export { DocumentParser } from "@/lib/platform/intelligence/document/document-parser";
export { DocumentClassifier } from "@/lib/platform/intelligence/document/document-classifier";
export { DocumentMetadataIntelligence } from "@/lib/platform/intelligence/document/metadata-intelligence";
export { DocumentEntityRelationshipIntelligence } from "@/lib/platform/intelligence/document/entity-relationship-intelligence";
export { DocumentVersionDuplicateIntelligence } from "@/lib/platform/intelligence/document/version-duplicate-intelligence";
export { DocumentSummarizationClauseIntelligence } from "@/lib/platform/intelligence/document/summarization-clause-intelligence";
export { DocumentRiskComplianceIntelligence } from "@/lib/platform/intelligence/document/risk-compliance-intelligence";
export { DocumentExpirationIntelligence } from "@/lib/platform/intelligence/document/expiration-intelligence";
export { DocumentKnowledgeContributionEngine } from "@/lib/platform/intelligence/document/knowledge-contribution";
export { DocumentReasoner } from "@/lib/platform/intelligence/document/document-reasoner";
export {
  defaultDocumentConfidence,
  DocumentDashboard,
  DocumentHealth,
  DocumentIntelligence,
  DocumentOpportunityAnalyzer,
  DocumentRecommendationComposer,
  DocumentRiskAnalyzer,
  DocumentSpecializedDashboards,
  ExecutiveDocumentBriefGenerator,
} from "@/lib/platform/intelligence/document/document-intelligence";
export { DocumentProjection, DocumentQueries } from "@/lib/platform/intelligence/document/projection";
export { DocumentRegistry, DocumentRegistryStore } from "@/lib/platform/intelligence/document/document-registry";
export { DocumentRepository, DocumentRepositoryStore } from "@/lib/platform/intelligence/document/repository";
export {
  DocumentEngine,
  DocumentEngineImpl,
  DocumentIntelligenceEngine,
  DocumentIntelligenceEngineImpl,
} from "@/lib/platform/intelligence/document/document-engine";
export {
  DocumentIntelligenceService,
  DocumentIntelligenceServiceImpl,
  DocumentService,
  DocumentServiceImpl,
} from "@/lib/platform/intelligence/document/service";

import { DocumentIntelligenceEngine } from "@/lib/platform/intelligence/document/document-engine";
import type { DocumentDependencies } from "@/lib/platform/intelligence/document/contracts";
import { DocumentIntelligenceService } from "@/lib/platform/intelligence/document/service";
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

export interface DocumentStack {
  service: DocumentIntelligenceService;
  engine: DocumentIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateDocumentOptions extends DocumentDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createDocumentIntelligence(options: CreateDocumentOptions = {}): DocumentStack {
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
            options.oiosOptions?.organizationDnaStack ?? organizationDna ?? undefined,
          wireOrganizationDna: false,
        })
      : null);
  const engine = new DocumentIntelligenceEngine(options);
  const service = new DocumentIntelligenceService({ ...options, engine });

  return { service, engine, organizationDna, oios };
}
