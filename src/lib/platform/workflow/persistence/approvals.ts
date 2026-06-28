import type { createAuthClient } from "@/lib/supabase/server-auth";
import type {
  PersistWorkflowApprovalInput,
  PlatformWorkflowApprovalRow,
} from "@/lib/platform/workflow/persistence/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function createPersistedWorkflowApproval(
  supabase: AuthClient,
  input: PersistWorkflowApprovalInput
): Promise<{ approval?: PlatformWorkflowApprovalRow; error?: string }> {
  const { data, error } = await supabase
    .from("platform_workflow_approvals")
    .insert({
      instance_id: input.instanceId,
      transition_key: input.transitionKey,
      gate_key: input.gateKey,
      status: "pending",
      requested_by: input.requestedBy ?? null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) return { error: error.message };
  return { approval: data as PlatformWorkflowApprovalRow };
}

export async function decidePersistedWorkflowApproval(
  supabase: AuthClient,
  input: {
    approvalId: string;
    status: "approved" | "rejected" | "escalated";
    decidedBy?: string | null;
    decisionNotes?: string | null;
  }
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("platform_workflow_approvals")
    .update({
      status: input.status,
      decided_by: input.decidedBy ?? null,
      decided_at: new Date().toISOString(),
      decision_notes: input.decisionNotes ?? null,
    })
    .eq("id", input.approvalId);

  return error ? { error: error.message } : {};
}

export async function listPendingWorkflowApprovals(
  supabase: AuthClient,
  instanceId: string
): Promise<PlatformWorkflowApprovalRow[]> {
  const { data } = await supabase
    .from("platform_workflow_approvals")
    .select("*")
    .eq("instance_id", instanceId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (data ?? []) as PlatformWorkflowApprovalRow[];
}
