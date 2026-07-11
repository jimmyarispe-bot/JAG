/**
 * Enterprise Governance & Accountability — shared types (Sprint 017).
 *
 * Board, approvals, authority, accountability, audit, compliance, and oversight.
 * Integrates with Autonomous Loop, Goal Execution, Organizational/Decision
 * Intelligence, Persistent Memory, Shared Context, and Collaboration.
 * Tenant-agnostic; no database, UI, or external services.
 */

import type { AutonomyLoopResult } from "@/lib/platform/autonomy/types";
import type { SharedIntelligenceContext } from "@/lib/platform/intelligence/context/builder";
import type { DecisionIntelligenceResult } from "@/lib/platform/intelligence/decision/types";
import type { IntelligencePersistentMemoryRecord } from "@/lib/platform/intelligence/memory/types";
import type { OrganizationObservationResult } from "@/lib/platform/intelligence/organization/types";
import type {
  IntelligenceConfidenceScore,
  IntelligenceEvidenceRef,
  IntelligenceMetadata,
} from "@/lib/platform/intelligence/types";
import type {
  ExecutionGoal,
  ExecutionProgressSnapshot,
} from "@/lib/platform/execution/types";
import type { JagCollaborationResult } from "@/lib/platform/jag/collaboration/types";
import type { ExecutiveWorkspaceLinks } from "@/lib/platform/jag/workspace";

/** Semantic version of the Enterprise Governance package. */
export const ENTERPRISE_GOVERNANCE_VERSION = "0.1.0";

/** Opaque metadata — never use `any`. */
export type GovernanceMetadata = IntelligenceMetadata;

/** Approval roles / chain participants. */
export const GOVERNANCE_APPROVER_ROLES = [
  "ceo",
  "president",
  "executive_team",
  "board",
  "committee",
  "custom",
] as const;
export type GovernanceApproverRole = (typeof GOVERNANCE_APPROVER_ROLES)[number];

/** Approval request statuses. */
export const GOVERNANCE_APPROVAL_STATUSES = [
  "draft",
  "pending",
  "approved",
  "rejected",
  "deferred",
  "expired",
  "cancelled",
] as const;
export type GovernanceApprovalStatus =
  (typeof GOVERNANCE_APPROVAL_STATUSES)[number];

/** Authority domains. */
export const GOVERNANCE_AUTHORITY_DOMAINS = [
  "financial",
  "hr",
  "academic",
  "operational",
  "strategic",
  "mission",
] as const;
export type GovernanceAuthorityDomain =
  (typeof GOVERNANCE_AUTHORITY_DOMAINS)[number];

/** Board artifact kinds. */
export const GOVERNANCE_BOARD_ARTIFACT_KINDS = [
  "goal",
  "decision",
  "motion",
  "resolution",
] as const;
export type GovernanceBoardArtifactKind =
  (typeof GOVERNANCE_BOARD_ARTIFACT_KINDS)[number];

/** Board / motion statuses. */
export const GOVERNANCE_BOARD_STATUSES = [
  "proposed",
  "under_review",
  "tabled",
  "passed",
  "failed",
  "withdrawn",
  "implemented",
] as const;
export type GovernanceBoardStatus = (typeof GOVERNANCE_BOARD_STATUSES)[number];

/** Committee kinds. */
export const GOVERNANCE_COMMITTEE_KINDS = [
  "executive",
  "finance",
  "academic",
  "audit",
  "governance",
  "ad_hoc",
] as const;
export type GovernanceCommitteeKind =
  (typeof GOVERNANCE_COMMITTEE_KINDS)[number];

/** Vote outcomes. */
export const GOVERNANCE_VOTE_OUTCOMES = [
  "aye",
  "nay",
  "abstain",
  "absent",
] as const;
export type GovernanceVoteOutcome = (typeof GOVERNANCE_VOTE_OUTCOMES)[number];

/** Accountability item statuses. */
export const GOVERNANCE_ACCOUNTABILITY_STATUSES = [
  "open",
  "in_progress",
  "blocked",
  "completed",
  "overdue",
  "cancelled",
] as const;
export type GovernanceAccountabilityStatus =
  (typeof GOVERNANCE_ACCOUNTABILITY_STATUSES)[number];

/** Audit event kinds — every recommendation and related governance act. */
export const GOVERNANCE_AUDIT_EVENT_KINDS = [
  "recommendation",
  "decision",
  "action",
  "approval",
  "escalation",
  "delegation",
  "motion",
  "resolution",
  "vote",
  "compliance_finding",
  "policy_change",
  "authority_grant",
  "oversight_review",
] as const;
export type GovernanceAuditEventKind =
  (typeof GOVERNANCE_AUDIT_EVENT_KINDS)[number];

/** Compliance statuses. */
export const GOVERNANCE_COMPLIANCE_STATUSES = [
  "compliant",
  "at_risk",
  "non_compliant",
  "remediating",
  "waived",
] as const;
export type GovernanceComplianceStatus =
  (typeof GOVERNANCE_COMPLIANCE_STATUSES)[number];

/** Notification audiences. */
export const GOVERNANCE_NOTIFICATION_AUDIENCES = [
  "owner",
  "ceo",
  "president",
  "executive_team",
  "board",
  "committee",
  "auditor",
] as const;
export type GovernanceNotificationAudience =
  (typeof GOVERNANCE_NOTIFICATION_AUDIENCES)[number];

/** Policy definition. */
export interface GovernancePolicy {
  readonly policyId: string;
  readonly title: string;
  readonly description: string;
  readonly domain: GovernanceAuthorityDomain;
  readonly version: string;
  readonly active: boolean;
  readonly rules: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly metadata?: GovernanceMetadata;
}

/** Single step in an approval chain. */
export interface GovernanceApprovalStep {
  readonly stepId: string;
  readonly order: number;
  readonly role: GovernanceApproverRole;
  readonly label: string;
  readonly required: boolean;
  readonly status: GovernanceApprovalStatus;
  readonly decidedAt: string | null;
  readonly decidedBy: string | null;
  readonly notes: readonly string[];
  readonly metadata?: GovernanceMetadata;
}

/** Approval request with chain. */
export interface GovernanceApprovalRequest {
  readonly approvalId: string;
  readonly subject: string;
  readonly description: string;
  readonly status: GovernanceApprovalStatus;
  readonly domain: GovernanceAuthorityDomain;
  readonly chain: readonly GovernanceApprovalStep[];
  readonly currentStepOrder: number | null;
  readonly sourceRef: string | null;
  readonly organizationId: string | null;
  readonly schoolId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly metadata?: GovernanceMetadata;
}

/** Delegation of authority. */
export interface GovernanceDelegation {
  readonly delegationId: string;
  readonly fromRole: GovernanceApproverRole;
  readonly toRole: GovernanceApproverRole | string;
  readonly domain: GovernanceAuthorityDomain;
  readonly scope: string;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly active: boolean;
  readonly rationale: string;
  readonly metadata?: GovernanceMetadata;
}

/** Board goal. */
export interface GovernanceBoardGoal {
  readonly goalId: string;
  readonly title: string;
  readonly description: string;
  readonly status: GovernanceBoardStatus;
  readonly owner: string;
  readonly dueDate: string | null;
  readonly linkedExecutionGoalId: string | null;
  readonly createdAt: string;
  readonly metadata?: GovernanceMetadata;
}

/** Board decision. */
export interface GovernanceBoardDecision {
  readonly decisionId: string;
  readonly title: string;
  readonly summary: string;
  readonly status: GovernanceBoardStatus;
  readonly decidedAt: string | null;
  readonly linkedDecisionRequestId: string | null;
  readonly metadata?: GovernanceMetadata;
}

/** Board motion. */
export interface GovernanceBoardMotion {
  readonly motionId: string;
  readonly title: string;
  readonly text: string;
  readonly movedBy: string;
  readonly secondedBy: string | null;
  readonly status: GovernanceBoardStatus;
  readonly createdAt: string;
  readonly metadata?: GovernanceMetadata;
}

/** Board resolution. */
export interface GovernanceBoardResolution {
  readonly resolutionId: string;
  readonly title: string;
  readonly text: string;
  readonly motionId: string | null;
  readonly status: GovernanceBoardStatus;
  readonly adoptedAt: string | null;
  readonly metadata?: GovernanceMetadata;
}

/** Committee. */
export interface GovernanceCommittee {
  readonly committeeId: string;
  readonly name: string;
  readonly kind: GovernanceCommitteeKind;
  readonly chair: string;
  readonly members: readonly string[];
  readonly active: boolean;
  readonly charter: string;
  readonly metadata?: GovernanceMetadata;
}

/** Individual vote ballot. */
export interface GovernanceVoteBallot {
  readonly ballotId: string;
  readonly voter: string;
  readonly outcome: GovernanceVoteOutcome;
  readonly votedAt: string;
  readonly rationale: string | null;
  readonly metadata?: GovernanceMetadata;
}

/** Vote package on a motion/resolution. */
export interface GovernanceVotePackage {
  readonly voteId: string;
  readonly subjectId: string;
  readonly subjectKind: "motion" | "resolution" | "approval";
  readonly ballots: readonly GovernanceVoteBallot[];
  readonly aye: number;
  readonly nay: number;
  readonly abstain: number;
  readonly absent: number;
  readonly passed: boolean | null;
  readonly closedAt: string | null;
  readonly metadata?: GovernanceMetadata;
}

/** Accountability tracking item. */
export interface GovernanceAccountabilityItem {
  readonly itemId: string;
  readonly title: string;
  readonly owner: string;
  readonly dueDate: string;
  readonly status: GovernanceAccountabilityStatus;
  readonly completionPercent: number;
  readonly evidenceIds: readonly string[];
  readonly riskScore: number;
  readonly impactScore: number;
  readonly linkedGoalId: string | null;
  readonly linkedApprovalId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly metadata?: GovernanceMetadata;
}

/** Immutable audit event. */
export interface GovernanceAuditEvent {
  readonly eventId: string;
  readonly kind: GovernanceAuditEventKind;
  readonly title: string;
  readonly detail: string;
  readonly actor: string;
  readonly occurredAt: string;
  readonly relatedIds: readonly string[];
  readonly evidenceRefs: readonly IntelligenceEvidenceRef[];
  readonly organizationId: string | null;
  readonly schoolId: string | null;
  readonly metadata?: GovernanceMetadata;
}

/** Governance evidence record. */
export interface GovernanceEvidenceRecord {
  readonly evidenceId: string;
  readonly title: string;
  readonly summary: string;
  readonly sourceRef: string | null;
  readonly weight: number;
  readonly linkedItemIds: readonly string[];
  readonly capturedAt: string;
  readonly metadata?: GovernanceMetadata;
}

/** Compliance finding. */
export interface GovernanceComplianceFinding {
  readonly findingId: string;
  readonly title: string;
  readonly description: string;
  readonly status: GovernanceComplianceStatus;
  readonly domain: GovernanceAuthorityDomain;
  readonly policyId: string | null;
  readonly severity: "critical" | "high" | "medium" | "low";
  readonly remediation: string;
  readonly dueDate: string | null;
  readonly createdAt: string;
  readonly metadata?: GovernanceMetadata;
}

/** Authority grant / limit. */
export interface GovernanceAuthorityGrant {
  readonly grantId: string;
  readonly role: GovernanceApproverRole | string;
  readonly domain: GovernanceAuthorityDomain;
  readonly maxAmount: number | null;
  readonly currency: string | null;
  readonly canApprove: boolean;
  readonly canDelegate: boolean;
  readonly canEscalate: boolean;
  readonly description: string;
  readonly metadata?: GovernanceMetadata;
}

/** Oversight review. */
export interface GovernanceOversightReview {
  readonly reviewId: string;
  readonly title: string;
  readonly reviewer: string;
  readonly audience: GovernanceNotificationAudience;
  readonly findings: readonly string[];
  readonly recommendations: readonly string[];
  readonly reviewedAt: string;
  readonly metadata?: GovernanceMetadata;
}

/** Governance notification. */
export interface GovernanceNotification {
  readonly notificationId: string;
  readonly audience: GovernanceNotificationAudience;
  readonly title: string;
  readonly message: string;
  readonly severity: "critical" | "high" | "medium" | "low";
  readonly createdAt: string;
  readonly acknowledged: boolean;
  readonly relatedIds: readonly string[];
  readonly metadata?: GovernanceMetadata;
}

/** History entry. */
export interface GovernanceHistoryEntry {
  readonly entryId: string;
  readonly occurredAt: string;
  readonly kind: string;
  readonly title: string;
  readonly detail: string;
  readonly actor: string;
  readonly metadata?: GovernanceMetadata;
}

/** Governance metric sample. */
export interface GovernanceMetricSample {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly unit?: string;
  readonly observedAt: string;
  readonly metadata?: GovernanceMetadata;
}

/** Governance scorecard. */
export interface GovernanceScorecard {
  readonly scorecardId: string;
  readonly generatedAt: string;
  readonly accountabilityScore: number;
  readonly complianceScore: number;
  readonly approvalLatencyDays: number;
  readonly boardThroughput: number;
  readonly auditCoverage: number;
  readonly overallScore: number;
  readonly band: "strong" | "adequate" | "weak" | "critical";
  readonly summary: string;
  readonly metadata?: GovernanceMetadata;
}

/** Governance report. */
export interface GovernanceReport {
  readonly reportId: string;
  readonly title: string;
  readonly generatedAt: string;
  readonly narrative: string;
  readonly scorecard: GovernanceScorecard;
  readonly metrics: readonly GovernanceMetricSample[];
  readonly openApprovals: number;
  readonly openAccountability: number;
  readonly openFindings: number;
  readonly auditEventCount: number;
  readonly metadata?: GovernanceMetadata;
}

/** Input for a governance evaluation / cycle. */
export interface GovernanceCycleRequest {
  readonly requestId: string;
  readonly organizationId: string | null;
  readonly schoolId?: string | null;
  readonly subject: string;
  readonly description?: string;
  readonly sharedContext?: SharedIntelligenceContext;
  readonly autonomy?: AutonomyLoopResult;
  readonly organization?: OrganizationObservationResult;
  readonly decision?: DecisionIntelligenceResult;
  readonly collaboration?: JagCollaborationResult;
  readonly executionGoals?: readonly ExecutionGoal[];
  readonly executionProgress?: readonly ExecutionProgressSnapshot[];
  readonly memories?: readonly IntelligencePersistentMemoryRecord[];
  readonly workspaceLinks?: ExecutiveWorkspaceLinks;
  readonly actor?: string;
  readonly metadata?: GovernanceMetadata;
}

/** Aggregate governance cycle result. */
export interface GovernanceCycleResult {
  readonly requestId: string;
  readonly completedAt: string;
  readonly policies: readonly GovernancePolicy[];
  readonly approvals: readonly GovernanceApprovalRequest[];
  readonly delegations: readonly GovernanceDelegation[];
  readonly boardGoals: readonly GovernanceBoardGoal[];
  readonly boardDecisions: readonly GovernanceBoardDecision[];
  readonly motions: readonly GovernanceBoardMotion[];
  readonly resolutions: readonly GovernanceBoardResolution[];
  readonly committees: readonly GovernanceCommittee[];
  readonly votes: readonly GovernanceVotePackage[];
  readonly accountability: readonly GovernanceAccountabilityItem[];
  readonly auditEvents: readonly GovernanceAuditEvent[];
  readonly evidence: readonly GovernanceEvidenceRecord[];
  readonly compliance: readonly GovernanceComplianceFinding[];
  readonly authority: readonly GovernanceAuthorityGrant[];
  readonly oversight: readonly GovernanceOversightReview[];
  readonly notifications: readonly GovernanceNotification[];
  readonly history: readonly GovernanceHistoryEntry[];
  readonly metrics: readonly GovernanceMetricSample[];
  readonly scorecard: GovernanceScorecard;
  readonly report: GovernanceReport;
  readonly domainVersion: string;
  readonly summary: string;
  readonly metadata?: GovernanceMetadata;
}

/** Confidence helper shape reused across modules. */
export type GovernanceConfidence = IntelligenceConfidenceScore;
