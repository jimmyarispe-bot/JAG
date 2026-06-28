import { getPublishedWorkflowVersion } from "@/lib/platform/workflow/persistence/definitions";
import type {
  GetOrCreateInstanceInput,
  PlatformWorkflowInstanceRow,
} from "@/lib/platform/workflow/persistence/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Find the active workflow instance for an entity. */
export async function getActiveWorkflowInstance(
  supabase: AuthClient,
  input: { domain: string; entityType: string; entityId: string }
): Promise<PlatformWorkflowInstanceRow | null> {
  const { data } = await supabase
    .from("platform_workflow_instances")
    .select("*")
    .eq("domain", input.domain)
    .eq("entity_type", input.entityType)
    .eq("entity_id", input.entityId)
    .eq("status", "active")
    .maybeSingle();

  return (data as PlatformWorkflowInstanceRow | null) ?? null;
}

/** Get or create an active instance pinned to the current published version. */
export async function getOrCreateWorkflowInstance(
  supabase: AuthClient,
  input: GetOrCreateInstanceInput
): Promise<{ instance: PlatformWorkflowInstanceRow; created: boolean; error?: string }> {
  const existing = await getActiveWorkflowInstance(supabase, {
    domain: input.domain,
    entityType: input.entityType,
    entityId: input.entityId,
  });

  if (existing) {
    return { instance: existing, created: false };
  }

  const published = await getPublishedWorkflowVersion(supabase, input.workflowKey, input.schoolId);
  if (!published) {
    return {
      instance: null as unknown as PlatformWorkflowInstanceRow,
      created: false,
      error: `No published workflow "${input.workflowKey}"`,
    };
  }

  const { data, error } = await supabase
    .from("platform_workflow_instances")
    .insert({
      version_id: published.version.id,
      workflow_key: input.workflowKey,
      domain: input.domain,
      entity_type: input.entityType,
      entity_id: input.entityId,
      school_id: input.schoolId ?? null,
      organization_id: input.organizationId ?? null,
      current_state_key: input.currentStateKey,
      status: "active",
      facts: input.facts ?? {},
      metadata: input.metadata ?? {},
      started_by: input.startedBy ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return {
      instance: null as unknown as PlatformWorkflowInstanceRow,
      created: false,
      error: error.message,
    };
  }

  return { instance: data as PlatformWorkflowInstanceRow, created: true };
}

/** Update instance current state and optional facts. */
export async function updateWorkflowInstanceState(
  supabase: AuthClient,
  input: {
    instanceId: string;
    currentStateKey: string;
    facts?: Record<string, unknown>;
    status?: "active" | "completed" | "cancelled";
    completedAt?: string | null;
  }
): Promise<{ error?: string }> {
  const patch: Record<string, unknown> = {
    current_state_key: input.currentStateKey,
  };

  if (input.facts) patch.facts = input.facts;
  if (input.status) patch.status = input.status;
  if (input.completedAt !== undefined) patch.completed_at = input.completedAt;

  const { error } = await supabase
    .from("platform_workflow_instances")
    .update(patch)
    .eq("id", input.instanceId);

  return error ? { error: error.message } : {};
}

/** Load instance by id. */
export async function getWorkflowInstanceById(
  supabase: AuthClient,
  instanceId: string
): Promise<PlatformWorkflowInstanceRow | null> {
  const { data } = await supabase
    .from("platform_workflow_instances")
    .select("*")
    .eq("id", instanceId)
    .maybeSingle();

  return (data as PlatformWorkflowInstanceRow | null) ?? null;
}
