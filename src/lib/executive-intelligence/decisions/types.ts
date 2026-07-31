/** Decision Center™ — deterministic executive decision inbox (no AI). */

export const DECISION_STATUSES = [
  "Detected",
  "Needs Review",
  "Assigned",
  "In Progress",
  "Resolved",
  "Closed",
] as const;

export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export const DECISION_SEVERITIES = ["Info", "Warning", "Critical"] as const;
export type DecisionSeverity = (typeof DECISION_SEVERITIES)[number];

export const DECISION_PRIORITIES = ["P3", "P2", "P1"] as const;
export type DecisionPriority = (typeof DECISION_PRIORITIES)[number];

export const DECISION_CATEGORIES = [
  "Finance",
  "Operations",
  "Knowledge",
  "Organization",
  "Compliance",
  "Manual",
] as const;
export type DecisionCategory = (typeof DECISION_CATEGORIES)[number];

export const DECISION_SOURCES = [
  "Insight",
  "Connector",
  "Evidence",
  "Health",
  "Compliance",
  "Manual",
] as const;
export type DecisionSource = (typeof DECISION_SOURCES)[number];

export const ASSIGNMENT_TARGET_TYPES = [
  "Person",
  "Team",
  "Business Unit",
] as const;
export type AssignmentTargetType = (typeof ASSIGNMENT_TARGET_TYPES)[number];

export type DecisionAssignment = {
  readonly targetType: AssignmentTargetType;
  readonly targetId: string;
  readonly targetLabel: string;
  readonly assignedAt: string;
  readonly assignedBy: string;
};

export type DecisionReassignment = {
  readonly id: string;
  readonly at: string;
  readonly actor: string;
  readonly from: DecisionAssignment | null;
  readonly to: DecisionAssignment;
  readonly reason: string;
};

export type DecisionTimelineKind =
  | "created"
  | "status_changed"
  | "assigned"
  | "reassigned"
  | "resolved"
  | "closed"
  | "note";

export type DecisionTimelineEntry = {
  readonly id: string;
  readonly organizationId: string;
  readonly decisionId: string;
  readonly kind: DecisionTimelineKind;
  readonly at: string;
  readonly actor: string;
  readonly message: string;
  readonly fromStatus: DecisionStatus | null;
  readonly toStatus: DecisionStatus | null;
  readonly metadata: Readonly<Record<string, string>>;
};

export type JagDecision = {
  readonly id: string;
  readonly organizationId: string;
  readonly category: DecisionCategory;
  readonly title: string;
  readonly description: string;
  readonly severity: DecisionSeverity;
  readonly priority: DecisionPriority;
  readonly status: DecisionStatus;
  readonly source: DecisionSource;
  readonly trigger: string;
  readonly recommendedProcess: string;
  readonly owner: DecisionAssignment | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly dueDate: string | null;
  readonly resolvedAt: string | null;
  readonly closedAt: string | null;
  readonly relatedInsightIds: readonly string[];
  readonly relatedEvidenceIds: readonly string[];
  readonly relatedConnectorIds: readonly string[];
  readonly relatedGraphNodeIds: readonly string[];
  readonly department: string | null;
  readonly businessUnit: string | null;
  readonly externalKey: string | null;
  readonly createdBy: string;
};

export type DecisionSummary = {
  readonly open: number;
  readonly overdue: number;
  readonly critical: number;
  readonly recentlyResolved: number;
  readonly byDepartment: Readonly<Record<string, number>>;
  readonly byBusinessUnit: Readonly<Record<string, number>>;
};

export type MergedDecisionTimelineItem = {
  readonly id: string;
  readonly at: string;
  readonly source: "decision" | "insight" | "connector" | "evidence";
  readonly title: string;
  readonly detail: string;
  readonly entityId: string;
};

export type CreateDecisionInput = {
  readonly organizationId: string;
  readonly category: DecisionCategory;
  readonly title: string;
  readonly description: string;
  readonly severity?: DecisionSeverity;
  readonly priority?: DecisionPriority;
  readonly source?: DecisionSource;
  readonly trigger?: string;
  readonly recommendedProcess?: string;
  readonly dueDate?: string | null;
  readonly relatedInsightIds?: readonly string[];
  readonly relatedEvidenceIds?: readonly string[];
  readonly relatedConnectorIds?: readonly string[];
  readonly relatedGraphNodeIds?: readonly string[];
  readonly department?: string | null;
  readonly businessUnit?: string | null;
  readonly externalKey?: string | null;
  readonly createdBy: string;
  readonly initialStatus?: DecisionStatus;
};

export type PatchDecisionInput = {
  readonly organizationId: string;
  readonly decisionId: string;
  readonly actor: string;
  readonly status?: DecisionStatus;
  readonly title?: string;
  readonly description?: string;
  readonly severity?: DecisionSeverity;
  readonly priority?: DecisionPriority;
  readonly dueDate?: string | null;
  readonly department?: string | null;
  readonly businessUnit?: string | null;
  readonly assignment?: {
    readonly targetType: AssignmentTargetType;
    readonly targetId: string;
    readonly targetLabel: string;
    readonly reason?: string;
  } | null;
};
