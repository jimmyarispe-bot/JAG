import type { TriggerDefinition } from "@/lib/platform/automation/engine-types";

/** Platform-wide automation trigger catalog. */
export const AUTOMATION_TRIGGER_CATALOG: TriggerDefinition[] = [
  {
    triggerKey: "event.entity.created",
    name: "Entity Created Event",
    description: "Fires when a platform entity is created",
    domain: "platform",
    triggerType: "event",
    status: "active",
    eventType: "platform.entity.created",
    sortOrder: 10,
  },
  {
    triggerKey: "event.entity.updated",
    name: "Entity Updated Event",
    description: "Fires when a platform entity is updated",
    domain: "platform",
    triggerType: "event",
    status: "active",
    eventType: "platform.entity.updated",
    sortOrder: 20,
  },
  {
    triggerKey: "event.workflow.transitioned",
    name: "Workflow Transitioned Event",
    description: "Fires when a workflow state transition completes",
    domain: "platform",
    triggerType: "event",
    status: "active",
    eventType: "platform.workflow.transitioned",
    sortOrder: 30,
  },
  {
    triggerKey: "event.decision.executed",
    name: "Decision Executed Event",
    description: "Fires when a decision engine execution completes",
    domain: "platform",
    triggerType: "event",
    status: "active",
    eventType: "platform.decision.executed",
    sortOrder: 40,
  },
  {
    triggerKey: "workflow.transition.completed",
    name: "Workflow Transition Completed",
    description: "Fires when a workflow transition action chain completes",
    domain: "platform",
    triggerType: "workflow",
    status: "active",
    sortOrder: 50,
  },
  {
    triggerKey: "manual.invoke",
    name: "Manual Invocation",
    description: "Fires when an automation is invoked manually",
    domain: "platform",
    triggerType: "manual",
    status: "active",
    sortOrder: 60,
  },
  {
    triggerKey: "schedule.daily",
    name: "Daily Schedule",
    description: "Schedule trigger definition — cron delivery deferred to Phase 2",
    domain: "platform",
    triggerType: "schedule",
    status: "active",
    scheduleExpression: "0 0 * * *",
    sortOrder: 70,
  },
];

export const PLATFORM_AUTOMATION_TRIGGER_CATALOG = AUTOMATION_TRIGGER_CATALOG;

export function getAutomationTriggerCatalogEntry(
  triggerKey: string
): TriggerDefinition | undefined {
  return AUTOMATION_TRIGGER_CATALOG.find((entry) => entry.triggerKey === triggerKey);
}

export function isKnownAutomationTriggerKey(triggerKey: string): boolean {
  return AUTOMATION_TRIGGER_CATALOG.some((entry) => entry.triggerKey === triggerKey);
}
