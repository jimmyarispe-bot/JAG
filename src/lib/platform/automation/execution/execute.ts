import {
  buildAutomationContext,
  nextAutomationExecutionId,
} from "@/lib/platform/automation/execution/context";
import { runAutomationPipeline } from "@/lib/platform/automation/execution/pipeline";
import { getAutomationDefinition } from "@/lib/platform/automation/registry/automation-registry";
import { getAutomationsByTriggerKey } from "@/lib/platform/automation/registry/automation-registry";
import { getTriggerHandler } from "@/lib/platform/automation/registry/trigger-registry";
import type {
  AutomationExecutionResult,
  DispatchAutomationInput,
  DispatchAutomationResult,
  ExecuteAutomationInput,
} from "@/lib/platform/automation/engine-types";
import { AUTOMATION_ENGINE_VERSION } from "@/lib/platform/automation/version";

/** Automation Execution Engine — primary public API for running automations. */
export async function executeAutomation(
  input: ExecuteAutomationInput
): Promise<AutomationExecutionResult> {
  const startedAt = new Date().toISOString();
  const definition = getAutomationDefinition(input.automationKey);

  if (!definition) {
    return {
      executionId: nextAutomationExecutionId(),
      automationKey: input.automationKey,
      triggerKey: input.triggerKey,
      status: "failed",
      actions: [],
      conditionsPassed: false,
      attempt: 0,
      errors: [`Unknown automation: ${input.automationKey}`],
      startedAt,
      completedAt: new Date().toISOString(),
    };
  }

  if (definition.status !== "active") {
    return {
      executionId: nextAutomationExecutionId(),
      automationKey: input.automationKey,
      triggerKey: input.triggerKey,
      status: "skipped",
      actions: [],
      conditionsPassed: false,
      attempt: 0,
      errors: [`Automation "${input.automationKey}" is not active (status: ${definition.status})`],
      startedAt,
      completedAt: new Date().toISOString(),
    };
  }

  const executionId = nextAutomationExecutionId();
  const context = buildAutomationContext(input, executionId);

  const pipeline = await runAutomationPipeline(context, definition.steps, {
    stopOnFailure: definition.failurePolicy?.strategy !== "continue",
  });

  return {
    executionId,
    automationKey: input.automationKey,
    triggerKey: input.triggerKey,
    status: pipeline.status,
    actions: pipeline.actions,
    conditionsPassed: pipeline.conditionsPassed,
    attempt: 1,
    errors: pipeline.errors,
    startedAt,
    completedAt: new Date().toISOString(),
    metadata: {
      engineVersion: AUTOMATION_ENGINE_VERSION,
      domain: definition.domain,
    },
  };
}

/** Dispatch automations matching a trigger via registered trigger handlers. */
export async function dispatchAutomationTrigger(
  input: DispatchAutomationInput
): Promise<DispatchAutomationResult> {
  const handler = getTriggerHandler(input.triggerType);
  const matchedAutomationKeys = handler
    ? (await handler(input)).matchedAutomationKeys
    : getAutomationsByTriggerKey(input.triggerKey).map((def) => def.automationKey);

  const results: AutomationExecutionResult[] = [];
  const errors: string[] = [];

  for (const automationKey of matchedAutomationKeys) {
    const result = await executeAutomation({
      automationKey,
      triggerKey: input.triggerKey,
      triggerType: input.triggerType,
      organizationId: input.organizationId,
      schoolId: input.schoolId,
      actorId: input.actorId,
      entityType: input.entityType,
      entityId: input.entityId,
      facts: input.facts,
      payload: input.payload,
      supabase: input.supabase,
      metadata: input.metadata,
      dryRun: input.dryRun,
    });

    results.push(result);
    if (result.errors.length) errors.push(...result.errors);
  }

  return {
    triggerKey: input.triggerKey,
    triggerType: input.triggerType,
    matchedAutomations: matchedAutomationKeys,
    results,
    errors,
  };
}

export { AUTOMATION_ENGINE_VERSION };
