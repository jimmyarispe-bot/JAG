"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { canManageCategory, requireWorkflowEditAccess, requireWorkflowViewAccess } from "./access";
import { dispatchWorkflowTrigger, rerunExecution } from "./engine";
import {
  archiveWorkflow,
  createWorkflow,
  deleteWorkflow,
  duplicateWorkflow,
  installStarterTemplate,
  restoreWorkflow,
  seedStarterWorkflows,
  updateWorkflow,
} from "./service";
import type { WorkflowCategory, WorkflowDefinitionJson } from "./types";

function revalidateWorkflows() {
  revalidatePath("/dashboard/workflows");
  revalidatePath("/dashboard/workflows/history");
}

export async function createWorkflowAction(formData: FormData) {
  const access = await requireWorkflowEditAccess();
  if (!access.ok) return { error: access.error };
  const ctx = await getIdentityContext();
  const category = String(formData.get("category") ?? "general") as WorkflowCategory;
  if (!canManageCategory(ctx, category)) {
    return { error: "You cannot create workflows in this category." };
  }

  const supabase = await createAuthClient();
  const result = await createWorkflow(supabase, {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    category,
    triggerKey: String(formData.get("trigger_key") ?? "system.manual"),
    schoolId: String(formData.get("school_id") ?? "") || null,
    enabled: formData.get("enabled") !== "false",
  });
  if (!result.ok) return { error: result.error };
  revalidateWorkflows();
  return result;
}

export async function saveWorkflowDefinitionAction(
  workflowId: string,
  definition: WorkflowDefinitionJson,
  meta?: { name?: string; description?: string; triggerKey?: string; category?: WorkflowCategory }
) {
  const access = await requireWorkflowEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await updateWorkflow(supabase, workflowId, {
    definition,
    name: meta?.name,
    description: meta?.description,
    triggerKey: meta?.triggerKey,
    category: meta?.category,
  });
  if (!result.ok) return { error: result.error };
  revalidateWorkflows();
  revalidatePath(`/dashboard/workflows/${workflowId}`);
  return result;
}

export async function setWorkflowEnabledAction(workflowId: string, enabled: boolean) {
  const access = await requireWorkflowEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await updateWorkflow(supabase, workflowId, {
    enabled,
    status: enabled ? "active" : "disabled",
  });
  if (!result.ok) return { error: result.error };
  revalidateWorkflows();
  return result;
}

export async function duplicateWorkflowAction(workflowId: string) {
  const access = await requireWorkflowEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await duplicateWorkflow(supabase, workflowId);
  if (!result.ok) return { error: result.error };
  revalidateWorkflows();
  return result;
}

export async function archiveWorkflowAction(workflowId: string) {
  const access = await requireWorkflowEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await archiveWorkflow(supabase, workflowId);
  if (!result.ok) return { error: result.error };
  revalidateWorkflows();
  return result;
}

export async function restoreWorkflowAction(workflowId: string) {
  const access = await requireWorkflowEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await restoreWorkflow(supabase, workflowId);
  if (!result.ok) return { error: result.error };
  revalidateWorkflows();
  return result;
}

export async function deleteWorkflowAction(input: {
  workflowId: string;
  confirmationText: string;
  acknowledged: boolean;
}) {
  const access = await requireWorkflowEditAccess();
  if (!access.ok) return { ok: false as const, error: access.error };
  const supabase = await createAuthClient();
  const result = await deleteWorkflow(supabase, input);
  if (!result.ok) return result;
  revalidateWorkflows();
  return { ok: true as const };
}

export async function getWorkflowDeleteContextAction(workflowId: string) {
  const access = await requireWorkflowEditAccess();
  if (!access.ok) return { ok: false as const, error: access.error };
  const supabase = await createAuthClient();
  const { data } = await supabase
    .from("platform_workflows")
    .select("id, name, status, run_count, trigger_key, school_id")
    .eq("id", workflowId)
    .maybeSingle();
  if (!data) return { ok: false as const, error: "Workflow not found" };
  const canDelete = (data.run_count ?? 0) === 0;
  return {
    ok: true as const,
    context: {
      entityKey: "workflow" as const,
      entityId: data.id as string,
      displayName: data.name as string,
      fields: [
        { label: "Trigger", value: String(data.trigger_key) },
        { label: "Status", value: String(data.status) },
        { label: "Runs", value: String(data.run_count ?? 0) },
      ],
      dependencies: {
        entityId: data.id as string,
        blocking: canDelete
          ? []
          : [
              {
                key: "executions",
                label: "Execution history",
                count: Number(data.run_count ?? 0),
              },
            ],
        informational: [],
        canDelete,
      },
      suggestArchive: !canDelete,
    },
  };
}

export async function seedStarterWorkflowsAction() {
  const access = await requireWorkflowEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await seedStarterWorkflows(supabase);
  revalidateWorkflows();
  return { ok: true as const, ...result };
}

export async function installTemplateAction(templateKey: string) {
  const access = await requireWorkflowEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await installStarterTemplate(supabase, templateKey);
  if (!result.ok) return { error: result.error };
  revalidateWorkflows();
  return result;
}

export async function runWorkflowManualAction(workflowId: string) {
  const access = await requireWorkflowEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const { data: workflow } = await supabase
    .from("platform_workflows")
    .select("trigger_key, school_id, organization_id")
    .eq("id", workflowId)
    .maybeSingle();
  if (!workflow) return { error: "Workflow not found" };

  const ctx = await getIdentityContext();
  const result = await dispatchWorkflowTrigger(supabase, {
    triggerKey: workflow.trigger_key,
    organizationId: workflow.organization_id,
    schoolId: workflow.school_id,
    actorUserId: ctx?.id,
    manual: true,
    dedupeKey: `manual:${workflowId}:${Date.now()}`,
    facts: { eventType: "system.manual" },
    payload: { workflowId },
  });
  revalidatePath("/dashboard/workflows/history");
  return { ok: true as const, matched: result.matched };
}

export async function rerunExecutionAction(executionId: string) {
  const access = await requireWorkflowEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await rerunExecution(supabase, executionId);
  revalidatePath("/dashboard/workflows/history");
  return result;
}

export async function assertWorkflowsReadable() {
  return requireWorkflowViewAccess();
}
