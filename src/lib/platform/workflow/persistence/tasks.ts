import type { createAuthClient } from "@/lib/supabase/server-auth";
import type {
  CreateWorkflowTaskInput,
  PlatformWorkflowTaskRow,
} from "@/lib/platform/workflow/persistence/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function createWorkflowTask(
  supabase: AuthClient,
  input: CreateWorkflowTaskInput
): Promise<{ task?: PlatformWorkflowTaskRow; error?: string }> {
  const { data, error } = await supabase
    .from("platform_workflow_tasks")
    .insert({
      instance_id: input.instanceId,
      state_key: input.stateKey ?? null,
      transition_key: input.transitionKey ?? null,
      action_key: input.actionKey ?? null,
      task_name: input.taskName,
      task_status: "open",
      due_at: input.dueAt ?? null,
      assigned_roles: input.assignedRoles ?? [],
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) return { error: error.message };
  return { task: data as PlatformWorkflowTaskRow };
}

export async function listWorkflowTasks(
  supabase: AuthClient,
  instanceId: string,
  status?: string
): Promise<PlatformWorkflowTaskRow[]> {
  let query = supabase
    .from("platform_workflow_tasks")
    .select("*")
    .eq("instance_id", instanceId)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("task_status", status);

  const { data } = await query;
  return (data ?? []) as PlatformWorkflowTaskRow[];
}
