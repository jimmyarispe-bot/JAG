import "server-only";

/**
 * Opening one family's application from a link, with no account.
 *
 * WHY THIS EXISTS. The invitation to apply used to link to /apply/portal,
 * which redirects anyone without a session to /login. Lisa Roy received a
 * correct invitation on 22 Sep 2026 and landed on a password box. The fix
 * attempted on 22 Sep - provisioning her an account - was reverted, because:
 *
 *   "we can't/shouldn't ask a parent to create an account without being an
 *    accepted student to our school."  - Jimmy, 23 Sep 2026
 *
 * So the link carries the authority instead. A token minted for the lead when
 * the family is invited proves the holder was sent that invitation, which is
 * exactly the claim this page needs and nothing more.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS IS AN UNAUTHENTICATED WRITE PATH ONTO A CHILD'S RECORD. The rules that
 * keep it narrow, all enforced here rather than by the caller:
 *
 *   1. The lead id is ALWAYS derived from the token. No function in this file
 *      accepts a lead id, an application id or a school id from outside. A
 *      caller cannot ask for a different family because there is no parameter
 *      in which to say so.
 *   2. A token must be exactly 64 hex characters. Anything else is rejected
 *      before it reaches the database, so the column is never queried with
 *      attacker-shaped input.
 *   3. Only the application fields a parent fills in are writable. The write
 *      list is a constant below, not the caller's object keys, so a posted
 *      `application_status` or `lead_id` is ignored rather than trusted.
 *   4. Nothing here reads or returns another lead, a list, or anything about
 *      the school beyond its name.
 *
 * The service-role client is used deliberately: there is no auth.uid(), so RLS
 * has nobody to match and would refuse every read. The scoping that RLS would
 * have done is done above, by the token, and is the reason rules 1-4 are
 * absolute rather than conventional.
 */

import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * A structurally typed handle on the service-role client.
 *
 * WHY. `application_access_token` was added by migration 412, which is
 * hand-run, so it is absent from the generated `database.ts` until types are
 * regenerated. The typed client therefore refuses `.eq("application_access_token", ...)`
 * outright and collapses every row in this file to GenericStringError - the
 * same type-generation lag that broke timesheet-review.ts on 22 Sep.
 *
 * The narrow interface below is the pattern admissions/automation-gate.ts
 * already uses for the same reason: assert the shape once, in one place that
 * explains itself, rather than scattering casts down the file where the
 * reasoning is invisible.
 *
 * Everything comes back as `unknown` and is narrowed at the point of use, so
 * this buys looseness at the query layer and pays for it with explicitness at
 * the read.
 */
type LooseResult = { data: unknown; error: { message: string } | null };

interface LooseQuery extends PromiseLike<LooseResult> {
  select: (columns: string) => LooseQuery;
  insert: (row: Record<string, unknown>) => LooseQuery;
  update: (row: Record<string, unknown>) => LooseQuery;
  eq: (column: string, value: unknown) => LooseQuery;
  order: (column: string, options?: { ascending?: boolean }) => LooseQuery;
  limit: (count: number) => LooseQuery;
  maybeSingle: () => PromiseLike<LooseResult>;
  single: () => PromiseLike<LooseResult>;
}

interface LooseAdmin {
  from: (table: string) => LooseQuery;
}

function looseAdmin(): LooseAdmin {
  return createServiceRoleClient() as unknown as LooseAdmin;
}

/** The lead columns this module reads. Named, so nothing is circular. */
interface LeadRow {
  id: string;
  school_id: string | null;
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  guardian_first_name: string | null;
  guardian_last_name: string | null;
  schools?: { name?: string | null } | null;
}

/** 32 random bytes, hex encoded, as minted by mint_application_access_token. */
const TOKEN_PATTERN = /^[0-9a-f]{64}$/;

/**
 * The only columns a family may write. Anything else posted is discarded.
 * Widening this list is a deliberate act; spreading a caller's object is not.
 */
const PARENT_WRITABLE_FIELDS = [
  "previous_school",
  "emergency_contact_name",
  "emergency_contact_phone",
  "learning_needs_summary",
  "guardian_notes",
  "student_summary",
  "medical_notes",
] as const;

export type ParentWritableField = (typeof PARENT_WRITABLE_FIELDS)[number];

export interface TokenApplicationContext {
  readonly leadId: string;
  readonly applicationId: string;
  readonly studentName: string;
  readonly guardianName: string;
  readonly schoolName: string;
  readonly submitted: boolean;
  readonly values: Record<ParentWritableField, string>;
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Resolve a token to its lead, or null.
 *
 * Null for every failure - malformed, unknown, revoked - and deliberately does
 * not say which. A page that distinguishes "no such token" from "that token was
 * revoked" tells someone guessing tokens that they are getting warm.
 */
async function leadForToken(token: string): Promise<LeadRow | null> {
  if (!TOKEN_PATTERN.test(token)) return null;

  const admin = looseAdmin();
  const { data, error } = await admin
    .from("admissions_leads")
    .select(
      "id, school_id, first_name, last_name, preferred_name, guardian_first_name, guardian_last_name, schools(name)"
    )
    .eq("application_access_token", token)
    .maybeSingle();

  if (error) {
    console.error("[apply-link] token lookup failed:", error.message);
    return null;
  }
  return (data as LeadRow | null) ?? null;
}

/**
 * Everything the application page needs, creating the application row on first
 * visit.
 *
 * The row is created here rather than when the invitation is sent, so a family
 * who never clicks leaves no half-started application behind for staff to
 * wonder about.
 */
export async function openApplicationByToken(
  token: string
): Promise<TokenApplicationContext | null> {
  const lead = await leadForToken(token);
  if (!lead) return null;

  const admin = looseAdmin();

  const { data: existingRaw } = await admin
    .from("admissions_applications")
    .select("id, application_status, " + PARENT_WRITABLE_FIELDS.join(", "))
    .eq("lead_id", lead.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let application = (existingRaw as Record<string, unknown> | null) ?? null;

  if (!application) {
    /* The current school year for this campus, the same read the portal does. */
    const { data: year } = await admin
      .from("school_years")
      .select("id")
      .eq("school_id", lead.school_id)
      .eq("is_current", true)
      .maybeSingle();

    const { data: createdRaw, error: createError } = await admin
      .from("admissions_applications")
      .insert({
        lead_id: lead.id,
        school_year_id: (year as { id?: string } | null)?.id ?? null,
        application_status: "in_progress",
      })
      .select("id, application_status, " + PARENT_WRITABLE_FIELDS.join(", "))
      .single();

    if (createError || !createdRaw) {
      console.error("[apply-link] could not create application:", createError?.message);
      return null;
    }
    application = createdRaw as Record<string, unknown>;

    /*
     * Carry forward what they told us on the inquiry. The invitation promises
     * "you will not need to repeat anything you already told us", so this is
     * the sentence being kept. A failure must not stop the family applying -
     * retyping one answer is better than a door that will not open - so it is
     * logged and the application proceeds, exactly as startApplication does.
     */
    try {
      const { carryForwardInquiryAnswers } = await import(
        "@/lib/admissions/interest-form/carry-forward"
      );
      const carried = await carryForwardInquiryAnswers(lead.id, String(application.id));
      if (carried && typeof carried === "object" && "error" in carried) {
        console.error("[apply-link] inquiry answers not carried forward", carried.error);
      }
    } catch (err) {
      console.error("[apply-link] carry-forward threw", err);
    }
  }

  const values = Object.fromEntries(
    PARENT_WRITABLE_FIELDS.map((f) => [f, clean(application?.[f])])
  ) as Record<ParentWritableField, string>;

  const studentName =
    clean(lead.preferred_name) ||
    `${clean(lead.first_name)} ${clean(lead.last_name)}`.trim() ||
    "your child";

  const guardianName =
    `${clean(lead.guardian_first_name)} ${clean(lead.guardian_last_name)}`.trim() ||
    "there";

  return {
    leadId: lead.id,
    applicationId: String(application.id),
    studentName,
    guardianName,
    schoolName: clean(lead.schools?.name) || "The Academy",
    submitted: String(application.application_status ?? "") === "submitted",
    values,
  };
}

/** Save a draft. Only PARENT_WRITABLE_FIELDS are written, whatever is passed. */
export async function saveApplicationByToken(
  token: string,
  posted: Record<string, unknown>
): Promise<{ ok: true } | { error: string }> {
  const context = await openApplicationByToken(token);
  if (!context) return { error: "That link is no longer valid." };
  if (context.submitted) {
    return { error: "This application has already been submitted." };
  }

  const update: Record<string, string | null> = {};
  for (const field of PARENT_WRITABLE_FIELDS) {
    const value = clean(posted[field]);
    update[field] = value.length ? value : null;
  }

  const admin = looseAdmin();
  const { error } = await admin
    .from("admissions_applications")
    .update(update)
    .eq("id", context.applicationId);

  if (error) return { error: error.message };
  return { ok: true };
}

/**
 * Submit the application, and invite the family to book shadow days.
 *
 * WHAT HAPPENS, in order, and why the order matters:
 *
 *   1. the parent's last edits are saved
 *   2. the application is marked submitted
 *   3. the lead moves to application_submitted, with a stage-history row
 *   4. the family is emailed the shadow-days invitation
 *
 * The email is LAST because a send that fails must not leave an application
 * unsubmitted - the family did their part, and losing that to a mail problem
 * would be the worst failure in the chain. A failed send is reported to the
 * caller and the submission stands.
 *
 * WHY THE STAGE MOVES BY DIRECT UPDATE rather than transitionCaseStage. That
 * function opens the decision gate for the new stage, which for
 * application_submitted is invite_to_shadow_days - a school leader being asked
 * whether to invite this family. Jimmy, 23 Sep: "once the parent completes the
 * application they are sent a followup email with schedule your shadow days."
 * Automatic, not asked. Opening a gate AND sending the email would put a
 * question in front of Nina whose answer would send the family a second copy
 * of a letter they already have.
 *
 * The consequence, stated so it is a decision and not an accident: nobody
 * reviews a family between application and shadow days. That is what was
 * asked for. If that should change, the fix is to restore the gate here and
 * stop sending the email, not to do both.
 */
export async function submitApplicationByToken(
  token: string,
  posted: Record<string, unknown>
): Promise<{ ok: true; emailed: boolean } | { error: string }> {
  const saved = await saveApplicationByToken(token, posted);
  if ("error" in saved) return { error: saved.error };

  const context = await openApplicationByToken(token);
  if (!context) return { error: "That link is no longer valid." };

  const admin = looseAdmin();
  const now = new Date().toISOString();

  const { error: submitError } = await admin
    .from("admissions_applications")
    .update({ application_status: "submitted", submitted_at: now })
    .eq("id", context.applicationId);

  if (submitError) return { error: submitError.message };

  /* The lead's stage, and the history row the app would have written. */
  const { data: leadNow } = await admin
    .from("admissions_leads")
    .select("lead_stage")
    .eq("id", context.leadId)
    .maybeSingle();

  const previousStage = (leadNow as { lead_stage?: string | null } | null)?.lead_stage ?? null;

  await admin
    .from("admissions_leads")
    .update({ lead_stage: "application_submitted", stage_entered_at: now })
    .eq("id", context.leadId);

  /*
   * A raw stage update that skips the history row leaves a gap nothing can
   * reconstruct - the same note the 10 Sep import made about itself.
   */
  await admin.from("admissions_lead_stage_history").insert({
    lead_id: context.leadId,
    previous_stage: previousStage,
    new_stage: "application_submitted",
    changed_at: now,
  });

  let emailed = false;
  try {
    const { notifyAdmissionsEvent } = await import(
      "@/lib/admissions/communications/triggers"
    );
    await notifyAdmissionsEvent(admin as never, {
      leadId: context.leadId,
      applicationId: context.applicationId,
      events: ["shadow_days_invited"],
      sentBy: null,
    } as never);
    emailed = true;
  } catch (err) {
    /*
     * Reported, not swallowed. The application IS submitted; the family simply
     * has not been told what happens next, and somebody needs to know that so
     * they can send it by hand.
     */
    console.error("[apply-link] shadow days invitation failed to send", err);
  }

  return { ok: true, emailed };
}
