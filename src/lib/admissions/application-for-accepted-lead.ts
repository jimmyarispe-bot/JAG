/**
 * Accepting a family has to produce the thing they sign.
 *
 * WHAT WAS WRONG. submitAdmissionsDecision ends with:
 *
 *     if (decisionType === "accept" && applicationId) {
 *       await generateEnrollmentPacket(applicationId, leadId);
 *     }
 *
 * `applicationId` comes from a hidden form field, and it is null for every
 * lead that has no row in admissions_applications. There is exactly one such
 * row in the whole database. So for almost every family, accepting them:
 *
 *   - records the decision                              (happens)
 *   - sends the acceptance email                        (happens)
 *   - creates the follow-up task                        (happens)
 *   - sets the application status                       (skipped, silently)
 *   - generates the enrollment packet they must sign    (skipped, silently)
 *
 * No error, no warning, nothing in a log. The family is accepted and there is
 * no contract, and the only way to find out is to look for one. This is the
 * same shape as every other failure in this system: the `if` guard reads as
 * defensive and behaves as a trapdoor.
 *
 * WHAT THIS DOES. On an accept with no application, one is created for the
 * lead's own school year, so the rest of the acceptance runs as written.
 *
 * WHEN IT CANNOT, IT SAYS SO. A school with no current school year cannot have
 * an application attached to one. The decision is still recorded - an
 * acceptance is a real event and losing it would be worse - but the caller
 * gets a warning naming the reason, and the wizard shows it. Silence is the
 * one option not on the table.
 */

// Type-only: this module never creates a client, it is handed one.
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { carryForwardInquiryAnswers } from "@/lib/admissions/interest-form/carry-forward";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * The decision, with no database in it.
 *
 * Separated so the branching can be tested directly. Every wrong answer here
 * is either a family accepted with no contract or a duplicate application, and
 * neither is something to find out about in production.
 */
export type ApplicationPlan =
  | { readonly action: "use_existing"; readonly applicationId: string }
  | { readonly action: "create"; readonly schoolYearId: string }
  | { readonly action: "not_needed" }
  | { readonly action: "refuse"; readonly reason: string };

export function planApplicationForAcceptance(input: {
  readonly decisionType: string;
  readonly existingApplicationId: string | null;
  readonly currentSchoolYearId: string | null;
  readonly schoolName: string;
}): ApplicationPlan {
  // Only an acceptance needs a contract. Creating an application for a family
  // we are declining would put a row in the pipeline that nobody wants there.
  if (input.decisionType !== "accept") return { action: "not_needed" };

  if (input.existingApplicationId) {
    return { action: "use_existing", applicationId: input.existingApplicationId };
  }

  if (!input.currentSchoolYearId) {
    return {
      action: "refuse",
      reason:
        `${input.schoolName} has no current school year, so an application cannot be ` +
        `attached to one and no enrollment packet was generated. The decision is ` +
        `recorded. Set the current school year, then generate the packet.`,
    };
  }

  return { action: "create", schoolYearId: input.currentSchoolYearId };
}

export interface EnsuredApplication {
  readonly applicationId: string | null;
  /** Null when everything worked. Shown to whoever made the decision. */
  readonly warning: string | null;
  readonly created: boolean;
}

/**
 * Find or create the application an acceptance needs.
 *
 * Never throws: an acceptance must not be lost because of what follows it.
 * Everything that goes wrong comes back as `warning`.
 */
export async function ensureApplicationForAcceptedLead(
  supabase: AuthClient,
  input: { readonly leadId: string; readonly decisionType: string; readonly applicationId: string | null }
): Promise<EnsuredApplication> {
  if (input.decisionType !== "accept") {
    return { applicationId: input.applicationId, warning: null, created: false };
  }
  if (input.applicationId) {
    return { applicationId: input.applicationId, warning: null, created: false };
  }

  // The form field was empty, which is not the same as there being no
  // application. Look before creating a second one.
  const { data: existing, error: existingError } = await supabase
    .from("admissions_applications")
    .select("id")
    .eq("lead_id", input.leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    return {
      applicationId: null,
      warning:
        `Could not check whether this student already has an application ` +
        `(${existingError.message}), so no enrollment packet was generated. ` +
        `The decision is recorded.`,
      created: false,
    };
  }
  if (existing?.id) {
    return { applicationId: existing.id as string, warning: null, created: false };
  }

  const { data: lead, error: leadError } = await supabase
    .from("admissions_leads")
    .select("school_id, schools(name)")
    .eq("id", input.leadId)
    .maybeSingle();

  if (leadError || !lead?.school_id) {
    return {
      applicationId: null,
      warning:
        `This student has no school on their record, so an application could not be ` +
        `created and no enrollment packet was generated. The decision is recorded.`,
      created: false,
    };
  }

  const schoolName =
    (lead as { schools?: { name?: string } | null }).schools?.name ?? "This school";

  const { data: year } = await supabase
    .from("school_years")
    .select("id")
    .eq("school_id", lead.school_id)
    .eq("is_current", true)
    .limit(1)
    .maybeSingle();

  const plan = planApplicationForAcceptance({
    decisionType: input.decisionType,
    existingApplicationId: null,
    currentSchoolYearId: (year?.id as string | undefined) ?? null,
    schoolName,
  });

  if (plan.action === "refuse") {
    return { applicationId: null, warning: plan.reason, created: false };
  }
  if (plan.action !== "create") {
    return { applicationId: null, warning: null, created: false };
  }

  const { data: created, error: createError } = await supabase
    .from("admissions_applications")
    .insert({
      lead_id: input.leadId,
      school_year_id: plan.schoolYearId,
      application_status: "in_progress",
    })
    .select("id")
    .single();

  if (createError || !created) {
    return {
      applicationId: null,
      warning:
        `Could not create an application for this student ` +
        `(${createError?.message ?? "no row returned"}), so no enrollment packet was ` +
        `generated. The decision is recorded.`,
      created: false,
    };
  }

  const applicationId = created.id as string;

  // The same two follow-ups startApplication does. Neither may block an
  // acceptance, so both are logged and stepped over rather than returned.
  try {
    await supabase.rpc("ensure_state_funding_verifications", {
      p_application_id: applicationId,
    });
  } catch (e) {
    console.error("[accept] state funding verifications not created", {
      leadId: input.leadId,
      applicationId,
      error: e instanceof Error ? e.message : String(e),
    });
  }

  try {
    const carried = await carryForwardInquiryAnswers(input.leadId, applicationId);
    if ("error" in carried) {
      console.error("[accept] inquiry answers not carried forward", {
        leadId: input.leadId,
        applicationId,
        error: carried.error,
      });
    }
  } catch (e) {
    console.error("[accept] inquiry carry-forward threw", {
      leadId: input.leadId,
      applicationId,
      error: e instanceof Error ? e.message : String(e),
    });
  }

  return { applicationId, warning: null, created: true };
}
