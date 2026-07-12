/**
 * JAG Intelligence — Phase 1 foundation types.
 *
 * Shared cognitive contracts for the autonomous intelligence layer.
 * See `docs/architecture/JAG_INTELLIGENCE_ARCHITECTURE.md`.
 */

/** Semantic version of the JAG Intelligence foundation runtime. */
export const INTELLIGENCE_ENGINE_VERSION = "0.1.0";

/** Specialized intelligence domains that form the cognitive system. */
export const INTELLIGENCE_DOMAINS = [
  "executive",
  "operational",
  "financial",
  "mission",
  "decision",
  "compliance",
  "success",
  "learning",
  "strategic",
] as const;
export type IntelligenceDomain = (typeof INTELLIGENCE_DOMAINS)[number];

/** Stages of the Observe → Learn decision pipeline. */
export const INTELLIGENCE_PIPELINE_STAGES = [
  "observe",
  "understand",
  "collect_evidence",
  "generate_hypotheses",
  "score_confidence",
  "recommend_action",
  "execute",
  "measure_outcome",
  "learn",
  "improve",
] as const;
export type IntelligencePipelineStage = (typeof INTELLIGENCE_PIPELINE_STAGES)[number];

/** Confidence band for recommendations and hypotheses. */
export const INTELLIGENCE_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export type IntelligenceConfidenceLevel = (typeof INTELLIGENCE_CONFIDENCE_LEVELS)[number];

/** Memory tiers in the JAG memory model. */
export const INTELLIGENCE_MEMORY_KINDS = ["short_term", "long_term"] as const;
export type IntelligenceMemoryKind = (typeof INTELLIGENCE_MEMORY_KINDS)[number];

/** Authorization posture for proposed or executed actions. */
export const INTELLIGENCE_ACTION_AUTHORITY = [
  "observe_only",
  "recommend",
  "auto_safe",
  "requires_human",
  "forbidden",
] as const;
export type IntelligenceActionAuthority = (typeof INTELLIGENCE_ACTION_AUTHORITY)[number];

/** Lifecycle status for an intelligence run / cognitive session. */
export const INTELLIGENCE_RUN_STATUSES = [
  "pending",
  "running",
  "awaiting_authorization",
  "completed",
  "failed",
  "cancelled",
] as const;
export type IntelligenceRunStatus = (typeof INTELLIGENCE_RUN_STATUSES)[number];

/** Support / success-intelligence case statuses. */
export const INTELLIGENCE_CASE_STATUSES = [
  "open",
  "triaging",
  "diagnosing",
  "remediating",
  "awaiting_user",
  "escalated",
  "resolved",
  "closed",
] as const;
export type IntelligenceCaseStatus = (typeof INTELLIGENCE_CASE_STATUSES)[number];

/** Case priority levels. */
export const INTELLIGENCE_CASE_PRIORITIES = ["critical", "high", "medium", "low"] as const;
export type IntelligenceCasePriority = (typeof INTELLIGENCE_CASE_PRIORITIES)[number];

/** Opaque metadata bag — never use `any`. */
export type IntelligenceMetadata = Record<string, unknown>;

/** Reference to an evidence artifact used during reasoning. */
export interface IntelligenceEvidenceRef {
  evidenceId: string;
  evidenceTypeKey?: string;
  label?: string;
  sourceKind?: string;
  weight?: number;
  metadata?: IntelligenceMetadata;
}

/** Factor contributing to a confidence score. */
export interface IntelligenceConfidenceFactor {
  key: string;
  label: string;
  contribution: number;
  reason?: string;
}

/** Structured confidence score for hypotheses and recommendations. */
export interface IntelligenceConfidenceScore {
  value: number;
  level: IntelligenceConfidenceLevel;
  factors: IntelligenceConfidenceFactor[];
}

/** Candidate explanation for an observed situation. */
export interface IntelligenceHypothesis {
  hypothesisId: string;
  label: string;
  description?: string;
  confidence: IntelligenceConfidenceScore;
  evidenceRefs: IntelligenceEvidenceRef[];
  domain: IntelligenceDomain;
  metadata?: IntelligenceMetadata;
}

/** Recommended next action produced by the planner / decision pipeline. */
export interface IntelligenceRecommendation {
  recommendationId: string;
  actionKey: string;
  label: string;
  description?: string;
  domain: IntelligenceDomain;
  authority: IntelligenceActionAuthority;
  confidence: IntelligenceConfidenceScore;
  expectedImpact?: string;
  alternatives?: IntelligenceRecommendation[];
  evidenceRefs: IntelligenceEvidenceRef[];
  metadata?: IntelligenceMetadata;
}

/** Measured outcome after an authorized action executes. */
export interface IntelligenceOutcome {
  outcomeId: string;
  recommendationId?: string;
  success: boolean;
  summary: string;
  measuredAt: string;
  metrics?: IntelligenceMetadata;
  metadata?: IntelligenceMetadata;
}

/** Explainability payload answering what / why / evidence / confidence / next step. */
export interface IntelligenceExplanation {
  summary: string;
  whatHappened?: string;
  why?: string;
  evidenceSummary?: string[];
  confidence?: IntelligenceConfidenceScore;
  alternatives?: string[];
  expectedImpact?: string;
  recommendedNextStep?: string;
  caveats?: string[];
  metadata?: IntelligenceMetadata;
}

/** Identity and tenant scope for a cognitive run. */
export interface IntelligenceActor {
  userId: string | null;
  roleKeys?: string[];
  displayName?: string;
}

/** Tenant / school isolation boundary for all intelligence operations. */
export interface IntelligenceTenantScope {
  organizationId: string | null;
  schoolId: string | null;
}

/** High-level request that initiates an intelligence pipeline run. */
export interface IntelligenceRunRequest {
  runId?: string;
  domain: IntelligenceDomain;
  intent: string;
  actor: IntelligenceActor;
  scope: IntelligenceTenantScope;
  stage?: IntelligencePipelineStage;
  input?: IntelligenceMetadata;
  metadata?: IntelligenceMetadata;
}

/** Snapshot of a pipeline run (foundation shape only). */
export interface IntelligenceRunSnapshot {
  runId: string;
  domain: IntelligenceDomain;
  status: IntelligenceRunStatus;
  currentStage: IntelligencePipelineStage;
  intent: string;
  actor: IntelligenceActor;
  scope: IntelligenceTenantScope;
  hypotheses: IntelligenceHypothesis[];
  recommendation: IntelligenceRecommendation | null;
  explanation: IntelligenceExplanation | null;
  outcome: IntelligenceOutcome | null;
  createdAt: string;
  updatedAt: string;
  metadata?: IntelligenceMetadata;
}
