import type { WorkflowActionType } from "@/lib/platform/workflow/types";

export interface WorkflowActionCatalogEntry {
  actionType: WorkflowActionType | string;
  label: string;
  description: string;
  status: "live" | "stub";
}

/** Platform-wide action types the workflow engine can dispatch. */
export const WORKFLOW_ACTION_CATALOG: WorkflowActionCatalogEntry[] = [
  {
    actionType: "create_task",
    label: "Create Task",
    description: "Generate a follow-up task for assigned roles",
    status: "live",
  },
  {
    actionType: "send_notification",
    label: "Send Notification",
    description: "Deliver email, SMS, or portal notification",
    status: "live",
  },
  {
    actionType: "request_approval",
    label: "Request Approval",
    description: "Open an approval gate before continuing",
    status: "live",
  },
  {
    actionType: "record_audit",
    label: "Record Audit",
    description: "Write a workflow audit entry",
    status: "live",
  },
  {
    actionType: "escalate",
    label: "Escalate",
    description: "Escalate to higher authority roles",
    status: "live",
  },
  {
    actionType: "schedule_timer",
    label: "Schedule Timer",
    description: "Start a workflow timer with expiry actions",
    status: "stub",
  },
  {
    actionType: "set_deadline",
    label: "Set Deadline",
    description: "Attach a deadline with miss actions",
    status: "stub",
  },
  {
    actionType: "run_automation",
    label: "Run Automation",
    description: "Execute a registered platform automation action",
    status: "stub",
  },
  {
    actionType: "custom",
    label: "Custom Action",
    description: "Domain-specific handler registered by consuming module",
    status: "live",
  },
];

const actionByType = new Map(
  WORKFLOW_ACTION_CATALOG.map((entry) => [entry.actionType, entry])
);

export function getWorkflowActionCatalogEntry(
  actionType: string
): WorkflowActionCatalogEntry | undefined {
  return actionByType.get(actionType);
}

export function isKnownWorkflowActionType(actionType: string): boolean {
  return actionByType.has(actionType);
}
