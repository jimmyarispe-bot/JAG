/**
 * Release Governance Framework — AcademyOS Release Phase G.1
 * Catalog types only. No customer-facing product behavior.
 */

export type ReleaseState =
  | "development"
  | "feature_complete"
  | "architecture_approved"
  | "security_approved"
  | "performance_approved"
  | "ux_approved"
  | "testing_certified"
  | "documentation_complete"
  | "rc1"
  | "rc2"
  | "rc3"
  | "rc3_5"
  | "rc4"
  | "general_availability"
  | "maintenance";

export type GateDomain =
  | "architecture"
  | "security"
  | "performance"
  | "accessibility"
  | "testing"
  | "documentation"
  | "operations"
  | "support"
  | "monitoring"
  | "disaster_recovery"
  | "backups"
  | "restore"
  | "deployment"
  | "rollback";

export type ChecklistItemStatus = "pending" | "complete" | "blocked" | "waived" | "na";

export type ApprovalDecision = "approved" | "rejected" | "conditional" | "deferred";

export type DefectSeverity = "critical" | "high" | "medium" | "low";

export type DomainStatus = "pass" | "fail" | "conditional" | "pending" | "not_executed";

export interface ReleaseStateDefinition {
  id: ReleaseState;
  label: string;
  order: number;
  description: string;
  entryCriteria: string[];
  exitCriteria: string[];
  requiredApproverRoles: string[];
  requiredDocuments: string[];
  evidenceRequired: string[];
}

export interface ChecklistItemDefinition {
  id: string;
  label: string;
  domain: GateDomain;
  required: boolean;
  evidenceHint: string;
}

export interface ChecklistDefinition {
  id: string;
  title: string;
  phase: "rc1" | "rc2" | "rc3" | "rc3_5" | "rc4" | "ga" | "cross";
  items: ChecklistItemDefinition[];
}

export interface ChecklistItemRecord {
  itemId: string;
  status: ChecklistItemStatus;
  completedAt?: string;
  completedBy?: string;
  evidenceRef?: string;
  notes?: string;
  waiverReason?: string;
}

export interface ApprovalRecord {
  id: string;
  formId: string;
  releaseId: string;
  phase: string;
  approverName: string;
  approverRole: string;
  date: string;
  evidenceReviewed: string[];
  decision: ApprovalDecision;
  conditions?: string;
  comments?: string;
  /** Typed name / attestation string (digital signature field). */
  digitalSignature: string;
  previousApprovalId?: string | null;
}

export type AuditEventType =
  | "state_transition"
  | "checklist_update"
  | "approval_recorded"
  | "evidence_attached"
  | "report_published"
  | "risk_decision"
  | "deployment_recorded"
  | "rollback_recorded"
  | "sign_off"
  | "release_note_published";

export interface AuditEvent {
  id: string;
  at: string;
  type: AuditEventType;
  actor: string;
  releaseId: string;
  summary: string;
  payload?: Record<string, unknown>;
}

export interface RiskItem {
  id: string;
  title: string;
  severity: DefectSeverity;
  likelihood: "low" | "medium" | "high";
  impact: "low" | "medium" | "high" | "critical";
  mitigation: string;
  residual: string;
  status: "open" | "mitigated" | "accepted" | "closed";
}

export interface DefectCountSnapshot {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface DomainStatusSnapshot {
  domain: GateDomain;
  status: DomainStatus;
  score?: number;
  notes?: string;
}

export interface ReleaseRecord {
  id: string;
  name: string;
  version: string;
  currentState: ReleaseState;
  startedAt: string;
  updatedAt: string;
  productionReadinessPercent: number;
  riskLevel: DefectSeverity;
  defectCounts: DefectCountSnapshot;
  domainStatuses: DomainStatusSnapshot[];
  checklistProgress: Record<string, ChecklistItemRecord[]>;
  approvals: ApprovalRecord[];
  risks: RiskItem[];
  knownIssuesRef: string;
  documentationRoot: string;
}

export interface ReleaseDashboardSnapshot {
  release: ReleaseRecord;
  stateDefinition: ReleaseStateDefinition;
  checklistCompletionPercent: number;
  openApprovals: string[];
  completedApprovals: string[];
  auditEventCount: number;
  nextAllowedStates: ReleaseState[];
  gates: { domain: GateDomain; status: DomainStatus }[];
  goNoGoEligible: boolean;
}
