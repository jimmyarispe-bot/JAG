import type { WorkflowAuditEventType, WorkflowDefinition, WorkflowVersionStatus } from "@/lib/platform/workflow/types";

export type { WorkflowVersionStatus };

export const WORKFLOW_INSTANCE_STATUSES = ["active", "completed", "cancelled"] as const;
export type WorkflowInstanceStatus = (typeof WORKFLOW_INSTANCE_STATUSES)[number];

export const WORKFLOW_TASK_STATUSES = ["open", "completed", "cancelled"] as const;
export type WorkflowTaskStatus = (typeof WORKFLOW_TASK_STATUSES)[number];

export const WORKFLOW_TIMER_STATUSES = ["pending", "fired", "cancelled"] as const;
export type WorkflowTimerStatus = (typeof WORKFLOW_TIMER_STATUSES)[number];

export interface PlatformWorkflowDefinitionRow {
  id: string;
  workflow_key: string;
  domain: string;
  entity_type: string;
  name: string;
  description: string | null;
  school_id: string | null;
  status: WorkflowVersionStatus;
  sort_order: number;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PlatformWorkflowVersionRow {
  id: string;
  definition_id: string;
  version_number: number;
  status: WorkflowVersionStatus;
  definition_snapshot: WorkflowDefinition;
  initial_state_key: string;
  published_at: string | null;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface PlatformWorkflowInstanceRow {
  id: string;
  version_id: string;
  workflow_key: string;
  domain: string;
  entity_type: string;
  entity_id: string;
  school_id: string | null;
  organization_id: string | null;
  current_state_key: string;
  status: WorkflowInstanceStatus;
  facts: Record<string, unknown>;
  metadata: Record<string, unknown>;
  started_at: string;
  completed_at: string | null;
  started_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformWorkflowStateHistoryRow {
  id: string;
  instance_id: string;
  version_id: string;
  event_type: WorkflowAuditEventType | string;
  from_state_key: string | null;
  to_state_key: string;
  transition_key: string | null;
  actor_user_id: string | null;
  summary: string;
  metadata: Record<string, unknown>;
  occurred_at: string;
}

export interface PlatformWorkflowTaskRow {
  id: string;
  instance_id: string;
  state_key: string | null;
  transition_key: string | null;
  action_key: string | null;
  task_name: string;
  task_status: WorkflowTaskStatus;
  due_at: string | null;
  assigned_roles: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
}

export interface PlatformWorkflowApprovalRow {
  id: string;
  instance_id: string;
  transition_key: string;
  gate_key: string;
  status: "pending" | "approved" | "rejected" | "escalated";
  requested_by: string | null;
  decided_by: string | null;
  decided_at: string | null;
  decision_notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PlatformWorkflowTimerRow {
  id: string;
  instance_id: string;
  timer_key: string;
  state_key: string | null;
  status: WorkflowTimerStatus;
  fires_at: string;
  fired_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PersistWorkflowStateChangeInput {
  instanceId: string;
  versionId: string;
  fromStateKey: string | null;
  toStateKey: string;
  transitionKey?: string | null;
  eventType: WorkflowAuditEventType | string;
  summary: string;
  actorUserId?: string | null;
  metadata?: Record<string, unknown>;
  facts?: Record<string, unknown>;
  markCompleted?: boolean;
}

export interface CreateWorkflowTaskInput {
  instanceId: string;
  taskName: string;
  stateKey?: string | null;
  transitionKey?: string | null;
  actionKey?: string | null;
  dueAt?: string | null;
  assignedRoles?: string[];
  metadata?: Record<string, unknown>;
}

export interface PersistWorkflowApprovalInput {
  instanceId: string;
  transitionKey: string;
  gateKey: string;
  requestedBy?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CreateWorkflowTimerInput {
  instanceId: string;
  timerKey: string;
  stateKey?: string | null;
  firesAt: string;
  metadata?: Record<string, unknown>;
}

export interface GetOrCreateInstanceInput {
  workflowKey: string;
  domain: string;
  entityType: string;
  entityId: string;
  schoolId?: string | null;
  organizationId?: string | null;
  currentStateKey: string;
  startedBy?: string | null;
  facts?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
