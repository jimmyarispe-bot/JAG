import { dispatchAutomationTrigger } from "@/lib/platform/automation/execution/execute";
import { registerWorkflowActionHandler } from "@/lib/platform/workflow/engine/context";
import type { WorkflowActionDefinition, WorkflowInstanceContext } from "@/lib/platform/workflow/types";

/** Bridge Workflow Engine run_automation action to the Platform Automation Engine. */
export async function handleWorkflowRunAutomationAction(
  context: WorkflowInstanceContext,
  action: WorkflowActionDefinition
): Promise<{ success: boolean; error?: string; auditSummary?: string }> {
  const automationKey = String(action.config?.automationKey ?? "");
  const triggerKey = String(action.config?.triggerKey ?? "workflow.transition.completed");

  if (!automationKey) {
    return {
      success: false,
      error: "run_automation action requires config.automationKey",
    };
  }

  const result = await dispatchAutomationTrigger({
    triggerKey,
    triggerType: "workflow",
    organizationId: (context.facts?.organizationId as string | null) ?? null,
    schoolId: context.schoolId,
    actorId: context.actorUserId,
    entityType: context.entityType,
    entityId: context.entityId,
    facts: {
      ...(context.facts ?? {}),
      workflowKey: context.workflowKey,
      currentStateKey: context.currentStateKey,
    },
    payload: {
      automationKey,
      workflowKey: context.workflowKey,
      transitionKey: action.config?.transitionKey,
    },
    metadata: { source: "workflow_engine", actionKey: action.key },
  });

  const failed = result.results.some((r) => r.status === "failed");
  return {
    success: !failed,
    error: failed ? result.errors.join("; ") : undefined,
    auditSummary: `Automation dispatch: ${automationKey} (${result.results.length} execution(s))`,
  };
}

export function registerWorkflowAutomationBridge(): void {
  registerWorkflowActionHandler("run_automation", handleWorkflowRunAutomationAction);
}
