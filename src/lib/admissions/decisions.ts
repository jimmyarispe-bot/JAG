"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { writePlatformAudit } from "@/lib/platform/automation/audit";
import { assertAnyPermission } from "@/lib/platform/identity/action-guards";
import type { LeadStageValue } from "@/lib/constants/admissions";
import { transitionCaseStage } from "@/lib/admissions/case/orchestration";
import { generateEnrollmentPacket } from "@/lib/admissions/enrollment-packets";
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

export async function submitAdmissionsDecision(formData: FormData) {
  const auth = await assertAnyPermission("admissions.manage", "admissions.accept");
  if ("error" in auth) return { error: auth.error };

  const supabase = auth.supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const leadId = formData.get("lead_id") as string;
  const applicationId = (formData.get("application_id") as string) || null;
  const decisionType = formData.get("decision_type") as DecisionType;
  const customNotes = (formData.get("decision_notes") as string) || "";
  const sendEmail = formData.get("send_email") === "true";

  const { data: lead } = await supabase
    .from("admissions_leads")
    .select("first_name, last_name, guardian_email")
    .eq("id", leadId)
    .single();

  if (!lead) return { error: "Lead not found" };

  const studentName = `${lead.first_name} ${lead.last_name}`;
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
      decided_by: user?.id ?? null,
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
      user?.id ?? null
    );
  }

  const stage = DECISION_STAGE[decisionType];
  const stageResult = await transitionCaseStage(supabase, leadId, stage, user?.id ?? null);
  if (stageResult.error) return { error: stageResult.error };

  if (applicationId && DECISION_APP_STATUS[decisionType]) {
    await supabase
      .from("admissions_applications")
      .update({
        application_status: DECISION_APP_STATUS[decisionType],
        admissions_decision_date: new Date().toISOString().split("T")[0],
        accepted_by_user_id: decisionType === "accept" ? user?.id ?? null : null,
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
    assigned_to_user_id: user?.id ?? null,
  });

  if (decisionType === "accept" && applicationId) {
    await generateEnrollmentPacket(applicationId, leadId);
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
    actorUserId: user?.id ?? null,
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

  return { success: true, decisionId: decision.id };
}
