import { programLabel } from "@/lib/constants/programs";
import { fundingSourceLabels } from "@/lib/constants/programs";
import type { MergeField } from "@/lib/admissions/communications/types";
import { resolvePublicAppOrigin } from "@/lib/platform/branding";
import { telHref } from "@/lib/format/contact";

export interface MergeContext {
  studentFirstName?: string | null;
  studentLastName?: string | null;
  preferredName?: string | null;
  guardianFirstName?: string | null;
  guardianLastName?: string | null;
  guardianEmail?: string | null;
  guardianPhone?: string | null;
  schoolName?: string | null;
  program?: string | null;
  campusName?: string | null;
  campusAddress?: string | null;
  fundingSources?: string[];
  fundingProgram?: string | null;
  applicationId?: string | null;
  leadId?: string | null;
  tourDatetime?: string | null;
  interviewDatetime?: string | null;
  /** Just the clock. See interview_time in types.ts. */
  interviewTime?: string | null;
  missingItems?: string[];
  missingDocuments?: string[];
  uploadedDocuments?: string[];
  awardAmount?: string | null;
  awardId?: string | null;
  stateStudentId?: string | null;
  rejectionReason?: string | null;
  customNotes?: string | null;
  deadline?: string | null;
  /**
   * The school's admissions contact, carried from `schools`.
   *
   * `schedulingUrl` is a public Google appointment-schedule link. Null is a
   * supported state and the caller picks a template that does not mention one —
   * see the note on `scheduling_link` below for why that matters.
   */
  admissionsContactName?: string | null;
  admissionsContactEmail?: string | null;
  /**
   * Every address to notify when an inquiry arrives. Distinct from
   * `admissionsContactEmail`, which is the one person who signs parent mail and
   * whose calendar is booked — see migration 327.
   */
  staffNotificationEmails?: readonly string[];
  schedulingUrl?: string | null;
  /**
   * Shadow-days booking link. Deliberately not the same as schedulingUrl: tours
   * and shadow days are different appointments with different lengths, and
   * sending a family to the wrong calendar at that point in the process is not a
   * small mistake.
   */
  shadowDaysUrl?: string | null;
  /** Minted per lead when a family is invited. Lets them apply with no account. */
  applicationToken?: string | null;
  /**
   * What the school leader wrote, for THIS family, about what their child's day
   * will look like. Captured when gate 2 is answered yes — the moment the
   * application arrives — and prefilled from the last one that school sent.
   *
   * Deliberately carries no label of its own in the template. An empty note has
   * to collapse to nothing; shadow_days_link already shows what happens
   * otherwise, mailing "You can book here: " with nothing after it.
   */
  shadowDaysNote?: string | null;
  /**
   * What has already been tried, for the one letter that asks a school leader
   * to pick up the telephone.
   *
   * ALREADY RENDERED FOR A READER, not ISO strings. The caller passes these
   * through appointmentTextForFamily, because `interview_datetime` below is a
   * passthrough and whatever a caller hands it is exactly what a human reads -
   * which is how three families were told the wrong hour on 1 October. Typing
   * these as strings puts the timezone decision at the one place that knows
   * the rule instead of hoping each caller remembers it.
   */
  inviteSentAt?: string | null;
  reminder1SentAt?: string | null;
  reminder2SentAt?: string | null;
  /**
   * What the family wrote about their child when they inquired. The one thing
   * that makes a cold telephone call easy to start.
   */
  inquiryNotes?: string | null;
  /**
   * The programs the family ticked on their inquiry, in the words they saw -
   * "Only Virtual", "In-Person", "Hybrid (in-person + virtual)".
   *
   * SEPARATE FROM `program`, which is the canonical code on the lead and is
   * null on every public inquiry by design. The two vocabularies do not
   * overlap and one of them is a list.
   */
  inquiryPrograms?: readonly string[] | null;
  /** Minted when the escalation is queued. Opens /call/<token>. */
  interestCallToken?: string | null;
  /**
   * Minted when the five-day application escalation is queued. Opens
   * /application-call/<token>, which is a DIFFERENT page from /call/<token>:
   * that one records what happened, this one re-sends the invitation or closes
   * the lead. Two tokens and two columns rather than one, because a family can
   * be chased for an interest meeting and then for an application, and the
   * second link must not quietly reopen the first page.
   */
  applicationCallToken?: string | null;
  /**
   * Minted when the inquiry arrives. Opens /send-interest-link/<token>, the
   * one-button page that sends the family their booking link.
   */
  interestLinkToken?: string | null;
  /**
   * The school's own From address. Not a merge field — nothing renders it into
   * a body — but it rides along here because this is the object the delivery
   * path already carries, and threading a parallel one would be two things to
   * keep in step instead of one.
   */
  fromEmail?: string | null;
}

function studentName(ctx: MergeContext): string {
  if (ctx.preferredName) return ctx.preferredName;
  return `${ctx.studentFirstName ?? ""} ${ctx.studentLastName ?? ""}`.trim() || "your student";
}

function parentName(ctx: MergeContext): string {
  const name = `${ctx.guardianFirstName ?? ""} ${ctx.guardianLastName ?? ""}`.trim();
  return name || "Family";
}

/**
 * A greeting wants a first name. Falls back through the full name to "there"
 * rather than to an empty string — "Hi ," is worse than slightly impersonal,
 * and an empty greeting is the kind of thing a parent notices and a test does
 * not.
 */
function guardianFirstName(ctx: MergeContext): string {
  return ctx.guardianFirstName?.trim() || parentName(ctx).split(" ")[0] || "there";
}

function studentFirstName(ctx: MergeContext): string {
  return (
    ctx.preferredName?.trim() ||
    ctx.studentFirstName?.trim() ||
    "your student"
  );
}

function portalLink(ctx: MergeContext): string {
  const base = resolvePublicAppOrigin();
  if (ctx.applicationId) return `${base}/apply/portal/${ctx.applicationId}`;
  return `${base}/apply/portal`;
}

/**
 * Where "You can begin here" actually goes.
 *
 * The token route opens the published campus form with no account. portalLink
 * remains the fallback for a lead with no token, and it redirects a parent to
 * /login - wrong for a family, and therefore a fault worth seeing rather than
 * hiding. Tokens are minted when the gate is answered, so the only way to
 * reach the fallback is an invitation sent by a path that forgot to mint one.
 */
function applicationLink(ctx: MergeContext): string {
  const token = ctx.applicationToken?.trim();
  if (token) return `${resolvePublicAppOrigin()}/apply/start/${token}`;
  return portalLink(ctx);
}

function uploadLink(ctx: MergeContext): string {
  return portalLink(ctx);
}

export function buildMergeValues(ctx: MergeContext): Record<MergeField, string> {
  return {
    student_name: studentName(ctx),
    parent_name: parentName(ctx),
    parent_email: ctx.guardianEmail ?? "",
    parent_phone: ctx.guardianPhone ?? "",
    // See the note in types.ts. Live templates used these names before they
    // existed as fields; the context has carried the values all along.
    guardian_first_name: guardianFirstName(ctx),
    student_first_name: studentFirstName(ctx),
    guardian_name: parentName(ctx),
    guardian_email: ctx.guardianEmail ?? "",
    guardian_phone: ctx.guardianPhone ?? "",
    // Same number, stripped to what a dialler will accept. See types.ts.
    parent_phone_dial: (telHref(ctx.guardianPhone) ?? "").replace(/^tel:/, ""),
    school_name: ctx.schoolName ?? "The Academy",
    program_name: programLabel(ctx.program),
    /*
       WHAT THEY TICKED, NOT WHAT THE LEAD SAYS. program_name above renders
       programLabel(lead.program), and lead.program is null on every inquiry
       that comes through the public form - submit.ts sets it so on purpose,
       because the form's answers are a list of labels and the column takes
       one code. programLabel returns the em dash for a null, which is how
       "Programme: —" reached Heather on every single inquiry.

       The fallback is a sentence rather than a dash. A dash looks like the
       letter is broken; a sentence says which of the two things happened,
       and this one is true whether the question was skipped or the read was
       refused - see fetchInquiryProgramsByLeadIds.
    */
    inquiry_programs: (ctx.inquiryPrograms ?? []).length
      ? [...(ctx.inquiryPrograms ?? [])].join(", ")
      : "not recorded on the inquiry",
    campus_name: ctx.campusName ?? "Main Campus",
    campus_address: ctx.campusAddress ?? "See portal for directions",
    parking_info: "Visitor parking is available at the main entrance.",
    funding_program: ctx.fundingProgram ?? "",
    funding_source: fundingSourceLabels(ctx.fundingSources).join(", ") || "—",
    portal_link: portalLink(ctx),
    application_link: applicationLink(ctx),
    upload_link: uploadLink(ctx),
    enrollment_link: portalLink(ctx),
    /**
     * Empty string rather than a placeholder when unset.
     *
     * `renderTemplate` leaves an *unknown* token in place as literal text, so a
     * template naming a field that does not exist mails a parent the characters
     * `{{scheduling_link}}`. A known field with no value at least renders as
     * nothing — but the real guard is upstream: the sender picks the no-link
     * template when the school has no booking URL, so this should never be
     * reached with an empty value on a link-bearing template.
     */
    scheduling_link: ctx.schedulingUrl ?? "",
    shadow_days_link: ctx.shadowDaysUrl ?? "",
    shadow_days_note: (ctx.shadowDaysNote ?? "").trim(),
    /*
       THE DECISION FOR THIS CHILD, NOT THE OLDEST ONE WAITING.
       
       This was a bare list URL. The template around it (migration 247) reads:
       
         {{student_name}} is waiting on your decision.
         Open JAG to review the family's information and answer:
         {{decisions_link}}
         The answer is recorded against your name, so please do not forward
         this email for someone else to action.
       
       So the email names a child, warns that the answer is attributed to the
       reader, and then opens a queue whose first row is whoever has been
       waiting longest. On 15 September a School Leader opened an email about
       Julian Oubre Towa and was shown a decision about Trisha Wilkerson - a
       3rd grader at a campus that is not even hers.
       
       The lead id is already in the merge context. Pointing at that child's own
       case makes the link agree with the sentence above it. The list remains
       the fallback for a template rendered without a lead, where a queue is at
       least honest about being a queue.
    */
    decisions_link: ctx.leadId
      ? `${resolvePublicAppOrigin()}/dashboard/admissions/cases/${ctx.leadId}?section=decisions`
      : `${resolvePublicAppOrigin()}/dashboard/admissions/decisions`,
    admissions_contact_name: ctx.admissionsContactName ?? "Admissions",
    admissions_contact_email: ctx.admissionsContactEmail ?? "",
    lead_link: ctx.leadId
      ? `${resolvePublicAppOrigin()}/dashboard/admissions/leads/${ctx.leadId}`
      : `${resolvePublicAppOrigin()}/dashboard/people`,
    tour_datetime: ctx.tourDatetime ?? "",
    interview_datetime: ctx.interviewDatetime ?? "",
    interview_time: ctx.interviewTime ?? "",
    missing_items: (ctx.missingItems ?? []).map((i) => `• ${i}`).join("\n") || "See portal for details",
    missing_documents: (ctx.missingDocuments ?? []).map((d) => `• ${d}`).join("\n") || "See portal",
    uploaded_documents: (ctx.uploadedDocuments ?? []).join(", ") || "",
    /*
       ATTACHMENT NOTE - either silent, or a whole sentence.
       
       `uploaded_documents` is a bare list, so a template that says
       "Attached: {{uploaded_documents}}" reads "Attached:" and nothing when a
       family sent no files. Templates have no conditionals, so the condition
       lives here: empty means empty, and otherwise the token carries its own
       label and full stop.
       
       This is what the staff inquiry notice was missing. Maddox Mixon, Ziare
       Moore and Alana Swan each attached a scholarship award letter on 14-15
       September, and each notification read exactly like one from a family who
       attached nothing. All three sat unopened for three days.
    */
    attachment_note: (ctx.uploadedDocuments ?? []).length
      ? `Attached: ${(ctx.uploadedDocuments ?? []).join(", ")}.`
      : "",
    /*
       "not recorded" rather than an empty line.

       These three sit under the headings "1st —", "2nd —", "3rd —" in the
       escalation letter. An empty value renders "2nd —" and nothing after it,
       which reads as though the system is unsure whether it sent the letter.
       It is not unsure: a blank here means the row is not in
       admissions_communications, which is itself worth a school leader seeing
       before she tells a family they were emailed three times.
    */
    invite_sent_at: ctx.inviteSentAt ?? "not recorded",
    reminder_1_sent_at: ctx.reminder1SentAt ?? "not recorded",
    reminder_2_sent_at: ctx.reminder2SentAt ?? "not recorded",
    inquiry_notes:
      (ctx.inquiryNotes ?? "").trim() ||
      "They did not write anything when they inquired.",
    /*
       THE FALLBACK IS THE CASE PAGE, NOT A BROKEN LINK.

       Same reasoning as applicationLink above: a lead with no token should
       land somewhere real. The case page needs a sign-in, which is wrong for
       a parent and perfectly fine for a school leader, who is the only person
       this letter is ever sent to.
    */
    call_link: ctx.interestCallToken?.trim()
      ? `${resolvePublicAppOrigin()}/call/${ctx.interestCallToken.trim()}`
      : ctx.leadId
        ? `${resolvePublicAppOrigin()}/dashboard/admissions/cases/${ctx.leadId}`
        : `${resolvePublicAppOrigin()}/dashboard/admissions/decisions`,
    /*
       THE FALLBACK IS THE CASE PAGE, for the same reason as call_link above:
       a lead with no token should land somewhere real, and the only person
       who ever reads this letter is a school leader who can sign in.
    */
    application_call_link: ctx.applicationCallToken?.trim()
      ? `${resolvePublicAppOrigin()}/application-call/${ctx.applicationCallToken.trim()}`
      : ctx.leadId
        ? `${resolvePublicAppOrigin()}/dashboard/admissions/cases/${ctx.leadId}`
        : `${resolvePublicAppOrigin()}/dashboard/admissions/decisions`,
    /*
       THE ONLY WAY THE FAMILY'S FIRST LETTER GOES OUT.
       A lead with no token falls back to the case page, which needs a sign-in
       - wrong for a parent, perfectly fine for the school leader who is the
       only person this ever reaches.
    */
    interest_link_action: ctx.interestLinkToken?.trim()
      ? `${resolvePublicAppOrigin()}/send-interest-link/${ctx.interestLinkToken.trim()}`
      : ctx.leadId
        ? `${resolvePublicAppOrigin()}/dashboard/admissions/cases/${ctx.leadId}`
        : `${resolvePublicAppOrigin()}/dashboard/admissions/decisions`,
    award_amount: ctx.awardAmount ?? "",
    award_id: ctx.awardId ?? "",
    state_student_id: ctx.stateStudentId ?? "",
    rejection_reason: ctx.rejectionReason ?? ctx.customNotes ?? "",
    next_steps: "Complete remaining checklist items in your Parent Portal.",
    requested_items: ctx.customNotes ?? (ctx.missingItems ?? []).join(", "),
    deadline: ctx.deadline ?? "Within 7 business days",
    decision_timeframe: "2–3 weeks",
    tuition_info: "Tuition details are available in your enrollment packet.",
    orientation_info: "Orientation details will be sent after enrollment is complete.",
    technology_info: "Technology setup instructions are in your enrollment packet.",
    waitlist_timeline: "We will update you monthly on waitlist status.",
    student_schedule: "Schedule available after enrollment is finalized.",
    teacher_assignment: "Teacher assignment pending enrollment completion.",
    first_day_info: "First day details will be sent before the start of school.",
    handbook_link: portalLink(ctx),
  };
}

export function renderTemplate(text: string, ctx: MergeContext): string {
  const values = buildMergeValues(ctx);
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return values[key as MergeField] ?? `{{${key}}}`;
  });
}
