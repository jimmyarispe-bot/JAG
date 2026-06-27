import type { WorkflowTriggerType } from "@/lib/platform/workflow/types";

export interface WorkflowTriggerCatalogEntry {
  triggerType: WorkflowTriggerType;
  label: string;
  description: string;
}

/** Platform-wide trigger types domain modules map events onto. */
export const WORKFLOW_TRIGGER_CATALOG: WorkflowTriggerCatalogEntry[] = [
  {
    triggerType: "manual",
    label: "Manual",
    description: "User-initiated transition from the workspace UI",
  },
  {
    triggerType: "event",
    label: "Domain Event",
    description: "Fired when a domain entity event occurs",
  },
  {
    triggerType: "schedule",
    label: "Schedule",
    description: "Cron or business-hours schedule",
  },
  {
    triggerType: "timer_expired",
    label: "Timer Expired",
    description: "Workflow timer reached expiry",
  },
  {
    triggerType: "deadline_missed",
    label: "Deadline Missed",
    description: "Workflow deadline was not met",
  },
  {
    triggerType: "approval_decided",
    label: "Approval Decided",
    description: "An approval gate received a decision",
  },
  {
    triggerType: "webhook",
    label: "Webhook",
    description: "External system webhook callback",
  },
  {
    triggerType: "system",
    label: "System",
    description: "Platform system-initiated transition",
  },
];

const triggerByType = new Map(
  WORKFLOW_TRIGGER_CATALOG.map((entry) => [entry.triggerType, entry])
);

export function getWorkflowTriggerCatalogEntry(
  triggerType: WorkflowTriggerType
): WorkflowTriggerCatalogEntry | undefined {
  return triggerByType.get(triggerType);
}

export function isKnownWorkflowTriggerType(triggerType: string): triggerType is WorkflowTriggerType {
  return triggerByType.has(triggerType as WorkflowTriggerType);
}
