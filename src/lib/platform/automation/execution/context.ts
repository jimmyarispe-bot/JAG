import type {
  AutomationExecutionContext,
  ExecuteAutomationInput,
} from "@/lib/platform/automation/engine-types";

let executionSequence = 0;

export function nextAutomationExecutionId(): string {
  executionSequence += 1;
  return `auto_exec_${Date.now()}_${executionSequence}`;
}

/** Automation Context Builder — assembles runtime context for execution. */
export function buildAutomationContext(
  input: ExecuteAutomationInput,
  executionId: string
): AutomationExecutionContext {
  return {
    executionId,
    automationKey: input.automationKey,
    triggerKey: input.triggerKey,
    triggerType: input.triggerType,
    organizationId: input.organizationId ?? null,
    schoolId: input.schoolId ?? null,
    actorId: input.actorId ?? null,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    facts: {
      ...(input.facts ?? {}),
      entityType: input.entityType ?? input.facts?.entityType,
      entityId: input.entityId ?? input.facts?.entityId,
      organizationId: input.organizationId ?? input.facts?.organizationId,
      schoolId: input.schoolId ?? input.facts?.schoolId,
      actorId: input.actorId ?? input.facts?.actorId,
    },
    payload: input.payload ?? {},
    supabase: input.supabase,
    metadata: {
      ...(input.metadata ?? {}),
      dryRun: input.dryRun ?? false,
    },
  };
}

export function mergeAutomationFacts(
  context: AutomationExecutionContext,
  additionalFacts?: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...context.facts,
    ...(additionalFacts ?? {}),
    automationKey: context.automationKey,
    triggerKey: context.triggerKey,
    triggerType: context.triggerType,
    entityType: context.entityType,
    entityId: context.entityId,
  };
}

export function resetAutomationExecutionSequence(): void {
  executionSequence = 0;
}
