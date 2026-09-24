"use server";

/**
 * Submitting the application from an invitation link.
 *
 * The token is the authority. It is resolved to a lead here, server-side, and
 * the lead id is never accepted from the browser. Everything after that is the
 * same machinery the public form uses - same definition, same validation, same
 * answer rows - differing only in that the answers land on the family's
 * existing record rather than creating a new one.
 */

import { leadIdForApplicationToken } from "@/lib/admissions/apply-link/token";
import { submitInterestFormForExistingLead } from "@/lib/admissions/interest-form/submit";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function submitInvitedApplicationAction(
  formData: FormData
): Promise<{ leadId: string } | { error: string }> {
  const token = String(formData.get("invitation_token") ?? "");
  const leadId = await leadIdForApplicationToken(token);
  if (!leadId) return { error: "This link is no longer active." };

  const result = await submitInterestFormForExistingLead(leadId, formData);
  if ("error" in result) return { error: result.error };

  /*
   * The stage, then the shadow-days invitation.
   *
   * Jimmy, 23 September: "once the parent completes the application they are
   * sent a followup email with schedule your shadow days." Automatic, not a
   * second question for a school leader - so the stage is moved directly here
   * rather than through transitionCaseStage, which would open the
   * invite_to_shadow_days gate and put a question in front of Nina whose
   * answer sends the family a second copy of a letter they already have.
   *
   * The consequence, said plainly so it is a decision and not an accident:
   * nobody reviews a family between application and shadow days.
   */
  const admin = createServiceRoleClient() as unknown as {
    from: (table: string) => {
      select: (c: string) => {
        eq: (
          c: string,
          v: string
        ) => { maybeSingle: () => PromiseLike<{ data: unknown }> };
      };
      update: (row: Record<string, unknown>) => {
        eq: (c: string, v: string) => PromiseLike<{ error: unknown }>;
      };
      insert: (row: Record<string, unknown>) => PromiseLike<{ error: unknown }>;
    };
  };

  const now = new Date().toISOString();

  const { data: leadNow } = await admin
    .from("admissions_leads")
    .select("lead_stage")
    .eq("id", leadId)
    .maybeSingle();

  const previousStage =
    (leadNow as { lead_stage?: string | null } | null)?.lead_stage ?? null;

  await admin
    .from("admissions_leads")
    .update({ lead_stage: "application_submitted", stage_entered_at: now })
    .eq("id", leadId);

  /* A raw stage update with no history row leaves a gap nothing can rebuild. */
  await admin.from("admissions_lead_stage_history").insert({
    lead_id: leadId,
    previous_stage: previousStage,
    new_stage: "application_submitted",
    changed_at: now,
  });

  /*
   * Last, and its failure does not undo the submission. The family did their
   * part; losing that to a mail problem would be the worst failure in the
   * chain. A failed send is logged so somebody can send it by hand.
   */
  try {
    const { notifyAdmissionsEvent } = await import(
      "@/lib/admissions/communications/triggers"
    );
    await notifyAdmissionsEvent(admin as never, {
      leadId,
      events: ["shadow_days_invited"],
      sentBy: null,
    } as never);
  } catch (err) {
    console.error("[apply-link] shadow days invitation failed to send", err);
  }

  return { leadId };
}
