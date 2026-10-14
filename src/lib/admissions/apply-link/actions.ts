"use server";

/**
 * Submitting the application from an invitation link.
 *
 * The token is the authority. It is resolved to a lead here, server-side, and
 * the lead id is never accepted from the browser. Everything after that is the
 * same machinery the public form uses - same definition, same validation, same
 * answer rows - differing only in that the answers land on the family's
 * existing record rather than creating a new one.
 *
 * ── WHAT CHANGED ON 14 OCTOBER 2026, AND WHY IT REVERSES 23 SEPTEMBER ───────
 *
 * This file used to do three things after the answers were saved: write
 * lead_stage = application_submitted with a raw update, write a history row,
 * and mail the family the shadow-days invitation itself. It never touched
 * admissions_applications, never checked the fee, never set submitted_at and
 * never opened a gate.
 *
 * That was deliberate, and the comment said so. Jimmy, 23 September: "once the
 * parent completes the application they are sent a followup email with schedule
 * your shadow days." Automatic, no second question for a school leader - so the
 * gate was bypassed on purpose, and the consequence was written down: "nobody
 * reviews a family between application and shadow days."
 *
 * HE CHANGED IT. Jimmy, 14 October 2026, in his own words:
 *
 *   "it needs to be this way then - So the intended order is: application
 *    completed -> the gate puts the question in front of her -> she reads it ->
 *    she answers yes -> the family gets the booking link."
 *
 * That is this file now. The 23 September behaviour is gone, by his decision,
 * and this paragraph is here so nobody reads the old comment in a diff and
 * thinks the gate was skipped by accident.
 *
 * ── WHAT THE OLD VERSION ACTUALLY ALLOWED ──────────────────────────────────
 *
 * Last night's test child read lead_stage = application_submitted while the
 * application row read application_status = in_progress with no submitted_at -
 * and the shadow-days invitation had already gone. A family could be invited to
 * shadow days on an application nobody had completed and nobody had paid for.
 * Live at all five campuses until this shipped.
 *
 * ── IT IS THE PORTAL'S ORDER, BECAUSE THERE IS ONLY ONE RIGHT ORDER ─────────
 *
 * submitApplication in portal/actions.ts has done it correctly since
 * 28 September: read the fee, run applicationFeeGate, mark the application
 * submitted, transitionCaseStage, onApplicationSubmitted. Two paths submit one
 * application and they must not do two different things - the same rule that
 * put the acceptance behind one shared function.
 *
 * NO SHADOW-DAYS LETTER FROM HERE. transitionCaseStage opens
 * invite_to_shadow_days at application_submitted, and that gate's yes branch
 * sends shadow_days_invited. Sending it here as well would mail the family the
 * booking link before anybody had read their application, and then mail it
 * again when she answered yes.
 */

import { leadIdForApplicationToken } from "@/lib/admissions/apply-link/token";
import { submitInterestFormForExistingLead } from "@/lib/admissions/interest-form/submit";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { applicationFeeGate } from "@/lib/admissions/fee/gate";
import { transitionCaseStage } from "@/lib/admissions/case/orchestration";
import { onApplicationSubmitted } from "@/lib/admissions/communications/triggers";

type Row = Record<string, unknown>;

export async function submitInvitedApplicationAction(
  formData: FormData
): Promise<{ leadId: string } | { error: string }> {
  const token = String(formData.get("invitation_token") ?? "");
  const leadId = await leadIdForApplicationToken(token);
  if (!leadId) return { error: "This link is no longer active." };

  const admin = createServiceRoleClient() as unknown as {
    from: (table: string) => {
      select: (c: string) => {
        eq: (
          c: string,
          v: string
        ) => {
          maybeSingle: () => PromiseLike<{ data: unknown; error: unknown }>;
          order: (
            c: string,
            o: { ascending: boolean }
          ) => {
            limit: (n: number) => {
              maybeSingle: () => PromiseLike<{ data: unknown; error: unknown }>;
            };
          };
        };
      };
      update: (row: Row) => {
        eq: (c: string, v: string) => PromiseLike<{ error: { message: string } | null }>;
      };
    };
  };

  /*
   * THE APPLICATION ROW IS FOUND BEFORE THE ANSWERS ARE SAVED.
   *
   * If there is no row there is nothing to mark submitted, nothing to check a
   * fee against, and no evidence an application exists at all - and the whole
   * point of this change is that the stage must not claim something that did
   * not happen. Found first so the refusal costs the family nothing: they press
   * submit again after the school fixes it, with their answers still on screen.
   *
   * Newest first. A family who was invited twice has two rows and the later one
   * is the application they are filling in.
   */
  const { data: applicationRow, error: applicationReadError } = await admin
    .from("admissions_applications")
    .select("id, application_fee_status, application_fee_cents, submitted_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (applicationReadError) {
    return {
      error:
        "We could not open this application just now, so nothing has been " +
        "submitted. Nothing you have entered is lost - please try again in a moment.",
    };
  }

  const application = (applicationRow as Row | null) ?? null;
  const applicationId = application ? String(application.id ?? "") : "";

  if (!application || !applicationId) {
    /* Not a parent's problem to solve, so it does not read like one. */
    return {
      error:
        "This application is not set up yet, so it has not been submitted. " +
        "Nothing you have entered is lost - please contact the school office " +
        "and we will put it right.",
    };
  }

  /*
   * THE FEE IS A CONDITION OF SUBMITTING, NOT A REMINDER AFTERWARDS.
   *
   * Jimmy, 28 September: the $100 goes in at the end of the application and
   * before it can be submitted. The portal has enforced that since; this door
   * never has. Read off the row rather than trusted from anywhere else, because
   * this is the value the submission turns on. `unknown` does not pass - see
   * fee/gate.ts. The test campus is exempt by having a zero fee written on the
   * row, not by an exception here.
   */
  const feeGate = applicationFeeGate({
    status: String(application.application_fee_status ?? ""),
    amountCents: Number(application.application_fee_cents ?? 0),
  });
  if (!feeGate.ok) return { error: feeGate.reason };

  /* Now, and only now, the answers. */
  const result = await submitInterestFormForExistingLead(leadId, formData);
  if ("error" in result) return { error: result.error };

  const now = new Date().toISOString();

  /*
   * SUBMITTED MEANS SUBMITTED.
   *
   * application_status and submitted_at, the two things a stage of
   * "application_submitted" is supposed to be shorthand for. Without them the
   * board says a family applied and the application row says they did not, and
   * on 13 October that disagreement is exactly what let a child be invited to
   * shadow days with an application still reading in_progress.
   *
   * Checked, not fired and forgotten. If this fails the stage must NOT move,
   * because a stage that moves past a fact that was never written is the whole
   * fault being fixed here.
   */
  const { error: submitError } = await admin
    .from("admissions_applications")
    .update({ application_status: "submitted", submitted_at: now })
    .eq("id", applicationId);

  if (submitError) {
    return {
      error:
        "Your answers are saved, but we could not mark the application " +
        "submitted, so it has not gone to the school yet. Please contact the " +
        "school office - nothing you entered is lost.",
    };
  }

  /*
   * THE STAGE, THROUGH transitionCaseStage - WHICH IS THE POINT.
   *
   * Not a raw update. transitionCaseStage writes the history row, syncs the
   * platform workflow, records the activity, and opens the decision gate the
   * new stage calls for - invite_to_shadow_days at application_submitted. That
   * gate is the question Jimmy asked for: she reads the application, she
   * answers, and her yes is what sends the booking link.
   *
   * changedBy is null. Nobody is signed in; a parent pressing submit is not a
   * user id, and inventing one would put a staff member's name on a family's
   * action.
   */
  const stage = await transitionCaseStage(
    admin as never,
    leadId,
    "application_submitted",
    null
  );

  if (stage.error) {
    /*
     * The application IS submitted by this point and the family must not be
     * told otherwise. A stage that did not move is visible on the board and
     * recoverable by hand; telling a family their application failed when it is
     * sitting in the database is not.
     */
    console.error("[apply-link] application submitted but the stage did not move", {
      leadId,
      applicationId,
      error: stage.error,
    });
  }

  /*
   * The letters that belong to submitting: the family's receipt and the school
   * leader's "an application came in". NOT the shadow-days invitation - that
   * belongs to the gate's yes, and sending it here would be the old behaviour
   * wearing a new coat.
   *
   * Last, and its failure does not undo the submission. The family did their
   * part; losing that to a mail problem would be the worst failure in the
   * chain. A failed send is logged so somebody can send it by hand.
   */
  try {
    await onApplicationSubmitted(admin as never, leadId, applicationId, null);
  } catch (err) {
    console.error("[apply-link] application submitted but the letters failed", err);
  }

  return { leadId };
}
