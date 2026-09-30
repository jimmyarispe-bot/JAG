/**
 * Inviting a family has to produce the thing they pay for.
 *
 * WHAT WAS WRONG. Jimmy, 30 September 2026, asked why the $100 could not be
 * collected on the application itself. The answer was not the login: it was
 * that at the moment a family is invited there is no application to attach
 * money to.
 *
 * admissions_applications rows were created at ACCEPTANCE - see
 * application-for-accepted-lead.ts, which exists because before it almost
 * nobody had one at all. So the order ran:
 *
 *   inquiry            -> a lead
 *   invited            -> token link, family completes the whole application
 *   staff accept       -> NOW an application row exists, and only now can a
 *                         fee be recorded
 *
 * Which made Jimmy's instruction of 28 September - "the $100 application fee
 * is put in at the end of the application and before it can be submitted" -
 * impossible to satisfy. The fee had nowhere to live until after the decision
 * it was supposed to precede.
 *
 * WHAT THIS DOES. The application is created when the family is INVITED, at
 * the same moment their link is minted. application_fee_cents defaults to
 * 10000 (migration 291), so the $100 exists from the first time they open the
 * link. Acceptance then finds the row instead of making one -
 * ensureApplicationForAcceptedLead already looks before it creates.
 *
 * THE OPPOSITE FAILURE POSTURE TO ACCEPTANCE, deliberately. An acceptance is a
 * real event and losing it would be worse than a missing packet, so that
 * module never throws and reports everything as a warning. An invitation is
 * not yet an event: it is an email we are about to send. If the application
 * cannot be created, the RIGHT answer is to not send the email, exactly as
 * the token mint beside it already does. A family holding a link to a page
 * that cannot take their money is worse than a family not yet invited.
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";
import { carryForwardInquiryAnswers } from "@/lib/admissions/interest-form/carry-forward";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type InvitedApplication =
  | { readonly ok: true; readonly applicationId: string; readonly created: boolean }
  | { readonly ok: false; readonly reason: string };

/**
 * The decision, with no database in it, so the branching can be tested.
 *
 * Every wrong answer here is either a family invited with nowhere to pay or a
 * duplicate application, and neither is something to find out in production.
 */
export function planApplicationForInvite(input: {
  readonly existingApplicationId: string | null;
  readonly schoolId: string | null;
  readonly currentSchoolYearId: string | null;
  readonly schoolName: string;
}):
  | { readonly action: "use_existing"; readonly applicationId: string }
  | { readonly action: "create"; readonly schoolYearId: string }
  | { readonly action: "refuse"; readonly reason: string } {
  if (input.existingApplicationId) {
    return { action: "use_existing", applicationId: input.existingApplicationId };
  }

  if (!input.schoolId) {
    return {
      action: "refuse",
      reason:
        "This student has no school on their record, so an application could not " +
        "be created. Set their campus, then invite them.",
    };
  }

  /*
   * Refused, not defaulted. Guessing a school year would attach a family's
   * money to the wrong one, and the wrong year is harder to find than a
   * missing row.
   */
  if (!input.currentSchoolYearId) {
    return {
      action: "refuse",
      reason:
        `${input.schoolName} has no current school year, so an application ` +
        `could not be created and the family has not been emailed. Set the ` +
        `current school year, then invite them.`,
    };
  }

  return { action: "create", schoolYearId: input.currentSchoolYearId };
}

/**
 * Find or create the application an invitation needs.
 *
 * Returns a reason rather than throwing, because the caller has a decision to
 * record either way - it simply must not send the email.
 */
export async function ensureApplicationForInvitedLead(
  supabase: AuthClient,
  input: { readonly leadId: string }
): Promise<InvitedApplication> {
  /*
   * Look before creating a second one. A family re-invited after a bounced
   * address must land on the application they already have, with whatever
   * they have already paid against it.
   */
  const { data: existing, error: existingError } = await supabase
    .from("admissions_applications")
    .select("id")
    .eq("lead_id", input.leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    return {
      ok: false,
      reason:
        `Could not check whether this student already has an application ` +
        `(${existingError.message}).`,
    };
  }
  if (existing?.id) {
    return { ok: true, applicationId: existing.id as string, created: false };
  }

  const { data: lead, error: leadError } = await supabase
    .from("admissions_leads")
    .select("school_id, schools(name)")
    .eq("id", input.leadId)
    .maybeSingle();

  if (leadError) {
    return {
      ok: false,
      reason: `Could not read this student's record (${leadError.message}).`,
    };
  }

  const schoolId = (lead as { school_id?: string | null } | null)?.school_id ?? null;
  const schoolName =
    (lead as { schools?: { name?: string } | null } | null)?.schools?.name ??
    "This school";

  const { data: year } = schoolId
    ? await supabase
        .from("school_years")
        .select("id")
        .eq("school_id", schoolId)
        .eq("is_current", true)
        .limit(1)
        .maybeSingle()
    : { data: null };

  const plan = planApplicationForInvite({
    existingApplicationId: null,
    schoolId,
    currentSchoolYearId: (year?.id as string | undefined) ?? null,
    schoolName,
  });

  if (plan.action === "refuse") return { ok: false, reason: plan.reason };
  if (plan.action === "use_existing") {
    return { ok: true, applicationId: plan.applicationId, created: false };
  }

  const { data: created, error: createError } = await supabase
    .from("admissions_applications")
    .insert({
      lead_id: input.leadId,
      school_year_id: plan.schoolYearId,
      /*
       * The same status the acceptance path uses. A new value here would mean
       * every screen that reads application_status learns about it from a
       * family's screen rather than from a decision.
       *
       * application_fee_cents is NOT set: migration 291 defaults it to 10000,
       * and naming it here would be a second place the $100 is written down.
       */
      application_status: "in_progress",
    })
    .select("id")
    .single();

  if (createError || !created) {
    return {
      ok: false,
      reason:
        `Could not create an application for this student ` +
        `(${createError?.message ?? "no row returned"}).`,
    };
  }

  const applicationId = created.id as string;

  /*
   * The same two follow-ups the acceptance path runs. Neither may stop an
   * invitation that has otherwise succeeded - the application exists and the
   * family can pay - so both are logged and stepped over.
   */
  try {
    await supabase.rpc("ensure_state_funding_verifications", {
      p_application_id: applicationId,
    });
  } catch (e) {
    console.error("[invite] state funding verifications not created", {
      leadId: input.leadId,
      applicationId,
      error: e instanceof Error ? e.message : String(e),
    });
  }

  try {
    const carried = await carryForwardInquiryAnswers(input.leadId, applicationId);
    if ("error" in carried) {
      console.error("[invite] inquiry answers not carried forward", {
        leadId: input.leadId,
        applicationId,
        error: carried.error,
      });
    }
  } catch (e) {
    console.error("[invite] inquiry answers not carried forward", {
      leadId: input.leadId,
      applicationId,
      error: e instanceof Error ? e.message : String(e),
    });
  }

  return { ok: true, applicationId, created: true };
}
