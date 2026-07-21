/**
 * RC-7 — Workflow Automation Studio types.
 * Visual graph of Trigger · Condition · Action · Approval · Delay ·
 * Notification · Integration · AI Step · Graph Update.
 */

export const WORKFLOW_STUDIO_VERSION = "1.0.0";

export const STUDIO_NODE_TYPES = [
  "trigger",
  "condition",
  "action",
  "approval",
  "delay",
  "notification",
  "integration",
  "ai_step",
  "graph_update",
] as const;

export type StudioNodeType = (typeof STUDIO_NODE_TYPES)[number];

export const STUDIO_WORKFLOW_STATUS = [
  "draft",
  "published",
  "archived",
] as const;

export type StudioWorkflowStatus = (typeof STUDIO_WORKFLOW_STATUS)[number];

export const STUDIO_RUN_STATUSES = [
  "pending",
  "running",
  "waiting_approval",
  "waiting_delay",
  "completed",
  "failed",
  "cancelled",
] as const;

export type StudioRunStatus = (typeof STUDIO_RUN_STATUSES)[number];

export type StudioPosition = { x: number; y: number };

export type StudioNodeBase = {
  id: string;
  type: StudioNodeType;
  label: string;
  position?: StudioPosition;
  config?: Record<string, unknown>;
};

export type TriggerNode = StudioNodeBase & {
  type: "trigger";
  config: {
    triggerType: "manual" | "event" | "schedule" | "webhook" | "system";
    eventKey?: string;
    cron?: string;
    description?: string;
  };
};

export type ConditionNode = StudioNodeBase & {
  type: "condition";
  config: {
    field: string;
    operator:
      | "equals"
      | "not_equals"
      | "greater_than"
      | "less_than"
      | "contains"
      | "exists"
      | "in";
    value?: unknown;
    description?: string;
  };
};

export type ActionNode = StudioNodeBase & {
  type: "action";
  config: {
    actionType:
      | "create_task"
      | "record_audit"
      | "escalate"
      | "set_field"
      | "custom";
    target?: string;
    payload?: Record<string, unknown>;
    description?: string;
  };
};

export type ApprovalNode = StudioNodeBase & {
  type: "approval";
  config: {
    role: string;
    rationale: string;
    /** Never auto-approved — humans decide. */
    requireHuman: true;
    escalateAfterHours?: number;
  };
};

export type DelayNode = StudioNodeBase & {
  type: "delay";
  config: {
    durationHours: number;
    reason?: string;
  };
};

export type NotificationNode = StudioNodeBase & {
  type: "notification";
  config: {
    channel: "email" | "sms" | "portal" | "dashboard";
    template: string;
    audience: string;
    description?: string;
  };
};

export type IntegrationNode = StudioNodeBase & {
  type: "integration";
  config: {
    provider: string;
    /** soft_read = feeds/KG only; sync = platform connector sync (never raw vendor API). */
    mode: "soft_read" | "sync";
    objectHint?: string;
    description?: string;
  };
};

export type AiStepNode = StudioNodeBase & {
  type: "ai_step";
  config: {
    question: string;
    /** Soft-read Copilot 2.0 — never mutates org state. */
    softReadOnly: true;
    capabilityHint?: string;
  };
};

export type GraphUpdateNode = StudioNodeBase & {
  type: "graph_update";
  config: {
    mode: "rebuild" | "ingest_hint";
    description?: string;
  };
};

export type StudioNode =
  | TriggerNode
  | ConditionNode
  | ActionNode
  | ApprovalNode
  | DelayNode
  | NotificationNode
  | IntegrationNode
  | AiStepNode
  | GraphUpdateNode;

export type StudioEdge = {
  id: string;
  from: string;
  to: string;
  /** For condition branches: true | false | default */
  branch?: "true" | "false" | "default" | "approved" | "rejected";
  label?: string;
};

export type StudioWorkflowDefinition = {
  id: string;
  key: string;
  name: string;
  description: string;
  version: string;
  status: StudioWorkflowStatus;
  category: string;
  tags: string[];
  nodes: StudioNode[];
  edges: StudioEdge[];
  entryNodeId: string;
};

export type StudioNodeResult = {
  nodeId: string;
  type: StudioNodeType;
  label: string;
  status: "ok" | "skipped" | "waiting" | "failed" | "blocked";
  output?: Record<string, unknown>;
  message: string;
};

export type StudioRunResult = {
  runId: string;
  workflowId: string;
  workflowKey: string;
  organizationId: string;
  status: StudioRunStatus;
  dryRun: boolean;
  startedAt: string;
  finishedAt?: string;
  steps: StudioNodeResult[];
  context: Record<string, unknown>;
  contributingDomains: string[];
  governance: {
    mayAutoExecute: false;
    approvalsRequireHuman: true;
    integrationVendorApisForbidden: true;
  };
};

export const EXAMPLE_WORKFLOW_KEYS = [
  "employee_onboarding",
  "student_enrollment",
  "grant_renewal",
  "budget_approval",
  "purchase_approval",
  "scholarship_approval",
  "lead_follow_up",
  "contract_review",
  "vendor_approval",
] as const;

export type ExampleWorkflowKey = (typeof EXAMPLE_WORKFLOW_KEYS)[number];
