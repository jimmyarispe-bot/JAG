import type { ConditionDefinition } from "@/lib/platform/automation/engine-types";

/** Platform-wide automation condition catalog. */
export const AUTOMATION_CONDITION_CATALOG: ConditionDefinition[] = [
  {
    conditionKey: "permission.has_access",
    name: "Permission Check",
    description: "Verify actor has required permissions",
    domain: "platform",
    conditionType: "permission_check",
    config: { permission: "platform.automation.execute" },
    sortOrder: 10,
  },
  {
    conditionKey: "entity.state.active",
    name: "Entity State Active",
    description: "Verify entity is in an active state",
    domain: "platform",
    conditionType: "entity_state",
    config: { field: "status", value: "active" },
    sortOrder: 20,
  },
  {
    conditionKey: "workflow.state.matches",
    name: "Workflow State Match",
    description: "Verify workflow instance is in expected state",
    domain: "platform",
    conditionType: "workflow_state",
    config: { field: "currentStateKey" },
    sortOrder: 30,
  },
  {
    conditionKey: "decision.result.accepted",
    name: "Decision Result Accepted",
    description: "Verify decision execution produced an accepted outcome",
    domain: "platform",
    conditionType: "decision_result",
    config: { field: "outcomeKey" },
    sortOrder: 40,
  },
  {
    conditionKey: "relationship.exists",
    name: "Relationship Exists",
    description: "Verify a platform relationship exists between entities",
    domain: "platform",
    conditionType: "relationship_exists",
    config: { relationshipType: "student.teacher" },
    sortOrder: 50,
  },
  {
    conditionKey: "tag.exists",
    name: "Tag Exists",
    description: "Verify an entity has a specific tag applied",
    domain: "platform",
    conditionType: "tag_exists",
    config: { tagSlug: "priority" },
    sortOrder: 60,
  },
  {
    conditionKey: "time.window.business_hours",
    name: "Business Hours Window",
    description: "Verify current time falls within configured business hours",
    domain: "platform",
    conditionType: "time_window",
    config: { startHour: 8, endHour: 17, timezone: "America/New_York" },
    sortOrder: 70,
  },
];

export const PLATFORM_AUTOMATION_CONDITION_CATALOG = AUTOMATION_CONDITION_CATALOG;

export function getAutomationConditionCatalogEntry(
  conditionKey: string
): ConditionDefinition | undefined {
  return AUTOMATION_CONDITION_CATALOG.find((entry) => entry.conditionKey === conditionKey);
}

export function isKnownAutomationConditionKey(conditionKey: string): boolean {
  return AUTOMATION_CONDITION_CATALOG.some((entry) => entry.conditionKey === conditionKey);
}
