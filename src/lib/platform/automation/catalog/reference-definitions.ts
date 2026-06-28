import type { AutomationDefinition } from "@/lib/platform/automation/engine-types";

/**
 * Reference automation definitions demonstrating the data-driven model.
 * Domain modules register their own automations — these are platform-wide templates.
 */
export const PLATFORM_REFERENCE_AUTOMATION_DEFINITIONS: AutomationDefinition[] = [
  {
    automationKey: "ref_platform_entity_created_activity",
    name: "Entity Created Activity Log",
    description: "Record an activity event when a platform entity is created",
    domain: "platform",
    version: 1,
    status: "active",
    triggerKeys: ["event.entity.created"],
    conditionKeys: ["permission.has_access"],
    steps: [
      {
        stepKey: "log_activity",
        actionKey: "create_activity",
        sortOrder: 10,
        config: {
          eventType: "workflow",
          title: "Entity created automation",
        },
      },
    ],
    retryPolicy: { maxAttempts: 3, initialDelayMs: 500, backoffMultiplier: 2 },
    failurePolicy: { strategy: "stop" },
    sortOrder: 10,
    tags: ["platform", "activity"],
  },
  {
    automationKey: "ref_platform_workflow_followup_task",
    name: "Workflow Transition Follow-up Task",
    description: "Create a follow-up task after a workflow transition",
    domain: "platform",
    version: 1,
    status: "active",
    triggerKeys: ["event.workflow.transitioned", "workflow.transition.completed"],
    conditionKeys: ["workflow.state.matches"],
    steps: [
      {
        stepKey: "create_followup",
        actionKey: "create_task",
        sortOrder: 10,
        config: { title: "Review workflow transition", priority: "medium" },
      },
      {
        stepKey: "notify_team",
        actionKey: "send_notification",
        sortOrder: 20,
        config: { channel: "dashboard_notification", message: "Workflow transition completed" },
      },
    ],
    failurePolicy: { strategy: "continue" },
    sortOrder: 20,
    tags: ["platform", "workflow"],
  },
  {
    automationKey: "ref_platform_manual_note",
    name: "Manual Note Automation",
    description: "Create a note when manually invoked",
    domain: "platform",
    version: 1,
    status: "active",
    triggerKeys: ["manual.invoke"],
    steps: [
      {
        stepKey: "create_note",
        actionKey: "create_note",
        sortOrder: 10,
        config: { body: "Automation note", category: "general" },
      },
    ],
    sortOrder: 30,
    tags: ["platform", "notes"],
  },
  {
    automationKey: "ref_platform_decision_chain",
    name: "Decision Chain Automation",
    description: "Execute a decision and publish the result event",
    domain: "platform",
    version: 1,
    status: "active",
    triggerKeys: ["event.decision.executed", "manual.invoke"],
    conditionKeys: ["decision.result.accepted"],
    steps: [
      {
        stepKey: "run_decision",
        actionKey: "execute_decision",
        sortOrder: 10,
        config: { decisionType: "ref_platform_escalation_priority" },
      },
      {
        stepKey: "publish_result",
        actionKey: "publish_event",
        sortOrder: 20,
        config: { eventType: "platform.decision.executed" },
      },
    ],
    sortOrder: 40,
    tags: ["platform", "decision"],
  },
];

export const PLATFORM_AUTOMATION_CATALOG = PLATFORM_REFERENCE_AUTOMATION_DEFINITIONS;
