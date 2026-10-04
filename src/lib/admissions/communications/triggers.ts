import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { MergeContext } from "@/lib/admissions/communications/merge-fields";
import {
  processCommunicationQueue,
  scheduleApplicationIncompleteReminders,
  scheduleTourReminders,
  triggerCommunications,
} from "@/lib/admissions/communications/engine";
import type { CommunicationTriggerEvent } from "@/lib/admissions/communications/types";
import { dispatchAdmissionsAutomation } from "@/lib/admissions/automation/dispatch";
import type { WorkflowTriggerEvent } from "@/lib/admissions/automation/types";
import {
  appointmentTextForFamily,
  appointmentTimeForFamily,
} from "@/lib/admissions/appointment-text";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface NotifyAdmissionsEventOptions {
  leadId: string;
  applicationId?: string | null;
  events: CommunicationTriggerEvent[];
  mergeOverrides?: Partial<MergeContext>;
  sentBy?: string | null;
  tourScheduledAt?: string;
  interviewScheduledAt?: string;
  processQueue?: boolean;
}

/** Low-level comm trigger — prefer dispatch helpers below for new code */
export async function notifyAdmissionsEvent(
  supabase: AuthClient,
  options: NotifyAdmissionsEventOptions
) {
  for (const triggerEvent of options.events) {
    await triggerCommunications(supabase, {
      leadId: options.leadId,
      applicationId: options.applicationId,
      triggerEvent,
      mergeOverrides: options.mergeOverrides,
      sentBy: options.sentBy ?? null,
    });
  }

  if (options.tourScheduledAt) {
    await scheduleTourReminders(supabase, options.leadId, options.tourScheduledAt);
  }

  if (options.interviewScheduledAt) {
    await scheduleInterviewReminders(
      supabase,
      options.leadId,
      options.applicationId ?? null,
      options.interviewScheduledAt
    );
  }

  if (options.processQueue !== false) {
    await processCommunicationQueue(supabase);
  }
}

export async function scheduleInterviewReminders(
  supabase: AuthClient,
  leadId: string,
  applicationId: string | null,
  interviewScheduledAt: string
) {
  const interviewDate = new Date(interviewScheduledAt);
  const reminders: { event: CommunicationTriggerEvent; hoursBefore: number }[] = [
    { event: "interview_reminder_24h", hoursBefore: 24 },
    { event: "interview_reminder_2h", hoursBefore: 2 },
  ];

  const { data: lead } = await supabase
    .from("admissions_leads")
    .select("school_id")
    .eq("id", leadId)
    .single();

  if (!lead?.school_id) return;

  const templateSets = await Promise.all(
    reminders.map(({ event }) =>
      supabase
        .from("admissions_communication_templates")
        .select("id, template_key, channel")
        .eq("trigger_event", event)
        .eq("is_active", true)
        .or(`school_id.is.null,school_id.eq.${lead.school_id}`)
    )
  );

  const queueRows = [];
  for (let i = 0; i < reminders.length; i++) {
    const { event, hoursBefore } = reminders[i];
    const templates = templateSets[i].data ?? [];
    for (const template of templates) {
      const scheduledFor = new Date(
        interviewDate.getTime() - hoursBefore * 60 * 60 * 1000
      ).toISOString();

      if (new Date(scheduledFor) <= new Date()) continue;

      queueRows.push({
        lead_id: leadId,
        application_id: applicationId,
        template_id: template.id,
        template_key: template.template_key,
        trigger_event: event,
        channel: template.channel,
        scheduled_for: scheduledFor,
        status: "pending",
        /*
         * THE REMINDER HAS NEVER CARRIED THE TIME IT IS REMINDING ABOUT.
         *
         * interviewDatetime is set only as a mergeOverride on the immediate
         * send. A queued letter is rendered from the lead when it eventually
         * goes out, and loadMergeContextsForQueue reads the latest TOUR, not
         * the interview - so interview_datetime resolved to the empty string
         * and the 24-hour reminder read:
         *
         *     "reminder: interview for Callum Tondreau tomorrow at ."
         *
         * Nothing after the "at". It had been that way since the templates
         * were seeded and nobody saw it, because until the 11pm calendar scan
         * ran for the first time on 3 October nothing had ever told the
         * platform that a family had booked, so these two rows were never
         * written at all.
         *
         * merge_overrides (migration 479) is what makes the fix possible: the
         * moment of QUEUEING knows the appointment, and now says so.
         */
        merge_overrides: {
          interviewDatetime: appointmentTextForFamily(interviewScheduledAt),
          interviewTime: appointmentTimeForFamily(interviewScheduledAt),
        },
      });
    }
  }

  if (queueRows.length) {
    await supabase.from("admissions_communication_queue").insert(queueRows);
  }
}

async function dispatch(
  supabase: AuthClient,
  trigger: WorkflowTriggerEvent,
  opts: {
    leadId: string;
    applicationId?: string | null;
    sentBy?: string | null;
    mergeOverrides?: Partial<MergeContext>;
    tourScheduledAt?: string;
    interviewScheduledAt?: string;
  }
) {
  await dispatchAdmissionsAutomation(supabase, {
    trigger,
    leadId: opts.leadId,
    applicationId: opts.applicationId,
    sentBy: opts.sentBy,
    mergeOverrides: opts.mergeOverrides as Record<string, unknown>,
    tourScheduledAt: opts.tourScheduledAt,
    interviewScheduledAt: opts.interviewScheduledAt,
  });
}

export async function notifyMissingDocumentsIfNeeded(
  supabase: AuthClient,
  leadId: string,
  applicationId: string,
  sentBy?: string | null
) {
  const { data: pending } = await supabase
    .from("admissions_application_checklist_items")
    .select("item_key")
    .eq("application_id", applicationId)
    .eq("status", "pending");

  if (!pending?.length) return;

  const labels = pending.map((p) => p.item_key.replace(/_/g, " "));

  await dispatch(supabase, "missing_documents", {
    leadId,
    applicationId,
    sentBy,
    mergeOverrides: { missingDocuments: labels, missingItems: labels },
  });
}

export async function notifyStateFundingNeeded(
  supabase: AuthClient,
  leadId: string,
  applicationId: string,
  sentBy?: string | null
) {
  const { data: verifications } = await supabase
    .from("state_funding_verifications")
    .select("id")
    .eq("application_id", applicationId)
    .in("verification_status", ["pending", "rejected"]);

  if (!verifications?.length) return;

  await triggerCommunications(supabase, {
    leadId,
    applicationId,
    triggerEvent: "state_funding_verification_needed",
    sentBy: sentBy ?? null,
  });
}

export async function onApplicationStarted(
  supabase: AuthClient,
  leadId: string,
  applicationId: string,
  sentBy?: string | null
) {
  await dispatch(supabase, "application_started", {
    leadId,
    applicationId,
    sentBy,
  });
}

export async function onInquirySubmitted(
  supabase: AuthClient,
  leadId: string,
  sentBy?: string | null,
  /* What arrived with the inquiry. The caller knows; a query here would not -
     see the ordering note in interest-form/submit.ts. */
  mergeOverrides?: Partial<MergeContext>
) {
  await dispatch(supabase, "inquiry_submitted", { leadId, sentBy, mergeOverrides });
}

export async function onTourScheduled(
  supabase: AuthClient,
  leadId: string,
  scheduledAt: string,
  sentBy?: string | null
) {
  await dispatch(supabase, "tour_scheduled", {
    leadId,
    sentBy,
    tourScheduledAt: scheduledAt,
    mergeOverrides: { tourDatetime: appointmentTextForFamily(scheduledAt) },
  });
}

export async function onApplicationSubmitted(
  supabase: AuthClient,
  leadId: string,
  applicationId: string,
  sentBy?: string | null
) {
  await dispatch(supabase, "application_submitted", {
    leadId,
    applicationId,
    sentBy,
  });
}

export async function onFundingVerificationDecision(
  supabase: AuthClient,
  leadId: string,
  applicationId: string,
  status: string,
  rejectionReason: string | null,
  sentBy?: string | null
) {
  await dispatch(
    supabase,
    status === "verified" ? "funding_verified" : "funding_rejected",
    {
      leadId,
      applicationId,
      sentBy,
      mergeOverrides: { rejectionReason },
    }
  );
}

export async function onDecisionSubmitted(
  supabase: AuthClient,
  leadId: string,
  applicationId: string | null,
  decisionType: "accept" | "waitlist" | "deny" | "request_info",
  customNotes: string,
  sentBy?: string | null
) {
  const triggerMap: Record<typeof decisionType, WorkflowTriggerEvent> = {
    accept: "accepted",
    waitlist: "waitlisted",
    deny: "declined",
    request_info: "admissions_decision",
  };

  await dispatch(supabase, triggerMap[decisionType], {
    leadId,
    applicationId,
    sentBy,
    mergeOverrides: { customNotes },
  });
}

export async function onEnrollmentCompleted(
  supabase: AuthClient,
  leadId: string,
  applicationId: string | null,
  sentBy?: string | null
) {
  await dispatch(supabase, "enrollment_completed", {
    leadId,
    applicationId,
    sentBy,
  });
}

export async function onInterviewScheduled(
  supabase: AuthClient,
  leadId: string,
  applicationId: string | null,
  scheduledAt: string,
  sentBy?: string | null
) {
  await dispatch(supabase, "interview_scheduled", {
    leadId,
    applicationId,
    sentBy,
    interviewScheduledAt: scheduledAt,
    /*
     * EASTERN, AND NO SECONDS.
     *
     * This was new Date(scheduledAt).toLocaleString(), which is what printed
     * "10/7/2026, 1:00:00 PM" in the notice Heather forwarded on 1 October -
     * seconds on a school appointment, rendered in whatever timezone the
     * server happens to be running in rather than the one the school is in.
     *
     * appointment-text.ts was written on 24 September to replace exactly this
     * call, and replaced it on the shadow-day path only. This is the other
     * half, which every interest meeting has been going out with since.
     */
    mergeOverrides: {
      interviewDatetime: appointmentTextForFamily(scheduledAt),
      interviewTime: appointmentTimeForFamily(scheduledAt),
    },
  });
}

export async function onDocumentUploaded(
  supabase: AuthClient,
  leadId: string,
  applicationId: string,
  sentBy?: string | null
) {
  await dispatch(supabase, "documents_uploaded", {
    leadId,
    applicationId,
    sentBy,
  });
}

export async function onFinancialAidSubmitted(
  supabase: AuthClient,
  leadId: string,
  applicationId: string,
  sentBy?: string | null
) {
  await dispatch(supabase, "financial_aid_submitted", {
    leadId,
    applicationId,
    sentBy,
  });
}

export async function onApplicationSaved(
  supabase: AuthClient,
  leadId: string,
  applicationId: string,
  sentBy?: string | null
) {
  await dispatch(supabase, "application_saved", {
    leadId,
    applicationId,
    sentBy,
  });
}
