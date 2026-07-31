/**
 * Universal Workflow Framework (Sprint 072).
 * Applications register definitions; platform executes them.
 * Nested under workflows/framework to avoid colliding with Workflow Studio.
 */

export type WorkflowParticipantRole =
  | "owner"
  | "reviewer"
  | "approver"
  | "observer"
  | "assignee";

export type WorkflowInstanceStatus =
  | "active"
  | "completed"
  | "cancelled"
  | "suspended";

export type WorkflowConditionOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "exists"
  | "in";

export type WorkflowCondition = {
  path: string;
  op: WorkflowConditionOperator;
  value?: unknown;
};

export type WorkflowConditionGroup = {
  all?: Array<WorkflowCondition | WorkflowConditionGroup>;
  any?: Array<WorkflowCondition | WorkflowConditionGroup>;
};

export type WorkflowActionType =
  | "create_decision"
  | "assign_decision"
  | "send_notification"
  | "run_automation"
  | "record_timeline"
  | "attach_document"
  | "update_entity_metadata";

export type WorkflowAction = {
  type: WorkflowActionType;
  params: Record<string, unknown>;
};

export type WorkflowStateDefinition = {
  key: string;
  label: string;
  /** initial | intermediate | terminal */
  kind: "initial" | "intermediate" | "terminal";
};

export type WorkflowTransitionDefinition = {
  key: string;
  from: string;
  to: string;
  label: string;
  /** Permission key required (evaluated against grantedPermissions). */
  permission?: string | null;
  /** Workflow participant roles allowed to fire this transition. */
  allowedParticipantRoles?: WorkflowParticipantRole[];
  conditions?: WorkflowConditionGroup;
  actions?: WorkflowAction[];
};

export type WorkflowParticipantDefinition = {
  role: WorkflowParticipantRole;
  /** Application maps this to its domain role labels. */
  label: string;
  required?: boolean;
};

export type WorkflowDefinition = {
  id: string;
  applicationId: string | null;
  name: string;
  version: string;
  /** Entity types that may host this workflow (empty = any / none required). */
  entityTypes: string[];
  states: WorkflowStateDefinition[];
  transitions: WorkflowTransitionDefinition[];
  participants: WorkflowParticipantDefinition[];
  permissions: Array<{ action: string; permission: string }>;
  metadata: Record<string, unknown>;
};

export type WorkflowParticipantBinding = {
  role: WorkflowParticipantRole;
  userId: string | null;
  displayName: string | null;
  /** Application domain role mapping (opaque to platform). */
  domainRole: string | null;
};

export type WorkflowHistoryEntry = {
  id: string;
  action: "started" | "transitioned" | "cancelled" | "action_executed" | "suspended" | "resumed";
  fromState: string | null;
  toState: string | null;
  transitionKey: string | null;
  actorUserId: string | null;
  reason: string | null;
  timestamp: string;
  generatedActions: string[];
};

export type WorkflowInstance = {
  id: string;
  definitionId: string;
  definitionVersion: string;
  applicationId: string | null;
  organizationId: string | null;
  entityType: string | null;
  entityId: string | null;
  currentState: string;
  status: WorkflowInstanceStatus;
  participants: WorkflowParticipantBinding[];
  /** Deterministic fact bag for conditions. */
  facts: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  history: WorkflowHistoryEntry[];
  metadata: Record<string, unknown>;
};

export type StartWorkflowInput = {
  definitionId: string;
  organizationId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  actorUserId?: string | null;
  participants?: WorkflowParticipantBinding[];
  facts?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  reason?: string | null;
  now?: string;
};

export type TransitionWorkflowInput = {
  instanceId: string;
  transitionKey: string;
  actorUserId?: string | null;
  /** Actor's workflow participant role for this instance (if any). */
  actorParticipantRole?: WorkflowParticipantRole | null;
  /** IAM permission keys already resolved for the actor. */
  grantedPermissions?: ReadonlySet<string> | readonly string[];
  reason?: string | null;
  /** Merge into instance facts before evaluating conditions. */
  factUpdates?: Record<string, unknown>;
  now?: string;
};
