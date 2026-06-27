import { evaluateAllWorkflowConditions } from "@/lib/platform/workflow/conditions/evaluator";
import {
  createWorkflowApprovalRequest,
  evaluateTransitionApprovalGate,
} from "@/lib/platform/workflow/approval/framework";
import {
  buildWorkflowAuditEntry,
  recordSkeletonAuditEntry,
} from "@/lib/platform/workflow/engine/audit";
import {
  getWorkflowActionHandler,
  mergeWorkflowFacts,
  type WorkflowExecutionHooks,
  type WorkflowExecutionOptions,
} from "@/lib/platform/workflow/engine/context";
import {
  getTransitionsFromState,
  getWorkflowDefinition,
  getWorkflowState,
  getWorkflowTransition,
} from "@/lib/platform/workflow/registry/registry";
import type {
  WorkflowActionDefinition,
  WorkflowAuditEntry,
  WorkflowDefinition,
  WorkflowInstanceContext,
  WorkflowTransitionDefinition,
  WorkflowTransitionResult,
} from "@/lib/platform/workflow/types";

async function dispatchActions(
  context: WorkflowInstanceContext,
  actions: WorkflowActionDefinition[] | undefined,
  options: WorkflowExecutionOptions,
  hooks: WorkflowExecutionHooks | undefined,
  auditEntries: WorkflowAuditEntry[]
): Promise<string[]> {
  const errors: string[] = [];
  if (!actions?.length) return errors;

  const sorted = [...actions].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  for (const action of sorted) {
    if (options.dryRun) {
      auditEntries.push(
        buildWorkflowAuditEntry(context, {
          eventType: "automation_executed",
          summary: `[dry-run] Would execute action "${action.actionType}" (${action.key})`,
          metadata: { actionKey: action.key, dryRun: true },
        })
      );
      continue;
    }

    const handler = getWorkflowActionHandler(action.actionType);
    if (!handler) {
      auditEntries.push(
        buildWorkflowAuditEntry(context, {
          eventType: "error",
          summary: `No handler registered for action type "${action.actionType}"`,
          metadata: { actionKey: action.key },
        })
      );
      errors.push(`No handler for action "${action.actionType}"`);
      continue;
    }

    const result = await handler(context, action);
    auditEntries.push(
      buildWorkflowAuditEntry(context, {
        eventType: result.success ? "automation_executed" : "error",
        summary: result.auditSummary ?? `Action "${action.actionType}" ${result.success ? "completed" : "failed"}`,
        metadata: { actionKey: action.key, error: result.error ?? null },
      })
    );

    if (hooks?.onActionExecuted) {
      await hooks.onActionExecuted(context, action, result);
    }

    if (!result.success && result.error) {
      errors.push(result.error);
    }
  }

  return errors;
}

function buildBlockedResult(
  context: WorkflowInstanceContext,
  transition: WorkflowTransitionDefinition,
  blockedBy: WorkflowTransitionResult["blockedBy"],
  errors: string[],
  auditEntries: WorkflowAuditEntry[],
  approvalRequestId?: string
): WorkflowTransitionResult {
  const entry = buildWorkflowAuditEntry(context, {
    eventType: "transition_blocked",
    summary: `Transition "${transition.key}" blocked (${blockedBy})`,
    fromStateKey: context.currentStateKey,
    toStateKey: transition.toStateKey,
    transitionKey: transition.key,
    metadata: { blockedBy, errors },
  });
  auditEntries.push(entry);
  recordSkeletonAuditEntry(entry);

  return {
    success: false,
    fromStateKey: context.currentStateKey,
    toStateKey: transition.toStateKey,
    transitionKey: transition.key,
    blockedBy,
    approvalRequestId,
    errors,
    auditEntries,
  };
}

/** List transitions available from the current state (ignoring conditions). */
export function getAvailableTransitions(
  context: WorkflowInstanceContext
): WorkflowTransitionDefinition[] {
  const definition = getWorkflowDefinition(context.workflowKey);
  if (!definition) return [];
  return getTransitionsFromState(definition, context.currentStateKey);
}

/** Evaluate whether a specific transition can proceed (conditions only). */
export function canExecuteTransition(
  context: WorkflowInstanceContext,
  transitionKey: string,
  options: WorkflowExecutionOptions = {}
): { allowed: boolean; errors: string[] } {
  const definition = getWorkflowDefinition(context.workflowKey);
  if (!definition) {
    return { allowed: false, errors: [`Unknown workflow "${context.workflowKey}"`] };
  }

  const transition = getWorkflowTransition(definition, transitionKey);
  if (!transition) {
    return { allowed: false, errors: [`Unknown transition "${transitionKey}"`] };
  }

  if (transition.fromStateKey !== context.currentStateKey) {
    return {
      allowed: false,
      errors: [
        `Transition "${transitionKey}" requires state "${transition.fromStateKey}" but instance is in "${context.currentStateKey}"`,
      ],
    };
  }

  const facts = mergeWorkflowFacts(context, options.additionalFacts);
  const conditionsMet = evaluateAllWorkflowConditions(transition.conditions, facts);
  if (!conditionsMet) {
    return { allowed: false, errors: ["Transition conditions not satisfied"] };
  }

  return { allowed: true, errors: [] };
}

/** Execute a workflow transition (skeleton — no persistence, dispatches registered action handlers). */
export async function executeWorkflowTransition(
  context: WorkflowInstanceContext,
  transitionKey: string,
  options: WorkflowExecutionOptions = {},
  hooks?: WorkflowExecutionHooks
): Promise<WorkflowTransitionResult> {
  const auditEntries: WorkflowAuditEntry[] = [];
  const definition = getWorkflowDefinition(context.workflowKey);

  if (!definition) {
    return {
      success: false,
      fromStateKey: context.currentStateKey,
      transitionKey,
      blockedBy: "guard",
      errors: [`Unknown workflow "${context.workflowKey}"`],
      auditEntries,
    };
  }

  const transition = getWorkflowTransition(definition, transitionKey);
  if (!transition) {
    return {
      success: false,
      fromStateKey: context.currentStateKey,
      transitionKey,
      blockedBy: "guard",
      errors: [`Unknown transition "${transitionKey}"`],
      auditEntries,
    };
  }

  if (transition.fromStateKey !== context.currentStateKey) {
    return buildBlockedResult(
      context,
      transition,
      "invalid_state",
      [
        `Cannot execute "${transitionKey}" from state "${context.currentStateKey}" (expected "${transition.fromStateKey}")`,
      ],
      auditEntries
    );
  }

  const facts = mergeWorkflowFacts(context, options.additionalFacts);
  if (!evaluateAllWorkflowConditions(transition.conditions, facts)) {
    auditEntries.push(
      buildWorkflowAuditEntry(context, {
        eventType: "condition_evaluated",
        summary: `Conditions failed for transition "${transition.key}"`,
        transitionKey: transition.key,
        fromStateKey: context.currentStateKey,
        toStateKey: transition.toStateKey,
        metadata: { conditions: transition.conditions ?? [] },
      })
    );
    return buildBlockedResult(context, transition, "condition", ["Conditions not satisfied"], auditEntries);
  }

  const approvalEval = evaluateTransitionApprovalGate(transition);
  if (approvalEval.required && !options.additionalFacts?.approvalStatus) {
    const request = createWorkflowApprovalRequest({
      context,
      transition,
      requestedBy: context.actorUserId,
    });
    return buildBlockedResult(
      context,
      transition,
      "approval",
      [approvalEval.reason ?? "Approval required"],
      auditEntries,
      request.requestId
    );
  }

  const fromState = getWorkflowState(definition, context.currentStateKey);
  const toState = getWorkflowState(definition, transition.toStateKey);

  auditEntries.push(
    buildWorkflowAuditEntry(context, {
      eventType: "transition_attempted",
      summary: `Transition "${transition.label}" from "${fromState?.label ?? context.currentStateKey}" to "${toState?.label ?? transition.toStateKey}"`,
      fromStateKey: context.currentStateKey,
      toStateKey: transition.toStateKey,
      transitionKey: transition.key,
      metadata: { triggerKey: options.triggerKey ?? null },
    })
  );

  const exitErrors = await dispatchActions(
    context,
    fromState?.onExitActions,
    options,
    hooks,
    auditEntries
  );
  const transitionErrors = await dispatchActions(
    context,
    transition.actions,
    options,
    hooks,
    auditEntries
  );
  const enterErrors = await dispatchActions(
    { ...context, currentStateKey: transition.toStateKey },
    toState?.onEnterActions,
    options,
    hooks,
    auditEntries
  );

  const allErrors = [...exitErrors, ...transitionErrors, ...enterErrors];

  const completedEntry = buildWorkflowAuditEntry(context, {
    eventType: "transition_completed",
    summary: `Transition "${transition.label}" completed → "${toState?.label ?? transition.toStateKey}"`,
    fromStateKey: context.currentStateKey,
    toStateKey: transition.toStateKey,
    transitionKey: transition.key,
    metadata: { errors: allErrors.length ? allErrors : null },
  });
  auditEntries.push(completedEntry);
  recordSkeletonAuditEntry(completedEntry);

  if (hooks?.onAudit) {
    for (const entry of auditEntries) {
      await hooks.onAudit(entry);
    }
  } else {
    for (const entry of auditEntries) {
      recordSkeletonAuditEntry(entry);
    }
  }

  return {
    success: allErrors.length === 0,
    fromStateKey: context.currentStateKey,
    toStateKey: transition.toStateKey,
    transitionKey: transition.key,
    errors: allErrors.length ? allErrors : undefined,
    auditEntries,
  };
}

/** Create a new instance context at the workflow initial state. */
export function createWorkflowInstanceContext(
  definition: WorkflowDefinition,
  input: {
    instanceId: string;
    entityId: string;
    schoolId?: string | null;
    actorUserId?: string | null;
    facts?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }
): WorkflowInstanceContext {
  return {
    instanceId: input.instanceId,
    workflowKey: definition.workflowKey,
    domain: definition.domain,
    entityType: definition.entityType,
    entityId: input.entityId,
    schoolId: input.schoolId ?? null,
    currentStateKey: definition.initialStateKey,
    actorUserId: input.actorUserId ?? null,
    facts: input.facts ?? {},
    metadata: input.metadata ?? {},
  };
}

/** Resolve the initial state key for a registered workflow. */
export function resolveInitialStateKey(workflowKey: string): string | undefined {
  return getWorkflowDefinition(workflowKey)?.initialStateKey;
}
