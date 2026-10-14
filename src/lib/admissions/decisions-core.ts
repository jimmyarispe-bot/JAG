/**
 * THE ADMISSIONS DECISION ITSELF, WITH NO OPINION ABOUT WHO IS ASKING.
 *
 * ── WHY THIS FILE EXISTS, 14 OCTOBER 2026 ──────────────────────────────────
 *
 * Every line below was the body of submitAdmissionsDecision in decisions.ts and
 * is moved here WORD FOR WORD. Nothing about an acceptance changed: the same
 * decision row, the same letter, the same stage move, the same enrollment
 * packet, the same audit, the same four revalidations, in the same order.
 *
 * What changed is who may run it. submitAdmissionsDecision begins with
 * assertAnyPermission, which reads a signed-in session - and the shadow day's
 * notes page has no session at all. It is opened from a link in a letter,
 * exactly like /post-call and /application-call, and that is deliberate: a
 * school leader walking out of a shadow day presses one button on her phone.
 *
 * Jimmy, 14 October: "let's make the buttons this - accept-send email,
 * deny-send email".
 *
 * TWO DOORS ONTO ONE DECISION MUST NOT DO TWO DIFFERENT THINGS. That rule is
 * why accept_or_deny's branches delegate here rather than sending their own
 * letters, and it is why the button in the letter delegates here too instead
 * of growing its own copy of an acceptance. An acceptance made from a phone at
 * the school gate and one made from the decisions board are the same event.
 *
 * NO "use server" IN THIS FILE, deliberately. Every export of a "use server"
 * module becomes a callable server action, and this one takes a Supabase
 * client - which is not serializable and must never be reachable from a
 * browser. The action stays in decisions.ts; the work lives here.
 */

import { revalidatePath } from "next/cache";
import type { AuthClient } from "@/lib/supabase/auth-client";
import { writePlatformAudit } from "@/lib/platform/automation/audit";
import type { LeadStageValue } from "@/lib/constants/admissions";
import { transitionCaseStage } from "@/lib/admissions/case/orchestration";
import { generateEnrollmentPacket } from "@/lib/admissions/enrollment-packets";
import { ensureApplicationForAcceptedLead } from "@/lib/admissions/application-for-accepted-lead";
import { onDecisionSubmitted } from "@/lib/admissions/communications/triggers";
import { loadOrganizationBranding, buildAdmissionsDecisionEmail } from "@/lib/branding";

export type DecisionType = "accept" | "waitlist" | "deny" | "request_info";

const DECISION_STAGE: Record<DecisionType, LeadStageValue> = {
  accept: "accepted",
  waitlist: "waitlisted",
  deny: "declined",
  request_info: "records_requested",
};

const DECISION_APP_STATUS: Partial<Record<DecisionType, string>> = {
  accept: "accepted",
  waitlist: "waitlisted",
  deny: "denied",
};

/**
 * Null for `deny`, and that is the point.
 *
 * There is no approved decline letter in code. The one that used to be here was
 * never approved, nor was student_declined_email in the database (both removed
 * 15 September 2026). The letter Jimmy wrote — application_declined_email,
 * migration 247 — belongs to gate 2, and whether it should also speak for
 * gate 3 is his decision, not this function's.
 *
 * Until he makes it, a deny records the decision and sends the family nothing,
 * visibly. See the email_sent_at handling below: it refuses to stamp a
 * timestamp for a letter that does not exist.
 */
function buildDecisionEmail(
  decision: DecisionType,
  studentName: string,
  branding: Awaited<ReturnType<typeof loadOrganizationBranding>>,
  customNotes?: string
): { subject: string; body: string } | null {
  return buildAdmissionsDecisionEmail(decision, studentName, branding, customNotes);
}

export async function applyAdmissionsDecision(
  supabase: AuthClient,
  input: {
    readonly leadId: string;
    readonly applicationId: string | null;
    readonly decisionType: DecisionType;
    readonly customNotes: string;
    readonly sendEmail: boolean;
    /** Null when nobody was signed in - a decision made from a letter. */
    readonly actorUserId: string | null;
  }
) {
  const {
    leadId,
    decisionType,
    customNotes,
    sendEmail,
    actorUserId,
  } = input;
  let applicationId = input.applicationId;

  const { data: lead } = await supabase
    .from("admissions_leads")
    .select("first_name, last_name, guardian_email")
    .eq("id", leadId)
    .single();

  if (!lead) return { error: "Lead not found" };

  const studentName = `${lead.first_name} ${lead.last_name}`;

  /**
   * AN ACCEPTANCE HAS TO PRODUCE THE THING THE FAMILY SIGNS.
   *
   * applicationId arrives from a hidden form field and is null for every lead
   * with no row in admissions_applications - which is all but one of them.
   * Everything below that is guarded by it then skipped in silence: the
   * application status, and the enrollment packet itself. Resolved here, before
   * the decision is written, so the decision row carries it too.
   */
  const ensured = await ensureApplicationForAcceptedLead(supabase, {
    leadId,
    decisionType,
    applicationId,
  });
  applicationId = ensured.applicationId;
  let warning: string | null = ensured.warning;

  const branding = await loadOrganizationBranding(supabase);
  const email = buildDecisionEmail(decisionType, studentName, branding, customNotes);

  /**
   * No approved letter means no letter, and no claim that one was sent.
   *
   * Before this, email_sent_at was stamped whenever the caller asked to send,
   * regardless of whether anything reached the family — the house pattern at
   * its most expensive, because the record of a decline is the only evidence
   * anybody would ever check.
   */
  const hasApprovedLetter = email !== null;
  const willEmailFamily = sendEmail && hasApprovedLetter;

  const { data: decision, error: decisionError } = await supabase
    .from("admissions_decisions")
    .insert({
      lead_id: leadId,
      application_id: applicationId,
      decision_type: decisionType,
      decision_notes: customNotes || null,
      email_subject: email?.subject ?? null,
      email_body: email?.body ?? null,
      email_sent_at: willEmailFamily ? new Date().toISOString() : null,
      decided_by: actorUserId,
    })
    .select("id")
    .single();

  if (decisionError) return { error: decisionError.message };

  if (willEmailFamily) {
    await onDecisionSubmitted(
      supabase,
      leadId,
      applicationId,
      decisionType,
      customNotes,
      actorUserId
    );
  }

  const stage = DECISION_STAGE[decisionType];
  const stageResult = await transitionCaseStage(supabase, leadId, stage, actorUserId);
  if (stageResult.error) return { error: stageResult.error };

  if (applicationId && DECISION_APP_STATUS[decisionType]) {
    await supabase
      .from("admissions_applications")
      .update({
        application_status: DECISION_APP_STATUS[decisionType],
        admissions_decision_date: new Date().toISOString().split("T")[0],
        accepted_by_user_id: decisionType === "accept" ? actorUserId : null,
      })
      .eq("id", applicationId);
  }

  const taskNames: Record<DecisionType, string> = {
    accept: "Enrollment follow-up — accepted student",
    waitlist: "Waitlist monitoring follow-up",
    deny: "Archive declined application",
    request_info: "Follow up on requested information",
  };

  await supabase.from("admissions_tasks").insert({
    lead_id: leadId,
    task_name: taskNames[decisionType],
    due_date: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
    task_status: "open",
    assigned_to_user_id: actorUserId,
  });

  if (decisionType === "accept" && applicationId) {
    // The result was discarded before. A packet that failed to generate looked
    // exactly like one that had.
    const packet = await generateEnrollmentPacket(applicationId, leadId);
    if ("error" in packet) {
      warning =
        `${studentName} is accepted, but the enrollment packet could not be generated ` +
        `(${packet.error}). Nothing has been sent for signature.`;
      console.error("[accept] enrollment packet not generated", {
        leadId,
        applicationId,
        error: packet.error,
      });
    }
  } else if (decisionType === "accept" && !warning) {
    warning =
      `${studentName} is accepted, but no application could be resolved, so no ` +
      `enrollment packet was generated.`;
  }

  const { data: leadSchool } = await supabase
    .from("admissions_leads")
    .select("school_id")
    .eq("id", leadId)
    .maybeSingle();

  await writePlatformAudit(supabase, {
    schoolId: leadSchool?.school_id,
    module: "admissions",
    entityType: "admissions_leads",
    entityId: leadId,
    actionType: "admissions_decision",
    summary: `Decision recorded: ${decisionType}`,
    actorUserId: actorUserId,
    metadata: {
      decisionId: decision.id,
      decisionType,
      applicationId,
      sendEmail,
      // What was actually asked for vs what actually happened. A deny with
      // sendEmail true and emailedFamily false is the deliberate gap, and the
      // audit trail should say so rather than leaving it to be inferred.
      emailedFamily: willEmailFamily,
      noApprovedLetter: sendEmail && !hasApprovedLetter ? decisionType : null,
    },
  });

  revalidatePath(`/dashboard/admissions/leads/${leadId}`);
  revalidatePath("/dashboard/admissions");
  revalidatePath("/dashboard/ceo");
  revalidatePath("/dashboard/students");

  return { success: true, decisionId: decision.id, warning };
}
