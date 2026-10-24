"use server";

import { revalidatePath } from "next/cache";
import { assertAnyPermission } from "@/lib/platform/identity/action-guards";
import type { LeadStageValue } from "@/lib/constants/admissions";
import type { AdmissionsPipelineStageKey } from "@/lib/admissions/registry";
import { transitionCasePipelineStage } from "@/lib/admissions/case/orchestration";
import { moveStageFromDashboard } from "@/lib/admissions/case/stage-letters";

async function requireAdmissionsManage() {
  return assertAnyPermission("admissions.manage", "admissions.accept");
}

function revalidateCase(leadId: string) {
  revalidatePath("/dashboard/admissions");
  revalidatePath(`/dashboard/admissions/cases/${leadId}`);
  revalidatePath(`/dashboard/admissions/leads/${leadId}`);
}

/** Orchestrated legacy stage transition for an admissions case. */
export async function updateCaseStage(leadId: string, leadStage: LeadStageValue) {
  const auth = await requireAdmissionsManage();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sends what the matching email button sends - see case/stage-letters.ts.
  const result = await moveStageFromDashboard(supabase, leadId, leadStage, user?.id ?? null);
  if (result.error) return { error: result.error };

  revalidateCase(leadId);
  return { success: true, warning: result.warning ?? null };
}

/** Orchestrated OS pipeline stage transition for an admissions case. */
export async function updateCasePipelineStage(leadId: string, pipelineStage: string) {
  const auth = await requireAdmissionsManage();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await transitionCasePipelineStage(
    supabase,
    leadId,
    pipelineStage as AdmissionsPipelineStageKey,
    user?.id ?? null
  );
  if (result.error) return { error: result.error };

  revalidateCase(leadId);
  return { success: true };
}
