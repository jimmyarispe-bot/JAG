import type { createAuthClient } from "@/lib/supabase/server-auth";
import type {
  CreateWorkflowTimerInput,
  PlatformWorkflowTimerRow,
} from "@/lib/platform/workflow/persistence/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function createWorkflowTimer(
  supabase: AuthClient,
  input: CreateWorkflowTimerInput
): Promise<{ timer?: PlatformWorkflowTimerRow; error?: string }> {
  const { data, error } = await supabase
    .from("platform_workflow_timers")
    .insert({
      instance_id: input.instanceId,
      timer_key: input.timerKey,
      state_key: input.stateKey ?? null,
      status: "pending",
      fires_at: input.firesAt,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) return { error: error.message };
  return { timer: data as PlatformWorkflowTimerRow };
}

export async function listPendingWorkflowTimers(
  supabase: AuthClient,
  instanceId: string
): Promise<PlatformWorkflowTimerRow[]> {
  const { data } = await supabase
    .from("platform_workflow_timers")
    .select("*")
    .eq("instance_id", instanceId)
    .eq("status", "pending")
    .order("fires_at", { ascending: true });

  return (data ?? []) as PlatformWorkflowTimerRow[];
}

export async function cancelWorkflowTimers(
  supabase: AuthClient,
  instanceId: string,
  timerKey?: string
): Promise<{ error?: string }> {
  let query = supabase
    .from("platform_workflow_timers")
    .update({ status: "cancelled" })
    .eq("instance_id", instanceId)
    .eq("status", "pending");

  if (timerKey) query = query.eq("timer_key", timerKey);

  const { error } = await query;
  return error ? { error: error.message } : {};
}
