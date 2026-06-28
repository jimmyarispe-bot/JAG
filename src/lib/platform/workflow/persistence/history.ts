import type { createAuthClient } from "@/lib/supabase/server-auth";
import type {
  PersistWorkflowStateChangeInput,
  PlatformWorkflowStateHistoryRow,
} from "@/lib/platform/workflow/persistence/types";
import { updateWorkflowInstanceState } from "@/lib/platform/workflow/persistence/instances";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Persist a state change and audit history entry. */
export async function persistWorkflowStateChange(
  supabase: AuthClient,
  input: PersistWorkflowStateChangeInput
): Promise<{ history?: PlatformWorkflowStateHistoryRow; error?: string }> {
  const now = new Date().toISOString();

  const { data: history, error: historyError } = await supabase
    .from("platform_workflow_state_history")
    .insert({
      instance_id: input.instanceId,
      version_id: input.versionId,
      event_type: input.eventType,
      from_state_key: input.fromStateKey,
      to_state_key: input.toStateKey,
      transition_key: input.transitionKey ?? null,
      actor_user_id: input.actorUserId ?? null,
      summary: input.summary,
      metadata: input.metadata ?? {},
      occurred_at: now,
    })
    .select("*")
    .single();

  if (historyError) return { error: historyError.message };

  const updateResult = await updateWorkflowInstanceState(supabase, {
    instanceId: input.instanceId,
    currentStateKey: input.toStateKey,
    facts: input.facts,
    status: input.markCompleted ? "completed" : "active",
    completedAt: input.markCompleted ? now : null,
  });

  if (updateResult.error) return { error: updateResult.error };

  return { history: history as PlatformWorkflowStateHistoryRow };
}

/** List state history for an instance (timeline / audit). */
export async function listWorkflowStateHistory(
  supabase: AuthClient,
  instanceId: string,
  limit = 50
): Promise<PlatformWorkflowStateHistoryRow[]> {
  const { data } = await supabase
    .from("platform_workflow_state_history")
    .select("*")
    .eq("instance_id", instanceId)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as PlatformWorkflowStateHistoryRow[];
}
