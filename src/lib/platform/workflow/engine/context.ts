import type {
  WorkflowActionDefinition,
  WorkflowAuditEntry,
  WorkflowInstanceContext,
} from "@/lib/platform/workflow/types";

export type WorkflowActionHandler = (
  context: WorkflowInstanceContext,
  action: WorkflowActionDefinition
) => Promise<{ success: boolean; error?: string; auditSummary?: string }>;

const ACTION_HANDLERS = new Map<string, WorkflowActionHandler>();

export function registerWorkflowActionHandler(
  actionType: string,
  handler: WorkflowActionHandler
): void {
  ACTION_HANDLERS.set(actionType, handler);
}

export function getWorkflowActionHandler(
  actionType: string
): WorkflowActionHandler | undefined {
  return ACTION_HANDLERS.get(actionType);
}

export interface WorkflowExecutionOptions {
  /** When true, actions are evaluated but not dispatched (dry run). */
  dryRun?: boolean;
  /** Trigger key that initiated the transition, if any. */
  triggerKey?: string;
  /** Additional facts merged with instance facts for condition evaluation. */
  additionalFacts?: Record<string, unknown>;
}

export interface WorkflowExecutionHooks {
  onAudit?: (entry: WorkflowAuditEntry) => void | Promise<void>;
  onActionExecuted?: (
    context: WorkflowInstanceContext,
    action: WorkflowActionDefinition,
    result: { success: boolean; error?: string }
  ) => void | Promise<void>;
}

export function mergeWorkflowFacts(
  context: WorkflowInstanceContext,
  additionalFacts?: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...(context.facts ?? {}),
    ...(additionalFacts ?? {}),
    currentStateKey: context.currentStateKey,
    workflowKey: context.workflowKey,
    domain: context.domain,
    entityType: context.entityType,
    entityId: context.entityId,
  };
}
