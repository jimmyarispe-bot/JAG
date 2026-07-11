/**
 * Enterprise Governance & Accountability — public API (Sprint 017).
 */

export {
  ENTERPRISE_GOVERNANCE_VERSION,
  GOVERNANCE_ACCOUNTABILITY_STATUSES,
  GOVERNANCE_APPROVAL_STATUSES,
  GOVERNANCE_APPROVER_ROLES,
  GOVERNANCE_AUDIT_EVENT_KINDS,
  GOVERNANCE_AUTHORITY_DOMAINS,
  GOVERNANCE_BOARD_ARTIFACT_KINDS,
  GOVERNANCE_BOARD_STATUSES,
  GOVERNANCE_COMMITTEE_KINDS,
  GOVERNANCE_COMPLIANCE_STATUSES,
  GOVERNANCE_NOTIFICATION_AUDIENCES,
  GOVERNANCE_VOTE_OUTCOMES,
  type GovernanceAccountabilityItem,
  type GovernanceAccountabilityStatus,
  type GovernanceApprovalRequest,
  type GovernanceApprovalStatus,
  type GovernanceApprovalStep,
  type GovernanceApproverRole,
  type GovernanceAuditEvent,
  type GovernanceAuditEventKind,
  type GovernanceAuthorityDomain,
  type GovernanceAuthorityGrant,
  type GovernanceBoardArtifactKind,
  type GovernanceBoardDecision,
  type GovernanceBoardGoal,
  type GovernanceBoardMotion,
  type GovernanceBoardResolution,
  type GovernanceBoardStatus,
  type GovernanceCommittee,
  type GovernanceCommitteeKind,
  type GovernanceComplianceFinding,
  type GovernanceComplianceStatus,
  type GovernanceConfidence,
  type GovernanceCycleRequest,
  type GovernanceCycleResult,
  type GovernanceDelegation,
  type GovernanceEvidenceRecord,
  type GovernanceHistoryEntry,
  type GovernanceMetadata,
  type GovernanceMetricSample,
  type GovernanceNotification,
  type GovernanceNotificationAudience,
  type GovernanceOversightReview,
  type GovernancePolicy,
  type GovernanceReport,
  type GovernanceScorecard,
  type GovernanceVoteBallot,
  type GovernanceVoteOutcome,
  type GovernanceVotePackage,
} from "@/lib/platform/governance/types";

export {
  DEFAULT_GOVERNANCE_POLICIES,
  GovernancePolicies,
  type GovernancePoliciesDependencies,
} from "@/lib/platform/governance/policies";

export {
  GovernanceApprovals,
  type GovernanceApprovalsDependencies,
} from "@/lib/platform/governance/approvals";

export {
  GovernanceDelegations,
  type GovernanceDelegationsDependencies,
} from "@/lib/platform/governance/delegations";

export {
  GovernanceBoard,
  type GovernanceBoardDependencies,
} from "@/lib/platform/governance/board";

export {
  GovernanceCommittees,
  type GovernanceCommitteesDependencies,
} from "@/lib/platform/governance/committees";

export {
  GovernanceVoting,
  type GovernanceVotingDependencies,
} from "@/lib/platform/governance/voting";

export {
  GovernanceAccountability,
  type GovernanceAccountabilityDependencies,
} from "@/lib/platform/governance/accountability";

export {
  GovernanceAudit,
  type GovernanceAuditDependencies,
} from "@/lib/platform/governance/audit";

export {
  GovernanceEvidence,
  type GovernanceEvidenceDependencies,
} from "@/lib/platform/governance/evidence";

export {
  GovernanceCompliance,
  type GovernanceComplianceDependencies,
} from "@/lib/platform/governance/compliance";

export {
  GovernanceAuthority,
  type GovernanceAuthorityDependencies,
} from "@/lib/platform/governance/authority";

export {
  GovernanceOversight,
  type GovernanceOversightDependencies,
} from "@/lib/platform/governance/oversight";

export {
  GovernanceReports,
  type GovernanceReportsDependencies,
} from "@/lib/platform/governance/reports";

export {
  GovernanceScorecards,
  type GovernanceScorecardsDependencies,
} from "@/lib/platform/governance/scorecards";

export {
  GovernanceMetrics,
  type GovernanceMetricsDependencies,
} from "@/lib/platform/governance/metrics";

export {
  GovernanceHistory,
  type GovernanceHistoryDependencies,
} from "@/lib/platform/governance/history";

export {
  GovernanceNotifications,
  type GovernanceNotificationsDependencies,
} from "@/lib/platform/governance/notifications";

export {
  EnterpriseGovernanceEngine,
  createEnterpriseGovernance,
  type EnterpriseGovernanceEngineDependencies,
} from "@/lib/platform/governance/engine";
