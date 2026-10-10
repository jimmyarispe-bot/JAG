import type { createAuthClient } from "@/lib/supabase/server-auth";
import { fetchLeadFundingCodesByLeadIds } from "@/lib/funding/sync";
import { resolveSchoolAdmissionsContacts } from "@/lib/admissions/communications/staff-recipients";
import { withNetworkOffice } from "@/lib/admissions/communications/network-office";
import { renderTemplate, type MergeContext } from "@/lib/admissions/communications/merge-fields";
import {
  appointmentTextForFamily,
  appointmentTimeForFamily,
} from "@/lib/admissions/appointment-text";
import { adjustManyScheduledForBusinessHours } from "@/lib/platform/automation/business-hours";
import { sendTransactionalEmail } from "@/lib/platform/email";
import {
  COMMUNICATION_QUEUE_PROCESS_COLS,
  COMMUNICATION_TEMPLATE_COLS,
  LEAD_MERGE_CONTEXT_COLS,
} from "@/lib/admissions/communications/projections";
import type {
  CommunicationChannel,
  CommunicationTemplate,
  CommunicationTriggerEvent,
} from "@/lib/admissions/communications/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

type LeadMergeRow = {
  id: string;
  school_id: string | null;
  assigned_to_user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  guardian_first_name: string | null;
  guardian_last_name: string | null;
  guardian_email: string | null;
  guardian_phone: string | null;
  program: string | null;
  applying_for_grade: string | null;
  current_grade: string | null;
  date_of_birth: string | null;
  application_access_token: string | null;
  /**
   * THE FOUR BUTTON TOKENS, READ BACK FROM THE LEAD.
   *
   * Added 5 October after the first real inquiry proved they were not.
   * interest_link_token was minted by submit.ts, written to the lead, and
   * then never read by anything: it was absent from this type, from the
   * projection, and from every caller's merge overrides. So
   * {{interest_link_action}} rendered its FALLBACK on every single staff
   * notice - the case page, which asks a school leader to sign in.
   *
   * That link is not a convenience. Since migration 489 a family hears
   * nothing at all until somebody presses it, and it had never once been a
   * button.
   *
   * The other three arrive as merge overrides from the jobs that mint them,
   * and worked. They are read here as well because "the only caller always
   * passes it" is exactly the assumption that broke this one.
   */
  interest_link_token: string | null;
  interest_call_token: string | null;
  application_call_token: string | null;
  post_call_token: string | null;
  schools: SchoolContact | SchoolContact[] | null;
};

type SchoolContact = {
  name?: string;
  /** Added 9 October 2026. See schoolAddressFromLead(). */
  address?: string | null;
  admissions_contact_name?: string | null;
  admissions_contact_email?: string | null;
  admissions_booking_url?: string | null;
  admissions_from_email?: string | null;
  shadow_days_url?: string | null;
  tour_booking_url?: string | null;
  /**
   * Added 9 October 2026, migration 529. The school leader blind-copied on
   * every letter this school sends a family. NOT admissions_contact_email -
   * that is who a parent replies to, this is who is accountable for what the
   * school says. Null means nobody is copied, and never a fallback.
   */
  school_leader_bcc_email?: string | null;
};

type LeadStaffHint = {
  schoolId: string | null;
  assignedToUserId: string | null;
};

export interface TriggerCommunicationsOptions {
  leadId: string;
  applicationId?: string | null;
  triggerEvent: CommunicationTriggerEvent;
  mergeOverrides?: Partial<MergeContext>;
  sentBy?: string | null;
  skipQueue?: boolean;
}

/** PostgREST returns an embedded row as an object or a single-element array. */
function schoolOf(lead: LeadMergeRow): SchoolContact | null {
  const schools = lead.schools;
  if (!schools) return null;
  return (Array.isArray(schools) ? schools[0] : schools) ?? null;
}

function schoolNameFromLead(lead: LeadMergeRow): string | null {
  return schoolOf(lead)?.name ?? null;
}

/**
 * Where the school is, for when the tour booking does not say.
 *
 * WHY THIS IS NEEDED AT ALL. campus_address is read off the CAMPUS attached
 * to the tour, and on 9 October 2026 every tour ever booked had campus_id
 * null - Candace Martin, Ian Xavier Matos Ortiz and Jayden Roy, all three.
 * So campusAddress was always null and merge-fields fell through to the
 * string "See portal for directions", which went to Candace at 11:21am
 * above a tour she is driving to on Monday 19 October. There is no portal.
 *
 * The school's own address is the right answer when the booking is silent:
 * one building per school, and it is the building she is coming to.
 */
function schoolAddressFromLead(lead: LeadMergeRow): string | null {
  return clean(schoolOf(lead)?.address);
}

function clean(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text : null;
}

/**
 * The question key the interest form writes the program answer under.
 *
 * Confirmed against a live submission on 4 October: Adam Cross's inquiry for
 * Arthur carried question_key 'program' with the value ["Only Virtual"].
 */
const INQUIRY_PROGRAM_QUESTION_KEY = "program";

/** An answer is an array when the question is a checkbox group, which it is. */
function programsFromAnswer(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  const single = typeof value === "string" ? value.trim() : "";
  return single ? [single] : [];
}

/**
 * WHAT THE FAMILY TICKED, READ FROM WHERE THEY TICKED IT.
 *
 * WHY NOT lead.program. submit.ts sets it to null on every public inquiry,
 * deliberately, and says so on the line that does it: "Multi-select is
 * archived on interest answers; do not collapse onto lead.program."
 *
 * It is right to. There are two program vocabularies and they do not meet.
 * admissions_leads.program has a CHECK constraint on the canonical codes -
 * academy_fl_campus, academy_virtual and four others - while the form offers
 * a parent "In-Person", "Only Virtual" and "Hybrid (in-person + virtual)",
 * and lets them tick more than one. "Only Virtual" would fail the
 * constraint, and two ticks have nowhere to go in a single column.
 *
 * So the staff notice was asking the wrong place. {{program_name}} renders
 * programLabel(lead.program), whose first line is `if (!value) return "—";`,
 * and Heather has read "Programme: —" on every inquiry the public form has
 * ever produced.
 *
 * THE NEWEST SUBMISSION WINS. A family who inquires twice has two, and the
 * second one is what they currently want.
 *
 * A REFUSED READ RETURNS AN EMPTY MAP AND SAYS SO IN THE LOG. It renders as
 * "not recorded on the inquiry", which is the same thing a genuinely
 * unanswered question renders - deliberately, because this letter must not
 * claim to know something it could not read. The console line is how the
 * difference gets found.
 */
async function fetchInquiryProgramsByLeadIds(
  supabase: AuthClient,
  leadIds: string[]
): Promise<Map<string, string[]>> {
  const byLead = new Map<string, string[]>();
  if (!leadIds.length) return byLead;

  const { data: submissions, error: subError } = await supabase
    .from("admissions_interest_submissions")
    .select("id, lead_id, submitted_at")
    .in("lead_id", leadIds)
    .order("submitted_at", { ascending: false });

  if (subError) {
    console.error("[communications] inquiry programs, submissions:", subError.message);
    return byLead;
  }

  const newestSubmission = new Map<string, string>();
  for (const row of (submissions ?? []) as unknown as { id: string; lead_id: string }[]) {
    if (newestSubmission.has(row.lead_id)) continue;
    newestSubmission.set(row.lead_id, row.id);
  }
  if (!newestSubmission.size) return byLead;

  const leadBySubmission = new Map(
    [...newestSubmission].map(([leadId, submissionId]) => [submissionId, leadId])
  );

  const { data: answers, error: ansError } = await supabase
    .from("admissions_interest_answers")
    .select("submission_id, value")
    .in("submission_id", [...newestSubmission.values()])
    .eq("question_key", INQUIRY_PROGRAM_QUESTION_KEY);

  if (ansError) {
    console.error("[communications] inquiry programs, answers:", ansError.message);
    return byLead;
  }

  for (const row of (answers ?? []) as unknown as {
    submission_id: string;
    value: unknown;
  }[]) {
    const leadId = leadBySubmission.get(row.submission_id);
    if (!leadId) continue;
    byLead.set(leadId, programsFromAnswer(row.value));
  }

  return byLead;
}

function buildMergeContextFromParts(
  lead: LeadMergeRow,
  fundingSources: string[],
  inquiryPrograms: string[],
  /*
   * APPOINTMENTS, PLURAL. This was `tour` and carried only a tour, which is
   * why a queued interest-meeting reminder had nothing to say. See the note
   * on interviewDatetime below.
   */
  appt: {
    tourDatetime: string | null;
    campusName: string | null;
    campusAddress: string | null;
    interviewDatetime?: string | null;
    interviewTime?: string | null;
  },
  missingItems: string[],
  applicationId?: string | null,
  overrides?: Partial<MergeContext>
): MergeContext {
  return {
    studentFirstName: lead.first_name,
    studentLastName: lead.last_name,
    preferredName: lead.preferred_name,
    guardianFirstName: lead.guardian_first_name,
    guardianLastName: lead.guardian_last_name,
    guardianEmail: lead.guardian_email,
    guardianPhone: lead.guardian_phone,
    schoolName: schoolNameFromLead(lead),
    admissionsContactName: clean(schoolOf(lead)?.admissions_contact_name),
    admissionsContactEmail: clean(schoolOf(lead)?.admissions_contact_email),
    schoolLeaderBccEmail: clean(schoolOf(lead)?.school_leader_bcc_email),
    schedulingUrl: clean(schoolOf(lead)?.admissions_booking_url),
    shadowDaysUrl: clean(schoolOf(lead)?.shadow_days_url),
    /*
       A THIRD CALENDAR, NOT A SPARE ONE. Tours, interest calls and shadow
       days are three different appointments of three different lengths, and
       migration 262 recorded three separate Google schedules for exactly that
       reason. Sending a family to the wrong one is not a small mistake.

       Empty at HS and Virtual by design - tours are a physical-campus thing -
       which is why the sender must check before rendering a letter that
       carries {{tour_link}}. See requireTourLink in tour.ts.
    */
    tourUrl: clean(schoolOf(lead)?.tour_booking_url),
    /* The application link carries its own authority. See merge-fields. */
    applicationToken: clean(lead.application_access_token),
    /* See the note on the four token columns above. Overrides still win:
       processCommunicationQueue spreads merge_overrides last. */
    interestLinkToken: clean(lead.interest_link_token),
    interestCallToken: clean(lead.interest_call_token),
    applicationCallToken: clean(lead.application_call_token),
    postCallToken: clean(lead.post_call_token),
    fromEmail: clean(schoolOf(lead)?.admissions_from_email),
    program: lead.program,
    /* What they are applying FOR first; what they are in now is the fallback. */
    grade: lead.applying_for_grade ?? lead.current_grade ?? null,
    dateOfBirth: lead.date_of_birth,
    inquiryPrograms,
    campusName: appt.campusName,
    campusAddress: appt.campusAddress,
    fundingSources,
    applicationId: applicationId ?? null,
    leadId: lead.id,
    tourDatetime: appt.tourDatetime,
    /*
     * THE HOUR OF THE INTEREST MEETING, RESOLVED FROM THE LEAD.
     *
     * Amy D'Amico, 23 September, the whole letter:
     *
     *     "Dear Amy D'Amico, reminder: interview for Maddox tomorrow at ."
     *
     * Nothing after the "at". interview_datetime and interview_time were set
     * ONLY as merge_overrides on the immediate send, and a queued reminder is
     * rendered here, later, from the lead. This builder had no idea the child
     * had an appointment, so merge-fields resolved both to the empty string
     * and the sentence simply stopped.
     *
     * Commit 30f4efbd fixed the WRITING end - the queue row now carries the
     * time it was given at the moment of queueing. This is the READING end,
     * and both are wanted:
     *
     *   - a row queued before that commit still has no override
     *   - a row queued by any future path that forgets one
     *   - AND THE RESCHEDULE. An override is a photograph of the hour at the
     *     time of booking. Move the meeting and the override still shows the
     *     old hour, confidently, which is worse than blank. Reading the lead
     *     means the reminder tells the family where the appointment actually
     *     is now.
     *
     * `...overrides` stays last, so an override still wins where it exists.
     * This is the floor, not the answer.
     */
    interviewDatetime: appt.interviewDatetime ?? null,
    interviewTime: appt.interviewTime ?? null,
    missingItems,
    ...overrides,
  };
}

async function loadMergeContext(
  supabase: AuthClient,
  leadId: string,
  applicationId?: string | null,
  overrides?: Partial<MergeContext>
): Promise<{ mergeCtx: MergeContext; staff: LeadStaffHint }> {
  const [
    { data: lead },
    fundingByLead,
    inquiryProgramsByLead,
    { data: tour },
    { data: interview },
    checklistRes,
  ] =
    await Promise.all([
    supabase.from("admissions_leads").select(LEAD_MERGE_CONTEXT_COLS).eq("id", leadId).single(),
    fetchLeadFundingCodesByLeadIds(supabase, [leadId]),
    fetchInquiryProgramsByLeadIds(supabase, [leadId]),
    supabase
      .from("admissions_tours")
      .select("scheduled_at, campuses(name, address)")
      .eq("lead_id", leadId)
      .order("scheduled_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    /* The latest interest meeting, for the same reason as the tour above. */
    supabase
      .from("admissions_interviews")
      .select("scheduled_at")
      .eq("lead_id", leadId)
      .order("scheduled_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    applicationId
      ? supabase
          .from("admissions_application_checklist_items")
          .select("item_key, status")
          .eq("application_id", applicationId)
          .eq("status", "pending")
      : Promise.resolve({ data: [] as { item_key: string }[] }),
  ]);

  if (!lead) throw new Error("Lead not found");
  const leadRow = lead as LeadMergeRow;

  let tourDatetime: string | null = null;
  let campusName: string | null = null;
  let campusAddress: string | null = null;
  if (tour) {
    /* EASTERN, AND NO SECONDS - the same correction made to the interest
       meeting letter on 1 October. This was the last toLocaleString() left on
       a path that puts a time in front of a family: it renders in the
       SERVER's timezone, which on Vercel is UTC, so a tour booked for 9:00 AM
       Eastern was printed to the family as 1:00:00 PM. Identical to what
       Jennifer Borum was sent about Harris, in the one remaining place. */
    tourDatetime = appointmentTextForFamily(tour.scheduled_at);
    const campus = tour.campuses as { name?: string; address?: string } | null;
    campusName = campus?.name ?? null;
    campusAddress = clean(campus?.address);
  }

  const missingItems = (checklistRes.data ?? []).map((c) =>
    String(c.item_key).replace(/_/g, " ")
  );

  return {
    mergeCtx: buildMergeContextFromParts(
      leadRow,
      fundingByLead.get(leadId) ?? [],
      inquiryProgramsByLead.get(leadId) ?? [],
      /* The booking's campus first; the school's address when it is silent. */
      {
        tourDatetime,
        campusName,
        campusAddress: campusAddress ?? schoolAddressFromLead(leadRow),
        interviewDatetime: interview?.scheduled_at
          ? appointmentTextForFamily(interview.scheduled_at as string)
          : null,
        interviewTime: interview?.scheduled_at
          ? appointmentTimeForFamily(interview.scheduled_at as string)
          : null,
      },
      missingItems,
      applicationId,
      overrides
    ),
    staff: {
      schoolId: leadRow.school_id,
      assignedToUserId: leadRow.assigned_to_user_id,
    },
  };
}

/** P009 — batch merge contexts for queue processing (unique leads / applications). */
async function loadMergeContextsForQueue(
  supabase: AuthClient,
  items: Array<{ lead_id: string; application_id: string | null }>
): Promise<Map<string, { mergeCtx: MergeContext; staff: LeadStaffHint }>> {
  const result = new Map<string, { mergeCtx: MergeContext; staff: LeadStaffHint }>();
  const leadIds = [...new Set(items.map((i) => i.lead_id))];
  if (!leadIds.length) return result;

  const applicationIds = [
    ...new Set(items.map((i) => i.application_id).filter((id): id is string => Boolean(id))),
  ];

  const [
    { data: leads },
    fundingByLead,
    inquiryProgramsByLead,
    { data: tours },
    { data: interviews },
    { data: checklist },
  ] =
    await Promise.all([
      supabase.from("admissions_leads").select(LEAD_MERGE_CONTEXT_COLS).in("id", leadIds),
      fetchLeadFundingCodesByLeadIds(supabase, leadIds),
      fetchInquiryProgramsByLeadIds(supabase, leadIds),
      supabase
        .from("admissions_tours")
        .select("lead_id, scheduled_at, campuses(name, address)")
        .in("lead_id", leadIds)
        .order("scheduled_at", { ascending: false }),
      supabase
        .from("admissions_interviews")
        .select("lead_id, scheduled_at")
        .in("lead_id", leadIds)
        .order("scheduled_at", { ascending: false }),
      applicationIds.length
        ? supabase
            .from("admissions_application_checklist_items")
            .select("application_id, item_key, status")
            .in("application_id", applicationIds)
            .eq("status", "pending")
        : Promise.resolve({ data: [] as { application_id: string; item_key: string }[] }),
    ]);

  const leadById = new Map((leads ?? []).map((l) => [l.id as string, l as LeadMergeRow]));

  /**
   * WHO A QUEUED STAFF LETTER ACTUALLY REACHES.
   *
   * This was never resolved here. loadMergeContext does it for the IMMEDIATE
   * path and this one did not, so every queued staff_email fell through to
   * the single admissions_contact_email - one person, however many contacts
   * a campus has configured since migration 327. The 7am interest-meeting
   * escalation has been going to one address.
   *
   * The network office was never added either, because withNetworkOffice is
   * keyed on the trigger event and nothing here knew it. That is applied per
   * ITEM below rather than here, because one lead's two queued letters can
   * carry two different events.
   */
  const schoolIds = [
    ...new Set(
      (leads ?? [])
        .map((l) => (l as LeadMergeRow).school_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const campusEmailsBySchool = new Map<string, readonly string[]>();
  await Promise.all(
    schoolIds.map(async (schoolId) => {
      const lead = (leads ?? []).find(
        (l) => (l as LeadMergeRow).school_id === schoolId
      ) as LeadMergeRow | undefined;
      const school = lead ? schoolOf(lead) : null;
      const contacts = await resolveSchoolAdmissionsContacts(supabase, schoolId, {
        contactName: clean(school?.admissions_contact_name),
        contactEmail: clean(school?.admissions_contact_email),
        bookingUrl: clean(school?.admissions_booking_url),
      });
      campusEmailsBySchool.set(schoolId, contacts.notificationEmails);
    })
  );

  const latestTourByLead = new Map<
    string,
    { tourDatetime: string | null; campusName: string | null; campusAddress: string | null }
  >();
  for (const tour of tours ?? []) {
    const leadId = tour.lead_id as string;
    if (latestTourByLead.has(leadId)) continue;
    const campus = tour.campuses as { name?: string; address?: string } | null;
    latestTourByLead.set(leadId, {
      tourDatetime: appointmentTextForFamily(tour.scheduled_at),
      campusName: clean(campus?.name),
      campusAddress: clean(campus?.address),
    });
  }

  /* Latest first, so the first row wins - the same shape as the tours map. */
  const latestInterviewByLead = new Map<string, { datetime: string; time: string }>();
  for (const iv of interviews ?? []) {
    const leadId = iv.lead_id as string;
    if (latestInterviewByLead.has(leadId)) continue;
    const at = iv.scheduled_at as string | null;
    if (!at) continue;
    latestInterviewByLead.set(leadId, {
      datetime: appointmentTextForFamily(at),
      time: appointmentTimeForFamily(at),
    });
  }

  const missingByApp = new Map<string, string[]>();
  for (const row of checklist ?? []) {
    const appId = row.application_id as string;
    const list = missingByApp.get(appId) ?? [];
    list.push(String(row.item_key).replace(/_/g, " "));
    missingByApp.set(appId, list);
  }

  for (const item of items) {
    const key = `${item.lead_id}:${item.application_id ?? ""}`;
    if (result.has(key)) continue;
    const lead = leadById.get(item.lead_id);
    if (!lead) continue;
    result.set(key, {
      mergeCtx: {
        ...buildMergeContextFromParts(
          lead,
          fundingByLead.get(item.lead_id) ?? [],
          inquiryProgramsByLead.get(item.lead_id) ?? [],
          /*
           * THE SAME FALLBACK AS THE SINGLE PATH, AND IT HAS TO BE HERE TOO.
           *
           * This is the batch the QUEUE PROCESSOR runs, so it is what renders
           * Candace Martin's tour reminder on 18 October. Fixing only the
           * single-lead path above would have left the reminder saying "See
           * portal for directions" the morning before she drives to Smyrna.
           */
          (() => {
            const t = latestTourByLead.get(item.lead_id);
            const iv = latestInterviewByLead.get(item.lead_id);
            return {
              tourDatetime: t?.tourDatetime ?? null,
              campusName: t?.campusName ?? null,
              campusAddress: t?.campusAddress ?? schoolAddressFromLead(lead),
              /* "tomorrow at ." was rendered right here. */
              interviewDatetime: iv?.datetime ?? null,
              interviewTime: iv?.time ?? null,
            };
          })(),
          item.application_id ? (missingByApp.get(item.application_id) ?? []) : [],
          item.application_id
        ),
        /* The campus list, raw. The event decides who is added, per item. */
        staffNotificationEmails: lead.school_id
          ? (campusEmailsBySchool.get(lead.school_id) ?? [])
          : [],
      },
      staff: {
        schoolId: lead.school_id,
        assignedToUserId: lead.assigned_to_user_id,
      },
    });
  }

  return result;
}

async function getTemplatesForTrigger(
  supabase: AuthClient,
  schoolId: string,
  triggerEvent: CommunicationTriggerEvent
): Promise<CommunicationTemplate[]> {
  const { data } = await supabase
    .from("admissions_communication_templates")
    .select(COMMUNICATION_TEMPLATE_COLS)
    .eq("trigger_event", triggerEvent)
    .eq("is_active", true)
    .or(`school_id.is.null,school_id.eq.${schoolId}`);

  const templates = (data ?? []) as CommunicationTemplate[];

  const byKey = new Map<string, CommunicationTemplate>();
  for (const t of templates.sort((a, b) => (a.school_id ? 1 : 0) - (b.school_id ? 1 : 0))) {
    byKey.set(t.template_key, t);
  }
  return [...byKey.values()];
}

/**
 * THE FOUR LETTERS A SCHOOL LEADER IS NOT BLIND-COPIED ON.
 *
 * Every other family letter is - see the note inside deliverCommunication.
 * These four are money, and Jimmy's rule on money has never moved:
 *
 *   "remember only danni n me see anything related to money"
 *
 * It came up on 10 October while reviewing the six letters that fire during
 * the application. He said the two state-funding verifications are always
 * him, never a school leader - and the blind copy we shipped the night
 * before was putting all four of these in Nina's and Heather's inboxes,
 * including the one carrying an Award Amount line. Asked whether to take
 * them out: "yes".
 *
 * NOTHING HAS LEAKED. award_amount renders empty for a family who has not
 * sent it, which is the only kind of family that letter reaches. The line
 * exists, the copy was working, and that was enough.
 *
 * BY TEMPLATE KEY, NOT BY CATEGORY OR A GUESS AT THE WORDS. A category can
 * be re-pointed in the editor by somebody who does not know this rule
 * exists; a key is the letter itself. A new money letter has to be added
 * here by hand, deliberately - which is the right amount of friction for a
 * list whose whole job is keeping four addresses out of a mailbox.
 */
const NOT_COPIED_TO_THE_SCHOOL_LEADER: ReadonlySet<string> = new Set([
  "state_funding_needed_email",
  "funding_approved_email",
  "funding_rejected_email",
  "financial_aid_requested_email",
]);

async function deliverCommunication(
  supabase: AuthClient,
  params: {
    leadId: string;
    applicationId: string | null;
    template: CommunicationTemplate;
    mergeCtx: MergeContext;
    sentBy: string | null;
    customSubject?: string | null;
    customBody?: string | null;
    staff?: LeadStaffHint;
  }
) {
  const subject = renderTemplate(
    params.customSubject ?? params.template.subject,
    params.mergeCtx
  );
  const body = renderTemplate(params.customBody ?? params.template.body, params.mergeCtx);
  const channel = params.template.channel as CommunicationChannel;
  const isStaff = channel === "internal_note" || params.template.trigger_event.startsWith("staff_");

  /**
   * A LIST OF ADDRESSES IS A LIST, NOT A STRING WITH COMMAS IN IT.
   *
   * This joined the staff addresses with ", " and handed the result to the
   * provider as a single recipient. It worked for as long as every campus had
   * exactly one contact, and broke the moment one had two: on 25 September
   * Resend refused the staff acceptance notice with
   *
   *     422 validation_error - Invalid `to` field
   *     "to": [ "nina.gaddy@theacademyga.org, jimmy.arispe@theacademyway.org" ]
   *
   * Two addresses in one string. The provider accepts string | string[] and
   * always has; the flattening happened here.
   *
   * WHAT IT COST. The staff notice added the day before - the one that tells
   * Jimmy a student has been accepted - failed on every send, while the
   * family's letter went out fine. Visible in Resend's log, invisible in JAG,
   * because engine.ts still discards deliveryError.
   *
   * `recipients` is what gets sent. `sentTo` is the human-readable record
   * written to admissions_communications, which is why the join survives - as
   * a record of who was written to, not as an address.
   */
  const recipients: string[] =
    channel === "sms"
      ? [params.mergeCtx.guardianPhone ?? ""]
      : channel === "internal_note"
        ? ["staff"]
        : channel === "staff_email"
          ? // Every admissions contact for the campus, not just the one whose
            // calendar parents book. Falls back to the single contact so a
            // school with no rows in school_admissions_contacts still gets mail.
            (() => {
              const list = (params.mergeCtx.staffNotificationEmails ?? [])
                .map((email) => email.trim())
                .filter(Boolean);
              if (list.length) return list;
              const fallback = (params.mergeCtx.admissionsContactEmail ?? "").trim();
              return fallback ? [fallback] : [];
            })()
          : [params.mergeCtx.guardianEmail ?? ""];

  const sentTo = recipients.filter(Boolean).join(", ");

  const isEmail = channel === "email" || channel === "staff_email";

  let deliveryStatus: string = isEmail || channel === "sms" ? "pending" : "sent";
  let deliveryError: string | null = null;

  if (isEmail && sentTo) {
    /**
     * From a named person at a verified domain; replies go to their real inbox.
     *
     * The From *address* stays the verified sender. Sending as a leader's own
     * @gmail.com would fail SPF and land the school in spam, which is a worse
     * outcome than a noreply address with their name on it. Reply-to carries
     * the actual conversation, which is the part a parent uses.
     *
     * Staff mail replies to the family, so a school leader can answer an
     * inquiry alert without leaving their inbox.
     */
    const contactName = params.mergeCtx.admissionsContactName?.trim();
    const schoolName = params.mergeCtx.schoolName?.trim();
    const fromName =
      channel === "staff_email"
        ? undefined
        : contactName && schoolName
          ? `${contactName} · ${schoolName}`
          : contactName || schoolName || undefined;

    const replyTo =
      channel === "staff_email"
        ? params.mergeCtx.guardianEmail ?? undefined
        : params.mergeCtx.admissionsContactEmail ?? undefined;

    /**
     * The school's own domain when it has one, the network default otherwise.
     *
     * Left absent rather than defaulted here, so an unset school falls through
     * to EMAIL_FROM in one place instead of two. An address on a domain Resend
     * has not verified is rejected outright — which is why the editor tells the
     * operator that before they type it, and why null is the safe state.
     */
    const from = params.mergeCtx.fromEmail?.trim() || undefined;

    /*
     * THE SCHOOL LEADER SEES WHAT WENT OUT IN HER NAME.
     *
     * Heather Badger-Brown, 9 October, forwarding a letter sent FROM her own
     * address, signed "The Academy Virtual Admissions", that she had never
     * seen: "I wasn't invited to this interview. Jag wants my job."
     *
     * Jimmy: "anything that is sent from/on behalf of the school to a parent
     * needs to have the school leader blind copied in." Every family letter,
     * the strict reading of that sentence, confirmed on the 9th.
     *
     * FAMILY LETTERS ONLY. A staff_email already goes TO her; copying her on
     * her own mail is noise. channel === "email" is the family's post.
     *
     * NO FALLBACK. An empty column copies nobody. Guessing would mean a
     * person reading a family's mail because a field was blank.
     *
     * Not a merge field, so no template can print it: blind has to stay
     * blind, and a parent must never learn her letter was copied.
     */
    const leaderBcc =
      channel === "email" &&
      !NOT_COPIED_TO_THE_SCHOOL_LEADER.has(params.template.template_key)
        ? (params.mergeCtx.schoolLeaderBccEmail ?? "").trim()
        : "";

    const emailResult = await sendTransactionalEmail({
      // The list, not the joined string. See the note above `recipients`.
      to: recipients.filter(Boolean),
      subject,
      body,
      ...(from ? { from } : {}),
      ...(fromName ? { fromName } : {}),
      ...(replyTo ? { replyTo } : {}),
      ...(leaderBcc ? { bcc: leaderBcc } : {}),
    });
    deliveryStatus = emailResult.success ? "sent" : "failed";
    deliveryError = emailResult.error ?? null;

    if (!emailResult.success && process.env.NODE_ENV === "production") {
      const { createMissionControlItem } = await import("@/lib/platform/automation/mission-control");
      await createMissionControlItem(supabase, {
        module: "admissions",
        itemType: "admissions_alert",
        title: "Admissions email delivery failed",
        body: deliveryError ?? "Email delivery failed",
        entityType: "admissions_leads",
        entityId: params.leadId,
        severity: "high",
        assignedRole: "ADMISSIONS_DIRECTOR",
        metadata: { triggerEvent: params.template.trigger_event, sentTo },
      });
    }
  } else if (channel === "sms") {
    deliveryStatus = "logged";
    deliveryError = "SMS provider not configured for v1.0";
  }

  const { data: comm, error } = await supabase
    .from("admissions_communications")
    .insert({
      lead_id: params.leadId,
      application_id: params.applicationId,
      communication_type: channel,
      subject,
      body,
      sent_to: sentTo,
      sent_by: params.sentBy,
      template_id: params.template.id,
      template_key: params.template.template_key,
      trigger_event: params.template.trigger_event,
      delivery_status: deliveryStatus,
      open_status: "unknown",
      recipient_phone: channel === "sms" ? sentTo : null,
      is_staff_notification: isStaff,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[communications] deliver:", error.message, deliveryError ?? "");
    return null;
  }

  if (channel === "portal_notification") {
    await supabase.from("admissions_portal_notifications").insert({
      lead_id: params.leadId,
      application_id: params.applicationId,
      title: subject,
      body,
    });
  }

  if (isStaff) {
    let schoolId = params.staff?.schoolId ?? null;
    let assignedToUserId = params.staff?.assignedToUserId ?? null;
    if (!schoolId) {
      const { data: lead } = await supabase
        .from("admissions_leads")
        .select("school_id, assigned_to_user_id")
        .eq("id", params.leadId)
        .single();
      schoolId = lead?.school_id ?? null;
      assignedToUserId = lead?.assigned_to_user_id ?? null;
    }

    if (schoolId) {
      await supabase.from("admissions_staff_notifications").insert({
        user_id: assignedToUserId,
        school_id: schoolId,
        lead_id: params.leadId,
        application_id: params.applicationId,
        notification_type: params.template.trigger_event,
        title: subject,
        body,
      });
    }
  }

  return comm?.id ?? null;
}

export async function triggerCommunications(
  supabase: AuthClient,
  options: TriggerCommunicationsOptions
) {
  const loaded = await loadMergeContext(
    supabase,
    options.leadId,
    options.applicationId,
    options.mergeOverrides
  );
  const schoolId = loaded.staff.schoolId;
  if (!schoolId) return;

  /**
   * Who gets told, and whose calendar gets booked — now two questions.
   *
   * Until migration 327 they shared one column on `schools`, so a campus could
   * notify exactly one person. `resolveSchoolAdmissionsContacts` reads the new
   * table and falls back to those columns when it is empty or absent, so the
   * behaviour of a school nobody has configured is unchanged.
   *
   * The booking contact overrides the merge context because a parent's mail is
   * signed by, replies to, and books the calendar of ONE person. The
   * notification list is separate and is used only as the staff recipient.
   */
  const contacts = await resolveSchoolAdmissionsContacts(supabase, schoolId, {
    contactName: loaded.mergeCtx.admissionsContactName,
    contactEmail: loaded.mergeCtx.admissionsContactEmail,
    bookingUrl: loaded.mergeCtx.schedulingUrl,
  });

  loaded.mergeCtx = {
    ...loaded.mergeCtx,
    admissionsContactName: contacts.contactName,
    admissionsContactEmail: contacts.contactEmail,
    schedulingUrl: contacts.bookingUrl,
    /*
     * The campus contacts, plus the network office on the events that are the
     * network's business - acceptance. See network-office.ts.
     */
    staffNotificationEmails: withNetworkOffice(
      options.triggerEvent,
      contacts.notificationEmails
    ),
  };

  const allTemplates = await getTemplatesForTrigger(supabase, schoolId, options.triggerEvent);

  /**
   * Two versions of the family's confirmation exist: one that offers the
   * school's booking link, one that promises a person will be in touch. Exactly
   * one is sent, chosen by whether the school actually has a link.
   *
   * This is the guard that matters. `renderTemplate` leaves an unresolved token
   * in place as literal text, so a school with no booking URL would otherwise
   * email a prospective family the characters `{{scheduling_link}}` — the
   * clearest possible signal that nobody is home.
   *
   * A staff alert with no recipient is dropped the same way rather than queued
   * as a delivery to the empty string.
   */
  const hasBookingLink = Boolean(loaded.mergeCtx.schedulingUrl);
  const hasStaffEmail =
    (loaded.mergeCtx.staffNotificationEmails ?? []).length > 0 ||
    Boolean(loaded.mergeCtx.admissionsContactEmail);

  const templates = allTemplates.filter((t) => {
    if (t.template_key === "inquiry_thank_you_email") return hasBookingLink;
    if (t.template_key === "inquiry_thank_you_email_no_link") return !hasBookingLink;
    if (t.channel === "staff_email") return hasStaffEmail;
    return true;
  });

  const delayed = templates.filter((t) => t.delay_hours > 0 && !options.skipQueue);
  const immediate = templates.filter((t) => !(t.delay_hours > 0 && !options.skipQueue));

  if (delayed.length) {
    const targets = delayed.map(
      (template) => new Date(Date.now() + template.delay_hours * 60 * 60 * 1000)
    );
    const adjusted = await adjustManyScheduledForBusinessHours(supabase, schoolId, targets);
    const queueRows = delayed.map((template, index) => ({
      lead_id: options.leadId,
      application_id: options.applicationId ?? null,
      template_id: template.id,
      template_key: template.template_key,
      trigger_event: template.trigger_event,
      channel: template.channel,
      scheduled_for: adjusted[index].toISOString(),
      status: "pending",
    }));
    await supabase.from("admissions_communication_queue").insert(queueRows);
  }

  if (immediate.length) {
    await Promise.all(
      immediate.map((template) =>
        deliverCommunication(supabase, {
          leadId: options.leadId,
          applicationId: options.applicationId ?? null,
          template,
          mergeCtx: loaded.mergeCtx,
          sentBy: options.sentBy ?? null,
          staff: loaded.staff,
        })
      )
    );
  }
}

/**
 * HOW LONG A CLAIM CAN BE HELD BEFORE WE ASSUME THE RUN DIED.
 *
 * /api/admissions/process-communications declares maxDuration = 60, so Vercel
 * kills the function at one minute and no LIVE run can still be holding a
 * claim after that. Five minutes is five times the longest possible lifetime,
 * which is why a merely slow run can never have a row taken from it - and a
 * letter stranded by a run that crashed mid-delivery goes out on the next
 * cron tick instead of never.
 *
 * IF maxDuration EVER RISES, THIS MUST RISE WITH IT. A window shorter than a
 * run's lifetime reintroduces the exact duplicate this file now prevents.
 */
const CLAIM_RELEASE_MINUTES = 5;

/*
 * src/types/database.ts was generated on 9 July 2026. Migration 509 added the
 * status 'sending' and the column claimed_at on 5 October, so the generated
 * types reject both. These two interfaces are the narrowest structural shape
 * that lets the claim compile, and nothing wider.
 */
interface QueueWrite
  extends PromiseLike<{
    data: { id: string }[] | null;
    error: { message: string } | null;
  }> {
  eq: (column: string, value: string) => QueueWrite;
  in: (column: string, values: string[]) => QueueWrite;
  lt: (column: string, value: string) => QueueWrite;
  select: (columns: string) => QueueWrite;
}

interface QueueWriter {
  update: (row: Record<string, unknown>) => QueueWrite;
}

export async function processCommunicationQueue(supabase: AuthClient) {
  const now = new Date().toISOString();

  const queue = () =>
    supabase.from("admissions_communication_queue") as unknown as QueueWriter;

  /*
   * A ROW CLAIMED BY A RUN THAT NEVER CAME BACK.
   *
   * Released before anything else, so a letter lost to a crash is recovered by
   * this very run rather than waiting for a human to notice. A letter nobody
   * receives is worse than a letter received twice - Jimmy's own rule, from
   * gates/definitions.ts: "a question asked twice rather than a child who
   * stops dead".
   */
  const staleBefore = new Date(
    Date.now() - CLAIM_RELEASE_MINUTES * 60 * 1000
  ).toISOString();

  const { error: releaseError } = await queue()
    .update({ status: "pending", claimed_at: null })
    .eq("status", "sending")
    .lt("claimed_at", staleBefore);

  if (releaseError) {
    console.error("[communications] releasing stale claims:", releaseError.message);
  }

  const { data: pending } = await supabase
    .from("admissions_communication_queue")
    .select(COMMUNICATION_QUEUE_PROCESS_COLS)
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .limit(50);

  const candidates = pending ?? [];
  if (!candidates.length) return;

  /*
   * CLAIM BEFORE SENDING, AND SEND ONLY WHAT WAS CLAIMED.
   *
   * Until 5 October this function read status = 'pending', delivered, and only
   * then marked the row sent. Between the read and the mark the row was still
   * 'pending', so an overlapping run read the same row and sent the same
   * letter again. Lisa Roy received one letter three times on 5 October that
   * way, and Resend's log and admissions_communications agreed on all three.
   *
   * `.eq("status", "pending")` on the UPDATE is what makes this safe: it is a
   * compare-and-set, so of two runs reaching the same row exactly one update
   * matches and the other changes nothing. `.select("id")` returns only the
   * rows this run actually won.
   */
  const { data: claimedRows, error: claimError } = await queue()
    .update({ status: "sending", claimed_at: now })
    .in(
      "id",
      candidates.map((item) => String(item.id))
    )
    .eq("status", "pending")
    .select("id");

  if (claimError) {
    console.error("[communications] claim failed:", claimError.message);
    return;
  }

  const claimed = new Set((claimedRows ?? []).map((row) => String(row.id)));
  const items = candidates.filter((item) => claimed.has(String(item.id)));
  if (!items.length) return;

  const mergeByKey = await loadMergeContextsForQueue(
    supabase,
    items.map((item) => ({
      lead_id: item.lead_id,
      application_id: item.application_id,
    }))
  );

  for (const item of items) {
    const nested = item.admissions_communication_templates as
      | CommunicationTemplate
      | CommunicationTemplate[]
      | null;
    const template = (Array.isArray(nested) ? nested[0] : nested) ?? null;
    if (!template) {
      await queue()
        .update({ status: "failed", claimed_at: null })
        .eq("id", String(item.id));
      continue;
    }

    const packed = mergeByKey.get(`${item.lead_id}:${item.application_id ?? ""}`);
    if (!packed) {
      await queue()
        .update({ status: "failed", claimed_at: null })
        .eq("id", String(item.id));
      continue;
    }

    /*
     * WHAT THE QUEUE REMEMBERS ABOUT WHY IT WAS QUEUED.
     *
     * Until now a queued letter was rendered purely from the lead as it
     * stands when the letter finally goes out, with no way to carry anything
     * the moment of queueing knew. triggerCommunications has always accepted
     * mergeOverrides; the queue silently dropped them.
     *
     * That is fine for a reminder that only needs the family's name, and it
     * is useless for the escalation the 11pm scan writes, which has to tell a
     * school leader the three dates on which this family was emailed. The
     * scan knows them - it has just read them - and nothing else ever will,
     * because by 7am the next morning they are three rows among thousands.
     *
     * Overrides are applied LAST, over the freshly loaded context, so a value
     * the queue carried deliberately is not quietly replaced by a stale one.
     * A null column spreads as nothing and every existing row behaves exactly
     * as it did before.
     */
    const overrides = (item.merge_overrides ?? null) as Partial<MergeContext> | null;

    /*
     * The recipient list is decided per ITEM, not per lead, because
     * withNetworkOffice is keyed on the trigger event and one family's two
     * queued letters can carry two different ones. staff_interest_link_escalation
     * is the case this exists for: the campus is the thing being escalated
     * ABOUT, so that letter goes to Jimmy and Danni on top of it.
     */
    const withRecipients: MergeContext = {
      ...packed.mergeCtx,
      staffNotificationEmails: withNetworkOffice(
        template.trigger_event as CommunicationTriggerEvent,
        packed.mergeCtx.staffNotificationEmails ?? []
      ),
    };

    const commId = await deliverCommunication(supabase, {
      leadId: item.lead_id,
      applicationId: item.application_id,
      template,
      mergeCtx: overrides ? { ...withRecipients, ...overrides } : withRecipients,
      sentBy: null,
      customSubject: item.custom_subject,
      customBody: item.custom_body,
      staff: packed.staff,
    });

    /* claimed_at is cleared with the status, so a finished row is never
     * mistaken for a stale claim. */
    await queue()
      .update({
        status: commId ? "sent" : "failed",
        sent_communication_id: commId,
        claimed_at: null,
      })
      .eq("id", String(item.id));
  }
}

export async function scheduleTourReminders(
  supabase: AuthClient,
  leadId: string,
  tourScheduledAt: string
) {
  const tourDate = new Date(tourScheduledAt);
  const reminders: { event: CommunicationTriggerEvent; hoursBefore: number }[] = [
    { event: "tour_reminder_24h", hoursBefore: 24 },
    { event: "tour_reminder_2h", hoursBefore: 2 },
  ];

  const { data: lead } = await supabase
    .from("admissions_leads")
    .select("school_id")
    .eq("id", leadId)
    .single();

  if (!lead?.school_id) return;

  const templateSets = await Promise.all(
    reminders.map(({ event }) => getTemplatesForTrigger(supabase, lead.school_id, event))
  );

  type PendingRow = {
    lead_id: string;
    template_id: string;
    template_key: string;
    trigger_event: CommunicationTriggerEvent;
    channel: string;
    target: Date;
  };

  const pending: PendingRow[] = [];
  for (let i = 0; i < reminders.length; i++) {
    const { event, hoursBefore } = reminders[i];
    const templates = templateSets[i];
    for (const template of templates) {
      const target = new Date(tourDate.getTime() - hoursBefore * 60 * 60 * 1000);
      if (target <= new Date()) continue;
      pending.push({
        lead_id: leadId,
        template_id: template.id,
        template_key: template.template_key,
        trigger_event: event,
        channel: template.channel,
        target,
      });
    }
  }

  if (!pending.length) return;

  const adjusted = await adjustManyScheduledForBusinessHours(
    supabase,
    lead.school_id,
    pending.map((p) => p.target)
  );

  await supabase.from("admissions_communication_queue").insert(
    pending.map((row, index) => ({
      lead_id: row.lead_id,
      template_id: row.template_id,
      template_key: row.template_key,
      trigger_event: row.trigger_event,
      channel: row.channel,
      scheduled_for: adjusted[index].toISOString(),
      status: "pending",
    }))
  );
}

export async function scheduleApplicationIncompleteReminders(
  supabase: AuthClient,
  leadId: string,
  applicationId: string
) {
  const delays: CommunicationTriggerEvent[] = [
    "application_incomplete_3d",
    "application_incomplete_7d",
    "application_incomplete_14d",
  ];

  await Promise.all(
    delays.map((event) =>
      triggerCommunications(supabase, {
        leadId,
        applicationId,
        triggerEvent: event,
        sentBy: null,
      })
    )
  );
}
