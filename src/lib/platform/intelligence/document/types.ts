/**
 * Document Intelligence — shared DTOs and constants (Sprint 041).
 *
 * Converts organizational documents into classified, traceable, risk-aware
 * intelligence and validated knowledge contribution drafts.
 */

import type { OrganizationDNA, OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
  GraphScope,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";

export const DOCUMENT_INTELLIGENCE_VERSION = "0.1.0";

export type DocumentMetadata = Record<string, unknown>;
export type { GraphScope };

export const DOCUMENT_TYPES = [
  "policies",
  "procedures",
  "sops",
  "contracts",
  "employment_agreements",
  "board_packets",
  "meeting_minutes",
  "financial_statements",
  "budgets",
  "invoices",
  "purchase_orders",
  "grant_applications",
  "grant_awards",
  "compliance_documents",
  "licenses",
  "permits",
  "strategic_plans",
  "marketing_materials",
  "emails",
  "training_materials",
  "research",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export type DocumentConfidenceLevel = (typeof DOCUMENT_CONFIDENCE_LEVELS)[number];

export const DOCUMENT_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export type DocumentPriorityBand = (typeof DOCUMENT_PRIORITY_BANDS)[number];

export const DOCUMENT_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export type DocumentHealthStatus = (typeof DOCUMENT_HEALTH_STATUSES)[number];

export const DOCUMENT_ARTIFACT_STATUSES = [
  "draft",
  "parsed",
  "classified",
  "reviewed",
  "approved",
  "archived",
  "superseded",
  "expired",
] as const;
export type DocumentArtifactStatus = (typeof DOCUMENT_ARTIFACT_STATUSES)[number];

export const DOCUMENT_CAPABILITIES = [
  "ocr_ready",
  "metadata_extraction",
  "entity_extraction",
  "relationship_extraction",
  "version_comparison",
  "duplicate_detection",
  "summarization",
  "clause_extraction",
  "risk_identification",
  "compliance_tagging",
  "expiration_monitoring",
  "recommendation_generation",
  "knowledge_contribution",
] as const;
export type DocumentCapability = (typeof DOCUMENT_CAPABILITIES)[number];

export const DOCUMENT_RELATION_KINDS = [
  "references",
  "supersedes",
  "amends",
  "depends_on",
  "owned_by",
  "related_to",
  "evidences",
  "conflicts_with",
] as const;
export type DocumentRelationKind = (typeof DOCUMENT_RELATION_KINDS)[number];

export const DOCUMENT_RISK_CATEGORIES = [
  "expiration",
  "compliance_gap",
  "missing_clause",
  "duplicate",
  "stale_version",
  "ownership_gap",
  "decision_orphan",
  "knowledge_gap",
] as const;
export type DocumentRiskCategory = (typeof DOCUMENT_RISK_CATEGORIES)[number];

export const DOCUMENT_COMPLIANCE_TAGS = [
  "regulatory",
  "contractual",
  "policy",
  "grant",
  "employment",
  "financial",
  "board",
  "operational",
] as const;
export type DocumentComplianceTag = (typeof DOCUMENT_COMPLIANCE_TAGS)[number];

export interface DocumentLensImpact {
  whatIsIt: string;
  whyItMatters: string;
  whoOwnsIt: string;
  whenItExpires: string;
  knowledgeCreated: string;
  risksContained: string;
  decisionsDependent: string;
}

export interface DocumentConfidenceScore {
  value: number;
  level: DocumentConfidenceLevel;
  factors: Array<{ key: string; label: string; contribution: number }>;
}

export interface DocumentScore {
  key: string;
  label: string;
  value: number;
  status: DocumentHealthStatus;
  band: DocumentPriorityBand;
  narrative: string;
}

export interface KnowledgeResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  coverageScore?: { value?: number };
  contributionScore?: { value?: number };
  baseline?: { coverageScore?: number; validatedRatio?: number; gapPressure?: number };
  recommendations?: string[];
}

export interface OperationsResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  workflowScore?: { value?: number };
  baseline?: { operationsScore?: number; processCoverage?: number; backlogPressure?: number };
  recommendations?: string[];
}

export interface CustomerResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  engagementScore?: { value?: number };
  baseline?: { familyExperienceScore?: number; complaintBurden?: number; communicationCoverage?: number };
  recommendations?: string[];
}

export interface HumanCapitalResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  baseline?: { policyCoverage?: number; trainingCoverage?: number; successionReadiness?: number };
  knowledgeTransfer?: { overallScore?: number; criticalGaps?: number };
  recommendations?: string[];
}

export interface RevenueResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  baseline?: { revenueReliability?: number; billingAccuracy?: number; contractCoverage?: number };
  recommendations?: string[];
}

export interface FundingResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  baseline?: { grantReadiness?: number; awardCompliance?: number; pipelineCoverage?: number };
  recommendations?: string[];
}

export interface BoardGovernanceResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  baseline?: { policyGovernance?: number; minutesCoverage?: number; decisionTraceability?: number };
  recommendations?: string[];
}

export interface DecisionResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  decisionScore?: { value?: number };
  baseline?: { traceabilityScore?: number; dependencyDensity?: number; orphanDecisionRatio?: number };
  recommendations?: string[];
}

export interface DocumentBaseline {
  catalogCoverage: number;
  classificationAccuracy: number;
  metadataCompleteness: number;
  entityCoverage: number;
  relationshipDensity: number;
  versionHygiene: number;
  duplicatePressure: number;
  summaryCoverage: number;
  clauseCoverage: number;
  riskPressure: number;
  complianceCoverage: number;
  expirationRisk: number;
  knowledgeContributionScore: number;
  organizationHealthScore: number;
  executionScore: number;
  policyDensity: number;
  contractDensity: number;
  grantDensity: number;
  complianceDensity: number;
  operationsProcessDensity: number;
  humanCapitalDocDensity: number;
  revenueDocDensity: number;
  fundingDocDensity: number;
  boardDocDensity: number;
  decisionDependencyDensity: number;
  documentCount: number;
  expiredRatio: number;
  ocrReadiness: number;
}

export interface DocumentEntityRecord {
  id: string;
  documentId: string;
  label: string;
  kind: "person" | "organization" | "date" | "money" | "policy" | "location" | "topic";
  confidence: number;
}

export interface DocumentRelationshipRecord {
  id: string;
  fromDocumentId: string;
  toDocumentId: string;
  kind: DocumentRelationKind;
  strength: number;
  narrative: string;
}

export interface DocumentClauseRecord {
  id: string;
  documentId: string;
  label: string;
  category: "term" | "renewal" | "termination" | "confidentiality" | "compliance" | "payment" | "governance";
  confidence: number;
  required: boolean;
  present: boolean;
}

export interface DocumentRiskFlag {
  id: string;
  documentId: string;
  category: DocumentRiskCategory;
  severity: DocumentPriorityBand;
  score: number;
  narrative: string;
}

export interface DocumentRecord {
  id: string;
  type: DocumentType;
  title: string;
  owner: string;
  status: DocumentArtifactStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  version: string;
  confidence: DocumentConfidenceScore;
  summary: string;
  metadata: DocumentMetadata;
  entities: DocumentEntityRecord[];
  relationships: DocumentRelationshipRecord[];
  clauses: DocumentClauseRecord[];
  complianceTags: DocumentComplianceTag[];
  riskFlags: DocumentRiskFlag[];
  knowledgeArtifactIds: string[];
  narrative: string;
  lenses: DocumentLensImpact;
}

export interface DocumentCatalogResult {
  documents: DocumentRecord[];
  byType: Record<DocumentType, number>;
  overallCoverage: number;
  weakestType: DocumentType;
  narrative: string;
}

export interface DocumentParseResult {
  ocrReady: number;
  parsedCount: number;
  parseConfidence: number;
  narrative: string;
}

export interface DocumentClassificationResult {
  classifiedCount: number;
  accuracy: number;
  byType: Record<DocumentType, number>;
  narrative: string;
}

export interface DocumentMetadataSuite {
  records: Array<{ documentId: string; fields: DocumentMetadata; completeness: number }>;
  completenessScore: number;
  weakestField: string;
  narrative: string;
}

export interface DocumentEntitySuite {
  entities: DocumentEntityRecord[];
  coverageScore: number;
  narrative: string;
}

export interface DocumentRelationshipSuite {
  relationships: DocumentRelationshipRecord[];
  densityScore: number;
  hottestKind: DocumentRelationKind;
  narrative: string;
}

export interface DocumentVersionComparison {
  documentId: string;
  currentVersion: string;
  comparedTo: string | null;
  changeScore: number;
  stale: boolean;
  narrative: string;
}

export interface DocumentVersionSuite {
  comparisons: DocumentVersionComparison[];
  hygieneScore: number;
  staleCount: number;
  narrative: string;
}

export interface DocumentDuplicateCluster {
  id: string;
  documentIds: string[];
  similarity: number;
  recommendedAction: string;
}

export interface DocumentDuplicateSuite {
  clusters: DocumentDuplicateCluster[];
  duplicatePressure: number;
  narrative: string;
}

export interface DocumentSummaryRecord {
  documentId: string;
  title: string;
  summary: string;
  confidence: number;
}

export interface DocumentSummarizationSuite {
  summaries: DocumentSummaryRecord[];
  coverageScore: number;
  narrative: string;
}

export interface DocumentClauseSuite {
  clauses: DocumentClauseRecord[];
  coverageScore: number;
  criticalMissing: string[];
  narrative: string;
}

export interface DocumentRiskSuite {
  risks: Record<DocumentRiskCategory, DocumentRiskFlag[]>;
  overallRiskPressure: number;
  hottestCategory: DocumentRiskCategory;
  narrative: string;
}

export interface DocumentComplianceSuite {
  tags: DocumentComplianceTag[];
  coverageScore: number;
  byTag: Record<DocumentComplianceTag, number>;
  narrative: string;
}

export interface DocumentExpirationSuite {
  expiringSoon: DocumentRecord[];
  expired: DocumentRecord[];
  monitoringScore: number;
  nextExpiration: string | null;
  narrative: string;
}

export interface DocumentKnowledgeDraft {
  id: string;
  type: string;
  title: string;
  confidence: number;
  sourceDocumentId: string;
  validated: boolean;
  metadata: DocumentMetadata;
}

export interface DocumentKnowledgeContribution {
  artifacts: DocumentKnowledgeDraft[];
  contributionScore: number;
  validatedCount: number;
  narrative: string;
}

export interface DocumentReasoningResult {
  answer: string;
  connectedDocuments: string[];
  risks: DocumentRiskFlag[];
  missingTopics: string[];
  confidence: DocumentConfidenceScore;
  narrative: string;
}

export interface DocumentHealthResult {
  overallScore: number;
  status: DocumentHealthStatus;
  dimensions: Record<string, number>;
  lenses: DocumentLensImpact;
  narrative: string;
}

export interface DocumentDashboardResult {
  generatedAt: string;
  headline: string;
  overall: number;
  healthScore: number;
  catalogScore: number;
  classificationScore: number;
  riskScore: number;
  complianceScore: number;
  expirationScore: number;
  topRisks: string[];
  topOpportunities: string[];
  narrative: string;
}

export interface ContractDashboardResult {
  generatedAt: string;
  contractCount: number;
  hygieneScore: number;
  missingClauses: string[];
  expiringSoon: number;
  narrative: string;
}

export interface PolicyDashboardResult {
  generatedAt: string;
  policyCount: number;
  coverageScore: number;
  staleCount: number;
  ownerGaps: number;
  narrative: string;
}

export interface GrantDashboardResult {
  generatedAt: string;
  grantDocumentCount: number;
  complianceScore: number;
  expirationRisk: number;
  narrative: string;
}

export interface ComplianceDashboardResult {
  generatedAt: string;
  complianceCoverage: number;
  tags: Record<DocumentComplianceTag, number>;
  hottestRisk: DocumentRiskCategory;
  narrative: string;
}

export interface DocumentRiskRecord {
  id: string;
  title: string;
  category: DocumentRiskCategory;
  severity: DocumentPriorityBand;
  score: number;
  mitigation: string;
  lenses: DocumentLensImpact;
  narrative: string;
}

export interface DocumentOpportunityRecord {
  id: string;
  title: string;
  priority: DocumentPriorityBand;
  score: number;
  expectedValue: number;
  lenses: DocumentLensImpact;
  narrative: string;
}

export interface DocumentRecommendationRecord {
  id: string;
  title: string;
  priority: DocumentPriorityBand;
  score: number;
  rationale: string;
  lenses: DocumentLensImpact;
  narrative: string;
  expectedLift: string;
  riskReduction: string;
  sourceDocumentIds: string[];
  knowledgeArtifactIds: string[];
}

export interface ExecutiveDocumentBrief {
  generatedAt: string;
  headline: string;
  summary: string;
  healthScore: number;
  catalogScore: number;
  riskScore: number;
  complianceScore: number;
  expirationScore: number;
  topRecommendations: string[];
  topRisks: string[];
  topOpportunities: string[];
  weakestDocumentType: DocumentType;
  lenses: DocumentLensImpact;
  narrative: string;
}

export interface DocumentProjectionResult {
  generatedAt: string;
  headline: string;
  healthScore: number;
  catalogScore: number;
  classificationScore: number;
  metadataScore: number;
  entityScore: number;
  relationshipScore: number;
  versionScore: number;
  duplicateScore: number;
  summaryScore: number;
  clauseScore: number;
  riskScore: number;
  complianceScore: number;
  expirationScore: number;
  contributionScore: number;
  catalog: DocumentCatalogResult;
  dashboard: DocumentDashboardResult;
  brief: ExecutiveDocumentBrief;
  metrics: {
    documentCount: number;
    expiredRatio: number;
    duplicatePressure: number;
    riskPressure: number;
    complianceCoverage: number;
    knowledgeContributionScore: number;
  };
  overallConfidence: DocumentConfidenceScore;
}

export interface DocumentHistoryRecord {
  id: string;
  requestId: string;
  scope: GraphScope;
  status: DocumentArtifactStatus;
  healthScore: number;
  generatedAt: string;
  summary: string;
  metadata: DocumentMetadata;
}

export interface DocumentQueryRequest {
  question: string;
  focus?:
    | "general"
    | "catalog"
    | "parse"
    | "classification"
    | "metadata"
    | "entities"
    | "relationships"
    | "risk"
    | "compliance"
    | "expiration"
    | "knowledge"
    | "reasoning";
  maxResults?: number;
}

export interface DocumentQueryResult {
  question: string;
  focus: string;
  answer: string;
  references: string[];
  confidence: DocumentConfidenceScore;
}

export interface DocumentPublisher {
  domain: string;
  capability: string;
}

export interface DocumentRequest {
  requestId: string;
  question?: string;
  periodLabel?: string;
  scope?: GraphScope;
  dna?: OrganizationDNA;
  dnaResult?: OrganizationDnaResult;
  oiosResult?: OiosResult;
  graph?: Graph;
  analysis?: GraphAnalysisResult;
  graphInput?: GraphBuildInput;
  decisionResult?: ExecutiveDecisionResult | DecisionResultLight;
  predictionResult?: PredictionResult;
  knowledgeResult?: KnowledgeResultLight;
  operationsResult?: OperationsResultLight;
  customerResult?: CustomerResultLight;
  humanCapitalResult?: HumanCapitalResultLight;
  revenueResult?: RevenueResultLight;
  fundingResult?: FundingResultLight;
  boardGovernanceResult?: BoardGovernanceResultLight;
  baselineOverrides?: Partial<DocumentBaseline>;
  metadata?: DocumentMetadata;
}

export interface DocumentResult {
  requestId: string;
  version: string;
  generatedAt: string;
  periodLabel: string;
  scope: GraphScope;
  baseline: DocumentBaseline;
  healthScore: DocumentScore;
  knowledgeScore: DocumentScore;
  catalogScore: DocumentScore;
  classificationScore: DocumentScore;
  metadataScore: DocumentScore;
  entityScore: DocumentScore;
  relationshipScore: DocumentScore;
  versionScore: DocumentScore;
  duplicateScore: DocumentScore;
  summaryScore: DocumentScore;
  clauseScore: DocumentScore;
  riskScore: DocumentScore;
  complianceScore: DocumentScore;
  expirationScore: DocumentScore;
  contributionScore: DocumentScore;
  documentHealth: DocumentHealthResult;
  brief: ExecutiveDocumentBrief;
  projection: DocumentProjectionResult;
  confidence: DocumentConfidenceScore;
  dashboard: DocumentDashboardResult;
  contractDashboard: ContractDashboardResult;
  policyDashboard: PolicyDashboardResult;
  grantDashboard: GrantDashboardResult;
  complianceDashboard: ComplianceDashboardResult;
  recommendations: DocumentRecommendationRecord[];
  risks: DocumentRiskRecord[];
  opportunities: DocumentOpportunityRecord[];
  historyRecord: DocumentHistoryRecord;
  catalog: DocumentCatalogResult;
  parse: DocumentParseResult;
  classification: DocumentClassificationResult;
  metadata: DocumentMetadataSuite;
  entities: DocumentEntitySuite;
  relationships: DocumentRelationshipSuite;
  versions: DocumentVersionSuite;
  duplicates: DocumentDuplicateSuite;
  summarization: DocumentSummarizationSuite;
  clauses: DocumentClauseSuite;
  riskSuite: DocumentRiskSuite;
  compliance: DocumentComplianceSuite;
  expiration: DocumentExpirationSuite;
  knowledgeContribution: DocumentKnowledgeContribution;
  reasoning: DocumentReasoningResult;
  requestMetadata: DocumentMetadata;
}
