import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { recordWorkflowActivity } from "./activity";
import { emptyDefinition, validateDefinition } from "./definition";
import { getStarterTemplate, STARTER_WORKFLOW_TEMPLATES } from "./templates";
import type {
  WorkflowCategory,
  WorkflowDefinitionJson,
  WorkflowRow,
} from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type WorkflowMutationResult =
  | { ok: true; workflowId: string; auditId?: string }
  | { ok: false; error: string };

export async function createWorkflow(
  supabase: AuthClient,
  input: {
    name: string;
    description?: string;
    category: WorkflowCategory;
    triggerKey: string;
    definition?: WorkflowDefinitionJson;
    schoolId?: string | null;
    organizationId?: string | null;
    enabled?: boolean;
  }
): Promise<WorkflowMutationResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Name is required" };

  const definition = input.definition ?? emptyDefinition(input.triggerKey);
  const valid = validateDefinition(definition);
  if (!valid.ok) return valid;

  const actorUserId = await resolveActorUserId(supabase);
  const schoolCtx = input.schoolId
    ? await resolveSchoolContext(supabase, input.schoolId)
    : null;

  const { data, error } = await supabase
    .from("platform_workflows")
    .insert({
      name,
      description: input.description ?? "",
      category: input.category,
      trigger_key: input.triggerKey,
      definition,
      enabled: input.enabled ?? true,
      status: "active",
      school_id: input.schoolId ?? null,
      organization_id: input.organizationId ?? schoolCtx?.organizationId ?? null,
      created_by: actorUserId,
      updated_by: actorUserId,
    })
    .select("id, audit_id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Unable to create workflow" };

  await recordWorkflowActivity(supabase, {
    eventType: "workflow.created",
    title: "Workflow created",
    summary: name,
    entityId: data.id as string,
    organizationId: input.organizationId ?? schoolCtx?.organizationId,
    schoolId: input.schoolId,
    actorUserId,
  });

  return { ok: true, workflowId: data.id as string, auditId: data.audit_id as string };
}

export async function updateWorkflow(
  supabase: AuthClient,
  workflowId: string,
  patch: Partial<{
    name: string;
    description: string;
    category: WorkflowCategory;
    triggerKey: string;
    definition: WorkflowDefinitionJson;
    enabled: boolean;
    status: "active" | "disabled" | "archived";
  }>
): Promise<WorkflowMutationResult> {
  if (patch.definition) {
    const valid = validateDefinition(patch.definition);
    if (!valid.ok) return valid;
  }

  const actorUserId = await resolveActorUserId(supabase);
  const update: Record<string, unknown> = {
    updated_by: actorUserId,
    updated_at: new Date().toISOString(),
  };
  if (patch.name != null) update.name = patch.name;
  if (patch.description != null) update.description = patch.description;
  if (patch.category != null) update.category = patch.category;
  if (patch.triggerKey != null) update.trigger_key = patch.triggerKey;
  if (patch.definition != null) {
    update.definition = patch.definition;
    // bump version
    const { data: current } = await supabase
      .from("platform_workflows")
      .select("version")
      .eq("id", workflowId)
      .maybeSingle();
    update.version = (current?.version ?? 1) + 1;
  }
  if (patch.enabled != null) update.enabled = patch.enabled;
  if (patch.status != null) {
    update.status = patch.status;
    if (patch.status === "archived") update.archived_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("platform_workflows")
    .update(update)
    .eq("id", workflowId)
    .select("id, audit_id, organization_id, school_id, name, enabled")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Unable to update workflow" };

  if (patch.enabled === true) {
    await recordWorkflowActivity(supabase, {
      eventType: "workflow.enabled",
      title: "Workflow enabled",
      summary: data.name,
      entityId: workflowId,
      organizationId: data.organization_id,
      schoolId: data.school_id,
      actorUserId,
    });
  } else if (patch.enabled === false) {
    await recordWorkflowActivity(supabase, {
      eventType: "workflow.disabled",
      title: "Workflow disabled",
      summary: data.name,
      entityId: workflowId,
      organizationId: data.organization_id,
      schoolId: data.school_id,
      actorUserId,
    });
  }

  return { ok: true, workflowId, auditId: data.audit_id as string };
}

export async function duplicateWorkflow(
  supabase: AuthClient,
  workflowId: string
): Promise<WorkflowMutationResult> {
  const { data } = await supabase
    .from("platform_workflows")
    .select("*")
    .eq("id", workflowId)
    .maybeSingle();
  if (!data) return { ok: false, error: "Workflow not found" };

  const created = await createWorkflow(supabase, {
    name: `${data.name} (Copy)`,
    description: data.description,
    category: data.category as WorkflowCategory,
    triggerKey: data.trigger_key,
    definition: data.definition as WorkflowDefinitionJson,
    schoolId: data.school_id,
    organizationId: data.organization_id,
    enabled: false,
  });

  if (created.ok) {
    await recordWorkflowActivity(supabase, {
      eventType: "workflow.duplicated",
      title: "Workflow duplicated",
      summary: data.name,
      entityId: created.workflowId,
      organizationId: data.organization_id,
      schoolId: data.school_id,
      payload: { sourceId: workflowId },
    });
  }
  return created;
}

export async function archiveWorkflow(
  supabase: AuthClient,
  workflowId: string
): Promise<WorkflowMutationResult> {
  const result = await updateWorkflow(supabase, workflowId, {
    status: "archived",
    enabled: false,
  });
  if (result.ok) {
    const { data } = await supabase
      .from("platform_workflows")
      .select("name, organization_id, school_id")
      .eq("id", workflowId)
      .maybeSingle();
    if (data) {
      await recordWorkflowActivity(supabase, {
        eventType: "workflow.archived",
        title: "Workflow archived",
        summary: data.name,
        entityId: workflowId,
        organizationId: data.organization_id,
        schoolId: data.school_id,
      });
    }
  }
  return result;
}

export async function restoreWorkflow(
  supabase: AuthClient,
  workflowId: string
): Promise<WorkflowMutationResult> {
  const result = await updateWorkflow(supabase, workflowId, {
    status: "disabled",
    enabled: false,
  });
  if (result.ok) {
    await supabase
      .from("platform_workflows")
      .update({ archived_at: null })
      .eq("id", workflowId);
    const { data } = await supabase
      .from("platform_workflows")
      .select("name, organization_id, school_id")
      .eq("id", workflowId)
      .maybeSingle();
    if (data) {
      await recordWorkflowActivity(supabase, {
        eventType: "workflow.restored",
        title: "Workflow restored",
        summary: data.name,
        entityId: workflowId,
        organizationId: data.organization_id,
        schoolId: data.school_id,
      });
    }
  }
  return result;
}

export async function deleteWorkflow(
  supabase: AuthClient,
  input: {
    workflowId: string;
    confirmationText: string;
    acknowledged: boolean;
  }
): Promise<WorkflowMutationResult | { ok: false; error: string; code: string; suggestArchive?: boolean }> {
  const { validateDeleteConfirmation } = await import("@/lib/platform/crud");
  const confirmation = validateDeleteConfirmation(input);
  if (!confirmation.ok) {
    return { ok: false, error: confirmation.error, code: confirmation.code };
  }

  const { data } = await supabase
    .from("platform_workflows")
    .select("*")
    .eq("id", input.workflowId)
    .maybeSingle();
  if (!data) return { ok: false, error: "Workflow not found", code: "not_found" };

  if (data.run_count > 0) {
    return {
      ok: false,
      error: "Workflows with execution history cannot be permanently deleted. Archive instead.",
      code: "has_dependencies",
      suggestArchive: true,
    };
  }

  const { error } = await supabase
    .from("platform_workflows")
    .delete()
    .eq("id", input.workflowId);
  if (error) return { ok: false, error: error.message, code: "failed" };

  await recordWorkflowActivity(supabase, {
    eventType: "workflow.deleted",
    title: "Workflow deleted",
    summary: data.name,
    entityId: input.workflowId,
    organizationId: data.organization_id,
    schoolId: data.school_id,
    payload: { auditId: data.audit_id },
  });

  return { ok: true, workflowId: input.workflowId, auditId: data.audit_id as string };
}

export async function seedStarterWorkflows(
  supabase: AuthClient,
  options: { schoolId?: string | null; organizationId?: string | null } = {}
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  for (const template of STARTER_WORKFLOW_TEMPLATES) {
    const { data: existing } = await supabase
      .from("platform_workflows")
      .select("id")
      .eq("name", template.name)
      .eq("trigger_key", template.triggerKey)
      .limit(1)
      .maybeSingle();

    if (existing) {
      skipped += 1;
      continue;
    }

    const result = await createWorkflow(supabase, {
      name: template.name,
      description: template.description,
      category: template.category,
      triggerKey: template.triggerKey,
      definition: template.definition,
      schoolId: options.schoolId,
      organizationId: options.organizationId,
      enabled: true,
    });
    if (result.ok) created += 1;
    else skipped += 1;
  }

  return { created, skipped };
}

export async function installStarterTemplate(
  supabase: AuthClient,
  templateKey: string,
  options: { schoolId?: string | null; organizationId?: string | null } = {}
): Promise<WorkflowMutationResult> {
  const template = getStarterTemplate(templateKey);
  if (!template) return { ok: false, error: "Template not found" };
  return createWorkflow(supabase, {
    name: template.name,
    description: template.description,
    category: template.category,
    triggerKey: template.triggerKey,
    definition: template.definition,
    schoolId: options.schoolId,
    organizationId: options.organizationId,
    enabled: true,
  });
}

export type { WorkflowRow };
