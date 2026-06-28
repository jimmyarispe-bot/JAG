import type { NotificationChannel } from "@/lib/platform/automation/types";

export const WORKFLOW_VERSION_STATUSES = ["draft", "published", "archived"] as const;
export type WorkflowVersionStatus = (typeof WORKFLOW_VERSION_STATUSES)[number];

/** Lifecycle status for a registered workflow definition. */
export const WORKFLOW_DEFINITION_STATUSES = [
  "draft",
  "testing",
  "active",
  "published",
  "archived",
] as const;

export type WorkflowDefinitionStatus = (typeof WORKFLOW_DEFINITION_STATUSES)[number];

/** Semantic classification of a workflow state node. */
export const WORKFLOW_STATE_TYPES = [
  "initial",
  "intermediate",
  "terminal",
  "approval_pending",
  "waiting",
] as const;

export type WorkflowStateType = (typeof WORKFLOW_STATE_TYPES)[number];

/** Supported condition operators for transition guards. */
export const WORKFLOW_CONDITION_OPERATORS = [
  "equals",
  "not_equals",
  "greater_than",
  "less_than",
  "contains",
  "in",
  "not_in",
  "exists",
  "not_exists",
] as const;

export type WorkflowConditionOperator = (typeof WORKFLOW_CONDITION_OPERATORS)[number];

/** Trigger categories — domain modules map events to these trigger types. */
export const WORKFLOW_TRIGGER_TYPES = [
  "manual",
  "event",
  "schedule",
  "timer_expired",
  "deadline_missed",
  "approval_decided",
  "webhook",
  "system",
] as const;

export type WorkflowTriggerType = (typeof WORKFLOW_TRIGGER_TYPES)[number];

/** Action categories the execution engine can dispatch to registered handlers. */
export const WORKFLOW_ACTION_TYPES = [
  "create_task",
  "send_notification",
  "request_approval",
  "record_audit",
  "escalate",
  "schedule_timer",
  "set_deadline",
  "run_automation",
  "custom",
] as const;

export type WorkflowActionType = (typeof WORKFLOW_ACTION_TYPES)[number];

export const WORKFLOW_APPROVAL_DECISIONS = ["approved", "rejected", "escalated"] as const;
export type WorkflowApprovalDecision = (typeof WORKFLOW_APPROVAL_DECISIONS)[number];

export const WORKFLOW_AUDIT_EVENT_TYPES = [
  "instance_created",
  "state_entered",
  "state_exited",
  "transition_attempted",
  "transition_completed",
  "transition_blocked",
  "condition_evaluated",
  "approval_requested",
  "approval_decided",
  "timer_started",
  "timer_expired",
  "deadline_set",
  "deadline_missed",
  "escalation_triggered",
  "notification_sent",
  "task_created",
  "automation_executed",
  "error",
] as const;

export type WorkflowAuditEventType = (typeof WORKFLOW_AUDIT_EVENT_TYPES)[number];

export interface WorkflowActionDefinition {
  key: string;
  actionType: WorkflowActionType | string;
  label?: string;
  sortOrder?: number;
  config?: Record<string, unknown>;
}

export interface WorkflowConditionDefinition {
  key: string;
  field: string;
  operator: WorkflowConditionOperator;
  value?: unknown;
  /** Group key for AND/OR evaluation — defaults to "default". */
  logicGroup?: string;
  negate?: boolean;
}

export interface WorkflowTriggerDefinition {
  key: string;
  label: string;
  triggerType: WorkflowTriggerType;
  eventKey?: string;
  config?: Record<string, unknown>;
}

export interface WorkflowNotificationDefinition {
  key: string;
  channel: NotificationChannel;
  templateKey?: string;
  recipientRoles?: string[];
  recipientField?: string;
  config?: Record<string, unknown>;
}

export interface WorkflowTimerDefinition {
  key: string;
  label?: string;
  durationMinutes: number;
  onExpireActions?: WorkflowActionDefinition[];
}

export interface WorkflowDeadlineDefinition {
  key: string;
  label?: string;
  dueAtField?: string;
  offsetMinutes?: number;
  onMissActions?: WorkflowActionDefinition[];
  notificationActions?: WorkflowActionDefinition[];
}

export interface WorkflowEscalationDefinition {
  key: string;
  label?: string;
  escalateAfterMinutes: number;
  escalateToRoles?: string[];
  actions?: WorkflowActionDefinition[];
}

export interface WorkflowApprovalGate {
  key: string;
  label: string;
  approverRoles?: string[];
  /** Minimum approvers required — defaults to 1. */
  approverCount?: number;
  escalation?: WorkflowEscalationDefinition | null;
  deadline?: WorkflowDeadlineDefinition | null;
  metadata?: Record<string, unknown>;
}

export interface WorkflowStateDefinition {
  key: string;
  label: string;
  description?: string;
  stateType: WorkflowStateType;
  sortOrder: number;
  onEnterActions?: WorkflowActionDefinition[];
  onExitActions?: WorkflowActionDefinition[];
  timer?: WorkflowTimerDefinition | null;
  deadline?: WorkflowDeadlineDefinition | null;
  metadata?: Record<string, unknown>;
}

export interface WorkflowTransitionDefinition {
  key: string;
  label: string;
  fromStateKey: string;
  toStateKey: string;
  sortOrder: number;
  conditions?: WorkflowConditionDefinition[];
  triggerKeys?: string[];
  actions?: WorkflowActionDefinition[];
  approvalGate?: WorkflowApprovalGate | null;
  escalation?: WorkflowEscalationDefinition | null;
  notifications?: WorkflowNotificationDefinition[];
  metadata?: Record<string, unknown>;
}

/** Data-driven workflow definition — domain modules register these at import time. */
export interface WorkflowDefinition {
  workflowKey: string;
  name: string;
  description?: string;
  /** Consuming module domain key (e.g. hr, compliance) — engine is domain-agnostic. */
  domain: string;
  version: number;
  status: WorkflowDefinitionStatus;
  /** Entity type this workflow orchestrates within the domain. */
  entityType: string;
  initialStateKey: string;
  states: WorkflowStateDefinition[];
  transitions: WorkflowTransitionDefinition[];
  triggers: WorkflowTriggerDefinition[];
  sortOrder?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface WorkflowRegistrySnapshot {
  definitions: WorkflowDefinition[];
  domains: string[];
  registeredAt: string;
}

/** Runtime context for a workflow instance — persisted by consuming modules. */
export interface WorkflowInstanceContext {
  instanceId: string;
  workflowKey: string;
  domain: string;
  entityType: string;
  entityId: string;
  schoolId?: string | null;
  currentStateKey: string;
  actorUserId?: string | null;
  facts?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface WorkflowAuditEntry {
  eventType: WorkflowAuditEventType;
  summary: string;
  workflowKey: string;
  instanceId: string;
  domain: string;
  entityType: string;
  entityId: string;
  fromStateKey?: string | null;
  toStateKey?: string | null;
  transitionKey?: string | null;
  actorUserId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface WorkflowTransitionResult {
  success: boolean;
  fromStateKey: string;
  toStateKey?: string;
  transitionKey?: string;
  blockedBy?: "condition" | "approval" | "guard" | "invalid_state";
  approvalRequestId?: string;
  errors?: string[];
  auditEntries: WorkflowAuditEntry[];
}

export interface WorkflowApprovalRequest {
  requestId: string;
  workflowKey: string;
  instanceId: string;
  transitionKey: string;
  gateKey: string;
  status: "pending" | WorkflowApprovalDecision;
  requestedBy?: string | null;
  metadata?: Record<string, unknown>;
}
