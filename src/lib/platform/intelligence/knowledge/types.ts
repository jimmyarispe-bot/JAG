/**
 * Knowledge Intelligence — shared types / KnowledgeModels DTOs (Sprint 040).
 *
 * Continuously capture, organize, connect, retrieve, reason over, preserve,
 * and evolve organizational institutional memory.
 *
 * This is NOT document storage — it is institutional memory.
 *
 * Composed on Organizational DNA + OIOS Core; soft-reads Customer, Operations,
 * Human Capital, and executive graph signals. Hard DAG dependency on Customer.
 *
 * Distinct from foundation IntelligenceKnowledgeService, OIOS Organizational
 * Knowledge Graph, Human Capital KnowledgeTransfer, and JAG Knowledge System
 * governance docs.
 */

import type { OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OrganizationDNA } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
  GraphScope,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";

/** Semantic version of the Knowledge Intelligence pack. */
export const KNOWLEDGE_INTELLIGENCE_VERSION = "0.2.0";

/** Opaque metadata — never use `any`. */
export type KnowledgeMetadata = Record<string, unknown>;

/** Re-export graph scope for knowledge records. */
export type { GraphScope };

/** Confidence bands. */
export const KNOWLEDGE_CONFIDENCE_LEVELS = [
  "high",
  "medium",
  "low",
  "unknown",
] as const;
export type KnowledgeConfidenceLevel =
  (typeof KNOWLEDGE_CONFIDENCE_LEVELS)[number];

/** Priority / severity bands. */
export const KNOWLEDGE_PRIORITY_BANDS = [
  "critical",
  "high",
  "medium",
  "low",
  "monitor",
] as const;
export type KnowledgePriorityBand = (typeof KNOWLEDGE_PRIORITY_BANDS)[number];

/** Health status bands. */
export const KNOWLEDGE_HEALTH_STATUSES = [
  "excellent",
  "healthy",
  "warning",
  "critical",
] as const;
export type KnowledgeHealthStatus = (typeof KNOWLEDGE_HEALTH_STATUSES)[number];

/** Artifact lifecycle. */
export const KNOWLEDGE_ARTIFACT_STATUSES = [
  "draft",
  "generated",
  "reviewed",
  "distributed",
  "archived",
  "superseded",
] as const;
export type KnowledgeArtifactStatus =
  (typeof KNOWLEDGE_ARTIFACT_STATUSES)[number];

/** Approval status for provenance / lifecycle. */
export const KNOWLEDGE_APPROVAL_STATUSES = [
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "expired",
  "superseded",
] as const;
export type KnowledgeApprovalStatus =
  (typeof KNOWLEDGE_APPROVAL_STATUSES)[number];

/** Source type classification for provenance. */
export const KNOWLEDGE_SOURCE_TYPES = [
  "human",
  "system",
  "derived",
  "imported",
  "inferred",
] as const;
export type KnowledgeSourceType = (typeof KNOWLEDGE_SOURCE_TYPES)[number];

/** Organizational memory corpus kinds. */
export const ORGANIZATIONAL_MEMORY_KINDS = [
  "board_decisions",
  "executive_decisions",
  "policies",
  "sops",
  "playbooks",
  "lessons_learned",
  "strategic_initiatives",
  "projects",
  "meeting_summaries",
  "best_practices",
  "failures",
  "successes",
  "experiments",
  "historical_milestones",
] as const;
export type OrganizationalMemoryKind =
  (typeof ORGANIZATIONAL_MEMORY_KINDS)[number];

/** Quality dimension keys. */
export const KNOWLEDGE_QUALITY_DIMENSIONS = [
  "validation",
  "freshness",
  "completeness",
  "accuracy",
  "consistency",
  "conflict",
  "redundancy",
  "coverage",
  "lifecycle",
] as const;
export type KnowledgeQualityDimension =
  (typeof KNOWLEDGE_QUALITY_DIMENSIONS)[number];

/** Evolution action kinds. */
export const KNOWLEDGE_EVOLUTION_ACTIONS = [
  "detect_stale",
  "detect_conflict",
  "recommend_update",
  "identify_missing",
  "suggest_documentation",
  "surface_expertise",
  "preserve_across_transition",
] as const;
export type KnowledgeEvolutionAction =
  (typeof KNOWLEDGE_EVOLUTION_ACTIONS)[number];

/** Institutional knowledge types. */
export const KNOWLEDGE_TYPES = [
  "facts",
  "policies",
  "procedures",
  "playbooks",
  "best_practices",
  "decisions",
  "risks",
  "insights",
  "strategies",
  "templates",
  "research",
  "historical_events",
  "institutional_memory",
] as const;
export type KnowledgeType = (typeof KNOWLEDGE_TYPES)[number];

/** Upstream knowledge sources that contribute artifacts. */
export const KNOWLEDGE_SOURCES = [
  "organization_dna",
  "executive_decisions",
  "board_meetings",
  "policies",
  "procedures",
  "sops",
  "projects",
  "lessons_learned",
  "meeting_notes",
  "emails",
  "training",
  "human_capital",
  "customer",
  "operations",
  "revenue",
  "funding",
  "opportunity",
  "organizational_improvement",
] as const;
export type KnowledgeSource = (typeof KNOWLEDGE_SOURCES)[number];

/** Relationship kinds in the knowledge graph. */
export const KNOWLEDGE_RELATION_KINDS = [
  "derived_from",
  "implements",
  "supersedes",
  "conflicts_with",
  "supports",
  "influences_decision",
  "owned_by",
  "depends_on",
] as const;
export type KnowledgeRelationKind = (typeof KNOWLEDGE_RELATION_KINDS)[number];

/** Knowledge gap categories. */
export const KNOWLEDGE_GAP_CATEGORIES = [
  "missing_policy",
  "stale_procedure",
  "undocumented_decision",
  "unowned_artifact",
  "unvalidated_insight",
  "orphan_dependency",
] as const;
export type KnowledgeGapCategory = (typeof KNOWLEDGE_GAP_CATEGORIES)[number];

/** Expertise map domains. */
export const EXPERTISE_DOMAINS = [
  "academic",
  "operations",
  "finance",
  "governance",
  "people",
  "customer_experience",
] as const;
export type ExpertiseDomain = (typeof EXPERTISE_DOMAINS)[number];

/**
 * Six-lens impact narrative — every recommendation must answer:
 * What do we know? How do we know it? Who owns it?
 * When was it validated? Who depends on it? What decisions has it influenced?
 */
export interface KnowledgeLensImpact {
  coverageCompleteness: string;
  provenanceTrust: string;
  ownershipClarity: string;
  validationCurrency: string;
  dependencyReach: string;
  decisionInfluence: string;
}

/** Calibrated confidence. */
export interface KnowledgeConfidenceScore {
  value: number;
  level: KnowledgeConfidenceLevel;
  factors: Array<{ key: string; label: string; contribution: number }>;
}

/** Shared score card. */
export interface KnowledgeScore {
  key: string;
  label: string;
  value: number;
  status: KnowledgeHealthStatus;
  band: KnowledgePriorityBand;
  narrative: string;
}

/** Baseline signals when upstream modules are sparse. */
export interface KnowledgeBaseline {
  coverageScore: number;
  provenanceScore: number;
  ownershipScore: number;
  validationScore: number;
  connectivityScore: number;
  reuseScore: number;
  organizationHealthScore: number;
  executionScore: number;
  decisionDensity: number;
  policyCoverage: number;
  procedureCoverage: number;
  trainingCoverage: number;
  expertCoverage: number;
  duplicatePressure: number;
  conflictPressure: number;
  staleRatio: number;
  gapPressure: number;
  customerInsightDensity: number;
  operationsProcessDensity: number;
  humanCapitalTransferScore: number;
  artifactCount: number;
  validatedRatio: number;
}

/** Light upstream result attachments (avoid circular imports). */
export interface CustomerResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  engagementScore?: { value?: number };
  baseline?: {
    familyExperienceScore?: number;
    belongingIndex?: number;
    complaintBurden?: number;
  };
  recommendations?: string[];
}

export interface OperationsResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  workflowScore?: { value?: number };
  baseline?: {
    operationsScore?: number;
    slaRisk?: number;
    backlogPressure?: number;
  };
  recommendations?: string[];
}

export interface HumanCapitalResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  baseline?: {
    successionReadiness?: number;
    skillsCoverage?: number;
    engagementScore?: number;
  };
  knowledgeTransfer?: {
    overallScore?: number;
    criticalGaps?: number;
  };
  recommendations?: string[];
}

/** Shared recommendation shape — every recommendation is decision-traceable. */
export interface KnowledgeRecommendationRecord {
  id: string;
  title: string;
  priority: KnowledgePriorityBand;
  score: number;
  rationale: string;
  lenses: KnowledgeLensImpact;
  narrative: string;
  expectedLift: string;
  riskReduction: string;
  /** Artifact ids whose knowledge underpins this recommendation. */
  knowledgeUsed: string[];
  /** Confidence of the supporting knowledge (0–1). */
  knowledgeConfidence: number;
  /** Primary source of supporting knowledge. */
  knowledgeSource: KnowledgeSource | null;
  /** Last validation date among supporting artifacts. */
  lastValidationDate: string | null;
  /** Related organizational decisions influenced by or informing this rec. */
  relatedOrganizationalDecisions: string[];
}

/* -------------------------------------------------------------------------- */
/* Artifact catalog                                                            */
/* -------------------------------------------------------------------------- */

/** Version history entry for provenance. */
export interface KnowledgeVersionEntry {
  version: number;
  changedAt: string;
  changedBy: string;
  summary: string;
}

/**
 * Full provenance retained on every knowledge artifact.
 * Source · Source Type · Original Author · Current Owner · dates · scores ·
 * version history · approval · related policies / decisions / goals / DNA.
 */
export interface KnowledgeProvenanceRecord {
  source: KnowledgeSource;
  sourceType: KnowledgeSourceType;
  originalAuthor: string;
  currentOwner: string;
  creationDate: string;
  lastModifiedDate: string;
  lastValidationDate: string | null;
  confidenceScore: number;
  trustScore: number;
  versionHistory: KnowledgeVersionEntry[];
  approvalStatus: KnowledgeApprovalStatus;
  relatedPolicies: string[];
  relatedDecisions: string[];
  relatedGoals: string[];
  relatedOrganizationalDna: string[];
}

/** Conflict between two knowledge artifacts. */
export interface KnowledgeConflictRecord {
  id: string;
  leftArtifactId: string;
  rightArtifactId: string;
  severity: KnowledgePriorityBand;
  narrative: string;
}

export interface KnowledgeArtifactRecord {
  id: string;
  type: KnowledgeType;
  title: string;
  source: KnowledgeSource;
  owner: string;
  validatedAt: string | null;
  confidence: number;
  version: number;
  dependents: number;
  decisionsInfluenced: number;
  narrative: string;
  /** Full provenance retained on every artifact. */
  provenance: KnowledgeProvenanceRecord;
}

export interface KnowledgeCatalogResult {
  artifacts: KnowledgeArtifactRecord[];
  byType: Record<KnowledgeType, number>;
  overallCoverage: number;
  weakestType: KnowledgeType;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Knowledge provenance suite                                                  */
/* -------------------------------------------------------------------------- */

export interface KnowledgeProvenanceSuite {
  records: KnowledgeProvenanceRecord[];
  overallTrustScore: number;
  overallConfidenceScore: number;
  approvedRatio: number;
  unvalidatedCount: number;
  weakestDimension:
    | "trust"
    | "confidence"
    | "validation"
    | "ownership"
    | "approval";
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Knowledge quality intelligence                                              */
/* -------------------------------------------------------------------------- */

export interface KnowledgeValidationResult {
  validatedCount: number;
  unvalidatedCount: number;
  validatedRatio: number;
  averageAgeDays: number;
  narrative: string;
}

export interface KnowledgeFreshnessResult {
  staleCount: number;
  staleRatio: number;
  freshestAgeDays: number;
  oldestAgeDays: number;
  narrative: string;
}

export interface KnowledgeCompletenessResult {
  completenessScore: number;
  missingFields: string[];
  incompleteArtifactIds: string[];
  narrative: string;
}

export interface KnowledgeAccuracyResult {
  accuracyScore: number;
  lowConfidenceCount: number;
  narrative: string;
}

export interface KnowledgeConsistencyResult {
  consistencyScore: number;
  inconsistentPairs: number;
  narrative: string;
}

export interface KnowledgeConflictDetectionResult {
  conflicts: KnowledgeConflictRecord[];
  conflictPressure: number;
  hottestSeverity: KnowledgePriorityBand;
  narrative: string;
}

export interface KnowledgeRedundancyDetectionResult {
  redundantClusters: number;
  redundantArtifactIds: string[];
  redundancyPressure: number;
  narrative: string;
}

export interface KnowledgeCoverageAnalysisResult {
  coverageScore: number;
  byType: Record<KnowledgeType, number>;
  weakestType: KnowledgeType;
  narrative: string;
}

export interface KnowledgeLifecycleManagementResult {
  byStatus: Record<KnowledgeArtifactStatus, number>;
  activeRatio: number;
  supersededCount: number;
  archivedCount: number;
  recommendedTransitions: Array<{
    artifactId: string;
    fromStatus: KnowledgeArtifactStatus;
    toStatus: KnowledgeArtifactStatus;
    rationale: string;
  }>;
  narrative: string;
}

export interface KnowledgeQualityDimensionRecord {
  dimension: KnowledgeQualityDimension;
  label: string;
  score: number;
  status: KnowledgeHealthStatus;
  narrative: string;
}

export interface KnowledgeQualitySuite {
  overallScore: number;
  status: KnowledgeHealthStatus;
  dimensions: KnowledgeQualityDimensionRecord[];
  validation: KnowledgeValidationResult;
  freshness: KnowledgeFreshnessResult;
  completeness: KnowledgeCompletenessResult;
  accuracy: KnowledgeAccuracyResult;
  consistency: KnowledgeConsistencyResult;
  conflictDetection: KnowledgeConflictDetectionResult;
  redundancyDetection: KnowledgeRedundancyDetectionResult;
  coverageAnalysis: KnowledgeCoverageAnalysisResult;
  lifecycleManagement: KnowledgeLifecycleManagementResult;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Organizational memory                                                       */
/* -------------------------------------------------------------------------- */

export interface OrganizationalMemoryRecord {
  id: string;
  kind: OrganizationalMemoryKind;
  title: string;
  summary: string;
  capturedAt: string;
  owner: string;
  relatedArtifactIds: string[];
  confidence: number;
  narrative: string;
}

export interface OrganizationalMemorySuite {
  records: OrganizationalMemoryRecord[];
  byKind: Record<OrganizationalMemoryKind, number>;
  coverageScore: number;
  weakestKind: OrganizationalMemoryKind;
  leadershipTransitionReadiness: number;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Knowledge evolution                                                         */
/* -------------------------------------------------------------------------- */

export interface KnowledgeEvolutionActionRecord {
  id: string;
  action: KnowledgeEvolutionAction;
  label: string;
  priority: KnowledgePriorityBand;
  score: number;
  artifactIds: string[];
  recommendation: string;
  narrative: string;
}

export interface KnowledgeEvolutionResult {
  actions: KnowledgeEvolutionActionRecord[];
  staleDetected: number;
  conflictsDetected: number;
  missingTopics: string[];
  updateRecommendations: string[];
  documentationSuggestions: string[];
  expertiseSurfaced: string[];
  transitionPreservationScore: number;
  overallEvolutionPressure: number;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Decision traceability                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Trace every recommendation back to the knowledge used, its confidence,
 * source, last validation date, and related organizational decisions.
 */
export interface KnowledgeDecisionTrace {
  recommendationId: string;
  knowledgeUsed: Array<{
    artifactId: string;
    title: string;
    confidence: number;
    source: KnowledgeSource;
    lastValidationDate: string | null;
    trustScore: number;
  }>;
  relatedOrganizationalDecisions: string[];
  overallConfidence: number;
  narrative: string;
}

export interface DecisionTraceabilityResult {
  traces: KnowledgeDecisionTrace[];
  tracedRecommendationCount: number;
  averageKnowledgeConfidence: number;
  untracedCount: number;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Knowledge graph                                                             */
/* -------------------------------------------------------------------------- */

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: KnowledgeType;
  owner: string;
  confidence: number;
}

export interface KnowledgeGraphEdge {
  id: string;
  fromId: string;
  toId: string;
  kind: KnowledgeRelationKind;
  weight: number;
  narrative: string;
}

export interface KnowledgeGraphResult {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  connectivityScore: number;
  conflictCount: number;
  orphanCount: number;
  hottestRelation: KnowledgeRelationKind;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Knowledge search                                                            */
/* -------------------------------------------------------------------------- */

export interface KnowledgeSearchHit {
  artifactId: string;
  title: string;
  type: KnowledgeType;
  score: number;
  snippet: string;
}

export interface KnowledgeSearchResult {
  hits: KnowledgeSearchHit[];
  queryCoverage: number;
  duplicateClusters: number;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Knowledge reasoning                                                         */
/* -------------------------------------------------------------------------- */

export interface KnowledgeReasoningResult {
  answer: string;
  connectedArtifacts: string[];
  conflicts: KnowledgeConflictRecord[];
  missingTopics: string[];
  confidence: KnowledgeConfidenceScore;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Knowledge gaps                                                              */
/* -------------------------------------------------------------------------- */

export interface KnowledgeGapRecord {
  category: KnowledgeGapCategory;
  label: string;
  severity: KnowledgePriorityBand;
  score: number;
  signals: string[];
  narrative: string;
}

export interface KnowledgeGapResult {
  gaps: KnowledgeGapRecord[];
  overallGapPressure: number;
  hottestGap: KnowledgeGapCategory;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Expertise map                                                               */
/* -------------------------------------------------------------------------- */

export interface ExpertiseDomainRecord {
  domain: ExpertiseDomain;
  label: string;
  coverage: number;
  experts: string[];
  status: KnowledgeHealthStatus;
  narrative: string;
}

export interface ExpertiseMapResult {
  domains: ExpertiseDomainRecord[];
  overallCoverage: number;
  weakestDomain: ExpertiseDomain;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Outputs                                                                     */
/* -------------------------------------------------------------------------- */

export interface KnowledgeHealthResult {
  overallScore: number;
  status: KnowledgeHealthStatus;
  dimensions: Record<string, number>;
  lenses: KnowledgeLensImpact;
  narrative: string;
}

export interface KnowledgeDashboardResult {
  generatedAt: string;
  headline: string;
  healthScore: number;
  coverageScore: number;
  graphScore: number;
  searchScore: number;
  gapScore: number;
  expertiseScore: number;
  qualityScore: number;
  provenanceScore: number;
  memoryScore: number;
  evolutionScore: number;
  topRisks: string[];
  topOpportunities: string[];
  narrative: string;
}

export interface KnowledgeRiskRecord {
  id: string;
  title: string;
  severity: KnowledgePriorityBand;
  score: number;
  dimension:
    | KnowledgeType
    | KnowledgeGapCategory
    | ExpertiseDomain
    | KnowledgeRelationKind
    | KnowledgeQualityDimension
    | OrganizationalMemoryKind
    | KnowledgeEvolutionAction
    | "coverage"
    | "provenance"
    | "validation"
    | "conflict"
    | "quality"
    | "memory"
    | "evolution"
    | "traceability";
  mitigation: string;
  lenses: KnowledgeLensImpact;
  narrative: string;
}

export interface KnowledgeOpportunityRecord {
  id: string;
  title: string;
  priority: KnowledgePriorityBand;
  score: number;
  expectedValue: number;
  lenses: KnowledgeLensImpact;
  narrative: string;
}

export interface ExecutiveKnowledgeBrief {
  generatedAt: string;
  headline: string;
  summary: string;
  healthScore: number;
  coverageScore: number;
  graphScore: number;
  searchScore: number;
  gapScore: number;
  expertiseScore: number;
  qualityScore: number;
  provenanceScore: number;
  memoryScore: number;
  topRecommendations: string[];
  topRisks: string[];
  topOpportunities: string[];
  weakestKnowledgeType: string;
  lenses: KnowledgeLensImpact;
  narrative: string;
}

export interface KnowledgeProjectionResult {
  generatedAt: string;
  headline: string;
  healthScore: number;
  coverageScore: number;
  graphScore: number;
  searchScore: number;
  gapScore: number;
  expertiseScore: number;
  qualityScore: number;
  provenanceScore: number;
  memoryScore: number;
  evolutionScore: number;
  catalog: KnowledgeCatalogResult;
  graph: KnowledgeGraphResult;
  search: KnowledgeSearchResult;
  reasoning: KnowledgeReasoningResult;
  gaps: KnowledgeGapResult;
  expertiseMap: ExpertiseMapResult;
  provenance: KnowledgeProvenanceSuite;
  quality: KnowledgeQualitySuite;
  organizationalMemory: OrganizationalMemorySuite;
  evolution: KnowledgeEvolutionResult;
  decisionTraceability: DecisionTraceabilityResult;
  brief: ExecutiveKnowledgeBrief;
  dashboard: KnowledgeDashboardResult;
  metrics: {
    artifactCount: number;
    validatedRatio: number;
    conflictPressure: number;
    duplicatePressure: number;
    staleRatio: number;
    gapPressure: number;
    expertCoverage: number;
    trustScore: number;
    qualityScore: number;
    memoryCoverage: number;
    evolutionPressure: number;
    tracedRecommendations: number;
  };
  overallConfidence: KnowledgeConfidenceScore;
}

export interface KnowledgeHistoryRecord {
  id: string;
  requestId: string;
  scope: GraphScope;
  status: KnowledgeArtifactStatus;
  healthScore: number;
  generatedAt: string;
  summary: string;
  metadata: KnowledgeMetadata;
}

export interface KnowledgeQueryRequest {
  question: string;
  focus?:
    | "general"
    | "catalog"
    | "graph"
    | "search"
    | "reasoning"
    | "gaps"
    | "expertise"
    | "provenance"
    | "quality"
    | "memory"
    | "evolution"
    | "traceability"
    | "risk"
    | "opportunity";
  maxResults?: number;
}

export interface KnowledgeQueryResult {
  question: string;
  focus: string;
  answer: string;
  references: string[];
  confidence: KnowledgeConfidenceScore;
}

/** Registry publisher descriptor. */
export interface KnowledgePublisher {
  domain: string;
  capability: string;
}

/* -------------------------------------------------------------------------- */
/* Request / Result                                                            */
/* -------------------------------------------------------------------------- */

export interface KnowledgeRequest {
  requestId: string;
  question?: string;
  periodLabel?: string;
  scope?: GraphScope;
  dnaResult?: OrganizationDnaResult;
  dna?: OrganizationDNA;
  oiosResult?: OiosResult;
  graph?: Graph;
  analysis?: GraphAnalysisResult;
  graphInput?: GraphBuildInput;
  decisionResult?: ExecutiveDecisionResult;
  predictionResult?: PredictionResult;
  customerResult?: CustomerResultLight;
  operationsResult?: OperationsResultLight;
  humanCapitalResult?: HumanCapitalResultLight;
  baselineOverrides?: Partial<KnowledgeBaseline>;
  metadata?: KnowledgeMetadata;
}

/** Full knowledge generation result. */
export interface KnowledgeResult {
  requestId: string;
  version: string;
  generatedAt: string;
  periodLabel: string;
  scope: GraphScope;
  baseline: KnowledgeBaseline;
  /** Core scores */
  healthScore: KnowledgeScore;
  coverageScore: KnowledgeScore;
  graphScore: KnowledgeScore;
  searchScore: KnowledgeScore;
  gapScore: KnowledgeScore;
  expertiseScore: KnowledgeScore;
  qualityScore: KnowledgeScore;
  provenanceScore: KnowledgeScore;
  memoryScore: KnowledgeScore;
  evolutionScore: KnowledgeScore;
  riskScore: KnowledgeScore;
  knowledgeHealth: KnowledgeHealthResult;
  /** Domain suites */
  catalog: KnowledgeCatalogResult;
  graph: KnowledgeGraphResult;
  search: KnowledgeSearchResult;
  reasoning: KnowledgeReasoningResult;
  gaps: KnowledgeGapResult;
  expertiseMap: ExpertiseMapResult;
  provenance: KnowledgeProvenanceSuite;
  quality: KnowledgeQualitySuite;
  organizationalMemory: OrganizationalMemorySuite;
  evolution: KnowledgeEvolutionResult;
  decisionTraceability: DecisionTraceabilityResult;
  /** Outputs */
  dashboard: KnowledgeDashboardResult;
  risks: KnowledgeRiskRecord[];
  opportunities: KnowledgeOpportunityRecord[];
  brief: ExecutiveKnowledgeBrief;
  projection: KnowledgeProjectionResult;
  confidence: KnowledgeConfidenceScore;
  recommendations: KnowledgeRecommendationRecord[];
  historyRecord: KnowledgeHistoryRecord;
  metadata: KnowledgeMetadata;
}
