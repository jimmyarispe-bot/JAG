import type { createAuthClient } from "@/lib/supabase/server-auth";
import { runWorkflowEngine } from "@/lib/admissions/automation/engine";
import { processWorkflowQueue } from "@/lib/admissions/automation/queue";
import { scheduleEscalationsForTrigger } from "@/lib/admissions/automation/escalations";
import { recordAdmissionsPlatformEvent } from "@/lib/admissions/automation/platform-adapter";
import { notifyAdmissionsEvent } from "@/lib/admissions/communications/triggers";
import type { CommunicationTriggerEvent } from "@/lib/admissions/communications/types";
import type { DispatchAutomationOptions, WorkflowTriggerEvent } from "@/lib/admissions/automation/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Maps workflow triggers to legacy communication events for fallback */
const LEGACY_EVENT_MAP: Partial<Record<WorkflowTriggerEvent, CommunicationTriggerEvent[]>> = {
  inquiry_submitted: ["inquiry_submitted", "staff_new_inquiry"],
  tour_scheduled: ["tour_scheduled"],
  application_started: ["application_started", "staff_application_started"],
  application_submitted: ["application_submitted", "staff_application_submitted"],
  documents_uploaded: ["staff_documents_uploaded"],
  funding_verified: ["funding_verification_approved", "staff_funding_verified"],
  funding_rejected: ["funding_verification_rejected"],
  financial_aid_submitted: ["financial_aid_documents_requested", "staff_financial_aid_submitted"],
  interview_scheduled: ["interview_scheduled", "staff_interview_scheduled"],
  accepted: ["student_accepted", "staff_application_accepted"],
  waitlisted: ["student_waitlisted"],
  declined: ["student_declined"],
  enrollment_completed: ["enrollment_completed"],
  missing_documents: ["missing_documents"],
  admissions_decision: ["additional_info_requested"],
};

export async function dispatchAdmissionsAutomation(
  supabase: AuthClient,
  options: DispatchAutomationOptions
) {
  const ranWorkflows = await runWorkflowEngine(supabase, options);

  if (!ranWorkflows && !options.skipLegacyFallback) {
    const legacyEvents = LEGACY_EVENT_MAP[options.trigger];
    if (legacyEvents?.length) {
      await notifyAdmissionsEvent(supabase, {
        leadId: options.leadId,
        applicationId: options.applicationId,
        events: legacyEvents,
        mergeOverrides: options.mergeOverrides as Parameters<
          typeof notifyAdmissionsEvent
        >[1]["mergeOverrides"],
        sentBy: options.sentBy,
        tourScheduledAt: options.tourScheduledAt,
        interviewScheduledAt: options.interviewScheduledAt,
      });
    }
  }

  const { data: lead } = await supabase
    .from("admissions_leads")
    .select("school_id")
    .eq("id", options.leadId)
    .single();

  if (lead?.school_id) {
    await scheduleEscalationsForTrigger(
      supabase,
      lead.school_id,
      options.trigger,
      options.leadId,
      options.applicationId ?? null
    );

    await recordAdmissionsPlatformEvent(supabase, {
      trigger: options.trigger,
      leadId: options.leadId,
      applicationId: options.applicationId,
      schoolId: lead.school_id,
      sentBy: options.sentBy,
    });
  }

  /*
   * WHAT USED TO BE HERE, AND WHY IT IS NOT.
   *
   * This function ended with:
   *
   *     await processAllPlatformQueues(supabase);
   *
   * processAllPlatformQueues is the NIGHTLY RUNNER. It budgets itself
   * RUN_BUDGET_MS = 45_000 and works through thirty-odd jobs: KPI
   * snapshots, executive insights, compliance sync, and the heavy
   * integration syncs for Google Workspace, Microsoft 365, EDI and the
   * rest. vercel.json schedules it at 0 0 * * * for exactly that reason.
   *
   * dispatchAdmissionsAutomation is reached from the PUBLIC interest form.
   * submitPublishedInterestForm -> onInquirySubmitted -> dispatch -> here,
   * with the SERVICE ROLE client (interest-form/submit.ts:454). So every
   * mother who filled in the form on the website ran the school's nightly
   * job runner inside her own submission, with full privileges, and waited
   * for it to finish.
   *
   * ── THE EVIDENCE ────────────────────────────────────────────────────
   *
   * admissions_leads.created_at is written at the start of the submission
   * and admissions_interest_submissions.submitted_at at the very end. The
   * gap between them is what the family waited. Fourteen submissions,
   * 30 September to 7 October:
   *
   *     Logan Astor              07:14:50 -> 07:15:38   48s
   *     Logan Astor              07:33:18 -> 07:34:08   50s
   *     Logan Astor              07:34:48 -> 07:35:37   49s
   *     Ella Rose Douet Reeves   11:13:03 -> 11:13:52   49s
   *     Ian Xavier Matos Ortiz   19:29:38 -> 19:30:26   48s
   *     Arthur Cross             04:57:04 -> 04:57:51   47s
   *     Minnie Wheeler           17:39:02 -> 17:39:51   49s
   *
   * Every one between 47 and 50 seconds. That is not variance, that is
   * the 45s budget plus overhead, measured fourteen times.
   *
   * Logan Astor's mother pressed submit three times, 07:14, 07:33 and
   * 07:34, and The Academy Virtual got three lead rows for one child.
   *
   * ── WHY REMOVING IT COSTS NOTHING ───────────────────────────────────
   *
   * Every letter this event sends has already gone out before this point.
   * notifyAdmissionsEvent drains the communication queue itself, at
   * communications/triggers.ts:59, and that runs near the top of this
   * function. The line below sent no letter, raised no notice and did
   * nothing at all for the family whose request was paying for it.
   *
   * The nightly cron still runs every one of those jobs, unchanged, and
   * /api/admissions/process-communications drains the communication queue
   * every five minutes. Nothing stops happening. It stops happening ON A
   * PARENT'S CLICK.
   *
   * ── THE RULE ────────────────────────────────────────────────────────
   *
   * A request a family is waiting on does that family's work and no one
   * else's. Platform-wide work belongs to a schedule.
   */
}
