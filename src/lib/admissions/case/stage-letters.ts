/**
 * A STAGE CHOSEN ON THE DASHBOARD DOES WHAT THE MATCHING EMAIL BUTTON DOES.
 *
 * Jimmy, 23 October 2026: "confirm the admission pipeline stages are
 * initiating the same triggers, processes, functions when they are changed as
 * the email buttons in the admissions flow".
 *
 *   tour_requested       post-call "Send the tour request"   tour_invitation_sent
 *   application_started  post-call "Send the application"    application_invited
 *   accepted / declined  "Accept/Deny - send email"          applyAdmissionsDecision
 *
 * Only the dashboard's stage dropdowns call this (updateCaseStage,
 * updateLeadStage). transitionCaseStage itself stays letter-free: the parent
 * portal moves a child to application_started when the family starts the
 * application, and must not email them an invitation to do so.
 *
 * NO "use server": it takes a Supabase client.
 */
import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { LeadStageValue } from "@/lib/constants/admissions";
import type { CommunicationTriggerEvent } from "@/lib/admissions/communications/types";
import { transitionCaseStage } from "@/lib/admissions/case/orchestration";
import { campusRunsTours, requireTourLink, tourGateArmed } from "@/lib/admissions/tour";
import { prepareApplicationForInvite } from "@/lib/admissions/application-for-invited-lead";
import { notifyAdmissionsEvent } from "@/lib/admissions/communications/triggers";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

const DECISION_FOR_STAGE: Partial<Record<LeadStageValue, "accept" | "deny">> = {
  accepted: "accept",
  declined: "deny",
};

const LETTER_FOR_STAGE: Partial<Record<LeadStageValue, CommunicationTriggerEvent>> = {
  tour_requested: "tour_invitation_sent",
  application_started: "application_invited",
};

export async function moveStageFromDashboard(
  supabase: AuthClient,
  leadId: string,
  stage: LeadStageValue,
  actorUserId: string | null
): Promise<{ error?: string; success?: boolean; warning?: string | null }> {
  const { data: lead } = await supabase
    .from("admissions_leads")
    .select("lead_stage, stage_entered_at, schools(name, tour_booking_url)")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return { error: "Case not found" };

  const row = lead as {
    lead_stage: string | null;
    stage_entered_at?: string | null;
    schools?: { name?: string | null; tour_booking_url?: string | null } | { name?: string | null; tour_booking_url?: string | null }[] | null;
  };
  const stageBefore = row.lead_stage ?? "";
  const stageEnteredBefore = row.stage_entered_at ?? null;
  const school = (Array.isArray(row.schools) ? row.schools[0] : row.schools) ?? null;
  const schoolName = school?.name?.trim() || null;

  /* Accept / Deny: the same decision the gate and the post-call page run. */
  const decision = DECISION_FOR_STAGE[stage];
  if (decision) {
    const { data: application } = await supabase
      .from("admissions_applications")
      .select("id")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { applyAdmissionsDecision } = await import("@/lib/admissions/decisions-core");
    const outcome = await applyAdmissionsDecision(supabase, {
      leadId,
      applicationId: (application?.id as string | undefined) ?? null,
      decisionType: decision,
      customNotes: "",
      sendEmail: true,
      actorUserId,
    });
    if (outcome && "error" in outcome && outcome.error) return { error: outcome.error };
    const warning =
      outcome && "warning" in outcome && typeof outcome.warning === "string" ? outcome.warning : null;
    return { success: true, warning };
  }

  /* The tour guards post-call runs, checked BEFORE anything moves. */
  if (stage === "tour_requested") {
    if (!(tourGateArmed() && campusRunsTours(schoolName))) {
      return {
        error:
          `${schoolName ?? "This campus"} is not sending tour requests, so there is no ` +
          `tour invitation to send. Nothing moved.`,
      };
    }
    const tour = requireTourLink({ schoolName, tourUrl: school?.tour_booking_url ?? null });
    if (!tour.ok) return { error: `${tour.error} Nothing moved.` };
  }

  const result = await transitionCaseStage(supabase, leadId, stage, actorUserId);
  if (result.error) return { error: result.error };

  const event = LETTER_FOR_STAGE[stage];
  if (!event) return { success: true };

  /* post-call's alreadySentSinceThisStep: one letter per stage entry. */
  if (stageBefore === stage && stageEnteredBefore) {
    const { data: sent, error: sentError } = await supabase
      .from("admissions_communications")
      .select("id")
      .eq("lead_id", leadId)
      .eq("trigger_event", event)
      .eq("delivery_status", "sent")
      .gte("sent_at", stageEnteredBefore)
      .limit(1);
    if (sentError) {
      console.error("[moveStageFromDashboard] duplicate check failed, sending anyway:", sentError.message);
    } else if ((sent ?? []).length) {
      return { success: true };
    }
  }

  if (event === "application_invited") {
    const prepared = await prepareApplicationForInvite(supabase, { leadId });
    if (!prepared.ok) {
      return {
        error:
          `The stage moved, but the family was not emailed: ${prepared.reason} ` +
          `Nothing was sent, so nobody has a broken link.`,
      };
    }
  }

  try {
    await notifyAdmissionsEvent(supabase, { leadId, events: [event], sentBy: actorUserId });
  } catch (mailError) {
    return {
      error: `The stage moved, but the email to the family failed: ${
        mailError instanceof Error ? mailError.message : String(mailError)
      }`,
    };
  }
  return { success: true };
}
