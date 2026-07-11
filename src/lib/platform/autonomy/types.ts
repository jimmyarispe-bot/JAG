/**
 * Autonomous Executive Operating Loop — shared types (Sprint 016).
 *
 * Orchestrates OBSERVE → DIAGNOSE → PLAN → DECIDE → EXECUTE → MEASURE →
 * LEARN → REFLECT → PRIORITIZE → ESCALATE under governance policy.
 * Tenant-agnostic; no database, UI, or external services.
 */

import type { SharedIntelligenceContext } from "@/lib/platform/intelligence/context/builder";
import type { DecisionIntelligenceResult } from "@/lib/platform/intelligence/decision/types";
import type { ExecutiveIntelligenceResult } from "@/lib/platform/intelligence/domains/executive/types";
import type { StrategicIntelligenceResult } from "@/lib/platform/intelligence/domains/strategic/types";
import type { IntelligencePersistentMemoryRecord } from "@/lib/platform/intelligence/memory/types";
import type {
  OrganizationMetricSample,
  OrganizationObservationRequest,
  OrganizationObservationResult,
} from "@/lib/platform/intelligence/organization/types";
import type {
  IntelligenceConfidenceScore,
  IntelligenceEvidenceRef,
  IntelligenceMetadata,
} from "@/lib/platform/intelligence/types";
import type {
  ExecutionGoal,
  ExecutionProgressSnapshot,
  ExecutionScorecard,
} from "@/lib/platform/execution/types";
import type { JagCollaborationResult } from "@/lib/platform/jag/collaboration/types";

/** Semantic version of the Autonomous Executive Operating Loop. */
export const AUTONOMOUS_EXECUTIVE_LOOP_VERSION = "0.1.0";

/** Opaque metadata — never use `any`. */
export type AutonomyMetadata = IntelligenceMetadata;

/** Loop phases in execution order. */
export const AUTONOMY_LOOP_PHASES = [
  "observe",
  "diagnose",
  "plan",
  "decide",
  "execute",
  "measure",
  "learn",
  "reflect",
  "prioritize",
  "escalate",
] as const;
export type AutonomyLoopPhase = (typeof AUTONOMY_LOOP_PHASES)[number];

/** Decision / approval modes for autonomous actions. */
export const AUTONOMY_APPROVAL_MODES = [
  "automatic",
  "approval_required",
  "ceo_approval",
  "board_approval",
] as const;
export type AutonomyApprovalMode = (typeof AUTONOMY_APPROVAL_MODES)[number];

/** Root-cause categories for diagnosis. */
export const AUTONOMY_ROOT_CAUSE_KINDS = [
  "financial_pressure",
  "academic_performance",
  "staffing_capacity",
  "execution_drift",
  "strategic_misalignment",
  "compliance_risk",
  "operational_anomaly",
  "unknown",
] as const;
export type AutonomyRootCauseKind = (typeof AUTONOMY_ROOT_CAUSE_KINDS)[number];

/** Escalation severities. */
export const AUTONOMY_ESCALATION_SEVERITIES = [
  "critical",
  "high",
  "medium",
  "low",
] as const;
export type AutonomyEscalationSeverity =
  (typeof AUTONOMY_ESCALATION_SEVERITIES)[number];

/** Governance permission actions. */
export const AUTONOMY_GOVERNANCE_ACTIONS = [
  "observe",
  "diagnose",
  "plan",
  "decide_automatic",
  "execute_automatic",
  "execute_with_approval",
  "escalate_ceo",
  "escalate_board",
  "write_memory",
  "measure",
] as const;
export type AutonomyGovernanceAction =
  (typeof AUTONOMY_GOVERNANCE_ACTIONS)[number];

/** Priority dimensions for ranking work. */
export const AUTONOMY_PRIORITY_DIMENSIONS = [
  "impact",
  "urgency",
  "risk",
  "mission_alignment",
  "cost",
  "confidence",
] as const;
export type AutonomyPriorityDimension =
  (typeof AUTONOMY_PRIORITY_DIMENSIONS)[number];

/** Loop run status. */
export const AUTONOMY_LOOP_STATUSES = [
  "completed",
  "awaiting_approval",
  "blocked_by_policy",
  "partial",
  "failed",
] as const;
export type AutonomyLoopStatus = (typeof AUTONOMY_LOOP_STATUSES)[number];

/** Observational signal collected from organizational intelligence. */
export interface AutonomyObservationSignal {
  readonly signalId: string;
  readonly source: string;
  readonly kind: string;
  readonly title: string;
  readonly detail: string;
  readonly severity: AutonomyEscalationSeverity;
  readonly metricKey?: string;
  readonly value?: number;
  readonly metadata?: AutonomyMetadata;
}

/** Aggregate observation phase output. */
export interface AutonomyObservationResult {
  readonly requestId: string;
  readonly observedAt: string;
  readonly organization: OrganizationObservationResult | null;
  readonly signals: readonly AutonomyObservationSignal[];
  readonly metrics: readonly OrganizationMetricSample[];
  readonly summary: string;
  readonly metadata?: AutonomyMetadata;
}

/** Diagnosed root cause. */
export interface AutonomyRootCause {
  readonly causeId: string;
  readonly kind: AutonomyRootCauseKind;
  readonly title: string;
  readonly explanation: string;
  readonly relatedSignalIds: readonly string[];
  readonly confidence: IntelligenceConfidenceScore;
  readonly severity: AutonomyEscalationSeverity;
  readonly metadata?: AutonomyMetadata;
}

/** Diagnosis phase output. */
export interface AutonomyDiagnosisResult {
  readonly requestId: string;
  readonly causes: readonly AutonomyRootCause[];
  readonly primaryCauseId: string | null;
  readonly summary: string;
  readonly confidence: IntelligenceConfidenceScore;
  readonly metadata?: AutonomyMetadata;
}

/** Single executable plan step. */
export interface AutonomyPlanStep {
  readonly stepId: string;
  readonly order: number;
  readonly title: string;
  readonly instruction: string;
  readonly ownerRole: string;
  readonly dependsOn: readonly string[];
  readonly expectedOutcome: string;
  readonly metadata?: AutonomyMetadata;
}

/** Planning phase output. */
export interface AutonomyPlan {
  readonly planId: string;
  readonly requestId: string;
  readonly title: string;
  readonly summary: string;
  readonly steps: readonly AutonomyPlanStep[];
  readonly linkedCauseIds: readonly string[];
  readonly expectedValue: string;
  readonly confidence: IntelligenceConfidenceScore;
  readonly metadata?: AutonomyMetadata;
}

/** Decision phase output. */
export interface AutonomyDecisionResult {
  readonly decisionId: string;
  readonly requestId: string;
  readonly approvalMode: AutonomyApprovalMode;
  readonly approvedForExecution: boolean;
  readonly rationale: readonly string[];
  readonly recommendedPlanId: string;
  readonly confidence: IntelligenceConfidenceScore;
  readonly requiresHuman: boolean;
  readonly metadata?: AutonomyMetadata;
}

/** Goal Execution package created by the loop. */
export interface AutonomyExecutionPackage {
  readonly packageId: string;
  readonly requestId: string;
  readonly status: "created" | "held" | "skipped";
  readonly goal: ExecutionGoal | null;
  readonly progress: ExecutionProgressSnapshot | null;
  readonly scorecard: ExecutionScorecard | null;
  readonly holdReason: string | null;
  readonly summary: string;
  readonly metadata?: AutonomyMetadata;
}

/** Measurement snapshot. */
export interface AutonomyMeasurementResult {
  readonly measurementId: string;
  readonly requestId: string;
  readonly measuredAt: string;
  readonly progressPercent: number;
  readonly healthScore: number;
  readonly outcomeSignals: readonly string[];
  readonly summary: string;
  readonly metadata?: AutonomyMetadata;
}

/** Learning / memory write outcome. */
export interface AutonomyLearningResult {
  readonly learningId: string;
  readonly requestId: string;
  readonly memoryId: string | null;
  readonly lessons: readonly string[];
  readonly persisted: boolean;
  readonly summary: string;
  readonly metadata?: AutonomyMetadata;
}

/** Reflection: expected vs actual. */
export interface AutonomyReflectionResult {
  readonly reflectionId: string;
  readonly requestId: string;
  readonly expectedOutcome: string;
  readonly actualOutcome: string;
  readonly deltaSummary: string;
  readonly metExpectation: boolean;
  readonly varianceScore: number;
  readonly insights: readonly string[];
  readonly summary: string;
  readonly metadata?: AutonomyMetadata;
}

/** Prioritized work item. */
export interface AutonomyPriorityItem {
  readonly itemId: string;
  readonly title: string;
  readonly score: number;
  readonly dimensions: Readonly<Record<AutonomyPriorityDimension, number>>;
  readonly rank: number;
  readonly linkedCauseId: string | null;
  readonly linkedPlanStepId: string | null;
  readonly metadata?: AutonomyMetadata;
}

/** Prioritization phase output. */
export interface AutonomyPrioritizationResult {
  readonly requestId: string;
  readonly ranked: readonly AutonomyPriorityItem[];
  readonly topItemId: string | null;
  readonly summary: string;
  readonly metadata?: AutonomyMetadata;
}

/** Escalation notice for human approval. */
export interface AutonomyEscalationNotice {
  readonly escalationId: string;
  readonly requestId: string;
  readonly severity: AutonomyEscalationSeverity;
  readonly audience: "operator" | "ceo" | "board";
  readonly title: string;
  readonly message: string;
  readonly approvalMode: AutonomyApprovalMode;
  readonly createdAt: string;
  readonly acknowledged: boolean;
  readonly metadata?: AutonomyMetadata;
}

/** Escalation phase output. */
export interface AutonomyEscalationResult {
  readonly requestId: string;
  readonly notices: readonly AutonomyEscalationNotice[];
  readonly requiresHuman: boolean;
  readonly summary: string;
  readonly metadata?: AutonomyMetadata;
}

/** Single governance policy rule. */
export interface AutonomyGovernancePolicy {
  readonly policyId: string;
  readonly action: AutonomyGovernanceAction;
  readonly allowed: boolean;
  readonly maxSeverity?: AutonomyEscalationSeverity;
  readonly minConfidence?: number;
  readonly reason: string;
  readonly metadata?: AutonomyMetadata;
}

/** Governance evaluation outcome. */
export interface AutonomyGovernanceDecision {
  readonly action: AutonomyGovernanceAction;
  readonly allowed: boolean;
  readonly matchedPolicyId: string | null;
  readonly reason: string;
}

/** Input request for one autonomous loop cycle. */
export interface AutonomyLoopRequest {
  readonly requestId: string;
  readonly organizationId: string | null;
  readonly schoolId?: string | null;
  readonly subject: string;
  readonly description?: string;
  /** Raw observation input — used when `organization` is not pre-supplied. */
  readonly observationRequest?: OrganizationObservationRequest;
  /** Pre-built organization observation (skips observer call). */
  readonly organization?: OrganizationObservationResult;
  readonly sharedContext?: SharedIntelligenceContext;
  readonly executive?: ExecutiveIntelligenceResult;
  readonly strategic?: StrategicIntelligenceResult;
  readonly decision?: DecisionIntelligenceResult;
  readonly collaboration?: JagCollaborationResult;
  readonly memories?: readonly IntelligencePersistentMemoryRecord[];
  readonly executionGoals?: readonly ExecutionGoal[];
  readonly executionProgress?: readonly ExecutionProgressSnapshot[];
  readonly metrics?: readonly OrganizationMetricSample[];
  readonly evidenceRefs?: readonly IntelligenceEvidenceRef[];
  readonly policies?: readonly AutonomyGovernancePolicy[];
  readonly metadata?: AutonomyMetadata;
}

/** Full autonomous loop cycle result. */
export interface AutonomyLoopResult {
  readonly requestId: string;
  readonly status: AutonomyLoopStatus;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly observation: AutonomyObservationResult;
  readonly diagnosis: AutonomyDiagnosisResult;
  readonly plan: AutonomyPlan;
  readonly decision: AutonomyDecisionResult;
  readonly execution: AutonomyExecutionPackage;
  readonly measurement: AutonomyMeasurementResult;
  readonly learning: AutonomyLearningResult;
  readonly reflection: AutonomyReflectionResult;
  readonly prioritization: AutonomyPrioritizationResult;
  readonly escalation: AutonomyEscalationResult;
  readonly governanceChecks: readonly AutonomyGovernanceDecision[];
  readonly phasesCompleted: readonly AutonomyLoopPhase[];
  readonly domainVersion: string;
  readonly summary: string;
  readonly metadata?: AutonomyMetadata;
}

/** Scheduled loop job identity. */
export interface AutonomyScheduleJob {
  readonly jobId: string;
  readonly requestId: string;
  readonly scheduledAt: string;
  readonly status: "scheduled" | "running" | "completed" | "cancelled";
}
