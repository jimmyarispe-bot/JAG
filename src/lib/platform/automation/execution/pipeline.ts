import { dispatchAutomationActions } from "@/lib/platform/automation/execution/dispatch";
import {
  aggregateExecutionErrors,
  buildFailureSummary,
  determineExecutionStatus,
} from "@/lib/platform/automation/execution/failure";
import { evaluateAutomationConditions } from "@/lib/platform/automation/execution/conditions";
import { executeWithRetry } from "@/lib/platform/automation/execution/retry";
import { recordAutomationAuditEntry, buildAutomationAuditEntry } from "@/lib/platform/automation/execution/audit";
import { getAutomationDefinition } from "@/lib/platform/automation/registry/automation-registry";
import type {
  AutomationActionResult,
  AutomationExecutionContext,
  AutomationExecutionResult,
  AutomationStepDefinition,
} from "@/lib/platform/automation/engine-types";

export interface PipelineOptions {
  stopOnFailure?: boolean;
}

/** Execution Pipeline — evaluates conditions, dispatches actions, applies failure policy. */
export async function runAutomationPipeline(
  context: AutomationExecutionContext,
  steps: AutomationStepDefinition[],
  options: PipelineOptions = {}
): Promise<{
  actions: AutomationActionResult[];
  conditionsPassed: boolean;
  status: AutomationExecutionResult["status"];
  errors: string[];
}> {
  const definition = getAutomationDefinition(context.automationKey);
  const conditionsPassed = await evaluateAutomationConditions(
    context,
    definition?.conditionKeys ?? []
  );

  if (!conditionsPassed) {
    return {
      actions: [],
      conditionsPassed: false,
      status: "skipped",
      errors: ["Automation conditions not satisfied"],
    };
  }

  const filteredSteps: AutomationStepDefinition[] = [];
  for (const step of steps) {
    const stepConditionsPassed = await evaluateAutomationConditions(
      context,
      step.conditionKeys ?? []
    );
    if (stepConditionsPassed) filteredSteps.push(step);
  }

  const retryResult = await executeWithRetry(definition?.retryPolicy, async () => {
    const actions = await dispatchAutomationActions(context, filteredSteps);
    const errors = aggregateExecutionErrors(actions);
    if (errors.length > 0 && (options.stopOnFailure ?? true)) {
      throw new Error(errors.join("; "));
    }
    return actions;
  });

  const actions = retryResult.result ?? [];
  const errors = retryResult.success
    ? aggregateExecutionErrors(actions)
    : [retryResult.error ?? "Pipeline execution failed", ...aggregateExecutionErrors(actions)];

  if (!retryResult.success && definition?.failurePolicy?.strategy === "continue") {
    return {
      actions,
      conditionsPassed: true,
      status: determineExecutionStatus(actions, true),
      errors,
    };
  }

  const status: AutomationExecutionResult["status"] = retryResult.success
    ? determineExecutionStatus(actions, true)
    : "failed";

  if (status === "failed" || status === "completed") {
    recordAutomationAuditEntry(
      buildAutomationAuditEntry(
        {
          executionId: context.executionId,
          automationKey: context.automationKey,
          triggerKey: context.triggerKey,
          status,
          actions,
          conditionsPassed: true,
          attempt: retryResult.attempts,
          errors,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        },
        buildFailureSummary(context.automationKey, errors)
      )
    );
  }

  return { actions, conditionsPassed: true, status, errors };
}
