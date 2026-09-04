"use server";

/**
 * Setting a tuition price.
 *
 * One value at a time, bound to the actor's school scope, and never reported as
 * saved unless a row actually changed. That last part is not defensive
 * programming — in this database an UPDATE that RLS refuses returns success and
 * zero rows, so "it saved" and "it did nothing" are the same response unless the
 * count is checked.
 */

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/platform/identity/action-guards";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { requireSchoolAccess } from "@/lib/platform/identity/tenant-access";
import { writePlatformAudit } from "@/lib/platform/automation/audit";
import { parseTuitionAmount } from "@/lib/finance/tuition-catalog-shared";

export async function setTuitionPrice(formData: FormData) {
  const auth = await assertPermission("finance.billing");
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;

  const priceId = String(formData.get("price_id") ?? "");
  if (!priceId) return { error: "Missing price id." };

  const standard = parseTuitionAmount(formData.get("standard_amount"));
  if ("error" in standard) return { error: standard.error };
  const sessionRate = parseTuitionAmount(formData.get("one_to_one_session_rate"));
  if ("error" in sessionRate) return { error: sessionRate.error };
  const offeredOneToOne = String(formData.get("offered_one_to_one") ?? "") === "true";

  // A rate on an item nobody sells 1:1 is a number waiting to be billed by
  // mistake. If it is not offered, it has no rate.
  const rate = offeredOneToOne ? sessionRate.value : null;

  const { data: existing, error: readError } = await supabase
    .from("tuition_school_prices")
    .select("id, school_id, catalog_item_id, standard_amount, offered_one_to_one, one_to_one_session_rate")
    .eq("id", priceId)
    .maybeSingle();

  if (readError) return { error: readError.message };
  if (!existing) return { error: "That price row could not be found." };

  // Bind the write to the school the actor may actually touch, rather than
  // trusting the id that arrived in the form.
  const ctx = await getIdentityContext();
  if (!ctx) return { error: "Unauthorized" };
  if (requireSchoolAccess(ctx, existing.school_id) !== true) return { error: "Forbidden" };

  const { data: updated, error } = await supabase
    .from("tuition_school_prices")
    .update({
      standard_amount: standard.value,
      offered_one_to_one: offeredOneToOne,
      one_to_one_session_rate: rate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", priceId)
    .select("id");

  if (error) return { error: error.message };
  // Zero rows with no error is a policy refusal wearing a success costume.
  if (!updated?.length) {
    return { error: "Nothing was saved — you may not have permission to price this school." };
  }

  // A price is a number a family will be asked to pay. Who set it, and what it
  // was before, is worth keeping.
  await writePlatformAudit(supabase, {
    schoolId: existing.school_id,
    module: "finance",
    actionType: "tuition_price_set",
    summary: "Tuition price updated",
    entityType: "tuition_school_prices",
    entityId: priceId,
    actorUserId: ctx.effectiveUserId ?? null,
    metadata: {
      catalogItemId: existing.catalog_item_id,
      from: {
        standard: existing.standard_amount,
        offeredOneToOne: existing.offered_one_to_one,
        sessionRate: existing.one_to_one_session_rate,
      },
      to: {
        standard: standard.value,
        offeredOneToOne,
        sessionRate: rate,
      },
    },
  });

  revalidatePath("/dashboard/finance/tuition");
  return {
    ok: true as const,
    standardAmount: standard.value,
    offeredOneToOne,
    oneToOneSessionRate: rate,
  };
}
