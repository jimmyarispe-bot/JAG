import type { ActionDefinition } from "@/lib/platform/automation/engine-types";

/** Platform-wide automation action catalog — all actions execute through registered handlers. */
export const AUTOMATION_ACTION_CATALOG: ActionDefinition[] = [
  {
    actionKey: "create_task",
    name: "Create Task",
    description: "Create a follow-up task for assigned roles",
    domain: "platform",
    actionType: "create_task",
    status: "live",
    sortOrder: 10,
  },
  {
    actionKey: "update_entity",
    name: "Update Entity",
    description: "Update fields on a platform entity record",
    domain: "platform",
    actionType: "update_entity",
    status: "live",
    sortOrder: 20,
  },
  {
    actionKey: "create_activity",
    name: "Create Activity",
    description: "Record an activity event via the Activity Engine",
    domain: "platform",
    actionType: "create_activity",
    status: "live",
    sortOrder: 30,
  },
  {
    actionKey: "create_note",
    name: "Create Note",
    description: "Attach a note to an entity via the Notes Engine",
    domain: "platform",
    actionType: "create_note",
    status: "live",
    sortOrder: 40,
  },
  {
    actionKey: "apply_tag",
    name: "Apply Tag",
    description: "Apply a tag to an entity via the Tag Engine",
    domain: "platform",
    actionType: "apply_tag",
    status: "live",
    sortOrder: 50,
  },
  {
    actionKey: "start_workflow",
    name: "Start Workflow",
    description: "Start a workflow instance via the Workflow Engine",
    domain: "platform",
    actionType: "start_workflow",
    status: "live",
    sortOrder: 60,
  },
  {
    actionKey: "send_notification",
    name: "Send Notification",
    description: "Send an in-app or portal notification (stub in Phase 1)",
    domain: "platform",
    actionType: "send_notification",
    status: "stub",
    sortOrder: 70,
  },
  {
    actionKey: "send_email",
    name: "Send Email",
    description: "Send an email notification (stub in Phase 1)",
    domain: "platform",
    actionType: "send_email",
    status: "stub",
    sortOrder: 80,
  },
  {
    actionKey: "publish_event",
    name: "Publish Event",
    description: "Publish a platform event via the Event Engine",
    domain: "platform",
    actionType: "publish_event",
    status: "live",
    sortOrder: 90,
  },
  {
    actionKey: "execute_decision",
    name: "Execute Decision",
    description: "Run a decision via the Decision Engine",
    domain: "platform",
    actionType: "execute_decision",
    status: "live",
    sortOrder: 100,
  },
];

export const PLATFORM_AUTOMATION_ACTION_CATALOG = AUTOMATION_ACTION_CATALOG;

export function getAutomationActionCatalogEntry(
  actionKey: string
): ActionDefinition | undefined {
  return AUTOMATION_ACTION_CATALOG.find((entry) => entry.actionKey === actionKey);
}

export function isKnownAutomationActionKey(actionKey: string): boolean {
  return AUTOMATION_ACTION_CATALOG.some((entry) => entry.actionKey === actionKey);
}
