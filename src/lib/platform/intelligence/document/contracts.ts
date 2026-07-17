/**
 * Document Intelligence — contracts only (Sprint 041).
 *
 * Leaf module: imports types only, never implementations.
 */

import type * as T from "@/lib/platform/intelligence/document/types";

export interface DocumentIntelligenceEngine {
  build(request: T.DocumentRequest): T.DocumentResult;
}

export type DocumentEngine = DocumentIntelligenceEngine;

export interface DocumentParser {
  parse(input: { baseline: T.DocumentBaseline; now: Date }): T.DocumentParseResult;
}

export interface DocumentClassifier {
  classify(input: {
    baseline: T.DocumentBaseline;
    parse: T.DocumentParseResult;
    now: Date;
  }): T.DocumentClassificationResult;
  catalog(input: {
    baseline: T.DocumentBaseline;
    classification: T.DocumentClassificationResult;
    now: Date;
    createId: (prefix: string) => string;
  }): T.DocumentCatalogResult;
}

export interface DocumentMetadataIntelligence {
  extract(input: { baseline: T.DocumentBaseline; catalog: T.DocumentCatalogResult; now: Date }): T.DocumentMetadataSuite;
}

export interface DocumentEntityRelationshipIntelligence {
  extractEntities(input: { baseline: T.DocumentBaseline; catalog: T.DocumentCatalogResult; now: Date }): T.DocumentEntitySuite;
  extractRelationships(input: {
    baseline: T.DocumentBaseline;
    catalog: T.DocumentCatalogResult;
    entities: T.DocumentEntitySuite;
    now: Date;
  }): T.DocumentRelationshipSuite;
}

export interface DocumentVersionDuplicateIntelligence {
  compareVersions(input: { baseline: T.DocumentBaseline; catalog: T.DocumentCatalogResult; now: Date }): T.DocumentVersionSuite;
  detectDuplicates(input: {
    baseline: T.DocumentBaseline;
    catalog: T.DocumentCatalogResult;
    versions: T.DocumentVersionSuite;
    now: Date;
  }): T.DocumentDuplicateSuite;
}

export interface DocumentSummarizationClauseIntelligence {
  summarize(input: { baseline: T.DocumentBaseline; catalog: T.DocumentCatalogResult; now: Date }): T.DocumentSummarizationSuite;
  extractClauses(input: {
    baseline: T.DocumentBaseline;
    catalog: T.DocumentCatalogResult;
    summarization: T.DocumentSummarizationSuite;
    now: Date;
  }): T.DocumentClauseSuite;
}

export interface DocumentRiskComplianceIntelligence {
  identifyRisks(input: {
    baseline: T.DocumentBaseline;
    catalog: T.DocumentCatalogResult;
    clauses: T.DocumentClauseSuite;
    duplicates: T.DocumentDuplicateSuite;
    versions: T.DocumentVersionSuite;
    now: Date;
  }): T.DocumentRiskSuite;
  tagCompliance(input: {
    baseline: T.DocumentBaseline;
    catalog: T.DocumentCatalogResult;
    riskSuite: T.DocumentRiskSuite;
    now: Date;
  }): T.DocumentComplianceSuite;
}

export interface DocumentExpirationIntelligence {
  monitor(input: { baseline: T.DocumentBaseline; catalog: T.DocumentCatalogResult; now: Date }): T.DocumentExpirationSuite;
}

export interface DocumentKnowledgeContributionEngine {
  contribute(input: {
    baseline: T.DocumentBaseline;
    catalog: T.DocumentCatalogResult;
    summarization: T.DocumentSummarizationSuite;
    compliance: T.DocumentComplianceSuite;
    now: Date;
  }): T.DocumentKnowledgeContribution;
}

export interface DocumentReasoner {
  reason(input: {
    baseline: T.DocumentBaseline;
    catalog: T.DocumentCatalogResult;
    relationships: T.DocumentRelationshipSuite;
    riskSuite: T.DocumentRiskSuite;
    question?: string;
    now: Date;
  }): T.DocumentReasoningResult;
}

export interface DocumentIntelligence {
  composeScores(input: {
    baseline: T.DocumentBaseline;
    catalog: T.DocumentCatalogResult;
    parse: T.DocumentParseResult;
    classification: T.DocumentClassificationResult;
    metadata: T.DocumentMetadataSuite;
    entities: T.DocumentEntitySuite;
    relationships: T.DocumentRelationshipSuite;
    versions: T.DocumentVersionSuite;
    duplicates: T.DocumentDuplicateSuite;
    summarization: T.DocumentSummarizationSuite;
    clauses: T.DocumentClauseSuite;
    riskSuite: T.DocumentRiskSuite;
    compliance: T.DocumentComplianceSuite;
    expiration: T.DocumentExpirationSuite;
    knowledgeContribution: T.DocumentKnowledgeContribution;
    reasoning: T.DocumentReasoningResult;
    risks: T.DocumentRiskRecord[];
    opportunities: T.DocumentOpportunityRecord[];
  }): {
    healthScore: T.DocumentScore;
    knowledgeScore: T.DocumentScore;
    catalogScore: T.DocumentScore;
    classificationScore: T.DocumentScore;
    metadataScore: T.DocumentScore;
    entityScore: T.DocumentScore;
    relationshipScore: T.DocumentScore;
    versionScore: T.DocumentScore;
    duplicateScore: T.DocumentScore;
    summaryScore: T.DocumentScore;
    clauseScore: T.DocumentScore;
    riskScore: T.DocumentScore;
    complianceScore: T.DocumentScore;
    expirationScore: T.DocumentScore;
    contributionScore: T.DocumentScore;
  };
}

export interface DocumentHealth {
  assess(input: {
    baseline: T.DocumentBaseline;
    scores: ReturnType<DocumentIntelligence["composeScores"]>;
    catalog: T.DocumentCatalogResult;
    expiration: T.DocumentExpirationSuite;
  }): T.DocumentHealthResult;
}

export interface DocumentDashboard {
  compose(input: {
    scores: ReturnType<DocumentIntelligence["composeScores"]>;
    risks: T.DocumentRiskRecord[];
    opportunities: T.DocumentOpportunityRecord[];
    now: Date;
  }): T.DocumentDashboardResult;
}

export interface DocumentSpecializedDashboards {
  contracts(input: {
    catalog: T.DocumentCatalogResult;
    versions: T.DocumentVersionSuite;
    clauses: T.DocumentClauseSuite;
    expiration: T.DocumentExpirationSuite;
    now: Date;
  }): T.ContractDashboardResult;
  policies(input: {
    catalog: T.DocumentCatalogResult;
    versions: T.DocumentVersionSuite;
    metadata: T.DocumentMetadataSuite;
    now: Date;
  }): T.PolicyDashboardResult;
  grants(input: {
    catalog: T.DocumentCatalogResult;
    compliance: T.DocumentComplianceSuite;
    expiration: T.DocumentExpirationSuite;
    now: Date;
  }): T.GrantDashboardResult;
  compliance(input: {
    compliance: T.DocumentComplianceSuite;
    riskSuite: T.DocumentRiskSuite;
    now: Date;
  }): T.ComplianceDashboardResult;
}

export interface DocumentRiskAnalyzer {
  analyze(input: {
    baseline: T.DocumentBaseline;
    catalog: T.DocumentCatalogResult;
    riskSuite: T.DocumentRiskSuite;
    expiration: T.DocumentExpirationSuite;
    now: Date;
  }): T.DocumentRiskRecord[];
}

export interface DocumentOpportunityAnalyzer {
  analyze(input: {
    baseline: T.DocumentBaseline;
    catalog: T.DocumentCatalogResult;
    compliance: T.DocumentComplianceSuite;
    knowledgeContribution: T.DocumentKnowledgeContribution;
    now: Date;
  }): T.DocumentOpportunityRecord[];
}

export interface DocumentRecommendationComposer {
  compose(input: {
    risks: T.DocumentRiskRecord[];
    opportunities: T.DocumentOpportunityRecord[];
    catalog: T.DocumentCatalogResult;
    knowledgeContribution: T.DocumentKnowledgeContribution;
    now: Date;
  }): T.DocumentRecommendationRecord[];
}

export interface ExecutiveDocumentBriefGenerator {
  generate(input: {
    request: T.DocumentRequest;
    scores: ReturnType<DocumentIntelligence["composeScores"]>;
    risks: T.DocumentRiskRecord[];
    opportunities: T.DocumentOpportunityRecord[];
    catalog: T.DocumentCatalogResult;
    recommendations: T.DocumentRecommendationRecord[];
    confidence: T.DocumentConfidenceScore;
    now: Date;
  }): T.ExecutiveDocumentBrief;
}

export interface DocumentProjection {
  project(input: {
    request: T.DocumentRequest;
    scores: ReturnType<DocumentIntelligence["composeScores"]>;
    catalog: T.DocumentCatalogResult;
    dashboard: T.DocumentDashboardResult;
    brief: T.ExecutiveDocumentBrief;
    confidence: T.DocumentConfidenceScore;
    baseline: T.DocumentBaseline;
  }): T.DocumentProjectionResult;
}

export interface DocumentQueries {
  ask(result: T.DocumentResult, request: T.DocumentQueryRequest): T.DocumentQueryResult;
}

export interface DocumentRepository {
  save(result: T.DocumentResult): T.DocumentResult;
  get(requestId: string): T.DocumentResult | null;
  list(scope?: Partial<T.GraphScope>): T.DocumentResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.DocumentHistoryRecord): T.DocumentHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.DocumentHistoryRecord[];
  clear(): void;
}

export interface DocumentRegistry {
  register(domain: string, capability: string): void;
  list(): T.DocumentPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}

export interface DocumentIntelligenceService {
  build(request: T.DocumentRequest): T.DocumentResult;
  query(result: T.DocumentResult, request: T.DocumentQueryRequest): T.DocumentQueryResult;
  repository(): DocumentRepository;
}

export type DocumentService = DocumentIntelligenceService;

export interface DocumentDependencies {
  engine?: DocumentIntelligenceEngine;
  documentParser?: DocumentParser;
  documentClassifier?: DocumentClassifier;
  metadataIntelligence?: DocumentMetadataIntelligence;
  entityRelationshipIntelligence?: DocumentEntityRelationshipIntelligence;
  versionDuplicateIntelligence?: DocumentVersionDuplicateIntelligence;
  summarizationClauseIntelligence?: DocumentSummarizationClauseIntelligence;
  riskComplianceIntelligence?: DocumentRiskComplianceIntelligence;
  expirationIntelligence?: DocumentExpirationIntelligence;
  knowledgeContributionEngine?: DocumentKnowledgeContributionEngine;
  documentReasoner?: DocumentReasoner;
  documentIntelligence?: DocumentIntelligence;
  documentHealth?: DocumentHealth;
  documentDashboard?: DocumentDashboard;
  specializedDashboards?: DocumentSpecializedDashboards;
  documentRiskAnalyzer?: DocumentRiskAnalyzer;
  documentOpportunityAnalyzer?: DocumentOpportunityAnalyzer;
  documentRecommendationComposer?: DocumentRecommendationComposer;
  briefGenerator?: ExecutiveDocumentBriefGenerator;
  projection?: DocumentProjection;
  queries?: DocumentQueries;
  registry?: DocumentRegistry;
  repository?: DocumentRepository;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
