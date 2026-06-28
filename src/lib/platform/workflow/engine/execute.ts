import {
  executeWorkflowTransition,
} from "@/lib/platform/workflow/engine/skeleton";
import type { WorkflowExecutionOptions } from "@/lib/platform/workflow/engine/context";
import type { WorkflowInstanceContext, WorkflowTransitionResult } from "@/lib/platform/workflow/types";
import {
  getActiveWorkflowInstance,
  getOrCreateWorkflowInstance,
  getWorkflowInstanceById,
} from "@/lib/platform/workflow/persistence/instances";
import { persistWorkflowStateChange } from "@/lib/platform/workflow/persistence/history";
import { createPersistedWorkflowApproval } from "@/lib/platform/workflow/persistence/approvals";
import { getWorkflowVersionById } from "@/lib/platform/workflow/persistence/definitions";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface RecordEntityWorkflowStateChangeInput {
  workflowKey: string;
  domain: string;
  entityType: string;
  entityId: string;
  schoolId?: string | null;
  organizationId?: string | null;
  fromStateKey: string | null;
  toStateKey: string;
  transitionKey?: string | null;
  actorUserId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
  facts?: Record<string, unknown>;
  markCompleted?: boolean;
}

/** Record a domain-initiated state change with full persistence (instances, history, audit). */
export async function recordEntityWorkflowStateChange(
  supabase: AuthClient,
  input: RecordEntityWorkflowStateChangeInput
): Promise<{ instanceId?: string; error?: string }> {
  if (input.fromStateKey === input.toStateKey) {
    return {};
  }

  const { instance, error: instanceError } = await getOrCreateWorkflowInstance(supabase, {
    workflowKey: input.workflowKey,
    domain: input.domain,
    entityType: input.entityType,
    entityId: input.entityId,
    schoolId: input.schoolId,
    organizationId: input.organizationId,
    currentStateKey: input.fromStateKey ?? input.toStateKey,
    startedBy: input.actorUserId,
    facts: input.facts,
  });

  if (instanceError || !instance) {
    return { error: instanceError ?? "Failed to resolve workflow instance" };
  }

  const persistResult = await persistWorkflowStateChange(supabase, {
    instanceId: instance.id,
    versionId: instance.version_id,
    fromStateKey: input.fromStateKey,
    toStateKey: input.toStateKey,
    transitionKey: input.transitionKey ?? "direct_state_change",
    eventType: "transition_completed",
    summary: input.summary,
    actorUserId: input.actorUserId,
    metadata: input.metadata,
    facts: {
      ...(instance.facts ?? {}),
      ...(input.facts ?? {}),
    },
    markCompleted: input.markCompleted,
  });

  if (persistResult.error) return { error: persistResult.error };

  return { instanceId: instance.id };
}

/** Build instance context from a persisted row for engine execution. */
export function instanceRowToContext(
  row: {
    id: string;
    workflow_key: string;
    domain: string;
    entity_type: string;
    entity_id: string;
    school_id: string | null;
    current_state_key: string;
    facts: Record<string, unknown>;
    metadata: Record<string, unknown>;
  },
  actorUserId?: string | null
): WorkflowInstanceContext {
  return {
    instanceId: row.id,
    workflowKey: row.workflow_key,
    domain: row.domain,
    entityType: row.entity_type,
    entityId: row.entity_id,
    schoolId: row.school_id,
    currentStateKey: row.current_state_key,
    actorUserId: actorUserId ?? null,
    facts: row.facts ?? {},
    metadata: row.metadata ?? {},
  };
}

export interface ExecutePersistedTransitionOptions extends WorkflowExecutionOptions {
  markCompleted?: boolean;
}

/** Execute a strict graph transition with persistence. */
export async function executePersistedWorkflowTransition(
  supabase: AuthClient,
  instanceId: string,
  transitionKey: string,
  options: ExecutePersistedTransitionOptions = {},
  actorUserId?: string | null
): Promise<WorkflowTransitionResult & { error?: string }> {
  const instance = await getWorkflowInstanceById(supabase, instanceId);
  if (!instance) {
    return {
      success: false,
      fromStateKey: "",
      blockedBy: "guard",
      errors: [`Instance "${instanceId}" not found`],
      auditEntries: [],
      error: "Instance not found",
    };
  }

  const version = await getWorkflowVersionById(supabase, instance.version_id);
  const context = instanceRowToContext(instance, actorUserId);
  const result = await executeWorkflowTransition(context, transitionKey, options);

  if (result.blockedBy === "approval" && result.approvalRequestId) {
    await createPersistedWorkflowApproval(supabase, {
      instanceId: instance.id,
      transitionKey,
      gateKey: result.approvalRequestId,
      requestedBy: actorUserId,
      metadata: { versionId: version?.id ?? instance.version_id },
    });
  }

  if (result.success && result.toStateKey) {
    const persistResult = await persistWorkflowStateChange(supabase, {
      instanceId: instance.id,
      versionId: instance.version_id,
      fromStateKey: result.fromStateKey,
      toStateKey: result.toStateKey,
      transitionKey: result.transitionKey ?? transitionKey,
      eventType: "transition_completed",
      summary: `Transition "${transitionKey}" completed`,
      actorUserId,
      metadata: { auditEntries: result.auditEntries.length },
      markCompleted: options.markCompleted,
    });
    if (persistResult.error) {
      return { ...result, error: persistResult.error };
    }
  } else if (result.blockedBy) {
    await persistWorkflowStateChange(supabase, {
      instanceId: instance.id,
      versionId: instance.version_id,
      fromStateKey: result.fromStateKey,
      toStateKey: result.toStateKey ?? result.fromStateKey,
      transitionKey: result.transitionKey ?? transitionKey,
      eventType: "transition_blocked",
      summary: `Transition "${transitionKey}" blocked (${result.blockedBy})`,
      actorUserId,
      metadata: { blockedBy: result.blockedBy, errors: result.errors },
    });
  }

  return result;
}

/** Load active instance context for an entity. */
export async function loadEntityWorkflowContext(
  supabase: AuthClient,
  input: { domain: string; entityType: string; entityId: string },
  actorUserId?: string | null
): Promise<WorkflowInstanceContext | null> {
  const instance = await getActiveWorkflowInstance(supabase, input);
  if (!instance) return null;
  return instanceRowToContext(instance, actorUserId);
}
