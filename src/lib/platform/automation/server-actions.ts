"use server";

import { revalidatePath } from "next/cache";
import { assertAnyPermission } from "@/lib/platform/identity/action-guards";
import { resolveMissionControlItem } from "@/lib/platform/automation/mission-control";
import { installMarketplaceTemplateToAdmissions } from "@/lib/platform/automation/marketplace";

export async function resolveMissionControlItemAction(itemId: string) {
  const auth = await assertAnyPermission("mission_control.access", "admissions.manage");
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;

  await resolveMissionControlItem(supabase, itemId);
  revalidatePath("/dashboard/mission-control");
  return { success: true };
}

export async function installMarketplaceWorkflow(marketplaceKey: string, schoolId: string) {
  const auth = await assertAnyPermission("integration.marketplace", "admissions.manage");
  if ("error" in auth) return { error: auth.error };

  const result = await installMarketplaceTemplateToAdmissions(marketplaceKey, schoolId);
  if (result.error) return { error: result.error };
  revalidatePath("/dashboard/admissions/workflows");
  revalidatePath("/dashboard/mission-control");
  return { success: true, workflowId: result.workflowId };
}
