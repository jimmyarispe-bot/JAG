/** RC4 Workflow Engine — JSON definition schema */

export type WorkflowCategory =
  | "admissions"
  | "students"
  | "families"
  | "communications"
  | "scholarships"
  | "billing"
  | "attendance"
  | "hr"
  | "calendar"
  | "workflows"
  | "founder"
  | "system"
  | "general";

export type WorkflowStatus = "active" | "disabled" | "archived";

export type WorkflowNodeType =
  | "trigger"
  | "condition"
  | "action"
  | "delay"
  | "branch"
  | "end";

export type WorkflowEdgeBranch = "default" | "true" | "false" | string;

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  label: string;
  position?: { x: number; y: number };
  config: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
  branch?: WorkflowEdgeBranch;
  label?: string;
}

export interface WorkflowDefinitionJson {
  version: "1.0";
  entryNodeId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  /** Top-level condition groups (AND/OR) evaluated before graph walk */
  conditionGroups?: ConditionGroup[];
}

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "exists"
  | "not_exists"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in";

export type ConditionField =
  | "student_status"
  | "school_id"
  | "program"
  | "grade"
  | "scholarship"
  | "balance"
  | "attendance_pct"
  | "tags"
  | "family_status"
  | "guardian_exists"
  | "communication_preference"
  | "event_type"
  | "custom";

export interface ConditionRule {
  id: string;
  field: ConditionField | string;
  operator: ConditionOperator;
  value?: unknown;
}

export interface ConditionGroup {
  id: string;
  op: "AND" | "OR";
  rules: ConditionRule[];
  groups?: ConditionGroup[];
}

export type WorkflowActionType =
  | "send_email"
  | "send_sms"
  | "portal_notification"
  | "create_task"
  | "update_student"
  | "update_family"
  | "assign_employee"
  | "schedule_meeting"
  | "generate_document"
  | "create_document"
  | "request_document_upload"
  | "approve_document"
  | "reject_document"
  | "archive_document"
  | "route_document_for_review"
  | "add_timeline_event"
  | "publish_executive_event"
  | "create_calendar_event"
  | "cancel_calendar_event"
  | "reschedule_calendar_event"
  | "generate_invoice"
  | "apply_scholarship"
  | "send_billing_reminder"
  | "mark_invoice_paid"
  | "issue_refund_request"
  | "escalate_overdue_account"
  | "transition_employee_lifecycle"
  | "approve_leave_request"
  | "start_employee_onboarding"
  | "send_hcm_reminder"
  | "emit_certification_alerts"
  | "open_founder_investigation"
  | "schedule_founder_review"
  | "generate_founder_report"
  | "wait"
  | "branch"
  | "call_provider_adapter";

export interface WorkflowRow {
  id: string;
  audit_id: string;
  organization_id: string | null;
  school_id: string | null;
  name: string;
  description: string;
  category: WorkflowCategory;
  trigger_key: string;
  definition: WorkflowDefinitionJson;
  enabled: boolean;
  version: number;
  status: WorkflowStatus;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  last_run_at: string | null;
  run_count: number;
  success_count: number;
  failure_count: number;
  max_retries: number;
  retry_backoff_ms: number;
}

export interface WorkflowListRow extends WorkflowRow {
  createdByName: string | null;
  successRate: number | null;
  triggerLabel: string;
}

export type ExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped"
  | "retrying"
  | "dead_letter"
  | "cancelled";

export interface WorkflowExecutionRow {
  id: string;
  workflow_id: string;
  organization_id: string | null;
  school_id: string | null;
  trigger_key: string;
  trigger_event_id: string | null;
  dedupe_key: string | null;
  status: ExecutionStatus;
  attempt: number;
  max_attempts: number;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
  error_details: Record<string, unknown> | null;
  context: Record<string, unknown>;
  result: Record<string, unknown>;
  created_at: string;
  workflowName?: string;
}

export interface WorkflowEventContext {
  triggerKey: string;
  eventType?: string;
  organizationId?: string | null;
  schoolId?: string | null;
  actorUserId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  studentId?: string | null;
  familyId?: string | null;
  activityEventId?: string | null;
  facts?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  /** Prevents duplicate runs for the same logical event */
  dedupeKey?: string | null;
  manual?: boolean;
}
