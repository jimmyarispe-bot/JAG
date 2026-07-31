/** Decision SDK — source / workflow / assignment / policy contracts. */

export type DecisionStatus =
  | "Open"
  | "In Progress"
  | "Blocked"
  | "Resolved"
  | "Cancelled";

export type DecisionDescriptor = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly status: DecisionStatus;
  readonly sourceId: string;
  readonly createdAt: string;
};

export interface DecisionSource {
  readonly id: string;
  readonly version: string;
  readonly label: string;
  list(organizationId: string): readonly DecisionDescriptor[];
}

export interface DecisionWorkflow {
  readonly id: string;
  readonly version: string;
  canTransition(from: DecisionStatus, to: DecisionStatus): boolean;
  nextStatuses(from: DecisionStatus): readonly DecisionStatus[];
}

export interface DecisionAssignment {
  readonly decisionId: string;
  readonly assigneeUserId: string;
  readonly assignedAt: string;
  readonly assignedBy: string;
}

export interface DecisionPolicy {
  readonly id: string;
  readonly version: string;
  requiresApproval(decision: DecisionDescriptor): boolean;
  maxOpenPerAssignee(): number;
}

export type DecisionProviderRegistration = {
  readonly source: DecisionSource;
  readonly workflow?: DecisionWorkflow;
  readonly policy?: DecisionPolicy;
  readonly registeredAt: string;
};
